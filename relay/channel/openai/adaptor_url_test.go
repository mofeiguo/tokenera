package openai

import (
	"testing"

	"github.com/QuantumNous/new-api/constant"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/relaykit/types"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetRequestURLForwardsClaudeAndGeminiPaths(t *testing.T) {
	adaptor := &Adaptor{}
	tests := []struct {
		name string
		path string
		format types.RelayFormat
		want string
	}{
		{
			name:   "claude messages",
			path:   "/v1/messages",
			format: types.RelayFormatClaude,
			want:   "https://api.example.com/v1/messages",
		},
		{
			name:   "gemini generateContent",
			path:   "/v1beta/models/gemini-2.5-flash:generateContent",
			format: types.RelayFormatGemini,
			want:   "https://api.example.com/v1beta/models/gemini-2.5-flash:generateContent",
		},
		{
			name:   "openai chat completions",
			path:   "/v1/chat/completions",
			format: types.RelayFormatOpenAI,
			want:   "https://api.example.com/v1/chat/completions",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			url, err := adaptor.GetRequestURL(&relaycommon.RelayInfo{
				ChannelMeta: &relaycommon.ChannelMeta{
					ChannelType:    constant.ChannelTypeOpenAI,
					ChannelBaseUrl: "https://api.example.com",
				},
				RequestURLPath: tt.path,
				RelayFormat:    tt.format,
			})
			require.NoError(t, err)
			assert.Equal(t, tt.want, url)
		})
	}
}
