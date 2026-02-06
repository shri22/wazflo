import { run, get, all } from '../config/database.js';

export const Store = {
    getById: async (id) => {
        return await get('SELECT * FROM stores WHERE id = ?', [id]);
    },
    getByPhoneId: async (phoneId) => {
        return await get('SELECT * FROM stores WHERE whatsapp_phone_number_id = ?', [phoneId]);
    },
    getAll: async () => {
        return await all('SELECT * FROM stores ORDER BY name ASC');
    },
    create: async (store) => {
        const result = await run(`
            INSERT INTO stores (name, whatsapp_phone_number_id, whatsapp_access_token, whatsapp_verify_token, razorpay_key_id, razorpay_key_secret)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [store.name, store.whatsapp_phone_number_id, store.whatsapp_access_token, store.whatsapp_verify_token, store.razorpay_key_id, store.razorpay_key_secret]);
        return result.lastID;
    },
    update: async (id, store) => {
        return await run(`
            UPDATE stores SET 
                name = ?,
                whatsapp_phone_number_id = ?, 
                whatsapp_access_token = ?, 
                razorpay_key_id = ?, 
                razorpay_key_secret = ?,
                support_phone = ?,
                wallet_balance = ?,
                message_cost = ?
            WHERE id = ?
        `, [
            store.name,
            store.whatsapp_phone_number_id,
            store.whatsapp_access_token,
            store.razorpay_key_id,
            store.razorpay_key_secret,
            store.support_phone,
            store.wallet_balance,
            store.message_cost,
            id
        ]);
    },
    updateWallet: async (id, amount) => {
        return await run('UPDATE stores SET wallet_balance = wallet_balance + ? WHERE id = ?', [amount, id]);
    },
    delete: async (id) => {
        return await run('DELETE FROM stores WHERE id = ?', [id]);
    }
};

export const User = {
    getByUsername: async (username) => {
        return await get('SELECT * FROM users WHERE username = ?', [username]);
    },
    getById: async (id) => {
        return await get('SELECT * FROM users WHERE id = ?', [id]);
    },
    create: async (user) => {
        const result = await run(`
            INSERT INTO users (store_id, username, password, is_super_admin)
            VALUES (?, ?, ?, ?)
        `, [user.store_id, user.username, user.password, user.is_super_admin ?? 0]);
        return result.lastID;
    }
};

export const Product = {
    getAll: async (storeId, activeOnly = false) => {
        const query = activeOnly
            ? 'SELECT * FROM products WHERE store_id = ? AND is_active = 1 ORDER BY created_at DESC'
            : 'SELECT * FROM products WHERE store_id = ? ORDER BY created_at DESC';
        return await all(query, [storeId]);
    },

    getById: async (id, storeId) => {
        return await get('SELECT * FROM products WHERE id = ? AND store_id = ?', [id, storeId]);
    },

    create: async (product) => {
        const result = await run(`
      INSERT INTO products (store_id, name, description, base_price, image_url, category, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
            product.store_id,
            product.name,
            product.description,
            product.base_price,
            product.image_url,
            product.category,
            product.is_active ?? 1
        ]);
        return result.lastID;
    },

    batchCreate: async (products) => {
        // SQLite doesn't support complex batch inserts natively easily with node-sqlite3 in one go 
        // without constructing a massive query, so we'll do a transaction loop.
        const db = await import('../config/database.js'); // Dynamic import to get the 'db' object if exposed, or use run in loop

        let successCount = 0;
        let errors = [];

        for (const p of products) {
            try {
                await run(`
                    INSERT INTO products (store_id, name, description, base_price, image_url, category, is_active)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [
                    p.store_id,
                    p.name,
                    p.description,
                    p.base_price,
                    p.image_url,
                    p.category,
                    1
                ]);
                successCount++;
            } catch (err) {
                errors.push({ name: p.name, error: err.message });
            }
        }
        return { successCount, errors };
    },

    update: async (id, product, storeId) => {
        return await run(`
      UPDATE products 
      SET name = ?, description = ?, base_price = ?, image_url = ?, 
          category = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND store_id = ?
    `, [
            product.name,
            product.description,
            product.base_price,
            product.image_url,
            product.category,
            product.is_active,
            id,
            storeId
        ]);
    },

    delete: async (id, storeId) => {
        return await run('DELETE FROM products WHERE id = ? AND store_id = ?', [id, storeId]);
    },

    getWithVariants: async (id, storeId) => {
        const product = await Product.getById(id, storeId);
        if (!product) return null;

        const variants = await all('SELECT * FROM variants WHERE product_id = ? AND store_id = ?', [id, storeId]);
        return { ...product, variants };
    }
};

export const Variant = {
    getByProductId: async (productId, storeId) => {
        return await all('SELECT * FROM variants WHERE product_id = ? AND store_id = ?', [productId, storeId]);
    },

    getById: async (id, storeId) => {
        return await get('SELECT * FROM variants WHERE id = ? AND store_id = ?', [id, storeId]);
    },

    create: async (variant) => {
        const result = await run(`
      INSERT INTO variants (product_id, store_id, name, sku, price, stock_quantity, attributes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
            variant.product_id,
            variant.store_id,
            variant.name,
            variant.sku,
            variant.price,
            variant.stock_quantity ?? 0,
            JSON.stringify(variant.attributes || {})
        ]);
        return result.lastID;
    },

    update: async (id, variant, storeId) => {
        return await run(`
      UPDATE variants 
      SET name = ?, sku = ?, price = ?, stock_quantity = ?, attributes = ?
      WHERE id = ? AND store_id = ?
    `, [
            variant.name,
            variant.sku,
            variant.price,
            variant.stock_quantity,
            JSON.stringify(variant.attributes || {}),
            id,
            storeId
        ]);
    },

    delete: async (id, storeId) => {
        return await run('DELETE FROM variants WHERE id = ? AND store_id = ?', [id, storeId]);
    },

    updateStock: async (id, quantity) => {
        return await run('UPDATE variants SET stock_quantity = stock_quantity + ? WHERE id = ?', [quantity, id]);
    }
};

export const Customer = {
    getByPhone: async (storeId, phone) => {
        return await get('SELECT * FROM customers WHERE store_id = ? AND phone = ?', [storeId, phone]);
    },

    create: async (customer) => {
        const result = await run(`
      INSERT INTO customers (store_id, phone, name, whatsapp_id)
      VALUES (?, ?, ?, ?)
    `, [customer.store_id, customer.phone, customer.name, customer.whatsapp_id]);
        return result.lastID;
    },

    update: async (id, customer, storeId) => {
        return await run(`
      UPDATE customers 
      SET name = ?, whatsapp_id = ?, last_interaction = CURRENT_TIMESTAMP
      WHERE id = ? AND store_id = ?
    `, [customer.name, customer.whatsapp_id, id, storeId]);
    },

    updateLastInteraction: async (storeId, phone) => {
        return await run('UPDATE customers SET last_interaction = CURRENT_TIMESTAMP WHERE store_id = ? AND phone = ?', [storeId, phone]);
    }
};

export const Order = {
    getAll: async (storeId) => {
        return await all(`
      SELECT o.*, p.name as product_name, v.name as variant_name, c.name as customer_name
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN variants v ON o.variant_id = v.id
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.store_id = ?
      ORDER BY o.created_at DESC
    `, [storeId]);
    },

    getById: async (id, storeId) => {
        return await get(`
      SELECT o.*, p.name as product_name, p.image_url, v.name as variant_name
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN variants v ON o.variant_id = v.id
      WHERE o.id = ? AND o.store_id = ?
    `, [id, storeId]);
    },

    getByOrderNumber: async (orderNumber) => {
        return await get('SELECT * FROM orders WHERE order_number = ?', [orderNumber]);
    },

    getByCustomerPhone: async (storeId, phone) => {
        return await all(`
      SELECT o.*, p.name as product_name, v.name as variant_name
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN variants v ON o.variant_id = v.id
      WHERE o.store_id = ? AND o.customer_phone = ?
      ORDER BY o.created_at DESC
    `, [storeId, phone]);
    },

    create: async (order) => {
        const result = await run(`
      INSERT INTO orders (
        store_id, order_number, customer_id, customer_phone, customer_name,
        product_id, variant_id, quantity, total_amount, status, notes, address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            order.store_id,
            order.order_number,
            order.customer_id,
            order.customer_phone,
            order.customer_name,
            order.product_id,
            order.variant_id,
            order.quantity,
            order.total_amount,
            order.status || 'pending',
            order.notes,
            order.address
        ]);
        return result.lastID;
    },

    updateStatus: async (id, status, storeId) => {
        return await run('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND store_id = ?', [status, id, storeId]);
    },

    updatePayment: async (orderNumber, paymentData) => {
        return await run(`
      UPDATE orders 
      SET razorpay_order_id = ?, razorpay_payment_id = ?, razorpay_signature = ?,
          status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE order_number = ?
    `, [
            paymentData.razorpay_order_id,
            paymentData.razorpay_payment_id,
            paymentData.razorpay_signature,
            paymentData.status,
            orderNumber
        ]);
    },

    getStats: async (storeId) => {
        const today = await get(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
      FROM orders 
      WHERE store_id = ? AND DATE(created_at) = DATE('now')
    `, [storeId]);

        const week = await get(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
      FROM orders 
      WHERE store_id = ? AND DATE(created_at) >= DATE('now', '-7 days')
    `, [storeId]);

        const month = await get(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
      FROM orders 
      WHERE store_id = ? AND DATE(created_at) >= DATE('now', '-30 days')
    `, [storeId]);

        const statusCounts = await all(`
      SELECT status, COUNT(*) as count
      FROM orders
      WHERE store_id = ?
      GROUP BY status
    `, [storeId]);

        return { today, week, month, statusCounts };
    },

    getPlatformStats: async () => {
        const totalStores = await get('SELECT COUNT(*) as count FROM stores');
        const totalOrders = await get('SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue FROM orders');
        const activeStores = await get('SELECT COUNT(*) as count FROM stores WHERE whatsapp_phone_number_id NOT LIKE "PENDING_%"');
        const ordersByStore = await all(`
            SELECT s.name, COUNT(o.id) as order_count, SUM(o.total_amount) as revenue
            FROM stores s
            LEFT JOIN orders o ON s.id = o.store_id
            GROUP BY s.id
            ORDER BY revenue DESC
            LIMIT 5
        `);
        return { totalStores, totalOrders, activeStores, ordersByStore };
    }
};

export const Conversation = {
    get: async (storeId, phone) => {
        return await get('SELECT * FROM conversations WHERE store_id = ? AND customer_phone = ?', [storeId, phone]);
    },

    upsert: async (storeId, phone, state, context = null) => {
        const existing = await Conversation.get(storeId, phone);
        if (existing) {
            return await run(`
        UPDATE conversations 
        SET state = ?, context = ?, last_message_at = CURRENT_TIMESTAMP
        WHERE store_id = ? AND customer_phone = ?
      `, [state, context ? JSON.stringify(context) : null, storeId, phone]);
        } else {
            return await run(`
        INSERT INTO conversations (store_id, customer_phone, state, context)
        VALUES (?, ?, ?, ?)
      `, [storeId, phone, state, context ? JSON.stringify(context) : null]);
        }
    },

    clear: async (storeId, phone) => {
        return await run('DELETE FROM conversations WHERE store_id = ? AND customer_phone = ?', [storeId, phone]);
    }
};

export const Message = {
    getAll: async (storeId, limit = 50) => {
        return await all(`
            SELECT m.*, c.name as customer_name
            FROM messages m
            LEFT JOIN customers c ON m.customer_phone = c.phone AND m.store_id = c.store_id
            WHERE m.store_id = ?
            ORDER BY m.created_at DESC
            LIMIT ?
        `, [storeId, limit]);
    },
    getByCustomer: async (storeId, phone) => {
        return await all('SELECT * FROM messages WHERE store_id = ? AND customer_phone = ? ORDER BY created_at ASC', [storeId, phone]);
    },
    create: async (msg) => {
        const result = await run(`
            INSERT INTO messages (store_id, customer_phone, direction, body, type, message_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [msg.store_id, msg.customer_phone, msg.direction, msg.body, msg.type || 'text', msg.message_id]);
        return result.lastID;
    }
};

export const Usage = {
    getLogs: async (storeId, limit = 50) => {
        return await all('SELECT * FROM usage_logs WHERE store_id = ? ORDER BY created_at DESC LIMIT ?', [storeId, limit]);
    },
    log: async (log) => {
        const result = await run(`
            INSERT INTO usage_logs (store_id, type, cost, balance_after, details)
            VALUES (?, ?, ?, ?, ?)
        `, [log.store_id, log.type, log.cost, log.balance_after, log.details]);
        return result.lastID;
    }
};

export const Broadcast = {
    getAll: async (storeId) => {
        return await all('SELECT * FROM broadcasts WHERE store_id = ? ORDER BY created_at DESC', [storeId]);
    },
    getById: async (id, storeId) => {
        return await get('SELECT * FROM broadcasts WHERE id = ? AND store_id = ?', [id, storeId]);
    },
    create: async (broadcast) => {
        const result = await run(`
            INSERT INTO broadcasts (store_id, name, template_name, target_count, status, scheduled_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            broadcast.store_id,
            broadcast.name,
            broadcast.template_name,
            broadcast.target_count,
            broadcast.status || 'pending',
            broadcast.scheduled_at || null
        ]);
        return result.lastID;
    },
    updateStatus: async (id, status) => {
        return await run('UPDATE broadcasts SET status = ? WHERE id = ?', [status, id]);
    },
    incrementStats: async (id, type) => {
        // type: 'success' or 'failed'
        const column = type === 'success' ? 'success_count' : 'failed_count';
        return await run(`UPDATE broadcasts SET ${column} = ${column} + 1 WHERE id = ?`, [id]);
    }
};

export const Template = {
    getAll: async (storeId) => {
        return await all('SELECT * FROM templates WHERE store_id = ? ORDER BY created_at DESC', [storeId]);
    },
    create: async (template) => {
        const result = await run(`
            INSERT INTO templates (store_id, name, category, language, components, status, meta_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            template.store_id,
            template.name,
            template.category,
            template.language,
            JSON.stringify(template.components),
            template.status || 'APPROVED', // Default to approved for demo
            template.meta_id
        ]);
        return result.lastID;
    },
    delete: async (id, storeId) => {
        return await run('DELETE FROM templates WHERE id = ? AND store_id = ?', [id, storeId]);
    }
};

export const CustomerTag = {
    getAll: async (storeId) => {
        return await all('SELECT * FROM customer_tags WHERE store_id = ?', [storeId]);
    },
    create: async (storeId, name, color) => {
        const result = await run(`
            INSERT INTO customer_tags (store_id, name, color) VALUES (?, ?, ?)
        `, [storeId, name, color]);
        return result.lastID;
    },
    assign: async (customerId, tagId) => {
        try {
            await run('INSERT INTO customer_tag_mappings (customer_id, tag_id) VALUES (?, ?)', [customerId, tagId]);
        } catch (e) {
            // Ignore unique constraint violations
        }
    },
    getForCustomer: async (customerId) => {
        return await all(`
            SELECT t.* FROM customer_tags t
            JOIN customer_tag_mappings m ON t.id = m.tag_id
            WHERE m.customer_id = ?
        `, [customerId]);
    }
};
