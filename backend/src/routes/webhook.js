import express from 'express';
import { handleWebhook } from '../controllers/webhookController.js';

const router = express.Router();

// WhatsApp webhook - GET for verification, POST for messages
router.get('/whatsapp', handleWebhook);
router.post('/whatsapp', handleWebhook);

export default router;
