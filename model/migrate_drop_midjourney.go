package model

import "github.com/QuantumNous/new-api/common"

func migrateDropMidjourneyTable() error {
	if !DB.Migrator().HasTable("midjourneys") {
		return nil
	}
	if err := DB.Migrator().DropTable("midjourneys"); err != nil {
		return err
	}
	common.SysLog("dropped midjourneys table")
	return nil
}
