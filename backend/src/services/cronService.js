import schedule from 'node-schedule';
import { Conversation, Store } from '../models/index.js';
import { sendMessageWithBilling } from '../services/billingService.js';
import { sendTextMessage } from '../services/whatsappService.js';
import { run, all } from '../config/database.js';

// Run every hour
// schedule.scheduleJob('0 * * * *', async () => { ... });

// For Demo/Testing: Function to manually trigger recovery check
export const runRecoveryCheck = async () => {
    console.log('🔍 Running Abandoned Cart Recovery Check...');

    try {
        // 1. Find conversations that are 'cart_active' AND last interaction was > 1 hour ago
        // Using raw query because complex date math in SQLite depends on version, standardizing here.
        const staleCarts = await all(`
            SELECT c.*, s.whatsapp_phone_number_id, s.whatsapp_access_token, s.name as store_name
            FROM conversations c
            JOIN stores s ON c.store_id = s.id
            WHERE c.state = 'cart_active' 
            AND datetime(c.last_message_at) < datetime('now', '-1 hour')
            AND datetime(c.last_message_at) > datetime('now', '-24 hours') -- Don't badger people from last week
        `);

        console.log(`Found ${staleCarts.length} abandoned carts.`);

        for (const conv of staleCarts) {
            const context = JSON.parse(conv.context || '{}');
            const cartItems = context.cart || [];

            if (cartItems.length > 0) {
                // Construct reminder message
                const itemCount = cartItems.reduce((a, b) => a + b.qty, 0);
                const message = `👋 Hi! You left ${itemCount} item(s) in your cart. Stocks are running low! Type 'CHECKOUT' to complete your order.`;

                // Store object for billing
                const store = {
                    id: conv.store_id,
                    name: conv.store_name,
                    wallet_balance: 100, // Ideally fetch real balance, assume sufficient for cron
                    message_cost: 0.50
                };

                const storeConfig = {
                    phoneNumberId: conv.whatsapp_phone_number_id,
                    accessToken: conv.whatsapp_access_token
                };

                console.log(`Sending Recovery Nudge to ${conv.customer_phone}`);

                await sendMessageWithBilling(
                    store,
                    conv.customer_phone,
                    message,
                    'marketing_automation',
                    () => sendTextMessage(conv.customer_phone, message, storeConfig)
                );

                // Update state to 'recovery_sent' so we don't spaam them every hour
                await run(`UPDATE conversations SET state = 'recovery_sent', last_message_at = CURRENT_TIMESTAMP WHERE id = ?`, [conv.id]);
            }
        }
    } catch (error) {
        console.error('Recovery Job Error:', error);
    }
};
