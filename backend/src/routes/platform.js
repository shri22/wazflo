
import express from 'express';
import { getAllMessages, getUsageLogs, getBroadcasts, createBroadcast, addStoreBalance, getConversations, getChatHistory, sendMessage } from '../controllers/platformController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/conversations', auth, getConversations);
router.get('/messages/:phone', auth, getChatHistory); // History for specific person
router.get('/messages', auth, getAllMessages); // All messages dump
router.post('/messages/send', auth, sendMessage); // New Route
router.get('/usage', auth, getUsageLogs);
router.get('/broadcasts', auth, getBroadcasts);
router.post('/broadcasts', auth, createBroadcast);
router.post('/stores/:id/balance', auth, addStoreBalance);

export default router;
