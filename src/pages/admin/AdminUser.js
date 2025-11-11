import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

export default function AdminUser(){
  const { id } = useParams();
  const navigate = useNavigate();
  const { axiosInstance, user: me } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name:'', email:'', phone:'', role:'' });
  const [permissions, setPermissions] = useState({ sidebar: {} });
  const [originalPermissions, setOriginalPermissions] = useState(null);

  useEffect(()=>{
    const load = async ()=>{
      try{
        const res = await axiosInstance.get(`/users/${id}`);
        setUser(res.data.user);
        setForm({ name: res.data.user.name || '', email: res.data.user.email || '', phone: res.data.user.phone || '', role: res.data.user.role || '' });
        const perms = res.data.user.permissions || { sidebar: {} };
        setPermissions(perms);
        setOriginalPermissions(JSON.parse(JSON.stringify(perms)));
      }catch(e){ console.error(e); }
    };
    load();
  },[id]);

  const save = async ()=>{
    // if permissions changed dramatically, ask for confirmation before saving
    try{
      const changes = countPermissionChanges(originalPermissions || {}, permissions || {});
      if (changes > 3) {
        setConfirmAction('save');
        setConfirmOpen(true);
        return;
      }
      await performSave();
    }catch(e){ console.error(e); alert(e?.response?.data?.message || 'Update failed'); }
  };

  const performSave = async () => {
    try{
      const res = await axiosInstance.put(`/users/${id}`, { ...form, permissions });
      console.debug('AdminUser performSave response', res?.data);
      showToast('User updated', 'success');
      navigate('/dashboard/admin/users');
    }catch(e){ console.error(e); alert(e?.response?.data?.message || 'Update failed'); }
  };

  const countPermissionChanges = (a, b) => {
    // shallow compare keys in sidebar and actions
    const keys = new Set();
    Object.keys(a.sidebar || {}).forEach(k=>keys.add(`s:${k}`));
    Object.keys(b.sidebar || {}).forEach(k=>keys.add(`s:${k}`));
    Object.keys(a.actions || {}).forEach(k=>keys.add(`a:${k}`));
    Object.keys(b.actions || {}).forEach(k=>keys.add(`a:${k}`));
    let changes = 0;
    keys.forEach(k=>{
      const [type, key] = k.split(':');
      const aVal = (type==='s' ? (a.sidebar||{})[key] : (a.actions||{})[key]);
      const bVal = (type==='s' ? (b.sidebar||{})[key] : (b.actions||{})[key]);
      if (String(aVal) !== String(bVal)) changes++;
    });
    return changes;
  };

  const copyMyPermissions = () => {
    if (!me) return alert('Unable to read your permissions');
    const myPerms = me.permissions || { sidebar: {}, actions: {} };
    // shallow copy to avoid shared references
    setPermissions({
      sidebar: { ...(myPerms.sidebar || {}) },
      actions: { ...(myPerms.actions || {}) }
    });
  };

  const resetPermissions = () => {
    setPermissions({ sidebar: {}, actions: {} });
  };

  // confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(''); // 'copy' | 'reset'

  // toast state
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  const handleConfirmOpen = (action) => {
    setConfirmAction(action);
    setConfirmOpen(true);
  };

  const handleConfirmCancel = () => {
    setConfirmOpen(false);
    setConfirmAction('');
  };

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3500);
  };

  const handleConfirmProceed = () => {
    setConfirmOpen(false);
    if (confirmAction === 'copy') {
      copyMyPermissions();
      showToast('Permissions copied to user', 'success');
    } else if (confirmAction === 'reset') {
      resetPermissions();
      showToast('Permissions reset', 'warning');
    } else if (confirmAction === 'save') {
      // proceed with save despite dramatic changes
      performSave();
    }
    setConfirmAction('');
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
        <div className="flex gap-2 items-center">
          <button className="btn-brand" onClick={save}>Save</button>
          <button className="btn-outline" onClick={()=>navigate('/dashboard/admin/users')}>Cancel</button>
          <button className="btn-secondary" onClick={()=>handleConfirmOpen('copy')} title="Copy your own permissions into this user">Copy my permissions</button>
          <button className="btn-danger" onClick={()=>handleConfirmOpen('reset')} title="Clear all permissions">Reset permissions</button>
        </div>
      </div>
      {/* confirmation modal */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">{
              confirmAction === 'copy' ? 'Confirm Copy Permissions' : confirmAction === 'reset' ? 'Confirm Reset Permissions' : 'Confirm Save'
            }</h3>
            <p className="mb-4 text-sm text-gray-700">{
              confirmAction === 'copy' ? 'Are you sure you want to copy your permissions into this user? This can be undone by editing the user again.' :
              confirmAction === 'reset' ? 'Are you sure you want to reset this user\'s permissions to none? This action can be undone by editing the user again.' :
              'You have made large permission changes. Are you sure you want to save these changes?'
            }</p>
            <div className="flex justify-end gap-2">
              <button className="btn-outline" onClick={handleConfirmCancel}>Cancel</button>
              <button className="btn-brand" onClick={handleConfirmProceed}>{confirmAction === 'save' ? 'Save changes' : confirmAction === 'copy' ? 'Copy permissions' : 'Reset permissions'}</button>
            </div>
          </div>
        </div>
      )}

      {/* toast */}
      {toast.visible && (
        <div className="fixed right-4 top-4 z-50">
          <div className={`p-3 rounded shadow-sm text-white ${toast.type === 'success' ? 'bg-green-600' : toast.type === 'warning' ? 'bg-yellow-600 text-black' : 'bg-blue-600'}`}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
