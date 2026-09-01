package relay

import (
	"errors"
	"io"
	"net/http"

	"github.com/QuantumNous/new-api/constant"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/QuantumNous/new-api/relaykit/types"
	"github.com/QuantumNous/new-api/service"

	"github.com/gin-gonic/gin"
)

func AlphaSearchHelper(c *gin.Context, info *relaycommon.RelayInfo) (newAPIError *types.NewAPIError) {
	info.InitChannelMeta(c)

	switch info.ChannelType {
	case constant.ChannelTypeSub2API,
		constant.ChannelTypeNewAPI,
		constant.ChannelTypeCodex,
		constant.ChannelTypeAdvancedCustom:
	default:
		return types.NewError(
			errors.New("channel does not support /v1/alpha/search"),
			types.ErrorCodeInvalidRequest,
		)
	}

	if _, ok := info.Request.(*dto.AlphaSearchRequest); !ok {
		return invalidRelayRequestType("*dto.AlphaSearchRequest", info.Request)
	}

	_, httpResp, newAPIError := doRawUpstreamRequest(c, info)
	if newAPIError != nil {
		return newAPIError
	}
	if httpResp == nil {
		return types.NewOpenAIError(errors.New("invalid http response"), types.ErrorCodeDoRequestFailed, http.StatusInternalServerError)
	}
	defer httpResp.Body.Close()

	statusCodeMappingStr := c.GetString("status_code_mapping")
	if httpResp.StatusCode < 200 || httpResp.StatusCode >= 300 {
		newAPIError = service.RelayErrorHandler(c.Request.Context(), httpResp, false)
		service.ResetStatusCode(newAPIError, statusCodeMappingStr)
		return newAPIError
	}

	if contentType := httpResp.Header.Get("Content-Type"); contentType != "" {
		c.Writer.Header().Set("Content-Type", contentType)
	}
	c.Writer.WriteHeader(httpResp.StatusCode)
	if _, err := io.Copy(c.Writer, httpResp.Body); err != nil {
		return types.NewError(err, types.ErrorCodeDoRequestFailed, types.ErrOptionWithSkipRetry())
	}

	if info.ResponsesUsageInfo == nil {
		info.ResponsesUsageInfo = &relaycommon.ResponsesUsageInfo{
			BuiltInTools: make(map[string]*relaycommon.BuildInToolInfo),
		}
	}
	if info.ResponsesUsageInfo.BuiltInTools == nil {
		info.ResponsesUsageInfo.BuiltInTools = make(map[string]*relaycommon.BuildInToolInfo)
	}
	info.ResponsesUsageInfo.BuiltInTools[dto.BuildInToolWebSearchPreview] = &relaycommon.BuildInToolInfo{
		ToolName:  dto.BuildInToolWebSearchPreview,
		CallCount: 1,
	}

	service.PostTextConsumeQuota(c, info, &dto.Usage{}, nil)
	return nil
}
