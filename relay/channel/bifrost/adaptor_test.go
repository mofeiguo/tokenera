package bifrost

import (
	"testing"

	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetRequestURLForwardsInboundPath(t *testing.T) {
	adaptor := &Adaptor{}
	url, err := adaptor.GetRequestURL(&relaycommon.RelayInfo{
		ChannelMeta: &relaycommon.ChannelMeta{
			ChannelBaseUrl: "http://bifrost.local:8080",
		},
		RequestURLPath: "/v1/messages",
	})
	require.NoError(t, err)
	assert.Equal(t, "http://bifrost.local:8080/v1/messages", url)
}

func TestConvertClaudeRequestPassesThrough(t *testing.T) {
	adaptor := &Adaptor{}
	req := &dto.ClaudeRequest{Model: "claude-sonnet-4-0"}
	got, err := adaptor.ConvertClaudeRequest(nil, nil, req)
	require.NoError(t, err)
	assert.Same(t, req, got)
}

func TestConvertOpenAIResponsesRequestPassesThrough(t *testing.T) {
	adaptor := &Adaptor{}
	req := dto.OpenAIResponsesRequest{Model: "gpt-4.1"}
	got, err := adaptor.ConvertOpenAIResponsesRequest(nil, nil, req)
	require.NoError(t, err)
	assert.Equal(t, req, got)
}
