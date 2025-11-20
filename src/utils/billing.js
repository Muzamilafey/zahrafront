// Utility helpers for billing operations
// Attempts to create or merge invoice line items into an existing open invoice for a patient
export async function createOrMergeInvoice(axiosInstance, payload) {
  // payload expected to contain either patientId or appointmentId
  try {
    let patientId = payload.patientId;
    if (!patientId && payload.appointmentId) {
      // try resolve appointment -> patient
      try {
        const aRes = await axiosInstance.get(`/appointments/${payload.appointmentId}`);
        patientId = aRes.data.appointment?.patient?._id || aRes.data.appointment?.patient || null;
      } catch (e) { /* ignore */ }
    }

    if (patientId) {
      try {
        // find existing invoices for patient (server may support query params)
        const search = await axiosInstance.get(`/billing?patientId=${patientId}`);
        const invs = search.data.invoices || [];
        // Prefer an unpaid or open invoice for admission (not refunded/cancelled/paid)
        const open = invs.find(i => !['paid','cancelled','refunded'].includes((i.status||'').toLowerCase()));
        if (open) {
          // tell server to merge this new charge into existing invoice if supported
          const body = { ...payload, mergeWith: open._id };
          return await axiosInstance.post('/billing', body);
        }
      } catch (err) {
        // ignore search failures — fall back to plain create
        console.warn('[billing.helper] invoice search failed', err?.message || err);
      }
    }

    // fallback: create new invoice
    return await axiosInstance.post('/billing', payload);
  } catch (err) {
    throw err;
  }
}

const billingUtils = {
  createOrMergeInvoice,
};
export default billingUtils;
