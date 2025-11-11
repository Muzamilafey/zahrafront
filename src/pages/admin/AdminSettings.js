import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function AdminSettings(){
  const { axiosInstance } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [details, setDetails] = useState({ name: '', location: '', contacts: '' });
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      try{
        const res = await axiosInstance.get('/setting/hospital-details');
        if(!mounted) return;
        setDetails({
          name: res.data.name || '',
          location: res.data.location || '',
          contacts: Array.isArray(res.data.contacts) ? res.data.contacts.join('\n') : (res.data.contacts || '')
        });
        // if backend returns a logo url, set preview
        if (res.data.logo || res.data.logoUrl) {
          setLogoPreview(res.data.logo || res.data.logoUrl);
        }
      }catch(e){
        // ignore
      }finally{ if(mounted) setLoading(false); }
    })();
    return ()=>{ mounted = false; };
  }, [axiosInstance]);

  const onChange = (e) => setDetails(d => ({ ...d, [e.target.name]: e.target.value }));

  const onLogoChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setSelectedLogo(f);
    const url = URL.createObjectURL(f);
    setLogoPreview(url);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try{
      // If a logo was selected, upload it first as multipart/form-data
      if (selectedLogo) {
        try {
          const fd = new FormData();
          fd.append('logo', selectedLogo);
          // backend should handle this route - if not present, this will fail silently and we'll continue
          await axiosInstance.post('/setting/hospital-details/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        } catch (e) {
          console.warn('Logo upload failed:', e?.response?.data || e.message || e);
          // continue to save other settings even if logo upload failed
        }
      }

      const payload = { ...details, contacts: details.contacts.split(/\r?\n/).map(s=>s.trim()).filter(Boolean) };
      const res = await axiosInstance.post('/setting/hospital-details', payload);
      setMessage({ type: 'success', text: res.data.message || 'Saved' });
      // if save successful, try refresh to pick up new logo url
      try{ const r = await axiosInstance.get('/setting/hospital-details'); if (r.data.logo || r.data.logoUrl) setLogoPreview(r.data.logo || r.data.logoUrl); }catch(e){}
    }catch(err){
      setMessage({ type: 'error', text: err?.response?.data?.message || err.message || 'Failed to save' });
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
            {message && <div className={`mb-4 p-3 rounded ${message.type==='error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{message.text}</div>}

            <label className="block mb-2 text-sm font-medium">Hospital Name</label>
            <input name="name" value={details.name} onChange={onChange} className="w-full p-2 border rounded mb-4" />

            <label className="block mb-2 text-sm font-medium">Location / Address</label>
            <textarea name="location" value={details.location} onChange={onChange} className="w-full p-2 border rounded mb-4" rows={3} />

            <label className="block mb-2 text-sm font-medium">Contacts (one per line)</label>
            <textarea name="contacts" value={details.contacts} onChange={onChange} className="w-full p-2 border rounded mb-4" rows={3} />

            <label className="block mb-2 text-sm font-medium">Hospital Logo (optional)</label>
            <div className="mb-3 flex items-center gap-4">
              <input type="file" accept="image/*" onChange={onLogoChange} />
              {logoPreview ? (
                <div className="w-24 h-24 border rounded overflow-hidden flex items-center justify-center bg-white">
                  <img src={logoPreview} alt="logo preview" className="object-contain w-full h-full" />
                </div>
              ) : (
                <div className="text-sm text-gray-500">No logo set</div>
              )}
            </div>

            <div className="flex gap-2">
              <button className="btn-brand" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              <button type="button" className="btn-outline" onClick={()=>window.location.reload()}>Reload</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
