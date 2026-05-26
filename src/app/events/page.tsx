import { AppShell } from '@/components/AppShell';
import { EventsClient } from './EventsClient';

export const dynamic = 'force-dynamic';

export default function EventsPage() {
  return (
    <AppShell>
      <EventsClient />
    </AppShell>
  );
}
