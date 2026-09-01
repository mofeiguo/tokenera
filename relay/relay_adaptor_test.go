package relay

import (
	"fmt"
	"testing"

	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/relay/channel"
	"github.com/QuantumNous/new-api/relay/channel/claude"
	"github.com/QuantumNous/new-api/relay/channel/gemini"
	"github.com/QuantumNous/new-api/relay/channel/jimeng"
	"github.com/QuantumNous/new-api/relay/channel/openai"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	relayconstant "github.com/QuantumNous/new-api/relay/constant"
	"github.com/QuantumNous/new-api/relaykit/types"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetResponseAdaptorUsesClientProtocol(t *testing.T) {
	openaiReq := &openai.Adaptor{}
	jimengReq := &jimeng.Adaptor{}

	tests := []struct {
		name      string
		info      *relaycommon.RelayInfo
		request   channel.Adaptor
		wantType  string
		sameAsReq bool
	}{
		{
			name: "gemini client on openai channel",
			info: responseAdaptorInfo(types.RelayFormatGemini, constant.APITypeOpenAI, 0),
			request: openaiReq,
			wantType: fmt.Sprintf("%T", &gemini.Adaptor{}),
		},
		{
			name: "claude client on openai channel",
			info: responseAdaptorInfo(types.RelayFormatClaude, constant.APITypeOpenAI, 0),
			request: openaiReq,
			wantType: fmt.Sprintf("%T", &claude.Adaptor{}),
		},
		{
			name: "openai client keeps request adaptor",
			info: responseAdaptorInfo(types.RelayFormatOpenAI, constant.APITypeOpenAI, 0),
			request: openaiReq,
			sameAsReq: true,
		},
		{
			name: "jimeng image keeps request adaptor",
			info: responseAdaptorInfo(types.RelayFormatOpenAIImage, constant.APITypeJimeng, relayconstant.RelayModeImagesGenerations),
			request: jimengReq,
			sameAsReq: true,
		},
		{
			name: "jimeng chat uses openai parser",
			info: responseAdaptorInfo(types.RelayFormatOpenAI, constant.APITypeJimeng, relayconstant.RelayModeChatCompletions),
			request: jimengReq,
			wantType: fmt.Sprintf("%T", &openai.Adaptor{}),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := GetResponseAdaptor(tt.info, tt.request)
			require.NotNil(t, got)
			if tt.sameAsReq {
				assert.Same(t, tt.request, got)
				return
			}
			assert.Equal(t, tt.wantType, fmt.Sprintf("%T", got))
		})
	}
}

func responseAdaptorInfo(format types.RelayFormat, apiType int, mode int) *relaycommon.RelayInfo {
	return &relaycommon.RelayInfo{
		RelayFormat: format,
		RelayMode:   mode,
		ChannelMeta: &relaycommon.ChannelMeta{ApiType: apiType},
	}
}
