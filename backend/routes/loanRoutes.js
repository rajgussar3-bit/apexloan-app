const express = require('express');
const router = express.Router();

function calculateDisbursalFee(amount) {
  if (amount <= 25000) return 199;
  if (amount <= 50000) return 299;
  return 499;
}

router.post('/calculate', (req, res) => {
  const { salary = 20000, experience = '1-2', dob, aadhaarVerified = true, panVerified = true } = req.body;
  const numSalary = parseInt(salary) || 20000;

  if (numSalary < 15000) {
    return res.json({
      approved: false,
      reason: 'Minimum monthly income requirement is ₹15,000 as per Vistas Tecnolabs Finance Limited underwriting policy.'
    });
  }

  const expBonusMap = { '0-1': 0.05, '1-2': 0.25, '2-5': 0.55, '5-10': 0.80, '10+': 1.00 };
  const expFactor = expBonusMap[experience] || 0.25;
  const kycBonus = (aadhaarVerified && panVerified) ? 0.25 : 0.15;

  let creditLimit = 16420;
  let tierName = 'Standard Starter Loan (Tier 1)';

  if (numSalary >= 15000 && numSalary < 25000) {
    const minTier = 11368;
    const maxTier = 18372;
    const range = maxTier - minTier;
    const salaryRatio = (numSalary - 15000) / (25000 - 15000);
    const compositeScore = Math.min(1, Math.max(0, (salaryRatio * 0.45) + (expFactor * 0.30) + kycBonus));
    creditLimit = Math.round(minTier + (compositeScore * range));
    tierName = 'Standard Starter Loan (Tier 1)';
  } else if (numSalary >= 25000 && numSalary < 45000) {
    const minTier = 25000;
    const maxTier = 45000;
    const salaryRatio = (numSalary - 25000) / (45000 - 25000);
    const compositeScore = Math.min(1, Math.max(0, (salaryRatio * 0.50) + (expFactor * 0.35) + 0.15));
    creditLimit = Math.round(minTier + (compositeScore * (maxTier - minTier)));
    tierName = 'Elevated Personal Loan (Tier 2)';
  } else {
    creditLimit = Math.min(100000, Math.round(numSalary * 1.5));
    tierName = 'Prime Personal Loan (Tier 3)';
  }

  const annualRate = (creditLimit <= 25000) ? 24.0 : 18.0;
  const monthlyRate = annualRate / (12 * 100);
  const emi = Math.round(
    creditLimit * monthlyRate * Math.pow(1 + monthlyRate, 12) /
    (Math.pow(1 + monthlyRate, 12) - 1)
  );

  res.json({
    approved: true,
    lender: 'Vistas Tecnolabs Finance Limited',
    creditLimit,
    maxTenure: 12,
    selectedTenure: 12,
    interestRate: annualRate,
    monthlyEmi: emi,
    totalRepayment: emi * 12,
    totalInterest: (emi * 12) - creditLimit,
    tierName,
    disbursalFee: calculateDisbursalFee(creditLimit)
  });
});

router.post('/disburse', (req, res) => {
  const { loanAmount, accountNumber, bankName, ifscCode, feePaid = true } = req.body;

  const refNum = 'VT-AL-' + Date.now().toString(36).toUpperCase().slice(-6);
  const etaMs = Date.now() + (30 * 60 * 1000);

  res.json({
    success: true,
    status: 'DISBURSAL_PROCESSING',
    refNum,
    loanAmount: loanAmount || 16420,
    lender: 'Vistas Tecnolabs Finance Limited',
    bankDetails: {
      bankName: bankName || 'Bank',
      accountNumberMasked: accountNumber ? '••••' + accountNumber.slice(-4) : '••••4567',
      ifscCode: ifscCode || 'SBIN0001234'
    },
    disbursalEta: new Date(etaMs).toISOString(),
    etaMinutes: 30,
    message: 'One-time fee verified. Loan amount is in Disbursal Stage. Banking staff will dispatch within 30 minutes.'
  });
});

module.exports = router;
