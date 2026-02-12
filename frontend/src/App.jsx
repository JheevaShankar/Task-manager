import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import TeamMemberDashboard from './pages/TeamMemberDashboard';
import KanbanBoard from './pages/KanbanBoard';
import Analytics from './pages/Analytics';
import ManagerReviewDashboard from './pages/ManagerReviewDashboard';
import Layout from './components/Layout';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import OfflineIndicator from './components/OfflineIndicator';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Function to get dashboard route based on role
  const getDashboardRoute = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return '/admin/dashboard';
      case 'MANAGER':
        return '/manager/dashboard';
      case 'TEAM_MEMBER':
        return '/team/dashboard';
      default:
        return '/login';
    }
  };

  return (
    <>
      <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to={getDashboardRoute(user.role)} />} />
      <Route path="/register" element={<Register />} />
      
      {/* Super Admin Routes */}
      {user?.role === 'SUPER_ADMIN' && (
        <Route path="/admin" element={<Layout />}>
          <Route index element={<Navigate to="/admin/dashboard" />} />
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="kanban" element={<KanbanBoard />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
      )}

      {/* Manager Routes */}
      {user?.role === 'MANAGER' && (
        <Route path="/manager" element={<Layout />}>
          <Route index element={<Navigate to="/manager/dashboard" />} />
          <Route path="dashboard" element={<ManagerDashboard />} />
          <Route path="kanban" element={<KanbanBoard />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="review" element={<ManagerReviewDashboard />} />
        </Route>
      )}

      {/* Team Member Routes */}
      {user?.role === 'TEAM_MEMBER' && (
        <Route path="/team" element={<Layout />}>
          <Route index element={<Navigate to="/team/dashboard" />} />
          <Route path="dashboard" element={<TeamMemberDashboard />} />
        </Route>
      )}
      
      {/* Default redirects */}
      <Route path="/" element={
        user ? <Navigate to={getDashboardRoute(user.role)} /> : <Navigate to="/login" />
      } />
      <Route path="*" element={
        user ? <Navigate to={getDashboardRoute(user.role)} /> : <Navigate to="/login" />
      } />
    </Routes>
    
    {/* PWA Install Prompt */}
    <PWAInstallPrompt />
    
    {/* Offline Indicator */}
    <OfflineIndicator />
    </>
  );
}

export default App;
