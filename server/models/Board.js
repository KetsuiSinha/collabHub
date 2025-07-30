const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Board title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['member', 'admin'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  columns: [{
    id: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    position: {
      type: Number,
      default: 0
    }
  }],
  backgroundColor: {
    type: String,
    default: '#0079bf'
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
boardSchema.index({ owner: 1, createdAt: -1 });
boardSchema.index({ 'members.user': 1 });

// Virtual for member count
boardSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Method to check if user is member
boardSchema.methods.isMember = function(userId) {
  return this.owner.toString() === userId.toString() || 
         this.members.some(member => member.user.toString() === userId.toString());
};

// Method to check if user is admin
boardSchema.methods.isAdmin = function(userId) {
  if (this.owner.toString() === userId.toString()) return true;
  
  const member = this.members.find(member => member.user.toString() === userId.toString());
  return member && member.role === 'admin';
};

module.exports = mongoose.model('Board', boardSchema);