package claude

import (
	"testing"

	"github.com/QuantumNous/new-api/constant"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetRequestURLForwardsInboundPath(t *testing.T) {
	adaptor := &Adaptor{}
	url, err := adaptor.GetRequestURL(&relaycommon.RelayInfo{
		ChannelMeta: &relaycommon.ChannelMeta{
			ChannelType:    constant.ChannelTypeAnthropic,
			ChannelBaseUrl: "https://api.anthropic.com",
		},
		RequestURLPath: "/v1/messages?beta=true",
	})
	require.NoError(t, err)
	assert.Equal(t, "https://api.anthropic.com/v1/messages?beta=true", url)
}
