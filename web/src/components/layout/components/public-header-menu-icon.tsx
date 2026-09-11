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
type PublicHeaderMenuIconProps = {
  className?: string
}

export function PublicHeaderMenuIcon(props: PublicHeaderMenuIconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      aria-hidden
      className={props.className}
      fill='none'
    >
      <path
        fill='currentColor'
        d='M20 17a1 1 0 1 1 0 2H4a1 1 0 1 1 0-2zm0-6a1 1 0 1 1 0 2H4a1 1 0 1 1 0-2zm0-6a1 1 0 1 1 0 2H4a1 1 0 0 1 0-2z'
      />
    </svg>
  )
}

export function PublicHeaderNavChevron(props: { className?: string }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 16 17'
      aria-hidden
      className={props.className}
      fill='none'
    >
      <path
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.5'
        d='m4 10.5 4-4 4 4'
      />
    </svg>
  )
}

export function PublicHeaderGlobeIcon(props: { className?: string }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      aria-hidden
      className={props.className}
      fill='none'
    >
      <path
        fill='currentColor'
        d='M12 1c6.075 0 11 4.925 11 11s-4.925 11-11 11S1 18.075 1 12 5.925 1 12 1M3.057 13a9.005 9.005 0 0 0 6.612 7.693A15.47 15.47 0 0 1 7.04 13zm13.903 0a15.47 15.47 0 0 1-2.63 7.693A9.005 9.005 0 0 0 20.943 13zm-7.912 0A13.46 13.46 0 0 0 12 20.482 13.46 13.46 0 0 0 14.952 13zm5.282-9.694A15.47 15.47 0 0 1 16.96 11h3.983a9.01 9.01 0 0 0-6.613-7.694m-2.33.21A13.46 13.46 0 0 0 9.048 11h5.904A13.46 13.46 0 0 0 12 3.517m-2.331-.21A9.01 9.01 0 0 0 3.057 11H7.04a15.47 15.47 0 0 1 2.629-7.694'
      />
    </svg>
  )
}
