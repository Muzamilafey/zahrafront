import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import DataTable from '../../components/ui/DataTable';

export default function AdminUsers() {
  const { axiosInstance } = useContext(AuthContext);
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [inactive, setInactive] = useState([]);
  const [view, setView] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createRole, setCreateRole] = useState('cleaning');
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  useEffect(()=>{
    const load = async ()=>{
      try {
        const res = await axiosInstance.get('/users');
        setUsers(res.data.users || []);
        const ires = await axiosInstance.get('/users/inactive');
        setInactive(ires.data.users || []);
      } catch (err) { console.error(err); }
    };
    load();
  }, [axiosInstance]);

  const { search } = useLocation();
  useEffect(()=>{
    try{
      const params = new URLSearchParams(search);
      const r = params.get('role');
      if (r) setRoleFilter(r);
    }catch(e){}
  }, [search]);

  const changeRole = async (id)=>{
    const role = prompt('New role (admin|doctor|pharmacist|finance|receptionist|patient|nurse)');
    if(!role) return;
    try{
      await axiosInstance.put(`/users/${id}/role`, { role });
      alert('Role updated');
      const res = await axiosInstance.get('/users');
      setUsers(res.data.users || []);
    }catch(e){ alert('Update failed'); }
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user and all related data? This cannot be undone.')) return;
    try {
      await axiosInstance.delete(`/users/${id}`);
      alert('User deleted');
      const res = await axiosInstance.get('/users');
      setUsers(res.data.users || []);
      const ires = await axiosInstance.get('/users/inactive');
      setInactive(ires.data.users || []);
    } catch (e) { console.error(e); alert('Delete failed'); }
  };

  const activateUser = async (id) => {
    try {
      await axiosInstance.post(`/users/${id}/activate`);
      alert('User activated');
      const res = await axiosInstance.get('/users');
      setUsers(res.data.users || []);
      const ires = await axiosInstance.get('/users/inactive');
      setInactive(ires.data.users || []);
    } catch (e) { console.error(e); alert('Activation failed'); }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Role', accessor: 'role' },
    { header: 'Actions', accessor: 'actions' },
  ];

  const data = users.map(u=>({
    name: u.name || '-',
    email: u.email || '-',
    role: u.role || '-',
    actions: (
      <div>
        <button className="btn-brand mr-2" onClick={()=>changeRole(u._id)}>Change Role</button>
        <button className="btn-outline mr-2" onClick={()=>navigate(`/dashboard/admin/users/${u._id}`)}>Edit</button>
        <button className="btn-outline text-red-600" onClick={()=>deleteUser(u._id)}>Delete</button>
      </div>
    )
  }));

  const inactiveColumns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Role', accessor: 'role' },
    { header: 'Actions', accessor: 'actions' },
  ];

  const inactiveData = inactive.map(u=>({
    name: u.name || '-',
    email: u.email || '-',
    role: u.role || '-',
    actions: (
      <div>
        <button className="btn-brand mr-2" onClick={()=>activateUser(u._id)}>Activate</button>
        <button className="btn-outline text-red-600" onClick={()=>deleteUser(u._id)}>Delete</button>
      </div>
    )
  }));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold mb-4 text-brand-700">Users</h2>
        <div className="flex items-center gap-2">
          <button className={`text-sm px-3 py-1 rounded ${view==='all'? 'bg-brand-600 text-white':'bg-gray-100'}`} onClick={()=>setView('all')}>All</button>
          <button className={`text-sm px-3 py-1 rounded ${view==='inactive'? 'bg-brand-600 text-white':'bg-gray-100'}`} onClick={()=>setView('inactive')}>Inactive</button>
        </div>
      </div>

      <div className="bg-white rounded p-4 shadow">
        <div className="mb-3 flex gap-2 items-center">
          <button className="text-sm px-3 py-2 rounded bg-brand-600 text-white hover:bg-brand-700" onClick={()=>{ setCreateRole('cleaning'); setShowCreateModal(true); }}>Create Cleaning Staff</button>
          <button className="text-sm px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700" onClick={()=>{ setCreateRole('maintenance'); setShowCreateModal(true); }}>Create Maintenance Staff</button>
        </div>

        <div className="flex items-center justify-end mb-3 gap-2">
          <input className="input text-sm w-64" placeholder="Search by name or email" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
          <label className="text-sm text-gray-600">Filter role:</label>
          <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} className="input text-sm w-40">
            <option value="all">All roles</option>
            <option value="admin">Admin</option>
            <option value="doctor">Doctor</option>
            <option value="pharmacist">Pharmacist</option>
            <option value="finance">Finance</option>
            <option value="receptionist">Receptionist</option>
            <option value="nurse">Nurse</option>
            <option value="lab_technician">Lab Technician</option>
            <option value="patient">Patient</option>
          </select>
        </div>

        {view === 'all' ? (
          <DataTable
            columns={columns}
            data={data.filter(u=>{
              const matchesRole = roleFilter==='all' ? true : (u.role === roleFilter);
              const q = searchTerm.trim().toLowerCase();
              const matchesSearch = !q || (u.name||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q);
              return matchesRole && matchesSearch;
            })}
          />
        ) : (
          <DataTable
            columns={inactiveColumns}
            data={inactiveData.filter(u=>{
              const matchesRole = roleFilter==='all' ? true : (u.role === roleFilter);
              const q = searchTerm.trim().toLowerCase();
              const matchesSearch = !q || (u.name||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q);
              return matchesRole && matchesSearch;
            })}
          />
        )}
      </div>
    </div>
  );
}
