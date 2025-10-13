import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';

export default function ChatPage(){
  const { axiosInstance, user, socket } = useContext(AuthContext);
  const { showToast, confirmAsync } = useUI();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [toRoles, setToRoles] = useState([]);
  const [toUsers, setToUsers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [usersList, setUsersList] = useState([]);

  useEffect(()=>{
    const load = async ()=>{
      try{
        const res = await axiosInstance.get('/messages/recent');
        setMessages(res.data.messages || []);
        // load users for admin selection
        const ures = await axiosInstance.get('/users');
        setUsersList(ures.data.users || []);
      }catch(e){ console.error(e); }
    };
    load();
  }, []);

  useEffect(()=>{
    if (!socket) return;
    const handler = (payload) => {
      const msg = payload.message;
      // ensure sender is an object with name/email
      if (msg && msg.sender && typeof msg.sender === 'string') {
        // try to resolve from usersList
        const found = usersList.find(u => u._id === msg.sender);
        msg.sender = found || { _id: msg.sender, name: 'Unknown', email: '' };
      }
      setMessages(m => [msg, ...m]);
    };
    const updateHandler = (payload) => {
      const updated = payload.message;
      setMessages(list => list.map(it => (it._id === updated._id ? updated : it)));
    };
    const deleteHandler = (payload) => {
      const id = payload.id;
      setMessages(list => list.filter(it => it._id !== id));
    };
    socket.on('message', handler);
    socket.on('message:updated', updateHandler);
    socket.on('message:deleted', deleteHandler);
    return () => {
      socket.off('message', handler);
      socket.off('message:updated', updateHandler);
      socket.off('message:deleted', deleteHandler);
    };
  }, [socket]);

  const send = async ()=>{
    if (!text.trim()) return;
    try{
      await axiosInstance.post('/messages', { text, toRoles, toUsers });
      setText('');
      showToast({ message: 'Message sent', type: 'success' });
    }catch(e){ console.error(e); showToast({ message: e?.response?.data?.message || 'Failed to send', type: 'error' }); }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Messages</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded p-4 shadow">
          <div className="space-y-3 max-h-[60vh] overflow-auto">
            {messages.map(m=> (
              <div key={m._id || `${(m.sender && (m.sender._id || m.sender)) ? (m.sender._id || m.sender) : 's'}-${m.createdAt}`} className="p-2 border-b">
                <div className="flex items-start justify-between">
                  <div className="text-sm text-gray-500">
                    {m.sender ? (((m.sender._id || m.sender) === (user && (user.id || user._id))) ? 'You' : (m.sender.name || m.sender.email || 'Unknown')) : 'system'}
                    <span className="text-xs ml-2 text-gray-400">{m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}</span>
                  </div>
                  {user?.role === 'admin' && (
                    <div className="flex gap-2">
                      <button className="text-xs text-blue-600" onClick={()=>{
                        setEditingId(m._id); setEditingText(m.text); setToRoles(m.toRoles || []); setToUsers((m.toUsers||[]).map(u=>u._id || u));
                      }}>Edit</button>
                      <button className="text-xs text-red-600" onClick={async ()=>{ const ok = await confirmAsync('Delete message','Are you sure you want to delete this message?'); if(ok){ const success = await deleteMessage(axiosInstance, m._id, showToast); if(success){ setMessages(list=>list.filter(it=>it._id!==m._id)); } } }}>Delete</button>
                    </div>
                  )}
                </div>
                <div className="mt-1">
                  {editingId === m._id ? (
                    <div>
                      <textarea className="input w-full" value={editingText} onChange={e=>setEditingText(e.target.value)} />
                      <div className="flex gap-2 mt-2">
                        <button className="btn" onClick={async ()=>{
                          try{
                            const updated = await editMessage(axiosInstance, m._id, editingText, toRoles, toUsers, showToast);
                            setMessages(list=>list.map(it=>it._id===updated._id ? updated : it));
                            setEditingId(null); setEditingText(''); setToRoles([]); setToUsers([]);
                          }catch(e){ }
                        }}>Save</button>
                        <button className="btn btn-ghost" onClick={()=>{ setEditingId(null); setEditingText(''); setToRoles([]); setToUsers([]); }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div>{m.text}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded p-4 shadow">
          <div className="mb-3">
            <label className="text-xs text-gray-500">Message</label>
            <textarea className="input w-full" value={text} onChange={e=>setText(e.target.value)} />
          </div>
          {/* admin can pick recipients */}
          {user?.role === 'admin' && (
            <div className="mb-3">
              <label className="text-xs text-gray-500">Send to roles</label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {['admin','doctor','nurse','finance','pharmacist','lab_technician','receptionist'].map(r => (
                  <label key={r} className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={toRoles.includes(r)} onChange={e=>{
                      if(e.target.checked) setToRoles(tr=>[...tr, r]); else setToRoles(tr=>tr.filter(x=>x!==r));
                    }} />
                    <span className="text-sm">{r.replace('_',' ')}</span>
                  </label>
                ))}
              </div>
              <label className="text-xs text-gray-500 mt-2">Or select users</label>
              <select className="input w-full" multiple value={toUsers} onChange={e=>setToUsers(Array.from(e.target.selectedOptions).map(o=>o.value))}>
                {usersList.map(u=>(<option key={u._id} value={u._id}>{u.name || u.email} ({u.role})</option>))}
              </select>
            </div>
          )}
          <div className="flex justify-end">
            <button className="btn" onClick={send}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// edit / delete helpers for admin
async function editMessage(axiosInstance, id, text, toRoles, toUsers, showToast){
  try{
    const res = await axiosInstance.put(`/messages/${id}`, { text, toRoles, toUsers });
    showToast({ message: 'Message updated', type: 'success' });
    return res.data.message;
  }catch(e){ showToast({ message: 'Update failed', type: 'error' }); throw e; }
}

async function deleteMessage(axiosInstance, id, showToast){
  try{
    const res = await axiosInstance.delete(`/messages/${id}`);
    if (res && res.status >= 200 && res.status < 300) {
      showToast({ message: 'Message deleted', type: 'success' });
      return true;
    }
    console.error('Delete unexpected response', res);
    showToast({ message: 'Delete failed', type: 'error' });
    return false;
  }catch(e){
    console.error('Delete error', e.response?.data || e.message || e);
    showToast({ message: e?.response?.data?.message || 'Delete failed', type: 'error' });
    return false;
  }
}
