# 📱 WhatsApp Conversation Flow Examples

## Example 1: Complete Purchase Flow

### Customer Opens Chat
```
👤 Customer: Hi
```

### Bot Responds with Menu
```
🤖 Your Store:

Welcome to Our Store, Customer! 👋

What would you like to do today?

┌────────────────────────┐
│  🛍️ Browse Products    │
└────────────────────────┘
┌────────────────────────┐
│  📦 Track My Order     │
└────────────────────────┘
┌────────────────────────┐
│  💬 Contact Support    │
└────────────────────────┘
```

### Customer Browses Products
```
👤 Customer: [Clicks "Browse Products"]
```

### Bot Shows Product Catalog
```
🤖 Your Store:

🛍️ Here are our available products:

┌────────────────────────────────┐
│ 📱 Premium Cotton T-Shirt      │
│ ₹599 - Comfortable 100% cot...│
│ [View Details]                 │
└────────────────────────────────┘

┌────────────────────────────────┐
│ 🎧 Wireless Bluetooth Headph...│
│ ₹2,999 - High-quality wirele...│
│ [View Details]                 │
└────────────────────────────────┘

┌────────────────────────────────┐
│ 💧 Stainless Steel Water Bot...│
│ ₹799 - Eco-friendly insulate...│
│ [View Details]                 │
└────────────────────────────────┘

[View Products] ▼
```

### Customer Selects Product
```
👤 Customer: [Selects "Premium Cotton T-Shirt"]
```

### Bot Shows Product Image & Variants
```
🤖 Your Store:

[Product Image: T-Shirt]

📦 Premium Cotton T-Shirt

Comfortable 100% cotton t-shirt, perfect for everyday wear

Please select a variant:

┌────────────────────────────────┐
│ Black - S                      │
│ ₹599 - Stock: 45               │
└────────────────────────────────┘
┌────────────────────────────────┐
│ Black - M                      │
│ ₹599 - Stock: 38               │
└────────────────────────────────┘
┌────────────────────────────────┐
│ Black - L                      │
│ ₹599 - Stock: 52               │
└────────────────────────────────┘
...

[Select Variant] ▼
```

### Customer Selects Variant
```
👤 Customer: [Selects "Black - M"]
```

### Bot Confirms & Asks Quantity
```
🤖 Your Store:

✅ Selected: Black - M
💰 Price: ₹599
📦 Available: 38 units

How many would you like to order? (Enter a number)
```

### Customer Enters Quantity
```
👤 Customer: 2
```

### Bot Shows Order Summary
```
🤖 Your Store:

📋 *Order Summary*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 Product: Premium Cotton T-Shirt
🎨 Variant: Black - M
📊 Quantity: 2
💰 Price per unit: ₹599
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💵 *Total Amount: ₹1,198*

Please confirm your order:

┌────────────────────────┐
│  ✅ Confirm Order      │
└────────────────────────┘
┌────────────────────────┐
│  ❌ Cancel             │
└────────────────────────┘
```

### Customer Confirms
```
👤 Customer: [Clicks "Confirm Order"]
```

### Bot Creates Order & Sends Payment Link
```
🤖 Your Store:

🎉 *Order Confirmed!*

Order Number: ORD-1767674800123-456
💰 Amount: ₹1,198

📱 Please complete payment:
https://rzp.io/l/abc123xyz

Once payment is confirmed, we'll process your order immediately!
```

### Customer Pays
```
👤 Customer: [Clicks payment link, completes payment]
```

### Bot Sends Confirmation (After Webhook)
```
🤖 Your Store:

✅ *Payment Successful!*

🎉 Thank you for your payment!

Order Number: ORD-1767674800123-456
💰 Amount: ₹1,198

Your order is being processed and will be shipped soon. We'll notify you once it's on the way! 📦
```

---

## Example 2: Order Tracking

### Customer Checks Order
```
👤 Customer: Hi
```

### Bot Shows Menu
```
🤖 Your Store:

Welcome back, Customer! 👋

[Menu buttons...]
```

### Customer Tracks Order
```
👤 Customer: [Clicks "Track My Order"]
```

### Bot Shows Order History
```
🤖 Your Store:

📦 *Your Recent Orders:*

1. Order #ORD-1767674800123-456
   Premium Cotton T-Shirt (Black - M)
   Status: 💳 PAID
   Amount: ₹1,198

2. Order #ORD-1767600000000-123
   Wireless Bluetooth Headphones (Black)
   Status: 🚚 SHIPPED
   Amount: ₹2,999

3. Order #ORD-1767500000000-789
   Stainless Steel Water Bottle (500ml)
   Status: 📬 DELIVERED
   Amount: ₹799
```

