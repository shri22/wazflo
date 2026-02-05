import { Product, Variant, Customer, Order, Conversation, Store, Message, Usage } from '../models/index.js';
import * as whatsapp from '../services/whatsappService.js';
import { sendMessageWithBilling } from '../services/billingService.js';
import { createPaymentLink } from '../services/razorpayService.js';
import { handlePaymentSuccess } from './paymentController.js';

// Generate unique order number
const generateOrderNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
};

// Handle incoming WhatsApp messages
export const handleWebhook = async (req, res) => {
    try {
        const body = req.body;

        // Check if it's a webhook verification request
        if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.WHATSAPP_VERIFY_TOKEN) {
            console.log('✅ Webhook verified');
            return res.status(200).send(req.query['hub.challenge']);
        }

        // Handle incoming messages
        if (body.object === 'whatsapp_business_account') {
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;
            const metadata = value?.metadata;

            if (value?.messages && metadata) {
                const phoneNumberId = metadata.phone_number_id;
                const store = await Store.getByPhoneId(phoneNumberId);

                if (!store) {
                    console.error(`❌ No store found for phone number ID: ${phoneNumberId}`);
                    return res.sendStatus(200); // Meta expects 200
                }

                const storeConfig = {
                    phoneNumberId: store.whatsapp_phone_number_id,
                    accessToken: store.whatsapp_access_token
                };

                const message = value.messages[0];
                const from = message.from; // Customer phone number
                const messageType = message.type;
                const messageId = message.id;

                // Log incoming message
                await Message.create({
                    store_id: store.id,
                    customer_phone: from,
                    direction: 'in',
                    body: messageType === 'text' ? message.text.body : (messageType === 'interactive' ? 'Interactive Selection' : messageType),
                    type: messageType,
                    message_id: messageId
                });

                // Mark message as read
                await whatsapp.markAsRead(messageId, storeConfig);

                // Get or create customer
                let customer = await Customer.getByPhone(store.id, from);
                if (!customer) {
                    const customerId = await Customer.create({
                        store_id: store.id,
                        phone: from,
                        name: value.contacts?.[0]?.profile?.name || 'Customer',
                        whatsapp_id: from
                    });
                    customer = await Customer.getByPhone(store.id, from);
                } else {
                    await Customer.updateLastInteraction(store.id, from);
                }

                // Get conversation state
                let conversation = await Conversation.get(store.id, from);
                if (!conversation) {
                    conversation = { state: 'idle', context: null };
                }

                // Parse context
                let context = conversation.context ? JSON.parse(conversation.context) : {};

                // Handle different message types
                if (messageType === 'text') {
                    const text = message.text.body.toLowerCase().trim();
                    await handleTextMessage(from, text, conversation.state, context, customer, store, storeConfig);
                } else if (messageType === 'interactive') {
                    const interactive = message.interactive;
                    if (interactive.type === 'button_reply') {
                        const buttonId = interactive.button_reply.id;
                        await handleButtonReply(from, buttonId, conversation.state, context, customer, store, storeConfig);
                    } else if (interactive.type === 'list_reply') {
                        const listId = interactive.list_reply.id;
                        await handleListReply(from, listId, conversation.state, context, customer, store, storeConfig);
                    }
                }
            }

            return res.sendStatus(200);
        }

        res.sendStatus(404);
    } catch (error) {
        console.error('Webhook error:', error);
        res.sendStatus(500);
    }
};


// Handle text messages
const handleTextMessage = async (from, text, state, context, customer, store, storeConfig) => {
    // Greetings or start
    if (['hi', 'hello', 'hey', 'start', 'shop'].includes(text)) {
        await sendMessageWithBilling(store, from, 'Welcome Message', 'interactive', () => sendWelcomeMessage(from, customer.name, store, storeConfig));
        await Conversation.upsert(store.id, from, 'main_menu', null);
        return;
    }

    // Hidden Demo command to simulate payment
    if (text.startsWith('demo_pay ')) {
        const orderNum = text.replace('demo_pay ', '').toUpperCase();
        await handlePaymentSuccess({ order_id: orderNum }); // Note: paymentController might need store context too
        return;
    }

    // Handle based on conversation state
    switch (state) {
        case 'awaiting_quantity':
            await handleQuantityInput(from, text, context, store, storeConfig);
            break;

        case 'awaiting_address':
            await handleAddressInput(from, text, context, store, storeConfig);
            break;

        case 'awaiting_variant_selection':
            await handleVariantSelection(from, text, context, store, storeConfig);
            break;

        default:
            // Default: show main menu
            await sendWelcomeMessage(from, customer.name, store, storeConfig);
            await Conversation.upsert(store.id, from, 'main_menu', null);
    }
};

