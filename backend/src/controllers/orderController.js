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

// Update order status with Notification
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
        const updatedOrder = await Order.getById(parseInt(id), storeId);

        // --- AUTOMATED NOTIFICATION LOGIC ---
        // Dynamically import services
        const { Store } = await import('../models/index.js');
        const { sendMessageWithBilling } = await import('../services/billingService.js');
        const { sendTextMessage } = await import('../services/whatsappService.js');

        const store = await Store.getById(storeId);

        let message = '';
        if (status === 'confirmed') message = `✅ Your Order #${updatedOrder.order_number} has been CONFIRMED! We will pack it shortly.`;
        if (status === 'shipped') message = `🚚 Good news! Your Order #${updatedOrder.order_number} has been SHIPPED. It is on the way!`;
        if (status === 'delivered') message = `🎉 Order #${updatedOrder.order_number} is DELIVERED. Thank you for shopping with us!`;
        if (status === 'cancelled') message = `❌ Your Order #${updatedOrder.order_number} has been CANCELLED.`;

        if (message && store) {
            console.log(`Sending ${status} notification to ${updatedOrder.customer_phone} for Store ${store.name}`);

            // Config for whatsapp service
            const storeConfig = {
                phoneNumberId: store.whatsapp_phone_number_id,
                accessToken: store.whatsapp_access_token
            };

            // Fire and forget (don't await strictly for response time, but handle error)
            sendMessageWithBilling(
                store,
                updatedOrder.customer_phone,
                message,
                'utility_alert',
                () => sendTextMessage(updatedOrder.customer_phone, message, storeConfig)
            ).catch(err => console.error('Failed to send status notification:', err.message));
        }
        // ------------------------------------

        res.json({ success: true, data: updatedOrder });
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
