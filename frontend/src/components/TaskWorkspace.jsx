import { useState, useEffect } from 'react';
import { taskAPI } from '../services/api';
import toast from 'react-hot-toast';
import { X, Send, FileUp, Code, History, AlertCircle, CheckCircle2 } from 'lucide-react';

const TaskWorkspace = ({ task, onClose, onSubmit }) => {
  const [submittedCode, setSubmittedCode] = useState('');
  const [submittedFiles, setSubmittedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (task) {
      setSubmittedCode(task.submittedCode || '');
      setSubmittedFiles(task.submittedFiles || []);
    }
  }, [task]);

  const handleSubmit = async () => {
    if (!submittedCode.trim()) {
      toast.error('Please enter your code/solution before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      await taskAPI.submitTask(task._id, {
        submittedCode,
        submittedFiles
      });
      toast.success('Task submitted successfully!');
      if (onSubmit) onSubmit();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileAdd = () => {
    const fileName = prompt('Enter file name:');
    const fileUrl = prompt('Enter file URL or path:');
    if (fileName && fileUrl) {
      setSubmittedFiles([...submittedFiles, { name: fileName, url: fileUrl }]);
    }
  };

  const handleFileRemove = (index) => {
    setSubmittedFiles(submittedFiles.filter((_, i) => i !== index));
  };

  if (!task) return null;

  const getStatusBadge = (status) => {
    const badges = {
      'Not Submitted': 'bg-gray-100 text-gray-800',
      'Pending Review': 'bg-yellow-100 text-yellow-800',
      'Accepted': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800'
    };
    return badges[status] || badges['Not Submitted'];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(task.submissionStatus)}`}>
                {task.submissionStatus}
              </span>
              {task.deadline && (
                <span className="text-sm text-gray-600">
                  Deadline: {new Date(task.deadline).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Task Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Task Description</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{task.description || 'No description provided'}</p>
            </div>
          </div>

          {/* Manager Feedback */}
          {task.managerFeedback && task.submissionStatus === 'Rejected' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="text-red-600 mt-0.5" size={20} />
                <div>
                  <h4 className="font-semibold text-red-900 mb-1">Manager Feedback</h4>
                  <p className="text-red-800">{task.managerFeedback}</p>
                </div>
              </div>
            </div>
          )}

          {task.managerFeedback && task.submissionStatus === 'Accepted' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="text-green-600 mt-0.5" size={20} />
                <div>
                  <h4 className="font-semibold text-green-900 mb-1">Accepted!</h4>
                  <p className="text-green-800">{task.managerFeedback}</p>
                </div>
              </div>
            </div>
          )}

          {/* Code Editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Code size={20} />
                Your Solution
              </h3>
              {task.revisionHistory && task.revisionHistory.length > 0 && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <History size={16} />
                  View History ({task.revisionHistory.length})
                </button>
              )}
            </div>
            <textarea
              value={submittedCode}
              onChange={(e) => setSubmittedCode(e.target.value)}
              placeholder="Write your code or solution here..."
              className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              disabled={task.submissionStatus === 'Accepted'}
            />
          </div>

          {/* File Attachments */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <FileUp size={20} />
              File Attachments
            </h3>
            <div className="space-y-2">
              {submittedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-600">{file.url}</p>
                  </div>
                  {task.submissionStatus !== 'Accepted' && (
                    <button
                      onClick={() => handleFileRemove(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              ))}
              {task.submissionStatus !== 'Accepted' && (
                <button
                  onClick={handleFileAdd}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors"
                >
                  + Add File
                </button>
              )}
            </div>
          </div>

          {/* Revision History */}
          {showHistory && task.revisionHistory && task.revisionHistory.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revision History</h3>
              <div className="space-y-4">
                {task.revisionHistory.map((revision, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        Revision {task.revisionHistory.length - index}
                      </span>
                      <span className={`px-2 py-1 rounded text-sm ${
                        revision.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {revision.status}
                      </span>
                    </div>
                    {revision.feedback && (
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Feedback:</strong> {revision.feedback}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      Submitted: {new Date(revision.submissionDate).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {task.submissionStatus !== 'Accepted' && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {task.submissionStatus === 'Pending Review' 
                  ? 'Your submission is pending manager review.' 
                  : 'Submit your solution for review.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !submittedCode.trim()}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                  <Send size={18} />
                  {isSubmitting ? 'Submitting...' : task.submissionStatus === 'Pending Review' ? 'Resubmit' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskWorkspace;
