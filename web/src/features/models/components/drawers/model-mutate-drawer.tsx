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
import { ChevronDown, Loader2 } from 'lucide-react'
import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import * as z from 'zod'

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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
import {
  useSystemOptions,
  getOptionValue,
} from '@/features/system-settings/hooks/use-system-options'
import type { ModelSettings } from '@/features/system-settings/types'
import { safeJsonParse } from '@/features/system-settings/utils/json-parser'
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
import type { Model, ModelChannelBinding } from '../../types'
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

// Extended schema for ratio configuration (internal form state only)
const extendedModelFormSchema = z.object({
  id: z.number().optional(),
  model_name: z.string().min(1, 'Model name is required'),
  description: z.string(),
  icon: z.string(),
  tags: z.array(z.string()),
  input_modalities: z.array(z.enum(MODALITY_VALUES)),
  output_modalities: z.array(z.enum(MODALITY_VALUES)),
  capabilities: z.array(z.enum(CAPABILITY_VALUES)),
  context_length: z.number().int().min(0),
  max_output_tokens: z.number().int().min(0),
  vendor_id: z.number().optional(),
  endpoints: z.string(),
  name_rule: z.number(),
  status: z.boolean(),
  sync_official: z.boolean(),
  price: z.string().optional(),
  ratio: z.string().optional(),
  cacheRatio: z.string().optional(),
  completionRatio: z.string().optional(),
  imageRatio: z.string().optional(),
  audioRatio: z.string().optional(),
  audioCompletionRatio: z.string().optional(),
})

type ExtendedModelFormValues = z.infer<typeof extendedModelFormSchema>

type PricingMode = 'per-token' | 'per-request'
type PricingSubMode = 'ratio' | 'price'

type PricingFields = Pick<
  ExtendedModelFormValues,
  | 'price'
  | 'ratio'
  | 'cacheRatio'
  | 'completionRatio'
  | 'imageRatio'
  | 'audioRatio'
  | 'audioCompletionRatio'
>

// Form state describing the pricing currently configured for one model name.
type PricingConfig = {
  mode: PricingMode
  fields: PricingFields
  promptPrice: string
  completionPrice: string
  advancedOpen: boolean
}

const EMPTY_PRICING_FIELDS: PricingFields = {
  price: '',
  ratio: '',
  cacheRatio: '',
  completionRatio: '',
  imageRatio: '',
  audioRatio: '',
  audioCompletionRatio: '',
}

const EMPTY_PRICING_CONFIG: PricingConfig = {
  mode: 'per-token',
  fields: EMPTY_PRICING_FIELDS,
  promptPrice: '',
  completionPrice: '',
  advancedOpen: false,
}

function lookupModelRatio(
  rawMap: string,
  modelName: string
): number | undefined {
  return safeJsonParse<Record<string, number>>(rawMap, {
    fallback: {},
    silent: true,
  })[modelName]
}

