import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import Toast from '../../components/ui/Toast';

export default function LabTestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { axiosInstance } = useContext(AuthContext);

  const [labTest, setLabTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchLabTestDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/lab/${id}`);
      setLabTest(response.data.labTest);
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Failed to fetch lab test details';
      setError(errorMessage);
      setToast({ type: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [axiosInstance, id]);

  useEffect(() => {
    fetchLabTestDetail();
  }, [fetchLabTestDetail]);

  const handleDownloadReport = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/lab/${id}/report`, {
        responseType: 'blob', // Important for downloading files
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `lab_report_${labTest.labTestNumber || labTest._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download report:', err);
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to download report' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading lab test details...</div>;
  if (error && !toast) return <div className="p-6 text-red-600">{error}</div>;
  if (!labTest) return <div className="p-6">Lab test not found.</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Lab Test Details: {labTest.labTestNumber}</h2>
        <button onClick={() => navigate(-1)} className="btn-muted">Back</button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600"><strong>Patient:</strong> {labTest.patient?.user?.name || labTest.patient?.firstName + ' ' + labTest.patient?.lastName}</p>
            <p className="text-gray-600"><strong>Doctor:</strong> {labTest.doctor?.user?.name || 'N/A'}</p>
            <p className="text-gray-600"><strong>Test Type:</strong> {labTest.testType}</p>
            <p className="text-gray-600"><strong>Priority:</strong> <span className={`font-medium ${labTest.priority === 'stat' ? 'text-red-600' : labTest.priority === 'urgent' ? 'text-orange-500' : 'text-green-600'}`}>{labTest.priority}</span></p>
            <p className="text-gray-600"><strong>Status:</strong> {labTest.status}</p>
            <p className="text-gray-600"><strong>Sample Status:</strong> {labTest.sampleStatus}</p>
            <p className="text-gray-600"><strong>Requested On:</strong> {new Date(labTest.createdAt).toLocaleString()}</p>
            {labTest.assignedTo && <p className="text-gray-600"><strong>Assigned To:</strong> {labTest.assignedTo.user?.name || 'N/A'}</p>}
          </div>
          <div>
            <p className="text-gray-600"><strong>Notes:</strong> {labTest.notes || 'N/A'}</p>
            {labTest.status === 'completed' || labTest.status === 'validated' ? (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Results:</h3>
                {labTest.resultsText && (
                  <div className="bg-gray-100 p-3 rounded mb-2 whitespace-pre-wrap">
                    {labTest.resultsText}
                  </div>
                )}
                {labTest.resultsFiles && labTest.resultsFiles.length > 0 && (
                  <div>
                    <p className="font-medium">Attached Files:</p>
                    <ul className="list-disc ml-5">
                      {labTest.resultsFiles.map((file, index) => (
                        <li key={index}>
                          <a
                            href={`/uploads/lab/${file.filename}`} // Assuming files are served from /uploads/lab
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            {file.filename}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <button onClick={handleDownloadReport} className="btn-brand mt-4" disabled={loading}>
                  {loading ? 'Generating...' : 'Download PDF Report'}
                </button>
              </div>
            ) : (
              <p className="text-gray-500 mt-4">Results are not yet available.</p>
            )}
          </div>
        </div>
      </div>

      {labTest.history && labTest.history.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">History</h3>
          <ul className="divide-y divide-gray-200">
            {labTest.history.map((entry, index) => (
              <li key={index} className="py-3">
                <p className="text-sm text-gray-800">
                  <span className="font-medium">{entry.action.replace(/_/g, ' ')}</span>
                  {entry.fromStatus && entry.toStatus && ` from ${entry.fromStatus} to ${entry.toStatus}`}
                  {entry.note && `: ${entry.note}`}
                </p>
                <p className="text-xs text-gray-500">
                  By {entry.by?.name || entry.by?.email || 'Unknown'} ({entry.role}) on {new Date(entry.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
