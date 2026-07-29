import { defineConfig } from 'vitest/config'

export const base = defineConfig({
  test: {
    globals: true,
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.{test,spec}.{ts,tsx}', '**/*.d.ts', '**/types/**', '**/test/**'],
      reporter: ['text', 'html'],
    },
  },
})
