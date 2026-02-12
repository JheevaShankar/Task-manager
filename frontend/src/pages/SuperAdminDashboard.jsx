import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Building2, CheckCircle, Clock, TrendingUp, UserCheck, UserX } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDepartments: 0,
    totalTasks: 0,
    completedTasks: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    if (error) return; // Prevent infinite loop if there's an error
    
    try {
      setLoading(true);
      setError(false);
      
      const [deptsRes, usersRes, tasksRes] = await Promise.all([
        api.get('/departments'),
        api.get('/users'),
        api.get('/tasks')
      ]);

      console.log('Departments:', deptsRes.data);
      console.log('Users:', usersRes.data);
      console.log('Tasks:', tasksRes.data);

      setDepartments(deptsRes.data.data || []);
      
      const users = usersRes.data.data?.users || [];
      const tasks = tasksRes.data.data?.tasks || [];
      
      setStats({
        totalUsers: users.length,
        totalDepartments: deptsRes.data.count || 0,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'Done').length
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      console.error('Error response:', error.response);
      setError(true);
      toast.error('Failed to load dashboard data', { id: 'dashboard-error' });
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    // Check if user is super admin
    if (user && user.role !== 'SUPER_ADMIN') {
      navigate('/dashboard');
      return;
    }
    
    if (user?.role === 'SUPER_ADMIN' && !error) {
      fetchData();
    }
  }, [user?.role, navigate, fetchData, error]);

  const handlePromote = async (userId, deptName) => {
    if (!window.confirm(`Promote this user to Manager of ${deptName}?`)) {
      return;
    }

    try {
      await api.put(`/users/${userId}/promote`);
      toast.success('User promoted to Manager successfully!');
      fetchData(); // Refresh data
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to promote user');
    }
  };

  const handleDemote = async (userId) => {
    if (!window.confirm('Demote this Manager to Team Member?')) {
      return;
    }

    try {
      await api.put(`/users/${userId}/demote`);
      toast.success('User demoted to Team Member successfully!');
      fetchData(); // Refresh data
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to demote user');
    }
  };

  const handleRetry = () => {
    setError(false);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Dashboard</h2>
          <p className="text-gray-600 mb-6">Unable to fetch dashboard data. Please try again.</p>
          <button
            onClick={handleRetry}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage departments, users, and system overview</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <Users className="w-12 h-12 text-primary-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Departments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDepartments}</p>
              </div>
              <Building2 className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTasks}</p>
              </div>
              <Clock className="w-12 h-12 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedTasks}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
        </div>

        {/* Departments Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Departments</h2>
          </div>
          <div className="p-6">
            {departments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No departments found</p>
            ) : (
              <div className="space-y-6">
                {departments.map((dept) => (
                  <div key={dept._id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: dept.color }}
                        ></div>
                        <h3 className="text-lg font-semibold text-gray-900">{dept.name}</h3>
                        <span className="text-sm text-gray-500">
                          ({dept.members?.length || 0}/{dept.maxMembers || 5} members)
                        </span>
                      </div>
                      <button
                        onClick={() => navigate(`/departments/${dept._id}`)}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        View Details →
                      </button>
                    </div>

                    {dept.description && (
                      <p className="text-gray-600 text-sm mb-4">{dept.description}</p>
                    )}

                    {/* Department Head */}
                    {dept.departmentHead && (
                      <div className="mb-4 p-3 bg-primary-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-1">Department Manager</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{dept.departmentHead.name}</p>
                            <p className="text-sm text-gray-600">{dept.departmentHead.email}</p>
                          </div>
                          <button
                            onClick={() => handleDemote(dept.departmentHead._id)}
                            className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                          >
                            <UserX className="w-4 h-4" />
                            <span>Demote</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Team Members */}
                    {dept.members && dept.members.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Team Members</p>
                        <div className="space-y-2">
                          {dept.members
                            .filter(member => member._id !== dept.departmentHead?._id)
                            .map((member) => (
                              <div 
                                key={member._id} 
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div>
                                  <p className="font-medium text-gray-900">{member.name}</p>
                                  <p className="text-sm text-gray-600">{member.email}</p>
                                  <span className="inline-block mt-1 px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                                    {member.role === 'MANAGER' ? 'Manager' : 'Team Member'}
                                  </span>
                                </div>
                                {member.role === 'TEAM_MEMBER' && (
                                  <button
                                    onClick={() => handlePromote(member._id, dept.name)}
                                    className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm"
                                  >
                                    <UserCheck className="w-4 h-4" />
                                    <span>Promote to Manager</span>
                                  </button>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {dept.members && dept.members.length === 0 && (
                      <p className="text-gray-500 text-sm italic">No members in this department yet</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
