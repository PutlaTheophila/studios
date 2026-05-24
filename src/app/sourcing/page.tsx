import { AppShell } from '@/components/AppShell';
import { QueryProvider } from '@/components/QueryProvider';
import { SourcingClient } from './SourcingClient';

export const dynamic = 'force-dynamic';

export default function SourcingPage() {
  return (
    <QueryProvider>
      <AppShell>
        <SourcingClient />
      </AppShell>
    </QueryProvider>
  );
}
