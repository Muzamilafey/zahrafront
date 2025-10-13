import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import DataTable from '../../components/ui/DataTable';

export default function AdminDoctors(){
  const { axiosInstance } = useContext(AuthContext);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSpecialties, setEditSpecialties] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useUI();

  useEffect(()=>{
    const load = async ()=>{
      try{ 
        const res = await axiosInstance.get('/doctors/with-availability');
        setDoctors(res.data.doctors || []);
      }catch(e){ console.error(e); }
      finally{ setLoading(false); }
    };
    load();
  },[]);

  const viewDoctor = async (id)=>{
    try{
      const res = await axiosInstance.get(`/doctors/${id}`);
      const d = res.data.doctor;
      // open modal and populate fields
      setSelectedDoctor(d);
      setEditName(d.user?.name || '');
      setEditEmail(d.user?.email || '');
      setEditSpecialties((d.specialties || []).join(', '));
      setEditBio(d.bio || '');
    }catch(e){ console.error(e); showToast({ message: 'Failed to load doctor details', type: 'error' }); }
  };

  const closeModal = () => {
    setSelectedDoctor(null);
    setEditName(''); setEditEmail(''); setEditSpecialties(''); setEditBio('');
  };

  const saveDoctor = async () => {
    if (!selectedDoctor) return;
  setSaving(true);
    try{
      const payload = {
        user: { name: editName, email: editEmail },
        specialties: editSpecialties.split(',').map(s=>s.trim()).filter(Boolean),
        bio: editBio
      };
      await axiosInstance.put(`/doctors/${selectedDoctor._id}`, payload);
      // refresh list
      const res = await axiosInstance.get('/doctors/with-availability');
      setDoctors(res.data.doctors || []);
  closeModal();
  showToast({ message: 'Doctor saved', type: 'success' });
    }catch(err){ console.error(err); showToast({ message: err?.response?.data?.message || 'Failed to save doctor', type: 'error' }); }
    finally{ setSaving(false); }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Specialties', accessor: 'specialties' },
    { header: 'Availability', accessor: 'availability' },
    { header: 'Bio', accessor: 'bio' },
    { header: 'Created', accessor: 'createdAt' },
    { header: 'Actions', accessor: 'actions' },
  ];

  const data = doctors.map(d=>({ 
    name: d.user?.name || '-',
    email: d.user?.email || '-',
    specialties: (d.specialties||[]).join(', '),
    availability: d.availability ? (d.availability.available ? `Available${d.availability.message?` — ${d.availability.message}`:''}` : `Unavailable${d.availability.message?` — ${d.availability.message}`:''}`) : 'Unknown',
    bio: (d.bio || '-').length > 60 ? (d.bio || '-').slice(0,60) + '...' : (d.bio || '-'),
    createdAt: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '-',
    actions: (<div>
      <button className="btn-brand mr-2" onClick={()=>viewDoctor(d._id)}>View</button>
    </div>)
  }));

  return (
    <div className="p-6">
  <h2 className="text-2xl font-bold mt-0 mb-0 text-brand-700">Doctors</h2>
      <div className="bg-white rounded p-4 shadow">
        {loading ? <div className="text-sm text-gray-500">Loading...</div> : <DataTable columns={columns} data={data} /> }
      </div>

      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-800 rounded p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Doctor: {selectedDoctor.user?.name}</h3>
              <button className="text-sm text-gray-600" onClick={closeModal}>Close</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Name</label>
                <input className="input w-full" value={editName} onChange={e=>setEditName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-500">Email</label>
                <input className="input w-full" value={editEmail} onChange={e=>setEditEmail(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-500">Specialties (comma separated)</label>
                <input className="input w-full" value={editSpecialties} onChange={e=>setEditSpecialties(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-500">Bio</label>
                <textarea className="input w-full" rows={4} value={editBio} onChange={e=>setEditBio(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2">
                <button className="btn-outline" onClick={closeModal}>Cancel</button>
                <button className="btn" onClick={saveDoctor} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
