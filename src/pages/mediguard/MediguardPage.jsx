import React, { useState } from 'react';
import axios from 'axios';
import SymptomInput from '../../components/Mediguard/SymptomInput';
import ResultCard from '../../components/Mediguard/ResultCard';

export default function MediguardPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async (text, imageFile) => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const form = new FormData();
      form.append('symptomsAndSigns', text || '');
      form.append('drug', '');
      if (imageFile) form.append('image', imageFile);

      const res = await axios.post('/api/symptoms/analyze', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const data = res.data || {};

      // Normalize to the ResultCard expected shape if AI returned structured data
      let normalized = {
        conditionName: 'Unknown',
        severity: 'Low',
        isEmergency: false,
        explanation: '',
        suggestedMedications: [],
        immediateActions: [],
        recoveryTimelineDays: 5
      };

      // If backend returned structured fields from genai
      if (data.conditionName || data.explanation) {
        normalized = {
          conditionName: data.conditionName || normalized.conditionName,
          severity: data.severity || normalized.severity,
          isEmergency: !!data.isEmergency,
          explanation: data.explanation || JSON.stringify(data.analysis || data),
          suggestedMedications: data.suggestedMedications || [],
          immediateActions: data.immediateActions || [],
          recoveryTimelineDays: data.recoveryTimelineDays || normalized.recoveryTimelineDays
        };
      } else if (Array.isArray(data.analysis)) {
        normalized.explanation = (data.analysis || []).join('\n');
        // add drugSymptoms as suggested meds hint
        if (Array.isArray(data.drugSymptoms)) normalized.suggestedMedications = data.drugSymptoms.slice(0, 5);
      } else {
        normalized.explanation = JSON.stringify(data.analysis || data);
      }

      setResult(normalized);
    } catch (err) {
      console.error(err);
      setError('Failed to analyze. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        <SymptomInput onAnalyze={handleAnalyze} isLoading={loading} />

        {error && <div className="mt-4 text-red-600">{error}</div>}

        {result && (
          <div className="mt-6">
            <ResultCard result={result} />
          </div>
        )}
      </div>
    </div>
  );
}
