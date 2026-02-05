import express from 'express';
import { handleRazorpayWebhook, handlePaymentCallback } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/webhook', handleRazorpayWebhook);
router.get('/callback', handlePaymentCallback);

export default router;
