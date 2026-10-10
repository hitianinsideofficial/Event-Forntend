'use client';

import { useState, useEffect } from 'react';
import { checkBackendHealth } from '../services/api.service';

export default function BackendStatus() {
  const [status, setStatus] = useState<{ loading: boolean; online: boolean; message: string }>({
    loading: true,
    online: false,
    message: 'Checking...'
  });

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
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#180509]/80 border border-[#f7f1e5]/10 text-xs font-medium backdrop-blur-md">
      <span className={`pulse-dot ${status.online ? 'online' : 'offline'}`} />
      <span className={status.online ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
        {status.message}
      </span>
      <button 
        onClick={verifyHealth} 
        className="ml-1 text-[#a69181] hover:text-white transition-colors"
        title="Retry connection"
      >
        ↻
      </button>
    </div>
  );
}
