import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    
    // Set up role change detection (check every 30 seconds)
    const roleCheckInterval = setInterval(() => {
      if (user) {
        checkForRoleChange();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(roleCheckInterval);
  }, [user]);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await authAPI.getMe();
        setUser(response.data.data.user);
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  const checkForRoleChange = async () => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;

    try {
      const response = await authAPI.getMe();
      const latestUser = response.data.data.user;
      
      // Check if role has changed
      if (latestUser.role !== user.role) {
        const oldRole = user.role;
        const newRole = latestUser.role;
        
        // Update user state
        setUser(latestUser);
        
        // Show notification based on promotion/demotion
        if (newRole === 'MANAGER' && oldRole === 'TEAM_MEMBER') {
          toast.success('🎉 Congratulations! You have been promoted to Manager!', { duration: 5000 });
        } else if (newRole === 'TEAM_MEMBER' && oldRole === 'MANAGER') {
          toast.info('Your role has been changed to Team Member', { duration: 5000 });
        } else if (newRole === 'SUPER_ADMIN') {
          toast.success('🎉 You have been promoted to Super Admin!', { duration: 5000 });
        }
        
        // Redirect to appropriate dashboard
        setTimeout(() => {
          const dashboardRoute = getDashboardRoute(newRole);
          window.location.href = dashboardRoute; // Force full page reload
        }, 2000);
      }
    } catch (error) {
      // Silently handle errors in background check
      console.error('Role check error:', error);
    }
  };

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

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { user, token } = response.data.data;
      localStorage.setItem('token', token);
      setUser(user);
      toast.success('Login successful!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { user, token } = response.data.data;
      localStorage.setItem('token', token);
      setUser(user);
      toast.success('Registration successful!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser: checkAuth // Expose for manual refresh
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
