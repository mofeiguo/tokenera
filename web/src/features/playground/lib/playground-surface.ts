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

/** Shared width for the chat column and input dock. */
export const PLAYGROUND_CONTENT_WIDTH = 'max-w-3xl'

export const PLAYGROUND_COLUMN = `mx-auto w-full ${PLAYGROUND_CONTENT_WIDTH} px-4`

/** Conversation field — same white as the chrome. */
export const PLAYGROUND_CANVAS_BACKGROUND = 'bg-background'

/** Chat scroll canvas. */
export const PLAYGROUND_CHAT_BACKGROUND = PLAYGROUND_CANVAS_BACKGROUND

/** Top chrome — full pane width, model left / actions right. */
export const PLAYGROUND_TOOLBAR =
  'bg-playground-canvas shrink-0'

export const PLAYGROUND_TOOLBAR_INNER =
  'flex h-12 w-full items-center justify-between gap-3 px-4 md:px-5'

/** Model selector in toolbar — borderless ZenMux style. */
export const PLAYGROUND_TOOLBAR_MODEL =
  'h-9 max-w-[min(100%,32rem)] gap-2 border-0 bg-transparent px-1 shadow-none hover:bg-muted/60 focus-visible:ring-0'

/** Protocol field — label above rounded select (settings panel). */
export const PLAYGROUND_PROTOCOL_FIELD = 'flex w-full flex-col gap-1.5'

export const PLAYGROUND_PROTOCOL_LABEL =
  'text-muted-foreground text-xs leading-none font-normal'

export const PLAYGROUND_PROTOCOL_SELECT = [
  'w-full min-w-[11rem] rounded-xl border border-border/80 bg-background shadow-none',
  '[&_[data-slot=native-select]]:h-9 [&_[data-slot=native-select]]:w-full',
  '[&_[data-slot=native-select]]:rounded-xl [&_[data-slot=native-select]]:border-0',
  '[&_[data-slot=native-select]]:bg-transparent [&_[data-slot=native-select]]:px-3',
  '[&_[data-slot=native-select]]:pr-8 [&_[data-slot=native-select]]:text-sm',
  '[&_[data-slot=native-select]]:font-normal [&_[data-slot=native-select]]:shadow-none',
  '[&_[data-slot=native-select]]:ring-0 [&_[data-slot=native-select]]:focus-visible:ring-0',
  'has-[[data-slot=native-select]:focus-visible]:border-foreground/20',
].join(' ')

/** Icon button in toolbar (32px). */
export const PLAYGROUND_TOOLBAR_ICON_BUTTON =
  'text-foreground/80 hover:text-foreground size-8 rounded-lg hover:bg-muted/70'

/** Bottom input strip — fade keeps the dock attached to the conversation. */
export const PLAYGROUND_INPUT_AREA = [
  PLAYGROUND_CANVAS_BACKGROUND,
  'relative shrink-0 pt-5 pb-6',
  'before:pointer-events-none before:absolute before:inset-x-0 before:-top-10 before:h-10',
  'before:bg-gradient-to-b before:from-transparent before:to-background',
].join(' ')

/** White composer — 12px card, hairline, ZenMux lift. */
export const PLAYGROUND_INPUT_SURFACE = [
  'group/composer relative overflow-hidden rounded-[12px]',
  'border border-playground-composer-border bg-playground-composer',
  'playground-composer-elevated',
  'items-stretch ring-0 outline-none',
  'transition-[border-color,box-shadow] duration-200',
  'has-[[data-slot=input-group-control]:focus-visible]:border-foreground/20',
  'has-[[data-slot=input-group-control]:focus-visible]:ring-0',
  'focus-within:border-foreground/20 focus-within:ring-0',
].join(' ')

/** Model / empty-state cards. */
export const PLAYGROUND_SURFACE_CARD = [
  'border-playground-composer-border bg-playground-composer',
  'rounded-2xl border-[0.5px] playground-composer-elevated',
].join(' ')

/** Horizontal strip above the textarea — ChatGPT / Claude style. */
export const PLAYGROUND_INPUT_ATTACHMENT_STRIP =
  'flex w-full items-start justify-start gap-2 self-start overflow-x-auto px-4 pt-3 pb-0 [scrollbar-width:thin]'

export const PLAYGROUND_INPUT_ATTACHMENT_IMAGE =
  'border-border/70 bg-muted/30 size-14 overflow-hidden rounded-xl border'

export const PLAYGROUND_INPUT_ATTACHMENT_FILE = [
  'border-border/70 bg-muted/30 text-foreground flex h-14 max-w-[10rem] items-center gap-2',
  'rounded-xl border px-3 text-sm',
].join(' ')

export const PLAYGROUND_INPUT_ATTACHMENT_REMOVE = [
  'absolute -top-1.5 -right-1.5 size-5 rounded-full border border-border/80',
  'bg-white text-foreground shadow-sm hover:bg-muted',
].join(' ')

/** ZenMux textarea: 14/20, 16px 16px 4px 16px. */
export const PLAYGROUND_INPUT_TEXTAREA_WRAP = 'w-full'

export const PLAYGROUND_INPUT_TEXTAREA = [
  'min-h-20 max-h-48 w-full resize-none',
  'border-0 bg-transparent px-4 pt-4 pb-1',
  'text-[14px] leading-5 font-normal shadow-none ring-0 outline-none',
  'text-foreground placeholder:text-playground-placeholder',
  'focus-visible:border-0 focus-visible:ring-0 focus-visible:outline-none',
].join(' ')

export const PLAYGROUND_INPUT_ACTIONS =
  'border-0 bg-transparent px-3 pt-1 pb-2'

/** Composer left actions (+ attach, search). */
export const PLAYGROUND_INPUT_TOOL_BUTTON =
  'text-foreground/75 hover:text-foreground size-8 rounded-lg hover:bg-muted/70'

/** Send button — active (ZenMux: dark filled circle). */
export const PLAYGROUND_INPUT_SEND_ACTIVE =
  'size-8 rounded-full bg-foreground text-background shadow-none hover:bg-foreground/90 disabled:pointer-events-none disabled:!opacity-100'

/** Send button — inactive (ZenMux: ghost arrow, no fill). */
export const PLAYGROUND_INPUT_SEND_INACTIVE =
  'size-8 rounded-full bg-transparent text-foreground/25 shadow-none hover:bg-transparent disabled:pointer-events-none disabled:!opacity-100'

export const PLAYGROUND_INPUT_STOP_BUTTON =
  'size-8 rounded-full border border-destructive/30 bg-destructive/15 text-destructive shadow-none hover:bg-destructive/20 disabled:!opacity-100'
