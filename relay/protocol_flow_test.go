package relay

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/relay/channel/claude"
	"github.com/QuantumNous/new-api/relay/channel/openai"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	relayconstant "github.com/QuantumNous/new-api/relay/constant"
	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/QuantumNous/new-api/relaykit/types"
	"github.com/QuantumNous/new-api/service"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestChatResponsesMessagesFlow(t *testing.T) {
	service.InitHttpClient()
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name            string
		path            string
		format          types.RelayFormat
		channelType     int
		request         dto.Request
		clientBody      []byte
		upstreamBody    []byte
		wantMode        int
		wantRespAdaptor string
		wantAuthHeader  string
		wantAuthValue   string
		wantUsagePrompt int
	}{
		{
			name:        "chat completions on openai channel",
			path:        "/v1/chat/completions",
			format:      types.RelayFormatOpenAI,
			channelType: constant.ChannelTypeOpenAI,
			request:     &dto.GeneralOpenAIRequest{Model: "gpt-4.1"},
			clientBody:  []byte(`{"model":"gpt-4.1","messages":[{"role":"user","content":"hi"}]}`),
			upstreamBody: []byte(
				`{"id":"chatcmpl-1","object":"chat.completion","choices":[{"index":0,"message":{"role":"assistant","content":"ok"},"finish_reason":"stop"}],"usage":{"prompt_tokens":3,"completion_tokens":1,"total_tokens":4}}`,
			),
			wantMode:        relayconstant.RelayModeChatCompletions,
			wantRespAdaptor: fmt.Sprintf("%T", &openai.Adaptor{}),
			wantAuthHeader:  "Authorization",
			wantAuthValue:   "Bearer test-key",
			wantUsagePrompt: 3,
		},
		{
			name:        "responses on openai channel",
			path:        "/v1/responses",
			format:      types.RelayFormatOpenAIResponses,
			channelType: constant.ChannelTypeOpenAI,
			request: &dto.OpenAIResponsesRequest{
				Model: "gpt-4.1",
				Input: []byte(`"hi"`),
			},
			clientBody: []byte(`{"model":"gpt-4.1","input":"hi"}`),
			upstreamBody: []byte(
				`{"id":"resp_1","object":"response","status":"completed","output":[],"usage":{"input_tokens":5,"output_tokens":2,"total_tokens":7}}`,
			),
			wantMode:        relayconstant.RelayModeResponses,
			wantRespAdaptor: fmt.Sprintf("%T", &openai.Adaptor{}),
			wantAuthHeader:  "Authorization",
			wantAuthValue:   "Bearer test-key",
			wantUsagePrompt: 5,
		},
		{
			name:        "messages on anthropic channel",
			path:        "/v1/messages",
			format:      types.RelayFormatClaude,
			channelType: constant.ChannelTypeAnthropic,
			request:     &dto.ClaudeRequest{Model: "claude-sonnet-4-5"},
			clientBody:  []byte(`{"model":"claude-sonnet-4-5","max_tokens":32,"messages":[{"role":"user","content":"hi"}]}`),
			upstreamBody: []byte(
				`{"id":"msg_1","type":"message","role":"assistant","content":[{"type":"text","text":"ok"}],"model":"claude-sonnet-4-5","stop_reason":"end_turn","usage":{"input_tokens":6,"output_tokens":2}}`,
			),
			wantMode:        relayconstant.RelayModeUnknown,
			wantRespAdaptor: fmt.Sprintf("%T", &claude.Adaptor{}),
			wantAuthHeader:  "x-api-key",
			wantAuthValue:   "test-key",
			wantUsagePrompt: 6,
		},
		{
			name:        "messages on openai-typed channel still parses claude",
			path:        "/v1/messages",
			format:      types.RelayFormatClaude,
			channelType: constant.ChannelTypeOpenAI,
			request:     &dto.ClaudeRequest{Model: "claude-sonnet-4-5"},
			clientBody:  []byte(`{"model":"claude-sonnet-4-5","max_tokens":32,"messages":[{"role":"user","content":"hi"}]}`),
			upstreamBody: []byte(
				`{"id":"msg_2","type":"message","role":"assistant","content":[{"type":"text","text":"ok"}],"model":"claude-sonnet-4-5","stop_reason":"end_turn","usage":{"input_tokens":8,"output_tokens":3}}`,
			),
			wantMode:        relayconstant.RelayModeUnknown,
			wantRespAdaptor: fmt.Sprintf("%T", &claude.Adaptor{}),
			wantAuthHeader:  "Authorization",
			wantAuthValue:   "Bearer test-key",
			wantUsagePrompt: 8,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			type captured struct {
				path string
				body []byte
				auth string
			}
			gotCh := make(chan captured, 1)
			upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				body, err := io.ReadAll(r.Body)
				require.NoError(t, err)
				gotCh <- captured{
					path: r.URL.RequestURI(),
					body: body,
					auth: r.Header.Get(tt.wantAuthHeader),
				}
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusOK)
				_, _ = w.Write(tt.upstreamBody)
			}))
			t.Cleanup(upstream.Close)

			recorder := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(recorder)
			c.Request = httptest.NewRequest(http.MethodPost, tt.path, bytes.NewReader(tt.clientBody))
			c.Request.Header.Set("Content-Type", "application/json")
			c.Request.ContentLength = int64(len(tt.clientBody))
			common.SetContextKey(c, constant.ContextKeyChannelType, tt.channelType)
			common.SetContextKey(c, constant.ContextKeyChannelBaseUrl, upstream.URL)
			common.SetContextKey(c, constant.ContextKeyChannelKey, "test-key")
			common.SetContextKey(c, constant.ContextKeyOriginalModel, "public-sku")
			t.Cleanup(func() { common.CleanupBodyStorage(c) })

			info, err := relaycommon.GenRelayInfo(c, tt.format, tt.request, nil)
			require.NoError(t, err)
			assert.Equal(t, tt.format, info.RelayFormat)
			assert.Equal(t, tt.wantMode, info.RelayMode)
			assert.Equal(t, tt.path, info.RequestURLPath)

			info.InitChannelMeta(c)
			requestAdaptor := GetAdaptor(info.ApiType)
			require.NotNil(t, requestAdaptor)
			assert.Equal(t, tt.wantRespAdaptor, fmt.Sprintf("%T", GetResponseAdaptor(info, requestAdaptor)))

			usage, apiErr := doRawRelay(c, info)
			require.Nil(t, apiErr)
			require.NotNil(t, usage)
			assert.Equal(t, tt.wantUsagePrompt, usage.PromptTokens)

			cap := <-gotCh
			assert.Equal(t, tt.path, cap.path)
			assert.Equal(t, tt.clientBody, cap.body)
			assert.Equal(t, tt.wantAuthValue, cap.auth)
			assert.JSONEq(t, string(tt.upstreamBody), recorder.Body.String())
		})
	}
}

