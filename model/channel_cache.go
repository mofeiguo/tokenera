package model

import (
	"errors"
	"fmt"
	"math/rand"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
)

var model2channels map[string][]int // enabled channel ids by catalog model
var model2routes map[string][]modelBindingRoute
var model2channel2priority map[string]map[int]int64
var model2channel2weight map[string]map[int]int
var model2channel2upstream map[string]map[int]string
var channelsIDM map[int]*Channel // all channels include disabled
// channel2advancedCustomConfig caches parsed Advanced Custom (type 58) configs so
// path-aware selection avoids re-parsing JSON per request. Refreshed on full sync.
var channel2advancedCustomConfig map[int]*dto.AdvancedCustomConfig
var channelSyncLock sync.RWMutex

type modelBindingRoute struct {
	ChannelId int
	Upstream  string
	Priority  int64
	Weight    int
}

func InitChannelCache() {
	if !common.MemoryCacheEnabled {
		InvalidatePricingCache()
		return
	}
	newChannelId2channel := make(map[int]*Channel)
	newChannel2advancedCustomConfig := make(map[int]*dto.AdvancedCustomConfig)
	var channels []*Channel
	DB.Find(&channels)
	for _, channel := range channels {
		newChannelId2channel[channel.Id] = channel
		if channel.Type == constant.ChannelTypeAdvancedCustom {
			if config := channel.GetOtherSettings().AdvancedCustom; config != nil {
				newChannel2advancedCustomConfig[channel.Id] = config
			}
		}
	}
	newModel2channels := make(map[string][]int)
	newModel2routes := make(map[string][]modelBindingRoute)
	newModel2channel2priority := make(map[string]map[int]int64)
	newModel2channel2weight := make(map[string]map[int]int)
	newModel2channel2upstream := make(map[string]map[int]string)
	var bindings []struct {
		ModelName     string
		ChannelId     int
		Priority      int64
		Weight        int
		Enabled       bool
		UpstreamModel string
	}
	DB.Table("model_bindings").
		Select("models.model_name, model_bindings.channel_id, model_bindings.priority, model_bindings.weight, model_bindings.enabled, model_bindings.upstream_model").
		Joins("JOIN models ON models.id = model_bindings.model_id").
		Where("model_bindings.deleted = ?", false).
		Scan(&bindings)
	for _, binding := range bindings {
		channel, exists := newChannelId2channel[binding.ChannelId]
		if !exists || !binding.Enabled || channel.Status != common.ChannelStatusEnabled {
			continue
		}
		if _, ok := newModel2channel2priority[binding.ModelName]; !ok {
			newModel2channel2priority[binding.ModelName] = make(map[int]int64)
		}
		if _, ok := newModel2channel2weight[binding.ModelName]; !ok {
			newModel2channel2weight[binding.ModelName] = make(map[int]int)
		}
		if _, ok := newModel2channel2upstream[binding.ModelName]; !ok {
			newModel2channel2upstream[binding.ModelName] = make(map[int]string)
		}
		weight := binding.Weight
		if weight < 0 {
			weight = 0
		}
		upstreamModel := strings.TrimSpace(binding.UpstreamModel)
		if upstreamModel == "" {
			upstreamModel = binding.ModelName
		}
		newModel2routes[binding.ModelName] = append(newModel2routes[binding.ModelName], modelBindingRoute{
			ChannelId: binding.ChannelId,
			Upstream:  upstreamModel,
			Priority:  binding.Priority,
			Weight:    weight,
		})
		currentPriority, hasPriority := newModel2channel2priority[binding.ModelName][binding.ChannelId]
		if !hasPriority || binding.Priority > currentPriority ||
			(binding.Priority == currentPriority && weight > newModel2channel2weight[binding.ModelName][binding.ChannelId]) {
			newModel2channel2priority[binding.ModelName][binding.ChannelId] = binding.Priority
			newModel2channel2weight[binding.ModelName][binding.ChannelId] = weight
			newModel2channel2upstream[binding.ModelName][binding.ChannelId] = upstreamModel
		}
		channels := newModel2channels[binding.ModelName]
		alreadyLinked := false
		for _, channelId := range channels {
			if channelId == binding.ChannelId {
				alreadyLinked = true
				break
			}
		}
		if alreadyLinked {
			continue
		}
		newModel2channels[binding.ModelName] = append(channels, binding.ChannelId)
	}

	for model, channels := range newModel2channels {
		sort.Slice(channels, func(i, j int) bool {
			return newModel2channel2priority[model][channels[i]] > newModel2channel2priority[model][channels[j]]
		})
		newModel2channels[model] = channels
	}

	channelSyncLock.Lock()
	model2channels = newModel2channels
	model2routes = newModel2routes
	model2channel2priority = newModel2channel2priority
	model2channel2weight = newModel2channel2weight
	model2channel2upstream = newModel2channel2upstream
	//channelsIDM = newChannelId2channel
	for i, channel := range newChannelId2channel {
		if channel.ChannelInfo.IsMultiKey {
			channel.Keys = channel.GetKeys()
			if channel.ChannelInfo.MultiKeyMode == constant.MultiKeyModePolling {
				if oldChannel, ok := channelsIDM[i]; ok {
					// 存在旧的渠道，如果是多key且轮询，保留轮询索引信息
					if oldChannel.ChannelInfo.IsMultiKey && oldChannel.ChannelInfo.MultiKeyMode == constant.MultiKeyModePolling {
						channel.ChannelInfo.MultiKeyPollingIndex = oldChannel.ChannelInfo.MultiKeyPollingIndex
					}
				}
			}
		}
	}
	channelsIDM = newChannelId2channel
	channel2advancedCustomConfig = newChannel2advancedCustomConfig
	channelSyncLock.Unlock()
	// Release channelSyncLock before InvalidatePricingCache so channel lookups
	// are not blocked while waiting for updatePricingLock.
	InvalidatePricingCache()
	common.SysLog("channels synced from database")
}

