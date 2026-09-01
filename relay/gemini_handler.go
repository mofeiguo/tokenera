package relay

import (
	"strings"

	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/QuantumNous/new-api/relaykit/types"

	"github.com/gin-gonic/gin"
)

func GeminiHelper(c *gin.Context, info *relaycommon.RelayInfo) (newAPIError *types.NewAPIError) {
	if _, ok := info.Request.(*dto.GeminiChatRequest); !ok {
		return invalidRelayRequestType("*dto.GeminiChatRequest", info.Request)
	}
	return doRawRelayAndConsumeText(c, info)
}

func GeminiEmbeddingHandler(c *gin.Context, info *relaycommon.RelayInfo) (newAPIError *types.NewAPIError) {
	info.IsGeminiBatchEmbedding = strings.HasSuffix(c.Request.URL.Path, "batchEmbedContents")
	switch info.Request.(type) {
	case *dto.GeminiEmbeddingRequest, *dto.GeminiBatchEmbeddingRequest:
	default:
		return invalidRelayRequestType("Gemini embedding request", info.Request)
	}
	return doRawRelayAndConsumeText(c, info)
}
