package model

import (
	"fmt"
	"strings"

	"github.com/QuantumNous/new-api/common"
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
	if !DB.Migrator().HasTable(tableName) {
		return nil
	}
	if !hasDBColumn(tableName, columnName) {
		return nil
	}
	// glebarez/sqlite DropColumn panics when given a table name string
	// (stmt.Schema is nil). Use raw DROP COLUMN, which SQLite >= 3.35,
	// MySQL, and PostgreSQL all support.
	sql := fmt.Sprintf(
		"ALTER TABLE %s DROP COLUMN %s",
		quoteOutboundRewriteIdent(tableName),
		quoteOutboundRewriteIdent(columnName),
	)
	if err := DB.Exec(sql).Error; err != nil {
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
	columns, err := DB.Migrator().ColumnTypes(tableName)
	if err != nil {
		return false
	}
	for _, column := range columns {
		if strings.EqualFold(column.Name(), columnName) {
			return true
		}
	}
	return false
}
