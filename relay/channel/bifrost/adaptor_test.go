package bifrost

import (
	"testing"

	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/relaykit/types"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetRequestURLForwardsOpenAIPaths(t *testing.T) {
	adaptor := &Adaptor{}
	url, err := adaptor.GetRequestURL(&relaycommon.RelayInfo{
		ChannelMeta: &relaycommon.ChannelMeta{
			ChannelBaseUrl: "http://bifrost.local:8080",
		},
		RequestURLPath: "/v1/chat/completions",
		RelayFormat:    types.RelayFormatOpenAI,
	})
	require.NoError(t, err)
	assert.Equal(t, "http://bifrost.local:8080/v1/chat/completions", url)
}

func TestGetRequestURLForwardsResponsesPath(t *testing.T) {
	adaptor := &Adaptor{}
	url, err := adaptor.GetRequestURL(&relaycommon.RelayInfo{
		ChannelMeta: &relaycommon.ChannelMeta{
			ChannelBaseUrl: "http://bifrost.local:8080",
		},
		RequestURLPath: "/v1/responses",
		RelayFormat:    types.RelayFormatOpenAIResponses,
	})
	require.NoError(t, err)
	assert.Equal(t, "http://bifrost.local:8080/v1/responses", url)
}

func TestGetRequestURLPrefixesClaudePath(t *testing.T) {
	adaptor := &Adaptor{}
	url, err := adaptor.GetRequestURL(&relaycommon.RelayInfo{
		ChannelMeta: &relaycommon.ChannelMeta{
			ChannelBaseUrl: "http://bifrost.local:8080",
		},
		RequestURLPath: "/v1/messages",
		RelayFormat:    types.RelayFormatClaude,
	})
	require.NoError(t, err)
	assert.Equal(t, "http://bifrost.local:8080/anthropic/v1/messages", url)
}

func TestGetRequestURLPrefixesGeminiPath(t *testing.T) {
	adaptor := &Adaptor{}
	url, err := adaptor.GetRequestURL(&relaycommon.RelayInfo{
		ChannelMeta: &relaycommon.ChannelMeta{
			ChannelBaseUrl: "http://bifrost.local:8080",
		},
		RequestURLPath: "/v1beta/models/deepseek-v4-flash:streamGenerateContent",
		RelayFormat:    types.RelayFormatGemini,
	})
	require.NoError(t, err)
	assert.Equal(t, "http://bifrost.local:8080/genai/v1beta/models/deepseek-v4-flash:streamGenerateContent", url)
}

func TestGetRequestURLSkipsPrefixWhenBaseURLAlreadyHasIntegration(t *testing.T) {
	adaptor := &Adaptor{}

	geminiURL, err := adaptor.GetRequestURL(&relaycommon.RelayInfo{
		ChannelMeta: &relaycommon.ChannelMeta{
			ChannelBaseUrl: "http://bifrost.local:8080/genai",
		},
		RequestURLPath: "/v1beta/models/deepseek-v4-flash:generateContent",
		RelayFormat:    types.RelayFormatGemini,
	})
	require.NoError(t, err)
	assert.Equal(t, "http://bifrost.local:8080/genai/v1beta/models/deepseek-v4-flash:generateContent", geminiURL)

	claudeURL, err := adaptor.GetRequestURL(&relaycommon.RelayInfo{
		ChannelMeta: &relaycommon.ChannelMeta{
			ChannelBaseUrl: "http://bifrost.local:8080/anthropic",
		},
		RequestURLPath: "/v1/messages",
		RelayFormat:    types.RelayFormatClaude,
	})
	require.NoError(t, err)
	assert.Equal(t, "http://bifrost.local:8080/anthropic/v1/messages", claudeURL)
}

func TestInitDelegatesToAllAdaptors(t *testing.T) {
	adaptor := &Adaptor{}
	info := &relaycommon.RelayInfo{
		ChannelMeta: &relaycommon.ChannelMeta{
			ChannelBaseUrl: "http://bifrost.local:8080",
		},
	}
	assert.NotPanics(t, func() {
		adaptor.Init(info)
	})
}
