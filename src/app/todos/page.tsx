import { AppShell } from '@/components/AppShell';
import { QueryProvider } from '@/components/QueryProvider';
import { TodoClient } from './TodoClient';

export default function TodoPage() {
  return (
    <QueryProvider>
      <AppShell>
        <TodoClient />
      </AppShell>
    </QueryProvider>
  );
}
