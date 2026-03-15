const express = require('express');
const router = express.Router();
const roomsController = require('../../controllers/admin/rooms.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/rbac.middleware');
const { validate, validateObjectId } = require('../../middlewares/validate.middleware');

router.use(authenticate, requireAdmin);

// GET /api/admin/rooms
router.get('/', roomsController.getAllRooms);

// GET /api/admin/rooms/available
// Put this before /:id so it doesn't match as an ID
router.get('/available', roomsController.getAvailableRooms);

// GET /api/admin/rooms/:id
router.get('/:id', validateObjectId('id'), roomsController.getRoomById);

// POST /api/admin/rooms
router.post('/', validate(['name']), roomsController.createRoom);

// PUT /api/admin/rooms/:id
router.put('/:id', validateObjectId('id'), roomsController.updateRoom);

// DELETE /api/admin/rooms/:id
router.delete('/:id', validateObjectId('id'), roomsController.deleteRoom);

module.exports = router;
