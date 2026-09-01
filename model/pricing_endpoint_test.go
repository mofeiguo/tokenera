package model

import (
	"fmt"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func resetPricingEndpointTestTables(t *testing.T) {
	t.Helper()
	originalMemoryCacheEnabled := common.MemoryCacheEnabled
	common.MemoryCacheEnabled = true
	require.NoError(t, DB.AutoMigrate(&Channel{}, &Model{}, &ModelBinding{}, &Vendor{}))
	for _, table := range []string{"model_bindings", "channels", "models", "vendors"} {
		require.NoError(t, DB.Exec("DELETE FROM "+table).Error)
	}
	InitChannelCache()
	InvalidatePricingCache()
	t.Cleanup(func() {
		for _, table := range []string{"model_bindings", "channels", "models", "vendors"} {
			require.NoError(t, DB.Exec("DELETE FROM "+table).Error)
		}
		InitChannelCache()
		InvalidatePricingCache()
		common.MemoryCacheEnabled = originalMemoryCacheEnabled
	})
}

func insertPricingEndpointChannel(t *testing.T, channelID int, channelType int, settings dto.ChannelOtherSettings) {
	t.Helper()
	channel := &Channel{
		Id:     channelID,
		Type:   channelType,
		Key:    fmt.Sprintf("key-%d", channelID),
		Status: common.ChannelStatusEnabled,
		Name:   fmt.Sprintf("channel-%d", channelID),
		Group:  "default",
	}
	if settings.AdvancedCustom != nil {
		channel.SetOtherSettings(settings)
	}
	require.NoError(t, DB.Create(channel).Error)
}

func insertPricingEndpointBinding(t *testing.T, channelID int, modelName string) {
	t.Helper()
	var catalogModel Model
	require.NoError(t, DB.FirstOrCreate(&catalogModel, Model{
		ModelName: modelName,
		Status:    1,
		NameRule:  NameRuleExact,
	}).Error)
	require.NoError(t, DB.Create(&ModelBinding{
		ModelId:   catalogModel.Id,
		ChannelId: channelID,
		Enabled:   true,
		GroupsRaw: "default",
	}).Error)
}

func pricingEndpointAdvancedCustomConfig(routes ...dto.AdvancedCustomRoute) dto.ChannelOtherSettings {
	return dto.ChannelOtherSettings{
		AdvancedCustom: &dto.AdvancedCustomConfig{
			Routes: routes,
		},
	}
}

func pricingEndpointTypesByModel(t *testing.T) map[string][]constant.EndpointType {
	t.Helper()
	InitChannelCache()
	return pricingEndpointTypesFromPricing(GetPricing())
}

func pricingEndpointTypesFromPricing(pricings []Pricing) map[string][]constant.EndpointType {
	byModel := make(map[string][]constant.EndpointType)
	for _, pricing := range pricings {
		byModel[pricing.ModelName] = pricing.SupportedEndpointTypes
	}
	return byModel
}

func TestPricingDoesNotInferEndpointsFromChannelRoutes(t *testing.T) {
	resetPricingEndpointTestTables(t)

	insertPricingEndpointChannel(t, 101, constant.ChannelTypeAdvancedCustom, pricingEndpointAdvancedCustomConfig(
		dto.AdvancedCustomRoute{
			IncomingPath: "/v1/chat/completions",
			UpstreamPath: "/v1/chat/completions",
		},
		dto.AdvancedCustomRoute{
			IncomingPath: "/v1/responses",
			UpstreamPath: "/v1beta/models/{model}:generateContent",
			Converter:    "openai_responses_to_gemini_generate_content",
			Models:       []string{"re:^gemini-"},
		},
	))
	insertPricingEndpointBinding(t, 101, "gemini-2.5-flash")
	insertPricingEndpointBinding(t, 101, "gpt-4o")

	byModel := pricingEndpointTypesByModel(t)

	assert.Empty(t, byModel["gemini-2.5-flash"])
	assert.Empty(t, byModel["gpt-4o"])
}

func TestPricingUsesOnlyCatalogEndpoints(t *testing.T) {
	resetPricingEndpointTestTables(t)

	insertPricingEndpointChannel(t, 103, constant.ChannelTypeAdvancedCustom, pricingEndpointAdvancedCustomConfig(
		dto.AdvancedCustomRoute{
			IncomingPath: "/v1/responses",
			UpstreamPath: "/v1beta/models/{model}:generateContent",
			Converter:    "openai_responses_to_gemini_generate_content",
			Models:       []string{"re:^gemini-"},
		},
	))
	insertPricingEndpointBinding(t, 103, "gemini-2.5-flash")
	require.NoError(t, DB.Model(&Model{}).Where("model_name = ?", "gemini-2.5-flash").Updates(&Model{
		Endpoints: `{
			"openai": "/v1/chat/completions"
		}`,
		Status:   1,
		NameRule: NameRuleExact,
	}).Error)

	byModel := pricingEndpointTypesByModel(t)

	assert.Equal(t, []constant.EndpointType{constant.EndpointTypeOpenAI}, byModel["gemini-2.5-flash"])
}

func TestPricingModelMetadataEndpointsCanProvideEndpointWithoutChannelInference(t *testing.T) {
	resetPricingEndpointTestTables(t)

	insertPricingEndpointChannel(t, 104, constant.ChannelTypeAdvancedCustom, pricingEndpointAdvancedCustomConfig(
		dto.AdvancedCustomRoute{
			IncomingPath: "/v1/responses",
			UpstreamPath: "/v1beta/models/{model}:generateContent",
			Converter:    "openai_responses_to_gemini_generate_content",
			Models:       []string{"re:^gemini-"},
		},
	))
	insertPricingEndpointBinding(t, 104, "metadata-only-model")
	require.NoError(t, DB.Model(&Model{}).Where("model_name = ?", "metadata-only-model").Updates(&Model{
		Endpoints: `{
			"openai": "/v1/chat/completions"
		}`,
		Status:   1,
		NameRule: NameRuleExact,
	}).Error)

	byModel := pricingEndpointTypesByModel(t)

	assert.Equal(t, []constant.EndpointType{constant.EndpointTypeOpenAI}, byModel["metadata-only-model"])
}

func TestPricingMissingCatalogEndpointsStayEmpty(t *testing.T) {
	resetPricingEndpointTestTables(t)

	insertPricingEndpointChannel(t, 102, constant.ChannelTypeAdvancedCustom, dto.ChannelOtherSettings{})
	insertPricingEndpointBinding(t, 102, "gpt-4o")

	byModel := pricingEndpointTypesByModel(t)

	assert.Empty(t, byModel["gpt-4o"])
}

func TestPricingNativeChannelDoesNotInferEndpointTypes(t *testing.T) {
	resetPricingEndpointTestTables(t)

	insertPricingEndpointChannel(t, 201, constant.ChannelTypeOpenAI, dto.ChannelOtherSettings{})
	insertPricingEndpointChannel(t, 202, constant.ChannelTypeGemini, dto.ChannelOtherSettings{})
	insertPricingEndpointChannel(t, 203, constant.ChannelTypeBifrost, dto.ChannelOtherSettings{})
	insertPricingEndpointBinding(t, 201, "gpt-4o")
	insertPricingEndpointBinding(t, 202, "gemini-2.5-flash")
	insertPricingEndpointBinding(t, 203, "claude-3-5-sonnet")

	byModel := pricingEndpointTypesByModel(t)

	assert.Empty(t, byModel["gpt-4o"])
	assert.Empty(t, byModel["gemini-2.5-flash"])
	assert.Empty(t, byModel["claude-3-5-sonnet"])
}

func TestPricingRequiresPublishedCatalogModelAndExposesCapabilities(t *testing.T) {
	resetPricingEndpointTestTables(t)

	insertPricingEndpointChannel(t, 204, constant.ChannelTypeOpenAI, dto.ChannelOtherSettings{})
	insertPricingEndpointBinding(t, 204, "catalog-model")
	require.NoError(t, DB.Model(&Model{}).Where("model_name = ?", "catalog-model").Updates(map[string]any{
		"input_modalities":  CatalogStringList{"text", "image"},
		"output_modalities": CatalogStringList{"text"},
		"capabilities":      CatalogStringList{"function_calling", "reasoning", "caching"},
		"context_length":    128000,
		"max_output_tokens": 16384,
	}).Error)

	InitChannelCache()
	pricing := GetPricing()
	require.Len(t, pricing, 1)
	assert.Equal(t, "catalog-model", pricing[0].ModelName)
	assert.Equal(t, []string{"text", "image"}, pricing[0].InputModalities)
	assert.Equal(t, []string{"text"}, pricing[0].OutputModalities)
	assert.Equal(t, []string{"function_calling", "reasoning", "caching"}, pricing[0].Capabilities)
	assert.Equal(t, 128000, pricing[0].ContextLength)
	assert.Equal(t, 16384, pricing[0].MaxOutputTokens)
	assert.True(t, IsModelCatalogVisible("catalog-model"))
	assert.False(t, IsModelCatalogVisible("uncataloged-model"))
}

func TestChannelInsertDoesNotCreateCatalogModels(t *testing.T) {
	resetPricingEndpointTestTables(t)

	channel := &Channel{
		Id:     205,
		Type:   constant.ChannelTypeOpenAI,
		Key:    "key-205",
		Status: common.ChannelStatusEnabled,
		Name:   "channel-205",
		Group:  "default",
		Models: "missing-catalog-model",
	}

	require.NoError(t, channel.Insert())

	var count int64
	require.NoError(t, DB.Model(&Model{}).Where("model_name = ?", "missing-catalog-model").Count(&count).Error)
	assert.Zero(t, count)
}

func TestPricingDisplayUsesCurrentBillingRatioImmediately(t *testing.T) {
	resetPricingEndpointTestTables(t)
	originalRatios, err := common.Marshal(ratio_setting.GetModelRatioCopy())
	require.NoError(t, err)
	require.NoError(t, DB.AutoMigrate(&Option{}))
	common.OptionMapRWMutex.Lock()
	originalOptionMap := common.OptionMap
	if common.OptionMap == nil {
		common.OptionMap = make(map[string]string)
	}
	common.OptionMapRWMutex.Unlock()
	t.Cleanup(func() {
		require.NoError(t, UpdateOption("ModelRatio", string(originalRatios)))
		common.OptionMapRWMutex.Lock()
		common.OptionMap = originalOptionMap
		common.OptionMapRWMutex.Unlock()
	})

	insertPricingEndpointChannel(t, 206, constant.ChannelTypeOpenAI, dto.ChannelOtherSettings{})
	insertPricingEndpointBinding(t, 206, "sku-price-model")
	customRatio := 7.0
	require.NoError(t, DB.Create(&Model{
		ModelName:   "independent-row-price",
		Status:      1,
		NameRule:    NameRuleExact,
		PricingMode: ModelPricingModePerToken,
		ModelRatio:  &customRatio,
	}).Error)
	InitChannelCache()
	require.Len(t, GetPricing(), 1)

	require.NoError(t, UpdateOption("ModelRatio", `{"sku-price-model":4}`))

	pricing := GetPricing()
	require.Len(t, pricing, 1)
	var catalogModel Model
	require.NoError(t, DB.Where("model_name = ?", "sku-price-model").First(&catalogModel).Error)
	assert.Equal(t, ModelPricingModePerToken, catalogModel.PricingMode)
	require.NotNil(t, catalogModel.ModelRatio)
	assert.Equal(t, 4.0, *catalogModel.ModelRatio)
	var independentModel Model
	require.NoError(t, DB.Where("model_name = ?", "independent-row-price").First(&independentModel).Error)
	assert.Equal(t, ModelPricingModePerToken, independentModel.PricingMode)
	require.NotNil(t, independentModel.ModelRatio)
	assert.Equal(t, 7.0, *independentModel.ModelRatio)
	billingRatio, _, _ := ratio_setting.GetModelRatio("sku-price-model")
	assert.Equal(t, billingRatio, pricing[0].ModelRatio)
	assert.Equal(t, 4.0, pricing[0].ModelRatio)

	catalogModel.PricingMode = ""
	require.NoError(t, catalogModel.NormalizePricing())
	require.NoError(t, catalogModel.Update())
	RefreshCatalogPricingCache()
	assert.False(t, ResolveModelPricing("sku-price-model").Configured)
}

func TestCatalogPricingOverridesLegacyOptionForDisplayAndBilling(t *testing.T) {
	resetPricingEndpointTestTables(t)
	insertPricingEndpointChannel(t, 207, constant.ChannelTypeOpenAI, dto.ChannelOtherSettings{})
	insertPricingEndpointBinding(t, 207, "catalog-priced-model")
	require.NoError(t, DB.Model(&Model{}).Where("model_name = ?", "catalog-priced-model").Updates(map[string]any{
		"pricing_mode":     ModelPricingModePerToken,
		"model_ratio":      3.5,
		"completion_ratio": 2.0,
		"cache_ratio":      0.25,
	}).Error)

	InitChannelCache()
	RefreshCatalogPricingCache()

	resolved := ResolveModelPricing("catalog-priced-model")
	assert.True(t, resolved.Configured)
	assert.Equal(t, ModelPricingModePerToken, resolved.Mode)
	assert.Equal(t, 3.5, resolved.ModelRatio)
	assert.Equal(t, 2.0, resolved.CompletionRatio)
	assert.Equal(t, 0.25, resolved.CacheRatio)

	pricing := GetPricing()
	require.Len(t, pricing, 1)
	assert.Equal(t, 3.5, pricing[0].ModelRatio)
	assert.Equal(t, 2.0, pricing[0].CompletionRatio)
	require.NotNil(t, pricing[0].CacheRatio)
	assert.Equal(t, 0.25, *pricing[0].CacheRatio)
}

func TestEnsureCatalogModelsCreatesOnlyMissingExactNames(t *testing.T) {
	resetPricingEndpointTestTables(t)
	require.NoError(t, DB.Create(&Model{
		ModelName: "already-cataloged",
		Status:    1,
		NameRule:  NameRuleExact,
	}).Error)

	created, err := EnsureCatalogModels([]string{" already-cataloged ", "new-catalog-model", "new-catalog-model", ""})

	require.NoError(t, err)
	assert.Equal(t, []string{"new-catalog-model"}, created)
	var count int64
	require.NoError(t, DB.Model(&Model{}).Where("model_name IN ?", []string{"already-cataloged", "new-catalog-model"}).Count(&count).Error)
	assert.Equal(t, int64(2), count)
}

func TestNormalizeCatalogMetadataRejectsUnknownValues(t *testing.T) {
	catalogModel := &Model{
		InputModalities: CatalogStringList{" Text ", "image", "image"},
		Capabilities:    CatalogStringList{"function_calling", "telepathy"},
	}

	err := catalogModel.NormalizeCatalogMetadata()

	require.Error(t, err)
	assert.Equal(t, CatalogStringList{"text", "image"}, catalogModel.InputModalities)
}

func TestNormalizeCatalogMetadataRejectsNegativeTokenLimits(t *testing.T) {
	catalogModel := &Model{ContextLength: -1}

	err := catalogModel.NormalizeCatalogMetadata()

	require.Error(t, err)
	assert.Contains(t, err.Error(), "context_length")

	catalogModel = &Model{MaxOutputTokens: -8}
	err = catalogModel.NormalizeCatalogMetadata()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "max_output_tokens")
}

