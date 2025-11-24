import React, { useState } from 'react';
import axios from 'axios';
import './SymptomChecker.css'; // Import the styles

const SymptomChecker = () => {
  const [drug, setDrug] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const payload = {
        drug: drug,
        symptomsAndSigns: symptoms
      };

      // Call the backend
      const res = await axios.post("/api/symptoms/analyze", payload);
      
      // LOG DATA AS REQUESTED
      console.log("Backend Response:", res.data);

      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to connect to the analysis server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checker-container">
      <div className="glass-card">
        <div className="card-header">
          <h2>🏥 AI Health Assistant</h2>
          <p>Check drug interactions and analyze symptoms instantly.</p>
        </div>

        <form onSubmit={handleAnalyze} className="checker-form">
          <div className="input-group">
            <label>Medication (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Amoxicillin, Panadol"
              value={drug}
              onChange={(e) => setDrug(e.target.value)}
              className="glass-input"
            />
          </div>

          <div className="input-group">
            <label>Symptoms & Signs</label>
            <textarea
              rows="3"
              placeholder="e.g. fever, chest pain, shortness of breath"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="glass-input"
              required
            />
          </div>

          <button type="submit" className="analyze-btn" disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze Health Data'}
          </button>
        </form>

        {error && <div className="error-msg">{error}</div>}

        {result && (
          <div className="results-grid animate-fade-in">
            {/* Left Column: FDA Drug Data */}
            <div className="result-box blue-tint">
              <h3>💊 FDA Reported Side Effects</h3>
              <p className="subtitle">For: {drug || 'Unknown'}</p>
              
              <div className="list-container">
                {result.drugSymptoms && result.drugSymptoms.length > 0 ? (
                  <ul>
                    {result.drugSymptoms.map((symptom, idx) => (
                      // Handle both string and object returns depending on fallback
                      <li key={idx}>
                        {typeof symptom === 'string' ? symptom : JSON.stringify(symptom)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No data available.</p>
                )}
              </div>
            </div>

            {/* Right Column: Symptom Analysis */}
            <div className="result-box green-tint">
              <h3>🔍 Symptom Analysis</h3>
              <p className="subtitle">Based on your inputs</p>
              
              <div className="list-container">
                {result.analysis && result.analysis.length > 0 ? (
                  // RapidAPI responses vary wildly, usually an array of objects or strings
                  <ul>
                    {Array.isArray(result.analysis) ? (
                      result.analysis.map((item, idx) => (
                        <li key={idx}>
                          {/* Intelligent rendering based on return type */}
                          {typeof item === 'string' 
                            ? item 
                            : (item.Condition || item.Name || item.label || JSON.stringify(item))}
                        </li>
                      ))
                    ) : (
                      <li>{JSON.stringify(result.analysis)}</li>
                    )}
                  </ul>
                ) : (
                  <p>No analysis generated.</p>
                )}
              </div>
            </div>
            
            {result.error && (
              <div className="footer-error">
                <small>Note: {result.error}</small>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SymptomChecker;