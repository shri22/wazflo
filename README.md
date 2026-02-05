# 🛍️ WhatsApp Commerce Demo

A complete WhatsApp-based e-commerce solution with Node.js backend and React admin panel. Customers can browse products, place orders, and make payments directly through WhatsApp!

## ✨ Features

### Backend
- ✅ **WhatsApp Business API Integration** - Real WhatsApp messaging
- ✅ **Conversational Commerce** - Interactive product browsing
- ✅ **Razorpay Payment Integration** - Secure payment links
- ✅ **Order Management** - Complete order lifecycle
- ✅ **Product Catalog** - Products with variants support
- ✅ **Webhook Handling** - WhatsApp & Razorpay webhooks
- ✅ **SQLite Database** - Simple, file-based storage

### Admin Panel
- ✅ **Beautiful Dashboard** - Real-time stats and analytics
- ✅ **Product Management** - Add, edit, delete products
- ✅ **Variant Management** - Manage product variants (size, color, etc.)
- ✅ **Order Tracking** - View and update order status
- ✅ **Modern UI** - Dark theme with gradients and animations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- WhatsApp Business API account (Meta)
- Razorpay account (test mode)
- ngrok (for local webhook testing)

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
nano .env

# Initialize database
npm run init-db

# Seed sample data
npm run seed

# Start server
npm run dev
```

The backend will run on `http://localhost:3000`

### 2. Admin Panel Setup

```bash
cd admin-panel

# Install dependencies
npm install

# Start development server
npm run dev
```

The admin panel will run on `http://localhost:5173`

### 3. Expose Backend with ngrok

```bash
# In a new terminal
ngrok http 3000
```

Copy the ngrok URL (e.g., `https://abc123.ngrok.io`) and use it for:
- WhatsApp webhook URL: `https://abc123.ngrok.io/webhook/whatsapp`
- Razorpay webhook URL: `https://abc123.ngrok.io/api/payment/webhook`

## 🔧 Configuration

### WhatsApp Business API Setup

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app → Select "Business" type
3. Add "WhatsApp" product
4. Get your credentials:
   - Phone Number ID
   - Access Token
   - Create a Verify Token (any random string)

5. Configure webhook:
   - URL: `https://your-ngrok-url.ngrok.io/webhook/whatsapp`
   - Verify Token: (same as in .env)
   - Subscribe to: `messages`

### Razorpay Setup

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Get Test API Keys:
   - Key ID
   - Key Secret

3. Configure webhook:
   - URL: `https://your-ngrok-url.ngrok.io/api/payment/webhook`
   - Events: `payment.captured`, `payment.failed`, `order.paid`
   - Get Webhook Secret

### Environment Variables

Edit `backend/.env`:

```env
# Server
PORT=3000

# WhatsApp (from Meta Developer Console)
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token

# Razorpay (from Razorpay Dashboard)
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# URLs
BACKEND_URL=https://your-ngrok-url.ngrok.io
FRONTEND_URL=http://localhost:5173
```

## 📱 How It Works

### Customer Flow (WhatsApp)

1. **Customer sends "Hi"** → Bot responds with welcome menu
2. **Browse Products** → Bot shows product catalog with images
3. **Select Product** → Bot shows variants (if any)
4. **Enter Quantity** → Bot shows order summary
5. **Confirm Order** → Bot creates order and sends payment link
6. **Complete Payment** → Razorpay processes payment
7. **Payment Webhook** → Backend updates order status
8. **Confirmation** → Bot sends order confirmation

### Admin Flow (Web Panel)

1. **Dashboard** → View stats and recent orders
2. **Products** → Add/edit products and variants
3. **Orders** → View all orders and update status
4. **Real-time Updates** → See orders as they come in

## 🗂️ Project Structure

```
whatsapp-commerce-demo/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, Razorpay config
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── services/        # WhatsApp, Razorpay services
│   │   ├── scripts/         # DB init & seed
│   │   └── app.js           # Express app
│   ├── package.json
│   └── .env
│
└── admin-panel/
    ├── src/
    │   ├── components/      # React components
    │   ├── pages/           # Page components
    │   ├── services/        # API service
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

## 📊 Database Schema

### Products
- id, name, description, base_price, image_url, category, is_active

### Variants
- id, product_id, name, sku, price, stock_quantity, attributes

### Orders
- id, order_number, customer info, product info, amount, status, payment details

### Customers
- id, phone, name, whatsapp_id, last_interaction

### Conversations
- id, customer_phone, state, context (for conversation flow)

## 🎯 API Endpoints

### Webhooks
- `GET/POST /webhook/whatsapp` - WhatsApp webhook
- `POST /api/payment/webhook` - Razorpay webhook
- `GET /api/payment/callback` - Payment callback page

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/:id/variants` - Get variants
- `POST /api/products/:id/variants` - Create variant

### Orders
- `GET /api/orders` - List all orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status
- `GET /api/orders/stats` - Get order statistics

## 🧪 Testing

### Test WhatsApp Flow

1. Add your phone number to Meta test numbers
2. Send "Hi" to your WhatsApp Business number
3. Follow the conversation flow
4. Complete a test order

### Test Payment

1. Use Razorpay test cards:
   - Success: `4111 1111 1111 1111`
   - Failure: `4000 0000 0000 0002`
   - CVV: Any 3 digits
   - Expiry: Any future date

## 🎨 Customization

### Add More Products
```bash
cd backend
npm run seed
```

### Modify Conversation Flow
Edit `backend/src/controllers/webhookController.js`

### Customize UI Theme
Edit `admin-panel/src/index.css` CSS variables

## 🚀 Production Deployment

### Backend
- Deploy to Railway, Render, or DigitalOcean
- Use PostgreSQL instead of SQLite
- Set environment variables
- Update webhook URLs

### Admin Panel
- Build: `npm run build`
- Deploy to Vercel, Netlify, or Cloudflare Pages
- Set API URL environment variable

## 📝 License

MIT

## 🤝 Support

For issues or questions:
- Check the code comments
- Review the API documentation
- Test with sample data first

## 🎉 Features to Add

- [ ] Customer authentication
- [ ] Inventory management
- [ ] Shipping integration
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Product categories
- [ ] Discount codes
- [ ] Order notifications (SMS/Email)

---

**Built with ❤️ using Node.js, React, WhatsApp Business API, and Razorpay**
