package model

import (
	"fmt"
	"math"
	"strings"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting/billing_setting"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
	"gorm.io/gorm"
)

const (
	ModelPricingModePerToken   = "per_token"
	ModelPricingModePerRequest = "per_request"
	modelPricingSourceCatalog  = "catalog"
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

var catalogPricingSyncFields = []string{
	"model_ratio",
	"completion_ratio",
	"cache_ratio",
	"create_cache_ratio",
	"image_ratio",
	"audio_ratio",
	"audio_completion_ratio",
	"model_price",
}

var (
	catalogPricingMu    sync.RWMutex
	catalogPricingCache = map[string]ResolvedModelPricing{}
	catalogPricingAt    time.Time
	catalogPricingLoad  sync.Mutex
)

func (mi *Model) NormalizePricing() error {
	mi.PricingSource = modelPricingSourceCatalog
	switch mi.PricingMode {
	case "":
		mi.ModelPrice = nil
		mi.ModelRatio = nil
		mi.CompletionRatio = nil
		mi.CacheRatio = nil
		mi.CreateCacheRatio = nil
		mi.ImageRatio = nil
		mi.AudioRatio = nil
		mi.AudioCompletionRatio = nil
	case ModelPricingModePerRequest:
		if mi.ModelPrice == nil {
			return fmt.Errorf("model_price is required for per-request pricing")
		}
		mi.ModelRatio = nil
	case ModelPricingModePerToken:
		if mi.ModelRatio == nil {
			return fmt.Errorf("model_ratio is required for per-token pricing")
		}
		mi.ModelPrice = nil
	default:
		return fmt.Errorf("unsupported pricing_mode %q", mi.PricingMode)
	}
	values := map[string]*float64{
		"model_price":            mi.ModelPrice,
		"model_ratio":            mi.ModelRatio,
		"completion_ratio":       mi.CompletionRatio,
		"cache_ratio":            mi.CacheRatio,
		"create_cache_ratio":     mi.CreateCacheRatio,
		"image_ratio":            mi.ImageRatio,
		"audio_ratio":            mi.AudioRatio,
		"audio_completion_ratio": mi.AudioCompletionRatio,
	}
	for field, value := range values {
		if value != nil && (*value < 0 || math.IsNaN(*value) || math.IsInf(*value, 0)) {
			return fmt.Errorf("%s must be a finite non-negative number", field)
		}
	}
	return nil
}

func RefreshCatalogPricingCache() {
	if DB == nil {
		return
	}
	var catalogModels []Model
	_ = DB.Select(
		"model_name", "pricing_mode", "pricing_source", "model_price", "model_ratio", "completion_ratio",
		"cache_ratio", "create_cache_ratio", "image_ratio", "audio_ratio", "audio_completion_ratio",
	).Find(&catalogModels).Error

	next := make(map[string]ResolvedModelPricing, len(catalogModels))
	for i := range catalogModels {
		if pricing, ok := resolveStoredModelPricing(&catalogModels[i]); ok {
			next[catalogModels[i].ModelName] = pricing
		}
	}
	catalogPricingMu.Lock()
	catalogPricingCache = next
	catalogPricingAt = time.Now()
	catalogPricingMu.Unlock()
}

func resolveStoredModelPricing(catalogModel *Model) (ResolvedModelPricing, bool) {
	pricing := ResolvedModelPricing{Mode: catalogModel.PricingMode}
	switch catalogModel.PricingMode {
	case ModelPricingModePerRequest:
		if catalogModel.ModelPrice == nil {
			return ResolvedModelPricing{}, false
		}
		pricing.ModelPrice = *catalogModel.ModelPrice
	case ModelPricingModePerToken:
		if catalogModel.ModelRatio == nil {
			return ResolvedModelPricing{}, false
		}
		pricing.ModelRatio = *catalogModel.ModelRatio
		pricing.CompletionRatio = valueOr(catalogModel.CompletionRatio, 1)
		pricing.CacheRatio, pricing.HasCacheRatio = pointerValue(catalogModel.CacheRatio)
		pricing.CreateCacheRatio, pricing.HasCreateCacheRatio = pointerValue(catalogModel.CreateCacheRatio)
		pricing.ImageRatio, pricing.HasImageRatio = pointerValue(catalogModel.ImageRatio)
		pricing.AudioRatio, pricing.HasAudioRatio = pointerValue(catalogModel.AudioRatio)
		pricing.AudioCompletionRatio, pricing.HasAudioCompletion = pointerValue(catalogModel.AudioCompletionRatio)
	default:
		return pricing, catalogModel.PricingSource == modelPricingSourceCatalog
	}
	pricing.Configured = true
	return pricing, true
}

func ResolveModelPricing(modelName string) ResolvedModelPricing {
	maybeRefreshCatalogPricingCache()
	catalogPricingMu.RLock()
	pricing, ok := catalogPricingCache[modelName]
	catalogPricingMu.RUnlock()
	if ok {
		return withTieredPricing(modelName, pricing)
	}

	pricing = resolveLegacyModelPricing(modelName)
	return withTieredPricing(modelName, pricing)
}

func maybeRefreshCatalogPricingCache() {
	if DB == nil {
		return
	}
	catalogPricingMu.RLock()
	fresh := time.Since(catalogPricingAt) < time.Minute
	catalogPricingMu.RUnlock()
	if fresh {
		return
	}
	catalogPricingLoad.Lock()
	defer catalogPricingLoad.Unlock()
	catalogPricingMu.RLock()
	fresh = time.Since(catalogPricingAt) < time.Minute
	catalogPricingMu.RUnlock()
	if !fresh {
		RefreshCatalogPricingCache()
	}
}

func resolveLegacyModelPricing(modelName string) ResolvedModelPricing {
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

func MigrateCatalogPricingFromSettings() error {
	var catalogModels []Model
	if err := DB.Where("pricing_source = ? OR pricing_source IS NULL", "").Find(&catalogModels).Error; err != nil {
		return err
	}
	err := DB.Transaction(func(tx *gorm.DB) error {
		for i := range catalogModels {
			pricing := resolveLegacyModelPricing(catalogModels[i].ModelName)
			updates := emptyPricingUpdateMap()
			if pricing.Configured {
				for key, value := range pricingUpdateMap(pricing) {
					updates[key] = value
				}
			}
			if err := tx.Model(&Model{}).Where("id = ?", catalogModels[i].Id).Updates(updates).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err == nil {
		RefreshCatalogPricingCache()
	}
	return err
}

func captureLegacyCatalogPricing() (map[string]ResolvedModelPricing, error) {
	var catalogModels []Model
	if err := DB.Select("model_name").Find(&catalogModels).Error; err != nil {
		return nil, err
	}
	pricingByModel := make(map[string]ResolvedModelPricing, len(catalogModels))
	for i := range catalogModels {
		pricingByModel[catalogModels[i].ModelName] = resolveLegacyModelPricing(catalogModels[i].ModelName)
	}
	return pricingByModel, nil
}

func GetCatalogPricingSyncOverlay() ([]string, map[string]map[string]float64, error) {
	if DB == nil {
		return nil, nil, fmt.Errorf("database is not initialized")
	}
	var catalogModels []Model
	if err := DB.Find(&catalogModels).Error; err != nil {
		return nil, nil, err
	}
	modelNames := make([]string, 0, len(catalogModels))
	overlay := make(map[string]map[string]float64, len(catalogPricingSyncFields))
	for _, field := range catalogPricingSyncFields {
		overlay[field] = make(map[string]float64)
	}
	for i := range catalogModels {
		if catalogModels[i].PricingSource != modelPricingSourceCatalog && catalogModels[i].PricingMode == "" {
			continue
		}
		modelNames = append(modelNames, catalogModels[i].ModelName)
		pricing, configured := resolveStoredModelPricing(&catalogModels[i])
		if !configured || !pricing.Configured {
			continue
		}
		if pricing.Mode == ModelPricingModePerRequest {
			overlay["model_price"][catalogModels[i].ModelName] = pricing.ModelPrice
			continue
		}
		overlay["model_ratio"][catalogModels[i].ModelName] = pricing.ModelRatio
		overlay["completion_ratio"][catalogModels[i].ModelName] = pricing.CompletionRatio
		if pricing.HasCacheRatio {
			overlay["cache_ratio"][catalogModels[i].ModelName] = pricing.CacheRatio
		}
		if pricing.HasCreateCacheRatio {
			overlay["create_cache_ratio"][catalogModels[i].ModelName] = pricing.CreateCacheRatio
		}
		if pricing.HasImageRatio {
			overlay["image_ratio"][catalogModels[i].ModelName] = pricing.ImageRatio
		}
		if pricing.HasAudioRatio {
			overlay["audio_ratio"][catalogModels[i].ModelName] = pricing.AudioRatio
		}
		if pricing.HasAudioCompletion {
			overlay["audio_completion_ratio"][catalogModels[i].ModelName] = pricing.AudioCompletionRatio
		}
	}
	return modelNames, overlay, nil
}

func GetEffectivePricingOptionValues() (map[string]string, error) {
	values := map[string]map[string]float64{
		"ModelRatio":           ratio_setting.GetModelRatioCopy(),
		"CompletionRatio":      ratio_setting.GetCompletionRatioCopy(),
		"CacheRatio":           ratio_setting.GetCacheRatioCopy(),
		"CreateCacheRatio":     ratio_setting.GetCreateCacheRatioCopy(),
		"ImageRatio":           ratio_setting.GetImageRatioCopy(),
		"AudioRatio":           ratio_setting.GetAudioRatioCopy(),
		"AudioCompletionRatio": ratio_setting.GetAudioCompletionRatioCopy(),
		"ModelPrice":           ratio_setting.GetModelPriceCopy(),
	}
	fieldToOption := map[string]string{
		"model_ratio":            "ModelRatio",
		"completion_ratio":       "CompletionRatio",
		"cache_ratio":            "CacheRatio",
		"create_cache_ratio":     "CreateCacheRatio",
		"image_ratio":            "ImageRatio",
		"audio_ratio":            "AudioRatio",
		"audio_completion_ratio": "AudioCompletionRatio",
		"model_price":            "ModelPrice",
	}
	modelNames, overlay, err := GetCatalogPricingSyncOverlay()
	if err != nil {
		return nil, err
	}
	for field, catalogValues := range overlay {
		optionKey := fieldToOption[field]
		optionValues := values[optionKey]
		for _, modelName := range modelNames {
			delete(optionValues, modelName)
		}
		for modelName, value := range catalogValues {
			optionValues[modelName] = value
		}
	}
	encoded := make(map[string]string, len(values))
	for optionKey, optionValues := range values {
		data, err := common.Marshal(optionValues)
		if err != nil {
			return nil, err
		}
		encoded[optionKey] = string(data)
	}
	return encoded, nil
}

func syncChangedCatalogPricingFromSettings(before map[string]ResolvedModelPricing) error {
	var catalogModels []Model
	if err := DB.Find(&catalogModels).Error; err != nil {
		return err
	}
	err := DB.Transaction(func(tx *gorm.DB) error {
		for i := range catalogModels {
			pricing := resolveLegacyModelPricing(catalogModels[i].ModelName)
			if previous, ok := before[catalogModels[i].ModelName]; ok && previous == pricing {
				continue
			}
			updates := emptyPricingUpdateMap()
			if pricing.Configured {
				for key, value := range pricingUpdateMap(pricing) {
					updates[key] = value
				}
			}
			if err := tx.Model(&Model{}).Where("id = ?", catalogModels[i].Id).Updates(updates).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err == nil {
		RefreshCatalogPricingCache()
	}
	return err
}

func emptyPricingUpdateMap() map[string]any {
	return map[string]any{
		"pricing_mode":           "",
		"pricing_source":         modelPricingSourceCatalog,
		"model_price":            nil,
		"model_ratio":            nil,
		"completion_ratio":       nil,
		"cache_ratio":            nil,
		"create_cache_ratio":     nil,
		"image_ratio":            nil,
		"audio_ratio":            nil,
		"audio_completion_ratio": nil,
	}
}

func pricingUpdateMap(pricing ResolvedModelPricing) map[string]any {
	updates := map[string]any{
		"pricing_mode":   pricing.Mode,
		"pricing_source": modelPricingSourceCatalog,
	}
	if pricing.Mode == ModelPricingModePerRequest {
		updates["model_price"] = pricing.ModelPrice
		return updates
	}
	updates["model_ratio"] = pricing.ModelRatio
	updates["completion_ratio"] = pricing.CompletionRatio
	if pricing.HasCacheRatio {
		updates["cache_ratio"] = pricing.CacheRatio
	}
	if pricing.HasCreateCacheRatio {
		updates["create_cache_ratio"] = pricing.CreateCacheRatio
	}
	if pricing.HasImageRatio {
		updates["image_ratio"] = pricing.ImageRatio
	}
	if pricing.HasAudioRatio {
		updates["audio_ratio"] = pricing.AudioRatio
	}
	if pricing.HasAudioCompletion {
		updates["audio_completion_ratio"] = pricing.AudioCompletionRatio
	}
	return updates
}

func pointerValue(value *float64) (float64, bool) {
	if value == nil {
		return 0, false
	}
	return *value, true
}

func valueOr(value *float64, fallback float64) float64 {
	if value == nil {
		return fallback
	}
	return *value
}
