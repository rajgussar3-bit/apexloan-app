const express = require('express');
const router = express.Router();
const https = require('https');
const crypto = require('crypto');

// ========================================================
// RAZORPAY CREDENTIALS (Vistas Tecnolabs Finance Limited)
// ========================================================
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_live_T2fa96O02ytH4a';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '524oIGNyFP15pPEif9V5jkio';

// Helper to make HTTPS requests to Razorpay REST API
function makeRazorpayApiRequest(path, method, postDataObj) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    const postData = postDataObj ? JSON.stringify(postDataObj) : '';

    const options = {
      hostname: 'api.razorpay.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, data: parsed });
          } else {
            reject({ statusCode: res.statusCode, error: parsed });
          }
        } catch (e) {
          reject({ statusCode: res.statusCode, error: data });
        }
      });
    });

    req.on('error', (err) => {
      reject({ statusCode: 500, error: err.message });
    });

    if (postData) req.write(postData);
    req.end();
  });
}

// 1. Get Public Gateway Config
router.get('/config', (req, res) => {
  res.json({
    success: true,
    gateway: 'razorpay',
    keyId: RAZORPAY_KEY_ID,
    lender: 'Vistas Tecnolabs Finance Limited',
    environment: 'live'
  });
});

// 2. Create Razorpay Live Order
router.post('/create-order', async (req, res) => {
  try {
    const { amount = 199, currency = 'INR', customerName, customerMobile, customerEmail, loanRefNum } = req.body;
    const amountNum = Number(amount) || 199;
    const amountInPaise = Math.round(amountNum * 100);

    const receipt = 'rcpt_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    const rzpPayload = {
      amount: amountInPaise,
      currency: currency,
      receipt: receipt,
      notes: {
        lender: 'Vistas Tecnolabs Finance Limited',
        loanRefNum: loanRefNum || ('VT-AL-' + Date.now().toString(36).toUpperCase().slice(-6)),
        customerMobile: customerMobile || '',
        customerName: customerName || '',
        purpose: 'Stamp Duty & Disbursal Processing Fee'
      }
    };

    console.log(`[RAZORPAY LIVE] Creating order for ₹${amountNum} (${amountInPaise} paise)`);

    const rzpResult = await makeRazorpayApiRequest('/v1/orders', 'POST', rzpPayload);
    const orderData = rzpResult.data;

    console.log(`[RAZORPAY LIVE] Order created successfully: ${orderData.id}`);

    res.json({
      success: true,
      orderId: orderData.id,
      amount: orderData.amount, // in paise
      amountInRupees: amountNum,
      currency: orderData.currency,
      receipt: orderData.receipt,
      keyId: RAZORPAY_KEY_ID,
      lender: 'Vistas Tecnolabs Finance Limited',
      merchantName: 'Vistas Tecnolabs Finance Limited Escrow Desk',
      purpose: 'One-Time Stamp Duty & Disbursal Fee',
      prefill: {
        name: customerName || '',
        contact: customerMobile || '',
        email: customerEmail || ''
      }
    });

  } catch (err) {
    console.error('[RAZORPAY ERROR]', err);
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.error?.error?.description || err.message || 'Razorpay order creation failed',
      error: err
    });
  }
});

// 3. Verify Razorpay Payment Signature (HMAC SHA-256)
router.post('/verify', (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
      paymentId,
      signature
    } = req.body;

    const finalOrderId = razorpay_order_id || orderId;
    const finalPaymentId = razorpay_payment_id || paymentId;
    const finalSignature = razorpay_signature || signature;

    if (!finalOrderId || !finalPaymentId || !finalSignature) {
      return res.status(400).json({
        success: false,
        message: 'Missing order ID, payment ID, or signature for reconciliation.'
      });
    }

    // Verify HMAC-SHA256 signature
    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${finalOrderId}|${finalPaymentId}`)
      .digest('hex');

    const isMatch = (generatedSignature === finalSignature);

    console.log(`[RAZORPAY VERIFY] Order: ${finalOrderId} | Payment: ${finalPaymentId} | Valid: ${isMatch}`);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: 'Payment signature validation failed. Transaction could not be verified.'
      });
    }

    res.json({
      success: true,
      verified: true,
      orderId: finalOrderId,
      paymentId: finalPaymentId,
      status: 'PAID',
      lender: 'Vistas Tecnolabs Finance Limited',
      disbursalTriggered: true,
      reconciledAt: new Date().toISOString(),
      message: 'Razorpay payment successfully verified. 30-Minute Disbursal Desk activated.'
    });

  } catch (err) {
    console.error('[RAZORPAY VERIFY ERROR]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