func TestNormalizePricingRejectsNegativeCatalogPrice(t *testing.T) {
	negative := -0.01
	catalogModel := &Model{
		PricingMode: ModelPricingModePerRequest,
		ModelPrice:  &negative,
	}

	err := catalogModel.NormalizePricing()

	require.Error(t, err)
	assert.Contains(t, err.Error(), "model_price")
}

func TestCatalogPricingSyncOverlayIncludesExplicitUnpricedModels(t *testing.T) {
	resetPricingEndpointTestTables(t)
	modelRatio := 2.5
	completionRatio := 3.0
	priced := &Model{
		ModelName:       "sync-priced-model",
		Status:          1,
		NameRule:        NameRuleExact,
		PricingMode:     ModelPricingModePerToken,
		ModelRatio:      &modelRatio,
		CompletionRatio: &completionRatio,
	}
	require.NoError(t, priced.NormalizePricing())
	require.NoError(t, priced.Insert())
	unpriced := &Model{
		ModelName: "sync-unpriced-model",
		Status:    1,
		NameRule:  NameRuleExact,
	}
	require.NoError(t, unpriced.NormalizePricing())
	require.NoError(t, unpriced.Insert())

	modelNames, overlay, err := GetCatalogPricingSyncOverlay()

	require.NoError(t, err)
	assert.ElementsMatch(t, []string{"sync-priced-model", "sync-unpriced-model"}, modelNames)
	assert.Equal(t, 2.5, overlay["model_ratio"]["sync-priced-model"])
	assert.Equal(t, 3.0, overlay["completion_ratio"]["sync-priced-model"])
	_, hasUnpricedRatio := overlay["model_ratio"]["sync-unpriced-model"]
	assert.False(t, hasUnpricedRatio)

	optionValues, err := GetEffectivePricingOptionValues()
	require.NoError(t, err)
	var effectiveRatios map[string]float64
	require.NoError(t, common.UnmarshalJsonStr(optionValues["ModelRatio"], &effectiveRatios))
	assert.Equal(t, 2.5, effectiveRatios["sync-priced-model"])
	_, hasUnpricedRatio = effectiveRatios["sync-unpriced-model"]
	assert.False(t, hasUnpricedRatio)
}

