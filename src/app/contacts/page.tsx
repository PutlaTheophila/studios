import { AppShell } from '@/components/AppShell';
import { ContactsClient } from './ContactsClient';

export const dynamic = 'force-dynamic';

export default function ContactsPage() {
  return (
    <AppShell>
      <ContactsClient />
    </AppShell>
  );
}
