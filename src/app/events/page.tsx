import { AppShell } from '@/components/AppShell';
import { QueryProvider } from '@/components/QueryProvider';
import { EventsClient } from './EventsClient';

export const dynamic = 'force-dynamic';

export default function EventsPage() {
  return (
    <QueryProvider>
      <AppShell>
        <EventsClient />
      </AppShell>
    </QueryProvider>
  );
}