func TestRenamingCatalogModelUpdatesChannelBindings(t *testing.T) {
	resetPricingEndpointTestTables(t)
	insertPricingEndpointChannel(t, 208, constant.ChannelTypeOpenAI, dto.ChannelOtherSettings{})
	insertPricingEndpointBinding(t, 208, "old-sku-name")
	require.NoError(t, DB.Model(&Channel{}).Where("id = ?", 208).Update("models", "old-sku-name").Error)

	var catalogModel Model
	require.NoError(t, DB.Where("model_name = ?", "old-sku-name").First(&catalogModel).Error)
	catalogModel.ModelName = "new-sku-name"
	require.NoError(t, catalogModel.Update())

	var binding ModelBinding
	require.NoError(t, DB.Where("model_id = ? AND channel_id = ?", catalogModel.Id, 208).First(&binding).Error)
	assert.Equal(t, catalogModel.Id, binding.ModelId)
	var channel Channel
	require.NoError(t, DB.First(&channel, 208).Error)
	assert.Equal(t, "new-sku-name", channel.Models)
}

func TestDeletingBoundCatalogModelIsRejected(t *testing.T) {
	resetPricingEndpointTestTables(t)
	insertPricingEndpointChannel(t, 209, constant.ChannelTypeOpenAI, dto.ChannelOtherSettings{})
	insertPricingEndpointBinding(t, 209, "bound-sku")

	var catalogModel Model
	require.NoError(t, DB.Where("model_name = ?", "bound-sku").First(&catalogModel).Error)

	err := catalogModel.Delete()

	require.Error(t, err)
	assert.Contains(t, err.Error(), "still bound")
	var count int64
	require.NoError(t, DB.Model(&Model{}).Where("model_name = ?", "bound-sku").Count(&count).Error)
	assert.Equal(t, int64(1), count)
}

