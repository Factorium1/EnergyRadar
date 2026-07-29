import { resolve } from 'node:path'
import reactPlugin from '@vitejs/plugin-react'
import { defineConfig, mergeConfig } from 'vitest/config'
import { base } from '@energyradar/vitest-config/base'

export const react = mergeConfig(
  base,
  defineConfig({
    plugins: [reactPlugin()],
    resolve: {
      // Mirrors the "@/*": ["./src/*"] mapping in the app tsconfigs. Keep both in sync
      // when you change the alias. process.cwd() is the app being tested, which is also
      // what vite uses as its default root.
      alias: {
        '@/': `${resolve(process.cwd(), 'src')}/`,
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['@energyradar/vitest-config/setup-react'],
    },
  }),
)
