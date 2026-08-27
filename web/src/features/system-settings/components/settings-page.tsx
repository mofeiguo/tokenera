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
import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { ErrorState } from '@/components/error-state'
import { SectionPageLayout } from '@/components/layout'
import { Skeleton } from '@/components/ui/skeleton'
import { useParams } from '@/lib/router'

import { useSystemOptions, getOptionValue } from '../hooks/use-system-options'
import type { SystemOption } from '../types'
import { SettingsPageProvider } from './settings-page-context'

type SettingsPageProps<
  TSettings extends Record<string, string | number | boolean | unknown[]>,
  TSectionId extends string,
  TExtraArgs extends unknown[] = [],
> = {
  routePath: string
  defaultSettings: TSettings
  defaultSection: TSectionId
  getSectionContent: (
    sectionId: TSectionId,
    settings: TSettings,
    ...extraArgs: TExtraArgs
  ) => ReactNode
  getSectionMeta: (sectionId: TSectionId) => {
    titleKey: string
  }
  extraArgs?: TExtraArgs
  loadingMessage?: string
  resolveSettings?: (
    settings: TSettings,
    raw: SystemOption[] | undefined
  ) => TSettings
}

type SettingsPageFrameProps = {
  title: ReactNode
  children: ReactNode
}

function SettingsPageFrame(props: SettingsPageFrameProps) {
  const [actionsContainer, setActionsContainer] =
    useState<HTMLDivElement | null>(null)
  const [titleStatusContainer, setTitleStatusContainer] =
    useState<HTMLSpanElement | null>(null)

  return (
    <SettingsPageProvider
      actionsContainer={actionsContainer}
      titleStatusContainer={titleStatusContainer}
    >
      <SectionPageLayout>
        <SectionPageLayout.Title>
          <span className='inline-flex max-w-full min-w-0 items-center gap-2 align-middle'>
            <span className='truncate'>{props.title}</span>
            <span
              ref={setTitleStatusContainer}
              className='inline-flex min-w-0 shrink-0 items-center'
            />
          </span>
        </SectionPageLayout.Title>
        <SectionPageLayout.Actions>
          <div
            ref={setActionsContainer}
            className='flex flex-wrap items-center justify-end gap-2'
          />
        </SectionPageLayout.Actions>
        <SectionPageLayout.Content>
          <div className='flex h-full min-h-0 w-full flex-col gap-3 sm:gap-4'>
            {props.children}
          </div>
        </SectionPageLayout.Content>
      </SectionPageLayout>
    </SettingsPageProvider>
  )
}

function SettingsPageLoading(props: { message: string }) {
  return (
    <div
      className='flex flex-col gap-3'
      role='status'
      aria-busy='true'
      aria-live='polite'
    >
      <span className='sr-only'>{props.message}</span>
      <div className='bg-card border-border/80 overflow-hidden rounded-xl border shadow-[var(--shadow-card)]'>
        <div className='border-border/70 space-y-2 border-b px-3 py-3 sm:px-4'>
          <Skeleton className='h-4 w-40' />
          <Skeleton className='h-3 w-64 max-w-full' />
        </div>
        <div className='space-y-4 p-3 sm:p-4'>
          <div className='grid gap-4 lg:grid-cols-2'>
            <Skeleton className='h-9 w-full' />
            <Skeleton className='h-9 w-full' />
            <Skeleton className='h-9 w-full lg:col-span-2' />
            <Skeleton className='h-20 w-full lg:col-span-2' />
          </div>
        </div>
      </div>
      <div className='bg-card border-border/80 overflow-hidden rounded-xl border shadow-[var(--shadow-card)]'>
        <div className='border-border/70 space-y-2 border-b px-3 py-3 sm:px-4'>
          <Skeleton className='h-4 w-32' />
          <Skeleton className='h-3 w-52 max-w-full' />
        </div>
        <div className='space-y-3 p-3 sm:p-4'>
          <Skeleton className='h-9 w-full' />
          <Skeleton className='h-9 w-3/4 max-w-md' />
        </div>
      </div>
    </div>
  )
}

/**
 * Generic settings page component
 * Handles loading state, data fetching, and section rendering
 */
export function SettingsPage<
  TSettings extends Record<string, string | number | boolean | unknown[]>,
  TSectionId extends string,
  TExtraArgs extends unknown[] = [],
>({
  routePath,
  defaultSettings,
  defaultSection,
  getSectionContent,
  getSectionMeta,
  extraArgs,
  loadingMessage = 'Loading settings...',
  resolveSettings,
}: SettingsPageProps<TSettings, TSectionId, TExtraArgs>) {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useSystemOptions()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params = useParams({ from: routePath as any })
  const activeSection = (params?.section ?? defaultSection) as TSectionId
  const sectionMeta = getSectionMeta(activeSection)

  const settings = useMemo(() => {
    const baseSettings = getOptionValue(
      data?.data,
      defaultSettings
    ) as TSettings
    return resolveSettings
      ? resolveSettings(baseSettings, data?.data)
      : baseSettings
  }, [data?.data, defaultSettings, resolveSettings])

  if (isLoading) {
    return (
      <SettingsPageFrame title={t(sectionMeta.titleKey)}>
        <SettingsPageLoading message={t(loadingMessage)} />
      </SettingsPageFrame>
    )
  }

  if (isError) {
    return (
      <SettingsPageFrame title={t(sectionMeta.titleKey)}>
        <div className='bg-card border-border/80 overflow-hidden rounded-xl border shadow-[var(--shadow-card)]'>
          <ErrorState
            className='min-h-48'
            onRetry={() => {
              void refetch()
            }}
          />
        </div>
      </SettingsPageFrame>
    )
  }

  const sectionContent = getSectionContent(
    activeSection,
    settings,
    ...((extraArgs ?? []) as TExtraArgs)
  )

  return (
    <SettingsPageFrame title={t(sectionMeta.titleKey)}>
      {sectionContent}
    </SettingsPageFrame>
  )
}
