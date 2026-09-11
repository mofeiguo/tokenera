package relay

import (
	"strconv"

	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/relay/channel"
	bifrostrelay "github.com/QuantumNous/new-api/relay/channel/bifrost"
	"github.com/QuantumNous/new-api/relay/channel/claude"
	"github.com/QuantumNous/new-api/relay/channel/gemini"
	"github.com/QuantumNous/new-api/relay/channel/jimeng"
	"github.com/QuantumNous/new-api/relay/channel/openai"
	taskali "github.com/QuantumNous/new-api/relay/channel/task/ali"
	taskdoubao "github.com/QuantumNous/new-api/relay/channel/task/doubao"
	"github.com/QuantumNous/new-api/relay/channel/task/hailuo"
	taskjimeng "github.com/QuantumNous/new-api/relay/channel/task/jimeng"
	"github.com/QuantumNous/new-api/relay/channel/task/kling"
	tasksora "github.com/QuantumNous/new-api/relay/channel/task/sora"
	taskVidu "github.com/QuantumNous/new-api/relay/channel/task/vidu"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	relayconstant "github.com/QuantumNous/new-api/relay/constant"
	"github.com/QuantumNous/new-api/relaykit/types"
	"github.com/gin-gonic/gin"
)

func GetAdaptor(apiType int) channel.Adaptor {
	switch apiType {
	case constant.APITypeAnthropic:
		return &claude.Adaptor{}
	case constant.APITypeOpenAI:
		return &openai.Adaptor{}
	case constant.APITypeJimeng:
		return &jimeng.Adaptor{}
	case constant.APITypeBifrost:
		return &bifrostrelay.Adaptor{}
	}
	return nil
}

// GetResponseAdaptor picks the usage/response parser from the client protocol.
// Channel type still owns outbound auth via GetAdaptor; Jimeng image responses
// keep the request adaptor because that upstream shape is channel-specific.
func GetResponseAdaptor(info *relaycommon.RelayInfo, requestAdaptor channel.Adaptor) channel.Adaptor {
	if info != nil && info.ChannelMeta != nil &&
		info.ApiType == constant.APITypeJimeng &&
		info.RelayMode == relayconstant.RelayModeImagesGenerations {
		return requestAdaptor
	}

	var adaptor channel.Adaptor
	switch {
	case info != nil && info.RelayFormat == types.RelayFormatClaude:
		adaptor = &claude.Adaptor{}
	case info != nil && info.RelayFormat == types.RelayFormatGemini:
		adaptor = &gemini.Adaptor{}
	default:
		if openaiAdaptor, ok := requestAdaptor.(*openai.Adaptor); ok {
			return openaiAdaptor
		}
		adaptor = &openai.Adaptor{}
	}
	if info != nil {
		adaptor.Init(info)
	}
	return adaptor
}

func GetTaskPlatform(c *gin.Context) constant.TaskPlatform {
	channelType := c.GetInt("channel_type")
	if channelType > 0 {
		return constant.TaskPlatform(strconv.Itoa(channelType))
	}
	return constant.TaskPlatform(c.GetString("platform"))
}

func GetTaskAdaptor(platform constant.TaskPlatform) channel.TaskAdaptor {
	if channelType, err := strconv.ParseInt(string(platform), 10, 64); err == nil {
		switch channelType {
		case constant.ChannelTypeAli:
			return &taskali.TaskAdaptor{}
		case constant.ChannelTypeKling:
			return &kling.TaskAdaptor{}
		case constant.ChannelTypeJimeng:
			return &taskjimeng.TaskAdaptor{}
		case constant.ChannelTypeVidu:
			return &taskVidu.TaskAdaptor{}
		case constant.ChannelTypeDoubaoVideo, constant.ChannelTypeVolcEngine:
			return &taskdoubao.TaskAdaptor{}
		case constant.ChannelTypeSora, constant.ChannelTypeOpenAI:
			return &tasksora.TaskAdaptor{}
		case constant.ChannelTypeMiniMax:
			return &hailuo.TaskAdaptor{}
		}
	}
	return nil
}
