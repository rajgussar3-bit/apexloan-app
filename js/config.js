// ========================================
// Bruno Credits Central Environment Configuration
// (Powered by Vistas Tecnolabs Finance Limited)
// ========================================
const isLocalhost = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const CONFIG = {
  APP_NAME: 'Bruno Credits',
  API_BASE_URL: isLocalhost
    ? (window.location.port === '5000' ? '/api' : 'http://localhost:5000/api')
    : '/api',
  LENDER_NAME: 'Vistas Tecnolabs Finance Limited',
  STARTER_TIER_FEE: 199,
  SUPPORT_EMAIL: 'support@brunocredits.in',
  SUPPORT_PHONE: '1800-890-2828',
  DISBURSAL_WINDOW_MINS: 30,
  RAZORPAY_KEY_ID: 'rzp_live_T2fa96O02ytH4a'
};

window.APP_CONFIG = CONFIG;
