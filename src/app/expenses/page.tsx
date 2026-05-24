import { AppShell } from '@/components/AppShell';
import { QueryProvider } from '@/components/QueryProvider';
import { ExpensesClient } from './ExpensesClient';

export const dynamic = 'force-dynamic';

export default function ExpensesPage() {
  return (
    <QueryProvider>
      <AppShell>
        <ExpensesClient />
      </AppShell>
    </QueryProvider>
  );
}
