import { useState } from "react";
import axios from "axios";

export default function SymptomsChecker() {
  const [drug, setDrug] = useState("");
  const [patientInput, setPatientInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!drug && !patientInput) return;

    setLoading(true);

    try {
      const res = await axios.post("/api/symptoms/analyze", {
        drug,
        symptomsAndSigns: patientInput
      });

      setResult(res.data);
    } catch (err) {
      setResult({ error: "Unable to fetch analysis" });
    }

    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 rounded-3xl shadow-xl 
                    bg-white/40 backdrop-blur-xl border border-blue-200">

      <h2 className="text-2xl font-bold text-blue-700 mb-4 text-center">
        AI Symptom & Drug Interaction Checker
      </h2>

      {/* Drug Input */}
      <div className="mb-4">
        <label className="font-medium text-blue-900">Drug Name</label>
        <input
          type="text"
          value={drug}
          onChange={(e) => setDrug(e.target.value)}
          placeholder="e.g., amoxicillin"
          className="mt-1 w-full p-3 border rounded-xl bg-white/60 focus:ring-2 
                     focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Symptoms + Signs Input */}
      <div className="mb-4">
        <label className="font-medium text-blue-900">Symptoms & Signs</label>
        <textarea
          rows={4}
          value={patientInput}
          onChange={(e) => setPatientInput(e.target.value)}
          placeholder="e.g., fever, chest pain, shortness of breath, rash..."
          className="mt-1 w-full p-3 border rounded-xl bg-white/60 focus:ring-2 
                     focus:ring-blue-500 outline-none"
        ></textarea>
      </div>

      <button
        onClick={analyze}
        className="w-full bg-blue-600 hover:bg-blue-700 transition-all duration-200 
                   text-white py-3 rounded-xl text-lg font-semibold shadow-md"
      >
        Analyze
      </button>

      {loading && (
        <p className="text-center mt-4 text-blue-700 font-medium">
          Analyzing...
        </p>
      )}

      {/* Results */}
      {result && (
        <div className="mt-6 p-5 rounded-2xl bg-white/70 shadow-inner">
          {result.error && (
            <p className="text-red-600">{result.error}</p>
          )}

          {/* Drug Symptoms */}
          {result.drugSymptoms && (
            <>
              <h3 className="text-blue-800 font-semibold mb-2">
                Drug-Related Symptoms
              </h3>
              <ul className="list-disc ml-5 mb-4">
                {result.drugSymptoms.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </>
          )}

          {/* Symptom Analysis */}
          {result.analysis && (
            <>
              <h3 className="text-blue-800 font-semibold mb-2">
                Symptom-Based Possible Conditions
              </h3>
              <ul className="list-disc ml-5">
                {result.analysis.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
