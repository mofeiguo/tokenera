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
import { Loader2 } from 'lucide-react'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  SideDrawerSection,
  sideDrawerContentClassName,
  sideDrawerFooterClassName,
  sideDrawerFormClassName,
  sideDrawerHeaderClassName,
  sideDrawerSwitchItemClassName,
} from '@/components/drawer-layout'
import { JsonEditor } from '@/components/json-editor'
import { MultiSelect } from '@/components/multi-select'
import { TagInput } from '@/components/tag-input'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { getChannels } from '@/features/channels/api'
import { useQuery, useQueryClient } from '@/lib/query'

import {
  createModel,
  updateModel,
  getModel,
  getModelBindings,
  updateModelBindings,
  getVendors,
} from '../../api'
import { getNameRuleOptions, ENDPOINT_TEMPLATES } from '../../constants'
import { modelsQueryKeys, vendorsQueryKeys, parseModelTags } from '../../lib'
import {
  modelFormSchema,
  type Model,
  type ModelChannelBinding,
  type ModelFormValues,
} from '../../types'
import { ModelChannelBindingsEditor } from '../model-channel-bindings-editor'

const MODALITY_VALUES = ['text', 'image', 'audio', 'video', 'file'] as const
const CAPABILITY_VALUES = [
  'function_calling',
  'reasoning',
  'caching',
  'streaming',
  'json_mode',
  'structured_output',
  'tools',
  'system_prompt',
  'web_search',
  'code_interpreter',
  'embeddings',
] as const

type ModelMutateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Model | null
}

