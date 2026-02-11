import { useState, useEffect } from 'react';
import { taskAPI } from '../services/api';
import { Plus, Users, Clock, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import TaskModal from '../components/TaskModal';
import TaskCard from '../components/TaskCard';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ManagerDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [tasksRes, membersRes, overviewRes] = await Promise.all([
        taskAPI.getTasks({ sortBy: 'priority' }),
        axios.get(`${API_URL}/team/members`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/team/overview`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setTasks(tasksRes.data.data.tasks);
      setTeamMembers(membersRes.data.data.teamMembers);
      setOverview(overviewRes.data.data.overview);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setShowModal(true);
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setShowModal(true);
  };

  const handleTaskSaved = () => {
    setShowModal(false);
    fetchData();
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskAPI.deleteTask(taskId);
        toast.success('Task deleted successfully');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete task');
      }
    }
  };

  const filteredTasks = filterStatus === 'all' 
    ? tasks 
    : tasks.filter(task => task.status === filterStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor team tasks and performance</p>
        </div>
        <button
          onClick={handleCreateTask}
          className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Assign New Task</span>
        </button>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Tasks"
            value={overview.totalTasks}
            icon={Clock}
            color="blue"
          />
          <StatCard
            title="Completed"
            value={overview.completedTasks}
            icon={CheckCircle2}
            color="green"
          />
          <StatCard
            title="Overdue"
            value={overview.overdueTasks}
            icon={AlertCircle}
            color="red"
          />
          <StatCard
            title="Team Members"
            value={overview.teamMembers}
            icon={Users}
            color="purple"
          />
        </div>
      )}

      {/* Additional Metrics */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Distribution</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">High Priority</span>
                <span className="font-semibold text-red-600">{overview.highPriorityTasks}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Medium Priority</span>
                <span className="font-semibold text-yellow-600">{overview.mediumPriorityTasks}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Low Priority</span>
                <span className="font-semibold text-green-600">{overview.lowPriorityTasks}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">To-Do</span>
                <span className="font-semibold text-gray-700">{overview.todoTasks}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">In Progress</span>
                <span className="font-semibold text-blue-600">{overview.inProgressTasks}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Completed</span>
                <span className="font-semibold text-green-600">{overview.completedTasks}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h3>
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-3xl font-bold text-gray-900">{overview.upcomingDeadlines}</p>
                <p className="text-sm text-gray-600">Tasks due in 7 days</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-lg ${filterStatus === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          All
        </button>
        <button
          onClick={() => setFilterStatus('To-Do')}
          className={`px-4 py-2 rounded-lg ${filterStatus === 'To-Do' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          To-Do
        </button>
        <button
          onClick={() => setFilterStatus('In-Progress')}
          className={`px-4 py-2 rounded-lg ${filterStatus === 'In-Progress' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          In Progress
        </button>
        <button
          onClick={() => setFilterStatus('Done')}
          className={`px-4 py-2 rounded-lg ${filterStatus === 'Done' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Done
        </button>
        <button
          onClick={() => setFilterStatus('Overdue')}
          className={`px-4 py-2 rounded-lg ${filterStatus === 'Overdue' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Overdue
        </button>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map(task => (
          <TaskCard
            key={task._id}
            task={task}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
          />
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No tasks found</p>
          <button
            onClick={handleCreateTask}
            className="mt-4 text-primary-600 hover:text-primary-700"
          >
            Create your first task
          </button>
        </div>
      )}

      {/* Task Modal */}
      {showModal && (
        <TaskModal
          task={selectedTask}
          teamMembers={teamMembers}
          onClose={() => setShowModal(false)}
          onSave={handleTaskSaved}
        />
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    orange: 'bg-orange-100 text-orange-600'
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
