const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  boardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: true
  },
  columnId: {
    type: String,
    required: true
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'review', 'done'],
    default: 'todo'
  },
  dueDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    originalName: String,
    url: {
      type: String,
      required: true
    },
    size: Number,
    mimetype: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  checklist: [{
    id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    text: {
      type: String,
      required: true,
      maxlength: 200
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completedAt: Date
  }],
  position: {
    type: Number,
    default: 0
  },
  labels: [{
    name: String,
    color: String
  }],
  comments: [{
    text: {
      type: String,
      required: true,
      maxlength: 1000
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    edited: {
      type: Boolean,
      default: false
    },
    editedAt: Date
  }]
}, {
  timestamps: true
});

// Indexes for better performance
taskSchema.index({ boardId: 1, columnId: 1, position: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ dueDate: 1 });

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
  return this.dueDate && this.dueDate < new Date() && this.status !== 'done';
});

// Virtual for completion percentage
taskSchema.virtual('completionPercentage').get(function() {
  if (this.checklist.length === 0) return 0;
  const completed = this.checklist.filter(item => item.completed).length;
  return Math.round((completed / this.checklist.length) * 100);
});

// Method to mark as complete
taskSchema.methods.markComplete = function() {
  this.status = 'done';
  this.completedAt = new Date();
};

module.exports = mongoose.model('Task', taskSchema);