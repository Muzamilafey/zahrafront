import { useState } from "react";
import axios from "axios";

export default function SymptomsChecker() {
  const [drug, setDrug] = useState("");
  const [symptoms, setSymptoms] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchSymptoms = async () => {
    if (!drug) return;

    setLoading(true);

    try {
      const res = await axios.get(`/api/symptoms/${drug}`);
      setSymptoms(res.data.symptoms);
    } catch (err) {
      setSymptoms(["Error fetching symptoms"]);
    }

    setLoading(false);
  };

  return (
    <div className="p-5 max-w-xl mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-3">Drug Symptom Checker</h2>

      <input
        type="text"
        value={drug}
        onChange={(e) => setDrug(e.target.value)}
        placeholder="Enter drug name (e.g. amoxicillin)"
        className="border p-2 w-full rounded-md mb-3"
      />

      <button
        onClick={searchSymptoms}
        className="bg-blue-600 text-white px-4 py-2 rounded-md w-full"
      >
        Search
      </button>

      {loading && <p className="mt-3">Loading...</p>}

      {symptoms.length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">Possible Symptoms:</h3>
          <ul className="list-disc ml-5">
            {symptoms.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
