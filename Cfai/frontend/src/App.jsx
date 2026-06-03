import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import Candidates from './pages/admin/Candidates';
import Interviewers from './pages/admin/Interviewers';
import Rooms from './pages/admin/Rooms';
import Slots from './pages/admin/Slots';
import Constraints from './pages/admin/Constraints';
import GenerateSchedule from './pages/admin/GenerateSchedule';
import Schedule from './pages/admin/Schedule';

// Interviewer
import InterviewerDashboard from './pages/interviewer/InterviewerDashboard';
import MySchedule from './pages/interviewer/MySchedule';
import InterviewerAvailability from './pages/interviewer/Availability';

// Candidate
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import MyInterviews from './pages/candidate/MyInterviews';
import CandidateAvailability from './pages/candidate/Availability';

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'candidate') return <Navigate to="/candidate" replace />;
  if (user.role === 'interviewer') return <Navigate to="/interviewer" replace />;
  return <Navigate to="/admin" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin & HR — shared */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin','hr']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/candidates" element={<ProtectedRoute roles={['admin','hr']}><Candidates /></ProtectedRoute>} />
      <Route path="/admin/generate" element={<ProtectedRoute roles={['admin','hr']}><GenerateSchedule /></ProtectedRoute>} />
      <Route path="/admin/schedule" element={<ProtectedRoute roles={['admin','hr']}><Schedule /></ProtectedRoute>} />

      {/* Admin only */}
      <Route path="/admin/interviewers" element={<ProtectedRoute roles={['admin']}><Interviewers /></ProtectedRoute>} />
      <Route path="/admin/rooms" element={<ProtectedRoute roles={['admin']}><Rooms /></ProtectedRoute>} />
      <Route path="/admin/slots" element={<ProtectedRoute roles={['admin']}><Slots /></ProtectedRoute>} />
      <Route path="/admin/constraints" element={<ProtectedRoute roles={['admin']}><Constraints /></ProtectedRoute>} />

      {/* Interviewer */}
      <Route path="/interviewer" element={<ProtectedRoute roles={['interviewer']}><InterviewerDashboard /></ProtectedRoute>} />
      <Route path="/interviewer/schedule" element={<ProtectedRoute roles={['interviewer']}><MySchedule /></ProtectedRoute>} />
      <Route path="/interviewer/availability" element={<ProtectedRoute roles={['interviewer']}><InterviewerAvailability /></ProtectedRoute>} />

      {/* Candidate */}
      <Route path="/candidate" element={<ProtectedRoute roles={['candidate']}><CandidateDashboard /></ProtectedRoute>} />
      <Route path="/candidate/interviews" element={<ProtectedRoute roles={['candidate']}><MyInterviews /></ProtectedRoute>} />
      <Route path="/candidate/availability" element={<ProtectedRoute roles={['candidate']}><CandidateAvailability /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1a1a2e', color: '#e2e8f0', border: '1px solid rgba(99,102,241,0.2)' }
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