export function ModelMutateDrawer({
  open,
  onOpenChange,
  currentRow,
}: ModelMutateDrawerProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const currentModelId = currentRow?.id
  const isEditing = Boolean(currentModelId)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [channelBindings, setChannelBindings] = useState<ModelChannelBinding[]>(
    []
  )

  // Fetch vendors for dropdown
  const { data: vendorsData } = useQuery({
    queryKey: vendorsQueryKeys.list(),
    queryFn: () => getVendors({ page_size: 1000 }),
    enabled: open,
  })

  const vendors = vendorsData?.data?.items || []

  const { data: channelsData } = useQuery({
    queryKey: ['channels', 'model-binding-options'],
    queryFn: () => getChannels({ page_size: 1000 }),
    enabled: open,
  })
  const channels = channelsData?.data?.items || []

  // Fetch model detail if editing
  const { data: modelData } = useQuery({
    queryKey: modelsQueryKeys.detail(currentModelId || 0),
    queryFn: () => {
      if (!currentModelId) {
        throw new Error('Model ID is required')
      }
      return getModel(currentModelId)
    },
    enabled: open && isEditing,
  })

  const { data: bindingsData } = useQuery({
    queryKey: modelsQueryKeys.bindings(currentModelId || 0),
    queryFn: () => getModelBindings(currentModelId || 0),
    enabled: open && isEditing,
  })

  useEffect(() => {
    if (!open) return
    if (!isEditing) {
      setChannelBindings([])
      return
    }
    if (bindingsData?.data) {
      setChannelBindings(bindingsData.data)
    }
  }, [open, isEditing, bindingsData])

  const form = useForm<ModelFormValues>({
    resolver: zodResolver(modelFormSchema),
    defaultValues: {
      model_name: '',
      description: '',
      tags: [],
      input_modalities: [],
      output_modalities: [],
      capabilities: [],
      context_length: 0,
      max_output_tokens: 0,
      vendor_id: undefined,
      endpoints: '',
      name_rule: 0,
      status: true,
    },
  })

  const loadedFormKeyRef = useRef('')

  useEffect(() => {
    if (!open) {
      loadedFormKeyRef.current = ''
      return
    }

    if (open && isEditing && modelData?.data) {
      const loadKey = `edit-${currentModelId}`
      if (loadedFormKeyRef.current === loadKey) return
      loadedFormKeyRef.current = loadKey
      const model = modelData.data
      form.reset({
        id: model.id,
        model_name: model.model_name,
        description: model.description || '',
        tags: parseModelTags(model.tags),
        input_modalities: model.input_modalities || [],
        output_modalities: model.output_modalities || [],
        capabilities: model.capabilities || [],
        context_length: model.context_length || 0,
        max_output_tokens: model.max_output_tokens || 0,
        vendor_id: model.vendor_id,
        endpoints: model.endpoints || '',
        name_rule: model.name_rule || 0,
        status: model.status === 1,
      })
    } else if (open && !isEditing) {
      const loadKey = `create-${currentRow?.model_name ?? ''}`
      if (loadedFormKeyRef.current === loadKey) return
      loadedFormKeyRef.current = loadKey
      form.reset({
        model_name: currentRow?.model_name || '',
        description: '',
        tags: [],
        input_modalities: [],
        output_modalities: [],
        capabilities: [],
        context_length: 0,
        max_output_tokens: 0,
        vendor_id: undefined,
        endpoints: '',
        name_rule: 0,
        status: true,
      })
    }
  }, [open, isEditing, modelData, currentRow, form, currentModelId])

  const onSubmit = useCallback(
    async (values: ModelFormValues): Promise<void> => {
      if (values.name_rule !== 0 && channelBindings.length > 0) {
        toast.error(t('Only exact models can have channel bindings'))
        return
      }
      if (channelBindings.some((binding) => binding.channel_id <= 0)) {
        toast.error(t('Select a channel for every binding'))
        return
      }
      const bindingKeys = new Set<string>()
      for (const binding of channelBindings) {
        const upstreamModel = binding.upstream_model?.trim() ?? ''
        const bindingKey = `${binding.channel_id}::${upstreamModel}`
        if (bindingKeys.has(bindingKey)) {
          toast.error(
            t('Duplicate channel and upstream model bindings are not allowed')
          )
          return
        }
        bindingKeys.add(bindingKey)
        if (!binding.upstream_model?.trim()) {
          toast.error(t('Select a channel model for every binding'))
          return
        }
      }
      setIsSubmitting(true)
      try {
        const modelPayload = {
          ...values,
          id: isEditing ? currentModelId : undefined,
          tags: Array.isArray(values.tags) ? values.tags.join(',') : '',
          status: values.status ? 1 : 0,
        }

        const response =
          isEditing && currentModelId
            ? await updateModel({ ...modelPayload, id: currentModelId })
            : await createModel(modelPayload)

        if (response.success) {
          const savedModelId = currentModelId || response.data?.id
          if (savedModelId) {
            await updateModelBindings(savedModelId, channelBindings)
          }
          toast.success(
            isEditing
              ? 'Model updated successfully'
              : 'Model created successfully'
          )
          queryClient.invalidateQueries({ queryKey: modelsQueryKeys.lists() })
          if (savedModelId) {
            queryClient.invalidateQueries({
              queryKey: modelsQueryKeys.bindings(savedModelId),
            })
          }
          queryClient.invalidateQueries({ queryKey: ['channels'] })
          onOpenChange(false)
        } else {
          toast.error(response.message || 'Operation failed')
        }
      } catch (error: unknown) {
        toast.error((error as Error)?.message || 'Operation failed')
      } finally {
        setIsSubmitting(false)
      }
    },
    [isEditing, currentModelId, queryClient, onOpenChange, channelBindings, t]
  )

  const handleFillEndpointTemplate = (templateKey: string) => {
    const template = ENDPOINT_TEMPLATES[templateKey]
    if (template) {
      const templateJson = JSON.stringify({ [templateKey]: template }, null, 2)
      form.setValue('endpoints', templateJson)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={sideDrawerContentClassName('sm:max-w-2xl')}>
        <SheetHeader className={sideDrawerHeaderClassName()}>
          <SheetTitle>
            {isEditing ? t('Edit Model') : t('Create Model')}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? t("Update model configuration and click save when you're done.")
              : t(
                  'Add a new model to the system by providing the necessary information.'
                )}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            id='model-form'
            onSubmit={form.handleSubmit(
              onSubmit as Parameters<typeof form.handleSubmit>[0]
            )}
            className={sideDrawerFormClassName()}
          >
            {/* Basic Information */}
            <SideDrawerSection>
              <h3 className='text-sm font-semibold'>
                {t('Basic Information')}
              </h3>

              <FormField
                control={form.control}
                name='model_name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Model Name *')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('gpt-4, claude-3-opus, etc.')}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('The unique identifier for this model')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Description')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('Describe this model...')}
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='vendor_id'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Vendor')}</FormLabel>
                    <Select
                      items={vendors.map((vendor) => ({
                        value: String(vendor.id),
                        label: vendor.name,
                      }))}
                      onValueChange={(value) =>
                        field.onChange(
                          value ? Number.parseInt(value) : undefined
                        )
                      }
                      value={field.value ? String(field.value) : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('Select vendor')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent alignItemWithTrigger={false}>
                        <SelectGroup>
                          {vendors.map((vendor) => (
                            <SelectItem
                              key={vendor.id}
                              value={String(vendor.id)}
                            >
                              {vendor.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='tags'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Tags')}</FormLabel>
                    <FormControl>
                      <TagInput
                        value={field.value || []}
                        onChange={field.onChange}
                        placeholder={t('Add tags...')}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('Press Enter or comma to add tags')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid gap-4 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='input_modalities'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Input modalities')}</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={MODALITY_VALUES.map((value) => ({
                            value,
                            label: t(value),
                          }))}
                          selected={field.value}
                          onChange={field.onChange}
                          placeholder={t('Select input modalities')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='output_modalities'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Output modalities')}</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={MODALITY_VALUES.map((value) => ({
                            value,
                            label: t(value),
                          }))}
                          selected={field.value}
                          onChange={field.onChange}
                          placeholder={t('Select output modalities')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='capabilities'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Capabilities')}</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={CAPABILITY_VALUES.map((value) => ({
                          value,
                          label: t(value.replaceAll('_', ' ')),
                        }))}
                        selected={field.value}
                        onChange={field.onChange}
                        placeholder={t('Select model capabilities')}
                      />
                    </FormControl>
                    <FormDescription>
                      {t(
                        'These capabilities describe the public model catalog.'
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid gap-4 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='context_length'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Context length')}</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min={0}
                          placeholder='128000'
                          value={field.value ? String(field.value) : ''}
                          onChange={(event) => {
                            const next = Number.parseInt(event.target.value, 10)
                            field.onChange(
                              Number.isNaN(next) || next < 0 ? 0 : next
                            )
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        {t(
                          'Maximum input context window in tokens. Leave empty if unknown.'
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='max_output_tokens'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Max output tokens')}</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min={0}
                          placeholder='16384'
                          value={field.value ? String(field.value) : ''}
                          onChange={(event) => {
                            const next = Number.parseInt(event.target.value, 10)
                            field.onChange(
                              Number.isNaN(next) || next < 0 ? 0 : next
                            )
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        {t(
                          'Maximum tokens generated per response. Leave empty if unknown.'
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </SideDrawerSection>

            {/* Matching Configuration */}
            <SideDrawerSection>
              <h3 className='text-sm font-semibold'>{t('Matching Rules')}</h3>

              <FormField
                control={form.control}
                name='name_rule'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Name Rule')}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) =>
                          field.onChange(Number.parseInt(value))
                        }
                        value={String(field.value)}
                        className='grid grid-cols-2 gap-4'
                      >
                        {getNameRuleOptions(t).map((option) => (
                          <div
                            key={option.value}
                            className='flex items-center space-x-2'
                          >
                            <RadioGroupItem
                              value={String(option.value)}
                              id={`rule-${option.value}`}
                            />
                            <Label
                              htmlFor={`rule-${option.value}`}
                              className='cursor-pointer font-normal'
                            >
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormDescription>
                      {t('How this model name should match requests')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SideDrawerSection>

            <SideDrawerSection>
              <div className='space-y-1'>
                <h3 className='text-sm font-semibold'>
                  {t('Channel model bindings')}
                </h3>
                <p className='text-muted-foreground text-sm'>
                  {t(
                    'Priority is tried first (higher first). Weight splits traffic among bindings with the same priority.'
                  )}
                </p>
              </div>
              {form.watch('name_rule') === 0 ? (
                <ModelChannelBindingsEditor
                  bindings={channelBindings}
                  channels={channels}
                  catalogModelName={form.watch('model_name')}
                  disabled={isSubmitting}
                  onChange={setChannelBindings}
                />
              ) : (
                <p className='text-muted-foreground rounded-md border border-dashed p-3 text-sm'>
                  {t('Only exact models can have channel bindings')}
                </p>
              )}
            </SideDrawerSection>

            {/* Endpoints Configuration */}
            <SideDrawerSection>
              <div className='flex items-center justify-between'>
                <h3 className='text-sm font-semibold'>{t('Endpoints')}</h3>
                <Select<string>
                  items={Object.keys(ENDPOINT_TEMPLATES).map((key) => ({
                    value: key,
                    label: key,
                  }))}
                  onValueChange={(v) =>
                    v !== null && handleFillEndpointTemplate(v)
                  }
                >
                  <SelectTrigger size='sm' className='w-[200px]'>
                    <SelectValue placeholder={t('Load template...')} />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    <SelectGroup>
                      {Object.keys(ENDPOINT_TEMPLATES).map((key) => (
                        <SelectItem key={key} value={key}>
                          {key}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <FormField
                control={form.control}
                name='endpoints'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Endpoint Configuration')}</FormLabel>
                    <FormControl>
                      <JsonEditor
                        value={field.value || ''}
                        onChange={field.onChange}
                        keyPlaceholder='endpoint_type'
                        valuePlaceholder='{"path": "/v1/...", "method": "POST"}'
                        keyLabel='Endpoint Type'
                        valueLabel='Configuration'
                        valueType='any'
                        emptyMessage={t(
                          'No endpoints configured. Switch to JSON mode or add rows to define endpoints.'
                        )}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('Define API endpoints for this model (JSON format)')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SideDrawerSection>

            <SideDrawerSection>
              <h3 className='text-sm font-semibold'>{t('Status')}</h3>

              <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem className={sideDrawerSwitchItemClassName()}>
                    <div className='flex flex-col gap-0.5'>
                      <FormLabel className='text-base'>
                        {t('Enabled')}
                      </FormLabel>
                      <FormDescription>
                        {t('Enable or disable this model')}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </SideDrawerSection>
          </form>
        </Form>

        <SheetFooter className={sideDrawerFooterClassName()}>
          <SheetClose
            render={<Button variant='outline' disabled={isSubmitting} />}
          >
            {t('Cancel')}
          </SheetClose>
          <Button form='model-form' type='submit' disabled={isSubmitting}>
            {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {isEditing ? t('Update Model') : t('Save changes')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
