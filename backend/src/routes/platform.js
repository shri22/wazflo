
import express from 'express';
import { getAllMessages, getUsageLogs, getBroadcasts, createBroadcast, addStoreBalance } from '../controllers/platformController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/messages', auth, getAllMessages);
router.get('/usage', auth, getUsageLogs);
router.get('/broadcasts', auth, getBroadcasts);
router.post('/broadcasts', auth, createBroadcast);
router.post('/stores/:id/balance', auth, addStoreBalance);

export default router;
