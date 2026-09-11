package model

// migrateDropChannelRoutingColumns drops legacy channel-level routing and
// health-check columns that no longer affect request selection or channel
// management. Existing values are not preserved.
func migrateDropChannelRoutingColumns() error {
	for _, columnName := range []string{
		"priority",
		"weight",
		"test_model",
		"auto_ban",
	} {
		if err := dropTableColumnIfExists("channels", columnName); err != nil {
			return err
		}
	}
	return nil
}
