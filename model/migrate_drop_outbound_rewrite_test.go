package model

import (
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func useOutboundRewriteMigrationDB(t *testing.T) *gorm.DB {
	t.Helper()
	previousDB := DB
	previousType := common.MainDatabaseType()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	DB = db
	common.SetMainDatabaseType(common.DatabaseTypeSQLite)
	t.Cleanup(func() {
		DB = previousDB
		common.SetMainDatabaseType(previousType)
	})
	return db
}

func TestDropTableColumnIfExistsRemovesSQLiteColumn(t *testing.T) {
	db := useOutboundRewriteMigrationDB(t)
	require.NoError(t, db.Exec(`
		CREATE TABLE channels (
			id INTEGER PRIMARY KEY,
			name TEXT,
			model_mapping TEXT,
			param_override TEXT
		)
	`).Error)
	require.True(t, hasDBColumn("channels", "model_mapping"))

	require.NoError(t, dropTableColumnIfExists("channels", "model_mapping"))
	require.False(t, hasDBColumn("channels", "model_mapping"))
	require.True(t, hasDBColumn("channels", "param_override"))

	require.NoError(t, dropTableColumnIfExists("channels", "model_mapping"))
	require.NoError(t, dropTableColumnIfExists("channels", "missing_column"))
}
