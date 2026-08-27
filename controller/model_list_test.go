package controller

import (
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/config"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

type listModelsResponse struct {
	Success bool               `json:"success"`
	Data    []dto.OpenAIModels `json:"data"`
	Object  string             `json:"object"`
}

type userModelsResponse struct {
	Success bool     `json:"success"`
	Data    []string `json:"data"`
}

func setupModelListControllerTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	initModelListColumnNames(t)

	gin.SetMode(gin.TestMode)
	common.SetDatabaseTypes(common.DatabaseTypeSQLite, common.DatabaseTypeSQLite)
	common.RedisEnabled = false

	dsn := fmt.Sprintf("file:%s?mode=memory&cache=shared", strings.ReplaceAll(t.Name(), "/", "_"))
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	require.NoError(t, err)
	model.DB = db
	model.LOG_DB = db

	require.NoError(t, db.AutoMigrate(&model.User{}, &model.Channel{}, &model.Model{}, &model.ModelBinding{}, &model.Vendor{}))

	t.Cleanup(func() {
		sqlDB, err := db.DB()
		if err == nil {
			_ = sqlDB.Close()
		}
	})

	return db
}

func initModelListColumnNames(t *testing.T) {
	t.Helper()

	originalIsMasterNode := common.IsMasterNode
	originalSQLitePath := common.SQLitePath
	originalMainDatabaseType := common.MainDatabaseType()
	originalLogDatabaseType := common.LogDatabaseType()
	originalSQLDSN, hadSQLDSN := os.LookupEnv("SQL_DSN")
	defer func() {
		common.IsMasterNode = originalIsMasterNode
		common.SQLitePath = originalSQLitePath
		common.SetDatabaseTypes(originalMainDatabaseType, originalLogDatabaseType)
		if hadSQLDSN {
			require.NoError(t, os.Setenv("SQL_DSN", originalSQLDSN))
		} else {
			require.NoError(t, os.Unsetenv("SQL_DSN"))
		}
	}()

	common.IsMasterNode = false
	common.SQLitePath = fmt.Sprintf("file:%s_init?mode=memory&cache=shared", strings.ReplaceAll(t.Name(), "/", "_"))
	common.SetDatabaseTypes(common.DatabaseTypeSQLite, common.DatabaseTypeSQLite)
	require.NoError(t, os.Setenv("SQL_DSN", "local"))

	require.NoError(t, model.InitDB())
	if model.DB != nil {
		sqlDB, err := model.DB.DB()
		if err == nil {
			_ = sqlDB.Close()
		}
	}
}

func withTieredBillingConfig(t *testing.T, modes map[string]string, exprs map[string]string) {
	t.Helper()

	saved := map[string]string{}
	require.NoError(t, config.GlobalConfig.SaveToDB(func(key, value string) error {
		if strings.HasPrefix(key, "billing_setting.") {
			saved[key] = value
		}
		return nil
	}))
	t.Cleanup(func() {
		require.NoError(t, config.GlobalConfig.LoadFromDB(saved))
		model.InvalidatePricingCache()
	})

	modeBytes, err := common.Marshal(modes)
	require.NoError(t, err)
	exprBytes, err := common.Marshal(exprs)
	require.NoError(t, err)

	require.NoError(t, config.GlobalConfig.LoadFromDB(map[string]string{
		"billing_setting.billing_mode": string(modeBytes),
		"billing_setting.billing_expr": string(exprBytes),
	}))
	model.InvalidatePricingCache()
}

func withSelfUseModeDisabled(t *testing.T) {
	t.Helper()

	original := operation_setting.SelfUseModeEnabled
	operation_setting.SelfUseModeEnabled = false
	t.Cleanup(func() {
		operation_setting.SelfUseModeEnabled = original
	})
}

func withSelfUseModeEnabled(t *testing.T) {
	t.Helper()

	original := operation_setting.SelfUseModeEnabled
	operation_setting.SelfUseModeEnabled = true
	t.Cleanup(func() {
		operation_setting.SelfUseModeEnabled = original
	})
}