func TestExplicitModelBindingsDriveChannelSelection(t *testing.T) {
	resetPricingEndpointTestTables(t)
	insertPricingEndpointChannel(t, 210, constant.ChannelTypeOpenAI, dto.ChannelOtherSettings{})
	insertPricingEndpointChannel(t, 211, constant.ChannelTypeOpenAI, dto.ChannelOtherSettings{})
	require.NoError(t, DB.Model(&Channel{}).Where("id = ?", 210).Update("models", "public-sku").Error)
	require.NoError(t, DB.Model(&Channel{}).Where("id = ?", 211).Update("models", "public-sku").Error)
	catalogModel := &Model{
		ModelName: "public-sku",
		Status:    1,
		NameRule:  NameRuleExact,
	}
	require.NoError(t, catalogModel.Insert())

	require.NoError(t, ReplaceModelBindings(catalogModel.Id, []ModelBindingInput{
		{ChannelId: 210, Enabled: true, Priority: 0},
		{ChannelId: 211, Enabled: true, Priority: 10},
	}))

	selected, err := GetRandomSatisfiedChannel("default", "public-sku", 0, "/v1/chat/completions")
	require.NoError(t, err)
	require.NotNil(t, selected)
	assert.Equal(t, 211, selected.Id)
}

func TestBindingPriorityIgnoresChannelPriority(t *testing.T) {
	resetPricingEndpointTestTables(t)
	insertPricingEndpointChannel(t, 230, constant.ChannelTypeOpenAI, dto.ChannelOtherSettings{})
	insertPricingEndpointChannel(t, 231, constant.ChannelTypeOpenAI, dto.ChannelOtherSettings{})
	require.NoError(t, DB.Model(&Channel{}).Where("id = ?", 230).Update("models", "priority-sku").Error)
	require.NoError(t, DB.Model(&Channel{}).Where("id = ?", 231).Update("models", "priority-sku").Error)
	highChannelPriority := int64(99)
	require.NoError(t, DB.Model(&Channel{}).Where("id = ?", 230).Update("priority", highChannelPriority).Error)

	catalogModel := &Model{
		ModelName: "priority-sku",
		Status:    1,
		NameRule:  NameRuleExact,
	}
	require.NoError(t, catalogModel.Insert())
	require.NoError(t, ReplaceModelBindings(catalogModel.Id, []ModelBindingInput{
		{ChannelId: 230, Enabled: true, Priority: 1},
		{ChannelId: 231, Enabled: true, Priority: 5},
	}))

	selected, err := GetRandomSatisfiedChannel("default", "priority-sku", 0, "/v1/chat/completions")
	require.NoError(t, err)
	require.NotNil(t, selected)
	assert.Equal(t, 231, selected.Id)
}