// Handle button replies
const handleButtonReply = async (from, buttonId, state, context, customer, store, storeConfig) => {
    switch (buttonId) {
        case 'browse_products':
            await sendMessageWithBilling(store, from, 'Product Catalog', 'interactive', () => sendProductCatalog(from, store, storeConfig));
            await Conversation.upsert(store.id, from, 'browsing', null);
            break;

        case 'track_order':
            await sendMessageWithBilling(store, from, 'Order Tracking', 'text', () => sendOrderTracking(from, customer.phone, store, storeConfig));
            break;

        case 'contact_support':
            await sendMessageWithBilling(store, from, 'Support Contact', 'text', () => whatsapp.sendTextMessage(from, `💬 Support for ${store.name}:\n\nPlease visit our store or reply here. Our team will assist you shortly!`, storeConfig));
            break;

        case 'confirm_order':
            await handleOrderConfirmation(from, context, store, storeConfig);
            break;

        case 'cancel_order':
            await sendMessageWithBilling(store, from, 'Order Cancelled', 'text', () => whatsapp.sendTextMessage(from, '❌ Order cancelled. Type "hi" to start again.', storeConfig));
            await Conversation.clear(store.id, from);
            break;
    }
};

// Handle list replies (product selection)
const handleListReply = async (from, listId, state, context, customer, store, storeConfig) => {
    if (listId.startsWith('product_')) {
        const productId = parseInt(listId.split('_')[1]);
        await handleProductSelection(from, productId, customer, store, storeConfig);
    } else if (listId.startsWith('variant_')) {
        const variantId = parseInt(listId.split('_')[1]);
        await handleVariantSelectionById(from, variantId, context, store, storeConfig);
    }
};

// Send welcome message with menu
const sendWelcomeMessage = async (from, customerName, store, storeConfig) => {
    const message = `Welcome to ${store.name}! 👋\n\nWhat would you like to do today?`;

    return await whatsapp.sendInteractiveButtons(from, message, [
        { id: 'browse_products', title: '🛍️ Browse Products' },
        { id: 'track_order', title: '📦 Track Order' },
        { id: 'contact_support', title: '💬 Support' }
    ], storeConfig);
};

// Send product catalog
const sendProductCatalog = async (from, store, storeConfig) => {
    const products = await Product.getAll(store.id, true); // Only active products for this store

    if (products.length === 0) {
        return await sendMessageWithBilling(store, from, 'No Products Notice', 'text', () => whatsapp.sendTextMessage(from, '😔 Sorry, no products available right now. Please check back later!', storeConfig));
    }

    const sections = [{
        title: 'Available Products',
        rows: products.slice(0, 10).map(product => {
            const priceStr = `₹${product.base_price} - `;
            const remainingChars = 72 - priceStr.length;
            return {
                id: `product_${product.id}`,
                title: product.name.substring(0, 24),
                description: priceStr + (product.description?.substring(0, remainingChars) || 'No description')
            };
        })
    }];

    return await whatsapp.sendInteractiveList(
        from,
        '🛍️ Here are our available products:',
        'View Products',
        sections,
        storeConfig
    );
};

