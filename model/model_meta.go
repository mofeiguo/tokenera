package model

import (
	"database/sql/driver"
	"fmt"
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"

	"gorm.io/gorm"
)

const (
	NameRuleExact = iota
	NameRulePrefix
	NameRuleContains
	NameRuleSuffix
)

type BoundChannel struct {
	Id      int    `json:"id"`
	Name    string `json:"name"`
	Type    int    `json:"type"`
	Enabled bool   `json:"enabled"`
}

type CatalogStringList []string

var allowedInputModalities = map[string]struct{}{
	"text": {}, "image": {}, "audio": {}, "video": {}, "file": {},
}

var allowedOutputModalities = map[string]struct{}{
	"text": {}, "image": {}, "audio": {}, "video": {}, "file": {},
}

var allowedModelCapabilities = map[string]struct{}{
	"function_calling": {}, "streaming": {}, "json_mode": {}, "structured_output": {},
	"reasoning": {}, "tools": {}, "system_prompt": {}, "web_search": {},
	"code_interpreter": {}, "caching": {}, "embeddings": {},
}

func (list *CatalogStringList) Scan(value any) error {
	if value == nil {
		*list = CatalogStringList{}
		return nil
	}
	var data []byte
	switch v := value.(type) {
	case []byte:
		data = v
	case string:
		data = []byte(v)
	default:
		return fmt.Errorf("unsupported catalog list type %T", value)
	}
	if len(data) == 0 {
		*list = CatalogStringList{}
		return nil
	}
	return common.Unmarshal(data, list)
}

func (list CatalogStringList) Value() (driver.Value, error) {
	if list == nil {
		list = CatalogStringList{}
	}
	data, err := common.Marshal(list)
	return string(data), err
}

func normalizeCatalogStringList(values CatalogStringList, allowed map[string]struct{}, field string) (CatalogStringList, error) {
	seen := make(map[string]struct{}, len(values))
	normalized := make(CatalogStringList, 0, len(values))
	for _, value := range values {
		value = strings.ToLower(strings.TrimSpace(value))
		if value == "" {
			continue
		}
		if _, ok := allowed[value]; !ok {
			return nil, fmt.Errorf("%s contains unsupported value %q", field, value)
		}
		if _, ok := seen[value]; ok {
			continue
		}
		seen[value] = struct{}{}
		normalized = append(normalized, value)
	}
	return normalized, nil
}

func (mi *Model) NormalizeCatalogMetadata() error {
	var err error
	mi.InputModalities, err = normalizeCatalogStringList(mi.InputModalities, allowedInputModalities, "input_modalities")
	if err != nil {
		return err
	}
	mi.OutputModalities, err = normalizeCatalogStringList(mi.OutputModalities, allowedOutputModalities, "output_modalities")
	if err != nil {
		return err
	}
	mi.Capabilities, err = normalizeCatalogStringList(mi.Capabilities, allowedModelCapabilities, "capabilities")
	if err != nil {
		return err
	}
	if mi.ContextLength < 0 {
		return fmt.Errorf("context_length must be non-negative")
	}
	if mi.MaxOutputTokens < 0 {
		return fmt.Errorf("max_output_tokens must be non-negative")
	}
	return nil
}

