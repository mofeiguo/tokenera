package dto

import (
	"encoding/json"
	"net/http"

	"github.com/QuantumNous/new-api/relaykit/types"
)

// AlphaSearchRequest is the Codex standalone web search request.
// RawBody is kept for token counting and sensitive-word checks.
// Outbound forwarding uses the stored client body, not this field.
type AlphaSearchRequest struct {
	Model   string          `json:"model"`
	Id      string          `json:"id,omitempty"`
	Stream  *bool           `json:"stream,omitempty"`
	RawBody json.RawMessage `json:"-"`
}

func (r *AlphaSearchRequest) GetTokenCountMeta() *types.TokenCountMeta {
	combineText := ""
	if len(r.RawBody) > 0 {
		combineText = string(r.RawBody)
	}
	return &types.TokenCountMeta{
		CombineText: combineText,
		TokenType:   types.TokenTypeTokenizer,
	}
}

func (r *AlphaSearchRequest) IsStream(_ *http.Request) bool {
	return false
}

func (r *AlphaSearchRequest) SetModelName(modelName string) {
	if modelName != "" {
		r.Model = modelName
	}
}
