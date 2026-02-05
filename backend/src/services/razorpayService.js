import Razorpay from 'razorpay';
import crypto from 'crypto';

// Helper to get Razorpay instance for a specific store
const getRazorpayInstance = (config) => {
    const keyId = config?.keyId || process.env.RAZORPAY_KEY_ID;
    const keySecret = config?.keySecret || process.env.RAZORPAY_KEY_SECRET;

    return new Razorpay({
        key_id: keyId,
        key_secret: keySecret
    });
};

export const createPaymentLink = async (orderData, razorpayConfig = {}) => {
    try {
        const rzp = getRazorpayInstance(razorpayConfig);

        const options = {
            amount: Math.round(orderData.amount * 100), // Amount in paise
            currency: 'INR',
            accept_partial: false,
            description: orderData.description || 'Product Purchase',
            customer: {
                name: orderData.customer_name,
                contact: orderData.customer_phone,
            },
            notify: {
                sms: true,
                whatsapp: true
            },
            reminder_enable: true,
            callback_url: `${process.env.BACKEND_URL}/api/payment/callback`,
            callback_method: 'get'
        };

        // For demo purposes, if keys are placeholders or not provided, return a fake link
        const currentKeyId = razorpayConfig.keyId || process.env.RAZORPAY_KEY_ID;
        if (currentKeyId === 'rzp_test_your_key_id' || !currentKeyId) {
            return {
                short_url: 'https://rzp.io/i/demo_payment_link',
                id: 'plink_demo_' + Date.now()
            };
        }

        const paymentLink = await rzp.paymentLink.create(options);
        return paymentLink;
    } catch (error) {
        console.error('Error creating payment link:', error);
        throw error;
    }
};

export const createOrder = async (orderData, razorpayConfig = {}) => {
    try {
        const rzp = getRazorpayInstance(razorpayConfig);
        const options = {
            amount: Math.round(orderData.amount * 100), // Amount in paise
            currency: 'INR',
            receipt: orderData.order_number,
            notes: orderData.notes || {}
        };

        const order = await rzp.orders.create(options);
        return order;
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        throw error;
    }
};

export const verifyPaymentSignature = (orderId, paymentId, signature, keySecret) => {
    try {
        const secret = keySecret || process.env.RAZORPAY_KEY_SECRET;
        const text = `${orderId}|${paymentId}`;
        const generated_signature = crypto
            .createHmac('sha256', secret)
            .update(text)
            .digest('hex');

        return generated_signature === signature;
    } catch (error) {
        console.error('Error verifying signature:', error);
        return false;
    }
};

export const verifyWebhookSignature = (body, signature, secret) => {
    try {
        const webhookSecret = secret || process.env.RAZORPAY_WEBHOOK_SECRET;
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(body))
            .digest('hex');

        return expectedSignature === signature;
    } catch (error) {
        console.error('Error verifying webhook signature:', error);
        return false;
    }
};

export const getPaymentDetails = async (paymentId, razorpayConfig = {}) => {
    try {
        const rzp = getRazorpayInstance(razorpayConfig);
        const payment = await rzp.payments.fetch(paymentId);
        return payment;
    } catch (error) {
        console.error('Error fetching payment details:', error);
        throw error;
    }
};

export const refundPayment = async (paymentId, amount = null, razorpayConfig = {}) => {
    try {
        const rzp = getRazorpayInstance(razorpayConfig);
        const options = amount ? { amount: Math.round(amount * 100) } : {};
        const refund = await rzp.payments.refund(paymentId, options);
        return refund;
    } catch (error) {
        console.error('Error processing refund:', error);
        throw error;
    }
};
