import { useState } from 'react';
import { supabase } from './supabaseClient';

const styles = {
  page: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: 24,
    background: '#f2e8cf',
  },
  panel: {
    width: '100%',
    maxWidth: 380,
    background: '#fff',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 8,
    padding: 24,
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
  },
  title: { margin: '0 0 6px', color: '#263d2d', fontSize: 28 },
  subtitle: { margin: '0 0 22px', color: '#58635b', fontSize: 15, lineHeight: 1.4 },
  form: { display: 'grid', gap: 14 },
  label: { display: 'grid', gap: 6, color: '#263d2d', fontWeight: 600, fontSize: 14 },
  input: {
    width: '100%',
    border: '1px solid #ccd5ae',
    borderRadius: 6,
    padding: '10px 12px',
    fontSize: 15,
  },
  button: {
    border: 0,
    borderRadius: 6,
    padding: '11px 14px',
    background: '#386641',
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
  secondaryButton: {
    border: 0,
    background: 'transparent',
    color: '#386641',
    fontWeight: 700,
    cursor: 'pointer',
    padding: 0,
  },
  message: { margin: '10px 0 0', color: '#58635b', fontSize: 14, lineHeight: 1.4 },
  error: { margin: '10px 0 0', color: '#bc4749', fontSize: 14, lineHeight: 1.4 },
};

export default function Auth() {
  const [mode, setMode] = useState('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isSignUp = mode === 'sign-up';

  const submit = async (event) => {
    event.preventDefault();
    setStatus('loading');
    setMessage('');
    setError('');

    const authCall = isSignUp
      ? supabase.auth.signUp({ email, password })
      : supabase.auth.signInWithPassword({ email, password });

    const { error: authError } = await authCall;

    if (authError) {
      setError(authError.message);
    } else if (isSignUp) {
      setMessage('Check your email to confirm your account, then sign in.');
      setMode('sign-in');
    }

    setStatus('idle');
  };

  return (
    <div style={styles.page}>
      <section style={styles.panel}>
        <h1 style={styles.title}>Mi Clase</h1>
        <p style={styles.subtitle}>
          {isSignUp ? 'Create your account to start tracking Spanish class notes.' : 'Sign in to your Spanish class notebook.'}
        </p>

        <form onSubmit={submit} style={styles.form}>
          <label style={styles.label}>
            Email
            <input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              autoComplete="email"
              required
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            Password
            <input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              minLength={6}
              required
              style={styles.input}
            />
          </label>
          <button type="submit" disabled={status === 'loading'} style={styles.button}>
            {status === 'loading' ? 'Working...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        {message && <p style={styles.message}>{message}</p>}
        {error && <p style={styles.error}>{error}</p>}

        <p style={styles.message}>
          {isSignUp ? 'Already have an account?' : 'Need an account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(isSignUp ? 'sign-in' : 'sign-up');
              setMessage('');
              setError('');
            }}
            style={styles.secondaryButton}
          >
            {isSignUp ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </section>
    </div>
  );
}
