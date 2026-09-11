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
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm, type SubmitErrorHandler } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Dialog } from '@/components/dialog'
import { MultiSelect } from '@/components/multi-select'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { getUserModels } from '@/lib/api'
import { getCurrencyDisplay, getCurrencyLabel } from '@/lib/currency'
import { useQuery } from '@/lib/query'
import { cn } from '@/lib/utils'

import { createApiKey, getApiKey, updateApiKey } from '../api'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants'
import {
  formatApiKey,
  getApiKeyFormDefaultValues,
  getApiKeyFormSchema,
  transformApiKeyToFormDefaults,
  transformFormDataToPayload,
  type ApiKeyFormValues,
} from '../lib'
import type { ApiKey, CreatedApiKey } from '../types'
import { useApiKeys } from './api-keys-provider'

type ApiKeysMutateDialogProps = {
  currentRow?: ApiKey
  onOpenChange: (open: boolean) => void
  open: boolean
}

type ExpiryPreset = 'never' | 'hour' | 'day' | 'month' | 'custom'

const EXPIRY_PRESETS: Array<{
  id: Exclude<ExpiryPreset, 'custom'>
  label: string
  months: number
  days: number
  hours: number
}> = [
  { id: 'never', label: 'Never', months: 0, days: 0, hours: 0 },
  { id: 'hour', label: '1 Hour', months: 0, days: 0, hours: 1 },
  { id: 'day', label: '1 Day', months: 0, days: 1, hours: 0 },
  { id: 'month', label: '1 Month', months: 1, days: 0, hours: 0 },
]

const fieldControlClass = 'rounded-[8px]'

