const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
   name: {
      type: String,
      required: [true, 'Tên phòng là bắt buộc'],
      trim: true,
      unique: true,
   },
   capacity: {
      type: Number,
      default: 30,
      min: [1, 'Sức chứa tối thiểu là 1'],
   },
   location: {
      type: String,
      trim: true,
      default: '',
   },
   description: {
      type: String,
      trim: true,
      default: '',
   },
   isActive: {
      type: Boolean,
      default: true,
   },
}, { timestamps: true });

roomSchema.index({ name: 1 });

const Room = mongoose.model('Room', roomSchema);
module.exports = Room;
