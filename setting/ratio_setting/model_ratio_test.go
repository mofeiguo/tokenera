package ratio_setting

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestPricingOnlyUsesConfiguredModelRatio(t *testing.T) {
	t.Cleanup(func() {
		require.NoError(t, UpdateModelRatioByJSONString("{}"))
		require.NoError(t, UpdateCompletionRatioByJSONString("{}"))
	})

	_, found, _ := GetModelRatio("gpt-4o")
	assert.False(t, found, "built-in default ratios must not exist")

	assert.Equal(t, 1.0, GetCompletionRatio("gpt-4o"))
	info := GetCompletionRatioInfo("gpt-4o")
	assert.Equal(t, 1.0, info.Ratio)
	assert.False(t, info.Locked)

	require.NoError(t, UpdateModelRatioByJSONString(`{"smoke-model":5}`))
	require.NoError(t, UpdateCompletionRatioByJSONString(`{"smoke-model":3}`))

	ratio, found, _ := GetModelRatio("smoke-model")
	require.True(t, found)
	assert.Equal(t, 5.0, ratio)
	assert.Equal(t, 3.0, GetCompletionRatio("smoke-model"))

	_, _, exist := GetModelRatioOrPrice("totally-unknown-model")
	assert.False(t, exist)
}
