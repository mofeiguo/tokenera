package model

import (
	"strings"

	"github.com/QuantumNous/new-api/setting/billing_setting"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
)

const (
	ModelPricingModePerToken   = "per_token"
	ModelPricingModePerRequest = "per_request"
)

type ResolvedModelPricing struct {
	Mode                 string
	ModelPrice           float64
	ModelRatio           float64
	CompletionRatio      float64
	CacheRatio           float64
	CreateCacheRatio     float64
	ImageRatio           float64
	AudioRatio           float64
	AudioCompletionRatio float64
	HasCacheRatio        bool
	HasCreateCacheRatio  bool
	HasImageRatio        bool
	HasAudioRatio        bool
	HasAudioCompletion   bool
	BillingMode          string
	BillingExpr          string
	Configured           bool
}

func ResolveModelPricing(modelName string) ResolvedModelPricing {
	return withTieredPricing(modelName, resolveGlobalModelPricing(modelName))
}

func resolveGlobalModelPricing(modelName string) ResolvedModelPricing {
	pricing := ResolvedModelPricing{}
	if price, found := ratio_setting.GetModelPrice(modelName, false); found {
		pricing.Mode = ModelPricingModePerRequest
		pricing.ModelPrice = price
		pricing.Configured = true
		return pricing
	}
	ratio, found, _ := ratio_setting.GetModelRatio(modelName)
	pricing.Mode = ModelPricingModePerToken
	pricing.ModelRatio = ratio
	pricing.Configured = found
	pricing.CompletionRatio = ratio_setting.GetCompletionRatio(modelName)
	pricing.CacheRatio, pricing.HasCacheRatio = ratio_setting.GetCacheRatio(modelName)
	pricing.CreateCacheRatio, pricing.HasCreateCacheRatio = ratio_setting.GetCreateCacheRatio(modelName)
	pricing.ImageRatio, pricing.HasImageRatio = ratio_setting.GetImageRatio(modelName)
	if ratio_setting.ContainsAudioRatio(modelName) {
		pricing.AudioRatio = ratio_setting.GetAudioRatio(modelName)
		pricing.HasAudioRatio = true
	}
	if ratio_setting.ContainsAudioCompletionRatio(modelName) {
		pricing.AudioCompletionRatio = ratio_setting.GetAudioCompletionRatio(modelName)
		pricing.HasAudioCompletion = true
	}
	return pricing
}

func withTieredPricing(modelName string, pricing ResolvedModelPricing) ResolvedModelPricing {
	if billing_setting.GetBillingMode(modelName) != billing_setting.BillingModeTieredExpr {
		return pricing
	}
	expr, ok := billing_setting.GetBillingExpr(modelName)
	if !ok || strings.TrimSpace(expr) == "" {
		return pricing
	}
	pricing.BillingMode = billing_setting.BillingModeTieredExpr
	pricing.BillingExpr = expr
	pricing.Configured = true
	return pricing
}
