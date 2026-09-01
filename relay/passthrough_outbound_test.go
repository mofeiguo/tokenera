package relay

import (
	"bytes"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestOutboundRawRequestBodyMatchesClientBytes(t *testing.T) {
	gin.SetMode(gin.TestMode)
	payload := []byte(`{"model":"gpt-4.1","unknown":true,"stream_options":{"include_usage":false}}`)
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	c.Request = httptest.NewRequest(http.MethodPost, "/v1/chat/completions", bytes.NewReader(payload))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Request.ContentLength = int64(len(payload))
	t.Cleanup(func() { common.CleanupBodyStorage(c) })

	body, apiErr := outboundRawRequestBody(c)
	require.Nil(t, apiErr)
	got, err := io.ReadAll(body)
	require.NoError(t, err)
	assert.Equal(t, payload, got)
}

func TestInitChannelMetaAndRawBodyKeepClientModel(t *testing.T) {
	gin.SetMode(gin.TestMode)
	payload := []byte(`{"model":"public-sku","messages":[{"role":"user","content":"hi"}]}`)
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	c.Request = httptest.NewRequest(http.MethodPost, "/v1/chat/completions", bytes.NewReader(payload))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Request.ContentLength = int64(len(payload))
	common.SetContextKey(c, constant.ContextKeyOriginalModel, "public-sku")
	t.Cleanup(func() { common.CleanupBodyStorage(c) })

	request := &dto.GeneralOpenAIRequest{Model: "public-sku"}
	info := &relaycommon.RelayInfo{
		OriginModelName: "public-sku",
		Request:         request,
	}
	info.InitChannelMeta(c)
	assert.Equal(t, "public-sku", info.UpstreamModelName)
	assert.Equal(t, "public-sku", request.Model)

	body, apiErr := outboundRawRequestBody(c)
	require.Nil(t, apiErr)
	got, err := io.ReadAll(body)
	require.NoError(t, err)
	assert.Equal(t, payload, got)
	assert.Contains(t, string(got), `"model":"public-sku"`)
	assert.NotContains(t, string(got), "provider/model-v2")
	assert.NotContains(t, string(got), "legacy/model")
}

func TestOutboundBodyRewritesBoundUpstreamModel(t *testing.T) {
	gin.SetMode(gin.TestMode)
	payload := []byte(`{"model":"my-alias","messages":[{"role":"user","content":"hi"}]}`)
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	c.Request = httptest.NewRequest(http.MethodPost, "/v1/chat/completions", bytes.NewReader(payload))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Request.ContentLength = int64(len(payload))
	common.SetContextKey(c, constant.ContextKeyOriginalModel, "my-alias")
	common.SetContextKey(c, constant.ContextKeyUpstreamModel, "deepseek-v4-pro")
	t.Cleanup(func() { common.CleanupBodyStorage(c) })

	request := &dto.GeneralOpenAIRequest{Model: "my-alias"}
	info := &relaycommon.RelayInfo{
		OriginModelName: "my-alias",
		Request:         request,
	}
	info.InitChannelMeta(c)
	assert.Equal(t, "deepseek-v4-pro", info.UpstreamModelName)
	assert.Equal(t, "my-alias", request.Model)

	body, closer, apiErr := outboundBoundRequestBody(c, info)
	require.Nil(t, apiErr)
	if closer != nil {
		t.Cleanup(func() { _ = closer.Close() })
	}
	got, err := io.ReadAll(body)
	require.NoError(t, err)
	assert.Contains(t, string(got), `"model":"deepseek-v4-pro"`)
	assert.NotContains(t, string(got), "my-alias")
}