func seedModelBinding(t *testing.T, db *gorm.DB, channelID int, group string, modelName string, enabled bool) {
	t.Helper()

	var channel model.Channel
	err := db.First(&channel, channelID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		require.NoError(t, db.Create(&model.Channel{
			Id:     channelID,
			Type:   constant.ChannelTypeOpenAI,
			Name:   fmt.Sprintf("channel-%d", channelID),
			Status: common.ChannelStatusEnabled,
			Group:  group,
		}).Error)
	} else {
		require.NoError(t, err)
	}

	var catalogModel model.Model
	err = db.Where("model_name = ?", modelName).First(&catalogModel).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		require.NoError(t, db.Create(&model.Model{
			ModelName: modelName,
			Status:    1,
			NameRule:  model.NameRuleExact,
		}).Error)
		require.NoError(t, db.Where("model_name = ?", modelName).First(&catalogModel).Error)
	} else {
		require.NoError(t, err)
	}

	if !enabled {
		return
	}
	var count int64
	require.NoError(t, db.Model(&model.ModelBinding{}).
		Where("model_id = ? AND channel_id = ? AND deleted = ?", catalogModel.Id, channelID, false).
		Count(&count).Error)
	if count > 0 {
		return
	}
	require.NoError(t, db.Create(&model.ModelBinding{
		ModelId:       catalogModel.Id,
		ChannelId:     channelID,
		UpstreamModel: modelName,
		Enabled:       true,
		GroupsRaw:     group,
	}).Error)
}

func publishModelListCatalog(t *testing.T, db *gorm.DB, modelNames ...string) {
	t.Helper()
	for _, modelName := range modelNames {
		var catalogModel model.Model
		err := db.Where("model_name = ?", modelName).First(&catalogModel).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			require.NoError(t, db.Create(&model.Model{
				ModelName: modelName,
				Status:    1,
				NameRule:  model.NameRuleExact,
			}).Error)
		} else {
			require.NoError(t, err)
		}
	}
	model.InvalidatePricingCache()
}

func decodeListModelsPayload(t *testing.T, recorder *httptest.ResponseRecorder) listModelsResponse {
	t.Helper()

	require.Equal(t, http.StatusOK, recorder.Code)
	var payload listModelsResponse
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &payload))
	require.True(t, payload.Success)
	require.Equal(t, "list", payload.Object)
	return payload
}

func decodeListModelsResponse(t *testing.T, recorder *httptest.ResponseRecorder) map[string]struct{} {
	t.Helper()

	payload := decodeListModelsPayload(t, recorder)
	ids := make(map[string]struct{}, len(payload.Data))
	for _, item := range payload.Data {
		ids[item.Id] = struct{}{}
	}
	return ids
}

func pricingByModelName(pricings []model.Pricing) map[string]model.Pricing {
	byName := make(map[string]model.Pricing, len(pricings))
	for _, pricing := range pricings {
		byName[pricing.ModelName] = pricing
	}
	return byName
}

func decodeUserModelsResponse(t *testing.T, recorder *httptest.ResponseRecorder) []string {
	t.Helper()

	require.Equal(t, http.StatusOK, recorder.Code)
	var payload userModelsResponse
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &payload))
	require.True(t, payload.Success)
	return payload.Data
}

func TestChannelListModelsUsesExactCatalogEntries(t *testing.T) {
	db := setupModelListControllerTestDB(t)
	publishModelListCatalog(t, db, "catalog-exact-model")
	require.NoError(t, db.Create(&model.Model{
		ModelName: "catalog-prefix-",
		Status:    1,
		NameRule:  model.NameRulePrefix,
	}).Error)

	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	ChannelListModels(context)

	require.Equal(t, http.StatusOK, recorder.Code)
	var payload listModelsResponse
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &payload))
	require.True(t, payload.Success)
	modelNames := make(map[string]struct{}, len(payload.Data))
	for _, item := range payload.Data {
		modelNames[item.Id] = struct{}{}
	}
	assert.Equal(t, map[string]struct{}{"catalog-exact-model": {}}, modelNames)
}