func SyncChannelCache(frequency int) {
	for {
		time.Sleep(time.Duration(frequency) * time.Second)
		common.SysLog("syncing channels from database")
		InitChannelCache()
	}
}

func lookupBindingUpstreamModel(model string, channelId int) string {
	if byChannel, ok := model2channel2upstream[model]; ok {
		if name := strings.TrimSpace(byChannel[channelId]); name != "" {
			return name
		}
	}
	normalized := ratio_setting.FormatMatchingModelName(model)
	if normalized != "" && normalized != model {
		if byChannel, ok := model2channel2upstream[normalized]; ok {
			if name := strings.TrimSpace(byChannel[channelId]); name != "" {
				return name
			}
		}
	}
	return ""
}

func GetRandomSatisfiedChannel(model string, retry int, requestPath string) (*Channel, string, error) {
	if !common.MemoryCacheEnabled {
		return GetChannelFromBindings(model, retry, requestPath)
	}

	channelSyncLock.RLock()
	defer channelSyncLock.RUnlock()

	routes := filterRoutesByRequestPathAndModel(model2routes[model], requestPath, model)
	if len(routes) == 0 {
		normalizedModel := ratio_setting.FormatMatchingModelName(model)
		routes = filterRoutesByRequestPathAndModel(model2routes[normalizedModel], requestPath, model)
	}

	if len(routes) == 0 {
		return nil, "", nil
	}

	uniquePriorities := make(map[int64]struct{})
	for _, route := range routes {
		if _, ok := channelsIDM[route.ChannelId]; !ok {
			return nil, "", fmt.Errorf("数据库一致性错误，渠道# %d 不存在，请联系管理员修复", route.ChannelId)
		}
		uniquePriorities[route.Priority] = struct{}{}
	}
	sortedUniquePriorities := make([]int64, 0, len(uniquePriorities))
	for priority := range uniquePriorities {
		sortedUniquePriorities = append(sortedUniquePriorities, priority)
	}
	sort.Slice(sortedUniquePriorities, func(i, j int) bool {
		return sortedUniquePriorities[i] > sortedUniquePriorities[j]
	})

	if retry >= len(sortedUniquePriorities) {
		retry = len(sortedUniquePriorities) - 1
	}
	targetPriority := sortedUniquePriorities[retry]

	sumWeight := 0
	matched := make([]modelBindingRoute, 0, len(routes))
	for _, route := range routes {
		if route.Priority != targetPriority {
			continue
		}
		sumWeight += route.Weight
		matched = append(matched, route)
	}

	if len(matched) == 0 {
		return nil, "", errors.New(fmt.Sprintf("no channel found, model: %s, priority: %d", model, targetPriority))
	}

	var picked modelBindingRoute
	if sumWeight <= 0 {
		picked = matched[rand.Intn(len(matched))]
	} else {
		randomWeight := rand.Intn(sumWeight)
		picked = matched[len(matched)-1]
		for _, route := range matched {
			randomWeight -= route.Weight
			if randomWeight < 0 {
				picked = route
				break
			}
		}
	}
	channel, ok := channelsIDM[picked.ChannelId]
	if !ok {
		return nil, "", fmt.Errorf("数据库一致性错误，渠道# %d 不存在，请联系管理员修复", picked.ChannelId)
	}
	return channel, picked.Upstream, nil
}

