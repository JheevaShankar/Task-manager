import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { taskAPI } from '../services/api';
import { Plus, Calendar, Flag } from 'lucide-react';
import TaskModal from '../components/TaskModal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const KanbanBoard = () => {
  const [columns, setColumns] = useState({
    'Todo': [],
    'In Progress': [],
    'Done': []
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await taskAPI.getTasks({ sortBy: 'priority' });
      const tasks = response.data.data.tasks;
      
      const newColumns = {
        'Todo': tasks.filter(t => t.status === 'Todo'),
        'In Progress': tasks.filter(t => t.status === 'In Progress'),
        'Done': tasks.filter(t => t.status === 'Done')
      };
      
      setColumns(newColumns);
    } catch (error) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    // If dropped in same position
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];
    const [movedTask] = sourceColumn.splice(source.index, 1);

    // Update task status
    movedTask.status = destination.droppableId;
    destColumn.splice(destination.index, 0, movedTask);

    // Update state optimistically
    setColumns({
      ...columns,
      [source.droppableId]: sourceColumn,
      [destination.droppableId]: destColumn
    });

    // Update backend
    try {
      await taskAPI.updateStatus(movedTask._id, destination.droppableId);
      toast.success('Task moved successfully');
    } catch (error) {
      toast.error('Failed to update task');
      // Revert on error
      fetchTasks();
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowModal(true);
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setShowModal(true);
  };

  const handleTaskSaved = () => {
    setShowModal(false);
    fetchTasks();
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
          <h1 className="text-3xl font-bold text-gray-900">Kanban Board</h1>
          <p className="text-gray-600 mt-1">Drag and drop tasks to update their status</p>
        </div>
        <button
          onClick={handleCreateTask}
          className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>New Task</span>
        </button>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.keys(columns).map(columnId => (
            <div key={columnId} className="bg-gray-100 rounded-lg p-4">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center justify-between">
                <span>{columnId}</span>
                <span className="text-sm text-gray-600">{columns[columnId].length}</span>
              </h2>
              
              <Droppable droppableId={columnId}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-3 min-h-[500px] ${
                      snapshot.isDraggingOver ? 'bg-blue-50' : ''
                    }`}
                  >
                    {columns[columnId].map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => handleTaskClick(task)}
                            className={`bg-white rounded-lg p-4 shadow cursor-pointer hover:shadow-md transition-shadow ${
                              snapshot.isDragging ? 'opacity-50' : ''
                            }`}
                          >
                            <KanbanTaskCard task={task} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

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

const KanbanTaskCard = ({ task }) => {
  const priorityColors = {
    High: 'bg-red-100 text-red-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    Low: 'bg-green-100 text-green-700'
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between">
        <h3 className="font-medium text-gray-900 flex-1">{task.title}</h3>
        <span className={`text-xs px-2 py-1 rounded ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
      </div>
      
      {task.description && (
        <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
      )}
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        {task.deadline && (
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>{format(new Date(task.deadline), 'MMM d')}</span>
          </div>
        )}
        
        {task.aiPriorityScore && (
          <div className="flex items-center space-x-1">
            <Flag className="w-3 h-3" />
            <span>AI: {task.aiPriorityScore}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanBoard;
