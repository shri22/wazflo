import express from 'express';
import {
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    getOrderStats,
    getPlatformStats
} from '../controllers/orderController.js';

const router = express.Router();

router.get('/', getAllOrders);
router.get('/stats', getOrderStats);
router.get('/platform-stats', getPlatformStats);
router.get('/:id', getOrderById);
router.put('/:id/status', updateOrderStatus);

export default router;