// Handle product selection
const handleProductSelection = async (from, productId, customer, store, storeConfig) => {
    const product = await Product.getWithVariants(productId, store.id);

    if (!product) {
        return await sendMessageWithBilling(store, from, 'Product Not Found', 'text', () => whatsapp.sendTextMessage(from, '❌ Product not found. Please try again.', storeConfig));
    }

    // Send product image if available
    if (product.image_url) {
        await sendMessageWithBilling(store, from, `Product Image: ${product.name}`, 'image', () => whatsapp.sendImageMessage(from, product.image_url, product.name, storeConfig));
    }

    // Check if product has variants
    if (product.variants && product.variants.length > 0) {
        const sections = [{
            title: 'Select Variant',
            rows: product.variants.slice(0, 10).map(variant => ({
                id: `variant_${variant.id}`,
                title: variant.name.substring(0, 24),
                description: `₹${variant.price} - Stock: ${variant.stock_quantity}`
            }))
        }];

        return await sendMessageWithBilling(store, from, `Variant Selection: ${product.name}`, 'interactive', () => whatsapp.sendInteractiveList(
            from,
            `📦 ${product.name}\n\n${product.description}\n\nPlease select a variant:`,
            'Select Variant',
            sections,
            storeConfig
        ));

        await Conversation.upsert(store.id, from, 'awaiting_variant_selection', { product_id: productId });
    } else {
        // No variants, ask for quantity directly
        await sendMessageWithBilling(store, from, `Product Detail: ${product.name}`, 'text', () => whatsapp.sendTextMessage(
            from,
            `📦 ${product.name}\n💰 Price: ₹${product.base_price}\n\n${product.description}\n\nHow many would you like to order? (Enter a number)`,
            storeConfig
        ));

        await Conversation.upsert(store.id, from, 'awaiting_quantity', {
            product_id: productId,
            variant_id: null,
            price: product.base_price
        });
    }
};

// Handle variant selection
const handleVariantSelectionById = async (from, variantId, context, store, storeConfig) => {
    const variant = await Variant.getById(variantId, store.id);

    if (!variant) {
        return await sendMessageWithBilling(store, from, 'Variant Not Found', 'text', () => whatsapp.sendTextMessage(from, '❌ Variant not found. Please try again.', storeConfig));
    }

    if (variant.stock_quantity <= 0) {
        return await sendMessageWithBilling(store, from, 'Out of Stock Notice', 'text', () => whatsapp.sendTextMessage(from, '😔 Sorry, this variant is out of stock. Please select another one.', storeConfig));
    }

    return await sendMessageWithBilling(store, from, `Quantity Prompt: ${variant.name}`, 'text', () => whatsapp.sendTextMessage(
        from,
        `✅ Selected: ${variant.name}\n💰 Price: ₹${variant.price}\n📦 Available: ${variant.stock_quantity} units\n\nHow many would you like to order? (Enter a number)`,
        storeConfig
    ));

    await Conversation.upsert(store.id, from, 'awaiting_quantity', {
        product_id: variant.product_id,
        variant_id: variantId,
        price: variant.price
    });
};

// Handle quantity input
const handleQuantityInput = async (from, text, context, store, storeConfig) => {
    const quantity = parseInt(text);

    if (isNaN(quantity) || quantity <= 0) {
        return await sendMessageWithBilling(store, from, 'Invalid Quantity Notice', 'text', () => whatsapp.sendTextMessage(from, '❌ Please enter a valid quantity (number greater than 0).', storeConfig));
    }

    if (quantity > 100) {
        return await sendMessageWithBilling(store, from, 'Max Quantity Notice', 'text', () => whatsapp.sendTextMessage(from, '❌ Maximum quantity is 100. Please enter a smaller number.', storeConfig));
    }

    // Check stock if variant
    if (context.variant_id) {
        const variant = await Variant.getById(context.variant_id, store.id);
        if (variant.stock_quantity < quantity) {
            return await sendMessageWithBilling(store, from, 'Variant Low Stock Notice', 'text', () => whatsapp.sendTextMessage(from, `❌ Sorry, only ${variant.stock_quantity} units available. Please enter a smaller quantity.`, storeConfig));
        }
    }

    await sendMessageWithBilling(store, from, 'Address Request', 'text', () => whatsapp.sendTextMessage(from, '📍 *Shipping Address*\n\nPlease enter your full delivery address:', storeConfig));

    await Conversation.upsert(store.id, from, 'awaiting_address', {
        ...context,
        quantity
    });
};