func TestBindingWeightIgnoresChannelWeight(t *testing.T) {
	resetPricingEndpointTestTables(t)
	insertPricingEndpointChannel(t, 250, constant.ChannelTypeOpenAI, dto.ChannelOtherSettings{})
	insertPricingEndpointChannel(t, 251, constant.ChannelTypeOpenAI, dto.ChannelOtherSettings{})
	require.NoError(t, DB.Model(&Channel{}).Where("id = ?", 250).Updates(map[string]any{
		"models": "weight-sku",
		"weight": 999,
	}).Error)
	require.NoError(t, DB.Model(&Channel{}).Where("id = ?", 251).Updates(map[string]any{
		"models": "weight-sku",
		"weight": 0,
	}).Error)

	catalogModel := &Model{
		ModelName: "weight-sku",
		Status:    1,
		NameRule:  NameRuleExact,
	}
	require.NoError(t, catalogModel.Insert())
	require.NoError(t, ReplaceModelBindings(catalogModel.Id, []ModelBindingInput{
		{ChannelId: 250, Enabled: true, Priority: 1, Weight: 0},
		{ChannelId: 251, Enabled: true, Priority: 1, Weight: 10},
	}))

	selected, err := GetRandomSatisfiedChannel("default", "weight-sku", 0, "/v1/chat/completions")
	require.NoError(t, err)
	require.NotNil(t, selected)
	assert.Equal(t, 251, selected.Id)
}