type Model struct {
	Id                   int               `json:"id"`
	ModelName            string            `json:"model_name" gorm:"size:128;not null;uniqueIndex:uk_model_name_delete_at,priority:1"`
	Description          string            `json:"description,omitempty" gorm:"type:text"`
	Icon                 string            `json:"icon,omitempty" gorm:"type:varchar(128)"`
	Tags                 string            `json:"tags,omitempty" gorm:"type:varchar(255)"`
	VendorID             int               `json:"vendor_id,omitempty" gorm:"index"`
	Endpoints            string            `json:"endpoints,omitempty" gorm:"type:text"`
	InputModalities      CatalogStringList `json:"input_modalities" gorm:"type:text"`
	OutputModalities     CatalogStringList `json:"output_modalities" gorm:"type:text"`
	Capabilities         CatalogStringList `json:"capabilities" gorm:"type:text"`
	ContextLength        int               `json:"context_length"`
	MaxOutputTokens      int               `json:"max_output_tokens"`
	PricingMode          string            `json:"pricing_mode,omitempty" gorm:"type:varchar(32)"`
	PricingSource        string            `json:"-" gorm:"type:varchar(32)"`
	ModelPrice           *float64          `json:"model_price,omitempty"`
	ModelRatio           *float64          `json:"model_ratio,omitempty"`
	CompletionRatio      *float64          `json:"completion_ratio,omitempty"`
	CacheRatio           *float64          `json:"cache_ratio,omitempty"`
	CreateCacheRatio     *float64          `json:"create_cache_ratio,omitempty"`
	ImageRatio           *float64          `json:"image_ratio,omitempty"`
	AudioRatio           *float64          `json:"audio_ratio,omitempty"`
	AudioCompletionRatio *float64          `json:"audio_completion_ratio,omitempty"`
	Status               int               `json:"status" gorm:"default:1"`
	SyncOfficial         int               `json:"sync_official" gorm:"default:1"`
	CreatedTime          int64             `json:"created_time" gorm:"bigint"`
	UpdatedTime          int64             `json:"updated_time" gorm:"bigint"`
	DeletedAt            gorm.DeletedAt    `json:"-" gorm:"index;uniqueIndex:uk_model_name_delete_at,priority:2"`

	BoundChannels []BoundChannel `json:"bound_channels,omitempty" gorm:"-"`
	EnableGroups  []string       `json:"enable_groups,omitempty" gorm:"-"`
	QuotaTypes    []int          `json:"quota_types,omitempty" gorm:"-"`
	NameRule      int            `json:"name_rule" gorm:"default:0"`

	MatchedModels []string `json:"matched_models,omitempty" gorm:"-"`
	MatchedCount  int      `json:"matched_count,omitempty" gorm:"-"`
}

func (mi *Model) Insert() error {
	now := common.GetTimestamp()
	mi.CreatedTime = now
	mi.UpdatedTime = now

	// 保存原始值（因为 Create 后可能被 GORM 的 default 标签覆盖为 1）
	originalStatus := mi.Status
	originalSyncOfficial := mi.SyncOfficial

	// 先创建记录（GORM 会对零值字段应用默认值）
	if err := DB.Create(mi).Error; err != nil {
		return err
	}

	// 使用保存的原始值进行更新，确保零值能正确保存
	return DB.Model(&Model{}).Where("id = ?", mi.Id).Updates(map[string]interface{}{
		"status":        originalStatus,
		"sync_official": originalSyncOfficial,
	}).Error
}

func IsModelNameDuplicated(id int, name string) (bool, error) {
	if name == "" {
		return false, nil
	}
	var cnt int64
	err := DB.Model(&Model{}).Where("model_name = ? AND id <> ?", name, id).Count(&cnt).Error
	return cnt > 0, err
}

