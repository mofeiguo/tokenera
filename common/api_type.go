package common

import "github.com/QuantumNous/new-api/constant"

func ChannelType2APIType(channelType int) (int, bool) {
	apiType := -1
	switch channelType {
	case constant.ChannelTypeOpenAI:
		apiType = constant.APITypeOpenAI
	case constant.ChannelTypeAnthropic:
		apiType = constant.APITypeAnthropic
	case constant.ChannelTypeJimeng:
		apiType = constant.APITypeJimeng
	case constant.ChannelTypeBifrost:
		apiType = constant.APITypeBifrost
	}
	if apiType == -1 {
		return constant.APITypeOpenAI, false
	}
	return apiType, true
}

func SupportsResponsesCompact(channelType, apiType int) bool {
	return false
}
