package service

import (
	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

type RetryParam struct {
	Ctx          *gin.Context
	TokenGroup   string
	ModelName    string
	RequestPath  string
	Retry        *int
	resetNextTry bool
}

func (p *RetryParam) GetRetry() int {
	if p.Retry == nil {
		return 0
	}
	return *p.Retry
}

func (p *RetryParam) SetRetry(retry int) {
	p.Retry = &retry
}

func (p *RetryParam) IncreaseRetry() {
	if p.resetNextTry {
		p.resetNextTry = false
		return
	}
	if p.Retry == nil {
		p.Retry = new(int)
	}
	*p.Retry++
}

func (p *RetryParam) ResetRetryNextTry() {
	p.resetNextTry = true
}

// CacheGetRandomSatisfiedChannel selects a channel using the user's identity group
// and the configured inherit list. The identity group is tried first; if it has
// no enabled binding, later inherited groups are used.
func CacheGetRandomSatisfiedChannel(param *RetryParam) (*model.Channel, string, error) {
	userGroup := common.GetContextKeyString(param.Ctx, constant.ContextKeyUserGroup)
	if userGroup == "" || userGroup == "auto" {
		userGroup = param.TokenGroup
	}
	if userGroup == "" || userGroup == "auto" {
		userGroup = "default"
	}
	accessible := GetRequestAccessibleGroups(param.Ctx)
	if len(accessible) == 0 {
		accessible = []string{userGroup}
	}
	var lastErr error
	for _, group := range accessible {
		logger.LogDebug(param.Ctx, "Selecting channel for identity %s via group %s", userGroup, group)
		channel, err := model.GetRandomSatisfiedChannel(group, param.ModelName, param.GetRetry(), param.RequestPath)
		if err != nil {
			lastErr = err
			continue
		}
		if channel != nil {
			return channel, group, nil
		}
	}
	return nil, userGroup, lastErr
}
