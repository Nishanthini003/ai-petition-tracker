import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { Dashboard } from './pages/dashboard/Dashboard';
import { Profile } from './pages/profile/Profile';
import { Notifications } from './pages/notifications/Notifications';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { OfficerLogin } from './pages/officer/OfficerLogin';
import OfficerRegister from './pages/officer/OfficerRegister';
import  {OfficerDashboard}  from './pages/officer/OfficerDashboard';
import type { RootState } from './store';

// Configure future flags
const router = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

const PrivateRoute = ({ children, allowedRoles = ['user', 'department_officer', 'admin'] }) => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const App = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const isAuthenticated = Boolean(user && token);

  return (
    <Router {...router}>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
        />
        <Route
          path="/signup"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Signup />}
        />
        <Route path="/officer/login" element={<OfficerLogin />} />
        <Route path="/officer/register" element={<OfficerRegister />} />

        {/* Protected routes with DashboardLayout */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            }
          />
          <Route
            path="/notifications"
            element={
              <DashboardLayout>
                <Notifications />
              </DashboardLayout>
            }
          />
          <Route
            path="/profile"
            element={
              <DashboardLayout>
                <Profile />
              </DashboardLayout>
            }
          />
        </Route>

        {/* Officer routes */}
        <Route
          path="/officer/dashboard"
          element={
            <PrivateRoute allowedRoles={['department_officer']}>
              <OfficerDashboard />
            </PrivateRoute>
          }
        />

        {/* Redirect root to dashboard or login */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
