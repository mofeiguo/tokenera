package setting

import (
	"encoding/json"
	"fmt"
	"strings"
	"sync"

	"github.com/QuantumNous/new-api/common"
)

var defaultGroupInherit = map[string][]string{
	"default": {"default"},
	"vip":     {"vip", "default"},
	"svip":    {"svip", "vip", "default"},
}

var groupInherit = copyGroupInherit(defaultGroupInherit)
var groupInheritMutex sync.RWMutex

func copyGroupInherit(src map[string][]string) map[string][]string {
	dst := make(map[string][]string, len(src))
	for identity, groups := range src {
		copied := make([]string, len(groups))
		copy(copied, groups)
		dst[identity] = copied
	}
	return dst
}

func GroupInherit2JSONString() string {
	groupInheritMutex.RLock()
	defer groupInheritMutex.RUnlock()
	jsonBytes, err := json.Marshal(groupInherit)
	if err != nil {
		common.SysLog("error marshalling group inherit: " + err.Error())
		return "{}"
	}
	return string(jsonBytes)
}

func UpdateGroupInheritByJSONString(jsonStr string) error {
	normalized, err := parseGroupInherit(jsonStr)
	if err != nil {
		return err
	}
	groupInheritMutex.Lock()
	defer groupInheritMutex.Unlock()
	groupInherit = normalized
	return nil
}

func parseGroupInherit(jsonStr string) (map[string][]string, error) {
	raw := make(map[string][]string)
	if err := json.Unmarshal([]byte(jsonStr), &raw); err != nil {
		return nil, err
	}
	normalized := make(map[string][]string, len(raw))
	for identity, groups := range raw {
		identity = strings.TrimSpace(identity)
		if identity == "" {
			return nil, fmt.Errorf("group inherit identity must not be empty")
		}
		cleaned := normalizeGroupList(groups)
		if len(cleaned) == 0 {
			return nil, fmt.Errorf("group inherit list for %s must not be empty", identity)
		}
		normalized[identity] = cleaned
	}
	return normalized, nil
}

func normalizeGroupList(groups []string) []string {
	result := make([]string, 0, len(groups))
	seen := make(map[string]struct{}, len(groups))
	for _, group := range groups {
		group = strings.TrimSpace(group)
		if group == "" {
			continue
		}
		if _, exists := seen[group]; exists {
			continue
		}
		seen[group] = struct{}{}
		result = append(result, group)
	}
	return result
}

// GetAccessibleGroups returns the ordered groups an identity can use.
// The identity group is always first. Unknown identities only get themselves.
func GetAccessibleGroups(identityGroup string) []string {
	identityGroup = strings.TrimSpace(identityGroup)
	if identityGroup == "" {
		identityGroup = "default"
	}
	groupInheritMutex.RLock()
	configured, ok := groupInherit[identityGroup]
	copied := append([]string(nil), configured...)
	groupInheritMutex.RUnlock()
	if !ok || len(copied) == 0 {
		return []string{identityGroup}
	}
	result := []string{identityGroup}
	seen := map[string]struct{}{identityGroup: {}}
	for _, group := range copied {
		if _, exists := seen[group]; exists {
			continue
		}
		seen[group] = struct{}{}
		result = append(result, group)
	}
	return result
}
