
import { Message, Usage, Broadcast, Store } from '../models/index.js';

// Messages (Chat System)
export const getConversations = async (req, res) => {
    try {
        const storeId = req.admin.storeId;
        // Group by customer, get latest message
        // Since we don't have a direct "Conversation" list query in models yet that joins messages perfectly,
        // we can fetch from the 'conversations' table which tracks state, 
        // OR distinct on messages. 
        // Let's use the 'conversations' table we defined in schema which has last_message_at

        // We need to import Conversation model if not imported
        const { Conversation } = await import('../models/index.js');

        // Actually, let's create a custom query here to get the list with last message snippet
        const db = await import('../config/database.js');
        const conversations = await db.all(`
            SELECT c.*, cust.name as customer_name, 
                   (SELECT body FROM messages m WHERE m.store_id = c.store_id AND m.customer_phone = c.customer_phone ORDER BY m.created_at DESC LIMIT 1) as last_message
            FROM conversations c
            LEFT JOIN customers cust ON c.customer_phone = cust.phone AND c.store_id = cust.store_id
            WHERE c.store_id = ?
            ORDER BY c.last_message_at DESC
        `, [storeId]);

        res.json({ success: true, data: conversations });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getChatHistory = async (req, res) => {
    try {
        const storeId = req.admin.storeId;
        const { phone } = req.params;
        const messages = await Message.getByCustomer(storeId, phone);
        res.json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Legacy single list (optional, keeping for now)
export const getAllMessages = async (req, res) => {
    try {
        const storeId = req.admin.storeId;
        const messages = await Message.getAll(storeId);
        res.json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Send Manual Message (Chat Reply)
export const sendMessage = async (req, res) => {
    try {
        const storeId = req.admin.storeId;
        const { phone, message } = req.body;

        if (!phone || !message) {
            return res.status(400).json({ success: false, error: 'Phone and message are required' });
        }

        const store = await Store.getById(storeId);
        if (!store) return res.status(404).json({ error: 'Store not found' });

        // Import billing service to handle sending + cost deduction
        const { sendMessageWithBilling } = await import('../services/billingService.js');
        const { sendTextMessage } = await import('../services/whatsappService.js');

        // Config for whatsapp service
        const storeConfig = {
            phoneNumberId: store.whatsapp_phone_number_id,
            accessToken: store.whatsapp_access_token
        };

        const result = await sendMessageWithBilling(
            store,
            phone,
            message,
            'text',
            () => sendTextMessage(phone, message, storeConfig)
        );

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ... Usage, Broadcasts, etc.

// Usage
export const getUsageLogs = async (req, res) => {
    try {
        const storeId = req.admin.storeId;
        const logs = await Usage.getLogs(storeId);
        res.json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Broadcasts
export const getBroadcasts = async (req, res) => {
    try {
        const storeId = req.admin.storeId;
        const broadcasts = await Broadcast.getAll(storeId);
        res.json({ success: true, data: broadcasts });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createBroadcast = async (req, res) => {
    try {
        const storeId = req.admin.storeId;
        const { name, template_name, target_count } = req.body;
        const id = await Broadcast.create({ store_id: storeId, name, template_name, target_count });
        res.json({ success: true, data: { id } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Super Admin: Add balance
export const addStoreBalance = async (req, res) => {
    try {
        if (!req.admin.isSuperAdmin) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }
        const { id } = req.params;
        const { amount } = req.body;
        await Store.updateWallet(id, amount);
        res.json({ success: true, message: 'Balance updated' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