func filterRoutesByRequestPathAndModel(routes []modelBindingRoute, requestPath string, model string) []modelBindingRoute {
	if requestPath == "" || len(routes) == 0 {
		return routes
	}
	filtered := make([]modelBindingRoute, 0, len(routes))
	for _, route := range routes {
		channel, ok := channelsIDM[route.ChannelId]
		if !ok {
			filtered = append(filtered, route)
			continue
		}
		if channel.Type != constant.ChannelTypeAdvancedCustom {
			filtered = append(filtered, route)
			continue
		}
		if config := channel2advancedCustomConfig[route.ChannelId]; config != nil && config.SupportsPathForModel(requestPath, model) {
			filtered = append(filtered, route)
		}
	}
	return filtered
}

func CacheGetChannel(id int) (*Channel, error) {
	if !common.MemoryCacheEnabled {
		return GetChannelById(id, true)
	}
	channelSyncLock.RLock()
	defer channelSyncLock.RUnlock()

	c, ok := channelsIDM[id]
	if !ok {
		return nil, fmt.Errorf("渠道# %d，已不存在", id)
	}
	return c, nil
}

func CacheGetChannelInfo(id int) (*ChannelInfo, error) {
	if !common.MemoryCacheEnabled {
		channel, err := GetChannelById(id, true)
		if err != nil {
			return nil, err
		}
		return &channel.ChannelInfo, nil
	}
	channelSyncLock.RLock()
	defer channelSyncLock.RUnlock()

	c, ok := channelsIDM[id]
	if !ok {
		return nil, fmt.Errorf("渠道# %d，已不存在", id)
	}
	return &c.ChannelInfo, nil
}

func CacheUpdateChannelStatus(id int, status int) {
	if !common.MemoryCacheEnabled {
		return
	}
	channelSyncLock.Lock()
	defer channelSyncLock.Unlock()
	if channel, ok := channelsIDM[id]; ok {
		channel.Status = status
	}
	if status != common.ChannelStatusEnabled {
		for model, channels := range model2channels {
			for i, channelId := range channels {
				if channelId == id {
					model2channels[model] = append(channels[:i], channels[i+1:]...)
					break
				}
			}
		}
		for model, routes := range model2routes {
			kept := routes[:0]
			for _, route := range routes {
				if route.ChannelId != id {
					kept = append(kept, route)
				}
			}
			model2routes[model] = kept
		}
	}
}

func CacheUpdateChannel(channel *Channel) {
	if !common.MemoryCacheEnabled {
		return
	}
	channelSyncLock.Lock()
	if channel == nil {
		channelSyncLock.Unlock()
		return
	}

	if channelsIDM == nil {
		channelsIDM = make(map[int]*Channel)
	}
	if oldChannel, ok := channelsIDM[channel.Id]; ok {
		logger.LogDebug(nil, "CacheUpdateChannel before: id=%d, name=%s, status=%d, polling_index=%d", channel.Id, channel.Name, channel.Status, oldChannel.ChannelInfo.MultiKeyPollingIndex)
	}
	channelsIDM[channel.Id] = channel
	if channel2advancedCustomConfig == nil {
		channel2advancedCustomConfig = make(map[int]*dto.AdvancedCustomConfig)
	}
	delete(channel2advancedCustomConfig, channel.Id)
	if channel.Type == constant.ChannelTypeAdvancedCustom {
		if config := channel.GetOtherSettings().AdvancedCustom; config != nil {
			channel2advancedCustomConfig[channel.Id] = config
		}
	}
	logger.LogDebug(nil, "CacheUpdateChannel after: id=%d, name=%s, status=%d, polling_index=%d", channel.Id, channel.Name, channel.Status, channel.ChannelInfo.MultiKeyPollingIndex)
	// Release channelSyncLock before InvalidatePricingCache so channel lookups
	// are not blocked while waiting for updatePricingLock.
	channelSyncLock.Unlock()
	InvalidatePricingCache()
}
