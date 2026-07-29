import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render as rtlRender, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

// Mirrors the providers in src/main.tsx. The router is not in here: components that
// need one should set up their own memory router in the test, so each test controls
// the route it renders at.
function Providers({ children }: { children: ReactNode }) {
  // A fresh client per render keeps cached queries from leaking between tests.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

export function render(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return rtlRender(ui, { wrapper: Providers, ...options })
}
