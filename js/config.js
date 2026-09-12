// ========================================
// ApexLoan Central Environment Configuration
// ========================================
const isLocalhost = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const CONFIG = {
  API_BASE_URL: isLocalhost
    ? (window.location.port === '5000' ? '/api' : 'http://localhost:5000/api')
    : '/api',
  LENDER_NAME: 'Vistas Tecnolabs Finance Limited',
  STARTER_TIER_FEE: 199,
  SUPPORT_EMAIL: 'support@apexloan.in',
  DISBURSAL_WINDOW_MINS: 30,
  RAZORPAY_KEY_ID: 'rzp_live_T2fa96O02ytH4a'
};

window.APP_CONFIG = CONFIG;
