import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function AdminNotifications(){
  const { axiosInstance } = useContext(AuthContext);
  const [notes, setNotes] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [currentNoteId, setCurrentNoteId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successText, setSuccessText] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorText, setErrorText] = useState('');

  // load notifications
  useEffect(()=>{
    const load = async ()=>{
      try{ const res = await axiosInstance.get('/notifications/recent'); setNotes(res.data.notifications || []); }catch(e){ console.error(e); }
    };
    load();
  },[]);

  // load saved recipient from localStorage
  useEffect(()=>{
    try{
      const saved = localStorage.getItem('notificationRecipient');
      if (saved) setRecipient(saved);
    }catch(e){ /* ignore */ }
  },[]);

  const openModal = (noteId)=>{
    setCurrentNoteId(noteId);
    setModalOpen(true);
  };

  const closeModal = ()=>{
    setModalOpen(false);
    setCurrentNoteId(null);
  };

  const sendEmail = async ()=>{
    if (!recipient) { alert('Please enter an email'); return; }
    if (!currentNoteId) return;
    setLoading(true);
    try{
      await axiosInstance.post(`/notifications/${currentNoteId}/export-email`, { to: recipient });
      // save for subsequent uses
      try{ localStorage.setItem('notificationRecipient', recipient); }catch(e){}
      setSuccessText('Email sent successfully');
      setSuccessVisible(true);
      closeModal();
      // auto-hide after 2s
      setTimeout(()=> setSuccessVisible(false), 2000);
    }catch(e){
      console.error(e);
      setErrorText('Failed to send email');
      setErrorVisible(true);
      setTimeout(()=> setErrorVisible(false), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mt-0 mb-0 text-brand-700">Notifications</h2>
      <div className="bg-white rounded p-4 shadow">
        {notes.length === 0 ? (
          <p className="text-sm text-gray-500">No notifications yet.</p>
        ) : (
          <ul className="space-y-3">
            {notes.map((n)=> (
              <li key={n._id} className="border rounded p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-semibold">
                      {n.action} {n.user ? (<span className="text-xs text-gray-500">— {n.user.email}</span>) : (<span className="text-xs text-gray-400">— system</span>)}
                    </div>
                    <div className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    {n.user ? (
                      <div>
                        <div className="font-medium">{n.user.name || n.user.email}</div>
                        <div>{n.user.email}</div>
                        <div className="text-xs">role: {n.user.role}</div>
                      </div>
                    ) : (<div className="text-xs text-gray-400">system</div>)}
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-700">{n.description}</div>
                <div className="mt-3 flex justify-end">
                  <button className="btn-outline mr-2" onClick={()=>openModal(n._id)}>Export to PDF & Email</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={closeModal}>
          <div className="absolute inset-0 bg-black opacity-40" />
          <div className="relative bg-white rounded p-4 w-full max-w-md mx-4" onClick={(e)=>e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Send notification PDF to (email)</h3>
            <input
              type="email"
              className="w-full border rounded p-2 mb-3"
              placeholder="recipient@example.com"
              value={recipient}
              onChange={(e)=>setRecipient(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <button className="btn-outline" onClick={closeModal} disabled={loading}>Cancel</button>
              <button className="btn-primary" onClick={sendEmail} disabled={loading}>
                {loading ? 'Sending...' : 'Send & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success / Error toasts/modals */}
      {successVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={()=>setSuccessVisible(false)}>
          <div className="absolute inset-0 bg-black opacity-40" />
          <div className="relative bg-white rounded p-6 w-full max-w-sm mx-4 text-center" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-center mb-4">
              <div className="w-24 h-24 flex items-center justify-center bg-green-50 rounded-full">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17L4 12" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
            <div className="font-semibold text-lg mb-2">{successText}</div>
            <div className="text-sm text-gray-600">This window will close automatically.</div>
          </div>
        </div>
      )}

      {errorVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={()=>setErrorVisible(false)}>
          <div className="absolute inset-0 bg-black opacity-40" />
          <div className="relative bg-white rounded p-6 w-full max-w-sm mx-4 text-center" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-center mb-4">
              <div className="w-24 h-24 flex items-center justify-center bg-red-50 rounded-full">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 8v4" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 17h.01" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
            <div className="font-semibold text-lg mb-2">{errorText}</div>
            <div className="text-sm text-gray-600">Please try again or check server logs.</div>
          </div>
        </div>
      )}
    </div>
  );
}
