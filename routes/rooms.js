import express from 'express';
import {
    addRooms,
    deleteRoom,
    getAllRooms,
    getRoom,
    linkRoomRelay,
    linkRoomSensor,
    unlinkRoomRelay,
    unlinkRoomSensor,
    updateRoom,
} from '../controllers/rooms.js';

const router = express.Router();

/* READ */
router.post('/addroom', addRooms);
router.get('/all/:id', getAllRooms);
router.get('/:id', getRoom);
router.delete('/:id', deleteRoom);
router.patch('/link/relay', linkRoomRelay);
router.patch('/unlink/relay', unlinkRoomRelay);
router.patch('/link/sensor', linkRoomSensor);
router.patch('/unlink/sensor', unlinkRoomSensor);
router.patch('/', updateRoom);

export default router;