func TestEnsureCatalogModelsCreatesMissingNames(t *testing.T) {
	db := setupModelListControllerTestDB(t)
	publishModelListCatalog(t, db, "already-cataloged")

	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	request := httptest.NewRequest(http.MethodPost, "/api/models/ensure", strings.NewReader(`{"model_names":["already-cataloged","new-from-channel"]}`))
	request.Header.Set("Content-Type", "application/json")
	context.Request = request
	EnsureCatalogModels(context)

	require.Equal(t, http.StatusOK, recorder.Code)
	var payload struct {
		Success bool `json:"success"`
		Data    struct {
			Created      []string `json:"created"`
			CreatedCount int      `json:"created_count"`
		} `json:"data"`
	}
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &payload))
	require.True(t, payload.Success)
	assert.Equal(t, []string{"new-from-channel"}, payload.Data.Created)
	assert.Equal(t, 1, payload.Data.CreatedCount)
}

func TestGetUserModelsFiltersByRequestedGroup(t *testing.T) {
	db := setupModelListControllerTestDB(t)
	require.NoError(t, db.Create(&model.User{
		Id:       1002,
		Username: "playground-model-user",
		Password: "password",
		Group:    "default",
		Status:   common.UserStatusEnabled,
	}).Error)
	seedModelBinding(t, db, 1, "default", "zz-default-only-model", true)
	seedModelBinding(t, db, 1, "default", "zz-disabled-model", false)
	publishModelListCatalog(t, db, "zz-default-only-model", "zz-disabled-model")

	defaultRecorder := httptest.NewRecorder()
	defaultContext, _ := gin.CreateTestContext(defaultRecorder)
	defaultContext.Request = httptest.NewRequest(http.MethodGet, "/api/user/models?group=default", nil)
	defaultContext.Set("id", 1002)

	GetUserModels(defaultContext)

	defaultModels := decodeUserModelsResponse(t, defaultRecorder)
	require.ElementsMatch(t, []string{"zz-default-only-model"}, defaultModels)

	vipRecorder := httptest.NewRecorder()
	vipContext, _ := gin.CreateTestContext(vipRecorder)
	vipContext.Request = httptest.NewRequest(http.MethodGet, "/api/user/models?group=vip", nil)
	vipContext.Set("id", 1002)

	GetUserModels(vipContext)

	require.Equal(t, []string{"zz-default-only-model"}, decodeUserModelsResponse(t, vipRecorder))
}

func TestGetUserModelsUsesAccessibleGroups(t *testing.T) {
	originalInherit := setting.GroupInherit2JSONString()
	require.NoError(t, setting.UpdateGroupInheritByJSONString(`{"default":["default"],"vip":["vip","default"]}`))
	t.Cleanup(func() {
		require.NoError(t, setting.UpdateGroupInheritByJSONString(originalInherit))
	})

	db := setupModelListControllerTestDB(t)
	require.NoError(t, db.Create(&model.User{
		Id:       1003,
		Username: "playground-auto-model-user",
		Password: "password",
		Group:    "default",
		Status:   common.UserStatusEnabled,
		AffCode:  "aff1003",
	}).Error)
	require.NoError(t, db.Create(&model.User{
		Id:       1004,
		Username: "playground-vip-model-user",
		Password: "password",
		Group:    "vip",
		Status:   common.UserStatusEnabled,
		AffCode:  "aff1004",
	}).Error)
	seedModelBinding(t, db, 1, "vip", "zz-vip-model", true)
	seedModelBinding(t, db, 2, "default", "zz-shared-model", true)
	seedModelBinding(t, db, 3, "default", "zz-default-model", true)
	seedModelBinding(t, db, 4, "unavailable", "zz-unavailable-model", true)
	publishModelListCatalog(t, db, "zz-vip-model", "zz-shared-model", "zz-default-model")

	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	context.Request = httptest.NewRequest(http.MethodGet, "/api/user/models", nil)
	context.Set("id", 1003)
	GetUserModels(context)
	assert.ElementsMatch(t, []string{"zz-shared-model", "zz-default-model"}, decodeUserModelsResponse(t, recorder))

	vipRecorder := httptest.NewRecorder()
	vipContext, _ := gin.CreateTestContext(vipRecorder)
	vipContext.Request = httptest.NewRequest(http.MethodGet, "/api/user/models", nil)
	vipContext.Set("id", 1004)
	GetUserModels(vipContext)
	assert.ElementsMatch(t, []string{"zz-vip-model", "zz-shared-model", "zz-default-model"}, decodeUserModelsResponse(t, vipRecorder))
}

