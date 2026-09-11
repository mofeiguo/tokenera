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
import {
  AlertCircle,
  Boxes,
  CheckCircle2,
  Circle,
  ClipboardPaste,
  KeyRound,
  Loader2,
  Server,
  Sparkles,
  Trash2,
  Copy,
  FileText,
  Eraser,
  Eye,
  RefreshCw,
  Code,
  Route,
  Settings,
} from 'lucide-react'
import {
  type ReactNode,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from 'react'
import { type SubmitErrorHandler, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  sideDrawerContentClassName,
  sideDrawerFooterClassName,
  sideDrawerFormClassName,
  sideDrawerHeaderClassName,
  sideDrawerSectionClassName,
  sideDrawerSwitchItemClassName,
} from '@/components/drawer-layout'
import { JsonCodeEditor } from '@/components/json-code-editor'
import { JsonEditor } from '@/components/json-editor'
import { MultiSelect } from '@/components/multi-select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { IconBadge, type IconBadgeTone } from '@/components/ui/icon-badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
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
import {
  SecureVerificationDialog,
  useSecureVerification,
} from '@/features/auth/secure-verification'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { useHiddenClickUnlock } from '@/hooks/use-hidden-click-unlock'
import {
  ADMIN_PERMISSION_ACTIONS,
  ADMIN_PERMISSION_RESOURCES,
  hasPermission,
} from '@/lib/admin-permissions'
import {
  parseChannelConnectionInfo,
  type ChannelConnectionInfo,
} from '@/lib/channel-connection-info'
import { getLobeIcon } from '@/lib/lobe-icon'
import { useQuery, useQueryClient } from '@/lib/query'
import { ROLE } from '@/lib/roles'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

import {
  fetchModels,
  getAllModels,
  getChannel,
  getChannelKey,
  refreshCodexCredential,
} from '../../api'
import {
  ADD_MODE_OPTIONS,
  CHANNEL_STATUS_LABELS,
  CHANNEL_TYPE_OPTIONS,
  CHANNEL_TYPE_WARNINGS,
  ERROR_MESSAGES,
  FIELD_DESCRIPTIONS,
  FIELD_PLACEHOLDERS,
  MODEL_FETCHABLE_TYPES,
} from '../../constants'
import { useChannelMutateForm } from '../../hooks/use-channel-mutate-form'
import {
  CHANNEL_FORM_DEFAULT_VALUES,
  CHANNEL_TYPE_ADVANCED_CUSTOM,
  channelFormSchema,
  channelsQueryKeys,
  getAdvancedCustomStats,
  transformChannelToFormDefaults,
  type ChannelFormValues,
  deduplicateKeys,
  getChannelTypeIcon,
  getKeyPromptForType,
  parseModelsString,
  formatModelsArray,
  hasAdvancedSettingsErrors,
} from '../../lib'
import {
  collectInvalidStatusCodeEntries,
  collectNewDisallowedStatusCodeRedirects,
} from '../../lib/status-code-risk-guard'
import type { Channel } from '../../types'
import { ChannelModelBindingsPanel } from '../channel-model-bindings-panel'
import { useChannels } from '../channels-provider'
import { AdvancedCustomEditorDialog } from '../dialogs/advanced-custom-editor-dialog'
import { FetchModelsDialog } from '../dialogs/fetch-models-dialog'
import { StatusCodeRiskDialog } from '../dialogs/status-code-risk-dialog'
import {
  ChannelAdvancedSection,
  ChannelApiAccessSection,
  ChannelAuthSection,
  ChannelBasicSection,
  ChannelEditorLoadingState,
  ChannelModelsSection,
} from './sections'

type ChannelMutateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Channel | null
}

type ChannelEditorSectionStatus = 'complete' | 'configured' | 'error' | 'idle'

type ChannelEditorNavChildItem = {
  id: string
  title: string
  configured?: boolean
}

type ChannelEditorNavItem = {
  id: string
  title: string
  description?: string
  statusLabel: string
  status: ChannelEditorSectionStatus
  icon: ReactNode
  configured?: boolean
  children?: ChannelEditorNavChildItem[]
}

const ADVANCED_SETTINGS_EXPANDED_KEY = 'channel-advanced-settings-expanded'
const CHANNEL_EDITOR_SECTION_IDS = {
  identity: 'channel-section-identity',
  credentials: 'channel-section-credentials',
  models: 'channel-section-models',
  advanced: 'channel-section-advanced',
} as const
const CHANNEL_EDITOR_MAIN_SECTION_IDS = [
  CHANNEL_EDITOR_SECTION_IDS.identity,
  CHANNEL_EDITOR_SECTION_IDS.credentials,
  CHANNEL_EDITOR_SECTION_IDS.models,
  CHANNEL_EDITOR_SECTION_IDS.advanced,
]
const ADVANCED_SETTINGS_SECTION_IDS = {
  internalNotes: 'channel-section-advanced-internal-notes',
  overrideRules: 'channel-section-advanced-override-rules',
  extraSettings: 'channel-section-advanced-extra-settings',
} as const
const ADVANCED_SETTINGS_CHILD_SECTION_IDS: string[] = Object.values(
  ADVANCED_SETTINGS_SECTION_IDS
)
const ADVANCED_CUSTOM_ROUTE_TYPE_PREVIEW_LIMIT = 3
const SENSITIVE_FORM_FIELDS = [
  'type',
  'base_url',
  'key',
  'openai_organization',
  'other',
  'key_mode',
  'header_override',
  'settings',
  'setting',
  'advanced_custom',
  'is_enterprise_account',
  'aws_key_type',
  'force_format',
  'thinking_to_content',
  'proxy',
  'http_protocol',
  'http2_connection_shards',
  'disable_task_polling_sleep',
] satisfies (keyof ChannelFormValues)[]

function readAdvancedSettingsPreference(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(ADVANCED_SETTINGS_EXPANDED_KEY) === 'true'
}

function hasConfiguredOverrideValue(value: unknown): boolean {
  if (typeof value !== 'string') return false

  const trimmed = value.trim()
  if (!trimmed || trimmed === 'null') return false

  try {
    const parsed = JSON.parse(trimmed)
    if (parsed === null) return false
    if (Array.isArray(parsed)) return parsed.length > 0
    if (typeof parsed === 'object') return Object.keys(parsed).length > 0
  } catch {
    return true
  }

  return true
}

function hasAdvancedSettingsValues(values: ChannelFormValues): boolean {
  return Boolean(
    hasConfiguredOverrideValue(values.header_override) ||
    values.advanced_custom?.trim() ||
    hasConfiguredOverrideValue(values.status_code_mapping) ||
    values.remark?.trim() ||
    values.proxy?.trim() ||
    values.force_format ||
    values.thinking_to_content ||
    (values.http_protocol && values.http_protocol !== 'auto') ||
    (values.http2_connection_shards != null &&
      values.http2_connection_shards > 1)
  )
}

function CardHeading(props: {
  title: string
  icon?: ReactNode
  iconTone?: IconBadgeTone
}) {
  return (
    <div className='flex items-center gap-3'>
      {props.icon && (
        <IconBadge tone={props.iconTone} size='md'>
          {props.icon}
        </IconBadge>
      )}
      <h3 className='text-sm font-semibold tracking-tight'>{props.title}</h3>
    </div>
  )
}

function SubHeading(props: {
  title: string
  icon?: ReactNode
  iconTone?: IconBadgeTone
}) {
  return (
    <div className='flex items-center gap-2'>
      {props.icon && (
        <IconBadge tone={props.iconTone} size='xs'>
          {props.icon}
        </IconBadge>
      )}
      <h4 className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
        {props.title}
      </h4>
    </div>
  )
}

function configuredAdvancedSectionClassName(
  className: string,
  configured: boolean
) {
  return cn(
    className,
    'border-border/60 rounded-lg border p-3 transition-colors',
    configured && 'border-primary/35 ring-primary/20 ring-1'
  )
}

function ChannelTypeLogo(props: {
  type: number
  size?: number
  className?: string
}) {
  const isKnownType = CHANNEL_TYPE_OPTIONS.some(
    (option) => option.value === props.type
  )

  if (!isKnownType) {
    return (
      <Server
        className={cn('text-muted-foreground shrink-0', props.className)}
        style={{
          width: props.size ?? 16,
          height: props.size ?? 16,
        }}
        aria-hidden='true'
      />
    )
  }

  return (
    <span className={cn('inline-flex shrink-0', props.className)}>
      {getLobeIcon(`${getChannelTypeIcon(props.type)}.Color`, props.size ?? 16)}
    </span>
  )
}

function getSectionStatusIcon(status: ChannelEditorSectionStatus): ReactNode {
  if (status === 'error') {
    return <AlertCircle className='h-3.5 w-3.5' aria-hidden='true' />
  }
  if (status === 'complete' || status === 'configured') {
    return <CheckCircle2 className='h-3.5 w-3.5' aria-hidden='true' />
  }
  return <Circle className='h-3.5 w-3.5' aria-hidden='true' />
}

function getCompletionStatus(
  hasErrors: boolean,
  isComplete: boolean
): ChannelEditorSectionStatus {
  if (hasErrors) return 'error'
  if (isComplete) return 'complete'
  return 'idle'
}

function getSectionStatusLabel(
  status: ChannelEditorSectionStatus,
  t: (key: string) => string
): string {
  if (status === 'error') return t('Error')
  if (status === 'complete' || status === 'configured') return t('Ready')
  return t('Incomplete')
}

