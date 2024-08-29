'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

import { eden } from '@/lib/eden'

type LayoutProps = {
  /**
   * The children for a layout component will be the default-exported component in a `page.tsx` file.
   */
  children?: React.ReactNode
}

/**
 * Client-side only providers.
 */
export function ClientProviders(props: LayoutProps) {
  const [queryClient] = useState(() => new QueryClient())
  const [edenClient] = useState(() => eden.createHttpClient())

  return (
    <eden.Provider client={edenClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
    </eden.Provider>
  )
}
