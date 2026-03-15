const Room = require('../../models/Room');
const Session = require('../../models/Session');
const ApiResponse = require('../../utils/apiResponse');
const ApiError = require('../../utils/apiError');

const getAllRooms = async (req, res, next) => {
   try {
      const rooms = await Room.find({ isActive: true }).sort({ name: 1 });
      ApiResponse.ok(res, rooms);
   } catch (error) { next(error); }
};

const getAvailableRooms = async (req, res, next) => {
   try {
      const { date, slotNumber, excludeSessionId } = req.query;

      let occupiedRoomNames = [];

      if (date && slotNumber) {
         // Set start and end of the specified date
         const dayStart = new Date(date);
         dayStart.setHours(0, 0, 0, 0);
         const dayEnd = new Date(date);
         dayEnd.setHours(23, 59, 59, 999);

         // Build query for occupied sessions
         const conflictQuery = {
            slotNumber,
            date: { $gte: dayStart, $lte: dayEnd },
            status: { $ne: 'cancelled' },
            room: { $exists: true, $ne: '' }
         };

         // Exclude specific session if updating
         if (excludeSessionId) {
            conflictQuery._id = { $ne: excludeSessionId };
         }

         // Find occupied sessions and map to room names
         const occupiedSessions = await Session.find(conflictQuery).select('room');
         occupiedRoomNames = occupiedSessions.map(session => session.room);
      }

      // Find all active rooms, omitting the occupied ones
      const availableRooms = await Room.find({
         isActive: true,
         name: { $nin: occupiedRoomNames }
      }).sort({ name: 1 });

      ApiResponse.ok(res, availableRooms);
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

module.exports = { getAllRooms, getAvailableRooms, getRoomById, createRoom, updateRoom, deleteRoom };
