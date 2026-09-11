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
	Priority      int64  `json:"priority" gorm:"bigint;default:0;index"`
	Weight        int    `json:"weight" gorm:"default:0"`
	Enabled       bool   `json:"enabled" gorm:"index"`
	UpstreamModel string `json:"upstream_model" gorm:"size:128;column:upstream_model;uniqueIndex:uk_model_channel_upstream,priority:3"`
	Deleted       bool   `json:"-" gorm:"index"`
	CreatedTime   int64  `json:"created_time" gorm:"bigint"`
	UpdatedTime   int64  `json:"updated_time" gorm:"bigint"`

	ModelName     string `json:"model_name,omitempty" gorm:"->"`
	ChannelName   string `json:"channel_name,omitempty" gorm:"->"`
	ChannelType   int    `json:"channel_type,omitempty" gorm:"->"`
	ChannelStatus int    `json:"channel_status,omitempty" gorm:"->"`
}

type ModelBindingInput struct {
	ChannelId     int    `json:"channel_id"`
	Priority      int64  `json:"priority"`
	Weight        int    `json:"weight"`
	Enabled       bool   `json:"enabled"`
	UpstreamModel string `json:"upstream_model"`
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
		Order("models.model_name ASC").
		Scan(&bindings).Error
	if err != nil {
		return nil, err
	}
	return bindings, nil
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
	uniqueChannelIds := make([]int, 0, len(inputs))
	seenChannelIds := make(map[int]struct{}, len(inputs))
	for _, input := range inputs {
		if input.ChannelId <= 0 {
			return fmt.Errorf("channel_id must be positive")
		}
		if input.Weight < 0 {
			return fmt.Errorf("weight must be non-negative")
		}
		upstreamModel := strings.TrimSpace(input.UpstreamModel)
		if upstreamModel == "" {
			upstreamModel = catalogModel.ModelName
		}
		input.UpstreamModel = upstreamModel
		bindingKey := fmt.Sprintf("%d\n%s", input.ChannelId, upstreamModel)
		if _, exists := seenBindings[bindingKey]; exists {
			return fmt.Errorf("channel %d model %s is bound more than once", input.ChannelId, upstreamModel)
		}
		seenBindings[bindingKey] = struct{}{}
		if _, exists := seenChannelIds[input.ChannelId]; !exists {
			seenChannelIds[input.ChannelId] = struct{}{}
			uniqueChannelIds = append(uniqueChannelIds, input.ChannelId)
		}
		normalized = append(normalized, input)
	}
	allowedModelsByChannel := make(map[int]map[string]struct{}, len(uniqueChannelIds))
	if len(uniqueChannelIds) > 0 {
		var channels []Channel
		if err := DB.Select("id", "models").Where("id IN ?", uniqueChannelIds).Find(&channels).Error; err != nil {
			return err
		}
		if len(channels) != len(uniqueChannelIds) {
			return fmt.Errorf("one or more selected channels do not exist")
		}
		for _, channel := range channels {
			allowed := make(map[string]struct{})
			for _, modelName := range splitNormalizedList(channel.Models) {
				allowed[modelName] = struct{}{}
			}
			allowedModelsByChannel[channel.Id] = allowed
		}
	}
	for _, input := range normalized {
		if _, ok := allowedModelsByChannel[input.ChannelId][input.UpstreamModel]; !ok {
			return fmt.Errorf("model %s is not in channel %d restricted models", input.UpstreamModel, input.ChannelId)
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
				Priority:      input.Priority,
				Weight:        input.Weight,
				Enabled:       input.Enabled,
				UpstreamModel: input.UpstreamModel,
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
					"priority":       input.Priority,
					"weight":         input.Weight,
					"enabled":        input.Enabled,
					"upstream_model": input.UpstreamModel,
					"deleted":        false,
					"updated_time":   now,
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

func GetBindingUpstreamModel(catalogModel string, channelId int) string {
	catalogModel = strings.TrimSpace(catalogModel)
	if catalogModel == "" || channelId <= 0 {
		return catalogModel
	}
	if common.MemoryCacheEnabled {
		channelSyncLock.RLock()
		name := lookupBindingUpstreamModel(catalogModel, channelId)
		channelSyncLock.RUnlock()
		if name != "" {
			return name
		}
		return catalogModel
	}
	return getBindingUpstreamModelFromDB(catalogModel, channelId)
}

func getBindingUpstreamModelFromDB(catalogModel string, channelId int) string {
	var row struct {
		UpstreamModel string
		ModelName     string
	}
	err := DB.Table("model_bindings").
		Select("model_bindings.upstream_model, models.model_name").
		Joins("JOIN models ON models.id = model_bindings.model_id").
		Where("models.model_name = ? AND model_bindings.channel_id = ? AND model_bindings.enabled = ? AND model_bindings.deleted = ?", catalogModel, channelId, true, false).
		Order("model_bindings.priority DESC, model_bindings.weight DESC, model_bindings.id ASC").
		Limit(1).
		Scan(&row).Error
	if err != nil {
		return catalogModel
	}
	if strings.TrimSpace(row.UpstreamModel) != "" {
		return strings.TrimSpace(row.UpstreamModel)
	}
	if row.ModelName != "" {
		return row.ModelName
	}
	return catalogModel
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

type bindingChannelCandidate struct {
	Channel
	BindingPriority int64
	BindingWeight   int
	UpstreamModel   string
}

func GetChannelFromBindings(modelName string, retry int, requestPath string) (*Channel, string, error) {
	loadCandidates := func(name string) ([]bindingChannelCandidate, error) {
		var rows []struct {
			ChannelId     int
			Priority      int64
			Weight        int
			UpstreamModel string
		}
		err := DB.Table("model_bindings").
			Select("model_bindings.channel_id, model_bindings.priority, model_bindings.weight, model_bindings.upstream_model").
			Joins("JOIN models ON models.id = model_bindings.model_id").
			Joins("JOIN channels ON channels.id = model_bindings.channel_id").
			Where("models.model_name = ? AND model_bindings.enabled = ? AND model_bindings.deleted = ? AND channels.status = ?", name, true, false, common.ChannelStatusEnabled).
			Scan(&rows).Error
		if err != nil || len(rows) == 0 {
			return nil, err
		}
		channelIds := make([]int, 0, len(rows))
		seenChannelIds := make(map[int]struct{}, len(rows))
		for _, row := range rows {
			if _, exists := seenChannelIds[row.ChannelId]; exists {
				continue
			}
			seenChannelIds[row.ChannelId] = struct{}{}
			channelIds = append(channelIds, row.ChannelId)
		}
		if len(channelIds) == 0 {
			return nil, nil
		}
		var channels []Channel
		if err := DB.Where("id IN ?", channelIds).Find(&channels).Error; err != nil {
			return nil, err
		}
		channelById := make(map[int]Channel, len(channels))
		for i := range channels {
			channelById[channels[i].Id] = channels[i]
		}
		candidates := make([]bindingChannelCandidate, 0, len(rows))
		for _, row := range rows {
			channel, ok := channelById[row.ChannelId]
			if !ok {
				continue
			}
			weight := row.Weight
			if weight < 0 {
				weight = 0
			}
			upstreamModel := strings.TrimSpace(row.UpstreamModel)
			if upstreamModel == "" {
				upstreamModel = name
			}
			candidates = append(candidates, bindingChannelCandidate{
				Channel:         channel,
				BindingPriority: row.Priority,
				BindingWeight:   weight,
				UpstreamModel:   upstreamModel,
			})
		}
		return candidates, nil
	}
	candidates, err := loadCandidates(modelName)
	if err != nil {
		return nil, "", err
	}
	if len(candidates) == 0 {
		normalized := ratio_setting.FormatMatchingModelName(modelName)
		if normalized != "" && normalized != modelName {
			candidates, err = loadCandidates(normalized)
			if err != nil {
				return nil, "", err
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
		return nil, "", nil
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
		picked := matched[common.GetRandomInt(len(matched))]
		return &picked.Channel, picked.UpstreamModel, nil
	}
	randomWeight := common.GetRandomInt(totalWeight)
	for i := range matched {
		randomWeight -= matched[i].BindingWeight
		if randomWeight < 0 {
			return &matched[i].Channel, matched[i].UpstreamModel, nil
		}
	}
	last := matched[len(matched)-1]
	return &last.Channel, last.UpstreamModel, nil
}

func BackfillModelBindingPrioritiesFromChannels() error {
	if !hasDBColumn("channels", "priority") {
		return nil
	}
	var channels []struct {
		Id       int
		Priority *int64
	}
	if err := DB.Table("channels").Select("id", "priority").Find(&channels).Error; err != nil {
		return err
	}
	for i := range channels {
		priority := int64(0)
		if channels[i].Priority != nil {
			priority = *channels[i].Priority
		}
		if err := DB.Model(&ModelBinding{}).
			Where("channel_id = ?", channels[i].Id).
			Update("priority", priority).Error; err != nil {
			return err
		}
	}
	return nil
}

func BackfillModelBindingWeightsFromChannels() error {
	if !hasDBColumn("channels", "weight") {
		return nil
	}
	var channels []struct {
		Id     int
		Weight *uint
	}
	if err := DB.Table("channels").Select("id", "weight").Find(&channels).Error; err != nil {
		return err
	}
	for i := range channels {
		weight := 0
		if channels[i].Weight != nil {
			weight = int(*channels[i].Weight)
		}
		if err := DB.Model(&ModelBinding{}).
			Where("channel_id = ?", channels[i].Id).
			Update("weight", weight).Error; err != nil {
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
