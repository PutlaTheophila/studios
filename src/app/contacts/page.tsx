import { AppShell } from '@/components/AppShell';
import { QueryProvider } from '@/components/QueryProvider';
import { ContactsClient } from './ContactsClient';

export const dynamic = 'force-dynamic';

export default function ContactsPage() {
  return (
    <QueryProvider>
      <AppShell>
        <ContactsClient />
      </AppShell>
    </QueryProvider>
  );
}
