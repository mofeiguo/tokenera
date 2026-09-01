package controller

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/relaykit/types"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestPlaygroundRelayFormat(t *testing.T) {
	tests := []struct {
		path string
		want types.RelayFormat
	}{
		{path: "/pg/chat/completions", want: types.RelayFormatOpenAI},
		{path: "/pg/responses", want: types.RelayFormatOpenAIResponses},
		{path: "/pg/messages", want: types.RelayFormatClaude},
		{path: "/pg/models/gemini-2.5-flash:streamGenerateContent", want: types.RelayFormatGemini},
	}

	for _, test := range tests {
		t.Run(test.path, func(t *testing.T) {
			assert.Equal(t, test.want, playgroundRelayFormat(test.path))
		})
	}
}

func TestPlaygroundResponsesDoesNotFailBeforeParse(t *testing.T) {
	prevRedis := common.RedisEnabled
	common.RedisEnabled = false
	t.Cleanup(func() { common.RedisEnabled = prevRedis })

	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(
		http.MethodPost,
		"/pg/responses",
		strings.NewReader(`{"model":"gpt-5.5","input":[]}`),
	)
	ctx.Request.Header.Set("Content-Type", "application/json")

	Playground(ctx)

	assert.NotContains(t, recorder.Body.String(), "request is not a OpenAIResponsesRequest")
}