func TestListModelsIncludesTieredBillingModel(t *testing.T) {
	withSelfUseModeDisabled(t)
	withTieredBillingConfig(t, map[string]string{
		"zz-tiered-visible-model":      "tiered_expr",
		"zz-tiered-empty-expr-model":   "tiered_expr",
		"zz-tiered-missing-expr-model": "tiered_expr",
	}, map[string]string{
		"zz-tiered-visible-model":    `tier("base", p * 1 + c * 2)`,
		"zz-tiered-empty-expr-model": "   ",
	})

	db := setupModelListControllerTestDB(t)
	require.NoError(t, db.Create(&model.User{
		Id:       1001,
		Username: "model-list-user",
		Password: "password",
		Group:    "default",
		Status:   common.UserStatusEnabled,
	}).Error)
	seedModelBinding(t, db, 1, "default", "zz-tiered-visible-model", true)
	seedModelBinding(t, db, 1, "default", "zz-tiered-empty-expr-model", true)
	seedModelBinding(t, db, 1, "default", "zz-tiered-missing-expr-model", true)
	seedModelBinding(t, db, 1, "default", "zz-unpriced-model", true)
	publishModelListCatalog(
		t,
		db,
		"zz-tiered-visible-model",
		"zz-tiered-empty-expr-model",
		"zz-tiered-missing-expr-model",
	)

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/v1/models", nil)
	ctx.Set("id", 1001)

	ListModels(ctx, constant.ChannelTypeOpenAI)

	ids := decodeListModelsResponse(t, recorder)
	require.Contains(t, ids, "zz-tiered-visible-model")
	require.NotContains(t, ids, "zz-tiered-empty-expr-model")
	require.NotContains(t, ids, "zz-tiered-missing-expr-model")
	require.NotContains(t, ids, "zz-unpriced-model")

	pricingByName := pricingByModelName(model.GetPricing())
	visiblePricing, ok := pricingByName["zz-tiered-visible-model"]
	require.True(t, ok)
	require.Equal(t, "tiered_expr", visiblePricing.BillingMode)
	require.NotEmpty(t, visiblePricing.BillingExpr)

	emptyExprPricing, ok := pricingByName["zz-tiered-empty-expr-model"]
	require.True(t, ok)
	require.Empty(t, emptyExprPricing.BillingMode)
	require.Empty(t, emptyExprPricing.BillingExpr)

	missingExprPricing, ok := pricingByName["zz-tiered-missing-expr-model"]
	require.True(t, ok)
	require.Empty(t, missingExprPricing.BillingMode)
	require.Empty(t, missingExprPricing.BillingExpr)
}

func TestListModelsUsesBifrostEndpointTypesFromPricingCache(t *testing.T) {
	withSelfUseModeEnabled(t)
	db := setupModelListControllerTestDB(t)

	originalMemoryCacheEnabled := common.MemoryCacheEnabled
	common.MemoryCacheEnabled = true
	t.Cleanup(func() {
		common.MemoryCacheEnabled = originalMemoryCacheEnabled
		model.InvalidatePricingCache()
	})

	require.NoError(t, db.Create(&model.User{
		Id:       1003,
		Username: "bifrost-model-list-user",
		Password: "password",
		Group:    "default",
		Status:   common.UserStatusEnabled,
	}).Error)

	channel := &model.Channel{
		Id:     701,
		Type:   constant.ChannelTypeBifrost,
		Key:    "bifrost-key",
		Status: common.ChannelStatusEnabled,
		Name:   "bifrost-channel",
		Group:  "default",
		Models: "gpt-5",
	}
	require.NoError(t, db.Create(channel).Error)
	seedModelBinding(t, db, 701, "default", "gpt-5", true)
	publishModelListCatalog(t, db, "gpt-5")

	model.InitChannelCache()
	model.GetPricing()

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/v1/models", nil)
	ctx.Set("id", 1003)

	ListModels(ctx, constant.ChannelTypeOpenAI)

	payload := decodeListModelsPayload(t, recorder)
	require.Len(t, payload.Data, 1)
	require.Equal(t, "gpt-5", payload.Data[0].Id)
	require.Equal(t, []constant.EndpointType{
		constant.EndpointTypeOpenAI,
		constant.EndpointTypeOpenAIResponse,
		constant.EndpointTypeAnthropic,
	}, payload.Data[0].SupportedEndpointTypes)
}

