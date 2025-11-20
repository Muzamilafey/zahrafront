import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import Toast from '../../components/ui/Toast'; // Assuming you have a Toast component

export default function AdminSettings(){
  const { axiosInstance } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [details, setDetails] = useState({
    hospitalName: '',
    hospitalAddress: '',
    hospitalContact: '',
    hospitalLogoUrl: ''
  });
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      try{
        const res = await axiosInstance.get('/setting/hospital-details');
        if(!mounted) return;
        setDetails({
          hospitalName: res.data.hospitalName || '',
          hospitalAddress: res.data.hospitalAddress || '',
          hospitalContact: res.data.hospitalContact || '',
          hospitalLogoUrl: res.data.hospitalLogoUrl || ''
        });
        setLogoPreview(res.data.hospitalLogoUrl || null);
      }catch(e){
        console.error('Failed to load hospital details:', e);
        setToast({ message: e?.response?.data?.message || 'Failed to load hospital details', type: 'error' });
      }finally{ if(mounted) setLoading(false); }
    })();
    return ()=>{ mounted = false; };
  }, [axiosInstance]);

  const onChange = (e) => setDetails(d => ({ ...d, [e.target.name]: e.target.value }));

  const onLogoChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Frontend validation
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      setToast({ message: 'Invalid file type. Only PNG, JPG, and SVG are allowed.', type: 'error' });
      e.target.value = null; // Clear the input
      setSelectedLogo(null);
      setLogoPreview(details.hospitalLogoUrl); // Revert to current saved logo
      return;
    }

    if (file.size > maxSize) {
      setToast({ message: 'File size exceeds 5MB limit.', type: 'error' });
      e.target.value = null; // Clear the input
      setSelectedLogo(null);
      setLogoPreview(details.hospitalLogoUrl); // Revert to current saved logo
      return;
    }

    setSelectedLogo(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setToast(null);

    try{
      let currentLogoUrl = details.hospitalLogoUrl;

      // If a new logo was selected, upload it first
      if (selectedLogo) {
        const fd = new FormData();
        fd.append('logo', selectedLogo);
        try {
          const res = await axiosInstance.post('/setting/upload-logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
          currentLogoUrl = res.data.logoUrl;
          setDetails(prev => ({ ...prev, hospitalLogoUrl: currentLogoUrl }));
          setLogoPreview(currentLogoUrl);
          setToast({ message: 'Logo uploaded successfully', type: 'success' });
        } catch (e) {
          console.error('Logo upload failed:', e?.response?.data || e.message || e);
          setToast({ message: e?.response?.data?.message || 'Failed to upload logo', type: 'error' });
          // Continue to save other settings even if logo upload failed
        }
      }

      // Save other hospital details
      const payload = {
        hospitalName: details.hospitalName,
        hospitalAddress: details.hospitalAddress,
        hospitalContact: details.hospitalContact,
        hospitalLogoUrl: currentLogoUrl // Ensure the latest logo URL is sent
      };
      const res = await axiosInstance.put('/setting/hospital-details', payload);
      setToast({ message: res.data.message || 'Hospital details saved successfully', type: 'success' });
      setSelectedLogo(null); // Clear selected file after successful save
    }catch(err){
      console.error('Failed to save hospital details:', err);
      setToast({ message: err?.response?.data?.message || err.message || 'Failed to save hospital details', type: 'error' });
    }finally{ setSaving(false); }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-brand-700">Hospital Settings</h2>
      <div className="bg-white rounded p-4 shadow max-w-2xl">
        {loading ? (
          <div>Loading…</div>
        ) : (
          <form onSubmit={save}>
            <Toast toast={toast} onClose={() => setToast(null)} />

            <label className="block mb-2 text-sm font-medium">Hospital Name</label>
            <input name="hospitalName" value={details.hospitalName} onChange={onChange} className="w-full p-2 border rounded mb-4" />

            <label className="block mb-2 text-sm font-medium">Hospital Address</label>
            <textarea name="hospitalAddress" value={details.hospitalAddress} onChange={onChange} className="w-full p-2 border rounded mb-4" rows={3} />

            <label className="block mb-2 text-sm font-medium">Hospital Contact</label>
            <textarea name="hospitalContact" value={details.hospitalContact} onChange={onChange} className="w-full p-2 border rounded mb-4" rows={3} />

            <label className="block mb-2 text-sm font-medium">Hospital Logo (optional)</label>
            <div className="mb-3 flex items-center gap-4">
              <input type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={onLogoChange} />
              {logoPreview ? (
                <div className="w-24 h-24 border rounded overflow-hidden flex items-center justify-center bg-white">
                  <img src={logoPreview} alt="logo preview" className="object-contain w-full h-full" />
                </div>
              ) : (
                <div className="text-sm text-gray-500">No logo set</div>
              )}
            </div>

            <div className="flex gap-2">
              <button className="btn-brand" disabled={saving}>{saving ? 'Saving…' : 'Save Settings'}</button>
              <button type="button" className="btn-outline" onClick={()=>window.location.reload()}>Reload</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
