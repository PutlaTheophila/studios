// Shared formatting utilities used across the UI.

export function formatDate(d: string | null | undefined): string {
  if (!d) return '';
  try {
    const [y, m, day] = d.split('-');
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${parseInt(day)} ${monthNames[parseInt(m) - 1]} ${y}`;
  } catch { return d; }
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export function isOverdue(returnDate: string | null, status: string): boolean {
  if (!returnDate) return false;
  if (status === 'Returned') return false;
  return returnDate < todayISO();
}

export function stars(n: number): string {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}
