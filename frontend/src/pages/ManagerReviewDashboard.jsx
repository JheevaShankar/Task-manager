import { useState, useEffect } from 'react';
import { taskAPI } from '../services/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Code, FileText, Clock, User, Calendar } from 'lucide-react';

const ManagerReviewDashboard = () => {
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [reviewAction, setReviewAction] = useState(null); // 'accept' or 'reject'

  useEffect(() => {
    fetchPendingSubmissions();
  }, []);

  const fetchPendingSubmissions = async () => {
    try {
      const response = await taskAPI.getPendingSubmissions();
      setPendingSubmissions(response.data.data.tasks);
    } catch (error) {
      toast.error('Failed to load pending submissions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (taskId) => {
    try {
      await taskAPI.acceptSubmission(taskId, { feedback: feedback || 'Good work!' });
      toast.success('Submission accepted!');
      setSelectedSubmission(null);
      setFeedback('');
      fetchPendingSubmissions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept submission');
    }
  };

  const handleReject = async (taskId) => {
    if (!feedback.trim()) {
      toast.error('Please provide feedback for rejection');
      return;
    }

    try {
      await taskAPI.rejectSubmission(taskId, { feedback });
      toast.success('Submission rejected with feedback');
      setSelectedSubmission(null);
      setFeedback('');
      fetchPendingSubmissions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject submission');
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Review Submissions</h1>
        <p className="text-gray-600 mt-1">Review and evaluate team member submissions</p>
      </div>

      {/* Stats */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Clock className="text-primary-600" size={24} />
          <div>
            <p className="text-2xl font-bold text-primary-900">{pendingSubmissions.length}</p>
            <p className="text-sm text-primary-700">Pending Reviews</p>
          </div>
        </div>
      </div>

      {/* Pending Submissions List */}
      {pendingSubmissions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
          <p className="text-gray-500 text-lg">No pending submissions to review</p>
          <p className="text-gray-400 text-sm mt-2">All caught up!</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {pendingSubmissions.map((task) => (
            <div key={task._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Task Header */}
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4 text-white">
                <h3 className="text-xl font-bold">{task.title}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="flex items-center gap-1">
                    <User size={16} />
                    {task.assignedTo?.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={16} />
                    Submitted: {new Date(task.submissionDate).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Task Content */}
              <div className="p-6 space-y-4">
                {/* Task Description */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <FileText size={18} />
                    Task Description
                  </h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded">
                    {task.description || 'No description provided'}
                  </p>
                </div>

                {/* Submitted Code */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Code size={18} />
                    Submitted Solution
                  </h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm font-mono whitespace-pre-wrap">
                      {task.submittedCode || 'No code submitted'}
                    </pre>
                  </div>
                </div>

                {/* Submitted Files */}
                {task.submittedFiles && task.submittedFiles.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Attached Files</h4>
                    <div className="space-y-2">
                      {task.submittedFiles.map((file, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{file.name}</p>
                            <p className="text-sm text-gray-600">{file.url}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Revision History */}
                {task.revisionHistory && task.revisionHistory.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Previous Submissions ({task.revisionHistory.length})
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {task.revisionHistory.map((revision, index) => (
                        <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Revision {task.revisionHistory.length - index}</span>
                            <span className="text-red-600">{revision.status}</span>
                          </div>
                          {revision.feedback && (
                            <p className="text-gray-700 mt-1">Feedback: {revision.feedback}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feedback Input */}
                {selectedSubmission === task._id ? (
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {reviewAction === 'reject' ? 'Rejection Feedback (Required)' : 'Feedback (Optional)'}
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder={reviewAction === 'reject' 
                        ? "Explain what needs to be improved..."
                        : "Add feedback or comments..."
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows="4"
                    />
                  </div>
                ) : null}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 border-t pt-4">
                  {selectedSubmission === task._id ? (
                    <>
                      <button
                        onClick={() => {
                          setSelectedSubmission(null);
                          setFeedback('');
                          setReviewAction(null);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      {reviewAction === 'accept' && (
                        <button
                          onClick={() => handleAccept(task._id)}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                          <CheckCircle size={18} />
                          Confirm Accept
                        </button>
                      )}
                      {reviewAction === 'reject' && (
                        <button
                          onClick={() => handleReject(task._id)}
                          disabled={!feedback.trim()}
                          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          <XCircle size={18} />
                          Confirm Reject
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setSelectedSubmission(task._id);
                          setReviewAction('reject');
                          setFeedback('');
                        }}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                      >
                        <XCircle size={18} />
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSubmission(task._id);
                          setReviewAction('accept');
                          setFeedback('');
                        }}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <CheckCircle size={18} />
                        Accept
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManagerReviewDashboard;
