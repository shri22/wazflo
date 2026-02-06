import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';

// Import routes
import webhookRoutes from './routes/webhook.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payment.js';
import authRoutes from './routes/auth.js';
import storeRoutes from './routes/stores.js';
import platformRoutes from './routes/platform.js';
import templateRoutes from './routes/templates.js';
import auth from './middleware/auth.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Import database setup
import { createTables } from './models/schema.js';

// Import Cron Service
import { runRecoveryCheck } from './services/cronService.js';
import schedule from 'node-schedule';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Initialize Cron Jobs
schedule.scheduleJob('0 * * * *', runRecoveryCheck); // Run every hour
console.log('⏰ Cron Jobs Initialized: Abandoned Cart Recovery active.');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('dev'));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Parse JSON for most routes
app.use('/api', express.json());
app.use('/api', express.urlencoded({ extended: true }));

// Raw body for webhook verification (Razorpay needs raw body)
app.use('/api/payment/webhook', bodyParser.json({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}));

// Parse JSON for webhook routes
app.use('/webhook', express.json());

// Initialize database
createTables();

// Routes
app.use('/webhook', webhookRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/stores', auth, storeRoutes);
app.use('/api/products', auth, productRoutes);
app.use('/api/orders', auth, orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/platform', platformRoutes);
app.use('/api/templates', auth, templateRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Wazflo Backend API',
        version: '1.0.0',
        endpoints: {
            webhook: '/webhook/whatsapp',
            products: '/api/products',
            orders: '/api/orders',
            payment: '/api/payment'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 WhatsApp Commerce Backend                       ║
║                                                       ║
║   Server running on: http://localhost:${PORT}        ║
║                                                       ║
║   📱 WhatsApp Webhook: /webhook/whatsapp             ║
║   💳 Payment Webhook:  /api/payment/webhook          ║
║   🛍️  Products API:     /api/products                ║
║   📦 Orders API:       /api/orders                   ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

export default app;
