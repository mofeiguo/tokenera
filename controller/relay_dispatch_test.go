package controller

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/common"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/QuantumNous/new-api/relaykit/types"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewRelayRequestErrorMapsBodyTooLarge(t *testing.T) {
	err := newRelayRequestError(common.ErrRequestBodyTooLarge)
	require.NotNil(t, err)
	assert.Equal(t, http.StatusRequestEntityTooLarge, err.StatusCode)
	assert.Equal(t, types.ErrorCodeReadRequestBodyFailed, err.GetErrorCode())
}

func TestNewRelayRequestErrorMapsInvalidRequest(t *testing.T) {
	err := newRelayRequestError(assert.AnError)
	require.NotNil(t, err)
	assert.Equal(t, types.ErrorCodeInvalidRequest, err.GetErrorCode())
}

func TestDispatchRelayRejectsWrongRequestType(t *testing.T) {
	gin.SetMode(gin.TestMode)
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	c.Request = httptest.NewRequest(http.MethodPost, "/v1/messages", nil)
	info := &relaycommon.RelayInfo{
		RelayFormat: types.RelayFormatClaude,
		Request:     &dto.GeneralOpenAIRequest{Model: "gpt-4.1"},
	}

	apiErr := dispatchRelay(c, info)
	require.NotNil(t, apiErr)
	assert.Equal(t, types.ErrorCodeInvalidRequest, apiErr.GetErrorCode())
	assert.Equal(t, http.StatusBadRequest, apiErr.StatusCode)
}
