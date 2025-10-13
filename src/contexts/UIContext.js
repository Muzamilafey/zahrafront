import React, { createContext, useContext, useState, useCallback } from 'react';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Toast from '../components/ui/Toast';

const UIContext = createContext(null);

export const UIProvider = ({ children }) => {
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((opts) => {
    setToast({ message: opts.message || '', type: opts.type || 'success', duration: opts.duration || 3000 });
  }, []);

  const confirmAsync = useCallback((title, message) => {
    return new Promise((resolve) => {
      setConfirm({ open: true, title, message, onConfirm: () => { setConfirm(null); resolve(true); }, onCancel: () => { setConfirm(null); resolve(false); } });
    });
  }, []);

  return (
    <UIContext.Provider value={{ showToast, confirmAsync }}>
      {children}
      <ConfirmDialog open={!!confirm} title={confirm?.title} message={confirm?.message} onConfirm={confirm?.onConfirm} onCancel={confirm?.onCancel} />
      <Toast toast={toast} onClose={()=>setToast(null)} />
    </UIContext.Provider>
  );
};

export const useUI = () => {
  return useContext(UIContext);
};

export default UIContext;
