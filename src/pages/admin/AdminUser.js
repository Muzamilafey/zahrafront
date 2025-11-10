import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

export default function AdminUser(){
  const { id } = useParams();
  const navigate = useNavigate();
  const { axiosInstance } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name:'', email:'', phone:'', role:'' });
  const [permissions, setPermissions] = useState({ sidebar: {} });

  useEffect(()=>{
    const load = async ()=>{
      try{
        const res = await axiosInstance.get(`/users/${id}`);
        setUser(res.data.user);
        setForm({ name: res.data.user.name || '', email: res.data.user.email || '', phone: res.data.user.phone || '', role: res.data.user.role || '' });
        setPermissions(res.data.user.permissions || { sidebar: {} });
      }catch(e){ console.error(e); }
    };
    load();
  },[id]);

  const save = async ()=>{
    try{
      await axiosInstance.put(`/users/${id}`, { ...form, permissions });
      alert('User updated');
      navigate('/dashboard/admin/users');
    }catch(e){ console.error(e); alert(e?.response?.data?.message || 'Update failed'); }
  };

  if (!user) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Edit User</h2>
      <div className="bg-white p-4 rounded shadow max-w-md">
        <label className="block text-sm">Name</label>
        <input className="input mb-2" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
        <label className="block text-sm">Email</label>
        <input className="input mb-2" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
        <label className="block text-sm">Phone</label>
        <input className="input mb-2" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} />
        <label className="block text-sm">Role</label>
        <select className="input mb-4" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
          <option value="admin">admin</option>
          <option value="doctor">doctor</option>
          <option value="pharmacist">pharmacist</option>
          <option value="finance">finance</option>
          <option value="receptionist">receptionist</option>
          <option value="patient">patient</option>
          <option value="nurse">nurse</option>
        </select>
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Sidebar Permissions</h3>
          <div className="space-y-2">
            {(() => {
              const sidebarOptions = [
                { key: 'overview', label: 'Overview' },
                { key: 'profile', label: 'Profile' },
                { key: 'appointments', label: 'Appointments' },
                { key: 'patients', label: 'Patient Management' },
                { key: 'manageUsers', label: 'Manage Users' },
                { key: 'settings', label: 'Settings' },
                { key: 'doctors', label: 'Doctors' },
                { key: 'departments', label: 'Departments' },
                { key: 'doctorsSchedule', label: "Doctors' Schedule" },
                { key: 'consultations', label: 'Consultations' },
                { key: 'availableSlots', label: 'Available Slots' },
                { key: 'billing', label: 'Payments / Invoices' },
                { key: 'manageWards', label: 'Manage Wards' },
                { key: 'nurseAssignment', label: 'Nurse Assignment' },
                { key: 'inventory', label: 'Inventory' },
                { key: 'drugs', label: 'Drugs' },
                { key: 'messages', label: 'Messages' },
                { key: 'lab', label: 'Laboratory' },
                { key: 'labQueue', label: 'Lab Queue' },
                { key: 'labRequests', label: 'Lab Requests' },
              ];

              return sidebarOptions.map(opt => (
                <label key={opt.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!permissions?.sidebar?.[opt.key]}
                    onChange={e=>setPermissions(p=>({ ...p, sidebar: { ...(p.sidebar||{}), [opt.key]: e.target.checked } }))}
                  />
                  <span>{opt.label}</span>
                </label>
              ));
            })()}
          </div>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold mb-2">Action Permissions (line-by-line)</h3>
          <div className="space-y-2">
            {/* these are granular action-level permissions admins may want to toggle */}
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!permissions?.actions?.admitPatient} onChange={e=>setPermissions(p=>({ ...p, actions: { ...(p.actions||{}), admitPatient: e.target.checked } }))} />
              <span>Can admit patients</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!permissions?.actions?.registerPatient} onChange={e=>setPermissions(p=>({ ...p, actions: { ...(p.actions||{}), registerPatient: e.target.checked } }))} />
              <span>Can register patients</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!permissions?.actions?.createVisit} onChange={e=>setPermissions(p=>({ ...p, actions: { ...(p.actions||{}), createVisit: e.target.checked } }))} />
              <span>Can create visits / appointments for others</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!permissions?.actions?.manageBilling} onChange={e=>setPermissions(p=>({ ...p, actions: { ...(p.actions||{}), manageBilling: e.target.checked } }))} />
              <span>Can access billing / invoices</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!permissions?.actions?.manageUsers} onChange={e=>setPermissions(p=>({ ...p, actions: { ...(p.actions||{}), manageUsers: e.target.checked } }))} />
              <span>Can manage users (create/edit/delete)</span>
            </label>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-brand" onClick={save}>Save</button>
          <button className="btn-outline" onClick={()=>navigate('/dashboard/admin/users')}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
