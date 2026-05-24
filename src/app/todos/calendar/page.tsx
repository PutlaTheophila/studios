import { AppShell } from '@/components/AppShell';
import { QueryProvider } from '@/components/QueryProvider';
import { MasterCalendarClient } from './MasterCalendarClient';

export default function Page() {
  return (
    <QueryProvider>
      <AppShell>
        <MasterCalendarClient />
      </AppShell>
    </QueryProvider>
  );
}