// Handle address input
const handleAddressInput = async (from, address, context, store, storeConfig) => {
    const totalAmount = context.price * context.quantity;
    const product = await Product.getById(context.product_id, store.id);
    const variant = context.variant_id ? await Variant.getById(context.variant_id, store.id) : null;

    const orderSummary = `
📋 *Order Summary*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 Product: ${product.name}
${variant ? `🎨 Variant: ${variant.name}\n` : ''}📊 Quantity: ${context.quantity}
💰 Price per unit: ₹${context.price}
📍 Address: ${address}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💵 *Total Amount: ₹${totalAmount}*

Please confirm your order:
  `.trim();

    return await whatsapp.sendInteractiveButtons(from, orderSummary, [
        { id: 'confirm_order', title: '✅ Confirm Order' },
        { id: 'cancel_order', title: '❌ Cancel' }
    ], storeConfig);

    await Conversation.upsert(store.id, from, 'awaiting_confirmation', {
        ...context,
        address,
        total_amount: totalAmount
    });
};

// Handle order confirmation
const handleOrderConfirmation = async (from, context, store, storeConfig) => {
    try {
        const customer = await Customer.getByPhone(store.id, from);
        const orderNumber = generateOrderNumber();

        // Create order in database
        const orderId = await Order.create({
            store_id: store.id,
            order_number: orderNumber,
            customer_id: customer.id,
            customer_phone: from,
            customer_name: customer.name,
            product_id: context.product_id,
            variant_id: context.variant_id,
            quantity: context.quantity,
            total_amount: context.total_amount,
            status: 'pending',
            address: context.address
        });

        // Create Razorpay payment link
        const paymentLink = await createPaymentLink({
            amount: context.total_amount,
            customer_name: customer.name,
            customer_phone: from,
            description: `Order ${orderNumber} from ${store.name}`,
            order_number: orderNumber
        }, {
            keyId: store.razorpay_key_id,
            keySecret: store.razorpay_key_secret
        });

        // Update stock if variant
        if (context.variant_id) {
            await Variant.updateStock(context.variant_id, -context.quantity);
        }

        await sendMessageWithBilling(store, from, 'Order Confirmed & Payment Link', 'text', () => whatsapp.sendTextMessage(
            from,
            `🎉 *Order Confirmed!*\n\nOrder Number: ${orderNumber}\n💰 Amount: ₹${context.total_amount}\n\n📱 Please complete payment:\n${paymentLink.short_url}\n\nOnce payment is confirmed, we'll process your order immediately!`,
            storeConfig
        ));

        // Clear conversation
        await Conversation.clear(store.id, from);
    } catch (error) {
        console.error('Error confirming order:', error);
        await whatsapp.sendTextMessage(from, '❌ Sorry, there was an error processing your order. Please try again or contact support.', storeConfig);
    }
};

// Send order tracking
const sendOrderTracking = async (from, phone, store, storeConfig) => {
    const orders = await Order.getByCustomerPhone(store.id, phone);

    if (orders.length === 0) {
        return await whatsapp.sendTextMessage(from, '📦 You have no orders yet. Type "hi" to start shopping!', storeConfig);
    }

    const recentOrders = orders.slice(0, 5);
    let message = '📦 *Your Recent Orders:*\n\n';

    recentOrders.forEach((order, idx) => {
        const statusEmoji = {
            pending: '⏳',
            confirmed: '✅',
            paid: '💳',
            shipped: '🚚',
            delivered: '📬',
            cancelled: '❌'
        };

        message += `${idx + 1}. Order #${order.order_number}\n`;
        message += `   ${order.product_name}${order.variant_name ? ` (${order.variant_name})` : ''}\n`;
        message += `   Status: ${statusEmoji[order.status] || '⏳'} ${order.status.toUpperCase()}\n`;
        message += `   Amount: ₹${order.total_amount}\n\n`;
    });

    return await whatsapp.sendTextMessage(from, message, storeConfig);
};