func TestBindingPriorityBeatsWeight(t *testing.T) {
	resetPricingEndpointTestTables(t)
	insertPricingEndpointChannel(t, 260, constant.ChannelTypeOpenAI, dto.ChannelOtherSettings{})
	insertPricingEndpointChannel(t, 261, constant.ChannelTypeOpenAI, dto.ChannelOtherSettings{})
	require.NoError(t, DB.Model(&Channel{}).Where("id = ?", 260).Update("models", "priority-beats-weight-sku").Error)
	require.NoError(t, DB.Model(&Channel{}).Where("id = ?", 261).Update("models", "priority-beats-weight-sku").Error)

	catalogModel := &Model{
		ModelName: "priority-beats-weight-sku",
		Status:    1,
		NameRule:  NameRuleExact,
	}
	require.NoError(t, catalogModel.Insert())
	require.NoError(t, ReplaceModelBindings(catalogModel.Id, []ModelBindingInput{
		{ChannelId: 260, Enabled: true, Priority: 1, Weight: 1000},
		{ChannelId: 261, Enabled: true, Priority: 10, Weight: 0},
	}))

	selected, err := GetRandomSatisfiedChannel("default", "priority-beats-weight-sku", 0, "/v1/chat/completions")
	require.NoError(t, err)
	require.NotNil(t, selected)
	assert.Equal(t, 261, selected.Id)
}

func TestChannelGroupFiltersBindingSelection(t *testing.T) {
	resetPricingEndpointTestTables(t)
	insertPricingEndpointChannel(t, 270, constant.ChannelTypeOpenAI, dto.ChannelOtherSettings{})
	insertPricingEndpointChannel(t, 271, constant.ChannelTypeOpenAI, dto.ChannelOtherSettings{})
	require.NoError(t, DB.Model(&Channel{}).Where("id = ?", 270).Updates(map[string]any{
		"models": "group-filter-sku",
		"group":  "vip",
	}).Error)
	require.NoError(t, DB.Model(&Channel{}).Where("id = ?", 271).Updates(map[string]any{
		"models": "group-filter-sku",
		"group":  "default",
	}).Error)

	catalogModel := &Model{
		ModelName: "group-filter-sku",
		Status:    1,
		NameRule:  NameRuleExact,
	}
	require.NoError(t, catalogModel.Insert())
	require.NoError(t, ReplaceModelBindings(catalogModel.Id, []ModelBindingInput{
		{ChannelId: 270, Enabled: true, Priority: 1},
		{ChannelId: 271, Enabled: true, Priority: 1},
	}))

	selected, err := GetRandomSatisfiedChannel("default", "group-filter-sku", 0, "/v1/chat/completions")
	require.NoError(t, err)
	require.NotNil(t, selected)
	assert.Equal(t, 271, selected.Id)

	selected, err = GetRandomSatisfiedChannel("vip", "group-filter-sku", 0, "/v1/chat/completions")
	require.NoError(t, err)
	require.NotNil(t, selected)
	assert.Equal(t, 270, selected.Id)
}

func TestEmptyChannelGroupServesDefault(t *testing.T) {
	resetPricingEndpointTestTables(t)
	insertPricingEndpointChannel(t, 280, constant.ChannelTypeOpenAI, dto.ChannelOtherSettings{})
	require.NoError(t, DB.Model(&Channel{}).Where("id = ?", 280).Updates(map[string]any{
		"models": "empty-group-sku",
		"group":  "",
	}).Error)

	catalogModel := &Model{
		ModelName: "empty-group-sku",
		Status:    1,
		NameRule:  NameRuleExact,
	}
	require.NoError(t, catalogModel.Insert())
	require.NoError(t, ReplaceModelBindings(catalogModel.Id, []ModelBindingInput{
		{ChannelId: 280, Enabled: true},
	}))

	selected, err := GetRandomSatisfiedChannel("default", "empty-group-sku", 0, "/v1/chat/completions")
	require.NoError(t, err)
	require.NotNil(t, selected)
	assert.Equal(t, 280, selected.Id)

	selected, err = GetRandomSatisfiedChannel("vip", "empty-group-sku", 0, "/v1/chat/completions")
	require.NoError(t, err)
	assert.Nil(t, selected)
}

