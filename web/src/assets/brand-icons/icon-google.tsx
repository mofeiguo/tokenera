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
import type { SVGProps } from 'react'

import { cn } from '@/lib/utils'

export function IconGoogle({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role='img'
      viewBox='0 0 16 16'
      xmlns='http://www.w3.org/2000/svg'
      width='16'
      height='16'
      className={cn(className)}
      fill='none'
      {...props}
    >
      <title>Google</title>
      <path
        d='M7.99976 6.54541V9.6436H12.3052C12.1161 10.64 11.5488 11.4836 10.6979 12.0509L13.2943 14.0655C14.807 12.6691 15.6797 10.6182 15.6797 8.18185C15.6797 7.61459 15.6288 7.06908 15.5342 6.5455L7.99976 6.54541Z'
        fill='#4285F4'
      />
      <path
        d='M3.51649 9.52271L2.93092 9.97096L0.858154 11.5855C2.17451 14.1964 4.8725 16 7.99974 16C10.1597 16 11.9706 15.2873 13.2942 14.0655L10.6979 12.0509C9.98516 12.5309 9.07606 12.8219 7.99974 12.8219C5.91976 12.8219 4.15254 11.4183 3.51976 9.52732L3.51649 9.52271Z'
        fill='#34A853'
      />
      <path
        d='M0.858119 4.41455C0.312695 5.49087 0 6.70543 0 7.99996C0 9.29448 0.312695 10.509 0.858119 11.5854C0.858119 11.5926 3.51998 9.51991 3.51998 9.51991C3.35998 9.03991 3.26541 8.53085 3.26541 7.99987C3.26541 7.46889 3.35998 6.95984 3.51998 6.47984L0.858119 4.41455Z'
        fill='#FBBC05'
      />
      <path
        d='M7.99991 3.18545C9.17811 3.18545 10.2254 3.59271 11.0617 4.37818L13.3526 2.0873C11.9635 0.792777 10.1599 0 7.99991 0C4.87266 0 2.17451 1.79636 0.858154 4.41455L3.51994 6.48001C4.15263 4.58908 5.91992 3.18545 7.99991 3.18545Z'
        fill='#EA4335'
      />
    </svg>
  )
}
