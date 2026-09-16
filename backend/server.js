const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const path = require('path');
const rootDir = path.join(__dirname, '..');

// Serve static assets (CSS, JS, media)
app.use('/css', express.static(path.join(rootDir, 'css')));
app.use('/js', express.static(path.join(rootDir, 'js')));
app.use(express.static(rootDir));

// ========================================
// PUBLIC WEB PAGES (Accessible to everyone)
// ========================================
app.get('/', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

app.get('/apply', (req, res) => {
  res.sendFile(path.join(rootDir, 'apply.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(rootDir, 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(rootDir, 'dashboard.html'));
});

app.get(['/admin', '/admin.html'], (req, res) => {
  res.sendFile(path.join(rootDir, 'admin.html'));
});

app.get('/api', (req, res) => {
  res.json({
    app: 'Bruno Credits NBFC Core API',
    lender: 'Vistas Tecnolabs Finance Limited (RBI Regd. NBFC)',
    status: 'ONLINE',
    version: '1.0.0',
    documentation: '/api/health',
    endpoints: [
      'GET /api/health',
      'POST /api/auth/send-otp',
      'POST /api/auth/verify-otp',
      'POST /api/loan/calculate',
      'POST /api/loan/verify-bank',
      'POST /api/loan/disburse',
      'POST /api/payment/create-order',
      'POST /api/payment/verify'
    ]
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    lender: 'Vistas Tecnolabs Finance Limited',
    environment: process.env.NODE_ENV || 'development',
    features: {
      underwriting: 'ACTIVE',
      disbursalStaffDesk: '30_MIN_WINDOW',
      paymentGateway: process.env.PAYMENT_GATEWAY || 'READY_FOR_INTEGRATION'
    }
  });
});

const authRoutes = require('./routes/authRoutes');
const loanRoutes = require('./routes/loanRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/loan', loanRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);

const SettingsStore = require('./data/settingsStore');
app.get('/api/settings', (req, res) => {
  res.json({ success: true, settings: SettingsStore.get() });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.path });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('==================================================');
  console.log(`🚀 Bruno Credits Backend Server running on port ${PORT}`);
  console.log('🏛️ Lending Partner: Vistas Tecnolabs Finance Limited');
  console.log(`🌐 Health check available at: http://localhost:${PORT}/api/health`);
  console.log('==================================================');
});
