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
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-primary-600"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Building2 className="w-8 h-8 text-primary-600 animate-pulse" />
          </div>
        </div>
        <p className="mt-6 text-lg font-semibold text-gray-700 animate-pulse">Loading Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-50 via-red-50 to-orange-50">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <div className="text-white text-6xl">⚠️</div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">We couldn't load the dashboard data. Please check your connection and try again.</p>
          <button
            onClick={handleRetry}
            className="px-8 py-4 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-2xl hover:from-primary-700 hover:to-purple-700 transition-all font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center space-x-2 mx-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Retry Loading</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-1 h-12 bg-gradient-to-b from-primary-600 to-purple-600 rounded-full"></div>
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">Super Admin Dashboard</h1>
              <p className="text-gray-600 mt-1 text-lg">Manage departments, users, and system overview</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-100 hover:scale-105 cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Users</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-2">{stats.totalUsers}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center"><TrendingUp className="w-3 h-3 mr-1" />Active</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-100 hover:scale-105 cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Departments</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-2">{stats.totalDepartments}</p>
                <p className="text-xs text-blue-600 mt-1 flex items-center"><Building2 className="w-3 h-3 mr-1" />Teams</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <Building2 className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-100 hover:scale-105 cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Tasks</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-2">{stats.totalTasks}</p>
                <p className="text-xs text-orange-600 mt-1 flex items-center"><Clock className="w-3 h-3 mr-1" />In Progress</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <Clock className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-100 hover:scale-105 cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Completed</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-2">{stats.completedTasks}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center"><CheckCircle className="w-3 h-3 mr-1" />Done</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Departments Section */}
        <div className="bg-white rounded-2xl shadow-xl mb-8 border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 bg-gradient-to-r from-primary-50 to-purple-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Building2 className="w-6 h-6 text-primary-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Departments Overview</h2>
              </div>
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                {departments.length} Active
              </span>
            </div>
          </div>
          <div className="p-6">
            {departments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No departments found</p>
            ) : (
              <div className="space-y-6">
                {departments.map((dept) => (
                  <div key={dept._id} className="border-2 border-gray-100 rounded-2xl p-6 hover:border-primary-300 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center space-x-4">
                        <div 
                          className="w-12 h-12 rounded-xl shadow-lg flex items-center justify-center" 
                          style={{ background: `linear-gradient(135deg, ${dept.color}, ${dept.color}dd)` }}
                        >
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{dept.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                              {dept.members?.length || 0}/{dept.maxMembers || 5} Members
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              (dept.members?.length || 0) >= (dept.maxMembers || 5) 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {(dept.members?.length || 0) >= (dept.maxMembers || 5) ? 'Full' : 'Open'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/departments/${dept._id}`)}
                        className="px-4 py-2 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-xl hover:from-primary-700 hover:to-purple-700 transition-all font-medium shadow-lg hover:shadow-xl flex items-center space-x-2"
                      >
                        <span>View Details</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>

                    {dept.description && (
                      <p className="text-gray-600 text-sm mb-5 leading-relaxed">{dept.description}</p>
                    )}

                    {/* Department Head */}
                    {dept.departmentHead && (
                      <div className="mb-5 p-4 bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl border-l-4 border-primary-500 shadow-sm">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="p-1.5 bg-primary-100 rounded-lg">
                            <UserCheck className="w-4 h-4 text-primary-600" />
                          </div>
                          <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">Department Manager</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                              {dept.departmentHead.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{dept.departmentHead.name}</p>
                              <p className="text-sm text-gray-600">{dept.departmentHead.email}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDemote(dept.departmentHead._id)}
                            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all text-sm font-semibold shadow-lg hover:shadow-xl"
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
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="p-1.5 bg-blue-100 rounded-lg">
                            <Users className="w-4 h-4 text-blue-600" />
                          </div>
                          <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">Team Members</p>
                        </div>
                        <div className="space-y-3">
                          {dept.members
                            .filter(member => member._id !== dept.departmentHead?._id)
                            .map((member) => (
                              <div 
                                key={member._id} 
                                className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all duration-300"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                                    {member.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-900">{member.name}</p>
                                    <p className="text-sm text-gray-600">{member.email}</p>
                                    <span className={`inline-block mt-1 px-3 py-1 text-xs font-semibold rounded-full ${
                                      member.role === 'MANAGER' 
                                        ? 'bg-purple-100 text-purple-700' 
                                        : 'bg-blue-100 text-blue-700'
                                    }`}>
                                      {member.role === 'MANAGER' ? '👔 Manager' : '👤 Team Member'}
                                    </span>
                                  </div>
                                </div>
                                {member.role === 'TEAM_MEMBER' && (
                                  <button
                                    onClick={() => handlePromote(member._id, dept.name)}
                                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all text-sm font-semibold shadow-lg hover:shadow-xl"
                                  >
                                    <UserCheck className="w-4 h-4" />
                                    <span>Promote</span>
                                  </button>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {dept.members && dept.members.length === 0 && (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-sm font-medium">No members in this department yet</p>
                        <p className="text-gray-400 text-xs mt-1">Add members to get started</p>
                      </div>
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