func TestBindingGroupsAreIgnoredForChannelSelection(t *testing.T) {
	resetPricingEndpointTestTables(t)
	insertPricingEndpointChannel(t, 290, constant.ChannelTypeOpenAI, dto.ChannelOtherSettings{})
	require.NoError(t, DB.Model(&Channel{}).Where("id = ?", 290).Updates(map[string]any{
		"models": "ignore-binding-group-sku",
		"group":  "default",
	}).Error)

	catalogModel := &Model{
		ModelName: "ignore-binding-group-sku",
		Status:    1,
		NameRule:  NameRuleExact,
	}
	require.NoError(t, catalogModel.Insert())
	require.NoError(t, ReplaceModelBindings(catalogModel.Id, []ModelBindingInput{
		{ChannelId: 290, Enabled: true},
	}))
	require.NoError(t, DB.Model(&ModelBinding{}).
		Where("model_id = ? AND channel_id = ?", catalogModel.Id, 290).
		Update("groups", "vip").Error)

	selected, err := GetRandomSatisfiedChannel("default", "ignore-binding-group-sku", 0, "/v1/chat/completions")
	require.NoError(t, err)
	require.NotNil(t, selected)
	assert.Equal(t, 290, selected.Id)

	selected, err = GetRandomSatisfiedChannel("vip", "ignore-binding-group-sku", 0, "/v1/chat/completions")
	require.NoError(t, err)
	assert.Nil(t, selected)
}

func TestReplaceModelBindingsRejectsDuplicateChannel(t *testing.T) {
	resetPricingEndpointTestTables(t)
	insertPricingEndpointChannel(t, 220, constant.ChannelTypeOpenAI, dto.ChannelOtherSettings{})
	require.NoError(t, DB.Model(&Channel{}).Where("id = ?", 220).Update("models", "multi-upstream-sku").Error)
	catalogModel := &Model{
		ModelName: "multi-upstream-sku",
		Status:    1,
		NameRule:  NameRuleExact,
	}
	require.NoError(t, catalogModel.Insert())

	err := ReplaceModelBindings(catalogModel.Id, []ModelBindingInput{
		{ChannelId: 220, Enabled: true},
		{ChannelId: 220, Enabled: true},
	})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "bound more than once")
}

func TestReplaceModelBindingsRejectsModelOutsideChannelModels(t *testing.T) {
	resetPricingEndpointTestTables(t)
	insertPricingEndpointChannel(t, 240, constant.ChannelTypeOpenAI, dto.ChannelOtherSettings{})
	require.NoError(t, DB.Model(&Channel{}).Where("id = ?", 240).Update("models", "allowed-sku").Error)

	catalogModel := &Model{
		ModelName: "restricted-sku",
		Status:    1,
		NameRule:  NameRuleExact,
	}
	require.NoError(t, catalogModel.Insert())

	err := ReplaceModelBindings(catalogModel.Id, []ModelBindingInput{
		{ChannelId: 240, Enabled: true},
	})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "not in channel 240 restricted models")

	require.NoError(t, DB.Model(&Channel{}).Where("id = ?", 240).Update("models", "restricted-sku").Error)
	require.NoError(t, ReplaceModelBindings(catalogModel.Id, []ModelBindingInput{
		{ChannelId: 240, Enabled: true},
	}))
}

func TestReplaceModelBindingsUsesChannelUpstreamModel(t *testing.T) {
	resetPricingEndpointTestTables(t)
	insertPricingEndpointChannel(t, 250, constant.ChannelTypeOpenAI, dto.ChannelOtherSettings{})
	require.NoError(t, DB.Model(&Channel{}).Where("id = ?", 250).Update("models", "deepseek-v4-pro").Error)

	catalogModel := &Model{
		ModelName: "my-alias",
		Status:    1,
		NameRule:  NameRuleExact,
	}
	require.NoError(t, catalogModel.Insert())

	err := ReplaceModelBindings(catalogModel.Id, []ModelBindingInput{
		{ChannelId: 250, Enabled: true},
	})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "not in channel 250 restricted models")

	require.NoError(t, ReplaceModelBindings(catalogModel.Id, []ModelBindingInput{
		{ChannelId: 250, Enabled: true, UpstreamModel: "deepseek-v4-pro"},
	}))

	bindings, err := GetModelBindings(catalogModel.Id)
	require.NoError(t, err)
	require.Len(t, bindings, 1)
	assert.Equal(t, "deepseek-v4-pro", bindings[0].UpstreamModel)
	assert.Equal(t, "deepseek-v4-pro", GetBindingUpstreamModel("my-alias", 250))
}

