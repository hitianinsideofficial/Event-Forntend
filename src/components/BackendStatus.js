'use client';

import { useState, useEffect } from 'react';
import { checkBackendHealth } from '../services/api';

export default function BackendStatus() {
  const [status, setStatus] = useState({ loading: true, online: false, message: 'Checking...' });

  const verifyHealth = async () => {
    setStatus(prev => ({ ...prev, loading: true }));
    const res = await checkBackendHealth();
    if (res.online) {
      setStatus({ loading: false, online: true, message: 'Backend Connected' });
    } else {
      setStatus({ loading: false, online: false, message: 'Backend Offline' });
    }
  };

  useEffect(() => {
    verifyHealth();
    const interval = setInterval(verifyHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800 backdrop-blur-md text-xs font-medium">
      <span className={`pulse-dot ${status.online ? 'online' : 'offline'}`} />
      <span className={status.online ? 'text-emerald-400' : 'text-rose-400'}>
        {status.message}
      </span>
      <button 
        onClick={verifyHealth} 
        className="ml-1 text-slate-400 hover:text-white transition-colors"
        title="Retry connection"
      >
        ↻
      </button>
    </div>
  );
}
