import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateAppointmentModal({ open, onClose, imageSrc }) {
  const navigate = useNavigate();
  if (!open) return null;

  const handleYes = () => {
    // Patient already registered -> go to appointment creation page
    onClose && onClose();
    navigate('/appointments/new');
  };

  const handleNo = () => {
    // Patient not registered -> go to register patient page
    onClose && onClose();
    navigate('/patients/register');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded shadow-lg max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Is patient already registered?</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">Close</button>
        </div>
        <div className="p-6 text-center">
          <p className="mb-6 text-sm text-gray-700">If yes, navigate to Create Appointment page. If no, navigate to Register Patient page.</p>

          <div className="flex items-center justify-center gap-4">
            <button onClick={handleYes} className="px-6 py-3 rounded-full bg-green-500 text-white font-semibold">YES</button>
            <button onClick={handleNo} className="px-6 py-3 rounded-full bg-red-500 text-white font-semibold">NO</button>
          </div>
        </div>
        <div className="p-4 border-t text-center text-xs text-gray-500">
          <div className="mb-2">Or open the example/guide image below</div>
          {imageSrc ? (
            <img src={imageSrc} alt="Create Appointment" className="mx-auto max-h-48 object-contain" />
          ) : (
            <a href="/assets/create-appointment.png" target="_blank" rel="noreferrer" className="text-blue-600 underline">Open image</a>
          )}
        </div>
      </div>
    </div>
  );
}
