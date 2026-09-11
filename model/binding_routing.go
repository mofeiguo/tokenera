package model

import (
	"fmt"

	"github.com/QuantumNous/new-api/common"
)

type BindingWithChannel struct {
	Model       string
	ChannelId   int
	ChannelType int
	Enabled     bool
	Priority    *int64
	Weight      int
}

func GetEnabledBindingsWithChannels() ([]BindingWithChannel, error) {
	var rows []struct {
		ModelName   string
		ChannelId   int
		ChannelType int
		Priority    *int64
		Weight      int
	}
	err := DB.Table("model_bindings").
		Select("models.model_name, model_bindings.channel_id, channels.type AS channel_type, model_bindings.priority, model_bindings.weight").
		Joins("JOIN models ON models.id = model_bindings.model_id").
		Joins("JOIN channels ON channels.id = model_bindings.channel_id").
		Where("model_bindings.enabled = ? AND model_bindings.deleted = ? AND channels.status = ?", true, false, common.ChannelStatusEnabled).
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	bindings := make([]BindingWithChannel, 0, len(rows))
	seen := make(map[string]struct{}, len(rows))
	for _, row := range rows {
		key := fmt.Sprintf("%s:%d", row.ModelName, row.ChannelId)
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		bindings = append(bindings, BindingWithChannel{
			Model:       row.ModelName,
			ChannelId:   row.ChannelId,
			ChannelType: row.ChannelType,
			Enabled:     true,
			Priority:    row.Priority,
			Weight:      row.Weight,
		})
	}
	return bindings, nil
}

func GetEnabledModels() []string {
	bindings, err := GetEnabledBindingsWithChannels()
	if err != nil {
		common.SysLog(fmt.Sprintf("GetEnabledModels error: %v", err))
		return []string{}
	}
	seen := make(map[string]struct{})
	models := make([]string, 0)
	for _, binding := range bindings {
		if _, ok := seen[binding.Model]; ok {
			continue
		}
		seen[binding.Model] = struct{}{}
		models = append(models, binding.Model)
	}
	return models
}
