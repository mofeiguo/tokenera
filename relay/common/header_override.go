package common

import (
	"fmt"
	"strings"
)

func GetEffectiveHeaderOverride(info *RelayInfo) map[string]interface{} {
	if info == nil || info.ChannelMeta == nil {
		return map[string]interface{}{}
	}
	return sanitizeHeaderOverrideMap(info.ChannelMeta.HeadersOverride)
}

func sanitizeHeaderOverrideMap(source map[string]interface{}) map[string]interface{} {
	if len(source) == 0 {
		return map[string]interface{}{}
	}
	target := make(map[string]interface{}, len(source))
	for key, value := range source {
		normalizedKey := strings.TrimSpace(strings.ToLower(key))
		if normalizedKey == "" {
			continue
		}
		normalizedValue := strings.TrimSpace(fmt.Sprintf("%v", value))
		if normalizedValue == "" {
			if isHeaderPassthroughRuleKey(normalizedKey) {
				target[normalizedKey] = ""
			}
			continue
		}
		target[normalizedKey] = normalizedValue
	}
	return target
}

func isHeaderPassthroughRuleKey(key string) bool {
	key = strings.TrimSpace(strings.ToLower(key))
	if key == "" {
		return false
	}
	if key == "*" {
		return true
	}
	return strings.HasPrefix(key, "re:") || strings.HasPrefix(key, "regex:")
}
