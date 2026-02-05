
import { Message, Usage, Broadcast, Store } from '../models/index.js';

// Messages
export const getAllMessages = async (req, res) => {
    try {
        const storeId = req.admin.storeId;
        const messages = await Message.getAll(storeId);
        res.json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

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
