import { useEffect, useState } from 'react';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './Auth';
import MyClasses from './pages/MyClasses';
import MyVocabulary from './pages/MyVocabulary';
import MyHomework from './pages/MyHomework';
import MyQuizzes from './pages/MyQuizzes';
import { supabase } from './supabaseClient';

const styles = {
  header: {
    background: '#386641',
    color: '#fff',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    gap: 32,
    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
  },
  title: { margin: '0 24px 0 0', fontSize: 22, fontWeight: 700, padding: '16px 0' },
  nav: { display: 'flex', gap: 4 },
  navLink: {
    color: 'rgba(255,255,255,0.75)',
    textDecoration: 'none',
    padding: '18px 16px',
    fontSize: 15,
    borderBottom: '3px solid transparent',
    display: 'inline-block',
  },
  navLinkActive: {
    color: '#fff',
    borderBottom: '3px solid #a7c957',
  },
  userControls: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 13,
    color: 'rgba(255,255,255,0.84)',
  },
  signOutButton: {
    background: 'rgba(255,255,255,0.15)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.4)',
    borderRadius: 4,
    padding: '6px 12px',
    fontSize: 13,
    cursor: 'pointer',
  },
  main: { maxWidth: 900, margin: '0 auto', padding: '24px 16px' },
};

export default function App() {
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoadingSession(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoadingSession(false);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  if (loadingSession) {
    return null;
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <>
      <header style={styles.header}>
        <span style={styles.title}>
          <img src="/logo.svg" alt="" style={{ width: 28, height: 28, marginRight: 8, verticalAlign: 'middle', filter: 'brightness(0) invert(1)' }} />
          Mi Clase
        </span>
        <nav style={styles.nav}>
          {[
            { to: '/classes', label: 'My Classes' },
            { to: '/vocabulary', label: 'My Vocabulary' },
            { to: '/homework', label: 'My Homework' },
            { to: '/quizzes', label: 'My Quizzes' },
          ].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive ? styles.navLinkActive : {}),
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div style={styles.userControls}>
          <span>{session.user.email}</span>
          <button type="button" onClick={() => supabase.auth.signOut()} style={styles.signOutButton}>
            Sign Out
          </button>
        </div>
      </header>
      <main style={styles.main}>
        <Routes>
          <Route path="/" element={<Navigate to="/classes" replace />} />
          <Route path="/classes" element={<MyClasses />} />
          <Route path="/vocabulary" element={<MyVocabulary />} />
          <Route path="/homework" element={<MyHomework />} />
          <Route path="/quizzes" element={<MyQuizzes />} />
        </Routes>
      </main>
    </>
  );
}
