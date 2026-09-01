package relay

import (
	"bytes"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAlphaSearchOutboundBodyKeepsClientBytes(t *testing.T) {
	gin.SetMode(gin.TestMode)
	raw := []byte(`{"id":"req_1","model":"gpt-5.1","commands":{"search_query":[{"q":"weather","recency":1}]},"future_field":{"nested":true}}`)
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	c.Request = httptest.NewRequest(http.MethodPost, "/v1/alpha/search", bytes.NewReader(raw))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Request.ContentLength = int64(len(raw))
	t.Cleanup(func() { common.CleanupBodyStorage(c) })

	body, apiErr := outboundRawRequestBody(c)
	require.Nil(t, apiErr)
	got, err := io.ReadAll(body)
	require.NoError(t, err)
	assert.Equal(t, raw, got)
}
