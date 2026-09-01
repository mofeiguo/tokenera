package common

import (
	"bytes"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewOutboundJSONBody_GetBodyReplaysFullBody(t *testing.T) {
	t.Parallel()

	payload := []byte(`{"model":"test-model","messages":[{"role":"user","content":"hello"}]}`)

	body, closer, err := NewOutboundJSONBody(payload)
	require.NoError(t, err)
	defer closer.Close()

	assert.EqualValues(t, len(payload), body.Size())

	// Consume the primary body, as the HTTP transport does on the first attempt.
	first, err := io.ReadAll(body)
	require.NoError(t, err)
	assert.Equal(t, payload, first)

	// GetBody must hand out the complete body again — and repeatedly, since the
	// transport may need more than one retry.
	for i := 0; i < 2; i++ {
		rc, err := body.NewReader()
		require.NoError(t, err)
		replay, err := io.ReadAll(rc)
		require.NoError(t, err)
		require.NoError(t, rc.Close())
		assert.Equal(t, payload, replay, "replay %d must equal the original payload", i+1)
	}
}

func TestNewOutboundJSONBody_GetBodyAfterPartialRead(t *testing.T) {
	t.Parallel()

	payload := []byte(`{"model":"test-model","input":"0123456789"}`)

	body, closer, err := NewOutboundJSONBody(payload)
	require.NoError(t, err)
	defer closer.Close()

	// Simulate an aborted first attempt that only wrote part of the body.
	partial := make([]byte, 10)
	_, err = io.ReadFull(body, partial)
	require.NoError(t, err)

	rc, err := body.NewReader()
	require.NoError(t, err)
	replay, err := io.ReadAll(rc)
	require.NoError(t, err)
	assert.Equal(t, payload, replay)

	// Closing the replayed body must not close the underlying storage: the
	// handler owns the storage lifetime via the returned closer.
	require.NoError(t, rc.Close())
	rc2, err := body.NewReader()
	require.NoError(t, err)
	replay2, err := io.ReadAll(rc2)
	require.NoError(t, err)
	require.NoError(t, rc2.Close())
	assert.Equal(t, payload, replay2)
}

// assertIndependentReplayReaders proves that readers handed out by getBody own
// independent cursors, per the http.Request.GetBody contract of returning a
// new copy of the body: interleaved reads across two replay readers and the
// primary body each observe exactly their own byte stream.
func assertIndependentReplayReaders(t *testing.T, payload []byte, body common.ReplayableBody) {
	t.Helper()

	half := len(payload) / 2

	// Partially drain the primary body first, as if attempt N's body write
	// were still in flight when the transport builds attempt N+1 via GetBody.
	primaryHead := make([]byte, half)
	_, err := io.ReadFull(body, primaryHead)
	require.NoError(t, err)
	assert.Equal(t, payload[:half], primaryHead)

	// Interleave two replay readers: A reads half, B reads everything, then A
	// reads the rest.
	a, err := body.NewReader()
	require.NoError(t, err)
	b, err := body.NewReader()
	require.NoError(t, err)

	aHead := make([]byte, half)
	_, err = io.ReadFull(a, aHead)
	require.NoError(t, err)
	assert.Equal(t, payload[:half], aHead)

	bAll, err := io.ReadAll(b)
	require.NoError(t, err)
	require.NoError(t, b.Close())
	assert.Equal(t, payload, bAll, "reader B must see the complete body even while A is mid-read")

	aRest, err := io.ReadAll(a)
	require.NoError(t, err)
	require.NoError(t, a.Close())
	assert.Equal(t, payload[half:], aRest, "reader A must resume from its own cursor, unaffected by B")

	// The replays must not have disturbed the primary body's cursor either.
	primaryRest, err := io.ReadAll(body)
	require.NoError(t, err)
	assert.Equal(t, payload[half:], primaryRest, "the primary body must be unaffected by replay readers")
}

func TestNewOutboundJSONBody_GetBodyReadersAreIndependent(t *testing.T) {
	t.Parallel()

	payload := []byte(`{"model":"test-model","input":"abcdefghijklmnopqrstuvwxyz"}`)

	body, closer, err := NewOutboundJSONBody(payload)
	require.NoError(t, err)
	defer closer.Close()

	assertIndependentReplayReaders(t, payload, body)

	// Once the handler releases the storage, GetBody must fail loudly instead
	// of replaying stale data.
	require.NoError(t, closer.Close())
	_, err = body.NewReader()
	require.ErrorIs(t, err, common.ErrStorageClosed)
}

// TestNewOutboundJSONBody_GetBodyReadersAreIndependent_DiskStorage runs the
// same independence assertions against the disk-backed storage. Deliberately
// not parallel: it temporarily lowers the global disk-cache threshold so the
// payload takes the diskStorage path.
func TestNewOutboundJSONBody_GetBodyReadersAreIndependent_DiskStorage(t *testing.T) {
	prev := common.GetDiskCacheConfig()
	common.SetDiskCacheConfig(common.DiskCacheConfig{
		Enabled:     true,
		ThresholdMB: 0,
		MaxSizeMB:   64,
		Path:        t.TempDir(),
	})
	defer common.SetDiskCacheConfig(prev)

	payload := []byte(`{"model":"test-model","input":"abcdefghijklmnopqrstuvwxyz"}`)

	body, closer, err := NewOutboundJSONBody(payload)
	require.NoError(t, err)
	defer closer.Close()

	storage, ok := closer.(common.BodyStorage)
	require.True(t, ok)
	assert.True(t, storage.IsDisk(), "the payload must have taken the diskStorage path")

	assertIndependentReplayReaders(t, payload, body)

	require.NoError(t, closer.Close())
	_, err = body.NewReader()
	require.ErrorIs(t, err, common.ErrStorageClosed)
}

func TestNewOutboundRawBodyMatchesClientJSONBytes(t *testing.T) {
	payload := []byte(`{"model":"gpt-4.1","messages":[{"role":"user","content":"hi"}],"future_field":{"nested":true},"stream_options":{"include_usage":true}}`)
	c := newGinContextWithBody(t, "/v1/chat/completions", "application/json", payload)

	body, err := NewOutboundRawBody(c)
	require.NoError(t, err)

	got, err := io.ReadAll(body)
	require.NoError(t, err)
	assert.Equal(t, payload, got)

	rc, err := body.NewReader()
	require.NoError(t, err)
	replay, err := io.ReadAll(rc)
	require.NoError(t, err)
	require.NoError(t, rc.Close())
	assert.Equal(t, payload, replay)
}

func TestNewOutboundRawBodyMatchesClientMultipartBytes(t *testing.T) {
	payload := []byte("--boundary123\r\nContent-Disposition: form-data; name=\"model\"\r\n\r\nwhisper-1\r\n--boundary123\r\nContent-Disposition: form-data; name=\"file\"; filename=\"a.wav\"\r\nContent-Type: audio/wav\r\n\r\nRIFFDATA\r\n--boundary123--\r\n")
	c := newGinContextWithBody(t, "/v1/audio/transcriptions", "multipart/form-data; boundary=boundary123", payload)

	body, err := NewOutboundRawBody(c)
	require.NoError(t, err)
	got, err := io.ReadAll(body)
	require.NoError(t, err)
	assert.Equal(t, payload, got)
}

func TestNewOutboundRawBodyPreservesAlphaSearchUnknownFields(t *testing.T) {
	payload := []byte(`{"id":"req_1","model":"gpt-5.1","commands":{"search_query":[{"q":"weather"}]},"future_field":{"nested":true}}`)
	c := newGinContextWithBody(t, "/v1/alpha/search", "application/json", payload)

	body, err := NewOutboundRawBody(c)
	require.NoError(t, err)
	got, err := io.ReadAll(body)
	require.NoError(t, err)
	assert.Equal(t, payload, got)
}

func TestRewriteOutboundJSONModelReplacesExistingModel(t *testing.T) {
	got, err := RewriteOutboundJSONModel(
		[]byte(`{"model":"my-alias","stream":true}`),
		"deepseek-v4-pro",
	)
	require.NoError(t, err)
	assert.Contains(t, string(got), `"model":"deepseek-v4-pro"`)
	assert.NotContains(t, string(got), "my-alias")
}

func TestRewriteOutboundJSONModelSkipsBodiesWithoutModel(t *testing.T) {
	raw := []byte(`{"contents":[{"role":"user","parts":[{"text":"hi"}]}]}`)
	got, err := RewriteOutboundJSONModel(raw, "gemini-2.5-flash")
	require.NoError(t, err)
	assert.Equal(t, raw, got)
}

func newGinContextWithBody(t *testing.T, path, contentType string, payload []byte) *gin.Context {
	t.Helper()
	gin.SetMode(gin.TestMode)
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	c.Request = httptest.NewRequest(http.MethodPost, path, bytes.NewReader(payload))
	c.Request.Header.Set("Content-Type", contentType)
	c.Request.ContentLength = int64(len(payload))
	t.Cleanup(func() { common.CleanupBodyStorage(c) })
	return c
}
