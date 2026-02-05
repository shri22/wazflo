# 🚀 Quick Start Guide

## ✅ Setup Complete!

Your WhatsApp Commerce Demo is ready to use!

## 📁 Project Location
```
/Users/admin/.gemini/antigravity/scratch/whatsapp-commerce-demo/
```

## 🎯 Next Steps

### 1. Start the Backend Server

```bash
cd /Users/admin/.gemini/antigravity/scratch/whatsapp-commerce-demo/backend
npm run dev
```

The backend will run on **http://localhost:3000**

### 2. Start the Admin Panel (in a new terminal)

```bash
cd /Users/admin/.gemini/antigravity/scratch/whatsapp-commerce-demo/admin-panel
npm run dev
```

The admin panel will run on **http://localhost:5173**

### 3. Open Admin Panel

Open your browser and go to: **http://localhost:5173**

You should see:
- ✅ Dashboard with stats
- ✅ Products page (5 sample products already added!)
- ✅ Orders page

## 🔧 Configure WhatsApp & Razorpay

To enable real WhatsApp messaging and payments:

### WhatsApp Business API Setup

1. Go to https://developers.facebook.com/
2. Create a new app → Select "Business"
3. Add "WhatsApp" product
4. Get your credentials and update `backend/.env`:
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_ACCESS_TOKEN`
   - `WHATSAPP_VERIFY_TOKEN` (create your own)

### Razorpay Setup

1. Go to https://dashboard.razorpay.com/
2. Get Test API Keys
3. Update `backend/.env`:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `RAZORPAY_WEBHOOK_SECRET`

### Expose Backend with ngrok

```bash
# Install ngrok if you haven't
brew install ngrok

# Expose backend
ngrok http 3000
```

Copy the ngrok URL and configure:
- WhatsApp Webhook: `https://your-url.ngrok.io/webhook/whatsapp`
- Razorpay Webhook: `https://your-url.ngrok.io/api/payment/webhook`

## 📱 Test the Admin Panel

1. **Dashboard**: View order statistics
2. **Products**: 
   - Click "Add Product" to create new products
   - Edit existing products
   - Add variants (size, color, etc.)
3. **Orders**: View and manage orders

## 🎨 Features

### Current Features ✅
- Beautiful dark-themed admin panel
- Product management with variants
- Order tracking
- Real-time stats
- Sample data pre-loaded

### To Enable (requires WhatsApp & Razorpay setup):
- WhatsApp conversational commerce
- Payment link generation
- Order notifications
- Webhook handling

## 📚 Sample Data

The database has been seeded with:
- 5 Products (T-Shirt, Headphones, Water Bottle, Wallet, Smart Watch)
- 18 Variants (different sizes and colors)

## 🛠️ Useful Commands

```bash
# Backend
cd backend
npm run dev          # Start development server
npm run init-db      # Initialize database
npm run seed         # Seed sample data

# Admin Panel
cd admin-panel
npm run dev          # Start development server
npm run build        # Build for production
```

## 🎉 You're All Set!

Start both servers and open http://localhost:5173 to see your admin panel!

For WhatsApp integration, follow the configuration steps above.

---

**Need Help?**
- Check README.md for detailed documentation
- Review the code comments
- Test with sample data first
