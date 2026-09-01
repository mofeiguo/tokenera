package relay

import (
	"net/http"
	"net/http/httptest"
	"testing"

	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/QuantumNous/new-api/setting/model_setting"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestGeminiHelperKeepsClientOriginModelName(t *testing.T) {
	settings := model_setting.GetGeminiSettings()
	prev := settings.ThinkingAdapterEnabled
	settings.ThinkingAdapterEnabled = true
	t.Cleanup(func() { settings.ThinkingAdapterEnabled = prev })

	budget := 0
	info := &relaycommon.RelayInfo{
		OriginModelName: "gemini-2.5-flash",
		Request: &dto.GeminiChatRequest{
			GenerationConfig: dto.GeminiChatGenerationConfig{
				ThinkingConfig: &dto.GeminiThinkingConfig{ThinkingBudget: &budget},
			},
		},
	}

	gin.SetMode(gin.TestMode)
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	c.Request = httptest.NewRequest(http.MethodPost, "/v1beta/models/gemini-2.5-flash:generateContent", http.NoBody)

	_ = GeminiHelper(c, info)
	assert.Equal(t, "gemini-2.5-flash", info.OriginModelName)
	assert.NotContains(t, info.OriginModelName, "-nothinking")
}
