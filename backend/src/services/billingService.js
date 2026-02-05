
import { Message, Usage, Store } from '../models/index.js';
import * as whatsapp from './whatsappService.js';

export const sendMessageWithBilling = async (store, from, body, type, sendCallback) => {
    try {
        // Check balance
        const cost = store.message_cost || 1.00;

        if (store.wallet_balance !== null && store.wallet_balance < cost) {
            console.warn(`⚠️ Store ${store.name} has low balance: ${store.wallet_balance}. Message might fail or be skipped.`);
            // In strict mode, we would throw an error here to stop sending.
            // throw new Error('Insufficient Balance');
        }

        const response = await sendCallback();
        const messageId = response?.messages?.[0]?.id;

        // Log outgoing message
        await Message.create({
            store_id: store.id,
            customer_phone: from,
            direction: 'out',
            body: body,
            type: type,
            message_id: messageId
        });

        // Deduct from wallet
        await Store.updateWallet(store.id, -cost);

        // Log usage
        await Usage.log({
            store_id: store.id,
            type: 'outgoing_msg',
            cost: cost,
            balance_after: store.wallet_balance - cost,
            details: `Notification to ${from} (${type})`
        });

        return response;
    } catch (error) {
        console.error('Error in sendMessageWithBilling service:', error);
        throw error;
    }
};
