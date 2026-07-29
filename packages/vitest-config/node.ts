import { defineConfig, mergeConfig } from 'vitest/config'
import { base } from '@energyradar/vitest-config/base'

export const node = mergeConfig(
  base,
  defineConfig({
    test: {
      environment: 'node',
    },
  }),
)
