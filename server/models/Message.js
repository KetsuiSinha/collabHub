const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  boardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'system', 'task-update'],
    default: 'text'
  },
  fileUrl: String,
  fileName: String,
  fileSize: Number,
  
  // For system messages
  systemData: {
    action: String, // 'task-created', 'task-moved', 'user-joined', etc.
    targetId: String,
    targetName: String,
    fromColumn: String,
    toColumn: String
  },
  
  // Message status
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  
  // Read receipts
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
messageSchema.index({ boardId: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

// Static method to create system message
messageSchema.statics.createSystemMessage = function(boardId, action, data) {
  return this.create({
    content: this.generateSystemMessageContent(action, data),
    sender: data.userId,
    boardId,
    messageType: 'system',
    systemData: {
      action,
      ...data
    }
  });
};

// Generate system message content
messageSchema.statics.generateSystemMessageContent = function(action, data) {
  const messages = {
    'task-created': `created task "${data.taskTitle}"`,
    'task-moved': `moved task "${data.taskTitle}" from ${data.fromColumn} to ${data.toColumn}`,
    'task-deleted': `deleted task "${data.taskTitle}"`,
    'user-joined': `joined the board`,
    'user-left': `left the board`,
    'member-added': `added ${data.memberName} to the board`
  };
  
  return messages[action] || 'performed an action';
};

module.exports = mongoose.model('Message', messageSchema);