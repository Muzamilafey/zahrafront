import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { format } from 'date-fns';

export default function ClinicalSummary() {
  const { axiosInstance } = useContext(AuthContext);
  const params = useParams();
  const admissionId = params.admissionId || params.id; // support routes using either param name
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patient, setPatient] = useState(null);
  const [clinicalSummary, setClinicalSummary] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let response = null;
        let data = null;

        // Try common endpoints in order to tolerate backend route variations
        try {
          response = await axiosInstance.get(`/admission/${admissionId}`);
          data = response.data;
        } catch (err) {
          // try plural form
          if (err?.response?.status === 404) {
            try {
              response = await axiosInstance.get(`/admissions/${admissionId}`);
              data = response.data;
            } catch (err2) {
              // try treating admissionId as a patient id and load patient instead
              if (err2?.response?.status === 404) {
                try {
                  const pRes = await axiosInstance.get(`/patients/${admissionId}`);
                  const patientData = pRes.data.patient || pRes.data;
                  // pick current admission if present, otherwise last admissionHistory
                  const adm = patientData?.admission || (Array.isArray(patientData?.admissionHistory) && patientData.admissionHistory.length ? patientData.admissionHistory[patientData.admissionHistory.length - 1] : null);
                  if (!adm) throw err2;
                  data = { patient: patientData, clinicalSummary: adm.clinicalSummary || adm.clinical_summary || '' };
                } catch (err3) {
                  throw err3 || err2 || err;
                }
              } else {
                throw err2;
              }
            }
          } else {
            throw err;
          }
        }

        // normalize data
        setPatient(data.patient || data.patientInfo || data.patientData || {});
        setClinicalSummary(data.clinicalSummary || data.clinical_summary || data.clinicalSummaryText || '');
        setLoading(false);
      } catch (err) {
        console.error('Error fetching admission data:', err);
        // prefer server message if present
        const msg = err?.response?.data?.message || err?.message || 'Failed to load admission data';
        setError(msg);
        setLoading(false);
      }
    };

    if (!admissionId) {
      // avoid leaving the page stuck in loading state when route param is missing
      setLoading(false);
      setError('Admission id missing in route');
      return;
    }

    fetchData();
  }, [admissionId, axiosInstance]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      console.log(`[ClinicalSummary] Submitting PATCH to /admission/${admissionId} with token`);
      // Try patching common endpoints in order
      try {
        await axiosInstance.patch(`/admission/${admissionId}`, { clinicalSummary });
      } catch (err) {
        if (err?.response?.status === 404) {
          try {
            await axiosInstance.patch(`/admissions/${admissionId}`, { clinicalSummary });
          } catch (err2) {
            // if we loaded a patient earlier (admissionId was actually a patient id), try updating patient's admission
            if (patient && patient._id) {
              try {
                await axiosInstance.patch(`/patients/${patient._id}/admission`, { clinicalSummary });
              } catch (err3) {
                throw err3;
              }
            } else {
              throw err2;
            }
          }
        } else {
          throw err;
        }
      }
      navigate(`/discharge/${admissionId}`);
    } catch (err) {
      console.error('Error saving clinical summary:', err);
      if (err.response?.status === 401) {
        console.error('401 Unauthorized - token may be expired or not sent. Token:', localStorage.getItem('accessToken')?.substring(0, 20) + '...');
      }
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!patient) return <div className="p-4">No patient data found</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-6">Clinical Summary</h1>
        
        {/* Patient Information */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Patient Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">{patient.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Hospital ID</p>
              <p className="font-medium">{patient.hospitalId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Age</p>
              <p className="font-medium">{patient.age} years</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Gender</p>
              <p className="font-medium">{patient.gender}</p>
            </div>
          </div>
        </div>

        {/* Clinical Summary Form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Enter Clinical Summary</h2>
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Clinical Summary
            </label>
            <textarea
              value={clinicalSummary}
              onChange={(e) => setClinicalSummary(e.target.value)}
              rows={10}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
              placeholder="Enter detailed clinical summary..."
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate(`/discharge/${admissionId}`)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Clinical Summary'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}