function ChannelEditorNav(props: {
  providerLogo: ReactNode
  providerLabel: string
  statusLabel: string
  progressLabel: string
  navigationLabel: string
  items: ChannelEditorNavItem[]
  activeItemId?: string
  expandedItemId?: string
  onNavigate: (targetId: string) => void
}) {
  return (
    <aside className='hidden self-start lg:sticky lg:top-4 lg:z-20 lg:block'>
      <div className='flex max-h-[calc(100dvh-12rem)] flex-col gap-3 overflow-y-auto overscroll-contain pr-1'>
        <div className='border-border/60 bg-muted/20 rounded-lg border p-3'>
          <div className='flex min-w-0 items-center gap-2'>
            <span className='bg-background flex size-8 shrink-0 items-center justify-center rounded-md border'>
              {props.providerLogo}
            </span>
            <div className='min-w-0'>
              <p className='truncate text-sm font-medium'>
                {props.providerLabel}
              </p>
              <p className='text-muted-foreground truncate text-xs'>
                {props.statusLabel} · {props.progressLabel}
              </p>
            </div>
          </div>
        </div>

        <nav
          className='border-border/60 bg-background rounded-lg border p-1'
          aria-label={props.navigationLabel}
        >
          {props.items.map((item) => {
            const isError = item.status === 'error'
            const isDone =
              item.status === 'complete' || item.status === 'configured'
            const isConfigured = Boolean(item.configured)
            const isActive = props.activeItemId === item.id
            const isExpanded = props.expandedItemId === item.id
            return (
              <div key={item.id}>
                <button
                  type='button'
                  className={cn(
                    'hover:bg-muted/60 flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors',
                    isActive && 'bg-muted/70',
                    isConfigured && !isError && 'text-primary',
                    isError && 'text-destructive hover:bg-destructive/10'
                  )}
                  onClick={() => props.onNavigate(item.id)}
                  aria-current={isActive ? 'true' : undefined}
                >
                  <span
                    className={cn(
                      'bg-muted text-muted-foreground mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md',
                      isConfigured && !isError && 'bg-primary/10 text-primary',
                      isError && 'bg-destructive/10 text-destructive',
                      isDone && !isError && 'text-primary'
                    )}
                  >
                    {item.icon}
                  </span>
                  <span className='min-w-0 flex-1'>
                    <span className='block truncate text-sm font-medium'>
                      {item.title}
                    </span>
                    {item.description && (
                      <span className='text-muted-foreground block truncate text-xs'>
                        {item.description}
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      'text-muted-foreground mt-1 shrink-0',
                      isError && 'text-destructive',
                      isDone && !isError && 'text-primary',
                      isConfigured && !isError && 'pt-1.5'
                    )}
                    aria-label={item.statusLabel}
                  >
                    {isConfigured && !isError && !isDone ? (
                      <span
                        className='bg-success block size-2 rounded-full'
                        aria-hidden='true'
                      />
                    ) : (
                      getSectionStatusIcon(item.status)
                    )}
                  </span>
                </button>
                {item.children && isExpanded && (
                  <div className='border-border/60 ml-5 flex flex-col gap-0.5 border-l py-1 pl-3'>
                    {item.children.map((child) => (
                      <button
                        key={child.id}
                        type='button'
                        className={cn(
                          'text-muted-foreground hover:bg-muted/50 hover:text-foreground flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs transition-colors',
                          child.configured && 'text-primary'
                        )}
                        onClick={() => props.onNavigate(child.id)}
                      >
                        <span className='min-w-0 flex-1 truncate'>
                          {child.title}
                        </span>
                        {child.configured && (
                          <span
                            className='bg-success size-1.5 shrink-0 rounded-full'
                            aria-hidden='true'
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

export function ChannelMutateDrawer({
  open,
  onOpenChange,
  currentRow,
}: ChannelMutateDrawerProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { setOpen } = useChannels()
  const currentUser = useAuthStore((s) => s.auth.user)
  const canEditSensitive = hasPermission(
    currentUser,
    ADMIN_PERMISSION_RESOURCES.CHANNEL,
    ADMIN_PERMISSION_ACTIONS.SENSITIVE_WRITE
  )
  const canRevealChannelKey = currentUser?.role === ROLE.SUPER_ADMIN
  const [fetchModelsDialogOpen, setFetchModelsDialogOpen] = useState(false)
  const [channelKey, setChannelKey] = useState<string | null>(null)
  const [isChannelKeyLoading, setIsChannelKeyLoading] = useState(false)
  const [isCodexCredentialRefreshing, setIsCodexCredentialRefreshing] =
    useState(false)
  const initialModelsRef = useRef<string[]>([])
  const initialStatusCodeMappingRef = useRef<string>('')
  const [statusCodeRiskOpen, setStatusCodeRiskOpen] = useState(false)
  const [statusCodeRiskDetailItems, setStatusCodeRiskDetailItems] = useState<
    string[]
  >([])
  const statusCodeRiskResolveRef = useRef<
    ((confirmed: boolean) => void) | null
  >(null)
  const channelFormRef = useRef<HTMLFormElement>(null)
  const advancedNavScrollPendingRef = useRef(false)
  const [activeEditorSectionId, setActiveEditorSectionId] = useState<string>(
    CHANNEL_EDITOR_SECTION_IDS.identity
  )
  const [expandedEditorNavItemId, setExpandedEditorNavItemId] = useState<
    string | undefined
  >()
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false)
  const [advancedCustomEditorOpen, setAdvancedCustomEditorOpen] =
    useState(false)
  const [clipboardConnectionInfo, setClipboardConnectionInfo] =
    useState<ChannelConnectionInfo | null>(null)

  const isEditing = Boolean(currentRow)
  const channelId = currentRow?.id ?? null
  const sensitiveLocked = isEditing && !canEditSensitive

  // Fetch channel details if editing
  const { data: channelData, isLoading: isChannelLoading } = useQuery({
    queryKey: channelsQueryKeys.detail(channelId || 0),
    queryFn: () => getChannel(channelId || 0),
    enabled: isEditing && Boolean(channelId),
  })

  // Fetch all available models
  const { data: allModelsData } = useQuery({
    queryKey: ['channel_models'],
    queryFn: getAllModels,
  })

  const { copyToClipboard } = useCopyToClipboard()

  const {
    open: verificationOpen,
    methods: verificationMethods,
    state: verificationState,
    executeVerification,
    withVerification,
    cancel: cancelVerification,
    setCode: setVerificationCode,
    switchMethod: switchVerificationMethod,
  } = useSecureVerification()

  useEffect(() => {
    if (!open) {
      setChannelKey(null)
      setIsChannelKeyLoading(false)
    } else if (channelId) {
      setChannelKey(null)
    }
  }, [open, channelId])

  // Check if this is a multi-key channel
  const isMultiKeyChannel =
    isEditing && channelData?.data?.channel_info?.is_multi_key === true

  // Form setup
  const form = useForm<ChannelFormValues>({
    resolver: zodResolver(channelFormSchema),
    defaultValues: CHANNEL_FORM_DEFAULT_VALUES,
  })

  // Watch form values for conditional rendering
  const multiKeyMode = form.watch('multi_key_mode')
  const multiKeyType = form.watch('multi_key_type')
  const keyMode = form.watch('key_mode')
  const currentType = form.watch('type')
  const currentStatus = form.watch('status')
  const currentBaseUrl = form.watch('base_url')
  const currentKey = form.watch('key')
  const currentOther = form.watch('other')
  const currentModels = form.watch('models')
  const currentName = form.watch('name')
  const awsKeyType = form.watch('aws_key_type')
  const currentAdvancedCustom = form.watch('advanced_custom')
  const currentRemark = form.watch('remark')
  const currentStatusCodeMapping = form.watch('status_code_mapping')
  const currentHeaderOverride = form.watch('header_override')
  const currentForceFormat = form.watch('force_format')
  const currentThinkingToContent = form.watch('thinking_to_content')
  const currentDisableTaskPollingSleep = form.watch(
    'disable_task_polling_sleep'
  )
  const currentProxy = form.watch('proxy')
  const currentHttpProtocol = form.watch('http_protocol')
  const currentHttp2ConnectionShards = form.watch('http2_connection_shards')
  const shouldPreviewUnsavedModels =
    !isEditing ||
    (currentType === CHANNEL_TYPE_ADVANCED_CUSTOM && canEditSensitive)
  const {
    unlocked: doubaoApiEditUnlocked,
    handleClick: handleApiConfigSecretClick,
    reset: resetDoubaoApiUnlock,
  } = useHiddenClickUnlock({
    requiredClicks: 10,
    disabled: currentType !== 45 || sensitiveLocked,
    onUnlock: () => {
      toast.info(t('Doubao custom API address editing unlocked'))
    },
  })

  useEffect(() => {
    if (!open) {
      resetDoubaoApiUnlock()
    }
  }, [open, resetDoubaoApiUnlock])

  const applyConnectionInfo = useCallback(
    (connectionInfo: ChannelConnectionInfo) => {
      form.setValue('key', connectionInfo.key, {
        shouldDirty: true,
        shouldValidate: true,
      })
      form.setValue('base_url', connectionInfo.url, {
        shouldDirty: true,
        shouldValidate: true,
      })
      setClipboardConnectionInfo(null)
      toast.success(t('Connection info filled in'))
    },
    [form, t]
  )

  const pasteConnectionInfoFromClipboard = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.readText) {
      toast.error(t('Unable to read clipboard'))
      return
    }

    try {
      const text = await navigator.clipboard.readText()
      const parsed = parseChannelConnectionInfo(text)
      if (parsed) {
        applyConnectionInfo(parsed)
        return
      }
      toast.info(t('No connection info found in clipboard'))
    } catch {
      toast.error(t('Unable to read clipboard'))
    }
  }, [applyConnectionInfo, t])

  useEffect(() => {
    if (!open || isEditing) {
      setClipboardConnectionInfo(null)
      return
    }

    if (typeof navigator === 'undefined' || !navigator.clipboard?.readText) {
      return
    }

    let cancelled = false
    void navigator.clipboard
      .readText()
      .then((text) => {
        if (cancelled) return
        setClipboardConnectionInfo(parseChannelConnectionInfo(text))
      })
      .catch(() => {
        /* Clipboard detection is best-effort on drawer open. */
      })

    return () => {
      cancelled = true
    }
  }, [isEditing, open])

  // Helper computed values
  const isBatchMode =
    multiKeyMode === 'batch' || multiKeyMode === 'multi_to_single'
  const isChannelDetailLoading = isEditing && isChannelLoading
  const supportsMultiKeyAddMode =
    currentType !== 57
  const addModeOptions = useMemo(
    () =>
      supportsMultiKeyAddMode
        ? ADD_MODE_OPTIONS
        : ADD_MODE_OPTIONS.filter((option) => option.value === 'single'),
    [supportsMultiKeyAddMode]
  )

  const advancedCustomStats = useMemo(
    () => getAdvancedCustomStats(currentAdvancedCustom),
    [currentAdvancedCustom]
  )
  const advancedCustomRouteTypeLabels =
    advancedCustomStats.routeTypeLabels.slice(
      0,
      ADVANCED_CUSTOM_ROUTE_TYPE_PREVIEW_LIMIT
    )
  const hiddenAdvancedCustomRouteTypeCount =
    advancedCustomStats.routeTypeLabels.length -
    advancedCustomRouteTypeLabels.length
  const advancedCustomRouteTypeTitle =
    hiddenAdvancedCustomRouteTypeCount > 0
      ? advancedCustomStats.routeTypeLabels.join(', ')
      : undefined

  // Get all models list
  const allModelsList = useMemo(
    () => allModelsData?.data?.map((model) => model.id).filter(Boolean) || [],
    [allModelsData]
  )

  // Parse current models as array
  const currentModelsArray = useMemo(
    () => parseModelsString(currentModels),
    [currentModels]
  )

  const currentTypeLabel = useMemo(
    () =>
      CHANNEL_TYPE_OPTIONS.find((option) => option.value === currentType)
        ?.label || `#${currentType}`,
    [currentType]
  )

  const channelTypeOptions = useMemo(() => {
    const options = CHANNEL_TYPE_OPTIONS.map((option) => ({
      value: String(option.value),
      label: t(option.label),
      icon: <ChannelTypeLogo type={option.value} size={16} />,
    }))
    if (!options.some((option) => Number(option.value) === currentType)) {
      options.push({
        value: String(currentType),
        label: `#${currentType}`,
        icon: <ChannelTypeLogo type={currentType} size={16} />,
      })
    }
    return options
  }, [currentType, t])

  const formErrors = form.formState.errors
  const identityHasErrors = Boolean(
    formErrors.name ||
    formErrors.type ||
    formErrors.status ||
    formErrors.openai_organization
  )
  const credentialsHaveErrors = Boolean(
    formErrors.key ||
    formErrors.base_url ||
    formErrors.other ||
    formErrors.multi_key_mode ||
    formErrors.multi_key_type ||
    formErrors.key_mode ||
    formErrors.aws_key_type
  )
  const modelsHaveErrors = Boolean(formErrors.models)
  const advancedHaveErrors =
    hasAdvancedSettingsErrors(formErrors) || Boolean(formErrors.advanced_custom)
  const providerRequiresBaseUrl = [8, 45].includes(currentType)
  const providerRequiresOther = [18, 21, 39, 49].includes(currentType)
  const identityComplete = Boolean(currentName?.trim() && currentType > 0)
  const credentialsComplete = Boolean(
    (isEditing || currentKey?.trim()) &&
    (!providerRequiresBaseUrl || currentBaseUrl?.trim()) &&
    (!providerRequiresOther || currentOther?.trim())
  )
  const modelsComplete = currentModelsArray.length > 0
  const requiredCompletedCount = [
    identityComplete,
    credentialsComplete,
    modelsComplete,
  ].filter(Boolean).length
  const currentStatusLabel =
    CHANNEL_STATUS_LABELS[
      currentStatus as keyof typeof CHANNEL_STATUS_LABELS
    ] || 'Unknown'
  const progressLabel = `${requiredCompletedCount}/3`
  const identityStatus = getCompletionStatus(
    identityHasErrors,
    identityComplete
  )
  const credentialsStatus = getCompletionStatus(
    credentialsHaveErrors,
    credentialsComplete
  )
  const modelsStatus = getCompletionStatus(modelsHaveErrors, modelsComplete)
  const advancedStatus: ChannelEditorSectionStatus = advancedHaveErrors
    ? 'error'
    : 'idle'
  const advancedSummary = advancedHaveErrors ? t('Error') : undefined
  const internalNotesConfigured = Boolean(currentRemark?.trim())
  const overrideRulesConfigured = Boolean(
    hasConfiguredOverrideValue(currentStatusCodeMapping) ||
    hasConfiguredOverrideValue(currentHeaderOverride)
  )
  const extraSettingsConfigured = Boolean(
    currentForceFormat ||
    currentThinkingToContent ||
    currentDisableTaskPollingSleep ||
    currentProxy?.trim() ||
    (currentHttpProtocol && currentHttpProtocol !== 'auto') ||
    (currentHttp2ConnectionShards != null && currentHttp2ConnectionShards > 1)
  )
  const advancedConfigured = Boolean(
    internalNotesConfigured ||
    overrideRulesConfigured ||
    extraSettingsConfigured
  )
  const advancedNavChildren: ChannelEditorNavChildItem[] = [
    {
      id: ADVANCED_SETTINGS_SECTION_IDS.internalNotes,
      title: t('Internal Notes'),
      configured: internalNotesConfigured,
    },
    {
      id: ADVANCED_SETTINGS_SECTION_IDS.overrideRules,
      title: t('Override Rules'),
      configured: overrideRulesConfigured,
    },
    {
      id: ADVANCED_SETTINGS_SECTION_IDS.extraSettings,
      title: t('Channel Extra Settings'),
      configured: extraSettingsConfigured,
    },
  ]
  const editorNavItems: ChannelEditorNavItem[] = [
    {
      id: CHANNEL_EDITOR_SECTION_IDS.identity,
      title: t('Basic Information'),
      description: getSectionStatusLabel(identityStatus, t),
      statusLabel: getSectionStatusLabel(identityStatus, t),
      status: identityStatus,
      icon: <Server className='h-4 w-4' aria-hidden='true' />,
    },
    {
      id: CHANNEL_EDITOR_SECTION_IDS.credentials,
      title: t('Credentials'),
      description: getSectionStatusLabel(credentialsStatus, t),
      statusLabel: getSectionStatusLabel(credentialsStatus, t),
      status: credentialsStatus,
      icon: <KeyRound className='h-4 w-4' aria-hidden='true' />,
    },
    {
      id: CHANNEL_EDITOR_SECTION_IDS.models,
      title: t('Models'),
      description: getSectionStatusLabel(modelsStatus, t),
      statusLabel: getSectionStatusLabel(modelsStatus, t),
      status: modelsStatus,
      icon: <Boxes className='h-4 w-4' aria-hidden='true' />,
    },
    {
      id: CHANNEL_EDITOR_SECTION_IDS.advanced,
      title: t('Advanced Settings'),
      description: advancedSummary,
      statusLabel: advancedSummary ?? t('Advanced Settings'),
      status: advancedStatus,
      icon: <Settings className='h-4 w-4' aria-hidden='true' />,
      configured: advancedConfigured,
      children: advancedNavChildren,
    },
  ]

  // Transform models to multi-select options
  const modelOptions = useMemo(() => {
    const allModels = new Set([...allModelsList, ...currentModelsArray])
    return [...allModels].map((model) => ({
      value: model,
      label: model,
    }))
  }, [allModelsList, currentModelsArray])

  // Load channel data into form when editing
  useEffect(() => {
    if (isEditing && channelData?.data) {
      const defaults = transformChannelToFormDefaults(channelData.data)
      form.reset(defaults)
      setAdvancedSettingsOpen(
        readAdvancedSettingsPreference() || hasAdvancedSettingsValues(defaults)
      )
      // Store initial values for comparison
      initialModelsRef.current = parseModelsString(
        channelData.data.models || ''
      )
      initialStatusCodeMappingRef.current =
        channelData.data.status_code_mapping || ''
    } else if (!isEditing) {
      form.reset(CHANNEL_FORM_DEFAULT_VALUES)
      setAdvancedSettingsOpen(false)
      initialModelsRef.current = []
      initialStatusCodeMappingRef.current = ''
    }
  }, [isEditing, channelData, form])

  // Handle type change - set default values for specific types
  useEffect(() => {
    if (isEditing) return // Don't auto-set defaults when editing

    // Type 45 (VolcEngine) - set default base_url
    if (currentType === 45) {
      const currentBaseUrlValue = form.getValues('base_url')
      if (!currentBaseUrlValue || currentBaseUrlValue === '') {
        form.setValue('base_url', 'https://ark.cn-beijing.volces.com')
      }
    }

    // Type 18 (Xunfei) - set default other (version)
    if (currentType === 18) {
      const currentOther = form.getValues('other')
      if (!currentOther || currentOther === '') {
        form.setValue('other', 'v2.1')
      }
    }
  }, [currentType, isEditing, form])

  useEffect(() => {
    if (currentType !== 45 || currentBaseUrl !== 'doubao-coding-plan') return

    form.setValue('base_url', 'https://ark.cn-beijing.volces.com', {
      shouldDirty: false,
      shouldValidate: true,
    })
  }, [currentBaseUrl, currentType, form])

  useEffect(() => {
    if (isEditing || supportsMultiKeyAddMode) return
    if (multiKeyMode && multiKeyMode !== 'single') {
      form.setValue('multi_key_mode', 'single', {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }, [form, isEditing, multiKeyMode, supportsMultiKeyAddMode])

  // Validate base_url - warn if it ends with /v1
  useEffect(() => {
    if (!currentBaseUrl || !currentBaseUrl.endsWith('/v1')) return

    // Show warning toast
    const timer = setTimeout(() => {
      toast.warning(
        t(
          'Warning: Base URL should not end with /v1. New API will handle it automatically. This may cause request failures.'
        ),
        { duration: 5000 }
      )
    }, 500)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBaseUrl])

  // Handle key deduplication
  const handleDeduplicateKeys = () => {
    const currentKey = form.getValues('key')
    if (!currentKey || currentKey.trim() === '') {
      toast.info(t('Please enter keys first'))
      return
    }

    const result = deduplicateKeys(currentKey)

    if (result.removedCount === 0) {
      toast.info(t('No duplicate keys found'))
    } else {
      form.setValue('key', result.deduplicatedText)
      toast.success(
        t(
          'Removed {{removed}} duplicate key(s). Before: {{before}}, After: {{after}}',
          {
            removed: result.removedCount,
            before: result.beforeCount,
            after: result.afterCount,
          }
        )
      )
    }
  }

  const fetchChannelKey = useCallback(
    async (proofToken?: string) => {
      if (!channelId) {
        throw new Error('Channel is not selected')
      }

      setIsChannelKeyLoading(true)
      try {
        const res = await getChannelKey(channelId, proofToken)
        if (!res.success) {
          throw new Error(res.message || t('Failed to fetch channel key'))
        }

        const keyValue = res.data?.key ?? ''
        setChannelKey(keyValue)
        toast.success(t('Channel key unlocked'))
        return res
      } finally {
        setIsChannelKeyLoading(false)
      }
    },
    [channelId, t]
  )

  const handleRevealKey = useCallback(async () => {
    if (!channelId) return

    try {
      await withVerification(fetchChannelKey, {
        scope: 'channel.key.read',
        preferredMethod: 'passkey',
        title: t('Verify to view channel key'),
        description: t(
          'Use Passkey or 2FA to confirm your identity before revealing this channel key.'
        ),
      })
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      }
    }
  }, [channelId, withVerification, fetchChannelKey, t])

  const handleRefreshCodexCredential = useCallback(async () => {
    if (!channelId) return
    setIsCodexCredentialRefreshing(true)
    try {
      const res = await refreshCodexCredential(channelId)
      if (!res.success) {
        throw new Error(res.message || t('Failed to refresh credential'))
      }
      toast.success(t('Credential refreshed'))
      queryClient.invalidateQueries({
        queryKey: channelsQueryKeys.detail(channelId),
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Refresh failed'))
    } finally {
      setIsCodexCredentialRefreshing(false)
    }
  }, [channelId, queryClient, t])

  // Unified function to update models
  const updateModels = useCallback(
    (newModels: string[], merge: boolean = false) => {
      const finalModels = merge
        ? formatModelsArray([...currentModelsArray, ...newModels])
        : formatModelsArray(newModels)
      form.setValue('models', finalModels)
      return newModels.length
    },
    [currentModelsArray, form]
  )

  // Handle fetching models from upstream
  const handleFetchModels = useCallback(async () => {
    const type = form.getValues('type')

    if (!MODEL_FETCHABLE_TYPES.has(type)) {
      toast.error(t('This channel type does not support fetching models'))
      return
    }

    if (!isEditing && !canEditSensitive) {
      toast.error(t("You don't have necessary permission"))
      return
    }

    // Advanced Custom may use a model discovery route with no authentication.
    if (!isEditing && type !== CHANNEL_TYPE_ADVANCED_CUSTOM) {
      const key = form.getValues('key')
      if (!key?.trim()) {
        toast.error(t('Please enter API key first'))
        return
      }
    }

    setFetchModelsDialogOpen(true)
  }, [isEditing, canEditSensitive, form, t])

  const formPreviewFetcher = useCallback(async (): Promise<string[]> => {
    if (!canEditSensitive) {
      throw new Error(t("You don't have necessary permission"))
    }
    const type = form.getValues('type')
    const editingAdvancedCustom =
      isEditing && type === CHANNEL_TYPE_ADVANCED_CUSTOM
    if (editingAdvancedCustom && channelId === null) {
      throw new Error(t('No channel selected'))
    }
    const response = await fetchModels({
      type,
      key: isEditing ? undefined : form.getValues('key'),
      channel_id: editingAdvancedCustom ? channelId || undefined : undefined,
      base_url: form.getValues('base_url') || '',
      advanced_custom: form.getValues('advanced_custom'),
      header_override: form.getValues('header_override'),
      proxy: form.getValues('proxy'),
    })
    if (response.success && response.data) {
      return response.data
    }
    throw new Error(response.message || t('No models fetched from upstream'))
  }, [canEditSensitive, channelId, form, isEditing, t])

  // Handle model operations
  const handleClearModels = useCallback(() => {
    form.setValue('models', '')
    toast.success(t('Cleared all models'))
  }, [form, t])

  const handleCopyModels = useCallback(async () => {
    const models = form.getValues('models')
    if (!models?.trim()) {
      toast.info(t('No models to copy'))
      return
    }
    await copyToClipboard(models)
  }, [form, copyToClipboard, t])

  // Handle model selection change from MultiSelect
  const handleModelsChange = useCallback(
    (selected: string[]) => {
      form.setValue('models', selected.join(','))
    },
    [form]
  )

  // Handle successful submission
  const handleSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: channelsQueryKeys.lists() })
    if (channelId) {
      queryClient.invalidateQueries({
        queryKey: channelsQueryKeys.detail(channelId),
      })
    }
    onOpenChange(false)
    setOpen(null)
  }, [channelId, queryClient, onOpenChange, setOpen])

  const confirmStatusCodeRisk = useCallback(
    (detailItems: string[]): Promise<boolean> =>
      new Promise((resolve) => {
        statusCodeRiskResolveRef.current = resolve
        setStatusCodeRiskDetailItems(detailItems)
        setStatusCodeRiskOpen(true)
      }),
    []
  )

  const handleStatusCodeRiskAction = useCallback((confirmed: boolean) => {
    setStatusCodeRiskOpen(false)
    setStatusCodeRiskDetailItems([])
    if (statusCodeRiskResolveRef.current) {
      statusCodeRiskResolveRef.current(confirmed)
      statusCodeRiskResolveRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      if (statusCodeRiskResolveRef.current) {
        statusCodeRiskResolveRef.current(false)
        statusCodeRiskResolveRef.current = null
      }
    }
  }, [])

  const channelMutation = useChannelMutateForm({
    currentRow,
    isEditing,
    isMultiKeyChannel,
    onSuccess: handleSuccess,
  })

  const isSubmitting = channelMutation.isPending

  // Submit handler
  const onSubmit = useCallback(
    async (data: ChannelFormValues) => {
      // Validate key is required when creating
      if (!isEditing && !data.key?.trim()) {
        form.setError('key', {
          type: 'manual',
          message: ERROR_MESSAGES.REQUIRED_KEY,
        })
        return
      }

      if (sensitiveLocked) {
        const dirtyFields = form.formState.dirtyFields as Partial<
          Record<keyof ChannelFormValues, unknown>
        >
        const hasSensitiveChanges = SENSITIVE_FORM_FIELDS.some((field) =>
          Boolean(dirtyFields[field])
        )
        if (hasSensitiveChanges) {
          toast.error(
            t('You do not have permission to edit sensitive channel settings.')
          )
          return
        }
      }

      // Validate status_code_mapping entries
      if (data.status_code_mapping?.trim()) {
        const invalidEntries = collectInvalidStatusCodeEntries(
          data.status_code_mapping
        )
        if (invalidEntries.length > 0) {
          toast.error(
            t('Invalid status code mapping entries: {{entries}}', {
              entries: invalidEntries.join(', '),
            })
          )
          return
        }

        const riskyRedirects = collectNewDisallowedStatusCodeRedirects(
          initialStatusCodeMappingRef.current,
          data.status_code_mapping
        )
        if (riskyRedirects.length > 0) {
          const confirmed = await confirmStatusCodeRisk(riskyRedirects)
          if (!confirmed) return
        }
      }

      await channelMutation.mutateAsync(data)
    },
    [
      isEditing,
      sensitiveLocked,
      form,
      confirmStatusCodeRisk,
      channelMutation,
      t,
    ]
  )

  const handleAdvancedSettingsOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      advancedNavScrollPendingRef.current = false
      setExpandedEditorNavItemId(undefined)
    }
    setAdvancedSettingsOpen(nextOpen)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        ADVANCED_SETTINGS_EXPANDED_KEY,
        String(nextOpen)
      )
    }
  }, [])

  const handleEditorNavNavigate = useCallback(
    (targetId: string) => {
      const isAdvancedTarget =
        targetId === CHANNEL_EDITOR_SECTION_IDS.advanced ||
        ADVANCED_SETTINGS_CHILD_SECTION_IDS.includes(targetId)

      if (isAdvancedTarget) {
        advancedNavScrollPendingRef.current = true
        handleAdvancedSettingsOpenChange(true)
        setActiveEditorSectionId(CHANNEL_EDITOR_SECTION_IDS.advanced)
        setExpandedEditorNavItemId(CHANNEL_EDITOR_SECTION_IDS.advanced)
      } else {
        advancedNavScrollPendingRef.current = false
        setActiveEditorSectionId(targetId)
        setExpandedEditorNavItemId(undefined)
      }

      const scrollTargetIntoView = () => {
        document
          .querySelector<HTMLElement>(`#${targetId}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }

      if (isAdvancedTarget && !advancedSettingsOpen) {
        window.requestAnimationFrame(scrollTargetIntoView)
        return
      }

      scrollTargetIntoView()
    },
    [advancedSettingsOpen, handleAdvancedSettingsOpenChange]
  )

  const updateActiveEditorSection = useCallback(() => {
    const formElement = channelFormRef.current
    if (!formElement) return

    const activationY = formElement.getBoundingClientRect().top + 80
    let nextActiveSectionId: string = CHANNEL_EDITOR_SECTION_IDS.identity

    for (const sectionId of CHANNEL_EDITOR_MAIN_SECTION_IDS) {
      const sectionElement = document.querySelector<HTMLElement>(
        `#${sectionId}`
      )
      if (!sectionElement) continue
      if (sectionElement.getBoundingClientRect().top <= activationY) {
        nextActiveSectionId = sectionId
      } else {
        break
      }
    }

    setActiveEditorSectionId((current) =>
      current === nextActiveSectionId ? current : nextActiveSectionId
    )

    if (nextActiveSectionId === CHANNEL_EDITOR_SECTION_IDS.advanced) {
      advancedNavScrollPendingRef.current = false
      setExpandedEditorNavItemId(CHANNEL_EDITOR_SECTION_IDS.advanced)
      if (!advancedSettingsOpen) {
        handleAdvancedSettingsOpenChange(true)
      }
    } else if (!advancedNavScrollPendingRef.current) {
      setExpandedEditorNavItemId(undefined)
    }
  }, [advancedSettingsOpen, handleAdvancedSettingsOpenChange])

  useEffect(() => {
    if (!open || isChannelDetailLoading) return
    const formElement = channelFormRef.current
    if (!formElement) return

    updateActiveEditorSection()
    formElement.addEventListener('scroll', updateActiveEditorSection, {
      passive: true,
    })
    window.addEventListener('resize', updateActiveEditorSection)

    return () => {
      formElement.removeEventListener('scroll', updateActiveEditorSection)
      window.removeEventListener('resize', updateActiveEditorSection)
    }
  }, [isChannelDetailLoading, open, updateActiveEditorSection])

  const onInvalid: SubmitErrorHandler<ChannelFormValues> = useCallback(
    (errors) => {
      if (hasAdvancedSettingsErrors(errors)) {
        handleAdvancedSettingsOpenChange(true)
      }
      toast.error(t('Please fix the highlighted fields before saving'))
    },
    [handleAdvancedSettingsOpenChange, t]
  )

  // Handle drawer close
  const handleOpenChange = useCallback(
    (v: boolean) => {
      onOpenChange(v)
      if (!v) {
        form.reset(CHANNEL_FORM_DEFAULT_VALUES)
        advancedNavScrollPendingRef.current = false
        setActiveEditorSectionId(CHANNEL_EDITOR_SECTION_IDS.identity)
        setExpandedEditorNavItemId(undefined)
        setAdvancedSettingsOpen(false)
        setClipboardConnectionInfo(null)
      }
    },
    [onOpenChange, form]
  )

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent className={sideDrawerContentClassName('sm:max-w-5xl')}>
          <SheetHeader className={sideDrawerHeaderClassName()}>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
              <div className='min-w-0'>
                <SheetTitle className='flex items-center gap-3'>
                  <IconBadge tone='info' size='title'>
                    <ChannelTypeLogo type={currentType} size={22} />
                  </IconBadge>
                  <span>
                    {isEditing ? t('Edit Channel') : t('Create Channel')}
                    <span className='text-muted-foreground ml-2 text-sm font-normal'>
                      {t(currentTypeLabel)}
                    </span>
                  </span>
                </SheetTitle>
                <SheetDescription className='mt-1'>
                  {isEditing
                    ? t(
                        "Update channel configuration and click save when you're done."
                      )
                    : t(
                        'Add a new channel by providing the necessary information.'
                      )}
                </SheetDescription>
              </div>
              {!isEditing && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='shrink-0'
                  onClick={pasteConnectionInfoFromClipboard}
                >
                  <ClipboardPaste className='size-4' />
                  <span>{t('Paste Connection Info')}</span>
                </Button>
              )}
            </div>
          </SheetHeader>

          {sensitiveLocked && (
            <Alert className='border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-50'>
              <AlertDescription>
                {t(
                  'Sensitive channel settings are read-only for your account.'
                )}{' '}
                {t(
                  'You can still edit non-sensitive operations fields such as models.'
                )}
              </AlertDescription>
            </Alert>
          )}

          {!isEditing && clipboardConnectionInfo && (
            <Alert>
              <AlertDescription className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <span>{t('Connection info detected in clipboard')}</span>
                <span className='flex shrink-0 gap-2'>
                  <Button
                    type='button'
                    size='sm'
                    onClick={() => applyConnectionInfo(clipboardConnectionInfo)}
                  >
                    {t('Fill in')}
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => setClipboardConnectionInfo(null)}
                  >
                    {t('Ignore')}
                  </Button>
                </span>
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form
              id='channel-form'
              ref={channelFormRef}
              onSubmit={form.handleSubmit(onSubmit, onInvalid)}
              className={sideDrawerFormClassName('gap-5')}
            >
              {isChannelDetailLoading ? (
                <ChannelEditorLoadingState />
              ) : (
                <div className='grid gap-5 lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-start'>
                  <ChannelEditorNav
                    providerLogo={
                      <ChannelTypeLogo type={currentType} size={18} />
                    }
                    providerLabel={t(currentTypeLabel)}
                    statusLabel={t(currentStatusLabel)}
                    progressLabel={progressLabel}
                    navigationLabel={t('Channels')}
                    items={editorNavItems}
                    activeItemId={activeEditorSectionId}
                    expandedItemId={expandedEditorNavItemId}
                    onNavigate={handleEditorNavNavigate}
                  />
                  <div className='flex min-w-0 flex-col gap-5'>
                    {/* ── Basic Information ── */}
                    <div
                      id={CHANNEL_EDITOR_SECTION_IDS.identity}
                      className='scroll-mt-4'
                    >
                      <ChannelBasicSection>
                        <div className='grid gap-4 sm:grid-cols-2'>
                          <fieldset
                            disabled={sensitiveLocked}
                            className='min-w-0 disabled:opacity-60'
                          >
                            <FormField
                              control={form.control}
                              name='type'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('Type *')}</FormLabel>
                                  <FormControl>
                                    <div className='relative'>
                                      <span className='pointer-events-none absolute top-1/2 left-3 z-10 flex -translate-y-1/2'>
                                        <ChannelTypeLogo
                                          type={Number(field.value)}
                                          size={18}
                                        />
                                      </span>
                                      <Combobox
                                        options={channelTypeOptions}
                                        value={String(field.value)}
                                        onValueChange={(value) => {
                                          const nextType = Number(value)
                                          if (
                                            Number.isInteger(nextType) &&
                                            nextType > 0
                                          ) {
                                            field.onChange(nextType)
                                          }
                                        }}
                                        placeholder={t('Select channel type')}
                                        searchPlaceholder={t(
                                          'Search channel type...'
                                        )}
                                        emptyText={t('No channel type found.')}
                                        className='pl-10'
                                        allowCustomValue
                                        openOnFocus={false}
                                      />
                                    </div>
                                  </FormControl>
                                  {sensitiveLocked && (
                                    <FormDescription>
                                      {t(
                                        'No permission to perform this action'
                                      )}
                                    </FormDescription>
                                  )}
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </fieldset>

                          <FormField
                            control={form.control}
                            name='name'
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('Name *')}</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={t(FIELD_PLACEHOLDERS.NAME)}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {!isEditing && (
                          <FormField
                            control={form.control}
                            name='status'
                            render={({ field }) => (
                              <FormItem
                                className={sideDrawerSwitchItemClassName()}
                              >
                                <div className='flex flex-col gap-0.5'>
                                  <FormLabel>{t('Enabled')}</FormLabel>
                                  <FormDescription className='text-xs'>
                                    {t('Enable or disable this channel')}
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value === 1}
                                    onCheckedChange={(checked) =>
                                      field.onChange(checked ? 1 : 2)
                                    }
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        )}

                        {currentType === 1 && (
                          <fieldset
                            disabled={sensitiveLocked}
                            className='disabled:opacity-60'
                          >
                            <FormField
                              control={form.control}
                              name='openai_organization'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    {t('OpenAI Organization')}
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder={t('org-...')}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    {sensitiveLocked
                                      ? t(
                                          'No permission to perform this action'
                                        )
                                      : t(FIELD_DESCRIPTIONS.OPENAI_ORG)}
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </fieldset>
                        )}
                      </ChannelBasicSection>
                    </div>

                    {/* ── API Access ── */}
                    <div
                      id={CHANNEL_EDITOR_SECTION_IDS.credentials}
                      className='scroll-mt-4'
                    >
                      <ChannelApiAccessSection>
                        {CHANNEL_TYPE_WARNINGS[currentType] && (
                          <Alert>
                            <AlertDescription>
                              {t(CHANNEL_TYPE_WARNINGS[currentType])}
                            </AlertDescription>
                          </Alert>
                        )}

                        {sensitiveLocked && (
                          <Alert className='border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-50'>
                            <AlertDescription>
                              {t('No permission to perform this action')}
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className='border-border/60 bg-muted/10 rounded-lg border p-4'>
                          <fieldset
                            disabled={sensitiveLocked}
                            className='space-y-4 disabled:opacity-60'
                          >
                            {/* Custom (type 8) */}
                            {currentType === 8 && (
                              <FormField
                                control={form.control}
                                name='base_url'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>
                                      {t('Full Base URL (supports')} {'{'}
                                      {t('model')}
                                      {'}'} {t('variable) *')}
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder={t(
                                          'e.g., https://api.openai.com/v1/chat/completions'
                                        )}
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      {t('Enter the complete URL, supports')}{' '}
                                      {'{'}
                                      {t('model')}
                                      {'}'} {t('variable')}
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}

                            {/* Xunfei/Spark (type 18) */}
                            {currentType === 18 && (
                              <FormField
                                control={form.control}
                                name='other'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>
                                      {t('Model Version *')}
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder={t('e.g., v2.1')}
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      {t(
                                        'Spark model version, e.g., v2.1 (version number in API URL)'
                                      )}
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}

                            {/* OpenRouter (type 20) */}
                            {currentType === 20 && (
                              <FormField
                                control={form.control}
                                name='is_enterprise_account'
                                render={({ field }) => (
                                  <FormItem className='flex items-center justify-between'>
                                    <div className='space-y-0.5'>
                                      <FormLabel>
                                        {t('Enterprise Account')}
                                      </FormLabel>
                                      <FormDescription>
                                        {t(
                                          'Enable if this is an OpenRouter enterprise account with special response format'
                                        )}
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
                            )}

                            {/* AWS (type 33) */}
                            {currentType === 33 && (
                              <FormField
                                control={form.control}
                                name='aws_key_type'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>{t('AWS Key Format')}</FormLabel>
                                    <Select
                                      items={[
                                        {
                                          value: 'ak_sk',
                                          label: t(
                                            'AccessKey / SecretAccessKey'
                                          ),
                                        },
                                        {
                                          value: 'api_key',
                                          label: t('API Key'),
                                        },
                                      ]}
                                      onValueChange={field.onChange}
                                      value={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue
                                            placeholder={t('Select key format')}
                                          />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent
                                        alignItemWithTrigger={false}
                                      >
                                        <SelectGroup>
                                          <SelectItem value='ak_sk'>
                                            {t('AccessKey / SecretAccessKey')}
                                          </SelectItem>
                                          <SelectItem value='api_key'>
                                            {t('API Key')}
                                          </SelectItem>
                                        </SelectGroup>
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>
                                      {field.value === 'api_key'
                                        ? t('API Key mode: use APIKey|Region')
                                        : t(
                                            'AK/SK mode: use AccessKey|SecretAccessKey|Region'
                                          )}
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}

                            {/* AI Proxy Library (type 21) */}
                            {currentType === 21 && (
                              <FormField
                                control={form.control}
                                name='other'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>
                                      {t('Knowledge Base ID *')}
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder={t('e.g., 123456')}
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      {t('Enter the knowledge base ID')}
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}

                            {/* FastGPT (type 22) */}
                            {currentType === 22 && (
                              <FormField
                                control={form.control}
                                name='base_url'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>
                                      {t('Private Deployment URL')}
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder={t(
                                          'e.g., https://fastgpt.run/api/openapi'
                                        )}
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      {t(
                                        'For private deployments, format: https://fastgpt.run/api/openapi'
                                      )}
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}

                            {/* Cloudflare Workers AI (type 39) */}
                            {currentType === 39 && (
                              <FormField
                                control={form.control}
                                name='other'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>{t('Account ID *')}</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder={t(
                                          'e.g., d6b5da8hk1awo8nap34ube6gh'
                                        )}
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      {t('Your Cloudflare Account ID')}
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}

                            {/* SiliconFlow (type 40) */}
                            {currentType === 40 && (
                              <Alert>
                                <AlertDescription>
                                  {t('Referral link:')}{' '}
                                  <a
                                    href='https://cloud.siliconflow.cn/i/hij0YNTZ'
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='text-primary underline'
                                  >
                                    {t(
                                      'https://cloud.siliconflow.cn/i/hij0YNTZ'
                                    )}
                                  </a>
                                </AlertDescription>
                              </Alert>
                            )}

                            {/* VolcEngine (type 45) */}
                            {currentType === 45 && !doubaoApiEditUnlocked && (
                              <FormField
                                control={form.control}
                                name='base_url'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel
                                      className='cursor-pointer select-none'
                                      onClick={handleApiConfigSecretClick}
                                    >
                                      {t('API Base URL *')}
                                    </FormLabel>
                                    <Select
                                      items={[
                                        {
                                          value:
                                            'https://ark.cn-beijing.volces.com',
                                          label: t(
                                            'https://ark.cn-beijing.volces.com'
                                          ),
                                        },
                                        {
                                          value:
                                            'https://ark.ap-southeast.bytepluses.com',
                                          label: t(
                                            'https://ark.ap-southeast.bytepluses.com'
                                          ),
                                        },
                                      ]}
                                      onValueChange={field.onChange}
                                      value={
                                        field.value === 'doubao-coding-plan'
                                          ? 'https://ark.cn-beijing.volces.com'
                                          : field.value ||
                                            'https://ark.cn-beijing.volces.com'
                                      }
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent
                                        alignItemWithTrigger={false}
                                      >
                                        <SelectGroup>
                                          <SelectItem value='https://ark.cn-beijing.volces.com'>
                                            {t(
                                              'https://ark.cn-beijing.volces.com'
                                            )}
                                          </SelectItem>
                                          <SelectItem value='https://ark.ap-southeast.bytepluses.com'>
                                            {t(
                                              'https://ark.ap-southeast.bytepluses.com'
                                            )}
                                          </SelectItem>
                                        </SelectGroup>
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>
                                      {t('Select the API endpoint region')}
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}

                            {/* VolcEngine (type 45) - Custom API URL (unlocked) */}
                            {currentType === 45 && doubaoApiEditUnlocked && (
                              <FormField
                                control={form.control}
                                name='base_url'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>{t('API Base URL *')}</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder={t(
                                          'e.g., https://ark.cn-beijing.volces.com'
                                        )}
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      {t('Enter custom API endpoint URL')}
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}

                            {/* Coze (type 49) */}
                            {currentType === 49 && (
                              <FormField
                                control={form.control}
                                name='other'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>{t('Agent ID *')}</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder={t('e.g., 7342866812345')}
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      {t('Enter the Coze agent ID')}
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}

                            {/* General base_url for other types */}
                            {![8, 22, 45].includes(currentType) && (
                              <FormField
                                control={form.control}
                                name='base_url'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>{t('Base URL')}</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder={t(
                                          FIELD_PLACEHOLDERS.BASE_URL
                                        )}
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      {t(
                                        'Custom API base URL. For official channels, New API has built-in addresses. Only fill this for third-party proxy sites or special endpoints. Do not add /v1 or trailing slash.'
                                      )}
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}

                            {currentType === CHANNEL_TYPE_ADVANCED_CUSTOM && (
                              <FormField
                                control={form.control}
                                name='advanced_custom'
                                render={({ field }) => (
                                  <FormItem className='space-y-3 border-y py-4'>
                                    <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                                      <div className='space-y-2'>
                                        <FormLabel>
                                          {t('Advanced Custom Routes')}
                                        </FormLabel>
                                        <div className='flex flex-wrap gap-2'>
                                          <Badge variant='secondary'>
                                            {t('Routes')}:{' '}
                                            {advancedCustomStats.routeCount}
                                          </Badge>
                                          {advancedCustomRouteTypeLabels.map(
                                            (label) => (
                                              <Badge
                                                key={label}
                                                variant='outline'
                                                className='max-w-[12rem]'
                                                title={label}
                                              >
                                                <span className='truncate'>
                                                  {label}
                                                </span>
                                              </Badge>
                                            )
                                          )}
                                          {hiddenAdvancedCustomRouteTypeCount >
                                            0 && (
                                            <Badge
                                              variant='outline'
                                              title={
                                                advancedCustomRouteTypeTitle
                                              }
                                            >
                                              +
                                              {
                                                hiddenAdvancedCustomRouteTypeCount
                                              }
                                            </Badge>
                                          )}
                                          {!advancedCustomStats.valid && (
                                            <Badge variant='destructive'>
                                              {t('Incomplete')}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      <Button
                                        type='button'
                                        variant='outline'
                                        size='sm'
                                        onClick={() =>
                                          setAdvancedCustomEditorOpen(true)
                                        }
                                      >
                                        <Route className='mr-2 h-4 w-4' />
                                        {t('Configure routes')}
                                      </Button>
                                    </div>
                                    <FormControl>
                                      <input type='hidden' {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}

                            <ChannelAuthSection>
                              {!isEditing && (
                                <FormField
                                  control={form.control}
                                  name='multi_key_mode'
                                  render={({ field }) => (
                                    <FormItem className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                                      <FormLabel className='text-muted-foreground text-xs font-medium'>
                                        {t('Add Mode')}
                                      </FormLabel>
                                      <Select
                                        items={addModeOptions.map((option) => ({
                                          value: option.value,
                                          label: t(option.label),
                                        }))}
                                        onValueChange={field.onChange}
                                        value={field.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger
                                            size='sm'
                                            className='w-full sm:w-56'
                                          >
                                            <SelectValue />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent
                                          alignItemWithTrigger={false}
                                        >
                                          <SelectGroup>
                                            {addModeOptions.map((option) => (
                                              <SelectItem
                                                key={option.value}
                                                value={option.value}
                                              >
                                                {t(option.label)}
                                              </SelectItem>
                                            ))}
                                          </SelectGroup>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              )}

                              <FormField
                                control={form.control}
                                name='key'
                                render={({ field }) => {
                                  let keyPlaceholder = t(
                                    getKeyPromptForType(currentType)
                                  )
                                  if (isEditing) {
                                    keyPlaceholder = t(
                                      'Leave empty to keep existing key'
                                    )
                                  } else if (
                                    currentType === 33 &&
                                    awsKeyType === 'api_key' &&
                                    isBatchMode
                                  ) {
                                    keyPlaceholder = t(
                                      'Enter API Key, one per line, format: APIKey|Region'
                                    )
                                  } else if (
                                    currentType === 33 &&
                                    awsKeyType === 'api_key'
                                  ) {
                                    keyPlaceholder = t(
                                      'Enter API Key, format: APIKey|Region'
                                    )
                                  } else if (
                                    currentType === 33 &&
                                    isBatchMode
                                  ) {
                                    keyPlaceholder = t(
                                      'Enter key, one per line, format: AccessKey|SecretAccessKey|Region'
                                    )
                                  } else if (currentType === 33) {
                                    keyPlaceholder = t(
                                      'Enter key, format: AccessKey|SecretAccessKey|Region'
                                    )
                                  } else if (isBatchMode) {
                                    keyPlaceholder = t(
                                      'Enter one key per line for batch creation'
                                    )
                                  }

                                  let keyDescription: ReactNode = t(
                                    FIELD_DESCRIPTIONS.KEY
                                  )
                                  if (isEditing) {
                                    let keyModeDescription = t(
                                      'Append mode: New keys will be added to the end of the existing key list'
                                    )
                                    if (keyMode === 'replace') {
                                      keyModeDescription = t(
                                        'Replace mode: Will completely replace all existing keys'
                                      )
                                    }
                                    keyDescription = (
                                      <>
                                        {t(
                                          'Enter new key to update, or leave empty to keep current key'
                                        )}
                                        {isMultiKeyChannel && (
                                          <span className='text-warning mt-1 block'>
                                            {keyModeDescription}
                                          </span>
                                        )}
                                      </>
                                    )
                                  } else if (isBatchMode) {
                                    keyDescription = t(
                                      'Enter one API key per line for batch creation'
                                    )
                                  }
                                  return (
                                    <FormItem>
                                      <FormLabel>{t('API Key *')}</FormLabel>
                                      <FormControl>
                                        <Textarea
                                          placeholder={keyPlaceholder}
                                          rows={isBatchMode ? 8 : 4}
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormDescription>
                                        <div className='flex flex-col gap-2'>
                                          <span>{keyDescription}</span>
                                          {isBatchMode && (
                                            <Button
                                              type='button'
                                              variant='outline'
                                              size='sm'
                                              onClick={handleDeduplicateKeys}
                                              className='w-fit'
                                            >
                                              <Trash2 className='mr-2 h-4 w-4' />
                                              {t('Remove Duplicates')}
                                            </Button>
                                          )}
                                        </div>
                                      </FormDescription>
                                      {isEditing && canRevealChannelKey && (
                                        <div className='border-border/60 mt-4 flex flex-col gap-3 border-y border-dashed py-4'>
                                          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                                            <div>
                                              <p className='text-sm font-medium'>
                                                {t('Current key')}
                                              </p>
                                              <p className='text-muted-foreground text-xs'>
                                                {t(
                                                  'Verification required to reveal the saved key.'
                                                )}
                                              </p>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                              <Button
                                                type='button'
                                                variant='outline'
                                                size='sm'
                                                onClick={handleRevealKey}
                                                disabled={
                                                  isChannelKeyLoading ||
                                                  verificationState.loading
                                                }
                                              >
                                                {isChannelKeyLoading ||
                                                verificationState.loading ? (
                                                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                                ) : (
                                                  <Eye className='mr-2 h-4 w-4' />
                                                )}
                                                {t('Reveal key')}
                                              </Button>
                                              <Button
                                                type='button'
                                                variant='ghost'
                                                size='sm'
                                                onClick={async () => {
                                                  if (channelKey) {
                                                    await copyToClipboard(
                                                      channelKey
                                                    )
                                                  }
                                                }}
                                                disabled={!channelKey}
                                              >
                                                <Copy className='mr-2 h-4 w-4' />
                                                {t('Copy')}
                                              </Button>
                                            </div>
                                          </div>
                                          <Input
                                            readOnly
                                            value={channelKey ?? ''}
                                            placeholder={t(
                                              'Hidden — verify to reveal'
                                            )}
                                            className='font-mono'
                                          />
                                        </div>
                                      )}
                                      <FormMessage />
                                    </FormItem>
                                  )
                                }}
                              />

                              {currentType === 57 && (
                                <div className='border-border/60 flex flex-col gap-3 border-y py-4'>
                                  <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                                    <div className='text-muted-foreground text-xs'>
                                      {t(
                                        'Codex channels use an OAuth JSON credential as the key.'
                                      )}
                                    </div>
                                    <div className='flex flex-wrap items-center gap-2'>
                                      {isEditing && channelId && (
                                        <Button
                                          type='button'
                                          variant='outline'
                                          size='sm'
                                          onClick={handleRefreshCodexCredential}
                                          disabled={
                                            sensitiveLocked ||
                                            isCodexCredentialRefreshing
                                          }
                                        >
                                          {isCodexCredentialRefreshing ? (
                                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                          ) : (
                                            <RefreshCw className='mr-2 h-4 w-4' />
                                          )}
                                          {isCodexCredentialRefreshing
                                            ? t('Refreshing...')
                                            : t('Refresh credential')}
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  <Alert className='border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-50'>
                                    <AlertDescription>
                                      {t(
                                        "Disclaimer: Personal use only. Do not distribute or share any credentials. This channel has prerequisites and requires prior setup; use it only if you understand the flow and risks, and comply with OpenAI's terms and policies. Credentials and configuration are for Codex CLI integration only, and are not intended for any other client, platform, or channel."
                                      )}
                                    </AlertDescription>
                                  </Alert>
                                </div>
                              )}

                              {isEditing && isMultiKeyChannel && (
                                <FormField
                                  control={form.control}
                                  name='key_mode'
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>
                                        {t('Key Update Mode')}
                                      </FormLabel>
                                      <Select
                                        items={[
                                          {
                                            value: 'append',
                                            label: t('Append to existing keys'),
                                          },
                                          {
                                            value: 'replace',
                                            label: t(
                                              'Replace all existing keys'
                                            ),
                                          },
                                        ]}
                                        onValueChange={field.onChange}
                                        value={field.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent
                                          alignItemWithTrigger={false}
                                        >
                                          <SelectGroup>
                                            <SelectItem value='append'>
                                              {t('Append to existing keys')}
                                            </SelectItem>
                                            <SelectItem value='replace'>
                                              {t('Replace all existing keys')}
                                            </SelectItem>
                                          </SelectGroup>
                                        </SelectContent>
                                      </Select>
                                      <FormDescription>
                                        {field.value === 'replace'
                                          ? t(
                                              'Replace mode: Will completely replace all existing keys'
                                            )
                                          : t(
                                              'Append mode: New keys will be added to the end of the existing key list'
                                            )}
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              )}

                              {!isEditing &&
                                multiKeyMode === 'multi_to_single' && (
                                  <FormField
                                    control={form.control}
                                    name='multi_key_type'
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>
                                          {t('Multi-Key Strategy')}
                                        </FormLabel>
                                        <Select
                                          items={[
                                            {
                                              value: 'random',
                                              label: t('Random'),
                                            },
                                            {
                                              value: 'polling',
                                              label: t('Polling'),
                                            },
                                          ]}
                                          onValueChange={field.onChange}
                                          value={field.value}
                                        >
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent
                                            alignItemWithTrigger={false}
                                          >
                                            <SelectGroup>
                                              <SelectItem value='random'>
                                                {t('Random')}
                                              </SelectItem>
                                              <SelectItem value='polling'>
                                                {t('Polling')}
                                              </SelectItem>
                                            </SelectGroup>
                                          </SelectContent>
                                        </Select>
                                        <FormDescription>
                                          {multiKeyType === 'polling' ? (
                                            <span className='text-warning'>
                                              {t(
                                                'Polling mode requires Redis and memory cache, otherwise performance will be significantly degraded'
                                              )}
                                            </span>
                                          ) : (
                                            t(
                                              'Randomly select a key from the pool for each request'
                                            )
                                          )}
                                        </FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                )}
                            </ChannelAuthSection>
                          </fieldset>
                        </div>
                      </ChannelApiAccessSection>
                    </div>

                    {/* ── Models ── */}
                    <div
                      id={CHANNEL_EDITOR_SECTION_IDS.models}
                      className='scroll-mt-4'
                    >
                      <ChannelModelsSection>
                        <div className='border-border/60 bg-muted/10 space-y-4 rounded-lg border p-4'>
                          <FormField
                            control={form.control}
                            name='models'
                            render={() => (
                              <FormItem className='space-y-3'>
                                <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                                  <div className='space-y-1'>
                                    <FormLabel>{t('Models *')}</FormLabel>
                                    <FormDescription>
                                      {t(FIELD_DESCRIPTIONS.MODELS)}
                                    </FormDescription>
                                  </div>
                                  <Badge variant='outline' className='w-fit'>
                                    {t('Selected {{count}}', {
                                      count: currentModelsArray.length,
                                    })}
                                  </Badge>
                                </div>
                                <FormControl>
                                  <MultiSelect
                                    options={modelOptions}
                                    selected={currentModelsArray}
                                    onChange={handleModelsChange}
                                    placeholder={t(
                                      'Select or add models allowed on this channel'
                                    )}
                                    allowCreate
                                    createLabel='Add custom model "{{value}}"'
                                    maxVisibleChips={8}
                                    copyChipOnClick
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Separator />

                          <div className='space-y-3'>
                            <div>
                              <p className='text-sm font-medium'>
                                {t('Quick actions')}
                              </p>
                              <p className='text-muted-foreground text-xs'>
                                {t(
                                  'Use upstream discovery to populate the model list faster.'
                                )}
                              </p>
                            </div>
                            <div className='flex flex-wrap gap-2'>
                              {MODEL_FETCHABLE_TYPES.has(currentType) && (
                                <>
                                  <Button
                                    type='button'
                                    variant='outline'
                                    size='sm'
                                    onClick={handleFetchModels}
                                    disabled={!isEditing && !canEditSensitive}
                                  >
                                    <Sparkles
                                      className='mr-2 h-4 w-4'
                                      aria-hidden='true'
                                    />
                                    {t('Fetch from Upstream')}
                                  </Button>
                                  {!isEditing && !canEditSensitive && (
                                    <span className='text-muted-foreground basis-full text-xs'>
                                      {t(
                                        'No permission to perform this action'
                                      )}
                                    </span>
                                  )}
                                </>
                              )}
                              <Button
                                type='button'
                                variant='outline'
                                size='sm'
                                onClick={handleCopyModels}
                                disabled={currentModelsArray.length === 0}
                              >
                                <Copy
                                  className='mr-2 h-4 w-4'
                                  aria-hidden='true'
                                />
                                {t('Copy All')}
                              </Button>
                              <Button
                                type='button'
                                variant='ghost'
                                size='sm'
                                onClick={handleClearModels}
                                disabled={currentModelsArray.length === 0}
                              >
                                <Eraser
                                  className='mr-2 h-4 w-4'
                                  aria-hidden='true'
                                />
                                {t('Clear All')}
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className='space-y-3'>
                          <div>
                            <h3 className='text-sm font-semibold'>
                              {t('Catalog bindings')}
                            </h3>
                            <p className='text-muted-foreground text-sm'>
                              {t(
                                'Public model bindings for this channel. Edit them from the Models page to enable routing.'
                              )}
                            </p>
                          </div>
                          <ChannelModelBindingsPanel
                            channelId={channelId || undefined}
                          />
                        </div>
                      </ChannelModelsSection>
                    </div>

                    <div
                      id={CHANNEL_EDITOR_SECTION_IDS.advanced}
                      className='scroll-mt-4'
                    >
                      <ChannelAdvancedSection
                        open={advancedSettingsOpen}
                        onOpenChange={handleAdvancedSettingsOpenChange}
                        summary={advancedSummary}
                      >
                        {/* ── Notes & Overrides ── */}
                        <div className={sideDrawerSectionClassName()}>
                          <CardHeading
                            title={t('Notes & Overrides')}
                            icon={<FileText className='h-4 w-4' />}
                            iconTone='info'
                          />
                          <div
                            id={ADVANCED_SETTINGS_SECTION_IDS.internalNotes}
                            className={configuredAdvancedSectionClassName(
                              'flex scroll-mt-4 flex-col gap-4 border-t pt-4',
                              internalNotesConfigured
                            )}
                          >
                            <SubHeading
                              title={t('Internal Notes')}
                              icon={<FileText className='h-3.5 w-3.5' />}
                              iconTone='chart-3'
                            />
                            <div className='grid gap-4 sm:grid-cols-2'>
                              <FormField
                                control={form.control}
                                name='remark'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>{t('Remark')}</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        placeholder={t(
                                          FIELD_PLACEHOLDERS.REMARK
                                        )}
                                        rows={2}
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      {t(FIELD_DESCRIPTIONS.REMARK)}
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          <div
                            id={ADVANCED_SETTINGS_SECTION_IDS.overrideRules}
                            className={configuredAdvancedSectionClassName(
                              'flex scroll-mt-4 flex-col gap-4 border-t pt-4',
                              overrideRulesConfigured
                            )}
                          >
                            <SubHeading
                              title={t('Override Rules')}
                              icon={<Code className='h-3.5 w-3.5' />}
                              iconTone='chart-4'
                            />

                            <FormField
                              control={form.control}
                              name='status_code_mapping'
                              render={({ field }) => (
                                <FormItem className='space-y-3'>
                                  <div className='space-y-1'>
                                    <FormLabel>
                                      {t('Status Code Mapping')}
                                    </FormLabel>
                                    <FormDescription>
                                      {t(
                                        'Map upstream status codes to different codes'
                                      )}
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <JsonEditor
                                      value={field.value || ''}
                                      onChange={field.onChange}
                                      disabled={isSubmitting}
                                      keyPlaceholder='400'
                                      valuePlaceholder='500'
                                      keyLabel='Original Code'
                                      valueLabel='Mapped Code'
                                      emptyMessage={t(
                                        'No status code mappings configured.'
                                      )}
                                      template={{ '400': '500', '429': '503' }}
                                      valueType='string'
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {sensitiveLocked && (
                              <p className='text-muted-foreground text-xs'>
                                {t('No permission to perform this action')}
                              </p>
                            )}
                            <fieldset
                              disabled={sensitiveLocked}
                              className='space-y-4 disabled:opacity-60'
                            >
                              <FormField
                                control={form.control}
                                name='header_override'
                                render={({ field }) => (
                                  <FormItem className='space-y-3'>
                                    <div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
                                      <div className='space-y-1'>
                                        <FormLabel>
                                          {t('Request Header Override')}
                                        </FormLabel>
                                        <FormDescription>
                                          {t('Override request headers')}
                                        </FormDescription>
                                      </div>
                                      <div className='flex flex-wrap gap-2'>
                                        <Button
                                          type='button'
                                          variant='outline'
                                          size='sm'
                                          onClick={() =>
                                            field.onChange(
                                              JSON.stringify(
                                                {
                                                  '*': true,
                                                  're:^X-Trace-.*$': true,
                                                  'X-Foo':
                                                    '{client_header:X-Foo}',
                                                  Authorization:
                                                    'Bearer {api_key}',
                                                },
                                                null,
                                                2
                                              )
                                            )
                                          }
                                        >
                                          {t('Fill Template')}
                                        </Button>
                                        <Button
                                          type='button'
                                          variant='outline'
                                          size='sm'
                                          onClick={() =>
                                            field.onChange(
                                              JSON.stringify(
                                                { '*': true },
                                                null,
                                                2
                                              )
                                            )
                                          }
                                        >
                                          {t('Passthrough Template')}
                                        </Button>
                                        <Button
                                          type='button'
                                          variant='ghost'
                                          size='sm'
                                          onClick={() => field.onChange('')}
                                        >
                                          {t('Clear')}
                                        </Button>
                                      </div>
                                    </div>
                                    <FormControl>
                                      <JsonCodeEditor
                                        value={field.value || ''}
                                        onChange={field.onChange}
                                        name={field.name}
                                        onBlur={field.onBlur}
                                        textareaRef={field.ref}
                                        disabled={
                                          sensitiveLocked || isSubmitting
                                        }
                                        placeholder={t(
                                          'Enter JSON to override request headers'
                                        )}
                                        heightClassName='h-40 min-h-40 max-h-40'
                                      />
                                    </FormControl>
                                    <FormDescription className='text-xs'>
                                      {t('Supported variables')}:{' '}
                                      <code className='bg-muted rounded px-1 py-0.5'>
                                        {'{api_key}'}
                                      </code>{' '}
                                      — {t('Channel key')},{' '}
                                      <code className='bg-muted rounded px-1 py-0.5'>
                                        {'{client_header:NAME}'}
                                      </code>{' '}
                                      — {t('Client header value')}
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </fieldset>
                          </div>
                        </div>

                        {/* ── Extra Settings ── */}
                        <div
                          id={ADVANCED_SETTINGS_SECTION_IDS.extraSettings}
                          className={sideDrawerSectionClassName(
                            configuredAdvancedSectionClassName(
                              'scroll-mt-4',
                              extraSettingsConfigured
                            )
                          )}
                        >
                          <CardHeading
                            title={t('Channel Extra Settings')}
                            icon={<Settings className='h-4 w-4' />}
                            iconTone='chart-3'
                          />
                          {sensitiveLocked && (
                            <Alert className='border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-50'>
                              <AlertDescription>
                                {t('No permission to perform this action')}
                              </AlertDescription>
                            </Alert>
                          )}
                          <fieldset
                            disabled={sensitiveLocked}
                            className='space-y-4 disabled:opacity-60'
                          >
                            <div className='divide-border space-y-0 divide-y border-y'>
                              {currentType === 1 && (
                                <FormField
                                  control={form.control}
                                  name='force_format'
                                  render={({ field }) => (
                                    <FormItem className='flex items-center justify-between px-4 py-3'>
                                      <div className='space-y-0.5'>
                                        <FormLabel>
                                          {t('Force Format')}
                                        </FormLabel>
                                        <FormDescription>
                                          {t(
                                            'Force format response to OpenAI standard (OpenAI channel only)'
                                          )}
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
                              )}

                              <FormField
                                control={form.control}
                                name='thinking_to_content'
                                render={({ field }) => (
                                  <FormItem className='flex items-center justify-between px-4 py-3'>
                                    <div className='space-y-0.5'>
                                      <FormLabel>
                                        {t('Thinking to Content')}
                                      </FormLabel>
                                      <FormDescription>
                                        {t(
                                          'Convert reasoning_content to <think> tag in content'
                                        )}
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
                                name='disable_task_polling_sleep'
                                render={({ field }) => (
                                  <FormItem className='flex items-center justify-between px-4 py-3'>
                                    <div className='space-y-0.5'>
                                      <FormLabel>
                                        {t('Skip async task polling delay')}
                                      </FormLabel>
                                      <FormDescription>
                                        {t(
                                          'Do not wait one second between polling async tasks for this channel'
                                        )}
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
                            </div>

                            <FormField
                              control={form.control}
                              name='proxy'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('Proxy Address')}</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder={t(
                                        'socks5://user:pass@host:port'
                                      )}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    {t(
                                      'Network proxy for this channel (supports HTTP, HTTPS, SOCKS5, and SOCKS5H)'
                                    )}
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name='http_protocol'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('HTTP Protocol')}</FormLabel>
                                  <Select
                                    items={[
                                      {
                                        value: 'auto',
                                        label: t('Auto'),
                                      },
                                      {
                                        value: 'http1',
                                        label: t('HTTP/1.1'),
                                      },
                                    ]}
                                    value={field.value || 'auto'}
                                    onValueChange={(value) => {
                                      const nextProtocol =
                                        value === 'http1' ? 'http1' : 'auto'
                                      field.onChange(nextProtocol)
                                      if (nextProtocol === 'http1') {
                                        form.setValue(
                                          'http2_connection_shards',
                                          1,
                                          {
                                            shouldDirty: true,
                                            shouldValidate: true,
                                          }
                                        )
                                      }
                                    }}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent alignItemWithTrigger={false}>
                                      <SelectGroup>
                                        <SelectItem value='auto'>
                                          {t('Auto')}
                                        </SelectItem>
                                        <SelectItem value='http1'>
                                          {t('HTTP/1.1')}
                                        </SelectItem>
                                      </SelectGroup>
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>
                                    {t(
                                      'Auto negotiates HTTP/2 when available. HTTP/1.1 forces multiple keep-alive connections under concurrency.'
                                    )}
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name='http2_connection_shards'
                              render={({ field }) => {
                                const http1Selected =
                                  currentHttpProtocol === 'http1'
                                const shardItems = Array.from(
                                  { length: 8 },
                                  (_, index) => {
                                    const value = String(index + 1)
                                    return { value, label: value }
                                  }
                                )
                                return (
                                  <FormItem>
                                    <FormLabel>
                                      {t('HTTP/2 Connection Shards')}
                                    </FormLabel>
                                    <Select
                                      items={shardItems}
                                      value={String(field.value || 1)}
                                      disabled={http1Selected}
                                      onValueChange={(value) => {
                                        field.onChange(Number(value))
                                      }}
                                    >
                                      <FormControl>
                                        <SelectTrigger disabled={http1Selected}>
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent
                                        alignItemWithTrigger={false}
                                      >
                                        <SelectGroup>
                                          {shardItems.map((item) => (
                                            <SelectItem
                                              key={item.value}
                                              value={item.value}
                                            >
                                              {item.label}
                                            </SelectItem>
                                          ))}
                                        </SelectGroup>
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>
                                      {http1Selected
                                        ? t(
                                            'HTTP/2 connection shards are unavailable when HTTP/1.1 is selected.'
                                          )
                                        : t(
                                            'Spread HTTP/2 traffic across multiple reusable connections to the same upstream origin (1-8).'
                                          )}
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )
                              }}
                            />
                          </fieldset>
                        </div>
                      </ChannelAdvancedSection>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </Form>

          <SheetFooter className={sideDrawerFooterClassName()}>
            <SheetClose
              render={<Button variant='outline' disabled={isSubmitting} />}
            >
              {t('Cancel')}
            </SheetClose>
            <Button form='channel-form' type='submit' disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              {isEditing ? t('Update Channel') : t('Save changes')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {advancedCustomEditorOpen && !sensitiveLocked && (
        <AdvancedCustomEditorDialog
          open={advancedCustomEditorOpen}
          value={form.watch('advanced_custom') || ''}
          onOpenChange={setAdvancedCustomEditorOpen}
          onSave={(nextValue) => {
            form.setValue('advanced_custom', nextValue, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }}
        />
      )}

      {/* Fetch Models Dialog */}
      <FetchModelsDialog
        open={fetchModelsDialogOpen}
        onOpenChange={setFetchModelsDialogOpen}
        onModelsSelected={(models) => {
          form.setValue('models', formatModelsArray(models))
        }}
        customFetcher={
          shouldPreviewUnsavedModels ? formPreviewFetcher : undefined
        }
        channelName={
          shouldPreviewUnsavedModels ? currentName?.trim() : undefined
        }
        existingModelsOverride={currentModelsArray}
      />

      <SecureVerificationDialog
        open={verificationOpen}
        onOpenChange={(open) => {
          if (!open) {
            cancelVerification()
          }
        }}
        methods={verificationMethods}
        state={verificationState}
        onVerify={async (method, code) => {
          await executeVerification(method, code)
        }}
        onCancel={cancelVerification}
        onCodeChange={setVerificationCode}
        onMethodChange={switchVerificationMethod}
      />

      <StatusCodeRiskDialog
        open={statusCodeRiskOpen}
        onOpenChange={(v) => {
          if (!v) handleStatusCodeRiskAction(false)
        }}
        detailItems={statusCodeRiskDetailItems}
        onConfirm={() => handleStatusCodeRiskAction(true)}
      />
    </>
  )
}
