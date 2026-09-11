package model

import (
	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
)

func IsChannelEnabledForModel(modelName string, channelID int) bool {
	if modelName == "" || channelID <= 0 {
		return false
	}
	if !common.MemoryCacheEnabled {
		return isChannelEnabledForModelDB(modelName, channelID)
	}

	channelSyncLock.RLock()
	defer channelSyncLock.RUnlock()

	if model2channels == nil {
		return false
	}

	if isChannelIDInList(model2channels[modelName], channelID) {
		return true
	}
	normalized := ratio_setting.FormatMatchingModelName(modelName)
	if normalized != "" && normalized != modelName {
		return isChannelIDInList(model2channels[normalized], channelID)
	}
	return false
}

func isChannelEnabledForModelDB(modelName string, channelID int) bool {
	check := func(name string) bool {
		var count int64
		err := DB.Table("model_bindings").
			Joins("JOIN models ON models.id = model_bindings.model_id").
			Joins("JOIN channels ON channels.id = model_bindings.channel_id").
			Where("models.model_name = ? AND model_bindings.channel_id = ? AND model_bindings.enabled = ? AND model_bindings.deleted = ? AND channels.status = ?",
				name, channelID, true, false, common.ChannelStatusEnabled).
			Count(&count).Error
		return err == nil && count > 0
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
