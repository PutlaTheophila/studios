import { AppShell } from '@/components/AppShell';
import { TodoClient } from './TodoClient';

export default function TodoPage() {
  return (
    <AppShell>
      <TodoClient />
    </AppShell>
  );
}
