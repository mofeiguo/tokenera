package bifrost

import (
	"io"
	"net/http"

	"github.com/QuantumNous/new-api/relay/channel"
	"github.com/QuantumNous/new-api/relay/channel/claude"
	"github.com/QuantumNous/new-api/relay/channel/openai"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/relaykit/types"

	"github.com/gin-gonic/gin"
)

// Adaptor forwards OpenAI chat, Claude messages, and OpenAI responses to a
// Bifrost HTTP gateway. new-api keeps auth, billing, and channel selection.
type Adaptor struct {
	openaiAdaptor openai.Adaptor
	claudeAdaptor claude.Adaptor
}

func (a *Adaptor) Init(info *relaycommon.RelayInfo) {
	a.openaiAdaptor.Init(info)
	a.claudeAdaptor.Init(info)
}

func (a *Adaptor) GetRequestURL(info *relaycommon.RelayInfo) (string, error) {
	return relaycommon.GetFullRequestURL(info.ChannelBaseUrl, info.RequestURLPath, info.ChannelType), nil
}

func (a *Adaptor) SetupRequestHeader(c *gin.Context, req *http.Header, info *relaycommon.RelayInfo) error {
	channel.SetupApiRequestHeader(info, c, req)
	req.Set("Authorization", "Bearer "+info.ApiKey)
	if info.RelayFormat == types.RelayFormatClaude {
		req.Set("x-api-key", info.ApiKey)
		if req.Get("anthropic-version") == "" {
			anthropicVersion := c.Request.Header.Get("anthropic-version")
			if anthropicVersion == "" {
				anthropicVersion = "2023-06-01"
			}
			req.Set("anthropic-version", anthropicVersion)
		}
		if beta := c.Request.Header.Get("anthropic-beta"); beta != "" {
			req.Set("anthropic-beta", beta)
		}
	}
	return nil
}

func (a *Adaptor) DoRequest(c *gin.Context, info *relaycommon.RelayInfo, requestBody io.Reader) (any, error) {
	return channel.DoApiRequest(a, c, info, requestBody)
}

func (a *Adaptor) DoResponse(c *gin.Context, resp *http.Response, info *relaycommon.RelayInfo) (usage any, err *types.NewAPIError) {
	if info.RelayFormat == types.RelayFormatClaude {
		return a.claudeAdaptor.DoResponse(c, resp, info)
	}
	return a.openaiAdaptor.DoResponse(c, resp, info)
}

func (a *Adaptor) GetModelList() []string {
	return ModelList
}

func (a *Adaptor) GetChannelName() string {
	return ChannelName
}
