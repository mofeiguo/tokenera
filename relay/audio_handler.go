package relay

import (
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/QuantumNous/new-api/relaykit/types"
	"github.com/QuantumNous/new-api/service"

	"github.com/gin-gonic/gin"
)

func AudioHelper(c *gin.Context, info *relaycommon.RelayInfo) (newAPIError *types.NewAPIError) {
	if _, ok := info.Request.(*dto.AudioRequest); !ok {
		return invalidRelayRequestType("*dto.AudioRequest", info.Request)
	}

	usage, newAPIError := doRawRelay(c, info)
	if newAPIError != nil {
		return newAPIError
	}
	if usage.CompletionTokenDetails.AudioTokens > 0 || usage.PromptTokensDetails.AudioTokens > 0 {
		service.PostAudioConsumeQuota(c, info, usage, "")
	} else {
		service.PostTextConsumeQuota(c, info, usage, nil)
	}
	return nil
}
