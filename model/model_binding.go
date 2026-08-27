package model

import (
	"fmt"
	"sort"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type ModelBinding struct {
	Id            int    `json:"id"`
	ModelId       int    `json:"model_id" gorm:"not null;uniqueIndex:uk_model_channel_upstream,priority:1;index"`
	ChannelId     int    `json:"channel_id" gorm:"not null;uniqueIndex:uk_model_channel_upstream,priority:2;index"`
	UpstreamModel string `json:"upstream_model" gorm:"type:varchar(255);not null;uniqueIndex:uk_model_channel_upstream,priority:3"`
	Priority      int64  `json:"priority" gorm:"bigint;default:0;index"`
	Weight        int    `json:"weight" gorm:"default:0"`
	Enabled       bool   `json:"enabled" gorm:"index"`
	Deleted       bool   `json:"-" gorm:"index"`
	CreatedTime   int64  `json:"created_time" gorm:"bigint"`
	UpdatedTime   int64  `json:"updated_time" gorm:"bigint"`
	GroupsRaw     string `json:"-" gorm:"column:groups;type:varchar(512)"`

	ModelName     string `json:"model_name,omitempty" gorm:"->"`
	ChannelName   string `json:"channel_name,omitempty" gorm:"->"`
	ChannelType   int    `json:"channel_type,omitempty" gorm:"->"`
	ChannelStatus int    `json:"channel_status,omitempty" gorm:"->"`
}

type ModelBindingInput struct {
	ChannelId     int    `json:"channel_id"`
	UpstreamModel string `json:"upstream_model"`
	Priority      int64  `json:"priority"`
	Weight        int    `json:"weight"`
	Enabled       bool   `json:"enabled"`
}

func GetModelBindings(modelId int) ([]ModelBinding, error) {
	var bindings []ModelBinding
	err := DB.Table("model_bindings").
		Select("model_bindings.*, models.model_name AS model_name, channels.name AS channel_name, channels.type AS channel_type, channels.status AS channel_status").
		Joins("JOIN models ON models.id = model_bindings.model_id").
		Joins("JOIN channels ON channels.id = model_bindings.channel_id").
		Where("model_bindings.model_id = ? AND model_bindings.deleted = ?", modelId, false).
		Order("model_bindings.priority DESC, channels.id ASC").
		Scan(&bindings).Error
	if err != nil {
		return nil, err
	}
	return bindings, nil
}

func GetChannelModelBindings(channelId int) ([]ModelBinding, error) {
	var bindings []ModelBinding
	err := DB.Table("model_bindings").
		Select("model_bindings.*, models.model_name AS model_name, channels.name AS channel_name, channels.type AS channel_type, channels.status AS channel_status").
		Joins("JOIN models ON models.id = model_bindings.model_id").
		Joins("JOIN channels ON channels.id = model_bindings.channel_id").
		Where("model_bindings.channel_id = ? AND model_bindings.deleted = ?", channelId, false).
		Order("model_bindings.upstream_model ASC, models.model_name ASC").
		Scan(&bindings).Error
	if err != nil {
		return nil, err
	}
	return bindings, nil
}

func GetChannelBoundModelNames(channelIds []int) (map[int][]string, error) {
	result := make(map[int][]string, len(channelIds))
	if len(channelIds) == 0 {
		return result, nil
	}
	var rows []struct {
		ChannelId int
		ModelName string
	}
	err := DB.Table("model_bindings").
		Select("model_bindings.channel_id, models.model_name").
		Joins("JOIN models ON models.id = model_bindings.model_id").
		Where("model_bindings.channel_id IN ? AND model_bindings.deleted = ?", channelIds, false).
		Order("models.model_name ASC").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	for _, row := range rows {
		result[row.ChannelId] = append(result[row.ChannelId], row.ModelName)
	}
	return result, nil
}

func ReplaceModelBindings(modelId int, inputs []ModelBindingInput) error {
	var catalogModel Model
	if err := DB.First(&catalogModel, modelId).Error; err != nil {
		return err
	}
	if catalogModel.NameRule != NameRuleExact {
		return fmt.Errorf("only exact catalog models can have channel bindings")
	}

	normalized := make([]ModelBindingInput, 0, len(inputs))
	seenBindings := make(map[string]struct{}, len(inputs))
	channelIds := make([]int, 0, len(inputs))
	seenChannelIds := make(map[int]struct{}, len(inputs))
	for _, input := range inputs {
		if input.ChannelId <= 0 {
			return fmt.Errorf("channel_id must be positive")
		}
		input.UpstreamModel = strings.TrimSpace(input.UpstreamModel)
		if input.UpstreamModel == "" {
			input.UpstreamModel = catalogModel.ModelName
		}
		key := fmt.Sprintf("%d\n%s", input.ChannelId, input.UpstreamModel)
		if _, exists := seenBindings[key]; exists {
			return fmt.Errorf("channel %d upstream model %s is bound more than once", input.ChannelId, input.UpstreamModel)
		}
		seenBindings[key] = struct{}{}
		if _, exists := seenChannelIds[input.ChannelId]; !exists {
			seenChannelIds[input.ChannelId] = struct{}{}
			channelIds = append(channelIds, input.ChannelId)
		}
		if input.Weight < 0 {
			return fmt.Errorf("weight must be non-negative")
		}
		normalized = append(normalized, input)
	}
	allowedUpstreamByChannel := make(map[int]map[string]struct{}, len(channelIds))
	if len(channelIds) > 0 {
		var channels []Channel
		if err := DB.Select("id", "models").Where("id IN ?", channelIds).Find(&channels).Error; err != nil {
			return err
		}
		if len(channels) != len(channelIds) {
			return fmt.Errorf("one or more selected channels do not exist")
		}
		for _, channel := range channels {
			allowed := make(map[string]struct{})
			for _, modelName := range splitNormalizedList(channel.Models) {
				allowed[modelName] = struct{}{}
			}
			allowedUpstreamByChannel[channel.Id] = allowed
		}
	}
	for _, input := range normalized {
		if _, ok := allowedUpstreamByChannel[input.ChannelId][input.UpstreamModel]; !ok {
			return fmt.Errorf("upstream model %s is not in channel %d restricted models", input.UpstreamModel, input.ChannelId)
		}
	}

	now := common.GetTimestamp()
	err := DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&ModelBinding{}).Where("model_id = ?", modelId).Updates(map[string]any{
			"enabled":      false,
			"deleted":      true,
			"updated_time": now,
		}).Error; err != nil {
			return err
		}
		for _, input := range normalized {
			binding := ModelBinding{
				ModelId:       modelId,
				ChannelId:     input.ChannelId,
				UpstreamModel: input.UpstreamModel,
				Priority:      input.Priority,
				Weight:        input.Weight,
				Enabled:       input.Enabled,
				Deleted:       false,
				CreatedTime:   now,
				UpdatedTime:   now,
			}
			if err := tx.Clauses(clause.OnConflict{
				Columns: []clause.Column{
					{Name: "model_id"},
					{Name: "channel_id"},
					{Name: "upstream_model"},
				},
				DoUpdates: clause.Assignments(map[string]any{
					"priority":     input.Priority,
					"weight":       input.Weight,
					"enabled":      input.Enabled,
					"deleted":      false,
					"updated_time": now,
				}),
			}).Create(&binding).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err == nil {
		InitChannelCache()
		RefreshPricing()
	}
	return err
}

func EnsureModelBindingIndexes() error {
	migrator := DB.Migrator()
	if migrator.HasIndex(&ModelBinding{}, "uk_model_channel") {
		if err := migrator.DropIndex(&ModelBinding{}, "uk_model_channel"); err != nil {
			return err
		}
	}
	if !migrator.HasIndex(&ModelBinding{}, "uk_model_channel_upstream") {
		if err := migrator.CreateIndex(&ModelBinding{}, "uk_model_channel_upstream"); err != nil {
			return err
		}
	}
	return nil
}

func ResolveModelBindingUpstream(modelName string, channelId int) (string, bool) {
	return ResolveModelBindingUpstreamForGroup(modelName, channelId, "")
}

func ResolveModelBindingUpstreamForGroup(modelName string, channelId int, _ string) (string, bool) {
	channelSyncLock.RLock()
	if upstreamByChannel, ok := model2channel2upstream[modelName]; ok {
		upstreams, found := upstreamByChannel[channelId]
		channelSyncLock.RUnlock()
		if found {
			return pickUpstreamModel(upstreams)
		}
	} else {
		channelSyncLock.RUnlock()
	}

	loadUpstreams := func(name string) []string {
		var rows []struct {
			UpstreamModel string
		}
		err := DB.Table("model_bindings").
			Select("model_bindings.upstream_model").
			Joins("JOIN models ON models.id = model_bindings.model_id").
			Where("models.model_name = ? AND model_bindings.channel_id = ? AND model_bindings.enabled = ? AND model_bindings.deleted = ?", name, channelId, true, false).
			Find(&rows).Error
		if err != nil {
			return nil
		}
		upstreams := make([]string, 0, len(rows))
		for _, row := range rows {
			upstreams = append(upstreams, row.UpstreamModel)
		}
		return upstreams
	}
	if upstreams := loadUpstreams(modelName); len(upstreams) > 0 {
		return pickUpstreamModel(upstreams)
	}
	normalized := ratio_setting.FormatMatchingModelName(modelName)
	if normalized == "" || normalized == modelName {
		return "", false
	}
	return pickUpstreamModel(loadUpstreams(normalized))
}

func pickUpstreamModel(upstreams []string) (string, bool) {
	if len(upstreams) == 0 {
		return "", false
	}
	if len(upstreams) == 1 {
		return upstreams[0], true
	}
	return upstreams[common.GetRandomInt(len(upstreams))], true
}

type bindingChannelCandidate struct {
	Channel
	BindingPriority int64
	BindingWeight   int
}

func GetChannelFromBindings(group string, modelName string, retry int, requestPath string) (*Channel, error) {
	loadCandidates := func(name string) ([]bindingChannelCandidate, error) {
		var rows []struct {
			ChannelId int
			Priority  int64
			Weight    int
			Groups    string
		}
		err := DB.Table("model_bindings").
			Select("model_bindings.channel_id, model_bindings.priority, model_bindings.weight, channels."+commonGroupCol+" AS groups").
			Joins("JOIN models ON models.id = model_bindings.model_id").
			Joins("JOIN channels ON channels.id = model_bindings.channel_id").
			Where("models.model_name = ? AND model_bindings.enabled = ? AND model_bindings.deleted = ? AND channels.status = ?", name, true, false, common.ChannelStatusEnabled).
			Scan(&rows).Error
		if err != nil || len(rows) == 0 {
			return nil, err
		}
		channelIds := make([]int, 0, len(rows))
		priorityByChannel := make(map[int]int64, len(rows))
		weightByChannel := make(map[int]int, len(rows))
		for _, row := range rows {
			if !servingGroupsContain(row.Groups, group) {
				continue
			}
			weight := row.Weight
			if weight < 0 {
				weight = 0
			}
			currentPriority, exists := priorityByChannel[row.ChannelId]
			if exists && (currentPriority > row.Priority || (currentPriority == row.Priority && weightByChannel[row.ChannelId] >= weight)) {
				continue
			}
			if !exists {
				channelIds = append(channelIds, row.ChannelId)
			}
			priorityByChannel[row.ChannelId] = row.Priority
			weightByChannel[row.ChannelId] = weight
		}
		if len(channelIds) == 0 {
			return nil, nil
		}
		var channels []Channel
		if err := DB.Where("id IN ?", channelIds).Find(&channels).Error; err != nil {
			return nil, err
		}
		candidates := make([]bindingChannelCandidate, 0, len(channels))
		for i := range channels {
			candidates = append(candidates, bindingChannelCandidate{
				Channel:         channels[i],
				BindingPriority: priorityByChannel[channels[i].Id],
				BindingWeight:   weightByChannel[channels[i].Id],
			})
		}
		return candidates, nil
	}
	candidates, err := loadCandidates(modelName)
	if err != nil {
		return nil, err
	}
	if len(candidates) == 0 {
		normalized := ratio_setting.FormatMatchingModelName(modelName)
		if normalized != "" && normalized != modelName {
			candidates, err = loadCandidates(normalized)
			if err != nil {
				return nil, err
			}
		}
	}
	filtered := make([]bindingChannelCandidate, 0, len(candidates))
	for i := range candidates {
		if requestPath != "" && candidates[i].Type == constant.ChannelTypeAdvancedCustom {
			config := candidates[i].GetOtherSettings().AdvancedCustom
			if config == nil || !config.SupportsPathForModel(requestPath, modelName) {
				continue
			}
		}
		filtered = append(filtered, candidates[i])
	}
	if len(filtered) == 0 {
		return nil, nil
	}
	priorities := make([]int64, 0)
	seenPriorities := make(map[int64]struct{})
	for i := range filtered {
		priority := filtered[i].BindingPriority
		if _, exists := seenPriorities[priority]; exists {
			continue
		}
		seenPriorities[priority] = struct{}{}
		priorities = append(priorities, priority)
	}
	sort.Slice(priorities, func(i, j int) bool { return priorities[i] > priorities[j] })
	if retry >= len(priorities) {
		retry = len(priorities) - 1
	}
	targetPriority := priorities[retry]
	matched := make([]bindingChannelCandidate, 0, len(filtered))
	totalWeight := 0
	for i := range filtered {
		if filtered[i].BindingPriority != targetPriority {
			continue
		}
		matched = append(matched, filtered[i])
		totalWeight += filtered[i].BindingWeight
	}
	if totalWeight <= 0 {
		return &matched[common.GetRandomInt(len(matched))].Channel, nil
	}
	randomWeight := common.GetRandomInt(totalWeight)
	for i := range matched {
		randomWeight -= matched[i].BindingWeight
		if randomWeight < 0 {
			return &matched[i].Channel, nil
		}
	}
	return &matched[len(matched)-1].Channel, nil
}

func BackfillModelBindingGroupsFromChannels() error {
	var channels []Channel
	if err := DB.Select("id, " + commonGroupCol).Find(&channels).Error; err != nil {
		return err
	}
	for i := range channels {
		groups := strings.TrimSpace(channels[i].Group)
		if groups == "" {
			groups = "default"
		}
		if err := DB.Model(&ModelBinding{}).
			Where("channel_id = ?", channels[i].Id).
			Update("groups", groups).Error; err != nil {
			return err
		}
	}
	return nil
}

func BackfillModelBindingPrioritiesFromChannels() error {
	var channels []Channel
	if err := DB.Select("id", "priority").Find(&channels).Error; err != nil {
		return err
	}
	for i := range channels {
		if err := DB.Model(&ModelBinding{}).
			Where("channel_id = ?", channels[i].Id).
			Update("priority", channels[i].GetPriority()).Error; err != nil {
			return err
		}
	}
	return nil
}

func BackfillModelBindingWeightsFromChannels() error {
	var channels []Channel
	if err := DB.Select("id", "weight").Find(&channels).Error; err != nil {
		return err
	}
	for i := range channels {
		if err := DB.Model(&ModelBinding{}).
			Where("channel_id = ?", channels[i].Id).
			Update("weight", channels[i].GetWeight()).Error; err != nil {
			return err
		}
	}
	return nil
}

func splitNormalizedList(raw string) []string {
	parts := strings.Split(raw, ",")
	result := make([]string, 0, len(parts))
	seen := make(map[string]struct{}, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		if _, exists := seen[part]; exists {
			continue
		}
		seen[part] = struct{}{}
		result = append(result, part)
	}
	sort.Strings(result)
	return result
}

const DefaultServingGroup = "default"

func servingGroupsFromRaw(raw string) []string {
	groups := splitNormalizedList(raw)
	if len(groups) == 0 {
		return []string{DefaultServingGroup}
	}
	return groups
}

func servingGroupsContain(raw string, group string) bool {
	group = strings.TrimSpace(group)
	if group == "" {
		group = DefaultServingGroup
	}
	for _, value := range servingGroupsFromRaw(raw) {
		if value == group {
			return true
		}
	}
	return false
}
