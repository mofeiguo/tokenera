package hailuo

type VideoResponse struct {
	TaskID   string   `json:"task_id"`
	BaseResp BaseResp `json:"base_resp"`
}

type BaseResp struct {
	StatusCode int    `json:"status_code"`
	StatusMsg  string `json:"status_msg"`
}

type QueryTaskResponse struct {
	TaskID      string   `json:"task_id"`
	Status      string   `json:"status"`
	FileID      string   `json:"file_id,omitempty"`
	VideoWidth  int      `json:"video_width,omitempty"`
	VideoHeight int      `json:"video_height,omitempty"`
	BaseResp    BaseResp `json:"base_resp"`
}

type RetrieveFileResponse struct {
	File     FileObject `json:"file"`
	BaseResp BaseResp   `json:"base_resp"`
}

type FileObject struct {
	FileID      int64  `json:"file_id"`
	Bytes       int64  `json:"bytes"`
	CreatedAt   int64  `json:"created_at"`
	Filename    string `json:"filename"`
	Purpose     string `json:"purpose"`
	DownloadURL string `json:"download_url"`
}
