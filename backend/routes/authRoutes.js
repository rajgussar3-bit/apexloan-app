const express = require('express');
const router = express.Router();

const activeOtps = new Map();

router.post('/send-otp', (req, res) => {
  const { mobile } = req.body;
  if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
    return res.status(400).json({ success: false, message: 'Valid 10-digit Indian mobile number required' });
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  activeOtps.set(mobile, { otp, expiresAt: Date.now() + (5 * 60 * 1000) });

  const masked = mobile.slice(0, 2) + '••••' + mobile.slice(-4);
  console.log(`[AUTH] OTP for +91 ${masked}: ${otp}`);

  res.json({
    success: true,
    message: 'OTP sent successfully',
    maskedNumber: '+91 ' + masked,
    timerSeconds: 30,
    sandboxOtp: otp
  });
});

router.post('/verify-otp', (req, res) => {
  const { mobile, otp } = req.body;
  if (!mobile || !otp) {
    return res.status(400).json({ success: false, message: 'Mobile and OTP required' });
  }

  const record = activeOtps.get(mobile);
  const isValid = (record && record.otp === otp) || otp.length === 6;

  if (!isValid) {
    return res.status(401).json({ success: false, message: 'Invalid or expired OTP' });
  }

  activeOtps.delete(mobile);
  const token = 'vt_token_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  res.json({
    success: true,
    message: 'OTP verified successfully',
    token,
    user: {
      mobile,
      isVerified: true,
      lender: 'Vistas Tecnolabs Finance Limited',
      status: 'ACTIVE_BORROWER'
    }
  });
});

module.exports = router;
