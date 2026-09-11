package model

import (
	"fmt"
	"strings"

	"github.com/QuantumNous/new-api/common"

	"gorm.io/gorm"
)

// migrateDropOutboundRewriteColumns drops request-rewrite columns that no longer
// affect outbound traffic. Existing rows are not preserved.
func migrateDropOutboundRewriteColumns() error {
	if err := dropTableColumnIfExists("channels", "model_mapping"); err != nil {
		return err
	}
	return dropTableColumnIfExists("channels", "param_override")
}

func dropTableColumnIfExists(tableName, columnName string) error {
	// glebarez/sqlite DropColumn panics when given a table name string
	// (stmt.Schema is nil). Use raw DROP COLUMN, which SQLite >= 3.35,
	// MySQL, and PostgreSQL all support.
	return dropColumnIfExistsOn(DB, tableName, columnName, quoteOutboundRewriteIdent)
}

func dropColumnIfExistsOn(db *gorm.DB, tableName, columnName string, quoteIdent func(string) string) error {
	if db == nil || !db.Migrator().HasTable(tableName) {
		return nil
	}
	if !hasColumnOn(db, tableName, columnName) {
		return nil
	}
	sql := fmt.Sprintf(
		"ALTER TABLE %s DROP COLUMN %s",
		quoteIdent(tableName),
		quoteIdent(columnName),
	)
	if err := db.Exec(sql).Error; err != nil {
		return fmt.Errorf("failed to drop %s.%s: %w", tableName, columnName, err)
	}
	common.SysLog(fmt.Sprintf("dropped %s.%s", tableName, columnName))
	return nil
}

func quoteOutboundRewriteIdent(name string) string {
	if common.UsingMainDatabase(common.DatabaseTypePostgreSQL) {
		return `"` + name + `"`
	}
	return "`" + name + "`"
}

func hasDBColumn(tableName, columnName string) bool {
	return hasColumnOn(DB, tableName, columnName)
}

func hasColumnOn(db *gorm.DB, tableName, columnName string) bool {
	if db == nil {
		return false
	}
	columns, err := db.Migrator().ColumnTypes(tableName)
	if err == nil {
		for _, column := range columns {
			if strings.EqualFold(column.Name(), columnName) {
				return true
			}
		}
	}
	return hasColumnViaSQL(db, tableName, columnName)
}

func hasColumnViaSQL(db *gorm.DB, tableName, columnName string) bool {
	switch db.Dialector.Name() {
	case "sqlite", "sqlite3":
		var cols []struct {
			Name string `gorm:"column:name"`
		}
		if err := db.Raw("PRAGMA table_info(" + quoteOutboundRewriteIdent(tableName) + ")").Scan(&cols).Error; err != nil {
			return false
		}
		for _, col := range cols {
			if strings.EqualFold(col.Name, columnName) {
				return true
			}
		}
		return false
	case "mysql":
		var count int64
		err := db.Raw(
			"SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
			tableName, columnName,
		).Scan(&count).Error
		return err == nil && count > 0
	case "postgres":
		var count int64
		err := db.Raw(
			"SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = ? AND column_name = ?",
			tableName, columnName,
		).Scan(&count).Error
		return err == nil && count > 0
	default:
		return false
	}
}
