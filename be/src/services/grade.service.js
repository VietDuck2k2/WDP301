const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const ClassMember = require('../models/ClassMember');
const ApiError = require('../utils/apiError');

/**
 * Get grades for a student (all classes or specific class)
 */
const getStudentGrades = async (studentId, classId = null) => {
   let assignmentQuery = { status: { $in: ['published', 'closed'] } };

   if (classId) {
      assignmentQuery.class = classId;
   } else if (!classId) {
      // Only classes the student is enrolled in
      const enrollments = await ClassMember.find({
         user: studentId,
         role: 'student',
         status: 'active'
      }).select('class');
      assignmentQuery.class = { $in: enrollments.map(e => e.class) };
   }

   const assignments = await Assignment.find(assignmentQuery)
      .populate('class', 'name code')
      .select('title class maxScore dueDate status');

   const assignmentIds = assignments.map(a => a._id);

   const submissions = await Submission.find({
      student: studentId,
      assignment: { $in: assignmentIds }
   }).select('assignment score status feedback gradedAt isLate');

   // Map submissions to assignments
   const submissionMap = {};
   submissions.forEach(s => {
      submissionMap[s.assignment.toString()] = s;
   });

   const grades = assignments.map(assignment => {
      const submission = submissionMap[assignment._id.toString()];
      return {
         assignment: {
            _id: assignment._id,
            title: assignment.title,
            class: assignment.class,
            maxScore: assignment.maxScore,
            dueDate: assignment.dueDate
         },
         submission: submission ? {
            score: submission.score,
            status: submission.status,
            feedback: submission.feedback,
            gradedAt: submission.gradedAt,
            isLate: submission.isLate,
            percentage: submission.score != null
               ? ((submission.score / assignment.maxScore) * 100).toFixed(1)
               : null
         } : null
      };
   });

   // Summary stats
   const graded = grades.filter(g => g.submission?.status === 'graded');
   const totalScore = graded.reduce((sum, g) => sum + (g.submission.score || 0), 0);
   const totalMax = graded.reduce((sum, g) => sum + g.assignment.maxScore, 0);
   const averageScore = graded.length > 0 ? (totalScore / totalMax * 100).toFixed(1) : null;

   return {
      grades,
      summary: {
         total: assignments.length,
         graded: graded.length,
         pending: grades.filter(g => !g.submission || g.submission.status === 'submitted').length,
         notSubmitted: grades.filter(g => !g.submission).length,
         averagePercentage: averageScore ? parseFloat(averageScore) : null
      }
   };
};

module.exports = {
   getStudentGrades
};
