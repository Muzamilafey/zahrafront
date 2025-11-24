import React from 'react';

export default function CreateAppointmentModal({ open, onClose, imageSrc }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded shadow-lg max-w-3xl w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Create Appointment</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">Close</button>
        </div>
        <div className="p-4">
          {imageSrc ? (
            <img src={imageSrc} alt="Create Appointment" className="w-full h-auto object-contain" />
          ) : (
            <div className="p-6 text-center">
              <p className="mb-4">Appointment image not found. Please place the reference image at <code>/public/assets/create-appointment.png</code>.</p>
              <a href="/assets/create-appointment.png" target="_blank" rel="noreferrer" className="inline-block px-4 py-2 bg-blue-600 text-white rounded">Open image</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
