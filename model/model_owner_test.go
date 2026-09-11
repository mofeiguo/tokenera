package model

import (
	"fmt"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/stretchr/testify/require"
)

func clearPreferredOwnerTables(t *testing.T) {
	t.Helper()
	require.NoError(t, DB.Exec("DELETE FROM model_bindings").Error)
	require.NoError(t, DB.Exec("DELETE FROM models").Error)
	require.NoError(t, DB.Exec("DELETE FROM channels").Error)
}

func insertPreferredOwnerCandidate(
	t *testing.T,
	channelID int,
	modelName string,
	group string,
	channelType int,
	priority int64,
	weight uint,
	channelStatus int,
	bindingEnabled bool,
) {
	t.Helper()
	require.NoError(t, DB.Create(&Channel{
		Id:     channelID,
		Type:   channelType,
		Key:    fmt.Sprintf("key-%d", channelID),
		Status: channelStatus,
		Name:   fmt.Sprintf("channel-%d", channelID),
	}).Error)
	var catalogModel Model
	require.NoError(t, DB.FirstOrCreate(&catalogModel, Model{
		ModelName: modelName,
		Status:    1,
		NameRule:  NameRuleExact,
	}).Error)
	if !bindingEnabled {
		return
	}
	require.NoError(t, DB.Create(&ModelBinding{
		ModelId:   catalogModel.Id,
		ChannelId: channelID,
		Priority:  priority,
		Weight:    int(weight),
		Enabled:   true,
	}).Error)
}

func TestGetPreferredModelOwnerChannelTypes(t *testing.T) {
	const modelName = "gpt-5.4"

	tests := []struct {
		name           string
		setup          func(t *testing.T)
		wantChannelTyp int
		wantOK         bool
	}{
		{
			name: "openai only",
			setup: func(t *testing.T) {
				insertPreferredOwnerCandidate(t, 1, modelName, "default", constant.ChannelTypeOpenAI, 0, 0, common.ChannelStatusEnabled, true)
			},
			wantChannelTyp: constant.ChannelTypeOpenAI,
			wantOK:         true,
		},
		{
			name: "codex only",
			setup: func(t *testing.T) {
				insertPreferredOwnerCandidate(t, 1, modelName, "default", constant.ChannelTypeCodex, 0, 0, common.ChannelStatusEnabled, true)
			},
			wantChannelTyp: constant.ChannelTypeCodex,
			wantOK:         true,
		},
		{
			name: "priority wins",
			setup: func(t *testing.T) {
				insertPreferredOwnerCandidate(t, 1, modelName, "default", constant.ChannelTypeOpenAI, 1, 100, common.ChannelStatusEnabled, true)
				insertPreferredOwnerCandidate(t, 2, modelName, "default", constant.ChannelTypeCodex, 2, 0, common.ChannelStatusEnabled, true)
			},
			wantChannelTyp: constant.ChannelTypeCodex,
			wantOK:         true,
		},
		{
			name: "weight wins when priority is equal",
			setup: func(t *testing.T) {
				insertPreferredOwnerCandidate(t, 1, modelName, "default", constant.ChannelTypeOpenAI, 1, 10, common.ChannelStatusEnabled, true)
				insertPreferredOwnerCandidate(t, 2, modelName, "default", constant.ChannelTypeCodex, 1, 20, common.ChannelStatusEnabled, true)
			},
			wantChannelTyp: constant.ChannelTypeCodex,
			wantOK:         true,
		},
		{
			name: "channel id stabilizes exact ties",
			setup: func(t *testing.T) {
				insertPreferredOwnerCandidate(t, 2, modelName, "default", constant.ChannelTypeCodex, 1, 10, common.ChannelStatusEnabled, true)
				insertPreferredOwnerCandidate(t, 1, modelName, "default", constant.ChannelTypeOpenAI, 1, 10, common.ChannelStatusEnabled, true)
			},
			wantChannelTyp: constant.ChannelTypeOpenAI,
			wantOK:         true,
		},
		{
			name: "channel group does not hide higher priority binding",
			setup: func(t *testing.T) {
				insertPreferredOwnerCandidate(t, 1, modelName, "vip", constant.ChannelTypeCodex, 10, 100, common.ChannelStatusEnabled, true)
				insertPreferredOwnerCandidate(t, 2, modelName, "default", constant.ChannelTypeOpenAI, 1, 0, common.ChannelStatusEnabled, true)
			},
			wantChannelTyp: constant.ChannelTypeCodex,
			wantOK:         true,
		},
		{
			name: "disabled candidates are ignored",
			setup: func(t *testing.T) {
				insertPreferredOwnerCandidate(t, 1, modelName, "default", constant.ChannelTypeCodex, 10, 100, common.ChannelStatusEnabled, false)
				insertPreferredOwnerCandidate(t, 2, modelName, "default", constant.ChannelTypeOpenAI, 1, 0, common.ChannelStatusManuallyDisabled, true)
			},
			wantOK: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			clearPreferredOwnerTables(t)
			tt.setup(t)

			got, err := GetPreferredModelOwnerChannelTypes([]string{modelName})
			require.NoError(t, err)
			if !tt.wantOK {
				require.NotContains(t, got, modelName)
				return
			}
			channelType, ok := got[modelName]
			require.True(t, ok)
			require.Equal(t, tt.wantChannelTyp, channelType)
		})
	}
}
