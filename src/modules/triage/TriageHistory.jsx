import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { TRIAGE_CATEGORIES, formatBP, getBMICategory } from './utils';
import { FaHistory, FaChevronDown, FaCalendarAlt, FaClock, FaUser } from 'react-icons/fa';

const TriageHistory = ({ patientId }) => {
  const { axiosInstance } = useContext(AuthContext);
  const [triageRecords, setTriageRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [pagination, setPagination] = useState({ limit: 10, skip: 0, total: 0, pages: 1 });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchTriageHistory();
  }, [patientId, currentPage]);

  const fetchTriageHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const skip = (currentPage - 1) * pagination.limit;
      const response = await axiosInstance.get(`/triage/${patientId}`, {
        params: { limit: pagination.limit, skip, sort: '-createdAt' },
      });

      setTriageRecords(response.data.data || []);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error('Failed to fetch triage history:', err);
      setError(err.response?.data?.message || 'Failed to load triage history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && triageRecords.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse text-center">
          <p className="text-gray-500">Loading triage history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-2">
          <FaHistory className="text-blue-600" />
          Triage History
        </h2>
        <p className="text-gray-600">View and manage patient triage assessments</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {triageRecords.length === 0 ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
          <FaHistory className="mx-auto text-4xl text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No triage records found for this patient.</p>
        </div>
      ) : (
        <>
          {/* Triage Records List */}
          <div className="space-y-4 mb-6">
            {triageRecords.map((record) => {
              const categoryInfo = TRIAGE_CATEGORIES[record.triageCategory];
              const isExpanded = expandedId === record._id;

              return (
                <div
                  key={record._id}
                  className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-md transition"
                >
                  {/* Card Header - Always Visible */}
                  <button
                    onClick={() => toggleExpand(record._id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Triage Category Badge */}
                      <div
                        className="px-3 py-1 rounded-full text-white font-semibold text-sm flex-shrink-0"
                        style={{ backgroundColor: categoryInfo.color }}
                      >
                        {record.triageCategory}
                      </div>

                      {/* Main Info */}
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-semibold text-gray-800 truncate">{record.reasonForVisit}</p>
                        <div className="flex gap-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <FaCalendarDays className="text-gray-400" />
                            {formatDate(record.createdAt)}
                          </span>
                          {record.triageBy?.name && (
                            <span className="flex items-center gap-1">
                              <FaUser className="text-gray-400" />
                              {record.triageBy.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Vital Signs Summary */}
                      <div className="hidden md:flex gap-6 text-sm text-gray-700 flex-shrink-0">
                        <div>
                          <p className="text-xs text-gray-500">Temp</p>
                          <p className="font-semibold">{record.temperature}°C</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">BP</p>
                          <p className="font-semibold">{formatBP(record.bloodPressureSystolic, record.bloodPressureDiastolic)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">SPO2</p>
                          <p className="font-semibold">{record.spo2}%</p>
                        </div>
                      </div>
                    </div>

                    {/* Expand Icon */}
                    <FaChevronDown
                      className={`ml-4 text-gray-400 transition transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Expandable Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50 p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Vital Signs */}
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-3">Vital Signs</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Temperature:</span>
                              <span className="font-medium">{record.temperature}°C</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Blood Pressure:</span>
                              <span className="font-medium">{formatBP(record.bloodPressureSystolic, record.bloodPressureDiastolic)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Respiratory Rate:</span>
                              <span className="font-medium">{record.respiratoryRate} breaths/min</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Pulse Rate:</span>
                              <span className="font-medium">{record.pulseRate} beats/min</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">SPO2:</span>
                              <span className="font-medium">{record.spo2}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Measurements */}
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-3">Measurements</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Weight:</span>
                              <span className="font-medium">{record.weight} kg</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Height:</span>
                              <span className="font-medium">{record.height} cm</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">BMI:</span>
                              <span className="font-medium">
                                {record.bmi} <span className="text-xs text-gray-500">({getBMICategory(record.bmi)})</span>
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Pain Score:</span>
                              <span className="font-medium">{record.painScore}/10</span>
                            </div>
                          </div>
                        </div>

                        {/* Assessment & Notes */}
                        <div className="md:col-span-2">
                          <h4 className="font-semibold text-gray-700 mb-3">Clinical Assessment</h4>
                          <div className="bg-white p-3 rounded border border-gray-200 text-sm space-y-2">
                            <div>
                              <p className="text-gray-600 font-medium">Reason for Visit:</p>
                              <p className="text-gray-800">{record.reasonForVisit}</p>
                            </div>
                            {record.notes && (
                              <div>
                                <p className="text-gray-600 font-medium">Additional Notes:</p>
                                <p className="text-gray-800">{record.notes}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-gray-600 font-medium">Status:</p>
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                record.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : record.status === 'reviewed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Staff & Timestamp */}
                        <div className="md:col-span-2 pt-3 border-t border-gray-200 text-xs text-gray-600">
                          <div className="flex gap-4">
                            {record.triageBy?.name && (
                              <span>
                                <strong>Recorded by:</strong> {record.triageBy.name}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <FaClock className="inline" />
                              <strong>Created:</strong> {formatDate(record.createdAt)}
                            </span>
                            {record.updatedAt !== record.createdAt && (
                              <span className="flex items-center gap-1">
                                <strong>Updated:</strong> {formatDate(record.updatedAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg ${
                    currentPage === page ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                disabled={currentPage === pagination.pages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}

          {/* Summary Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Total Assessments</p>
              <p className="text-2xl font-bold text-gray-800">{pagination.total}</p>
            </div>
            {Object.entries(TRIAGE_CATEGORIES).map(([category, info]) => {
              const count = triageRecords.filter((r) => r.triageCategory === category).length;
              return (
                <div key={category} className="bg-white rounded-lg shadow border border-gray-200 p-4">
                  <p className="text-sm text-gray-600">{category}</p>
                  <p className="text-2xl font-bold" style={{ color: info.color }}>
                    {count}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default TriageHistory;
