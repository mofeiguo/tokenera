package setting

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetAccessibleGroupsUsesInheritOrder(t *testing.T) {
	original := GroupInherit2JSONString()
	t.Cleanup(func() {
		require.NoError(t, UpdateGroupInheritByJSONString(original))
	})
	require.NoError(t, UpdateGroupInheritByJSONString(`{"vip":["vip","default"],"svip":["svip","vip","default"]}`))

	assert.Equal(t, []string{"vip", "default"}, GetAccessibleGroups("vip"))
	assert.Equal(t, []string{"svip", "vip", "default"}, GetAccessibleGroups("svip"))
	assert.Equal(t, []string{"enterprise"}, GetAccessibleGroups("enterprise"))
	assert.Equal(t, []string{"default"}, GetAccessibleGroups(""))
}

func TestGetAccessibleGroupsKeepsIdentityFirst(t *testing.T) {
	original := GroupInherit2JSONString()
	t.Cleanup(func() {
		require.NoError(t, UpdateGroupInheritByJSONString(original))
	})
	require.NoError(t, UpdateGroupInheritByJSONString(`{"vip":["default","vip"]}`))

	assert.Equal(t, []string{"vip", "default"}, GetAccessibleGroups("vip"))
}

func TestUpdateGroupInheritRejectsEmptyList(t *testing.T) {
	err := UpdateGroupInheritByJSONString(`{"vip":[]}`)
	require.Error(t, err)
}
