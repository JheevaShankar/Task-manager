import { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const Analytics = () => {
  const [overview, setOverview] = useState(null);
  const [productivity, setProductivity] = useState(null);
  const [distribution, setDistribution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      const [overviewRes, productivityRes, distributionRes] = await Promise.all([
        analyticsAPI.getOverview(),
        analyticsAPI.getProductivity(period),
        analyticsAPI.getPriorityDistribution()
      ]);
      
      setOverview(overviewRes.data.data.overview);
      setProductivity(productivityRes.data.data.productivity);
      setDistribution(distributionRes.data.data.distribution);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Prepare chart data
  const priorityData = distribution ? [
    { name: 'High', value: distribution.High, color: '#ef4444' },
    { name: 'Medium', value: distribution.Medium, color: '#f59e0b' },
    { name: 'Low', value: distribution.Low, color: '#10b981' }
  ] : [];

  const dailyCompletionData = productivity?.dailyCompletion
    ? Object.entries(productivity.dailyCompletion).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completed: count
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Track your productivity and progress</p>
        </div>
        
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="7d">Last 7 days</option>
          <option value="14d">Last 14 days</option>
          <option value="30d">Last 30 days</option>
        </select>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Tasks"
            value={overview.totalTasks}
            icon={Clock}
            color="blue"
          />
          <MetricCard
            title="Completion Rate"
            value={`${overview.completionRate}%`}
            icon={CheckCircle}
            color="green"
          />
          <MetricCard
            title="High Priority"
            value={overview.highPriorityTasks}
            icon={AlertCircle}
            color="red"
          />
          <MetricCard
            title="Overdue"
            value={overview.overdueTasks}
            icon={TrendingUp}
            color="orange"
          />
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Completion Line Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Completions</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyCompletionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="completed" stroke="#0ea5e9" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Productivity Stats */}
      {productivity && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Productivity Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-600">{productivity.totalCompleted}</p>
              <p className="text-gray-600 mt-1">Tasks Completed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-600">
                {productivity.avgCompletionTime > 0 ? `${productivity.avgCompletionTime}m` : 'N/A'}
              </p>
              <p className="text-gray-600 mt-1">Avg Completion Time</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-600">{productivity.period}</p>
              <p className="text-gray-600 mt-1">Time Period</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ title, value, icon: Icon, color }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    orange: 'bg-orange-100 text-orange-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default Analytics;
