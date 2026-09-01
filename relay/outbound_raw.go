package relay

import (
	"bytes"
	"errors"
	"io"
	"net/http"

	"github.com/QuantumNous/new-api/common"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/relaykit/types"

	"github.com/gin-gonic/gin"
)

func outboundRawRequestBody(c *gin.Context) (io.Reader, *types.NewAPIError) {
	body, _, apiErr := outboundBoundRequestBody(c, nil)
	return body, apiErr
}

func outboundBoundRequestBody(c *gin.Context, info *relaycommon.RelayInfo) (io.Reader, io.Closer, *types.NewAPIError) {
	body, err := relaycommon.NewOutboundRawBody(c)
	if err != nil {
		status := http.StatusBadRequest
		if common.IsRequestBodyTooLargeError(err) || errors.Is(err, common.ErrRequestBodyTooLarge) {
			status = http.StatusRequestEntityTooLarge
		}
		return nil, nil, types.NewErrorWithStatusCode(err, types.ErrorCodeReadRequestBodyFailed, status, types.ErrOptionWithSkipRetry())
	}
	if info == nil {
		return body, nil, nil
	}
	upstream := info.GetUpstreamModelName()
	if upstream == "" || upstream == info.GetOriginModelName() {
		return body, nil, nil
	}
	reader, err := body.NewReader()
	if err != nil {
		return nil, nil, types.NewError(err, types.ErrorCodeReadRequestBodyFailed, types.ErrOptionWithSkipRetry())
	}
	raw, err := io.ReadAll(reader)
	_ = reader.Close()
	if err != nil {
		return nil, nil, types.NewError(err, types.ErrorCodeReadRequestBodyFailed, types.ErrOptionWithSkipRetry())
	}
	patched, err := relaycommon.RewriteOutboundJSONModel(raw, upstream)
	if err != nil {
		return nil, nil, types.NewError(err, types.ErrorCodeReadRequestBodyFailed, types.ErrOptionWithSkipRetry())
	}
	if bytes.Equal(patched, raw) {
		return body, nil, nil
	}
	rewritten, closer, err := relaycommon.NewOutboundJSONBody(patched)
	if err != nil {
		return nil, nil, types.NewError(err, types.ErrorCodeReadRequestBodyFailed, types.ErrOptionWithSkipRetry())
	}
	return rewritten, closer, nil
}
