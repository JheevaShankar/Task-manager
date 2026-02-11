import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ManagerDashboard from './pages/ManagerDashboard';
import TeamMemberDashboard from './pages/TeamMemberDashboard';
import KanbanBoard from './pages/KanbanBoard';
import Analytics from './pages/Analytics';
import Layout from './components/Layout';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'MANAGER' ? '/manager/dashboard' : '/team/dashboard'} />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to={user.role === 'MANAGER' ? '/manager/dashboard' : '/team/dashboard'} />} />
      
      {/* Manager Routes */}
      {user?.role === 'MANAGER' && (
        <Route path="/manager" element={<Layout />}>
          <Route index element={<Navigate to="/manager/dashboard" />} />
          <Route path="dashboard" element={<ManagerDashboard />} />
          <Route path="kanban" element={<KanbanBoard />} />
          <Route path="analytics" element={<Analytics />} />
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
        user ? <Navigate to={user.role === 'MANAGER' ? '/manager/dashboard' : '/team/dashboard'} /> : <Navigate to="/login" />
      } />
      <Route path="*" element={
        user ? <Navigate to={user.role === 'MANAGER' ? '/manager/dashboard' : '/team/dashboard'} /> : <Navigate to="/login" />
      } />
    </Routes>
  );
}

export default App;
