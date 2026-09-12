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
  RAZORPAY_KEY_ID: 'rzp_live_T2fa96O02ytH4a',
  FIREBASE: {
    apiKey: "AIzaSyAOMwBcfy7IlXAYVDdmP1NdSamdVs_6PY0",
    authDomain: "bruno-credits.firebaseapp.com",
    projectId: "bruno-credits",
    storageBucket: "bruno-credits.firebasestorage.app",
    messagingSenderId: "392205247968",
    appId: "1:392205247968:web:1118bd5cb11b986db77785",
    measurementId: "G-48JY6Q5GR3"
  }
};

window.APP_CONFIG = CONFIG;
