package common

import (
	"io"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/tidwall/gjson"
	"github.com/tidwall/sjson"

	"github.com/gin-gonic/gin"
)

// NewOutboundRawBody returns the client request body as stored on the gin
// context, without protocol conversion, field stripping, or model rewrite.
// The returned reader is replayable so transport-level retries can resend the
// same bytes.
func NewOutboundRawBody(c *gin.Context) (common.ReplayableBody, error) {
	storage, err := common.GetBodyStorage(c)
	if err != nil {
		return nil, err
	}
	if common.DebugEnabled {
		if debugBytes, bErr := storage.Bytes(); bErr == nil {
			logger.LogDebug(c, "requestBody: %s", debugBytes)
		}
	}
	return common.NewReplayableBodyReader(storage), nil
}

// NewOutboundJSONBody wraps the already-marshaled upstream request body into a
// BodyStorage. When disk cache is enabled and the payload exceeds the configured
// threshold, the data is written to a temp file and the original []byte can be
// GC'd, significantly reducing the heap residency while waiting for the
// upstream provider to respond (the dominant cost for large base64 payloads).
//
// In memory mode the underlying memoryStorage reuses the same backing array,
// so this is equivalent to bytes.NewReader(data) in terms of memory usage.
//
// The caller MUST invoke closer.Close() once the upstream call has finished
// (typically via defer) to release the disk file / memory accounting.
//
// The returned body exposes its size and replay capability without exposing
// io.Closer. Request construction uses that metadata to populate ContentLength
// and GetBody, while the caller retains ownership of the underlying storage
// through the separately returned closer.
func NewOutboundJSONBody(data []byte) (body common.ReplayableBody, closer io.Closer, err error) {
	storage, err := common.CreateBodyStorage(data)
	if err != nil {
		return nil, nil, err
	}
	return common.NewReplayableBodyReader(storage), storage, nil
}

func RewriteOutboundJSONModel(raw []byte, upstream string) ([]byte, error) {
	upstream = strings.TrimSpace(upstream)
	if len(raw) == 0 || upstream == "" {
		return raw, nil
	}
	modelValue := gjson.GetBytes(raw, "model")
	if !modelValue.Exists() {
		return raw, nil
	}
	if modelValue.String() == upstream {
		return raw, nil
	}
	return sjson.SetBytes(raw, "model", upstream)
}
