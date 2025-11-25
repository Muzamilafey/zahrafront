import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { FaMessage, FaUser, FaClock } from 'react-icons/fa6';

const AdminMessages = () => {
  const { axiosInstance } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/messages');
      setMessages(response.data.messages || response.data || []);
      setError('');
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setError('Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedMessage) return;

    setSending(true);
    try {
      await axiosInstance.post(`/messages/${selectedMessage._id}/reply`, {
        content: replyText.trim()
      });
      setReplyText('');
      fetchMessages();
      alert('Reply sent successfully');
    } catch (err) {
      console.error('Failed to send reply:', err);
      alert('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading messages...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2 mb-2">
          <FaMessage className="text-blue-600" />
          Messages
        </h1>
        <p className="text-gray-600">Manage staff and patient messages</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow border border-gray-200">
          <div className="p-4 border-b">
            <h2 className="font-bold text-lg">Messages ({messages.length})</h2>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="p-4 text-gray-500 text-center">No messages</div>
            ) : (
              messages.map((msg) => (
                <button
                  key={msg._id}
                  onClick={() => setSelectedMessage(msg)}
                  className={`w-full p-3 text-left border-b hover:bg-gray-50 transition ${
                    selectedMessage?._id === msg._id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <FaUser className="text-gray-400 mt-1 text-sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{msg.senderName || msg.from || 'Unknown'}</p>
                      <p className="text-xs text-gray-500 truncate">{msg.subject || msg.title || 'No subject'}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        <FaClock className="inline mr-1" />
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow border border-gray-200">
          {selectedMessage ? (
            <>
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold mb-2">{selectedMessage.subject || selectedMessage.title || 'Message'}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span><strong>From:</strong> {selectedMessage.senderName || selectedMessage.from || 'Unknown'}</span>
                  <span><strong>Date:</strong> {selectedMessage.createdAt ? new Date(selectedMessage.createdAt).toLocaleString() : 'N/A'}</span>
                </div>
                {selectedMessage.contact && (
                  <p className="text-sm text-gray-600"><strong>Contact:</strong> {selectedMessage.contact}</p>
                )}
              </div>

              <div className="p-6 border-b bg-gray-50 max-h-48 overflow-y-auto">
                <p className="text-gray-800 whitespace-pre-wrap">{selectedMessage.content || selectedMessage.message || 'No content'}</p>
              </div>

              {/* Reply Section */}
              <div className="p-6">
                <h3 className="font-bold mb-3">Reply</h3>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply here..."
                  disabled={sending}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none h-24 disabled:bg-gray-100"
                />
                <button
                  onClick={handleSendReply}
                  disabled={sending || !replyText.trim()}
                  className={`mt-3 px-6 py-2 rounded font-medium ${
                    sending || !replyText.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {sending ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <FaMessage className="text-4xl mx-auto mb-3 opacity-50" />
              <p>Select a message to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;