func TestInvalidatePricingCacheRefreshesCatalogEndpoints(t *testing.T) {
	resetPricingEndpointTestTables(t)

	insertPricingEndpointChannel(t, 301, constant.ChannelTypeOpenAI, dto.ChannelOtherSettings{})
	insertPricingEndpointBinding(t, 301, "gemini-3.5-flash")

	initial := pricingEndpointTypesByModel(t)
	require.Empty(t, initial["gemini-3.5-flash"])

	require.NoError(t, DB.Model(&Model{}).Where("model_name = ?", "gemini-3.5-flash").Update("endpoints", `{
		"openai": "/v1/chat/completions",
		"openai-response": "/v1/responses"
	}`).Error)

	cached := pricingEndpointTypesFromPricing(GetPricing())
	require.Empty(t, cached["gemini-3.5-flash"])

	InvalidatePricingCache()
	updated := pricingEndpointTypesFromPricing(GetPricing())
	assert.Equal(t, []constant.EndpointType{
		constant.EndpointTypeOpenAI,
		constant.EndpointTypeOpenAIResponse,
	}, updated["gemini-3.5-flash"])
}

func TestCatalogEndpointsDoNotDependOnChannelCache(t *testing.T) {
	resetPricingEndpointTestTables(t)

	insertPricingEndpointChannel(t, 302, constant.ChannelTypeAdvancedCustom, pricingEndpointAdvancedCustomConfig(
		dto.AdvancedCustomRoute{
			IncomingPath: "/v1/responses",
			UpstreamPath: "/v1beta/models/{model}:generateContent",
			Converter:    "openai_responses_to_gemini_generate_content",
			Models:       []string{"re:^gemini-"},
		},
	))
	insertPricingEndpointBinding(t, 302, "gemini-3.5-flash")
	require.NoError(t, DB.Model(&Model{}).Where("model_name = ?", "gemini-3.5-flash").Update("endpoints", `{
		"openai": "/v1/chat/completions"
	}`).Error)
	InvalidatePricingCache()

	beforeCache := pricingEndpointTypesFromPricing(GetPricing())
	require.Equal(t, []constant.EndpointType{constant.EndpointTypeOpenAI}, beforeCache["gemini-3.5-flash"])

	InitChannelCache()

	afterCache := pricingEndpointTypesFromPricing(GetPricing())
	assert.Equal(t, []constant.EndpointType{constant.EndpointTypeOpenAI}, afterCache["gemini-3.5-flash"])
}

func TestCacheUpdateChannelSyncsAdvancedCustomConfig(t *testing.T) {
	resetPricingEndpointTestTables(t)

	channel := &Channel{
		Id:     401,
		Type:   constant.ChannelTypeAdvancedCustom,
		Key:    "key-401",
		Status: common.ChannelStatusEnabled,
		Name:   "channel-401",
	}
	channel.SetOtherSettings(pricingEndpointAdvancedCustomConfig(dto.AdvancedCustomRoute{
		IncomingPath: "/v1/responses",
		UpstreamPath: "/v1beta/models/{model}:generateContent",
		Converter:    "openai_responses_to_gemini_generate_content",
	}))
	CacheUpdateChannel(channel)

	require.NotNil(t, channel2advancedCustomConfig[401])
	assert.Equal(t, []constant.EndpointType{constant.EndpointTypeOpenAIResponse}, channel2advancedCustomConfig[401].SupportedEndpointTypesForModel("gemini-3.5-flash"))

	channel.SetOtherSettings(pricingEndpointAdvancedCustomConfig(dto.AdvancedCustomRoute{
		IncomingPath: "/v1/chat/completions",
		UpstreamPath: "/v1/chat/completions",
	}))
	CacheUpdateChannel(channel)

	require.NotNil(t, channel2advancedCustomConfig[401])
	assert.Equal(t, []constant.EndpointType{constant.EndpointTypeOpenAI}, channel2advancedCustomConfig[401].SupportedEndpointTypesForModel("gemini-3.5-flash"))

	channel.Type = constant.ChannelTypeOpenAI
	CacheUpdateChannel(channel)

	assert.Nil(t, channel2advancedCustomConfig[401])
}
