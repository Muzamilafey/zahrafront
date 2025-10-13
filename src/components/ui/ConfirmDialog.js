import React from 'react';

export default function ConfirmDialog({ open, title = 'Confirm', message, onConfirm, onCancel, confirmLabel = 'Confirm', cancelLabel = 'Cancel' }){
  if(!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onCancel} />
      <div className="bg-white rounded p-4 z-10 w-full max-w-md">
        <h3 className="font-semibold mb-2">{title}</h3>
        <div className="mb-4 text-sm text-gray-700">{message}</div>
        <div className="flex justify-end gap-2">
          <button className="btn-outline" onClick={onCancel}>{cancelLabel}</button>
          <button className="btn" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
