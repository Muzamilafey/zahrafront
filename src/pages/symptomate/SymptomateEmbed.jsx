import React from 'react';
import { useNavigate } from 'react-router-dom';

const SYMPTOMATE_URL = 'https://symptomate.com/survey/new-survey/en';

export default function SymptomateEmbed() {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Symptomate — Symptom Checker</h1>
          <p className="text-sm text-gray-600">Embedded Symptomate survey. You can use the embedded survey below or open it in a new tab.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.open(SYMPTOMATE_URL, '_blank')} className="btn-modern-outline">Open in new tab</button>
          <button onClick={() => navigate(-1)} className="btn-modern-outline">Back</button>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden" style={{height: '80vh'}}>
        <iframe
          title="Symptomate Survey"
          src={SYMPTOMATE_URL}
          width="100%"
          height="100%"
          style={{ border: 'none' }}
          sandbox="allow-forms allow-same-origin allow-scripts allow-popups allow-modals"
        />
      </div>
    </div>
  );
}
