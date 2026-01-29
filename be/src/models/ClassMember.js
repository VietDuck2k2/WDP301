const mongoose = require('mongoose');

const classMemberSchema = new mongoose.Schema({
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  role: {
    type: String,
    enum: ['teacher', 'student'],
    required: [true, 'Role is required']
  },
  status: {
    type: String,
    enum: ['active', 'dropped', 'completed'],
    default: 'active'
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  droppedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate enrollments
classMemberSchema.index({ class: 1, user: 1 }, { unique: true });

// Indexes for efficient queries
classMemberSchema.index({ class: 1, role: 1, status: 1 });
classMemberSchema.index({ user: 1, role: 1, status: 1 });

const ClassMember = mongoose.model('ClassMember', classMemberSchema);

module.exports = ClassMember;
