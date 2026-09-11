package operation_setting

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func preserveToolPrices(t *testing.T) {
	t.Helper()
	original := make(map[string]float64, len(toolPriceSetting.Prices))
	for key, price := range toolPriceSetting.Prices {
		original[key] = price
	}
	t.Cleanup(func() {
		toolPriceSetting.Prices = original
		RebuildToolPriceIndex()
	})
}

func TestToolPriceOnlyUsesOperatorConfiguration(t *testing.T) {
	preserveToolPrices(t)
	toolPriceSetting.Prices = map[string]float64{}
	RebuildToolPriceIndex()

	assert.Equal(t, 0.0, GetToolPrice("web_search"))
	assert.Equal(t, 0.0, GetToolPriceForModel("web_search_preview", "gpt-4o-2024-11-20"))
	assert.Equal(t, 0.0, GetToolPrice("lookup_customer"))

	toolPriceSetting.Prices = map[string]float64{
		"web_search":                 12,
		"web_search_preview":         0,
		"web_search_preview:gpt-4o*":   30,
		"web_search_preview:gpt-4o-mini*": 0,
		"lookup_customer":            5,
	}
	RebuildToolPriceIndex()

	assert.Equal(t, 12.0, GetToolPrice("web_search"))
	assert.Equal(t, 0.0, GetToolPriceForModel("web_search_preview", "o1"))
	assert.Equal(t, 30.0, GetToolPriceForModel("web_search_preview", "gpt-4o"))
	assert.Equal(t, 0.0, GetToolPriceForModel("web_search_preview", "gpt-4o-mini"))
	assert.Equal(t, 5.0, GetToolPrice("lookup_customer"))
}

func TestValidateToolPricesJSON(t *testing.T) {
	valid := []string{
		`{}`,
		`{"web_search":10}`,
		`{"web_search":0}`,
	}
	for _, value := range valid {
		assert.NoError(t, ValidateToolPricesJSON(value), value)
	}

	invalid := []string{
		``,
		`[]`,
		`{"web_search":"10"}`,
		`{"web_search":-1}`,
	}
	for _, value := range invalid {
		assert.Error(t, ValidateToolPricesJSON(value), value)
	}
}

func TestLoadToolPricesFromJSONStringReplacesMap(t *testing.T) {
	preserveToolPrices(t)

	LoadToolPricesFromJSONString(`{
		"web_search": 0,
		"custom_fn": 3,
		"file_search": "bad",
		"google_search": -1
	}`)
	require.Len(t, toolPriceSetting.Prices, 2)
	assert.Equal(t, 0.0, toolPriceSetting.Prices["web_search"])
	assert.Equal(t, 3.0, toolPriceSetting.Prices["custom_fn"])
	assert.Equal(t, 0.0, GetToolPrice("web_search"))
	assert.Equal(t, 3.0, GetToolPrice("custom_fn"))
	assert.Equal(t, 0.0, GetToolPrice("file_search"))

	LoadToolPricesFromJSONString(`{"image_generation":0}`)
	require.Len(t, toolPriceSetting.Prices, 1)
	assert.Equal(t, 0.0, GetToolPrice("web_search"))
	assert.Equal(t, 0.0, GetToolPrice("custom_fn"))
	assert.Equal(t, 0.0, GetToolPrice("image_generation"))
}

func TestRebuildToolPriceIndexIgnoresInvalidDirectValues(t *testing.T) {
	preserveToolPrices(t)
	toolPriceSetting.Prices = map[string]float64{
		"web_search":        10,
		"file_search":       -1,
		"image_generation":  150,
		"custom_fn":         0,
	}
	RebuildToolPriceIndex()

	assert.Equal(t, 10.0, GetToolPrice("web_search"))
	assert.Equal(t, 0.0, GetToolPrice("file_search"))
	assert.Equal(t, 150.0, GetToolPrice("image_generation"))
	assert.Equal(t, 0.0, GetToolPrice("custom_fn"))
}
