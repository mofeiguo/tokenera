package relay

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/relay/channel"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/QuantumNous/new-api/relaykit/types"
	"github.com/QuantumNous/new-api/service"

	"github.com/gin-gonic/gin"
)

func doRawUpstreamRequest(c *gin.Context, info *relaycommon.RelayInfo) (channel.Adaptor, *http.Response, *types.NewAPIError) {
	info.InitChannelMeta(c)
	adaptor := GetAdaptor(info.ApiType)
	if adaptor == nil {
		return nil, nil, types.NewError(fmt.Errorf("invalid api type: %d", info.ApiType), types.ErrorCodeInvalidApiType, types.ErrOptionWithSkipRetry())
	}
	adaptor.Init(info)

	requestBody, closer, apiErr := outboundBoundRequestBody(c, info)
	if closer != nil {
		defer closer.Close()
	}
	if apiErr != nil {
		return nil, nil, apiErr
	}

	resp, err := adaptor.DoRequest(c, info, requestBody)
	if err != nil {
		return nil, nil, types.NewOpenAIError(err, types.ErrorCodeDoRequestFailed, http.StatusInternalServerError)
	}
	if resp == nil {
		return adaptor, nil, nil
	}
	httpResp, ok := resp.(*http.Response)
	if !ok {
		return nil, nil, types.NewOpenAIError(errors.New("invalid http response"), types.ErrorCodeDoRequestFailed, http.StatusInternalServerError)
	}
	return adaptor, httpResp, nil
}

func doRawRelay(c *gin.Context, info *relaycommon.RelayInfo) (*dto.Usage, *types.NewAPIError) {
	adaptor, httpResp, apiErr := doRawUpstreamRequest(c, info)
	if apiErr != nil {
		return nil, apiErr
	}

	statusCodeMappingStr := c.GetString("status_code_mapping")
	if httpResp != nil {
		if isResponsesEventStreamContentType(httpResp.Header.Get("Content-Type")) {
			info.IsStream = true
		}
		if httpResp.StatusCode != http.StatusOK {
			if httpResp.StatusCode == http.StatusCreated && info.ApiType == constant.APITypeReplicate {
				httpResp.StatusCode = http.StatusOK
			} else {
				newAPIError := service.RelayErrorHandler(c.Request.Context(), httpResp, false)
				service.ResetStatusCode(newAPIError, statusCodeMappingStr)
				return nil, newAPIError
			}
		}
	}

	usage, newAPIError := GetResponseAdaptor(info, adaptor).DoResponse(c, httpResp, info)
	if newAPIError != nil {
		service.ResetStatusCode(newAPIError, statusCodeMappingStr)
		return nil, newAPIError
	}
	usageDto, ok := usage.(*dto.Usage)
	if !ok || usageDto == nil {
		return nil, types.NewError(fmt.Errorf("invalid usage type %T", usage), types.ErrorCodeBadResponse, types.ErrOptionWithSkipRetry())
	}
	return usageDto, nil
}

func doRawRelayAndConsumeText(c *gin.Context, info *relaycommon.RelayInfo) *types.NewAPIError {
	usage, newAPIError := doRawRelay(c, info)
	if newAPIError != nil {
		return newAPIError
	}
	service.PostTextConsumeQuota(c, info, usage, nil)
	return nil
}

func invalidRelayRequestType(expected string, got any) *types.NewAPIError {
	return types.NewErrorWithStatusCode(
		fmt.Errorf("invalid request type, expected %s, got %T", expected, got),
		types.ErrorCodeInvalidRequest,
		http.StatusBadRequest,
		types.ErrOptionWithSkipRetry(),
	)
}

func isResponsesEventStreamContentType(contentType string) bool {
	return strings.Contains(strings.ToLower(contentType), "text/event-stream")
}
