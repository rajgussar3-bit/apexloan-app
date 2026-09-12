// ========================================
// ApexLoan Central Environment Configuration
// ========================================
const CONFIG = {
  API_BASE_URL: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : 'https://apexloan-backend.onrender.com/api',
  LENDER_NAME: 'Vistas Tecnolabs Finance Limited',
  STARTER_TIER_FEE: 199,
  SUPPORT_EMAIL: 'support@apexloan.in',
  DISBURSAL_WINDOW_MINS: 30
};

window.APP_CONFIG = CONFIG;