func (mi *Model) Update() error {
	mi.UpdatedTime = common.GetTimestamp()
	return DB.Transaction(func(tx *gorm.DB) error {
		var previous Model
		if err := tx.Select("model_name").First(&previous, mi.Id).Error; err != nil {
			return err
		}
		if mi.NameRule != NameRuleExact {
			var bindingCount int64
			if err := tx.Model(&ModelBinding{}).Where("model_id = ? AND deleted = ?", mi.Id, false).Count(&bindingCount).Error; err != nil {
				return err
			}
			if bindingCount > 0 {
				return fmt.Errorf("only exact catalog models can have channel bindings")
			}
		}
		// 使用 Select 强制更新所有字段，包括零值
		if err := tx.Model(&Model{}).Where("id = ?", mi.Id).
			Select("model_name", "description", "icon", "tags", "vendor_id", "endpoints", "input_modalities", "output_modalities", "capabilities", "context_length", "max_output_tokens", "pricing_mode", "pricing_source", "model_price", "model_ratio", "completion_ratio", "cache_ratio", "create_cache_ratio", "image_ratio", "audio_ratio", "audio_completion_ratio", "status", "sync_official", "name_rule", "updated_time").
			Updates(mi).Error; err != nil {
			return err
		}
		if previous.ModelName == mi.ModelName {
			return nil
		}
		var channelIDs []int
		if err := tx.Model(&ModelBinding{}).
			Where("model_id = ? AND deleted = ?", mi.Id, false).
			Distinct("channel_id").
			Pluck("channel_id", &channelIDs).Error; err != nil {
			return err
		}
		if len(channelIDs) == 0 {
			return nil
		}
		var channels []Channel
		if err := tx.Select("id", "models").Where("id IN ?", channelIDs).Find(&channels).Error; err != nil {
			return err
		}
		for i := range channels {
			modelNames := strings.Split(channels[i].Models, ",")
			changed := false
			for j := range modelNames {
				if strings.TrimSpace(modelNames[j]) == previous.ModelName {
					modelNames[j] = mi.ModelName
					changed = true
				}
			}
			if changed {
				if err := tx.Model(&Channel{}).Where("id = ?", channels[i].Id).
					Update("models", strings.Join(modelNames, ",")).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}

func (mi *Model) Delete() error {
	var boundCount int64
	if err := DB.Model(&ModelBinding{}).Where("model_id = ? AND deleted = ?", mi.Id, false).Count(&boundCount).Error; err != nil {
		return err
	}
	if boundCount > 0 {
		return fmt.Errorf("model %s is still bound to %d channel models", mi.ModelName, boundCount)
	}
	return DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("model_id = ?", mi.Id).Delete(&ModelBinding{}).Error; err != nil {
			return err
		}
		return tx.Delete(mi).Error
	})
}

func GetVendorModelCounts() (map[int64]int64, error) {
	var stats []struct {
		VendorID int64
		Count    int64
	}
	if err := DB.Model(&Model{}).
		Select("vendor_id as vendor_id, count(*) as count").
		Group("vendor_id").
		Scan(&stats).Error; err != nil {
		return nil, err
	}
	m := make(map[int64]int64, len(stats))
	for _, s := range stats {
		m[s.VendorID] = s.Count
	}
	return m, nil
}

func GetAllModels(offset int, limit int) ([]*Model, error) {
	models, _, err := SearchModels("", "", "", "", offset, limit)
	return models, err
}

func GetExactCatalogModelNames() ([]string, error) {
	var modelNames []string
	err := DB.Model(&Model{}).
		Where("name_rule = ?", NameRuleExact).
		Order("model_name ASC").
		Pluck("model_name", &modelNames).Error
	return modelNames, err
}

func EnsureCatalogModels(modelNames []string) ([]string, error) {
	modelNames = normalizeLookupValues(modelNames)
	if len(modelNames) == 0 {
		return nil, nil
	}

	var existing []string
	if err := DB.Model(&Model{}).Where("model_name IN ?", modelNames).Pluck("model_name", &existing).Error; err != nil {
		return nil, err
	}
	existingSet := make(map[string]struct{}, len(existing))
	for _, modelName := range existing {
		existingSet[modelName] = struct{}{}
	}

	missing := make([]string, 0)
	for _, modelName := range modelNames {
		if _, ok := existingSet[modelName]; !ok {
			missing = append(missing, modelName)
		}
	}
	if len(missing) == 0 {
		return nil, nil
	}

	now := common.GetTimestamp()
	if err := DB.Transaction(func(tx *gorm.DB) error {
		for _, modelName := range missing {
			catalogModel := Model{
				ModelName:        modelName,
				Status:           1,
				SyncOfficial:     1,
				CreatedTime:      now,
				UpdatedTime:      now,
				InputModalities:  CatalogStringList{},
				OutputModalities: CatalogStringList{},
				Capabilities:     CatalogStringList{},
			}
			if err := tx.Create(&catalogModel).Error; err != nil {
				return err
			}
		}
		return nil
	}); err != nil {
		return nil, err
	}
	return missing, nil
}

func GetBoundChannelsByModelsMap(modelNames []string) (map[string][]BoundChannel, error) {
	result := make(map[string][]BoundChannel)
	if len(modelNames) == 0 {
		return result, nil
	}
	type row struct {
		Model   string
		Id      int
		Name    string
		Type    int
		Enabled bool
	}
	var rows []row
	err := DB.Table("model_bindings").
		Select("models.model_name AS model, channels.id, channels.name, channels.type, model_bindings.enabled").
		Joins("JOIN models ON models.id = model_bindings.model_id").
		Joins("JOIN channels ON channels.id = model_bindings.channel_id").
		Where("models.model_name IN ? AND model_bindings.deleted = ?", modelNames, false).
		Distinct().
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	for _, r := range rows {
		result[r.Model] = append(result[r.Model], BoundChannel{
			Id:      r.Id,
			Name:    r.Name,
			Type:    r.Type,
			Enabled: r.Enabled,
		})
	}
	return result, nil
}

func normalizeLookupValues(values []string) []string {
	seen := make(map[string]struct{}, len(values))
	normalized := make([]string, 0, len(values))
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value == "" {
			continue
		}
		if _, ok := seen[value]; ok {
			continue
		}
		seen[value] = struct{}{}
		normalized = append(normalized, value)
	}
	return normalized
}

func GetPreferredModelOwnerChannelTypes(modelNames []string, groups []string) (map[string]int, error) {
	result := make(map[string]int)
	modelNames = normalizeLookupValues(modelNames)
	if len(modelNames) == 0 {
		return result, nil
	}

	type row struct {
		Model       string
		ChannelType int
		Groups      string
	}
	var rows []row

	err := DB.Table("model_bindings").
		Select("models.model_name as model, channels.type as channel_type, channels."+commonGroupCol+" as groups").
		Joins("JOIN models ON models.id = model_bindings.model_id").
		Joins("JOIN channels ON channels.id = model_bindings.channel_id").
		Where("models.model_name IN ? AND model_bindings.enabled = ? AND model_bindings.deleted = ? AND channels.status = ?", modelNames, true, false, common.ChannelStatusEnabled).
		Order("COALESCE(model_bindings.priority, 0) DESC").
		Order("model_bindings.weight DESC").
		Order("channels.id ASC").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	groups = normalizeLookupValues(groups)
	groupSet := make(map[string]struct{}, len(groups))
	for _, group := range groups {
		groupSet[group] = struct{}{}
	}

	for _, row := range rows {
		if _, ok := result[row.Model]; ok {
			continue
		}
		if len(groupSet) > 0 {
			matched := false
			for _, group := range servingGroupsFromRaw(row.Groups) {
				if _, ok := groupSet[group]; ok {
					matched = true
					break
				}
			}
			if !matched {
				continue
			}
		}
		result[row.Model] = row.ChannelType
	}
	return result, nil
}

func SearchModels(keyword string, vendor string, status string, syncOfficial string, offset int, limit int) ([]*Model, int64, error) {
	var models []*Model
	db := DB.Model(&Model{})
	if keyword != "" {
		like := "%" + keyword + "%"
		db = db.Where("model_name LIKE ? OR description LIKE ? OR tags LIKE ?", like, like, like)
	}
	if vendor != "" {
		if vid, err := strconv.Atoi(vendor); err == nil {
			db = db.Where("models.vendor_id = ?", vid)
		} else {
			db = db.Joins("JOIN vendors ON vendors.id = models.vendor_id").Where("vendors.name LIKE ?", "%"+vendor+"%")
		}
	}
	if statusValue, ok := parseModelStatusFilter(status); ok {
		db = db.Where("models.status = ?", statusValue)
	}
	if syncValue, ok := parseModelSyncFilter(syncOfficial); ok {
		db = db.Where("models.sync_official = ?", syncValue)
	}
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if err := db.Order("models.id DESC").Offset(offset).Limit(limit).Find(&models).Error; err != nil {
		return nil, 0, err
	}
	return models, total, nil
}

// parseModelStatusFilter maps UI/API status values to the models.status column.
// Returns ok=false when no status filter should be applied.
func parseModelStatusFilter(status string) (value int, ok bool) {
	switch strings.ToLower(strings.TrimSpace(status)) {
	case "", "all":
		return 0, false
	case "enabled", "1":
		return 1, true
	case "disabled", "0":
		return 0, true
	default:
		n, err := strconv.Atoi(status)
		if err != nil {
			return 0, false
		}
		return n, true
	}
}

// parseModelSyncFilter maps UI/API sync values to the models.sync_official column.
// Returns ok=false when no sync filter should be applied.
func parseModelSyncFilter(syncOfficial string) (value int, ok bool) {
	switch strings.ToLower(strings.TrimSpace(syncOfficial)) {
	case "", "all":
		return 0, false
	case "yes", "1":
		return 1, true
	case "no", "0":
		return 0, true
	default:
		n, err := strconv.Atoi(syncOfficial)
		if err != nil {
			return 0, false
		}
		return n, true
	}
}
