import React, { useState } from 'react';
import axios from 'axios';

const SMSModule = () => {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [feedbackType, setFeedbackType] = useState(''); // 'success' or 'error'

  /**
   * Validate phone number format
   */
  const isValidPhone = (phoneStr) => {
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    return phoneRegex.test(phoneStr.trim());
  };

  /**
   * Handle send SMS
   */
  const handleSendSMS = async (e) => {
    e.preventDefault();
    
    // ============ FRONTEND VALIDATION ============
    if (!phone.trim() || !message.trim()) {
      setFeedback('Please fill in both phone number and message');
      setFeedbackType('error');
      return;
    }

    if (!isValidPhone(phone)) {
      setFeedback('Invalid phone number. Use format: +254712345678 or 0712345678');
      setFeedbackType('error');
      return;
    }

    if (message.trim().length < 1) {
      setFeedback('Message cannot be empty');
      setFeedbackType('error');
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      // ============ SEND REQUEST ============
      const response = await axios.post('/api/send-sms', {
        phone: phone.trim(),
        message: message.trim()
      });

      // ============ HANDLE SUCCESS ============
      if (response.data.status === 'success') {
        setFeedback('SMS sent successfully!');
        setFeedbackType('success');
        // Clear form after success
        setPhone('');
        setMessage('');
      } else if (response.data.status === 'partial') {
        setFeedback(`${response.data.message}. Check details.`);
        setFeedbackType('error');
      } else {
        setFeedback(response.data.error || 'Failed to send SMS');
        setFeedbackType('error');
      }
    } catch (error) {
      // ============ HANDLE ERROR ============
      const errorMsg = error.response?.data?.error || error.message || 'Network error. Please try again.';
      setFeedback(errorMsg);
      setFeedbackType('error');
      console.error('[SMS Module] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear feedback
   */
  const clearFeedback = () => {
    setFeedback(null);
    setFeedbackType('');
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 max-w-md mx-auto border border-gray-200">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Send SMS</h2>

      <form onSubmit={handleSendSMS} className="space-y-4">
        {/* Phone Number Input */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="+254712345678 or 0712345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Message Textarea */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            id="message"
            rows="4"
            placeholder="Enter your SMS message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={loading}
            maxLength="160"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            {message.length}/160 characters
          </p>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div
            className={`p-3 rounded-lg text-sm font-medium flex justify-between items-center ${
              feedbackType === 'success'
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}
          >
            <span>{feedback}</span>
            <button
              type="button"
              onClick={clearFeedback}
              className="ml-2 text-lg font-bold hover:opacity-70"
            >
              ×
            </button>
          </div>
        )}

        {/* Send Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-lg font-bold text-white transition ${
            loading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
          }`}
        >
          {loading ? 'Sending...' : 'Send SMS'}
        </button>
      </form>

      {/* Help Text */}
      <div className="mt-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
        <p className="font-semibold mb-1">📋 Format:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Phone: +254712345678 or 0712345678</li>
          <li>Max 160 characters per SMS</li>
          <li>All fields are required</li>
        </ul>
      </div>
    </div>
  );
};

export default SMSModule;
