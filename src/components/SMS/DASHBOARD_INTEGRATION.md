/\*\*

- REACT DASHBOARD INTEGRATION GUIDE
-
- How to add the SMSModule component to your existing HMIS dashboard
  \*/

// ============ IN YOUR DASHBOARD PAGE (e.g., AdminDashboard.js or Dashboard.js) ============

import React, { useState, useEffect, useContext } from 'react';
// ... other imports
import SMSModule from '../components/SMS/SMSModule'; // ← ADD THIS IMPORT

const AdminDashboard = () => {
// ... your existing state and logic

return (
<div className="container mx-auto p-6">
<h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Existing Dashboard Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Your stat cards, patient lists, etc. */}
      </div>

      {/* ============ ADD SMS MODULE HERE ============ */}
      <div className="mt-8 border-t pt-6">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SMS Module - Standalone Component */}
          <div>
            <SMSModule />
          </div>

          {/* Or place in a tab/accordion if you have one */}
          {/* Example: <Tab label="Send SMS"><SMSModule /></Tab> */}
        </div>
      </div>

      {/* Rest of your dashboard content */}
    </div>

);
};

export default AdminDashboard;

/\*\*

- ALTERNATIVE INTEGRATION POINTS:
  \*/

// ============ OPTION 1: MODAL/DRAWER ============
// If you want SMS in a modal that opens on button click:

import Modal from '../components/ui/Modal'; // Your modal component

const AdminDashboard = () => {
const [showSMSModal, setShowSMSModal] = useState(false);

return (
<>
{/_ Your existing dashboard _/}
<button
onClick={() => setShowSMSModal(true)}
className="bg-blue-600 text-white px-4 py-2 rounded" >
Send SMS
</button>

      {/* SMS Modal */}
      <Modal isOpen={showSMSModal} onClose={() => setShowSMSModal(false)}>
        <SMSModule />
      </Modal>
    </>

);
};

// ============ OPTION 2: SIDEBAR WIDGET ============
// If you have a sidebar with quick tools:

<aside className="bg-gray-100 p-4 rounded">
  <h3 className="font-bold mb-4">Quick Tools</h3>
  <SMSModule />
</aside>

// ============ OPTION 3: TAB IN ADMIN PANEL ============
// If you have a tabbed interface:

import Tabs from '../components/ui/Tabs';

<Tabs>
  <Tab label="Overview">
    {/* Dashboard content */}
  </Tab>
  <Tab label="Send SMS">
    <SMSModule />
  </Tab>
  <Tab label="Settings">
    {/* Settings */}
  </Tab>
</Tabs>

/\*\*

- KEY POINTS:
-
- 1.  Import SMSModule where needed:
- import SMSModule from '../components/SMS/SMSModule';
-
- 2.  SMSModule is self-contained - no props needed for basic usage
-
- 3.  It handles:
- - Form validation
- - API communication
- - Loading states
- - Error/success feedback
-
- 4.  Axios is used (make sure it's installed):
- npm install axios
-
- 5.  The component POSTs to /api/send-sms automatically
-
- 6.  No additional configuration needed if using AuthContext for axios
      \*/
