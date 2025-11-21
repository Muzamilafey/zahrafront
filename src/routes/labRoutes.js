import LabDashboard from '../pages/lab/LabDashboard';
import LabQueue from '../pages/lab/LabQueue';
import LabRequests from '../pages/lab/LabRequests';
import LabTestReview from '../pages/lab/LabTestReview';
import LabTests from '../pages/lab/LabTests';
import LabTestDetail from '../pages/lab/LabTestDetail'; // Import the new component

const labRoutes = [
  {
    path: '/dashboard/lab',
    component: LabDashboard,
    exact: true,
  },
  {
    path: '/dashboard/lab/queue',
    component: LabQueue,
  },
  {
    path: '/dashboard/lab/requests',
    component: LabRequests,
  },
  {
    path: '/dashboard/lab/review',
    component: LabTestReview,
  },
  {
    path: '/dashboard/lab/tests',
    component: LabTests,
  },
  {
    path: '/labtests/:id', // Add the new route for LabTestDetail
    component: LabTestDetail,
  },
];

export default labRoutes;