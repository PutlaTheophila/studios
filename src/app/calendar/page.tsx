import { AppShell } from '@/components/AppShell';
import { QueryProvider } from '@/components/QueryProvider';
import { CalendarClient } from './CalendarClient';

export const dynamic = 'force-dynamic';

export default function CalendarPage() {
  return (
    <QueryProvider>
      <AppShell>
        <CalendarClient />
      </AppShell>
    </QueryProvider>
  );
}
