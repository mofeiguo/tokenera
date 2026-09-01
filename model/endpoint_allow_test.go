package model

import (
	"testing"

	"github.com/QuantumNous/new-api/constant"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestModelSupportsIncomingEndpoint(t *testing.T) {
	modelSupportEndpointsLock.Lock()
	original := modelSupportEndpointTypes
	modelSupportEndpointTypes = map[string][]constant.EndpointType{
		"claude-sonnet-4-5": {constant.EndpointTypeAnthropic},
		"gpt-4.1":           {constant.EndpointTypeOpenAI, constant.EndpointTypeOpenAIResponse},
	}
	modelSupportEndpointsLock.Unlock()
	t.Cleanup(func() {
		modelSupportEndpointsLock.Lock()
		modelSupportEndpointTypes = original
		modelSupportEndpointsLock.Unlock()
	})

	require.True(t, ModelSupportsIncomingEndpoint("claude-sonnet-4-5", constant.EndpointTypeAnthropic))
	assert.False(t, ModelSupportsIncomingEndpoint("claude-sonnet-4-5", constant.EndpointTypeOpenAI))
	assert.True(t, ModelSupportsIncomingEndpoint("gpt-4.1", constant.EndpointTypeOpenAI))
	assert.True(t, ModelSupportsIncomingEndpoint("gpt-4.1", constant.EndpointTypeOpenAIResponse))
	assert.False(t, ModelSupportsIncomingEndpoint("gpt-4.1", constant.EndpointTypeAnthropic))
	assert.True(t, ModelSupportsIncomingEndpoint("unknown-model", constant.EndpointTypeOpenAI))
	assert.True(t, ModelSupportsIncomingEndpoint("gpt-4.1", ""))
}
