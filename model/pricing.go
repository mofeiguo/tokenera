package model

import (
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/setting/billing_setting"
	"github.com/QuantumNous/new-api/types"
)

type Pricing struct {
	ModelName              string                  `json:"model_name"`
	Description            string                  `json:"description,omitempty"`
	Icon                   string                  `json:"icon,omitempty"`
	Tags                   string                  `json:"tags,omitempty"`
	VendorID               int                     `json:"vendor_id,omitempty"`
	InputModalities        []string                `json:"input_modalities"`
	OutputModalities       []string                `json:"output_modalities"`
	Capabilities           []string                `json:"capabilities"`
	ContextLength          int                     `json:"context_length,omitempty"`
	MaxOutputTokens        int                     `json:"max_output_tokens,omitempty"`
	QuotaType              int                     `json:"quota_type"`
	ModelRatio             float64                 `json:"model_ratio"`
	ModelPrice             float64                 `json:"model_price"`
	OwnerBy                string                  `json:"owner_by"`
	CompletionRatio        float64                 `json:"completion_ratio"`
	CacheRatio             *float64                `json:"cache_ratio,omitempty"`
	CreateCacheRatio       *float64                `json:"create_cache_ratio,omitempty"`
	ImageRatio             *float64                `json:"image_ratio,omitempty"`
	AudioRatio             *float64                `json:"audio_ratio,omitempty"`
	AudioCompletionRatio   *float64                `json:"audio_completion_ratio,omitempty"`
	EnableGroup            []string                `json:"enable_groups"`
	SupportedEndpointTypes []constant.EndpointType `json:"supported_endpoint_types"`
	BillingMode            string                  `json:"billing_mode,omitempty"`
	BillingExpr            string                  `json:"billing_expr,omitempty"`
	PricingVersion         string                  `json:"pricing_version,omitempty"`
}

type PricingVendor struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	Icon        string `json:"icon,omitempty"`
}

var (
	pricingMap           []Pricing
	vendorsList          []PricingVendor
	supportedEndpointMap map[string]common.EndpointInfo
	lastGetPricingTime   time.Time
	updatePricingLock    sync.Mutex

	// 缓存映射：模型名 -> 启用分组 / 计费类型
	modelEnableGroups     = make(map[string][]string)
	modelQuotaTypeMap     = make(map[string]int)
	modelCatalogVisible   = make(map[string]bool)
	modelEnableGroupsLock = sync.RWMutex{}
)

var (
	modelSupportEndpointTypes = make(map[string][]constant.EndpointType)
	modelSupportEndpointsLock = sync.RWMutex{}
)

func GetPricing() []Pricing {
	if time.Since(lastGetPricingTime) > time.Minute*1 || len(pricingMap) == 0 {
		updatePricingLock.Lock()
		defer updatePricingLock.Unlock()
		// Double check after acquiring the lock
		if time.Since(lastGetPricingTime) > time.Minute*1 || len(pricingMap) == 0 {
			modelSupportEndpointsLock.Lock()
			defer modelSupportEndpointsLock.Unlock()
			updatePricing()
		}
	}
	return pricingMap
}

func InvalidatePricingCache() {
	updatePricingLock.Lock()
	defer updatePricingLock.Unlock()

	pricingMap = nil
	vendorsList = nil
	lastGetPricingTime = time.Time{}
}

// GetVendors 返回当前定价接口使用到的供应商信息
func GetVendors() []PricingVendor {
	if time.Since(lastGetPricingTime) > time.Minute*1 || len(pricingMap) == 0 {
		// 保证先刷新一次
		GetPricing()
	}
	return vendorsList
}

func GetModelSupportEndpointTypes(model string) []constant.EndpointType {
	if model == "" {
		return make([]constant.EndpointType, 0)
	}
	modelSupportEndpointsLock.RLock()
	defer modelSupportEndpointsLock.RUnlock()
	if endpoints, ok := modelSupportEndpointTypes[model]; ok {
		return endpoints
	}
	return make([]constant.EndpointType, 0)
}

// ModelSupportsIncomingEndpoint reports whether the catalog/pricing cache
// allows this model on the incoming public API. An empty allowlist means the
// model has no advertised endpoints yet, so the request is not blocked.
func ModelSupportsIncomingEndpoint(modelName string, endpointType constant.EndpointType) bool {
	if modelName == "" || endpointType == "" {
		return true
	}
	allowed := GetModelSupportEndpointTypes(modelName)
	if len(allowed) == 0 {
		return true
	}
	for _, item := range allowed {
		if item == endpointType {
			return true
		}
	}
	return false
}

