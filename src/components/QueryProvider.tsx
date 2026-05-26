'use client';

import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ToastViewport } from './Toast';
import { ConfirmHost } from './Confirm';

function Prefetcher() {
  useQuery({ queryKey: ['sourcing'], queryFn: () => fetch('/api/sourcing').then(r => r.json()), staleTime: 5 * 60 * 1000 });
  useQuery({ queryKey: ['contacts'], queryFn: () => fetch('/api/contacts').then(r => r.json()), staleTime: 5 * 60 * 1000 });
  useQuery({ queryKey: ['events'], queryFn: () => fetch('/api/events').then(r => r.json()), staleTime: 5 * 60 * 1000 });
  useQuery({ queryKey: ['expenses'], queryFn: () => fetch('/api/expenses').then(r => r.json()), staleTime: 5 * 60 * 1000 });
  useQuery({ queryKey: ['content'], queryFn: () => fetch('/api/content').then(r => r.json()), staleTime: 5 * 60 * 1000 });
  return null;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: 1,
      }
    }
  }));
  return (
    <QueryClientProvider client={client}>
      <Prefetcher />
      {children}
      <ToastViewport />
      <ConfirmHost />
    </QueryClientProvider>
  );
}
