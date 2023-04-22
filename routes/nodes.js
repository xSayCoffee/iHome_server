import express from 'express';
import {
    addNodes,
    changeStateRelay,
    deleteNode,
    editNode,
    getAdeInfor,
    getAllNodes,
    getAllNodesAde,
    getAllNodesRelay,
    getAllNodesSensors,
    getNode,
    getRelay,
    getSensor,
} from '../controllers/nodes.js';

const router = express.Router();

/* READ */
router.post('/addnode/:id', addNodes);
router.get('/all/:id', getAllNodes);
router.get('/allRelay/:id', getAllNodesRelay);
router.get('/allsensors/:id', getAllNodesSensors);
router.delete('/:homeId/:id', deleteNode);
router.get('/:id', getNode);
router.patch('/edit/:id', editNode);
router.get('/relay/:id', getRelay);
router.patch('/relay/changestate/:id', changeStateRelay);
router.get('/sensor/:id', getSensor);
router.get('/ades/:id', getAdeInfor);
router.get('/allades/:id', getAllNodesAde);

export default router;
