package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetCodexChannelUsage(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"success": false, "message": "Codex channel type is no longer supported"})
}

func GetCodexChannelRateLimitResetCredits(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"success": false, "message": "Codex channel type is no longer supported"})
}

func ResetCodexChannelUsage(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"success": false, "message": "Codex channel type is no longer supported"})
}
