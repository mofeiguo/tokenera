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

var group2model2channels map[string]map[string][]int // enabled channel
var model2channel2priority map[string]map[int]int64
var model2channel2weight map[string]map[int]int
var model2channel2upstream map[string]map[int]string
var channelsIDM map[int]*Channel // all channels include disabled
// channel2advancedCustomConfig caches parsed Advanced Custom (type 58) configs so
// path-aware selection avoids re-parsing JSON per request. Refreshed on full sync.
var channel2advancedCustomConfig map[int]*dto.AdvancedCustomConfig
var channelSyncLock sync.RWMutex

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
	newGroup2model2channels := make(map[string]map[string][]int)
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
		currentPriority, hasPriority := newModel2channel2priority[binding.ModelName][binding.ChannelId]
		if !hasPriority || binding.Priority > currentPriority ||
			(binding.Priority == currentPriority && weight > newModel2channel2weight[binding.ModelName][binding.ChannelId]) {
			newModel2channel2priority[binding.ModelName][binding.ChannelId] = binding.Priority
			newModel2channel2weight[binding.ModelName][binding.ChannelId] = weight
			newModel2channel2upstream[binding.ModelName][binding.ChannelId] = upstreamModel
		}
		for _, group := range servingGroupsFromRaw(channel.Group) {
			if _, ok := newGroup2model2channels[group]; !ok {
				newGroup2model2channels[group] = make(map[string][]int)
			}
			channels := newGroup2model2channels[group][binding.ModelName]
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
			newGroup2model2channels[group][binding.ModelName] = append(channels, binding.ChannelId)
		}
	}

	// sort by binding priority
	for group, model2channels := range newGroup2model2channels {
		for model, channels := range model2channels {
			sort.Slice(channels, func(i, j int) bool {
				return newModel2channel2priority[model][channels[i]] > newModel2channel2priority[model][channels[j]]
			})
			newGroup2model2channels[group][model] = channels
		}
	}

	channelSyncLock.Lock()
	group2model2channels = newGroup2model2channels
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

func lookupBindingPriority(model string, channelId int) int64 {
	if byChannel, ok := model2channel2priority[model]; ok {
		if priority, exists := byChannel[channelId]; exists {
			return priority
		}
	}
	normalized := ratio_setting.FormatMatchingModelName(model)
	if normalized != "" && normalized != model {
		if byChannel, ok := model2channel2priority[normalized]; ok {
			if priority, exists := byChannel[channelId]; exists {
				return priority
			}
		}
	}
	return 0
}

func lookupBindingWeight(model string, channelId int) int {
	if byChannel, ok := model2channel2weight[model]; ok {
		if weight, exists := byChannel[channelId]; exists {
			return weight
		}
	}
	normalized := ratio_setting.FormatMatchingModelName(model)
	if normalized != "" && normalized != model {
		if byChannel, ok := model2channel2weight[normalized]; ok {
			if weight, exists := byChannel[channelId]; exists {
				return weight
			}
		}
	}
	return 0
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

func GetRandomSatisfiedChannel(group string, model string, retry int, requestPath string) (*Channel, error) {
	// if memory cache is disabled, get channel directly from database
	if !common.MemoryCacheEnabled {
		return GetChannelFromBindings(group, model, retry, requestPath)
	}

	channelSyncLock.RLock()
	defer channelSyncLock.RUnlock()

	// First, try to find channels with the exact model name.
	channels := filterChannelsByRequestPathAndModel(group2model2channels[group][model], requestPath, model)

	// If no channels found, try to find channels with the normalized model name.
	if len(channels) == 0 {
		normalizedModel := ratio_setting.FormatMatchingModelName(model)
		channels = filterChannelsByRequestPathAndModel(group2model2channels[group][normalizedModel], requestPath, model)
	}

	if len(channels) == 0 {
		return nil, nil
	}

	if len(channels) == 1 {
		if channel, ok := channelsIDM[channels[0]]; ok {
			return channel, nil
		}
		return nil, fmt.Errorf("数据库一致性错误，渠道# %d 不存在，请联系管理员修复", channels[0])
	}

	uniquePriorities := make(map[int]bool)
	for _, channelId := range channels {
		if _, ok := channelsIDM[channelId]; !ok {
			return nil, fmt.Errorf("数据库一致性错误，渠道# %d 不存在，请联系管理员修复", channelId)
		}
		uniquePriorities[int(lookupBindingPriority(model, channelId))] = true
	}
	var sortedUniquePriorities []int
	for priority := range uniquePriorities {
		sortedUniquePriorities = append(sortedUniquePriorities, priority)
	}
	sort.Sort(sort.Reverse(sort.IntSlice(sortedUniquePriorities)))

	if retry >= len(uniquePriorities) {
		retry = len(uniquePriorities) - 1
	}
	targetPriority := int64(sortedUniquePriorities[retry])

	var sumWeight = 0
	var targetChannels []*Channel
	for _, channelId := range channels {
		channel, ok := channelsIDM[channelId]
		if !ok {
			return nil, fmt.Errorf("数据库一致性错误，渠道# %d 不存在，请联系管理员修复", channelId)
		}
		if lookupBindingPriority(model, channelId) == targetPriority {
			sumWeight += lookupBindingWeight(model, channelId)
			targetChannels = append(targetChannels, channel)
		}
	}

	if len(targetChannels) == 0 {
		return nil, errors.New(fmt.Sprintf("no channel found, group: %s, model: %s, priority: %d", group, model, targetPriority))
	}
	if sumWeight <= 0 {
		return targetChannels[rand.Intn(len(targetChannels))], nil
	}

	randomWeight := rand.Intn(sumWeight)
	for _, channel := range targetChannels {
		randomWeight -= lookupBindingWeight(model, channel.Id)
		if randomWeight < 0 {
			return channel, nil
		}
	}
	return targetChannels[len(targetChannels)-1], nil
}

// filterChannelsByRequestPathAndModel restricts candidates by request path and
// model. Only Advanced Custom (type 58) channels are path-checked: they are kept
// only when one of their configured routes matches requestPath and model. All
// other channel types always pass. When requestPath is empty, filtering is skipped.
// Caller must hold channelSyncLock (read lock). The cached slice is never mutated.
func filterChannelsByRequestPathAndModel(channels []int, requestPath string, model string) []int {
	if requestPath == "" || len(channels) == 0 {
		return channels
	}
	filtered := make([]int, 0, len(channels))
	for _, channelId := range channels {
		channel, ok := channelsIDM[channelId]
		if !ok {
			// keep it so the downstream consistency error is raised as before
			filtered = append(filtered, channelId)
			continue
		}
		if channel.Type != constant.ChannelTypeAdvancedCustom {
			filtered = append(filtered, channelId)
			continue
		}
		if config := channel2advancedCustomConfig[channelId]; config != nil && config.SupportsPathForModel(requestPath, model) {
			filtered = append(filtered, channelId)
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
		// delete the channel from group2model2channels
		for group, model2channels := range group2model2channels {
			for model, channels := range model2channels {
				for i, channelId := range channels {
					if channelId == id {
						// remove the channel from the slice
						group2model2channels[group][model] = append(channels[:i], channels[i+1:]...)
						break
					}
				}
			}
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
