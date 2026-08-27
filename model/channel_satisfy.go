package model

import (
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
)

func IsChannelEnabledForGroupModel(group string, modelName string, channelID int) bool {
	if modelName == "" || channelID <= 0 {
		return false
	}
	if strings.TrimSpace(group) == "" {
		group = DefaultServingGroup
	}
	if !common.MemoryCacheEnabled {
		return isChannelEnabledForGroupModelDB(group, modelName, channelID)
	}

	channelSyncLock.RLock()
	defer channelSyncLock.RUnlock()

	if group2model2channels == nil {
		return false
	}

	if isChannelIDInList(group2model2channels[group][modelName], channelID) {
		return true
	}
	normalized := ratio_setting.FormatMatchingModelName(modelName)
	if normalized != "" && normalized != modelName {
		return isChannelIDInList(group2model2channels[group][normalized], channelID)
	}
	return false
}

func IsChannelEnabledForAnyGroupModel(groups []string, modelName string, channelID int) bool {
	if len(groups) == 0 {
		return false
	}
	for _, g := range groups {
		if IsChannelEnabledForGroupModel(g, modelName, channelID) {
			return true
		}
	}
	return false
}

func isChannelEnabledForGroupModelDB(group string, modelName string, channelID int) bool {
	check := func(name string) bool {
		var rows []struct {
			Groups string
		}
		err := DB.Table("model_bindings").
			Select("channels."+commonGroupCol+" AS groups").
			Joins("JOIN models ON models.id = model_bindings.model_id").
			Joins("JOIN channels ON channels.id = model_bindings.channel_id").
			Where("models.model_name = ? AND model_bindings.channel_id = ? AND model_bindings.enabled = ? AND model_bindings.deleted = ? AND channels.status = ?",
				name, channelID, true, false, common.ChannelStatusEnabled).
			Scan(&rows).Error
		if err != nil {
			return false
		}
		for _, row := range rows {
			if servingGroupsContain(row.Groups, group) {
				return true
			}
		}
		return false
	}
	if check(modelName) {
		return true
	}
	normalized := ratio_setting.FormatMatchingModelName(modelName)
	return normalized != "" && normalized != modelName && check(normalized)
}

func isChannelIDInList(list []int, channelID int) bool {
	for _, id := range list {
		if id == channelID {
			return true
		}
	}
	return false
}