---

## Example 3: Product Without Variants

### Customer Selects Simple Product
```
👤 Customer: [Selects "Leather Wallet"]
```

### Bot Shows Product & Asks Quantity
```
🤖 Your Store:

[Product Image: Wallet]

📦 Leather Wallet
💰 Price: ₹1,299

Genuine leather wallet with multiple card slots

How many would you like to order? (Enter a number)
```

### Customer Orders
```
👤 Customer: 1
```

### Bot Shows Summary
```
🤖 Your Store:

📋 *Order Summary*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 Product: Leather Wallet
📊 Quantity: 1
💰 Price per unit: ₹1,299
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💵 *Total Amount: ₹1,299*

[Confirm/Cancel buttons...]
```

---

## Example 4: Out of Stock

### Customer Selects Variant
```
👤 Customer: [Selects variant with 0 stock]
```

### Bot Notifies
```
🤖 Your Store:

😔 Sorry, this variant is out of stock. Please select another one.
```

---

## Example 5: Invalid Quantity

### Customer Enters Invalid Number
```
👤 Customer: abc
```

### Bot Asks Again
```
🤖 Your Store:

❌ Please enter a valid quantity (number greater than 0).
```

---

## Example 6: Quantity Exceeds Stock

### Customer Enters Too Many
```
👤 Customer: 100
```

### Bot Notifies
```
🤖 Your Store:

❌ Sorry, only 38 units available. Please enter a smaller quantity.
```

---

## Example 7: Contact Support

### Customer Needs Help
```
👤 Customer: [Clicks "Contact Support"]
```

### Bot Provides Contact Info
```
🤖 Your Store:

📞 Support Contact:

Phone: +91 9443856913
Email: support@yourstore.com

Our team will assist you shortly!
```

---

## Example 8: Order Cancellation

### Customer Cancels During Order
```
👤 Customer: [Clicks "Cancel" on order summary]
```

### Bot Confirms
```
🤖 Your Store:

❌ Order cancelled. Type "hi" to start again.
```

---

## Admin Notifications

When orders are placed, the admin sees them in real-time on the dashboard:

### Admin Panel Updates
```
Dashboard → Recent Orders:
┌─────────────────────────────────────────────────────┐
│ Order #ORD-1767674800123-456                        │
│ Customer: +91 9443856913                             │
│ Product: Premium Cotton T-Shirt (Black - M)         │
│ Amount: ₹1,198                                      │
│ Status: [PAID] ✅                                   │
│ Date: 06/01/2026, 10:30 AM                         │
└─────────────────────────────────────────────────────┘
```

### Admin Can Update Status
```
Orders Page → Select order → Update status:
- Pending → Confirmed → Paid → Shipped → Delivered
```

---

## Technical Flow

### Behind the Scenes

1. **Customer sends message** → WhatsApp Cloud API
2. **Webhook triggers** → Backend receives POST request
3. **Backend processes** → Checks conversation state
4. **Database query** → Fetches products/orders
5. **Response generated** → Creates interactive message
6. **WhatsApp API call** → Sends message to customer
7. **Customer sees response** → In their WhatsApp app

### Payment Flow

1. **Order confirmed** → Backend creates Razorpay order
2. **Payment link generated** → Razorpay API
3. **Link sent to customer** → Via WhatsApp
4. **Customer pays** → Razorpay payment page
5. **Webhook triggered** → Razorpay → Backend
6. **Order updated** → Status changed to "paid"
7. **Confirmation sent** → Via WhatsApp

---

## Message Types Used

### Text Messages
```javascript
await whatsapp.sendTextMessage(phone, "Hello!");
```

### Interactive Buttons
```javascript
await whatsapp.sendInteractiveButtons(phone, "Choose:", [
  { id: 'btn1', title: 'Option 1' },
  { id: 'btn2', title: 'Option 2' }
]);
```

### Interactive Lists
```javascript
await whatsapp.sendInteractiveList(phone, "Select product:", "View", [{
  title: 'Products',
  rows: [
    { id: 'p1', title: 'Product 1', description: '₹599' }
  ]
}]);
```

### Images
```javascript
await whatsapp.sendImageMessage(phone, imageUrl, "Caption");
```

---

This is how your WhatsApp Commerce platform will work once you configure the WhatsApp Business API! 🚀
