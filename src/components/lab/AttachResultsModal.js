import React, { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import Toast from '../ui/Toast';

export default function AttachResultsModal({ labTestId, onClose, onResultsAttached }) {
  const { axiosInstance } = useContext(AuthContext);
  const [resultsText, setResultsText] = useState('');
  const [resultsFiles, setResultsFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleFileChange = (e) => {
    setResultsFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    const formData = new FormData();
    formData.append('resultsText', resultsText);
    resultsFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      await axiosInstance.put(`/lab/${labTestId}/results`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setToast({ type: 'success', message: 'Results attached successfully!' });
      onResultsAttached(); // Callback to refresh the queue
      onClose();
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to attach results.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Attach Lab Results</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="resultsText" className="block text-sm font-medium text-gray-700">Results Text</label>
            <textarea
              id="resultsText"
              rows="5"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              value={resultsText}
              onChange={(e) => setResultsText(e.target.value)}
            ></textarea>
          </div>
          <div className="mb-4">
            <label htmlFor="resultsFiles" className="block text-sm font-medium text-gray-700">Attach Files</label>
            <input
              type="file"
              id="resultsFiles"
              multiple
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              onChange={handleFileChange}
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={loading}
            >
              {loading ? 'Attaching...' : 'Attach Results'}
            </button>
          </div>
        </form>
        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    </div>
  );
}