func TestListModelsTokenLimitIncludesTieredBillingModel(t *testing.T) {
	withSelfUseModeDisabled(t)
	withTieredBillingConfig(t, map[string]string{
		"zz-token-tiered-visible-model":      "tiered_expr",
		"zz-token-tiered-empty-expr-model":   "tiered_expr",
		"zz-token-tiered-missing-expr-model": "tiered_expr",
	}, map[string]string{
		"zz-token-tiered-visible-model":    `tier("base", p * 1 + c * 2)`,
		"zz-token-tiered-empty-expr-model": "",
	})
	db := setupModelListControllerTestDB(t)
	seedModelBinding(t, db, 1, "default", "zz-token-tiered-visible-model", true)
	seedModelBinding(t, db, 1, "default", "zz-token-tiered-empty-expr-model", true)
	seedModelBinding(t, db, 1, "default", "zz-token-tiered-missing-expr-model", true)
	seedModelBinding(t, db, 1, "default", "zz-token-unpriced-model", true)
	publishModelListCatalog(
		t,
		db,
		"zz-token-tiered-visible-model",
		"zz-token-tiered-empty-expr-model",
		"zz-token-tiered-missing-expr-model",
	)

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/v1/models", nil)
	common.SetContextKey(ctx, constant.ContextKeyUserGroup, "default")
	common.SetContextKey(ctx, constant.ContextKeyTokenModelLimitEnabled, true)
	common.SetContextKey(ctx, constant.ContextKeyTokenModelLimit, map[string]bool{
		"zz-token-tiered-visible-model":      true,
		"zz-token-tiered-empty-expr-model":   true,
		"zz-token-tiered-missing-expr-model": true,
		"zz-token-unpriced-model":            true,
	})

	ListModels(ctx, constant.ChannelTypeOpenAI)

	ids := decodeListModelsResponse(t, recorder)
	require.Contains(t, ids, "zz-token-tiered-visible-model")
	require.NotContains(t, ids, "zz-token-tiered-empty-expr-model")
	require.NotContains(t, ids, "zz-token-tiered-missing-expr-model")
	require.NotContains(t, ids, "zz-token-unpriced-model")
}

