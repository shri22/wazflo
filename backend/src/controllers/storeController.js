import bcrypt from 'bcryptjs';
import { Store, User } from '../models/index.js';

export const getAllStores = async (req, res) => {
    try {
        if (!req.admin.isSuperAdmin) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
        const stores = await Store.getAll();
        res.json({ success: true, data: stores });
    } catch (error) {
        console.error('Error fetching stores:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch stores' });
    }
};

export const createStore = async (req, res) => {
    try {
        if (!req.admin.isSuperAdmin) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const { name, whatsapp_phone_number_id, whatsapp_access_token, whatsapp_verify_token, razorpay_key_id, razorpay_key_secret, admin_username, admin_password } = req.body;

        if (!name || !whatsapp_phone_number_id || !admin_username || !admin_password) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const hashedPassword = await bcrypt.hash(admin_password, 10);

        // 1. Create Store
        const storeId = await Store.create({
            name,
            whatsapp_phone_number_id,
            whatsapp_access_token,
            whatsapp_verify_token,
            razorpay_key_id,
            razorpay_key_secret
        });

        // 2. Create Admin User for this store
        await User.create({
            store_id: storeId,
            username: admin_username,
            password: hashedPassword,
            is_super_admin: 0
        });

        const store = await Store.getById(storeId);
        res.status(201).json({ success: true, data: store });
    } catch (error) {
        console.error('Error creating store:', error);
        res.status(500).json({ success: false, error: 'Failed to create store' });
    }
};

export const getStoreSettings = async (req, res) => {
    try {
        const storeId = req.admin.storeId;
        const store = await Store.getById(storeId);
        if (!store) {
            return res.status(404).json({ success: false, error: 'Store not found' });
        }
        res.json({ success: true, data: store });
    } catch (error) {
        console.error('Error fetching store settings:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch settings' });
    }
};

export const updateStoreSettings = async (req, res) => {
    try {
        const storeId = req.admin.storeId;
        const { whatsapp_access_token, whatsapp_phone_number_id, razorpay_key_id, razorpay_key_secret } = req.body;

        const current = await Store.getById(storeId);
        await Store.update(storeId, {
            name: current.name, // Keep current name
            whatsapp_access_token,
            whatsapp_phone_number_id,
            razorpay_key_id,
            razorpay_key_secret
        });

        const store = await Store.getById(storeId);
        res.json({ success: true, data: store });
    } catch (error) {
        console.error('Error updating store settings:', error);
        res.status(500).json({ success: false, error: 'Failed to update settings' });
    }
};
export const updateStore = async (req, res) => {
    try {
        if (!req.admin.isSuperAdmin) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
        const { id } = req.params;
        const { name, whatsapp_access_token, whatsapp_phone_number_id, razorpay_key_id, razorpay_key_secret } = req.body;

        await Store.update(id, {
            name,
            whatsapp_access_token,
            whatsapp_phone_number_id,
            razorpay_key_id,
            razorpay_key_secret
        });

        const store = await Store.getById(id);
        res.json({ success: true, data: store });
    } catch (error) {
        console.error('Error updating store:', error);
        res.status(500).json({ success: false, error: 'Failed to update store' });
    }
};

export const deleteStore = async (req, res) => {
    try {
        if (!req.admin.isSuperAdmin) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
        const { id } = req.params;
        await Store.delete(id);
        res.json({ success: true, message: 'Store deleted successfully' });
    } catch (error) {
        console.error('Error deleting store:', error);
        res.status(500).json({ success: false, error: 'Failed to delete store' });
    }
};