func TestDispatchRelaySelectsHelpersForThreeProtocols(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		path   string
		format types.RelayFormat
		mode   int
		helper string
	}{
		{path: "/v1/chat/completions", format: types.RelayFormatOpenAI, mode: relayconstant.RelayModeChatCompletions, helper: "text"},
		{path: "/v1/responses", format: types.RelayFormatOpenAIResponses, mode: relayconstant.RelayModeResponses, helper: "responses"},
		{path: "/v1/messages", format: types.RelayFormatClaude, mode: relayconstant.RelayModeUnknown, helper: "claude"},
	}

	for _, tt := range tests {
		t.Run(tt.path, func(t *testing.T) {
			assert.Equal(t, tt.mode, relayconstant.Path2RelayMode(tt.path))
			assert.Equal(t, tt.helper, helperNameForDispatch(tt.format, tt.mode))
		})
	}
}

func helperNameForDispatch(format types.RelayFormat, mode int) string {
	switch format {
	case types.RelayFormatClaude:
		return "claude"
	case types.RelayFormatGemini:
		return "gemini"
	case types.RelayFormatOpenAIRealtime:
		return "realtime"
	default:
		switch mode {
		case relayconstant.RelayModeResponses, relayconstant.RelayModeResponsesCompact:
			return "responses"
		default:
			return "text"
		}
	}
}
