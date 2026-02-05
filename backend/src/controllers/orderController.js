import { Order } from '../models/index.js';

// Get all orders
export const getAllOrders = async (req, res) => {
    try {
        const storeId = req.admin.storeId;
        const orders = await Order.getAll(storeId);
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch orders' });
    }
};

// Get order by ID
export const getOrderById = async (req, res) => {
    try {
        const storeId = req.admin.storeId;
        const { id } = req.params;
        const order = await Order.getById(parseInt(id), storeId);

        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        res.json({ success: true, data: order });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch order' });
    }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
    try {
        const storeId = req.admin.storeId;
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const existing = await Order.getById(parseInt(id), storeId);
        if (!existing) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        await Order.updateStatus(parseInt(id), status, storeId);
        const order = await Order.getById(parseInt(id), storeId);

        res.json({ success: true, data: order });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, error: 'Failed to update order status' });
    }
};

// Get order statistics
export const getOrderStats = async (req, res) => {
    try {
        const storeId = req.admin.storeId;
        const stats = await Order.getStats(storeId);
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Error fetching order stats:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch order stats' });
    }
};

// Get platform statistics (Super Admin ONLY)
export const getPlatformStats = async (req, res) => {
    try {
        if (!req.admin.isSuperAdmin) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
        const stats = await Order.getPlatformStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Error fetching platform stats:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch platform stats' });
    }
};
