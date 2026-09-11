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
import { GlobeIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  PromptInputButton,
  PromptInputTools,
  usePromptInputAttachments,
} from '@/components/ai-elements/prompt-input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import {
  getPlaygroundAttachmentAcceptForAction,
  getPlaygroundAttachmentActions,
  getSearchActionNotice,
  PLAYGROUND_INPUT_TOOL_BUTTON,
  type PlaygroundInputModality,
} from '../../lib'
import { PlaygroundAttachPlusIcon } from './playground-composer-actions'

type PlaygroundInputToolsProps = {
  disabled?: boolean
  inputModalities: PlaygroundInputModality[]
  webSearchSupported?: boolean
}

export function PlaygroundInputTools({
  disabled,
  inputModalities,
  webSearchSupported = false,
}: PlaygroundInputToolsProps) {
  const { t } = useTranslation()
  const attachments = usePromptInputAttachments()
  const attachmentActions = getPlaygroundAttachmentActions(inputModalities)

  const handleFileAction = (action: 'upload-photo' | 'upload-file') => {
    attachments.openFileDialog(
      getPlaygroundAttachmentAcceptForAction(inputModalities, action)
    )
  }

  const handleSearchAction = () => {
    const notice = getSearchActionNotice()
    toast.info(t(notice.title))
  }

  return (
    <PromptInputTools className='gap-0'>
      {attachmentActions.length > 0 ? (
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger
              render={
                <DropdownMenuTrigger
                  render={
                    <PromptInputButton
                      aria-label={t('Attach')}
                      className={PLAYGROUND_INPUT_TOOL_BUTTON}
                      disabled={disabled}
                      type='button'
                      variant='ghost'
                    >
                      <PlaygroundAttachPlusIcon />
                    </PromptInputButton>
                  }
                />
              }
            />
            <TooltipContent>
              <p>{t('Attach')}</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align='start'>
            {attachmentActions.map(({ action, icon: Icon, label }) => (
              <DropdownMenuItem
                key={action}
                onClick={() => handleFileAction(action)}
              >
                <Icon className='mr-2' size={16} />
                {t(label)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {webSearchSupported ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <PromptInputButton
                aria-label={t('Search')}
                className={PLAYGROUND_INPUT_TOOL_BUTTON}
                disabled={disabled}
                onClick={handleSearchAction}
                type='button'
                variant='ghost'
              >
                <GlobeIcon size={16} />
              </PromptInputButton>
            }
          />
          <TooltipContent>
            <p>{t('Search')}</p>
          </TooltipContent>
        </Tooltip>
      ) : null}
    </PromptInputTools>
  )
}
