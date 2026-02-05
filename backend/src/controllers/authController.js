import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, Store } from '../models/index.js';

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user in database
        const user = await User.getByUsername(username);

        // Verify password with bcrypt
        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign(
                { id: user.id, username: user.username, storeId: user.store_id, isSuperAdmin: user.is_super_admin },
                process.env.JWT_SECRET || 'your_secret_key',
                { expiresIn: '24h' }
            );

            return res.json({
                success: true,
                data: {
                    username: user.username,
                    storeId: user.store_id,
                    isSuperAdmin: user.is_super_admin,
                    token
                }
            });
        }

        res.status(401).json({ success: false, error: 'Invalid credentials' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Login failed' });
    }
};

export const me = async (req, res) => {
    res.json({
        success: true,
        data: {
            username: req.admin.username,
            storeId: req.admin.storeId,
            isSuperAdmin: req.admin.isSuperAdmin
        }
    });
};

export const register = async (req, res) => {
    try {
        const { storeName, adminName, adminEmail, adminPhone } = req.body;

        if (!storeName || !adminEmail) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        // 1. Create a "Pending" store record
        // In a real SaaS, we would use a default internal phone ID until they config their own
        const storeId = await Store.create({
            name: storeName,
            whatsapp_phone_number_id: 'PENDING_' + Date.now(),
            whatsapp_access_token: '',
            whatsapp_verify_token: 'WazfloToken',
            razorpay_key_id: '',
            razorpay_key_secret: ''
        });

        // Use part of email as username, phone as password initially
        const username = adminEmail.split('@')[0] + '_' + Math.floor(Math.random() * 1000);
        const rawPassword = adminPhone.replace(/[^0-9]/g, '').slice(-6) || 'welcome123';
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        await User.create({
            store_id: storeId,
            username: username,
            password: hashedPassword,
            is_super_admin: 0
        });

        res.status(201).json({
            success: true,
            message: 'Store created successfully!',
            data: {
                username,
                password: rawPassword,
                note: 'Please use these credentials to log in and configure your keys.'
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, error: 'Registration failed' });
    }
};
