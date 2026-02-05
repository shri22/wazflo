import { run, get } from './src/config/database.js';
import { createTables } from './src/models/schema.js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
dotenv.config();

const seed = async () => {
    try {
        console.log('🌱 Seeding database...');
        await createTables();

        // 1. Create Default Store
        const storeResult = await run(`
            INSERT OR IGNORE INTO stores (
                name, whatsapp_phone_number_id, whatsapp_access_token, 
                whatsapp_verify_token, razorpay_key_id, razorpay_key_secret
            ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
            'Nataraja Silks and Readymades',
            process.env.WHATSAPP_PHONE_NUMBER_ID,
            process.env.WHATSAPP_ACCESS_TOKEN,
            process.env.WHATSAPP_VERIFY_TOKEN,
            process.env.RAZORPAY_KEY_ID,
            process.env.RAZORPAY_KEY_SECRET
        ]);

        const storeId = storeResult.lastID || (await get('SELECT id FROM stores WHERE whatsapp_phone_number_id = ?', [process.env.WHATSAPP_PHONE_NUMBER_ID])).id;

        // 2. Create Admin User with hashed password
        const adminPassword = process.env.ADMIN_PASSWORD || 'demo123';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        await run(`
            INSERT OR IGNORE INTO users (
                store_id, username, password, is_super_admin
            ) VALUES (?, ?, ?, ?)
        `, [
            storeId,
            process.env.ADMIN_USERNAME || 'admin',
            hashedPassword,
            1
        ]);

        // 3. Create Sample Products for this store
        const products = [
            {
                name: 'Premium Cotton T-Shirt',
                description: 'High-quality 100% cotton T-shirt, breathable and comfortable.',
                base_price: 599,
                image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800',
                category: 'Clothing'
            },
            {
                name: 'Traditional Silk Saree',
                description: 'Handwoven pure silk saree with elegant zari work.',
                base_price: 4999,
                image_url: 'https://images.unsplash.com/photo-1610030469668-93510ec67845?auto=format&fit=crop&q=80&w=800',
                category: 'Ethnic Wear'
            }
        ];

        for (const p of products) {
            const pResult = await run(`
                INSERT INTO products (store_id, name, description, base_price, image_url, category)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [storeId, p.name, p.description, p.base_price, p.image_url, p.category]);

            const productId = pResult.lastID;

            // Add variants for T-Shirt
            if (p.name === 'Premium Cotton T-Shirt') {
                const variants = [
                    { name: 'Small / Blue', price: 599, stock: 50 },
                    { name: 'Medium / Blue', price: 599, stock: 45 },
                    { name: 'Large / Blue', price: 599, stock: 30 }
                ];
                for (const v of variants) {
                    await run(`
                        INSERT INTO variants (product_id, store_id, name, price, stock_quantity)
                        VALUES (?, ?, ?, ?, ?)
                    `, [productId, storeId, v.name, v.price, v.stock]);
                }
            } else {
                // Saree variants
                const variants = [
                    { name: 'Red', price: 4999, stock: 10 },
                    { name: 'Green', price: 4999, stock: 15 }
                ];
                for (const v of variants) {
                    await run(`
                        INSERT INTO variants (product_id, store_id, name, price, stock_quantity)
                        VALUES (?, ?, ?, ?, ?)
                    `, [productId, storeId, v.name, v.price, v.stock]);
                }
            }
        }

        console.log('✅ Seeding completed');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
    }
};

seed();
