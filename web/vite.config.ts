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
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const serverUrl =
    process.env.VITE_REACT_APP_SERVER_URL ||
    env.VITE_REACT_APP_SERVER_URL ||
    'http://localhost:3000'

  const isProd = mode === 'production'
  const proxy = Object.fromEntries(
    (['/api', '/mj', '/pg'] as const).map((key) => [
      key,
      {
        target: serverUrl,
        changeOrigin: true,
      },
    ])
  )

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      strictPort: false,
      proxy,
    },
    preview: {
      host: '0.0.0.0',
      proxy,
    },
    build: {
      outDir: 'dist',
      minify: isProd,
      // Emit bundled dependency licenses for OSS distribution compliance.
      license: true,
      rolldownOptions: {
        output: {
          comments: true,
          codeSplitting: {
            groups: [
              {
                name: 'vendor-react',
                test: /[\\/]node_modules[\\/](?:react|react-dom)[\\/]/,
              },
              {
                name: 'vendor-ui-primitives',
                test: /[\\/]node_modules[\\/](?:@base-ui|@radix-ui)[\\/]/,
              },
              {
                name: 'vendor-tanstack',
                test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
              },
              {
                name: 'vendor-react-router',
                test: /[\\/]node_modules[\\/]react-router[\\/]/,
              },
              {
                name: 'vendor-swr',
                test: /[\\/]node_modules[\\/]swr[\\/]/,
              },
            ],
          },
        },
      },
    },
  }
})
