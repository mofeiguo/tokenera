package bifrost

import (
	"testing"

	relaycommon "github.com/QuantumNous/new-api/relay/common"
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

func TestGetRequestURLForwardsResponsesPath(t *testing.T) {
	adaptor := &Adaptor{}
	url, err := adaptor.GetRequestURL(&relaycommon.RelayInfo{
		ChannelMeta: &relaycommon.ChannelMeta{
			ChannelBaseUrl: "http://bifrost.local:8080",
		},
		RequestURLPath: "/v1/responses",
	})
	require.NoError(t, err)
	assert.Equal(t, "http://bifrost.local:8080/v1/responses", url)
}
