import LabDashboard from '../pages/lab/LabDashboard';
import LabQueue from '../pages/lab/LabQueue';
import LabRequests from '../pages/lab/LabRequests';
import LabTestReview from '../pages/lab/LabTestReview';
import LabTests from '../pages/lab/LabTests';

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
];

export default labRoutes;