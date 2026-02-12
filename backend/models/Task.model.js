const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a task title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  status: {
    type: String,
    enum: ['To-Do', 'In-Progress', 'Done', 'Overdue'],
    default: 'To-Do'
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  deadline: {
    type: Date,
    required: false
  },
  category: {
    type: String,
    enum: ['Work', 'Personal', 'Urgent', 'Important', 'Other'],
    default: 'Other'
  },
  tags: [{
    type: String,
    trim: true
  }],
  estimatedTime: {
    type: Number, // in minutes
    min: 0
  },
  actualTime: {
    type: Number, // in minutes
    min: 0
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: false,
    default: null
  },
  completedAt: {
    type: Date
  },
  completedBeforeDeadline: {
    type: Boolean,
    default: null
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  submittedCode: {
    type: String,
    default: ''
  },
  submittedFiles: [{
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  submissionStatus: {
    type: String,
    enum: ['Not Submitted', 'Pending Review', 'Accepted', 'Rejected'],
    default: 'Not Submitted'
  },
  submissionDate: {
    type: Date
  },
  managerFeedback: {
    type: String,
    default: ''
  },
  revisionHistory: [{
    submittedCode: String,
    submittedFiles: [{
      name: String,
      url: String
    }],
    submissionDate: Date,
    status: String,
    feedback: String,
    reviewedAt: Date
  }],
  subtasks: [{
    title: String,
    completed: {
      type: Boolean,
      default: false
    }
  }],
  attachments: [{
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, deadline: 1 });
taskSchema.index({ submissionStatus: 1, assignedBy: 1 });

// Update completedAt when status changes to Done
taskSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'Done' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'Done') {
      this.completedAt = undefined;
    }
  }
  next();
});

// Virtual for progress percentage
taskSchema.virtual('progress').get(function() {
  if (!this.subtasks || this.subtasks.length === 0) {
    return this.status === 'Done' ? 100 : 0;
  }
  const completed = this.subtasks.filter(st => st.completed).length;
  return Math.round((completed / this.subtasks.length) * 100);
});

// Ensure virtuals are included in JSON
taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Task', taskSchema);