func catalogEndpointTypeKeys(endpointsJSON string) []string {
	if strings.TrimSpace(endpointsJSON) == "" {
		return nil
	}
	var raw map[string]interface{}
	if err := common.Unmarshal([]byte(endpointsJSON), &raw); err != nil {
		return nil
	}
	keys := make([]string, 0, len(raw))
	for key, value := range raw {
		if key == "" {
			continue
		}
		switch value.(type) {
		case string, map[string]interface{}:
			keys = append(keys, key)
		}
	}
	sort.Strings(keys)
	return keys
}

func updatePricing() {
	//modelRatios := common.GetModelRatios()
	enabledBindings, err := GetEnabledBindingsWithChannels()
	if err != nil {
		common.SysLog(fmt.Sprintf("GetEnabledBindingsWithChannels error: %v", err))
		return
	}
	// 预加载模型元数据与供应商一次，避免循环查询
	var allMeta []Model
	_ = DB.Find(&allMeta).Error
	metaMap := make(map[string]*Model)
	prefixList := make([]*Model, 0)
	suffixList := make([]*Model, 0)
	containsList := make([]*Model, 0)
	for i := range allMeta {
		m := &allMeta[i]
		if m.NameRule == NameRuleExact {
			metaMap[m.ModelName] = m
		} else {
			switch m.NameRule {
			case NameRulePrefix:
				prefixList = append(prefixList, m)
			case NameRuleSuffix:
				suffixList = append(suffixList, m)
			case NameRuleContains:
				containsList = append(containsList, m)
			}
		}
	}

	// 将非精确规则模型匹配到 metaMap
	for _, m := range prefixList {
		for _, pricingModel := range enabledBindings {
			if strings.HasPrefix(pricingModel.Model, m.ModelName) {
				if _, exists := metaMap[pricingModel.Model]; !exists {
					metaMap[pricingModel.Model] = m
				}
			}
		}
	}
	for _, m := range suffixList {
		for _, pricingModel := range enabledBindings {
			if strings.HasSuffix(pricingModel.Model, m.ModelName) {
				if _, exists := metaMap[pricingModel.Model]; !exists {
					metaMap[pricingModel.Model] = m
				}
			}
		}
	}
	for _, m := range containsList {
		for _, pricingModel := range enabledBindings {
			if strings.Contains(pricingModel.Model, m.ModelName) {
				if _, exists := metaMap[pricingModel.Model]; !exists {
					metaMap[pricingModel.Model] = m
				}
			}
		}
	}
	publishedCatalogModels := make(map[string]bool, len(metaMap))
	for modelName, meta := range metaMap {
		publishedCatalogModels[modelName] = meta.Status == 1
	}

	// 预加载供应商
	var vendors []Vendor
	_ = DB.Find(&vendors).Error
	vendorMap := make(map[int]*Vendor)
	for i := range vendors {
		vendorMap[vendors[i].Id] = &vendors[i]
	}

	// 初始化默认供应商映射
	initDefaultVendorMapping(metaMap, vendorMap, enabledBindings)

	// 构建对前端友好的供应商列表
	vendorsList = make([]PricingVendor, 0, len(vendorMap))
	for _, v := range vendorMap {
		vendorsList = append(vendorsList, PricingVendor{
			ID:          v.Id,
			Name:        v.Name,
			Description: v.Description,
			Icon:        v.Icon,
		})
	}

	modelGroupsMap := make(map[string]*types.Set[string])

	for _, binding := range enabledBindings {
		if !publishedCatalogModels[binding.Model] {
			continue
		}
		groups, ok := modelGroupsMap[binding.Model]
		if !ok {
			groups = types.NewSet[string]()
			modelGroupsMap[binding.Model] = groups
		}
		groups.Add(binding.Group)
	}

	// Advertised public endpoints come only from models.endpoints.
	// Channel type and Advanced Custom incoming_path do not infer them.
	modelSupportEndpointTypes = make(map[string][]constant.EndpointType)
	for modelName, meta := range metaMap {
		keys := catalogEndpointTypeKeys(meta.Endpoints)
		if len(keys) == 0 {
			continue
		}
		supportedEndpoints := make([]constant.EndpointType, 0, len(keys))
		for _, key := range keys {
			supportedEndpoints = append(supportedEndpoints, constant.EndpointType(key))
		}
		modelSupportEndpointTypes[modelName] = supportedEndpoints
	}

	// 构建全局 supportedEndpointMap（默认 + 自定义覆盖）
	supportedEndpointMap = make(map[string]common.EndpointInfo)
	// 1. 默认端点
	for _, endpoints := range modelSupportEndpointTypes {
		for _, et := range endpoints {
			if info, ok := common.GetDefaultEndpointInfo(et); ok {
				if _, exists := supportedEndpointMap[string(et)]; !exists {
					supportedEndpointMap[string(et)] = info
				}
			}
		}
	}
	// 2. 自定义端点（models 表）覆盖默认
	for _, meta := range metaMap {
		if strings.TrimSpace(meta.Endpoints) == "" {
			continue
		}
		var raw map[string]interface{}
		if err := common.Unmarshal([]byte(meta.Endpoints), &raw); err == nil {
			for k, v := range raw {
				switch val := v.(type) {
				case string:
					supportedEndpointMap[k] = common.EndpointInfo{Path: val, Method: "POST"}
				case map[string]interface{}:
					ep := common.EndpointInfo{Method: "POST"}
					if p, ok := val["path"].(string); ok {
						ep.Path = p
					}
					if m, ok := val["method"].(string); ok {
						ep.Method = strings.ToUpper(m)
					}
					supportedEndpointMap[k] = ep
				default:
					// ignore unsupported types
				}
			}
		}
	}

	pricingMap = make([]Pricing, 0)
	for model, groups := range modelGroupsMap {
		pricing := Pricing{
			ModelName:              model,
			EnableGroup:            groups.Items(),
			SupportedEndpointTypes: modelSupportEndpointTypes[model],
		}

		// 补充模型元数据（描述、标签、供应商、状态）
		if meta, ok := metaMap[model]; ok {
			// 若模型被禁用(status!=1)，则直接跳过，不返回给前端
			if meta.Status != 1 {
				continue
			}
			pricing.Description = meta.Description
			pricing.Icon = meta.Icon
			pricing.Tags = meta.Tags
			pricing.VendorID = meta.VendorID
			pricing.InputModalities = append([]string(nil), meta.InputModalities...)
			pricing.OutputModalities = append([]string(nil), meta.OutputModalities...)
			pricing.Capabilities = append([]string(nil), meta.Capabilities...)
			pricing.ContextLength = meta.ContextLength
			pricing.MaxOutputTokens = meta.MaxOutputTokens
		}
		resolvedPricing := ResolveModelPricing(model)
		if resolvedPricing.Mode == ModelPricingModePerRequest {
			pricing.ModelPrice = resolvedPricing.ModelPrice
			pricing.QuotaType = 1
		} else {
			pricing.ModelRatio = resolvedPricing.ModelRatio
			pricing.CompletionRatio = resolvedPricing.CompletionRatio
			pricing.QuotaType = 0
		}
		if resolvedPricing.HasCacheRatio {
			pricing.CacheRatio = &resolvedPricing.CacheRatio
		}
		if resolvedPricing.HasCreateCacheRatio {
			pricing.CreateCacheRatio = &resolvedPricing.CreateCacheRatio
		}
		if resolvedPricing.HasImageRatio {
			pricing.ImageRatio = &resolvedPricing.ImageRatio
		}
		if resolvedPricing.HasAudioRatio {
			pricing.AudioRatio = &resolvedPricing.AudioRatio
		}
		if resolvedPricing.HasAudioCompletion {
			pricing.AudioCompletionRatio = &resolvedPricing.AudioCompletionRatio
		}
		if resolvedPricing.BillingMode == billing_setting.BillingModeTieredExpr {
			pricing.BillingMode = resolvedPricing.BillingMode
			pricing.BillingExpr = resolvedPricing.BillingExpr
		}
		pricingMap = append(pricingMap, pricing)
	}

	// 防止大更新后数据不通用
	if len(pricingMap) > 0 {
		pricingMap[0].PricingVersion = "5a90f2b86c08bd983a9a2e6d66c255f4eaef9c4bc934386d2b6ae84ef0ff1f1f"
	}

	// 刷新缓存映射，供高并发快速查询
	modelEnableGroupsLock.Lock()
	modelEnableGroups = make(map[string][]string)
	modelQuotaTypeMap = make(map[string]int)
	modelCatalogVisible = make(map[string]bool)
	for _, p := range pricingMap {
		modelEnableGroups[p.ModelName] = p.EnableGroup
		modelQuotaTypeMap[p.ModelName] = p.QuotaType
		modelCatalogVisible[p.ModelName] = true
	}
	modelEnableGroupsLock.Unlock()

	lastGetPricingTime = time.Now()
}

// GetSupportedEndpointMap 返回全局端点到路径的映射
func GetSupportedEndpointMap() map[string]common.EndpointInfo {
	return supportedEndpointMap
}

func IsModelCatalogVisible(modelName string) bool {
	GetPricing()
	modelEnableGroupsLock.RLock()
	defer modelEnableGroupsLock.RUnlock()
	return modelCatalogVisible[modelName]
}
