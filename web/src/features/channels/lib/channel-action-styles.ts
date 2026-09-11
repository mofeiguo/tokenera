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

/** Quiet toolbar icon — edit, more, bulk neutral actions. */
export const CHANNEL_ACTION_NEUTRAL =
  'text-muted-foreground hover:bg-muted/70 hover:text-foreground'

/** Run / probe — slightly emphasized without full primary fill. */
export const CHANNEL_ACTION_TEST =
  'text-muted-foreground hover:bg-primary/10 hover:text-primary'

/** Disable an enabled channel — semantic, softened at rest. */
export const CHANNEL_ACTION_DISABLE =
  'text-destructive/75 hover:bg-destructive/10 hover:text-destructive'

/** Enable a disabled channel — semantic, softened at rest. */
export const CHANNEL_ACTION_ENABLE =
  'text-success/80 hover:bg-success/10 hover:text-success'
