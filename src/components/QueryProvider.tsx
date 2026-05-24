'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ToastViewport } from './Toast';
import { ConfirmHost } from './Confirm';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30 * 1000, refetchOnWindowFocus: false }
    }
  }));
  return (
    <QueryClientProvider client={client}>
      {children}
      <ToastViewport />
      <ConfirmHost />
    </QueryClientProvider>
  );
}
