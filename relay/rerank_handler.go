package relay

import (
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/QuantumNous/new-api/relaykit/types"

	"github.com/gin-gonic/gin"
)

func RerankHelper(c *gin.Context, info *relaycommon.RelayInfo) (newAPIError *types.NewAPIError) {
	if _, ok := info.Request.(*dto.RerankRequest); !ok {
		return invalidRelayRequestType("dto.RerankRequest", info.Request)
	}
	return doRawRelayAndConsumeText(c, info)
}
