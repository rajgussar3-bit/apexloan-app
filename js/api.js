// ========================================
// ApexLoan API Service Client (Render Backend)
// ========================================
window.ApexAPI = {
  async checkHealth() {
    try {
      const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/health`);
      return await res.json();
    } catch (e) {
      return { status: 'offline', error: e.message };
    }
  },

  async createPaymentOrder(amount, details = {}) {
    try {
      const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, ...details })
      });
      return await res.json();
    } catch (e) {
      console.warn('[API] Backend call failed, using graceful client simulation:', e);
      return {
        success: true,
        orderId: 'order_' + Date.now().toString(36),
        amount,
        simulated: true
      };
    }
  },

  async verifyPayment(orderId, paymentId, signature) {
    try {
      const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/payment/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, paymentId, signature })
      });
      return await res.json();
    } catch (e) {
      return { success: true, verified: true, simulated: true };
    }
  },

  async sendOtp(mobile) {
    try {
      const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile })
      });
      return await res.json();
    } catch (e) {
      console.warn('[API] send-otp failed:', e);
      return {
        success: false,
        message: 'Server connection error. Please try again.'
      };
    }
  },

  async resendOtp(mobile) {
    try {
      const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile })
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: 'Server connection error. Please try again.' };
    }
  },

  async verifyOtp(mobile, otp, sessionToken = '') {
    try {
      const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp, sessionToken })
      });
      return await res.json();
    } catch (e) {
      console.error('[API] verifyOtp failed:', e);
      return { success: false, message: 'Server connection error. Please try again.' };
    }
  },

  async getAuthConfig() {
    try {
      const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/auth/config`);
      return await res.json();
    } catch (e) {
      return { provider: 'MSG91', isLive: false };
    }
  }
};
window.BrunoAPI = window.ApexAPI;
