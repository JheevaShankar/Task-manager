import { useState, useEffect } from 'react';
import { taskAPI, analyticsAPI } from '../services/api';
import { Plus, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import TaskModal from '../components/TaskModal';
import TaskCard from '../components/TaskCard';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, analyticsRes] = await Promise.all([
        taskAPI.getTasks({ sortBy: 'priority' }),
        analyticsAPI.getOverview()
      ]);
      
      setTasks(tasksRes.data.data.tasks);
      setAnalytics(analyticsRes.data.data.overview);
    } catch (error) {
      toast.error('Failed to load dashboard data');
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your tasks and progress</p>
        </div>
        <button
          onClick={handleCreateTask}
          className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>New Task</span>
        </button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Tasks"
            value={analytics.totalTasks}
            icon={Clock}
            color="blue"
          />
          <StatCard
            title="Completed"
            value={analytics.completedTasks}
            icon={CheckCircle2}
            color="green"
          />
          <StatCard
            title="In Progress"
            value={analytics.inProgressTasks}
            icon={Clock}
            color="yellow"
          />
          <StatCard
            title="Overdue"
            value={analytics.overdueTasks}
            icon={AlertCircle}
            color="red"
          />
        </div>
      )}

      {/* Task Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TaskColumn
          title="To Do"
          tasks={tasks.filter(t => t.status === 'Todo')}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
        />
        <TaskColumn
          title="In Progress"
          tasks={tasks.filter(t => t.status === 'In Progress')}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
        />
        <TaskColumn
          title="Done"
          tasks={tasks.filter(t => t.status === 'Done')}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
        />
      </div>

      {/* Task Modal */}
      {showModal && (
        <TaskModal
          task={selectedTask}
          onClose={() => setShowModal(false)}
          onSave={handleTaskSaved}
        />
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600'
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

const TaskColumn = ({ title, tasks, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{tasks.length} tasks</p>
      </div>
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {tasks.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No tasks</p>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task._id}
              task={task}
              onEdit={() => onEdit(task)}
              onDelete={() => onDelete(task._id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
