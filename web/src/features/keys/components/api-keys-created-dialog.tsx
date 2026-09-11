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
import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Dialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import { copyToClipboard } from '@/lib/copy-to-clipboard'

import { ApiBaseUrlHint } from './api-base-url-hint'
import { useApiKeys } from './api-keys-provider'

export function ApiKeysCreatedDialog() {
  const { t } = useTranslation()
  const { open, setOpen, createdKeys, setCreatedKeys } = useApiKeys()
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) return
    setOpen(null)
    setCreatedKeys([])
    setCopiedIndex(null)
  }

  return (
    <Dialog
      description={t('Copy this key to start calling the API.')}
      showCloseButton={false}
      footer={
        <Button onClick={() => handleOpenChange(false)} type='button'>
          {t('Done')}
        </Button>
      }
      onOpenChange={handleOpenChange}
      open={open === 'created'}
      title={t('API Key created')}
    >
      <div className='flex flex-col gap-3'>
        {createdKeys.map((item, index) => {
          const copied = copiedIndex === index
          return (
            <div className='min-w-0' key={item.key}>
              <p className='truncate text-[13px] font-medium text-[#333333] dark:text-foreground'>
                {item.name}
              </p>
              <div className='mt-1.5 flex items-center gap-2'>
                <input
                  className='h-9 min-w-0 flex-1 rounded-[8px] border-[0.5px] border-[#e6e6e6] bg-[#fafafa] px-3 font-mono text-[13px] text-[#333333] outline-none dark:border-border dark:bg-muted dark:text-foreground'
                  onFocus={(event) => event.target.select()}
                  readOnly
                  value={item.key}
                />
                <Button
                  aria-label={copied ? t('Copied!') : t('Copy API key')}
                  onClick={async () => {
                    const ok = await copyToClipboard(item.key)
                    if (!ok) return
                    setCopiedIndex(index)
                    toast.success(t('Copied'))
                  }}
                  size='icon'
                  type='button'
                  variant='outline'
                >
                  {copied ? (
                    <Check className='size-4' />
                  ) : (
                    <Copy className='size-4' />
                  )}
                </Button>
              </div>
            </div>
          )
        })}
        <ApiBaseUrlHint />
      </div>
    </Dialog>
  )
}