func TestListModelsIgnoresTokenGroupAndUsesUserInherit(t *testing.T) {
	withSelfUseModeEnabled(t)
	originalInherit := setting.GroupInherit2JSONString()
	require.NoError(t, setting.UpdateGroupInheritByJSONString(`{"vip":["vip","default"],"default":["default"]}`))
	t.Cleanup(func() {
		require.NoError(t, setting.UpdateGroupInheritByJSONString(originalInherit))
	})

	db := setupModelListControllerTestDB(t)
	seedModelBinding(t, db, 1, "vip", "zz-vip-allowed", true)
	seedModelBinding(t, db, 1, "vip", "zz-vip-denied", true)
	seedModelBinding(t, db, 2, "default", "zz-default-outside-snapshot", true)
	publishModelListCatalog(t, db, "zz-vip-allowed", "zz-vip-denied", "zz-default-outside-snapshot")

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/v1/models", nil)
	common.SetContextKey(ctx, constant.ContextKeyUserGroup, "default")
	common.SetContextKey(ctx, constant.ContextKeyTokenGroup, "auto")
	common.SetContextKey(ctx, constant.ContextKeyTokenAutoGroups, []string{"vip"})
	common.SetContextKey(ctx, constant.ContextKeyTokenModelLimitEnabled, true)
	common.SetContextKey(ctx, constant.ContextKeyTokenModelLimit, map[string]bool{
		"zz-vip-allowed":              true,
		"zz-default-outside-snapshot": true,
		"zz-not-enabled":              true,
	})

	ListModels(ctx, constant.ChannelTypeOpenAI)
	ids := decodeListModelsResponse(t, recorder)
	require.Equal(t, map[string]struct{}{"zz-default-outside-snapshot": {}}, ids)

	vipRecorder := httptest.NewRecorder()
	vipCtx, _ := gin.CreateTestContext(vipRecorder)
	vipCtx.Request = httptest.NewRequest(http.MethodGet, "/v1/models", nil)
	common.SetContextKey(vipCtx, constant.ContextKeyUserGroup, "vip")
	common.SetContextKey(vipCtx, constant.ContextKeyTokenModelLimitEnabled, true)
	common.SetContextKey(vipCtx, constant.ContextKeyTokenModelLimit, map[string]bool{
		"zz-vip-allowed":              true,
		"zz-default-outside-snapshot": true,
	})
	ListModels(vipCtx, constant.ChannelTypeOpenAI)
	require.Equal(t, map[string]struct{}{
		"zz-vip-allowed":              {},
		"zz-default-outside-snapshot": {},
	}, decodeListModelsResponse(t, vipRecorder))
}

func TestCheckUpdatePasswordRequiresCurrentPassword(t *testing.T) {
	db := setupModelListControllerTestDB(t)
	hashedPassword, err := common.Password2Hash("CurrentPassword123")
	require.NoError(t, err)
	user := &model.User{
		Username: "password-user",
		Password: hashedPassword,
		Status:   common.UserStatusEnabled,
	}
	require.NoError(t, db.Create(user).Error)

	updatePassword, err := checkUpdatePassword("", "", user.Id)
	require.NoError(t, err)
	assert.False(t, updatePassword)

	updatePassword, err = checkUpdatePassword("", "NewPassword123", user.Id)
	require.Error(t, err)
	assert.False(t, updatePassword)
	assert.ErrorIs(t, err, errOriginalPasswordFail)

	updatePassword, err = checkUpdatePassword("CurrentPassword123", "NewPassword123", user.Id)
	require.NoError(t, err)
	assert.True(t, updatePassword)
}

func TestCheckUpdatePasswordRejectsHistoricalEmptyPassword(t *testing.T) {
	db := setupModelListControllerTestDB(t)
	user := &model.User{
		Username: "legacy-passwordless-user",
		Password: "",
		Status:   common.UserStatusEnabled,
	}
	require.NoError(t, db.Create(user).Error)

	updatePassword, err := checkUpdatePassword("", "NewPassword123", user.Id)
	require.Error(t, err)
	assert.False(t, updatePassword)
	assert.ErrorIs(t, err, errUserPasswordUnset)
}

func TestSetupLoginDoesNotTouchPasswordWhenPasswordFieldOmitted(t *testing.T) {
	db := setupModelListControllerTestDB(t)
	require.NoError(t, db.AutoMigrate(&model.Log{}, &model.UserSession{}))

	hashedPassword, err := common.Password2Hash("CurrentPassword123")
	require.NoError(t, err)
	user := &model.User{
		Username: "twofa-user",
		Password: hashedPassword,
		Role:     common.RoleCommonUser,
		Status:   common.UserStatusEnabled,
		Group:    "default",
	}
	require.NoError(t, db.Create(user).Error)

	router := gin.New()
	router.GET("/", func(c *gin.Context) {
		setupLogin(&model.User{
			Id:       user.Id,
			Username: user.Username,
			Role:     user.Role,
			Status:   user.Status,
			Group:    user.Group,
		}, c)
	})

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/", nil)
	router.ServeHTTP(recorder, request)

	require.Equal(t, http.StatusOK, recorder.Code)
	var stored model.User
	require.NoError(t, db.First(&stored, user.Id).Error)
	assert.Equal(t, hashedPassword, stored.Password)
}
