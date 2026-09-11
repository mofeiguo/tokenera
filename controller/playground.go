package controller

import (
	"errors"
	"strings"

	"github.com/QuantumNous/new-api/middleware"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/relaykit/types"

	"github.com/gin-gonic/gin"
)

func playgroundRelayFormat(path string) types.RelayFormat {
	switch {
	case strings.HasPrefix(path, "/pg/messages"):
		return types.RelayFormatClaude
	case strings.HasPrefix(path, "/pg/responses"):
		return types.RelayFormatOpenAIResponses
	case strings.HasPrefix(path, "/pg/models/"):
		return types.RelayFormatGemini
	default:
		return types.RelayFormatOpenAI
	}
}

func Playground(c *gin.Context) {
	var newAPIError *types.NewAPIError

	defer func() {
		if newAPIError != nil {
			c.JSON(newAPIError.StatusCode, gin.H{
				"error": newAPIError.ToOpenAIError(),
			})
		}
	}()

	useAccessToken := c.GetBool("use_access_token")
	if useAccessToken {
		newAPIError = types.NewError(errors.New("暂不支持使用 access token"), types.ErrorCodeAccessDenied, types.ErrOptionWithSkipRetry())
		return
	}

	userId := c.GetInt("id")

	// Write user context to ensure acceptUnsetRatio is available
	userCache, err := model.GetUserCache(userId)
	if err != nil {
		newAPIError = types.NewError(err, types.ErrorCodeQueryDataError, types.ErrOptionWithSkipRetry())
		return
	}
	userCache.WriteContext(c)

	tempToken := &model.Token{
		UserId: userId,
		Name:   "playground",
	}
	_ = middleware.SetupContextForToken(c, tempToken)

	// Relay parses the body first. GenRelayInfo must not run here with a nil
	// request: Responses format type-asserts to *OpenAIResponsesRequest.
	Relay(c, playgroundRelayFormat(c.Request.URL.Path))
}
