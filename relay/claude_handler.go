package relay

import (
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/QuantumNous/new-api/relaykit/types"

	"github.com/gin-gonic/gin"
)

func ClaudeHelper(c *gin.Context, info *relaycommon.RelayInfo) (newAPIError *types.NewAPIError) {
	if _, ok := info.Request.(*dto.ClaudeRequest); !ok {
		return invalidRelayRequestType("*dto.ClaudeRequest", info.Request)
	}
	return doRawRelayAndConsumeText(c, info)
}
