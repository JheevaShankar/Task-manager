import { useState, useEffect } from 'react';
import { taskAPI } from '../services/api';
import { Clock, CheckCircle2, AlertCircle, PlayCircle, Code } from 'lucide-react';
import toast from 'react-hot-toast';
import TaskWorkspace from '../components/TaskWorkspace';

const TeamMemberDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showWorkspace, setShowWorkspace] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await taskAPI.getTasks({ sortBy: 'deadline' });
      setTasks(response.data.data.tasks);
    } catch (error) {
      toast.error('Failed to load tasks');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      await taskAPI.updateTaskStatus(taskId, { status: newStatus });
      toast.success('Task status updated');
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update task status');
    }
  };

  const handleAddComment = async (taskId, comment) => {
    try {
      await taskAPI.addComment(taskId, { text: comment });
      toast.success('Comment added');
      fetchTasks();
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleOpenWorkspace = (task) => {
    setSelectedTask(task);
    setShowWorkspace(true);
  };

  const handleCloseWorkspace = () => {
    setShowWorkspace(false);
    setSelectedTask(null);
  };

  const handleSubmitSuccess = () => {
    fetchTasks();
  };

  const filteredTasks = filterStatus === 'all' 
    ? tasks 
    : tasks.filter(task => task.status === filterStatus);

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'To-Do').length,
    inProgress: tasks.filter(t => t.status === 'In-Progress').length,
    done: tasks.filter(t => t.status === 'Done').length,
    overdue: tasks.filter(t => t.status === 'Overdue').length
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-gray-600 mt-1">View and update your assigned tasks</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="Total" value={stats.total} color="blue" icon={Clock} />
        <StatCard title="To-Do" value={stats.todo} color="gray" icon={Clock} />
        <StatCard title="In Progress" value={stats.inProgress} color="yellow" icon={PlayCircle} />
        <StatCard title="Done" value={stats.done} color="green" icon={CheckCircle2} />
        <StatCard title="Overdue" value={stats.overdue} color="red" icon={AlertCircle} />
      </div>

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

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.map(task => (
          <TeamTaskCard
            key={task._id}
            task={task}
            onStatusUpdate={handleStatusUpdate}
            onAddComment={handleAddComment}
            onOpenWorkspace={handleOpenWorkspace}
          />
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">No tasks found</p>
        </div>
      )}

      {/* Task Workspace Modal */}
      {showWorkspace && (
        <TaskWorkspace
          task={selectedTask}
          onClose={handleCloseWorkspace}
          onSubmit={handleSubmitSuccess}
        />
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, color, icon: Icon }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    gray: 'bg-gray-100 text-gray-600'
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-full ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

// Team Task Card Component
const TeamTaskCard = ({ task, onStatusUpdate, onAddComment, onOpenWorkspace }) => {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [comment, setComment] = useState('');

  const statusColors = {
    'To-Do': 'bg-gray-100 text-gray-700',
    'In-Progress': 'bg-yellow-100 text-yellow-700',
    'Done': 'bg-green-100 text-green-700',
    'Overdue': 'bg-red-100 text-red-700'
  };

  const priorityColors = {
    'High': 'text-red-600',
    'Medium': 'text-yellow-600',
    'Low': 'text-green-600'
  };

  const handleSubmitComment = () => {
    if (comment.trim()) {
      onAddComment(task._id, comment);
      setComment('');
      setShowCommentInput(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'No deadline';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h3>
          {task.description && (
            <p className="text-gray-600 text-sm mb-3">{task.description}</p>
          )}
          <div className="flex flex-wrap gap-2 items-center">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
              {task.status}
            </span>
            <span className={`text-sm font-medium ${priorityColors[task.priority]}`}>
              {task.priority} Priority
            </span>
            {task.submissionStatus && task.submissionStatus !== 'Not Submitted' && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                task.submissionStatus === 'Pending Review' ? 'bg-blue-100 text-blue-700' :
                task.submissionStatus === 'Accepted' ? 'bg-green-100 text-green-700' :
                task.submissionStatus === 'Rejected' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                📝 {task.submissionStatus}
              </span>
            )}
            {task.deadline && (
              <span className="text-sm text-gray-600">
                📅 Due: {formatDate(task.deadline)}
              </span>
            )}
          </div>
          {task.assignedBy && (
            <p className="text-xs text-gray-500 mt-2">
              Assigned by: {task.assignedBy.name}
            </p>
          )}
        </div>
      </div>

      {/* Manager Feedback */}
      {task.managerFeedback && task.submissionStatus === 'Rejected' && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs font-semibold text-red-900 mb-1">Manager Feedback:</p>
          <p className="text-sm text-red-800">{task.managerFeedback}</p>
        </div>
      )}

      {/* Status Update Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => onOpenWorkspace(task)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm flex items-center gap-2"
        >
          <Code size={16} />
          {task.submissionStatus === 'Not Submitted' ? 'Open Workspace' : 'View Submission'}
        </button>
        
        {task.status !== 'Done' && task.status !== 'Overdue' && (
          <>
            {task.status === 'To-Do' && (
              <button
                onClick={() => onStatusUpdate(task._id, 'In-Progress')}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
              >
                Start Task
              </button>
            )}
            {task.status === 'In-Progress' && (
              <>
                <button
                  onClick={() => onStatusUpdate(task._id, 'To-Do')}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  Move to To-Do
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Comments Section */}
      <div className="border-t pt-4">
        <button
          onClick={() => setShowCommentInput(!showCommentInput)}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          {showCommentInput ? 'Cancel' : 'Add Progress Comment'}
        </button>
        
        {showCommentInput && (
          <div className="mt-3 space-y-2">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a progress update..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows="3"
            />
            <button
              onClick={handleSubmitComment}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
            >
              Post Comment
            </button>
          </div>
        )}

        {/* Display Comments */}
        {task.comments && task.comments.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-semibold text-gray-700">Comments:</p>
            {task.comments.slice(-3).map((c, idx) => (
              <div key={idx} className="text-sm bg-gray-50 p-2 rounded">
                <p className="text-gray-800">{c.text}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {c.user?.name || 'User'} - {new Date(c.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamMemberDashboard;
