package relay

import (
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/QuantumNous/new-api/relaykit/types"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting/ratio_setting"

	"github.com/gin-gonic/gin"
)

func TextHelper(c *gin.Context, info *relaycommon.RelayInfo) (newAPIError *types.NewAPIError) {
	request, ok := info.Request.(*dto.GeneralOpenAIRequest)
	if !ok {
		return invalidRelayRequestType("dto.GeneralOpenAIRequest", info.Request)
	}

	if request.WebSearchOptions != nil {
		c.Set("chat_completion_web_search_context_size", request.WebSearchOptions.SearchContextSize)
	}

	includeUsage := true
	if request.StreamOptions != nil {
		includeUsage = request.StreamOptions.IncludeUsage
	}
	info.ShouldIncludeUsage = includeUsage

	usage, newAPIError := doRawRelay(c, info)
	if newAPIError != nil {
		return newAPIError
	}

	containAudioTokens := usage.CompletionTokenDetails.AudioTokens > 0 || usage.PromptTokensDetails.AudioTokens > 0
	containsAudioRatios := ratio_setting.ContainsAudioRatio(info.OriginModelName) || ratio_setting.ContainsAudioCompletionRatio(info.OriginModelName)
	if containAudioTokens && containsAudioRatios {
		service.PostAudioConsumeQuota(c, info, usage, "")
	} else {
		service.PostTextConsumeQuota(c, info, usage, nil)
	}
	return nil
}
