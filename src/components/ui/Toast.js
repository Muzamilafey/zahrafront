import React, { useEffect } from 'react';

export default function Toast({ toast, onClose }){
  // Always call hooks in the same order — guard inside the effect instead of returning early
  useEffect(()=>{
    if (!toast) return;
    const t = setTimeout(()=> onClose && onClose(), toast.duration || 3000);
    return ()=> clearTimeout(t);
  }, [toast, onClose]);

  if(!toast) return null;
  return (
    <div className="fixed right-4 bottom-4 z-50">
      <div className={`px-4 py-2 rounded shadow ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
        {toast.message}
      </div>
    </div>
  );
}
