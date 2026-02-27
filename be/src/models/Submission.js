const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
   assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: [true, 'Assignment is required']
   },
   student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student is required']
   },
   content: {
      type: String,
      trim: true
   },
   attachments: [{
      name: String,
      url: String,
      uploadedAt: {
         type: Date,
         default: Date.now
      }
   }],
   submittedAt: {
      type: Date,
      default: Date.now
   },
   status: {
      type: String,
      enum: ['draft', 'submitted', 'graded', 'returned'],
      default: 'draft'
   },
   score: {
      type: Number,
      min: 0
   },
   feedback: {
      type: String,
      trim: true
   },
   gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
   },
   gradedAt: {
      type: Date
   },
   isLate: {
      type: Boolean,
      default: false
   }
}, {
   timestamps: true
});

// Compound index to prevent duplicate submissions
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

// Indexes for efficient queries
submissionSchema.index({ assignment: 1, status: 1 });
submissionSchema.index({ student: 1 });

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;
