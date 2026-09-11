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
import { FileIcon, ImageIcon, type LucideIcon } from 'lucide-react'

type AttachmentAction = {
  action: 'upload-photo' | 'upload-file'
  icon: LucideIcon
  label: string
}

type InputToolNotice = {
  description?: string
  title: string
}

export const ATTACHMENT_ACTIONS = [
  { action: 'upload-photo', icon: ImageIcon, label: 'Image' },
  { action: 'upload-file', icon: FileIcon, label: 'File' },
] satisfies AttachmentAction[]

export function getSearchActionNotice(): InputToolNotice {
  return {
    title: 'Search feature in development',
  }
}
