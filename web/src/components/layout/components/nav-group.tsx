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
import { ChevronDown, ChevronRight } from 'lucide-react'
import { type ReactNode, useState, useEffect } from 'react'

import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Link, useLocation } from '@/lib/router'
import { cn } from '@/lib/utils'

import { checkIsActive } from '../lib/url-utils'
import type {
  NavCollapsible,
  NavLink,
  NavGroup as NavGroupProps,
} from '../types'

/**
 * Sidebar navigation group component
 * Renders a group of navigation items, supporting regular links and collapsible submenus
 */
const groupLabelClassName =
  'mb-3 h-auto px-4 text-[14px] leading-none font-bold tracking-[-0.02em] text-[#333333] dark:text-foreground'

const menuItemClassName =
  'text-[#666666] my-[2px] h-10 rounded-[8px] px-4 text-[14px] font-normal shadow-none hover:bg-black/[0.04] hover:text-[#666666] data-active:bg-white data-active:font-bold data-active:text-[#333333] data-active:shadow-[0_1px_4px_0_rgba(0,0,0,0.05)] dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-muted-foreground dark:data-active:bg-muted dark:data-active:text-foreground dark:data-active:shadow-none'

export function NavGroup({ title, items, collapsible }: NavGroupProps) {
  const { state, isMobile } = useSidebar()
  const href = useLocation({ select: (location) => location.href })
  const groupActive = items.some((item) => checkIsActive(href, item))
  const [isOpen, setIsOpen] = useState(true)
  const canCollapse = collapsible !== false && state !== 'collapsed'

  useEffect(() => {
    if (groupActive) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOpen(true)
    }
  }, [groupActive])

  const menu = (
    <SidebarMenu>
      {items.map((item) => {
        const key = `${item.title}-${item.url}`

        if (!item.items) {
          return (
            <SidebarMenuLink key={key} item={item as NavLink} href={href} />
          )
        }

        if (state === 'collapsed' && !isMobile) {
          return (
            <SidebarMenuCollapsedDropdown
              key={key}
              item={item as NavCollapsible}
              href={href}
            />
          )
        }

        return (
          <SidebarMenuCollapsible
            key={key}
            item={item as NavCollapsible}
            href={href}
          />
        )
      })}
    </SidebarMenu>
  )

  if (!canCollapse) {
    return (
      <SidebarGroup className='mt-6 px-2 py-0 first:mt-0'>
        <SidebarGroupLabel className={groupLabelClassName}>
          {title}
        </SidebarGroupLabel>
        {menu}
      </SidebarGroup>
    )
  }

  return (
    <SidebarGroup className='mt-6 px-2 py-0 first:mt-0'>
      <Collapsible
        className='group/nav-group'
        onOpenChange={setIsOpen}
        open={isOpen}
      >
        <SidebarGroupLabel
          className={cn(
            groupLabelClassName,
            'hover:text-foreground cursor-pointer justify-between'
          )}
          render={<CollapsibleTrigger type='button' />}
        >
          {title}
          <span
            className={cn(
              'inline-flex size-3.5 shrink-0 text-[#999999] transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          >
            <ChevronDown className='size-3.5' />
          </span>
        </SidebarGroupLabel>
        <CollapsibleContent>{menu}</CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  )
}

/**
 * Navigation badge component
 */
function NavBadge({ children }: { children: ReactNode }) {
  return <Badge className='shrink-0 px-1 py-0 text-xs'>{children}</Badge>
}

/**
 * Sidebar menu link item
 */
function SidebarMenuLink({ item, href }: { item: NavLink; href: string }) {
  const { isMobile, setOpenMobile } = useSidebar()
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={checkIsActive(href, item)}
        tooltip={item.title}
        className={menuItemClassName}
        render={
          <Link
            to={item.url}
            preload={isMobile ? false : undefined}
            onClick={() => setOpenMobile(false)}
          />
        }
      >
        {item.icon && <item.icon className='shrink-0' />}
        <span className='min-w-0 flex-1 truncate'>{item.title}</span>
        {item.badge && <NavBadge>{item.badge}</NavBadge>}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

/**
 * Sidebar collapsible menu item
 */
function SidebarMenuCollapsible({
  item,
  href,
}: {
  item: NavCollapsible
  href: string
}) {
  const { isMobile, setOpenMobile } = useSidebar()
  // 检查当前路径是否匹配子菜单项
  const isSubItemActive = checkIsActive(href, item)
  // 使用受控状态，初始值基于当前路径是否匹配
  const [isOpen, setIsOpen] = useState(() => isSubItemActive)

  // 当路径变化时，如果匹配子菜单项，自动展开父级菜单
  useEffect(() => {
    if (isSubItemActive) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOpen(true)
    }
  }, [isSubItemActive])

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className='group/collapsible'
      render={<SidebarMenuItem />}
    >
      <CollapsibleTrigger
        className='group/collapsible-trigger'
        render={
          <SidebarMenuButton
            tooltip={item.title}
            className={menuItemClassName}
          />
        }
      >
        {item.icon && <item.icon className='shrink-0' />}
        <span className='min-w-0 flex-1 truncate'>{item.title}</span>
        {item.badge && <NavBadge>{item.badge}</NavBadge>}
        <ChevronRight className='ms-auto size-4 shrink-0 transition-transform duration-200 group-data-[panel-open]/collapsible-trigger:rotate-90' />
      </CollapsibleTrigger>
      <CollapsibleContent className='CollapsibleContent'>
        <SidebarMenuSub>
          {item.items.map((subItem) => (
            <SidebarMenuSubItem key={subItem.title}>
              <SidebarMenuSubButton
                isActive={checkIsActive(href, subItem)}
                render={
                  <Link
                    to={subItem.url}
                    preload={isMobile ? false : undefined}
                    onClick={() => setOpenMobile(false)}
                  />
                }
              >
                {subItem.icon && <subItem.icon className='shrink-0' />}
                <span className='min-w-0 flex-1 truncate'>{subItem.title}</span>
                {subItem.badge && <NavBadge>{subItem.badge}</NavBadge>}
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  )
}

/**
 * Sidebar dropdown menu item when collapsed
 */
function SidebarMenuCollapsedDropdown({
  item,
  href,
}: {
  item: NavCollapsible
  href: string
}) {
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger
          className='group/dropdown-trigger'
          render={
            <SidebarMenuButton
              tooltip={item.title}
              isActive={checkIsActive(href, item)}
            />
          }
        >
          {item.icon && <item.icon className='shrink-0' />}
          <span className='min-w-0 flex-1 truncate'>{item.title}</span>
          {item.badge && <NavBadge>{item.badge}</NavBadge>}
          <ChevronRight className='ms-auto size-4 shrink-0 transition-transform duration-200 group-data-[popup-open]/dropdown-trigger:rotate-90' />
        </DropdownMenuTrigger>
        <DropdownMenuContent side='right' align='start' sideOffset={4}>
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              {item.title} {item.badge ? `(${item.badge})` : ''}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {item.items.map((sub) => (
              <DropdownMenuItem
                key={`${sub.title}-${sub.url}`}
                render={
                  <Link
                    to={sub.url}
                    className={`${checkIsActive(href, sub) ? 'bg-secondary' : ''}`}
                  />
                }
              >
                {sub.icon && <sub.icon />}
                <span className='max-w-52 text-wrap'>{sub.title}</span>
                {sub.badge && (
                  <span className='ms-auto text-xs'>{sub.badge}</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}
