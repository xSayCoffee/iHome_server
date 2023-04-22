import express from 'express';
import {
    addDevices,
    deleteDevice,
    disconnectButton,
    disconnectRelay,
    editDevice,
    getAllDevices,
    getDevice,
    getDevicesByRoom,
    linkButton,
    linkDevices,
    updateDevice,
} from '../controllers/Devices.js';

const router = express.Router();

/* READ */
router.post('/adddevice', addDevices);
router.get('/all/:id', getAllDevices);
router.get('/room/:id', getDevicesByRoom);
router.get('/:id', getDevice);
router.delete('/:id', deleteDevice);
router.post('/linkdevice', linkDevices);
router.patch('/', updateDevice);
router.patch('/disconnect', disconnectRelay);
router.patch('/linkbutton', linkButton);
router.patch('/disconnectbutton', disconnectButton);
router.patch('/edit/:id', editDevice);

export default router;
