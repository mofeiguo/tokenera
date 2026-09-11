package service

import (
	"fmt"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupChannelSelectSinglePoolTest(t *testing.T) *gorm.DB {
	t.Helper()

	originalDB := model.DB
	originalMemoryCacheEnabled := common.MemoryCacheEnabled
	originalRetryTimes := common.RetryTimes

	dsn := fmt.Sprintf("file:%s?mode=memory&cache=shared", strings.ReplaceAll(t.Name(), "/", "_"))
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&model.Channel{}, &model.Model{}, &model.ModelBinding{}))
	model.DB = db
	common.MemoryCacheEnabled = true
	common.RetryTimes = 0

	t.Cleanup(func() {
		model.DB = originalDB
		common.MemoryCacheEnabled = originalMemoryCacheEnabled
		common.RetryTimes = originalRetryTimes
		if originalMemoryCacheEnabled && originalDB != nil &&
			originalDB.Migrator().HasTable(&model.Channel{}) {
			model.InitChannelCache()
		}
		sqlDB, err := db.DB()
		if err == nil {
			require.NoError(t, sqlDB.Close())
		}
	})

	return db
}

func createSinglePoolChannel(t *testing.T, db *gorm.DB, id int, group, modelName string) {
	t.Helper()
	require.NoError(t, db.Create(&model.Channel{
		Id:     id,
		Type:   constant.ChannelTypeOpenAI,
		Key:    fmt.Sprintf("key-%d", id),
		Status: common.ChannelStatusEnabled,
		Name:   fmt.Sprintf("channel-%d", id),
		Models: modelName,
	}).Error)
	var catalogModel model.Model
	require.NoError(t, db.FirstOrCreate(&catalogModel, model.Model{
		ModelName: modelName,
		Status:    1,
		NameRule:  model.NameRuleExact,
	}).Error)
	require.NoError(t, db.Create(&model.ModelBinding{
		ModelId:   catalogModel.Id,
		ChannelId: id,
		Enabled:   true,
	}).Error)
}

func TestCacheGetRandomSatisfiedChannelSelectsAnyEnabledBinding(t *testing.T) {
	db := setupChannelSelectSinglePoolTest(t)
	const modelName = "single-pool-vip-channel"
	createSinglePoolChannel(t, db, 2101, "vip", modelName)
	model.InitChannelCache()

	gin.SetMode(gin.TestMode)
	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	common.SetContextKey(ctx, constant.ContextKeyUserGroup, "default")

	retry := 0
	channel, selectedGroup, err := CacheGetRandomSatisfiedChannel(&RetryParam{
		Ctx:         ctx,
		ModelName:   modelName,
		RequestPath: "/v1/chat/completions",
		Retry:       &retry,
	})
	require.NoError(t, err)
	require.NotNil(t, channel)
	assert.Equal(t, 2101, channel.Id)
	assert.Equal(t, modelName, selectedGroup)
}

func TestCacheGetRandomSatisfiedChannelIgnoresTokenAndUserGroup(t *testing.T) {
	db := setupChannelSelectSinglePoolTest(t)
	const modelName = "single-pool-ignores-group"
	createSinglePoolChannel(t, db, 2301, "vip", modelName)
	model.InitChannelCache()

	gin.SetMode(gin.TestMode)
	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	common.SetContextKey(ctx, constant.ContextKeyUserGroup, "default")

	retry := 0
	channel, selectedGroup, err := CacheGetRandomSatisfiedChannel(&RetryParam{
		Ctx:         ctx,
		ModelName:   modelName,
		RequestPath: "/v1/chat/completions",
		Retry:       &retry,
	})
	require.NoError(t, err)
	require.NotNil(t, channel)
	assert.Equal(t, 2301, channel.Id)
	assert.Equal(t, modelName, selectedGroup)
}
