/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
const EXTENSION_MIME_MAP: Record<string, string> = {
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.csv': 'text/csv',
  '.json': 'application/json',
  '.pdf': 'application/pdf',
  '.html': 'text/html',
  '.htm': 'text/html',
  '.xml': 'application/xml',
  '.yaml': 'text/yaml',
  '.yml': 'text/yaml',
  '.py': 'text/x-python',
  '.js': 'text/javascript',
  '.jsx': 'text/javascript',
  '.ts': 'text/typescript',
  '.tsx': 'text/typescript',
  '.java': 'text/x-java-source',
  '.go': 'text/x-go',
  '.rs': 'text/x-rust',
  '.c': 'text/x-c',
  '.cpp': 'text/x-c++',
  '.h': 'text/x-c',
  '.css': 'text/css',
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx':
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.zip': 'application/zip',
}

export function getFileExtension(filename: string): string {
  const index = filename.lastIndexOf('.')
  if (index <= 0) return ''
  return filename.slice(index).toLowerCase()
}

export function resolveFileMimeType(file: Pick<File, 'name' | 'type'>): string {
  if (file.type.trim()) {
    return file.type
  }
  return EXTENSION_MIME_MAP[getFileExtension(file.name)] ?? ''
}

export function fileMatchesAccept(
  file: Pick<File, 'name' | 'type'>,
  accept: string | undefined
): boolean {
  if (!accept || accept.trim() === '') {
    return true
  }

  const mimeType = resolveFileMimeType(file)
  const extension = getFileExtension(file.name)
  const tokens = accept
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)

  for (const token of tokens) {
    if (token === '*/*') {
      return true
    }
    if (token.startsWith('.')) {
      if (extension === token.toLowerCase()) {
        return true
      }
      continue
    }
    if (token.endsWith('/*')) {
      const prefix = token.slice(0, -1)
      if (mimeType.startsWith(prefix)) {
        return true
      }
      continue
    }
    if (mimeType === token) {
      return true
    }
  }

  return false
}
