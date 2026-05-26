import { AppShell } from '@/components/AppShell';
import { ExpensesClient } from './ExpensesClient';

export const dynamic = 'force-dynamic';

export default function ExpensesPage() {
  return (
    <AppShell>
      <ExpensesClient />
    </AppShell>
  );
}
