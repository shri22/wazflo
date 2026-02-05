import { Order, Customer, Store } from '../models/index.js';
import { verifyWebhookSignature } from '../services/razorpayService.js';
import * as whatsapp from '../services/whatsappService.js';
import { sendMessageWithBilling } from '../services/billingService.js';

// Handle Razorpay webhook
export const handleRazorpayWebhook = async (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const body = req.body;

        // In multi-tenant, we need to know WHICH store's secret to use for verification
        // For now, if we use a shared webhook URL, we might need a way to ID the store
        // Usually, the payload contains something we can link back.
        // If not using unique URLs per store, we might default to env secret or look up by payload info.

        // TODO: Implement store-specific webhook verification if needed
        const isValid = verifyWebhookSignature(body, signature);

        if (!isValid) {
            console.error('❌ Invalid webhook signature');
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const event = body.event;
        const payload = body.payload.payment || body.payload.order;

        console.log(`📨 Received webhook: ${event}`);

        switch (event) {
            case 'payment.captured':
            case 'payment_link.paid':
                await handlePaymentSuccess(payload);
                break;

            case 'payment.failed':
                await handlePaymentFailed(payload);
                break;

            case 'order.paid':
                await handleOrderPaid(payload);
                break;

            default:
                console.log(`ℹ️ Unhandled event: ${event}`);
        }

        res.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};

// Handle successful payment
export const handlePaymentSuccess = async (payment) => {
    try {
        const notes = payment.notes || {};
        const orderNumber = payment.order_id || notes.order_number;

        if (!orderNumber) {
            console.error('No order number found in payment');
            return;
        }

        const order = await Order.getByOrderNumber(orderNumber);

        if (!order) {
            console.error(`Order not found: ${orderNumber}`);
            return;
        }

        const store = await Store.getById(order.store_id);
        if (!store) {
            console.error(`Store not found for order: ${orderNumber}`);
            return;
        }

        const storeConfig = {
            phoneNumberId: store.whatsapp_phone_number_id,
            accessToken: store.whatsapp_access_token
        };

        // Update order with payment details
        await Order.updatePayment(orderNumber, {
            razorpay_order_id: payment.order_id || null,
            razorpay_payment_id: payment.id || null,
            razorpay_signature: payment.signature || '',
            status: 'paid'
        });

        console.log(`✅ Payment successful for order: ${orderNumber}`);

        // Send WhatsApp notification to customer
        const customer = await Customer.getByPhone(order.store_id, order.customer_phone);
        if (customer) {
            await sendMessageWithBilling(store, order.customer_phone, 'Payment Success Notification', 'text', () => whatsapp.sendTextMessage(
                order.customer_phone,
                `✅ *Payment Successful!*\n\n🎉 Thank you for your payment!\n\nOrder: ${orderNumber}\n💰 Amount: ₹${order.total_amount}\n\nYour order is being processed and will be shipped soon. We'll notify you once it's on the way! 📦`,
                storeConfig
            ));
        }
    } catch (error) {
        console.error('Error handling payment success:', error);
    }
};

// Handle failed payment
const handlePaymentFailed = async (payment) => {
    try {
        const notes = payment.notes || {};
        const orderNumber = payment.order_id || notes.order_number;

        if (!orderNumber) {
            console.error('No order number found in failed payment');
            return;
        }

        const order = await Order.getByOrderNumber(orderNumber);

        if (!order) {
            console.error(`Order not found: ${orderNumber}`);
            return;
        }

        const store = await Store.getById(order.store_id);
        const storeConfig = store ? {
            phoneNumberId: store.whatsapp_phone_number_id,
            accessToken: store.whatsapp_access_token
        } : {};

        console.log(`❌ Payment failed for order: ${orderNumber}`);

        // Optionally notify customer
        const customer = await Customer.getByPhone(order.store_id, order.customer_phone);
        if (customer) {
            await whatsapp.sendTextMessage(
                order.customer_phone,
                `❌ Payment Failed\n\nOrder: ${orderNumber}\n\nYour payment could not be processed. Please try again or contact support if you need assistance.`,
                storeConfig
            );
        }
    } catch (error) {
        console.error('Error handling payment failure:', error);
    }
};

// Handle order paid event
const handleOrderPaid = async (orderData) => {
    try {
        const orderNumber = orderData.receipt;

        if (!orderNumber) {
            console.error('No order number in order.paid event');
            return;
        }

        const order = await Order.getByOrderNumber(orderNumber);

        if (!order) {
            console.error(`Order not found: ${orderNumber}`);
            return;
        }

        // Update order status
        await Order.updateStatus(order.id, 'paid', order.store_id);

        console.log(`✅ Order marked as paid: ${orderNumber}`);
    } catch (error) {
        console.error('Error handling order paid:', error);
    }
};

// Handle payment callback (when customer returns from payment page)
export const handlePaymentCallback = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.query;

        // You can verify and show a success page
        res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Status</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 500px;
          }
          .success-icon {
            font-size: 64px;
            margin-bottom: 20px;
          }
          h1 {
            color: #333;
            margin-bottom: 10px;
          }
          p {
            color: #666;
            line-height: 1.6;
          }
          .order-id {
            background: #f0f0f0;
            padding: 10px;
            border-radius: 8px;
            margin: 20px 0;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✅</div>
          <h1>Payment Successful!</h1>
          <p>Thank you for your payment. Your order has been confirmed.</p>
          <div class="order-id">
            Payment ID: ${razorpay_payment_id || 'DEMO_PAYMENT_ID'}
          </div>
          <p>You will receive a confirmation message on WhatsApp shortly.</p>
          <p style="margin-top: 30px; color: #999; font-size: 14px;">
            You can close this window now.
          </p>
        </div>
      </body>
      </html>
    `);
    } catch (error) {
        console.error('Error in payment callback:', error);
        res.status(500).send('Error processing payment callback');
    }
};
