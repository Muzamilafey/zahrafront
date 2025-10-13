import React, { useEffect, useState } from 'react';

export default function ThemeToggle({ className }) {
  const [dark, setDark] = useState(() => {
    try { const s = localStorage.getItem('theme'); if (s) return s === 'dark'; } catch(e){}
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch(e){}
    if (dark) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
  }, [dark]);

  return (
    <button
      aria-pressed={dark}
      onClick={() => setDark(d => !d)}
      className={"flex items-center gap-2 px-3 py-1 rounded " + (className||'')}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div style={{ width: 48, height: 28, borderRadius: 9999, padding: 3, background: dark ? '#1f2937' : '#e6f0ff', position: 'relative' }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: dark ? 23 : 3, transition: 'left .2s ease' }} />
      </div>
      <div className="text-sm text-gray-600">{dark ? 'Dark' : 'Light'}</div>
    </button>
  );
}
