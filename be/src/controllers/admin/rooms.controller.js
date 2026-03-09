const Room = require('../../models/Room');
const ApiResponse = require('../../utils/apiResponse');
const ApiError = require('../../utils/apiError');

const getAllRooms = async (req, res, next) => {
   try {
      const rooms = await Room.find({ isActive: true }).sort({ name: 1 });
      ApiResponse.ok(res, rooms);
   } catch (error) { next(error); }
};

const getRoomById = async (req, res, next) => {
   try {
      const room = await Room.findById(req.params.id);
      if (!room) throw ApiError.notFound('Không tìm thấy phòng học');
      ApiResponse.ok(res, room);
   } catch (error) { next(error); }
};

const createRoom = async (req, res, next) => {
   try {
      const room = await Room.create(req.body);
      ApiResponse.created(res, room, 'Tạo phòng học thành công');
   } catch (error) { next(error); }
};

const updateRoom = async (req, res, next) => {
   try {
      const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!room) throw ApiError.notFound('Không tìm thấy phòng học');
      ApiResponse.ok(res, room, 'Cập nhật phòng học thành công');
   } catch (error) { next(error); }
};

const deleteRoom = async (req, res, next) => {
   try {
      const room = await Room.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
      if (!room) throw ApiError.notFound('Không tìm thấy phòng học');
      ApiResponse.ok(res, room, 'Xóa phòng học thành công');
   } catch (error) { next(error); }
};

module.exports = { getAllRooms, getRoomById, createRoom, updateRoom, deleteRoom };
