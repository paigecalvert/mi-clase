import React from 'react';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import MyClasses from './pages/MyClasses';
import MyVocabulary from './pages/MyVocabulary';
import MyHomework from './pages/MyHomework';

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
  main: { maxWidth: 900, margin: '0 auto', padding: '24px 16px' },
};

export default function App() {
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
      </header>
      <main style={styles.main}>
        <Routes>
          <Route path="/" element={<Navigate to="/classes" replace />} />
          <Route path="/classes" element={<MyClasses />} />
          <Route path="/vocabulary" element={<MyVocabulary />} />
          <Route path="/homework" element={<MyHomework />} />
        </Routes>
      </main>
    </>
  );
}
