import express from 'express';
import {
    addMemberHome,
    getAllMembers,
    getMembersByEmail,
    deteleMemberHome,
} from '../controllers/members.js';

const router = express.Router();

/* READ */
router.get('/all/:id', getAllMembers);
router.post('/', addMemberHome);
router.delete('/:home/:member', deteleMemberHome);
router.get('/findbyemail/:email', getMembersByEmail);

export default router;
