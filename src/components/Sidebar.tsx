'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { IconShirt, IconCalendar, IconSparkles, IconUser, IconCheckSquare, IconClose, IconGrid, IconDollar } from './Icons';

const NAV = [
  { section: 'Brand Work', items: [{ href: '/sourcing', label: 'Sourcing Board', Icon: IconShirt }] },
  { section: 'Content',    items: [
    { href: '/calendar', label: 'Content Calendar', Icon: IconCalendar },
    { href: '/events',   label: 'Events', Icon: IconSparkles }
  ]},
  { section: 'Productivity', items: [
    { href: '/todos', label: 'Tasks', Icon: IconCheckSquare },
    { href: '/todos/calendar', label: 'Master Calendar', Icon: IconGrid }
  ]},
  { section: 'Finance', items: [{ href: '/expenses', label: 'Expenses', Icon: IconDollar }] },
  { section: 'Network',    items: [{ href: '/contacts', label: 'Contacts', Icon: IconUser }] }
];

function initials(name: string | null | undefined, email: string | null | undefined) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map(p => p[0]?.toUpperCase() || '').join('') || '·';
  }
  if (email) return email[0]?.toUpperCase() || '·';
  return '·';
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string | null; email: string | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      if (data.user) {
        setUser({
          name: (data.user.user_metadata as any)?.name || null,
          email: data.user.email || null,
        });
      }
    });
    return () => { cancelled = true; };
  }, []);

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <aside className="sidebar">
      <div className="sb-logo">
        <div className="sb-mark">Studio OS</div>
        <div className="sb-tagline">Creator Operations</div>
      </div>
      <nav className="sb-nav">
        {NAV.map(group => (
          <div key={group.section}>
            <div className="sb-section">{group.section}</div>
            {group.items.map(item => {
              const isActive = pathname === item.href
                || (item.href !== '/todos' && pathname?.startsWith(item.href + '/'))
                || (item.href === '/todos' && pathname === '/todos');
              return (
              <Link
                key={item.href}
                href={item.href}
                className={`sb-link ${isActive ? 'active' : ''}`}
              >
                <span className="sb-icon"><item.Icon size={16} /></span>
                {item.label}
              </Link>
            );})}
          </div>
        ))}
      </nav>
      <div className="sb-footer">
        <div className="sb-user">
          <div className="sb-avatar" aria-hidden>{initials(user?.name, user?.email)}</div>
          <div className="sb-user-meta">
            <div className="sb-user-name">{user?.name || user?.email || 'Workspace'}</div>
            <div className="sb-user-action">Studio OS · MVP</div>
          </div>
          <button onClick={signOut} className="sb-signout" aria-label="Sign out" title="Sign out">
            <IconClose size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}