export function ApiKeysMutateDialog(props: ApiKeysMutateDialogProps) {
  const { t } = useTranslation()
  const isUpdate = !!props.currentRow
  const currentRowId = props.currentRow?.id
  const { setCreatedKeys, setOpen, triggerRefresh } = useApiKeys()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [expiryPreset, setExpiryPreset] = useState<ExpiryPreset>('never')
  const [initializedTarget, setInitializedTarget] = useState<string | null>(
    null
  )

  const { data: modelsData } = useQuery({
    queryKey: ['user-models'],
    queryFn: getUserModels,
    enabled: props.open,
    staleTime: 0,
  })

  const {
    data: apiKeyData,
    isFetched: apiKeyFetched,
    isFetching: apiKeyFetching,
  } = useQuery({
    queryKey: ['api-key', currentRowId],
    queryFn: () => getApiKey(currentRowId ?? 0),
    enabled: props.open && isUpdate && currentRowId !== undefined,
    staleTime: 0,
  })

  const models = modelsData?.data || []
  const schema = useMemo(() => getApiKeyFormSchema(t), [t])
  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(schema),
    defaultValues: getApiKeyFormDefaultValues(),
  })

  useEffect(() => {
    if (!props.open) {
      setInitializedTarget(null)
      setAdvancedOpen(false)
      return
    }
    if (isUpdate && (!apiKeyFetched || apiKeyFetching)) return

    const target =
      isUpdate && props.currentRow ? `update:${props.currentRow.id}` : 'create'
    if (initializedTarget === target) return
    if (isUpdate && props.currentRow) {
      if (apiKeyData?.success && apiKeyData.data) {
        form.reset(transformApiKeyToFormDefaults(apiKeyData.data))
        setExpiryPreset(apiKeyData.data.expired_time > 0 ? 'custom' : 'never')
        setInitializedTarget(target)
      }
    } else {
      form.reset(getApiKeyFormDefaultValues())
      setExpiryPreset('never')
      setInitializedTarget(target)
    }
  }, [
    apiKeyData,
    apiKeyFetched,
    apiKeyFetching,
    form,
    initializedTarget,
    isUpdate,
    props.currentRow,
    props.open,
  ])

  const formTarget =
    isUpdate && props.currentRow ? `update:${props.currentRow.id}` : 'create'
  const isFormInitialized = initializedTarget === formTarget

  const onSubmit = async (data: ApiKeyFormValues) => {
    setIsSubmitting(true)
    try {
      const basePayload = transformFormDataToPayload(data)

      if (isUpdate && props.currentRow) {
        const result = await updateApiKey({
          ...basePayload,
          id: props.currentRow.id,
        })
        if (result.success) {
          toast.success(t(SUCCESS_MESSAGES.API_KEY_UPDATED))
          props.onOpenChange(false)
          triggerRefresh()
        } else {
          toast.error(result.message || t(ERROR_MESSAGES.UPDATE_FAILED))
        }
      } else {
        const count = data.tokenCount || 1
        const created: CreatedApiKey[] = []
        let createdWithoutKey = 0

        for (let i = 0; i < count; i++) {
          const result = await createApiKey({
            ...basePayload,
            name:
              i === 0 && data.name
                ? data.name
                : `${data.name || 'default'}-${Math.random().toString(36).slice(2, 8)}`,
          })
          if (!result.success) {
            toast.error(result.message || t(ERROR_MESSAGES.CREATE_FAILED))
            break
          }
          if (result.data?.key) {
            created.push({
              name: result.data.name || data.name,
              key: formatApiKey(result.data.key),
            })
          } else {
            createdWithoutKey += 1
          }
        }

        if (created.length > 0) {
          props.onOpenChange(false)
          triggerRefresh()
          setCreatedKeys(created)
          setOpen('created')
        } else if (createdWithoutKey > 0) {
          toast.success(
            t('Successfully created {{count}} API Key(s)', {
              count: createdWithoutKey,
            })
          )
          props.onOpenChange(false)
          triggerRefresh()
        }
      }
    } catch {
      toast.error(t(ERROR_MESSAGES.UNEXPECTED))
    } finally {
      setIsSubmitting(false)
    }
  }

  const onInvalid: SubmitErrorHandler<ApiKeyFormValues> = () => {
    toast.error(t('Please fix the highlighted fields before saving'))
  }

  const handleSetExpiry = (preset: Exclude<ExpiryPreset, 'custom'>) => {
    const option = EXPIRY_PRESETS.find((item) => item.id === preset)
    if (!option) return
    setExpiryPreset(preset)
    if (option.months === 0 && option.days === 0 && option.hours === 0) {
      form.setValue('expired_time', undefined)
      return
    }

    const now = new Date()
    now.setMonth(now.getMonth() + option.months)
    now.setDate(now.getDate() + option.days)
    now.setHours(now.getHours() + option.hours)
    form.setValue('expired_time', now)
  }

  const { meta: currencyMeta } = getCurrencyDisplay()
  const currencyLabel = getCurrencyLabel()
  const tokensOnly = currencyMeta.kind === 'tokens'
  const quotaLabel = t('Quota ({{currency}})', { currency: currencyLabel })
  const quotaPlaceholder = tokensOnly
    ? t('Enter quota in tokens')
    : t('Enter quota in {{currency}}', { currency: currencyLabel })
  const unlimitedQuota = form.watch('unlimited_quota')
  let submitLabel = t('Create API Key')
  if (isSubmitting) {
    submitLabel = t('Saving...')
  } else if (isUpdate) {
    submitLabel = t('Save changes')
  }

  return (
    <Dialog
      contentClassName='sm:max-w-[480px]'
      description={
        isUpdate
          ? t('Change the name, quota, or access limits.')
          : t('Give it a name. You can copy the key after creating it.')
      }
      showCloseButton={false}
      footer={
        <>
          <Button
            onClick={() => props.onOpenChange(false)}
            type='button'
            variant='outline'
          >
            {t('Cancel')}
          </Button>
          <Button
            className='bg-[#171717] text-white hover:bg-black dark:bg-primary dark:text-primary-foreground'
            disabled={!isFormInitialized || isSubmitting}
            onClick={form.handleSubmit(onSubmit, onInvalid)}
            type='button'
          >
            {submitLabel}
          </Button>
        </>
      }
      onOpenChange={(nextOpen) => {
        props.onOpenChange(nextOpen)
        if (!nextOpen) form.reset()
      }}
      open={props.open}
      title={isUpdate ? t('Update API Key') : t('Create API Key')}
    >
      <Form {...form}>
        <form
          aria-busy={!isFormInitialized}
          className='flex flex-col gap-4'
          id='api-key-form'
          inert={!isFormInitialized || isSubmitting ? true : undefined}
          onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        >
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Name')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className={fieldControlClass}
                    placeholder={t('Enter a name')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='expired_time'
            render={() => (
              <FormItem>
                <FormLabel>{t('Expiration Time')}</FormLabel>
                <div className='flex flex-wrap gap-1.5'>
                  {EXPIRY_PRESETS.map((option) => {
                    const active = expiryPreset === option.id
                    return (
                      <Button
                        className={cn(
                          'h-8 rounded-[8px] px-3 text-[13px]',
                          active
                            ? 'bg-[#171717] text-white hover:bg-black dark:bg-primary dark:text-primary-foreground'
                            : 'text-[#666666]'
                        )}
                        key={option.id}
                        onClick={() => handleSetExpiry(option.id)}
                        size='sm'
                        type='button'
                        variant={active ? 'default' : 'outline'}
                      >
                        {t(option.label)}
                      </Button>
                    )
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {!unlimitedQuota ? (
            <FormField
              control={form.control}
              name='remain_quota_dollars'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{quotaLabel}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className={fieldControlClass}
                      onChange={(event) =>
                        field.onChange(Number.parseFloat(event.target.value) || 0)
                      }
                      placeholder={quotaPlaceholder}
                      step={tokensOnly ? 1 : 0.01}
                      type='number'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

          <FormField
            control={form.control}
            name='unlimited_quota'
            render={({ field }) => (
              <FormItem className='flex items-center justify-between gap-3'>
                <FormLabel className='text-sm'>{t('Unlimited Quota')}</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <Collapsible onOpenChange={setAdvancedOpen} open={advancedOpen}>
            <CollapsibleTrigger
              render={
                <button
                  className='text-muted-foreground flex w-full items-center gap-2 py-1 text-left text-[13px]'
                  type='button'
                />
              }
            >
              <span className='flex-1'>{t('Advanced Settings')}</span>
              <ChevronDown
                className={cn(
                  'size-4 shrink-0 transition-transform',
                  advancedOpen && 'rotate-180'
                )}
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className='flex flex-col gap-4 pt-3'>
                {!isUpdate ? (
                  <FormField
                    control={form.control}
                    name='tokenCount'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Quantity')}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className={fieldControlClass}
                            min='1'
                            onChange={(event) =>
                              field.onChange(
                                Number.parseInt(event.target.value, 10) || 1
                              )
                            }
                            placeholder={t('Number of keys to create')}
                            type='number'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}
                <FormField
                  control={form.control}
                  name='model_limits'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Model Limits')}</FormLabel>
                      <FormControl>
                        <MultiSelect
                          onChange={field.onChange}
                          options={models.map((model) => ({
                            label: model,
                            value: model,
                          }))}
                          placeholder={t('Select models (empty for allow all)')}
                          selected={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='allow_ips'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('IP Whitelist (supports CIDR)')}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          className='min-h-20 resize-none'
                          placeholder={t(
                            'One IP per line (empty for no restriction)'
                          )}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </form>
      </Form>
    </Dialog>
  )
}
