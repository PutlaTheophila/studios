import { AppShell } from '@/components/AppShell';
import { CalendarClient } from './CalendarClient';

export const dynamic = 'force-dynamic';

export default function CalendarPage() {
  return (
    <AppShell>
      <CalendarClient />
    </AppShell>
  );
}
