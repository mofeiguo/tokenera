package helper

import (
	"testing"

	rootcommon "github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestModelMappedHelperPrefersExplicitBindingUpstream(t *testing.T) {
	gin.SetMode(gin.TestMode)
	context, _ := gin.CreateTestContext(nil)
	rootcommon.SetContextKey(context, constant.ContextKeyChannelUpstreamModel, "provider/model-v2")
	context.Set("model_mapping", `{"public-sku":"legacy/model"}`)
	info := &relaycommon.RelayInfo{
		OriginModelName: "public-sku",
		ChannelMeta: &relaycommon.ChannelMeta{
			UpstreamModelName: "public-sku",
		},
	}
	request := &dto.GeneralOpenAIRequest{Model: "public-sku"}

	err := ModelMappedHelper(context, info, request)

	require.NoError(t, err)
	assert.Equal(t, "provider/model-v2", info.UpstreamModelName)
	assert.Equal(t, "provider/model-v2", request.Model)
	assert.True(t, info.IsModelMapped)
}