// Pricing is not stored on the model row: it lives in system options as
// model-name keyed JSON maps, so it has to be read back out of those maps to
// populate the form. Both create and edit rely on this, because submit rebuilds
// the maps from the form and would otherwise drop pricing it never loaded.
function readPricingConfig(
  settings: ModelSettings | null,
  modelName: string,
  catalogModel?: Model
): PricingConfig {
  if (!modelName) return EMPTY_PRICING_CONFIG

  if (
    catalogModel?.pricing_mode === 'per_request' &&
    catalogModel.model_price != null
  ) {
    return {
      ...EMPTY_PRICING_CONFIG,
      mode: 'per-request',
      fields: {
        ...EMPTY_PRICING_FIELDS,
        price: catalogModel.model_price.toString(),
      },
    }
  }
  if (
    catalogModel?.pricing_mode === 'per_token' &&
    catalogModel.model_ratio != null
  ) {
    const promptPrice = (catalogModel.model_ratio * 2).toString()
    return {
      mode: 'per-token',
      fields: {
        price: '',
        ratio: catalogModel.model_ratio.toString(),
        cacheRatio: catalogModel.cache_ratio?.toString() || '',
        completionRatio: catalogModel.completion_ratio?.toString() || '',
        imageRatio: catalogModel.image_ratio?.toString() || '',
        audioRatio: catalogModel.audio_ratio?.toString() || '',
        audioCompletionRatio:
          catalogModel.audio_completion_ratio?.toString() || '',
      },
      promptPrice,
      completionPrice:
        catalogModel.completion_ratio != null
          ? (
              catalogModel.model_ratio *
              2 *
              catalogModel.completion_ratio
            ).toString()
          : '',
      advancedOpen: [
        catalogModel.cache_ratio,
        catalogModel.image_ratio,
        catalogModel.audio_ratio,
        catalogModel.audio_completion_ratio,
      ].some((value) => value !== undefined && value !== null),
    }
  }

  if (!settings) return EMPTY_PRICING_CONFIG

  const price = lookupModelRatio(settings.ModelPrice, modelName)
  const ratio = lookupModelRatio(settings.ModelRatio, modelName)
  const cacheRatio = lookupModelRatio(settings.CacheRatio, modelName)
  const completionRatio = lookupModelRatio(settings.CompletionRatio, modelName)
  const imageRatio = lookupModelRatio(settings.ImageRatio, modelName)
  const audioRatio = lookupModelRatio(settings.AudioRatio, modelName)
  const audioCompletionRatio = lookupModelRatio(
    settings.AudioCompletionRatio,
    modelName
  )

  // A fixed per-request price wins outright at billing time (see
  // GetModelRatioOrPrice), so a name that has one is shown, and saved back, as
  // price-only: the ratios alongside it are dead weight.
  if (price !== undefined && price !== null) {
    return {
      ...EMPTY_PRICING_CONFIG,
      mode: 'per-request',
      fields: { ...EMPTY_PRICING_FIELDS, price: price.toString() },
    }
  }

  let promptPrice = ''
  let completionPrice = ''
  if (ratio !== undefined && ratio !== null) {
    const tokenPrice = ratio * 2
    promptPrice = tokenPrice.toString()
    if (completionRatio !== undefined && completionRatio !== null) {
      completionPrice = (tokenPrice * completionRatio).toString()
    }
  }

  return {
    mode: 'per-token',
    fields: {
      price: '',
      ratio: ratio?.toString() || '',
      cacheRatio: cacheRatio?.toString() || '',
      completionRatio: completionRatio?.toString() || '',
      imageRatio: imageRatio?.toString() || '',
      audioRatio: audioRatio?.toString() || '',
      audioCompletionRatio: audioCompletionRatio?.toString() || '',
    },
    promptPrice,
    completionPrice,
    // Configured is not the same as non-zero: a 0 ratio (free cache reads, for
    // instance) still has to be visible rather than hidden behind the collapse.
    advancedOpen: [
      cacheRatio,
      imageRatio,
      audioRatio,
      audioCompletionRatio,
    ].some((value) => value !== undefined && value !== null),
  }
}

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
  const [pricingMode, setPricingMode] = useState<PricingMode>('per-token')
  const [pricingSubMode, setPricingSubMode] = useState<PricingSubMode>('ratio')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [promptPrice, setPromptPrice] = useState('')
  const [completionPrice, setCompletionPrice] = useState('')
  const [channelBindings, setChannelBindings] = useState<ModelChannelBinding[]>(
    []
  )
  // Keep a ref so the load effect can read the latest modelSettings without
  // depending on it: modelSettings is a fresh object on every system-options
  // refetch, and including it in the deps would reset the form under the user.
  const modelSettingsRef = useRef<ModelSettings | null>(null)

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

  // Fetch system options for ratio configuration
  const { data: systemOptionsData } = useSystemOptions()

  // Get model settings from system options
  const modelSettings = useMemo(() => {
    if (!systemOptionsData?.data) return null
    const defaultModelSettings: ModelSettings = {
      'global.thinking_model_blacklist': '[]',
      'general_setting.ping_interval_enabled': false,
      'general_setting.ping_interval_seconds': 60,
      'gemini.safety_settings': '',
      'gemini.version_settings': '',
      'gemini.supported_imagine_models': '',
      'gemini.thinking_adapter_enabled': false,
      'gemini.thinking_adapter_budget_tokens_percentage': 0.6,
      'gemini.function_call_thought_signature_enabled': false,
      'gemini.remove_function_response_id_enabled': true,
      'claude.model_headers_settings': '',
      'claude.default_max_tokens': '',
      'claude.thinking_adapter_enabled': true,
      'claude.thinking_adapter_budget_tokens_percentage': 0.8,
      ModelPrice: '',
      ModelRatio: '',
      CacheRatio: '',
      CompletionRatio: '',
      ImageRatio: '',
      AudioRatio: '',
      AudioCompletionRatio: '',
      ExposeRatioEnabled: false,
      'billing_setting.billing_mode': '{}',
      'billing_setting.billing_expr': '{}',
      'tool_price_setting.prices': '{}',
      TopupGroupRatio: '',
      GroupRatio: '',
      UserUsableGroups: '',
      GroupInherit: '',
      GroupGroupRatio: '',
      AutoGroups: '',
      MaxTokenAutoGroups: 5,
      DefaultUseAutoGroup: false,
      CreateCacheRatio: '',
      'group_ratio_setting.group_special_usable_group': '{}',
      'grok.violation_deduction_enabled': false,
      'grok.violation_deduction_amount': 0,
      RetryTimes: 0,
      ChannelDisableThreshold: '',
      AutomaticDisableChannelEnabled: false,
      AutomaticEnableChannelEnabled: false,
      AutomaticDisableKeywords: '',
      AutomaticDisableStatusCodes: '401',
      AutomaticRetryStatusCodes:
        '100-199,300-399,401-407,409-499,500-503,505-523,525-599',
      'monitor_setting.auto_test_channel_enabled': false,
      'monitor_setting.auto_test_channel_minutes': 10,
      'monitor_setting.channel_test_concurrency': 1,
      'monitor_setting.channel_test_mode': 'scheduled_all',
      'channel_affinity_setting.enabled': false,
      'channel_affinity_setting.switch_on_success': true,
      'channel_affinity_setting.keep_on_channel_disabled': false,
      'channel_affinity_setting.max_entries': 100000,
      'channel_affinity_setting.default_ttl_seconds': 3600,
      'channel_affinity_setting.rules': '[]',
    }
    return getOptionValue(systemOptionsData.data, defaultModelSettings)
  }, [systemOptionsData])

  // The load effect keys off this boolean, not the object: it re-runs once
  // when the settings first arrive (so a drawer opened before that still gets
  // its pricing prefilled), while later refetches only produce a new object
  // reference and must not reset a form the user may be editing.
  const hasModelSettings = modelSettings !== null
  useEffect(() => {
    modelSettingsRef.current = modelSettings
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

  const form = useForm<ExtendedModelFormValues>({
    resolver: zodResolver(extendedModelFormSchema),
    defaultValues: {
      model_name: '',
      description: '',
      icon: '',
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
      sync_official: true,
      price: '',
      ratio: '',
      cacheRatio: '',
      completionRatio: '',
      imageRatio: '',
      audioRatio: '',
      audioCompletionRatio: '',
    },
  })

  const validateNumber = (value: string) => {
    if (value === '') return true
    return !Number.isNaN(Number.parseFloat(value))
  }

  const handlePromptPriceChange = (value: string) => {
    setPromptPrice(value)
    if (value && !Number.isNaN(Number.parseFloat(value))) {
      const ratio = Number.parseFloat(value) / 2
      form.setValue('ratio', ratio.toString())
    } else {
      form.setValue('ratio', '')
    }
  }

  const handleCompletionPriceChange = (value: string) => {
    setCompletionPrice(value)
    if (
      value &&
      !Number.isNaN(Number.parseFloat(value)) &&
      promptPrice &&
      !Number.isNaN(Number.parseFloat(promptPrice)) &&
      Number.parseFloat(promptPrice) > 0
    ) {
      const completionRatio =
        Number.parseFloat(value) / Number.parseFloat(promptPrice)
      form.setValue('completionRatio', completionRatio.toString())
    } else {
      form.setValue('completionRatio', '')
    }
  }

  // Load model data for editing and ratio configuration
  useEffect(() => {
    if (open && isEditing && modelData?.data) {
      const model = modelData.data
      const pricing = readPricingConfig(
        modelSettingsRef.current,
        model.model_name,
        model
      )
      setPricingMode(pricing.mode)
      setPromptPrice(pricing.promptPrice)
      setCompletionPrice(pricing.completionPrice)
      setAdvancedOpen(pricing.advancedOpen)
      form.reset({
        id: model.id,
        model_name: model.model_name,
        description: model.description || '',
        icon: model.icon || '',
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
        sync_official: model.sync_official === 1,
        ...pricing.fields,
      })
    } else if (open && !isEditing) {
      // Pre-fill model name when creating from an existing name, along with
      // any pricing that name already has.
      const modelName = currentRow?.model_name || ''
      const pricing = readPricingConfig(modelSettingsRef.current, modelName)
      setPricingSubMode('ratio')
      setPricingMode(pricing.mode)
      setPromptPrice(pricing.promptPrice)
      setCompletionPrice(pricing.completionPrice)
      setAdvancedOpen(pricing.advancedOpen)
      form.reset({
        model_name: modelName,
        description: '',
        icon: '',
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
        sync_official: true,
        ...pricing.fields,
      })
    }
  }, [open, isEditing, modelData, currentRow, form, hasModelSettings])

  const onSubmit = useCallback(
    async (values: ExtendedModelFormValues): Promise<void> => {
      if (values.name_rule !== 0 && channelBindings.length > 0) {
        toast.error(t('Only exact models can have channel bindings'))
        return
      }
      if (channelBindings.some((binding) => binding.channel_id <= 0)) {
        toast.error(t('Select a channel for every binding'))
        return
      }
      const bindingKeys = new Set<number>()
      for (const binding of channelBindings) {
        if (bindingKeys.has(binding.channel_id)) {
          toast.error(t('Duplicate channel bindings are not allowed'))
          return
        }
        bindingKeys.add(binding.channel_id)
        if (!binding.upstream_model?.trim()) {
          toast.error(t('Select a channel model for every binding'))
          return
        }
      }
      setIsSubmitting(true)
      try {
        const hasRatioConfig =
          (pricingMode === 'per-request' &&
            values.price &&
            values.price !== '') ||
          (pricingMode === 'per-token' &&
            (values.ratio ||
              values.cacheRatio ||
              values.completionRatio ||
              values.imageRatio ||
              values.audioRatio ||
              values.audioCompletionRatio))
        let pricingModeValue: Model['pricing_mode'] = ''
        if (hasRatioConfig) {
          pricingModeValue =
            pricingMode === 'per-request' ? 'per_request' : 'per_token'
        }
        const submitData = {
          ...values,
          id: isEditing ? currentModelId : undefined,
          tags: Array.isArray(values.tags) ? values.tags.join(',') : '',
          status: values.status ? 1 : 0,
          sync_official: values.sync_official ? 1 : 0,
          pricing_mode: pricingModeValue,
          model_price:
            pricingMode === 'per-request' && values.price
              ? Number.parseFloat(values.price)
              : null,
          model_ratio:
            pricingMode === 'per-token' && values.ratio
              ? Number.parseFloat(values.ratio)
              : null,
          completion_ratio:
            pricingMode === 'per-token' && values.completionRatio
              ? Number.parseFloat(values.completionRatio)
              : null,
          cache_ratio:
            pricingMode === 'per-token' && values.cacheRatio
              ? Number.parseFloat(values.cacheRatio)
              : null,
          create_cache_ratio:
            pricingMode === 'per-token'
              ? (modelData?.data?.create_cache_ratio ?? null)
              : null,
          image_ratio:
            pricingMode === 'per-token' && values.imageRatio
              ? Number.parseFloat(values.imageRatio)
              : null,
          audio_ratio:
            pricingMode === 'per-token' && values.audioRatio
              ? Number.parseFloat(values.audioRatio)
              : null,
          audio_completion_ratio:
            pricingMode === 'per-token' && values.audioCompletionRatio
              ? Number.parseFloat(values.audioCompletionRatio)
              : null,
        }

        // Remove ratio fields from model data (they're stored in system settings)
        const {
          price,
          ratio,
          cacheRatio,
          completionRatio,
          imageRatio,
          audioRatio,
          audioCompletionRatio,
          ...modelPayload
        } = submitData

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
          queryClient.invalidateQueries({ queryKey: ['system-options'] })
          queryClient.invalidateQueries({ queryKey: ['pricing'] })
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
    [
      isEditing,
      currentModelId,
      queryClient,
      onOpenChange,
      pricingMode,
      modelData?.data?.create_cache_ratio,
      channelBindings,
      t,
    ]
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
                name='icon'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Icon')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('OpenAI, Anthropic, etc.')}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className='text-xs'>
                      {t('@lobehub/icons key')}
                    </FormDescription>
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
                    'Bind this public model to one upstream model on each channel. Channel groups control who can call it. Priority is tried first; weight splits traffic among bindings with the same priority.'
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

            {/* Pricing Configuration */}
            <SideDrawerSection>
              <h3 className='text-sm font-semibold'>
                {t('Pricing Configuration')}
              </h3>

              <div className='space-y-4'>
                <Label>{t('Pricing mode')}</Label>
                <RadioGroup
                  value={pricingMode}
                  onValueChange={(value) =>
                    setPricingMode(value as PricingMode)
                  }
                >
                  <div className='flex items-center space-x-2'>
                    <RadioGroupItem value='per-token' id='per-token' />
                    <Label htmlFor='per-token' className='font-normal'>
                      {t('Per-token (ratio based)')}
                    </Label>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <RadioGroupItem value='per-request' id='per-request' />
                    <Label htmlFor='per-request' className='font-normal'>
                      {t('Per-request (fixed price)')}
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {pricingMode === 'per-request' ? (
                <FormField
                  control={form.control}
                  name='price'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Fixed price (USD)')}</FormLabel>
                      <FormControl>
                        <Input
                          type='text'
                          placeholder='0.01'
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value
                            if (validateNumber(value)) {
                              field.onChange(value)
                            }
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        {t(
                          'Cost in USD per request, regardless of tokens used.'
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <>
                  <div className='space-y-4'>
                    <Label>{t('Input mode')}</Label>
                    <RadioGroup
                      value={pricingSubMode}
                      onValueChange={(value) =>
                        setPricingSubMode(value as PricingSubMode)
                      }
                    >
                      <div className='flex items-center space-x-2'>
                        <RadioGroupItem value='ratio' id='ratio' />
                        <Label htmlFor='ratio' className='font-normal'>
                          {t('Ratio mode')}
                        </Label>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <RadioGroupItem value='price' id='price' />
                        <Label htmlFor='price' className='font-normal'>
                          {t('Price mode (USD per 1M tokens)')}
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {pricingSubMode === 'ratio' ? (
                    <>
                      <FormField
                        control={form.control}
                        name='ratio'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('Model ratio')}</FormLabel>
                            <FormControl>
                              <Input
                                type='text'
                                placeholder='1.0'
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value
                                  if (validateNumber(value)) {
                                    field.onChange(value)
                                    if (value) {
                                      setPromptPrice(
                                        (
                                          Number.parseFloat(value) * 2
                                        ).toString()
                                      )
                                    } else {
                                      setPromptPrice('')
                                    }
                                  }
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              {field.value &&
                              !Number.isNaN(Number.parseFloat(field.value))
                                ? `Calculated price: $${(Number.parseFloat(field.value) * 2).toFixed(4)} per 1M tokens`
                                : t('Multiplier for prompt tokens.')}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='completionRatio'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('Completion ratio')}</FormLabel>
                            <FormControl>
                              <Input
                                type='text'
                                placeholder='1.0'
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value
                                  if (validateNumber(value)) {
                                    field.onChange(value)
                                    const ratio = form.getValues('ratio')
                                    if (value && ratio) {
                                      const compPrice =
                                        Number.parseFloat(ratio) *
                                        2 *
                                        Number.parseFloat(value)
                                      setCompletionPrice(compPrice.toString())
                                    } else {
                                      setCompletionPrice('')
                                    }
                                  }
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              {field.value &&
                              !Number.isNaN(Number.parseFloat(field.value)) &&
                              promptPrice &&
                              !Number.isNaN(Number.parseFloat(promptPrice))
                                ? `Calculated price: $${(Number.parseFloat(promptPrice) * Number.parseFloat(field.value)).toFixed(4)} per 1M tokens`
                                : t('Multiplier for completion tokens.')}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  ) : (
                    <div className='space-y-4'>
                      <div className='space-y-2'>
                        <Label>{t('Prompt price ($/1M tokens)')}</Label>
                        <Input
                          type='text'
                          placeholder='2.0'
                          value={promptPrice}
                          onChange={(e) =>
                            handlePromptPriceChange(e.target.value)
                          }
                        />
                        <p className='text-muted-foreground text-sm'>
                          {promptPrice &&
                          !Number.isNaN(Number.parseFloat(promptPrice))
                            ? `Calculated ratio: ${(Number.parseFloat(promptPrice) / 2).toFixed(4)}`
                            : t('Enter Input price to calculate ratio')}
                        </p>
                      </div>

                      <div className='space-y-2'>
                        <Label>{t('Completion price ($/1M tokens)')}</Label>
                        <Input
                          type='text'
                          placeholder='4.0'
                          value={completionPrice}
                          onChange={(e) =>
                            handleCompletionPriceChange(e.target.value)
                          }
                        />
                        <p className='text-muted-foreground text-sm'>
                          {completionPrice &&
                          !Number.isNaN(Number.parseFloat(completionPrice)) &&
                          promptPrice &&
                          !Number.isNaN(Number.parseFloat(promptPrice)) &&
                          Number.parseFloat(promptPrice) > 0
                            ? `Calculated ratio: ${(Number.parseFloat(completionPrice) / Number.parseFloat(promptPrice)).toFixed(4)}`
                            : t('Enter Completion price to calculate ratio')}
                        </p>
                      </div>
                    </div>
                  )}

                  <Collapsible
                    open={advancedOpen}
                    onOpenChange={setAdvancedOpen}
                  >
                    <CollapsibleTrigger
                      render={
                        <Button
                          type='button'
                          variant='outline'
                          className='flex w-full items-center justify-between'
                        />
                      }
                    >
                      {t('Advanced options')}
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          advancedOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent className='flex flex-col gap-4 pt-4'>
                      <FormField
                        control={form.control}
                        name='cacheRatio'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('Cache ratio')}</FormLabel>
                            <FormControl>
                              <Input
                                type='text'
                                placeholder='0.1'
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value
                                  if (validateNumber(value)) {
                                    field.onChange(value)
                                  }
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              {t('Discount ratio for cache hits.')}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='imageRatio'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('Image ratio')}</FormLabel>
                            <FormControl>
                              <Input
                                type='text'
                                placeholder='1.0'
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value
                                  if (validateNumber(value)) {
                                    field.onChange(value)
                                  }
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              {t('Multiplier for image processing.')}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='audioRatio'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('Audio ratio')}</FormLabel>
                            <FormControl>
                              <Input
                                type='text'
                                placeholder='1.0'
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value
                                  if (validateNumber(value)) {
                                    field.onChange(value)
                                  }
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              {t('Multiplier for audio inputs.')}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='audioCompletionRatio'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('Audio completion ratio')}</FormLabel>
                            <FormControl>
                              <Input
                                type='text'
                                placeholder='1.0'
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value
                                  if (validateNumber(value)) {
                                    field.onChange(value)
                                  }
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              {t('Multiplier for audio outputs.')}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CollapsibleContent>
                  </Collapsible>
                </>
              )}
            </SideDrawerSection>

            {/* Status & Sync */}
            <SideDrawerSection>
              <h3 className='text-sm font-semibold'>{t('Status & Sync')}</h3>

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

              <FormField
                control={form.control}
                name='sync_official'
                render={({ field }) => (
                  <FormItem className={sideDrawerSwitchItemClassName()}>
                    <div className='flex flex-col gap-0.5'>
                      <FormLabel className='text-base'>
                        {t('Official Sync')}
                      </FormLabel>
                      <FormDescription>
                        {t('Sync this model with official upstream')}
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
