import React, { useEffect, useState } from 'react';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import MyClasses from './pages/MyClasses';
import MyVocabulary from './pages/MyVocabulary';
import MyHomework from './pages/MyHomework';
import MyQuizzes from './pages/MyQuizzes';

const bannerStyles = {
  update: {
    background: '#386641', color: '#fff',
    padding: '10px 24px', fontSize: 14, textAlign: 'center',
  },
  expired: {
    background: '#bc4749', color: '#fff',
    padding: '10px 24px', fontSize: 14, textAlign: 'center',
  },
  expiring: {
    background: '#e9c46a', color: '#333',
    padding: '10px 24px', fontSize: 14, textAlign: 'center',
  },
};

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
  bundleButton: {
    marginLeft: 'auto',
    background: 'rgba(255,255,255,0.15)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.4)',
    borderRadius: 4,
    padding: '6px 14px',
    fontSize: 13,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  main: { maxWidth: 900, margin: '0 auto', padding: '24px 16px' },
};

export default function App() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [licenseState, setLicenseState] = useState(null); // null | 'expired' | 'expiring-soon'
  const [bundleState, setBundleState] = useState('idle'); // idle | loading | success | error

  const generateBundle = async () => {
    setBundleState('loading');
    try {
      const res = await fetch('/api/support-bundle', { method: 'POST' });
      if (!res.ok) throw new Error('Request failed');
      setBundleState('success');
    } catch {
      setBundleState('error');
    } finally {
      setTimeout(() => setBundleState('idle'), 4000);
    }
  };

  useEffect(() => {
    fetch('/api/updates')
      .then(r => r.json())
      .then(data => {
        const updates = Array.isArray(data) ? data : (data?.updates ?? []);
        if (updates.length > 0) setUpdateAvailable(true);
      })
      .catch(() => {});

    fetch('/api/license')
      .then(r => r.json())
      .then(info => {
        if (!info?.expires_at) return;
        const expiresAt = new Date(info.expires_at);
        const now = new Date();
        if (expiresAt < now) {
          setLicenseState('expired');
        } else if ((expiresAt - now) < 30 * 24 * 60 * 60 * 1000) {
          setLicenseState('expiring-soon');
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      {updateAvailable && (
        <div style={bannerStyles.update}>
          A new version of Mi Clase is available. Contact your administrator to upgrade.
        </div>
      )}
      {licenseState === 'expired' && (
        <div style={bannerStyles.expired}>
          Your license has expired. Some features may be unavailable. Please renew your license.
        </div>
      )}
      {licenseState === 'expiring-soon' && (
        <div style={bannerStyles.expiring}>
          Your license is expiring soon. Please renew to avoid interruption.
        </div>
      )}
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
        <button
          onClick={generateBundle}
          disabled={bundleState === 'loading'}
          style={styles.bundleButton}
        >
          {bundleState === 'loading' ? 'Generating...' :
           bundleState === 'success' ? 'Bundle Sent!' :
           bundleState === 'error'   ? 'Failed — Retry?' :
           'Generate Support Bundle'}
        </button>
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
