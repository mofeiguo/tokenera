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
import { describe, expect, it, beforeEach, afterEach } from 'vitest'

import {
  DASHBOARD_PANEL_FRAME,
  DASHBOARD_PANEL_HEADER,
} from '../../components/ui/panel-surface'
import { getLatencyColorClass } from '../api-info'
import { getDashboardChartColors } from '../charts'

describe('dashboard panel surface', () => {
  it('uses card-aligned frame tokens for dense editorial panels', () => {
    expect(DASHBOARD_PANEL_FRAME).toContain('rounded-xl')
    expect(DASHBOARD_PANEL_FRAME).toContain('bg-card')
    expect(DASHBOARD_PANEL_FRAME).toContain('shadow-[var(--shadow-card)]')
    expect(DASHBOARD_PANEL_HEADER).toContain('border-b')
  })
})

describe('getLatencyColorClass', () => {
  it('maps latency bands to semantic status tokens', () => {
    expect(getLatencyColorClass(100)).toBe('text-success')
    expect(getLatencyColorClass(300)).toBe('text-warning')
    expect(getLatencyColorClass(800)).toBe('text-destructive')
  })
})

describe('getDashboardChartColors', () => {
  const previousValues = new Map<string, string>()

  beforeEach(() => {
    for (const name of [
      '--chart-1',
      '--chart-2',
      '--chart-3',
      '--chart-4',
      '--chart-5',
    ]) {
      previousValues.set(
        name,
        document.documentElement.style.getPropertyValue(name)
      )
    }
    document.documentElement.style.setProperty('--chart-1', 'oklch(0.5 0.1 20)')
    document.documentElement.style.setProperty('--chart-2', 'oklch(0.5 0.1 80)')
    document.documentElement.style.setProperty(
      '--chart-3',
      'oklch(0.5 0.1 140)'
    )
    document.documentElement.style.setProperty(
      '--chart-4',
      'oklch(0.5 0.1 200)'
    )
    document.documentElement.style.setProperty(
      '--chart-5',
      'oklch(0.5 0.1 260)'
    )
  })

  afterEach(() => {
    for (const [name, value] of previousValues) {
      if (value) {
        document.documentElement.style.setProperty(name, value)
      } else {
        document.documentElement.style.removeProperty(name)
      }
    }
    previousValues.clear()
  })

  it('reads theme chart tokens and cycles them for longer domains', () => {
    const colors = getDashboardChartColors(7)
    expect(colors).toHaveLength(7)
    expect(colors[0]).toBe('oklch(0.5 0.1 20)')
    expect(colors[5]).toBe('oklch(0.5 0.1 20)')
    expect(colors[6]).toBe('oklch(0.5 0.1 80)')
  })
})
