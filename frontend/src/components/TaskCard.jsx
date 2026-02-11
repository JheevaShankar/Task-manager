import { Calendar, Clock, Edit, Trash2, Flag } from 'lucide-react';
import { format, isPast } from 'date-fns';

const TaskCard = ({ task, onEdit, onDelete }) => {
  const priorityColors = {
    High: 'bg-red-100 text-red-700 border-red-300',
    Medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    Low: 'bg-green-100 text-green-700 border-green-300'
  };

  const isOverdue = task.deadline && isPast(new Date(task.deadline)) && task.status !== 'Done';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900 flex-1">{task.title}</h3>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onEdit(task)}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit task"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(task._id)}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}

      {/* Metadata */}
      <div className="space-y-2">
        {/* Priority Badge */}
        <div className="flex items-center justify-between">
          <span className={`text-xs px-2 py-1 rounded border ${priorityColors[task.priority]}`}>
            {task.priority} Priority
          </span>
        </div>

        {/* Deadline */}
        {task.deadline && (
          <div className={`flex items-center space-x-1 text-xs ${
            isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'
          }`}>
            <Calendar className="w-3 h-3" />
            <span>
              {format(new Date(task.deadline), 'MMM d, yyyy')}
              {isOverdue && ' (Overdue)'}
            </span>
          </div>
        )}

        {/* Estimated Time */}
        {task.estimatedTime && (
          <div className="flex items-center space-x-1 text-xs text-gray-600">
            <Clock className="w-3 h-3" />
            <span>{task.estimatedTime} minutes</span>
          </div>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {task.tags.map(tag => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Category */}
        <div className="text-xs text-gray-500">
          Category: {task.category}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
