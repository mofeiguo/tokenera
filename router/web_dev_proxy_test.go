package router

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSetDevWebProxyForwardsFrontendAndKeepsAPILocal(t *testing.T) {
	gin.SetMode(gin.TestMode)

	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-From", "vite")
		_, _ = io.WriteString(w, r.URL.Path)
	}))
	t.Cleanup(upstream.Close)

	engine := gin.New()
	require.NoError(t, SetDevWebProxy(engine, upstream.URL))
	server := httptest.NewServer(engine)
	t.Cleanup(server.Close)

	frontend, err := http.Get(server.URL + "/channels")
	require.NoError(t, err)
	frontendBody, err := io.ReadAll(frontend.Body)
	require.NoError(t, frontend.Body.Close())
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, frontend.StatusCode)
	assert.Equal(t, "vite", frontend.Header.Get("X-From"))
	assert.Equal(t, "/channels", string(frontendBody))

	missingAPI, err := http.Get(server.URL + "/api/group/")
	require.NoError(t, err)
	require.NoError(t, missingAPI.Body.Close())
	assert.Equal(t, http.StatusNotFound, missingAPI.StatusCode)
	assert.Empty(t, missingAPI.Header.Get("X-From"))
}

func TestSetDevWebProxyRejectsInvalidURL(t *testing.T) {
	gin.SetMode(gin.TestMode)
	err := SetDevWebProxy(gin.New(), "not-a-url")
	require.Error(t, err)
}
