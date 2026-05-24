'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    const supabase = createSupabaseBrowserClient();

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name, workspace_name: `${name}'s workspace` } }
        });
        if (error) throw error;
        if (!data.session) {
          setInfo('Check your email to confirm your account, then sign in.');
          setMode('signin');
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.push('/sourcing');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 3, background: 'var(--acc)' }} />
          <span style={{ fontFamily: 'var(--fb)', fontSize: 10, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 700 }}>Creator Operations</span>
        </div>
        <div className="auth-title">Studio OS</div>
        <div className="auth-sub">{mode === 'signin' ? 'Sign in to your workspace' : 'Set up your creator workspace in seconds'}</div>
        <form onSubmit={handle}>
          {mode === 'signup' && (
            <div className="form-row">
              <label>Your Name</label>
              <input value={name} onChange={e => setName(e.target.value)} required />
            </div>
          )}
          <div className="form-row">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-row">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>
          {error && (
            <div style={{ background: 'rgba(184,50,50,0.08)', color: 'var(--red)', padding: '8px 12px', borderRadius: 7, fontSize: 12, marginBottom: 12 }}>
              {error}
            </div>
          )}
          {info && (
            <div style={{ background: 'rgba(50,120,184,0.08)', color: 'var(--acc)', padding: '8px 12px', borderRadius: 7, fontSize: 12, marginBottom: 12 }}>
              {info}
            </div>
          )}
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
            {loading ? 'Loading...' : (mode === 'signin' ? 'Sign In' : 'Create Workspace')}
          </button>
        </form>
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--bdr)', fontSize: 12, color: 'var(--tx3)', textAlign: 'center' }}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have one? '}
          <button
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            style={{ background: 'none', border: 'none', color: 'var(--acc)', cursor: 'pointer', fontWeight: 600 }}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
