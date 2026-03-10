const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
   email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
   },
   password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
   },
   firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
   },
   lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
   },
   role: {
      type: String,
      enum: ['admin', 'teacher', 'student'],
      default: 'student'
   },
   phone: {
      type: String,
      trim: true
   },
   avatar: {
      type: String,
      default: null
   },
   dateOfBirth: {
      type: Date
   },
   address: {
      type: String,
      trim: true
   },
   isActive: {
      type: Boolean,
      default: true
   },
   lastLogin: {
      type: Date
   }
}, {
   timestamps: true,
   toJSON: { virtuals: true },
   toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function () {
   return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
userSchema.pre('save', async function () {
   if (!this.isModified('password')) return;

   const salt = await bcrypt.genSalt(10);
   this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
   return await bcrypt.compare(candidatePassword, this.password);
};

// Hide sensitive fields when converting to JSON
userSchema.methods.toJSON = function () {
   const obj = this.toObject();
   delete obj.password;
   return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
