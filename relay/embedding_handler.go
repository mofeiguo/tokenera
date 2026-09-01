package relay

import (
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/QuantumNous/new-api/relaykit/types"

	"github.com/gin-gonic/gin"
)

func EmbeddingHelper(c *gin.Context, info *relaycommon.RelayInfo) (newAPIError *types.NewAPIError) {
	if _, ok := info.Request.(*dto.EmbeddingRequest); !ok {
		return invalidRelayRequestType("*dto.EmbeddingRequest", info.Request)
	}
	return doRawRelayAndConsumeText(c, info)
}
