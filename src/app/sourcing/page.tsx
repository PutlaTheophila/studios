import { AppShell } from '@/components/AppShell';
import { SourcingClient } from './SourcingClient';

export const dynamic = 'force-dynamic';

export default function SourcingPage() {
  return (
    <AppShell>
      <SourcingClient />
    </AppShell>
  );
}
