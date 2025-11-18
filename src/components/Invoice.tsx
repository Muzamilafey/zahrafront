import React from 'react';
import PrintButton from './PrintButton';

interface InvoiceProps {
  summary: any;
}

const Invoice: React.FC<InvoiceProps> = ({ summary }) => {
  if (!summary || !summary.patientInfo || !summary.charges) {
    return <div>No invoice data available</div>;
  }

  const { patientInfo, charges, totalCharges } = summary;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const handlePrint = () => {
    const printContents = document.getElementById('invoice-printable')?.innerHTML;
    const originalContents = document.body.innerHTML;
    if (printContents) {
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden mt-8">
      <div id="invoice-printable">
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #invoice-printable, #invoice-printable * { visibility: visible; }
            #invoice-printable { position: absolute; left: 0; top: 0; width: 100%; }
            .print-header { display: flex !important; }
          }
        `}</style>
        <div className="p-6">
          <div className="print-header hidden justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold">Hopewell Hospital</h1>
              <p className="text-sm">123 Wellness Avenue, Health City</p>
            </div>
            <h2 className="text-3xl font-bold text-gray-800">INVOICE</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-8">
            <div>
              <h4 className="font-semibold text-gray-600">Billed To:</h4>
              <p className="font-bold text-gray-900">{patientInfo.name}</p>
              <p className="text-gray-700">{patientInfo.address}</p>
            </div>
            <div className="text-right">
              <p><strong className="text-gray-600">Invoice #:</strong> INV-{patientInfo.mrn?.slice(-5)}-{new Date().getFullYear()}</p>
              <p><strong className="text-gray-600">Date Issued:</strong> {formatDate(new Date().toISOString())}</p>
              <p><strong className="text-gray-600">Due Date:</strong> {formatDate(new Date(new Date().setDate(new Date().getDate() + 30)).toISOString())}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Description</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-600">Qty</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-600">Unit Price</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody>
                {charges.map((charge, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-2">{charge.name}</td>
                    <td className="px-4 py-2 text-right">{charge.quantity}</td>
                    <td className="px-4 py-2 text-right">${charge.amount.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">${(charge.quantity * charge.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-6">
            <div className="w-full max-w-xs text-sm">
              <div className="flex justify-between py-2 mt-2 border-t-2 border-gray-300">
                <span className="font-bold text-base">Total Due:</span>
                <span className="font-bold text-base">${totalCharges.toFixed(2)}</span>
              </div>
            </div>
          </div>
           <div className="mt-8 text-xs text-gray-500 text-center">
                <p>Thank you for choosing Hopewell Hospital. Please make payment within 30 days.</p>
                <p>For billing questions, please call +1 (555) 234-5678.</p>
           </div>
        </div>
      </div>
      <div className="px-6 py-4 bg-gray-50 border-t print:hidden">
        <PrintButton onClick={handlePrint} text="Print Invoice" />
      </div>
    </div>
  );
};

export default Invoice;
