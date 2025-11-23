import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

const NewDischargeSummary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { axiosInstance } = useContext(AuthContext);

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Discharge form fields
  const [dischargeDate, setDischargeDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dischargeTime, setDischargeTime] = useState('01:00');
  const [dischargeType, setDischargeType] = useState('RECOVERED');
  const [inPatientCaseType, setInPatientCaseType] = useState('GENERAL PATIENTS');
  const [summary, setSummary] = useState('');

  // Charges
  const [procedureCharges, setProcedureCharges] = useState([]);
  const [medicationCharges, setMedicationCharges] = useState([]);
  const [allCharges, setAllCharges] = useState({});

  useEffect(() => {
    if (!id || !axiosInstance) return;
    const fetchPatientAndCharges = async () => {
      try {
        const [patientRes, allChargesRes] = await Promise.all([
          axiosInstance.get(`/patients/${id}`),
          axiosInstance.get('/charges'),
        ]);

        const p = patientRes.data.patient;
        setPatient(p);

        const charges = allChargesRes.data || [];
        const groupedCharges = charges.reduce((acc, charge) => {
          const category = charge.category || 'Other';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push({
            id: charge._id,
            description: charge.name,
            amount: charge.amount,
            quantity: 1,
            checked: false,
          });
          return acc;
        }, {});
        setAllCharges(groupedCharges);

        // procedures left empty by default (matching image)
        setProcedureCharges([]);

        // Try to fetch medication / dispensed items for this patient from multiple possible endpoints
        const tryFetchMedications = async () => {
          const endpoints = [
            `/patients/${id}/medications`,
            `/patients/${id}/dispenses`,
            `/dispenses?patient=${id}`,
            `/prescriptions?patientId=${id}`,
            `/pharmacy/dispenses?patient=${id}`,
          ];

          for (const ep of endpoints) {
            try {
              const r = await axiosInstance.get(ep);
              const data = r.data;
              // Accept several shapes: array at root, { items: [...] }, { dispenses: [...] }
              const list = Array.isArray(data)
                ? data
                : Array.isArray(data.items)
                ? data.items
                : Array.isArray(data.dispenses)
                ? data.dispenses
                : Array.isArray(data.medications)
                ? data.medications
                : null;

              if (list && list.length) {
                const meds = list.map((m, idx) => {
                  // best-effort mapping
                  const description = m.name || m.itemName || m.description || m.drug || m.product || `Medication ${idx + 1}`;
                  const amount = Number(m.price || m.cost || m.unitPrice || m.amount || 0) || 0;
                  const quantity = Number(m.quantity || m.qty || m.units || 1) || 1;
                  const idKey = m.id || m.dispenseId || m.prescriptionId || `med-${idx}`;
                  return { id: idKey, description, amount, quantity, checked: true };
                });
                setMedicationCharges(meds);
                return;
              }
            } catch (err) {
              // ignore and try next
            }
          }

          // If none found, leave empty (matching image)
          setMedicationCharges([]);
        };

        tryFetchMedications();

        setLoading(false);
      } catch (err) {
        console.error('Failed to load patient data or charges:', err);
        setError('Failed to fetch patient data or charges.');
        setLoading(false);
      }
    };
    fetchPatientAndCharges();
  }, [id, axiosInstance]);

  const formatCurrency = (amt) => {
    if (!amt && amt !== 0) return '-';
    return amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const toggleCharge = (category, index) => {
    setAllCharges(prev => {
      const newCharges = { ...prev };
      newCharges[category][index].checked = !newCharges[category][index].checked;
      return newCharges;
    });
  };

  const handleQuantityChange = (category, index, quantity) => {
    setAllCharges(prev => {
      const newCharges = { ...prev };
      newCharges[category][index].quantity = quantity;
      return newCharges;
    });
  };

  const buildLineItems = () => {
    const selected = [];
    procedureCharges.filter((c) => c.checked).forEach((p) => selected.push({ description: p.description, amount: Number(p.amount) || 0, quantity: Number(p.quantity) || 1, total: (Number(p.amount)||0)*(Number(p.quantity)||1) }));
    medicationCharges.filter((c) => c.checked).forEach((m) => selected.push({ description: m.description, amount: Number(m.amount) || 0, quantity: Number(m.quantity) || 1, total: (Number(m.amount)||0)*(Number(m.quantity)||1) }));
    Object.values(allCharges).flat().filter((c) => c.checked).forEach((c) => selected.push({ description: c.description, amount: Number(c.amount) || 0, quantity: Number(c.quantity) || 1, total: (Number(c.amount)||0)*(Number(c.quantity)||1) }));
    return selected;
  };

  const saveCharges = async () => {
    const items = buildLineItems();
    if (!items.length) {
      alert('No charges selected to save.');
      return;
    }

    // Attempt several likely endpoints with PUT -> POST fallback patterns
    const invoiceId = patient?.admission?.invoiceId || patient?.invoice?.id || patient?.invoiceId || null;

    const payload = { patientId: id, items };

    const tryRequests = async () => {
      const attempts = [];

      if (invoiceId) {
        attempts.push({ method: 'put', url: `/billing/${invoiceId}` });
        attempts.push({ method: 'put', url: `/invoices/${invoiceId}` });
      }

      attempts.push({ method: 'post', url: `/billing/patient/${id}` });
      attempts.push({ method: 'post', url: `/invoices` });
      attempts.push({ method: 'post', url: `/patients/${id}/invoices` });

      for (const a of attempts) {
        try {
          const res = a.method === 'put' ? await axiosInstance.put(a.url, payload) : await axiosInstance.post(a.url, payload);
          return res;
        } catch (err) {
          // continue to next attempt
        }
      }

      throw new Error('All invoice endpoints failed');
    };

    try {
      const res = await tryRequests();
      const returned = res.data || {};
      // Try to find invoice id from response
      const newInvoiceId = returned.invoiceId || returned.id || (returned.invoice && returned.invoice.id) || invoiceId;
      alert('Charges saved to invoice successfully');
      if (newInvoiceId) {
        // Navigate to likely invoice path
        navigate(`/billing/${newInvoiceId}`);
      } else if (returned.link) {
        window.open(returned.link, '_blank');
      }
    } catch (err) {
      console.error('Failed to save charges to invoice', err);
      alert('Failed to save charges to invoice. Check console for details.');
    }
  };

  const handleDischarge = async (e) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to discharge this patient? This will finalize their admission and generate an invoice.')) return;

    // Ensure patient has at least one diagnosis before allowing discharge
    const patientDiagnoses = patient?.diagnoses || [];
    if (patientDiagnoses.length === 0) {
      alert('Cannot discharge patient: no diagnoses have been added. Please add at least one diagnosis before discharging the patient.');
      navigate(`/patients/${id}/diagnosis`); // Redirect to diagnosis page
      return;
    }

    try {
      const selectedCharges = {
        procedures: procedureCharges.filter((c) => c.checked),
        medications: medicationCharges.filter((c) => c.checked),
        additional: Object.values(allCharges).flat().filter((c) => c.checked),
      };

      await axiosInstance.post(`/patients/${id}/discharge`, {
        dischargeDate,
        dischargeTime,
        dischargeType,
        inPatientCaseType,
        dischargeNotes: summary,
        charges: selectedCharges,
      });

      alert('Patient Discharged Successfully');
      navigate(`/patients/${id}`);
    } catch (err) {
      console.error('Error discharging patient:', err);
      alert(err.response?.data?.message || 'Error discharging patient');
    }
  };

  if (loading) return <div className="text-center p-8">Loading patient details...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
  if (!patient) return <div className="text-center p-8">No patient data found.</div>;

  // If patient already discharged, show simplified discharged screen (per design)
  const isDischarged = Boolean(
    patient?.admission?.dischargedAt ||
    (patient?.admission?.status && String(patient.admission.status).toLowerCase() === 'discharged') ||
    patient?.admission?.discharged
  );

  if (isDischarged) {
    const dischargedAt = patient?.admission?.dischargedAt || patient?.admission?.dischargedAt === 0 ? patient.admission.dischargedAt : null;
    const dischargedText = dischargedAt ? new Date(dischargedAt).toLocaleString() : 'DISCHARGED';

    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="max-w-3xl w-full text-center">
          <div className="mb-6">
            <img src={'/logo1.png'} alt="Hospital Logo" className="mx-auto h-16 mb-2" />
            <div className="text-xs text-gray-600"></div>
          </div>

          <h2 className="text-xl md:text-2xl font-semibold mb-4">“{patient.user?.name || patient.firstName + ' ' + (patient.lastName || '')}” IS ALREADY DISCHARGED</h2>
          <div className="text-sm text-gray-600 mb-8">DISCHARGED : “{dischargedText}”</div>

          <div className="flex gap-6 justify-center">
            <Link to={`/patients/${id}/detailed-discharge-summary`} className="inline-block bg-blue-400 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-full shadow">
              OPEN DETAILED DISCHARGED SUMMARY
            </Link>
            <Link to={`/patients/${id}/invoice`} className="inline-block bg-blue-400 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-full shadow">
              OPEN FINALIZED INVOICE
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl bg-gray-50">
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Confirm any new In-Patient Charges before Discharge</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow p-6 mb-6">
        <div className="text-sm text-gray-700 font-semibold text-center mb-4">
          INPATIENT'S FILE NO : {patient.fileNo || patient.fileNumber || id}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
          <div><strong>PATIENT'S NAME :</strong> {patient.user?.name || `${patient.firstName || ''} ${patient.lastName || ''}`}</div>
          <div><strong>PATIENT'S AGE :</strong> {patient.age ? `${patient.age} YRS` : 'N/A'}</div>
          <div><strong>ADMISSION DATE :</strong> {patient.admission?.admittedAt ? new Date(patient.admission.admittedAt).toLocaleDateString() : 'N/A'}</div>
          <div><strong>ADMISSION TIME :</strong> {patient.admission?.admittedAt ? new Date(patient.admission.admittedAt).toLocaleTimeString() : 'N/A'}</div>
        </div>
      </div>

      <form onSubmit={handleDischarge} className="bg-white border border-gray-200 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Discharge Date & Time</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Discharge Date</label>
            <input type="date" value={dischargeDate} onChange={(e) => setDischargeDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Discharge Time</label>
            <input type="time" value={dischargeTime} onChange={(e) => setDischargeTime(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Discharge Type</label>
            <select value={dischargeType} onChange={(e) => setDischargeType(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded px-2 py-1">
              <option value="RECOVERED">RECOVERED</option>
              <option value="TRANSFERRED">TRANSFERRED</option>
              <option value="DECEASED">DECEASED</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">InPatient Case Type</label>
            <select value={inPatientCaseType} onChange={(e) => setInPatientCaseType(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded px-2 py-1">
              <option>GENERAL PATIENTS</option>
              <option>PRIVATE</option>
              <option>CHARITY</option>
            </select>
          </div>
        </div>

        <h3 className="font-semibold text-lg mb-2">Consultation, Procedures, Lab & Radiology Charges</h3>
        {procedureCharges.length === 0 ? (
          <div className="text-sm text-gray-600 mb-4">No new procedure/service has been charged for this admission</div>
        ) : (
          <table className="w-full table-auto mb-4 border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 border-b"><th className="px-2 py-1">SERVICE</th><th className="px-2 py-1">AMOUNT</th></tr>
            </thead>
            <tbody>
              {procedureCharges.map((p, idx) => (
                <tr key={idx} className="border-b"><td className="px-2 py-1">{p.description}</td><td className="px-2 py-1">{formatCurrency(p.amount)}</td></tr>
              ))}
            </tbody>
          </table>
        )}

        <h3 className="font-semibold text-lg mb-2">Medication Charges</h3>
        {medicationCharges.length === 0 ? (
          <div className="text-sm text-gray-600 mb-4">No new medication has been charged for this admission</div>
        ) : (
          <table className="w-full table-auto mb-4 border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 border-b"><th className="px-2 py-1">MEDICATION</th><th className="px-2 py-1">COST</th><th className="px-2 py-1">QUANTITY</th><th className="px-2 py-1">TOTAL</th></tr>
            </thead>
            <tbody>
              {medicationCharges.map((m, idx) => (
                <tr key={idx} className="border-b"><td className="px-2 py-1">{m.description}</td><td className="px-2 py-1">{formatCurrency(m.amount)}</td><td className="px-2 py-1">{m.quantity}</td><td className="px-2 py-1">{formatCurrency((m.amount||0)* (m.quantity||0))}</td></tr>
              ))}
            </tbody>
          </table>
        )}

        <h3 className="font-semibold text-lg mb-2">Additional Charges</h3>
        <div className="overflow-x-auto mb-4">
          {Object.entries(allCharges).map(([category, charges]) => (
            <div key={category} className="mb-4">
              <h4 className="font-semibold text-md mb-2">{category}</h4>
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="px-2 py-2">&nbsp;</th>
                    <th className="px-2 py-2">DESCRIPTION</th>
                    <th className="px-2 py-2 text-right">AMOUNT</th>
                    <th className="px-2 py-2 text-right">QUANTITY</th>
                    <th className="px-2 py-2 text-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {charges.map((row, idx) => (
                    <tr key={row.id} className="border-b">
                      <td className="px-2 py-2 text-center">
                        <input type="checkbox" checked={row.checked} onChange={() => toggleCharge(category, idx)} />
                      </td>
                      <td className="px-2 py-2">{row.description}</td>
                      <td className="px-2 py-2 text-right">{formatCurrency(row.amount)}</td>
                      <td className="px-2 py-2 text-right">
                        <input
                          type="number"
                          value={row.quantity}
                          onChange={(e) => handleQuantityChange(category, idx, e.target.value)}
                          className="w-16 text-right"
                        />
                      </td>
                      <td className="px-2 py-2 text-right">{formatCurrency((row.amount||0) * (row.quantity||0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div>
            <label className="block text-sm font-medium text-gray-600">Discharge Notes / Summary</label>
            <textarea rows={6} value={summary} onChange={(e) => setSummary(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded px-2 py-2" placeholder="Enter final summary, medication instructions and follow up..." />
          </div>

          <div className="text-right">
            <div className="mb-4">
              <Link to={`/patients/${id}/detailed-discharge-summary`} className="inline-block mb-2 text-sm text-blue-600 underline">Open Detailed Summary</Link>
            </div>
            <div className="mb-2">
              <button type="button" onClick={saveCharges} className="bg-green-600 text-white font-bold py-2 px-4 rounded shadow hover:bg-green-700 mr-2">Save Charges</button>
            </div>
            <button type="submit" className="bg-blue-700 text-white font-bold py-3 px-6 rounded shadow hover:bg-blue-800">Discharge Patient</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewDischargeSummary;