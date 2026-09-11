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
import { describe, expect, test } from 'vitest'

import {
  CHANNEL_FORM_DEFAULT_VALUES,
  transformFormDataToCreatePayload,
  transformFormDataToUpdatePayload,
} from '../channel-form'
import { isAdvancedSettingsField } from '../channel-form-errors'

describe('channel form removed routing leftovers', () => {
  test('create payload does not send removed channel routing fields', () => {
    const payload = transformFormDataToCreatePayload({
      ...CHANNEL_FORM_DEFAULT_VALUES,
      name: 'prod',
      key: 'sk-test',
      models: 'gpt-4',
    })

    expect(payload.channel).not.toHaveProperty('priority')
    expect(payload.channel).not.toHaveProperty('weight')
    expect(payload.channel).not.toHaveProperty('test_model')
    expect(payload.channel).not.toHaveProperty('auto_ban')
  })

  test('update payload does not send removed channel routing fields', () => {
    const payload = transformFormDataToUpdatePayload(
      {
        ...CHANNEL_FORM_DEFAULT_VALUES,
        name: 'prod',
        models: 'gpt-4',
      },
      12
    )

    expect(payload).not.toHaveProperty('priority')
    expect(payload).not.toHaveProperty('weight')
    expect(payload).not.toHaveProperty('test_model')
    expect(payload).not.toHaveProperty('auto_ban')
  })

  test('removed routing fields are not advanced settings fields', () => {
    expect(isAdvancedSettingsField('test_model')).toBe(false)
    expect(isAdvancedSettingsField('auto_ban')).toBe(false)
    expect(isAdvancedSettingsField('priority')).toBe(false)
    expect(isAdvancedSettingsField('weight')).toBe(false)
  })
})
