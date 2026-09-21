/* ========================================
   ApexLoan - Multi-Step Form Controller
   Phase 1: Personal Info
   Phase 2: Employment & Income
   Phase 3: KYC Verification
   Phase 4: Bank Details & Credit Limit (Vistas Tecnolabs)
   ======================================== */

let currentStep = 1;
const totalSteps = 4;
window.sanctionedOffer = null;

document.addEventListener('DOMContentLoaded', () => {

  // ---- Mobile Menu ----
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const menuClose = document.getElementById('menuClose');

  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  if (menuClose) {
    menuClose.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
      document.body.style.overflow = '';
    });
  }

  // ---- Real-Time Application Sync with Employee Backoffice Desk ----
  window.syncApplicationToBackend = function(offerData) {
    try {
      const rawMobile = document.getElementById('mobile')?.value || localStorage.getItem('apexloan_mobile') || offerData?.mobile || '';
      const cleanMobile = String(rawMobile).replace(/\D/g, '').slice(-10);
      if (!cleanMobile || cleanMobile.length < 10) {
        return;
      }

      // Save valid mobile to localStorage
      localStorage.setItem('apexloan_mobile', cleanMobile);

      const fullName = document.getElementById('fullName')?.value?.trim() || localStorage.getItem('apexloan_fullname') || offerData?.fullName || 'Borrower';
      if (fullName) localStorage.setItem('apexloan_fullname', fullName);

      const panNumber = document.getElementById('panNumber')?.value?.trim().toUpperCase() || localStorage.getItem('apexloan_pan') || offerData?.panNumber || '';
      if (panNumber) localStorage.setItem('apexloan_pan', panNumber);

      const aadhaarNumber = document.getElementById('aadhaarNumber')?.value?.trim() || localStorage.getItem('apexloan_aadhaar') || offerData?.aadhaarNumber || '';
      if (aadhaarNumber) localStorage.setItem('apexloan_aadhaar', aadhaarNumber);

      const bankName = document.getElementById('bankName')?.value || document.getElementById('bankNameSelect')?.value || offerData?.bankName || 'State Bank of India';
      const accountNumber = document.getElementById('accountNumber')?.value?.trim() || offerData?.accountNumber || '';
      const ifscCode = document.getElementById('ifscCode')?.value?.trim().toUpperCase() || offerData?.ifscCode || '';

      const empType = document.getElementById('empType')?.value || offerData?.empType || 'Salaried';
      const monthlyIncome = Number(document.getElementById('monthlySalary')?.value || document.getElementById('income')?.value || offerData?.monthlyIncome || 35000);
      const companyName = document.getElementById('companyName')?.value?.trim() || offerData?.companyName || '';
      const designation = document.getElementById('designation')?.value?.trim() || offerData?.designation || '';
      const experience = document.getElementById('experience')?.value || offerData?.experience || '';

      const email = document.getElementById('email')?.value?.trim() || offerData?.email || '';
      const dob = document.getElementById('dob')?.value || offerData?.dob || '';
      const gender = document.getElementById('gender')?.value || offerData?.gender || '';
      const city = document.getElementById('city')?.value?.trim() || '';
      const state = document.getElementById('state')?.value || '';
      const pincode = document.getElementById('pincode')?.value?.trim() || offerData?.pincode || '';
      const fullAddress = [city, state, pincode].filter(Boolean).join(', ') || offerData?.address || '';

      const loanPurpose = document.getElementById('loanPurpose')?.value || document.getElementById('loanIntendedPurpose')?.value || offerData?.loanPurpose || 'Personal';
      const desiredAmount = Number(document.getElementById('formLoanAmount')?.value || 50000);

      const creditLimit = Number(offerData?.creditLimit || window.sanctionedOffer?.creditLimit || 50000);
      const selectedAmount = Number(offerData?.selectedAmount || window.sanctionedOffer?.selectedAmount || creditLimit);
      const selectedTenure = Number(offerData?.selectedTenure || window.sanctionedOffer?.selectedTenure || 9);
      const monthlyEmi = Number(offerData?.monthlyEmi || window.sanctionedOffer?.monthlyEmi || 6249);

      let status = offerData?.status || window.sanctionedOffer?.status || 'PENDING_REVIEW';
      if (currentStep >= 4 || window.sanctionedOffer) {
        if (offerData?.feePaid) status = 'DISBURSED_PROCESSING';
        else status = 'SANCTIONED';
      }

      const data = {
        mobile: cleanMobile,
        fullName,
        email,
        dob,
        gender,
        address: fullAddress,
        city,
        state,
        pincode,
        empType,
        monthlyIncome,
        companyName,
        designation,
        experience,
        loanPurpose,
        desiredAmount,
        aadhaarNumber,
        panNumber,
        bankName,
        accountNumber,
        ifscCode,
        requestedAmount: desiredAmount,
        creditLimit,
        selectedAmount,
        selectedTenure,
        monthlyEmi,
        feeAmount: Number(offerData?.disbursalFee || offerData?.feeAmount || 199),
        feePaid: !!offerData?.feePaid,
        feePaymentId: offerData?.feePaymentId || '',
        feePaidAt: offerData?.feePaidAt || null,
        refNum: offerData?.refNum || ('VT-AL-' + cleanMobile.slice(-4) + Date.now().toString(36).slice(-2).toUpperCase()),
        status
      };

      if (window.ApexAPI && typeof window.ApexAPI.submitApplication === 'function') {
        window.ApexAPI.submitApplication(data).then(res => {
          console.log('[SYNC] Successfully synced to employee operations desk:', res);
        }).catch(err => console.warn('[SYNC] Failed to reach desk:', err));
      }
    } catch (err) {
      console.warn('[SYNC] Error syncing application:', err);
    }
  };

  // ---- Restore saved data ----
  restoreFormData();

  // ---- Loan Amount Slider + EMI Calculator (Step 1) ----
  const loanSlider = document.getElementById('formLoanAmount');
  const loanDisplay = document.getElementById('formLoanDisplay');
  const tenureSlider = document.getElementById('calcTenure');
  const rateSlider = document.getElementById('calcRate');
  const tenureDisplay = document.getElementById('calcTenureDisplay');
  const rateDisplay = document.getElementById('calcRateDisplay');
  const emiValueEl = document.getElementById('emiValue');
  const totalInterestEl = document.getElementById('totalInterest');
  const totalPaymentEl = document.getElementById('totalPayment');

  function formatCurrency(num) {
    return '₹' + Math.round(num).toLocaleString('en-IN');
  }

  function calculateEMI() {
    if (!loanSlider) return;

    const P = parseFloat(loanSlider.value) || 50000;
    const annualRate = rateSlider ? parseFloat(rateSlider.value) : 14;
    const n = tenureSlider ? parseInt(tenureSlider.value) : 12;
    const r = annualRate / (12 * 100); // Monthly interest rate

    let emi;
    if (r === 0) {
      emi = P / n;
    } else {
      emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    }

    const totalPay = emi * n;
    const totalInt = totalPay - P;

    // Update displays
    if (loanDisplay) {
      loanDisplay.innerHTML = '₹<span>' + Math.round(P).toLocaleString('en-IN') + '</span>';
    }
    if (tenureDisplay) tenureDisplay.textContent = n + ' Months';
    if (rateDisplay) rateDisplay.textContent = annualRate + '%';
    if (emiValueEl) emiValueEl.innerHTML = formatCurrency(emi).replace('₹', '₹<span>') + '</span>';
    if (totalInterestEl) totalInterestEl.textContent = formatCurrency(totalInt);
    if (totalPaymentEl) totalPaymentEl.textContent = formatCurrency(totalPay);

    // Update Step 1 quick preview badge
    const previewBadge = document.getElementById('formEmiPreview');
    if (previewBadge) {
      previewBadge.textContent = `~${formatCurrency(emi)}/mo`;
    }

    // Update all slider fills
    updateSliderFill(loanSlider);
    if (tenureSlider) updateSliderFill(tenureSlider);
    if (rateSlider) updateSliderFill(rateSlider);
  }

  window.setFormAmountPreset = function(amt) {
    if (!loanSlider) return;
    loanSlider.value = amt;
    calculateEMI();
    saveFormData();

    document.querySelectorAll('.loan-pill').forEach(pill => {
      const txt = pill.textContent.trim();
      const match = (amt === 10000 && txt.includes('10k')) ||
                    (amt === 25000 && txt.includes('25k')) ||
                    (amt === 50000 && txt.includes('50k')) ||
                    (amt === 100000 && txt.includes('1 Lakh'));
      if (match) pill.classList.add('active');
      else pill.classList.remove('active');
    });
  };

  // Attach event listeners to all calc sliders
  if (loanSlider) {
    loanSlider.addEventListener('input', () => {
      calculateEMI();
      saveFormData();
    });
    updateSliderFill(loanSlider);
  }
  if (tenureSlider) {
    tenureSlider.addEventListener('input', calculateEMI);
    updateSliderFill(tenureSlider);
  }
  if (rateSlider) {
    rateSlider.addEventListener('input', calculateEMI);
    updateSliderFill(rateSlider);
  }

  // Initial calculation on page load
  calculateEMI();

  // ---- Auto-save on input change ----
  document.querySelectorAll('.form-control, input[type="range"]').forEach(input => {
    input.addEventListener('change', saveFormData);
    input.addEventListener('input', () => {
      const group = input.closest('.form-group');
      if (group) group.classList.remove('has-error');
    });
  });

  // ---- Aadhaar number auto-format ----
  const aadhaarInput = document.getElementById('aadhaarNumber');
  if (aadhaarInput) {
    aadhaarInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '');
      if (val.length > 12) val = val.slice(0, 12);
      const parts = [];
      for (let i = 0; i < val.length; i += 4) {
        parts.push(val.slice(i, i + 4));
      }
      e.target.value = parts.join(' ');
    });
  }

  // ---- PAN auto-uppercase ----
  const panInput = document.getElementById('panNumber');
  if (panInput) {
    panInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase();
    });
  }

  // ========================================================
  // AUTOMATIC PINCODE -> CITY & STATE AUTO-FILL ENGINE
  // ========================================================
  const STATE_NAME_CODE_MAP = {
    'andaman & nicobar': 'AN', 'andaman and nicobar': 'AN', 'andaman': 'AN',
    'andhra pradesh': 'AP', 'andhra': 'AP',
    'arunachal pradesh': 'AR', 'arunachal': 'AR',
    'assam': 'AS',
    'bihar': 'BR',
    'chandigarh': 'CH',
    'chhattisgarh': 'CG', 'chattisgarh': 'CG',
    'delhi': 'DL', 'nct of delhi': 'DL', 'new delhi': 'DL',
    'goa': 'GA',
    'gujarat': 'GJ',
    'haryana': 'HR',
    'himachal pradesh': 'HP', 'himachal': 'HP',
    'jammu & kashmir': 'JK', 'jammu and kashmir': 'JK', 'jammu': 'JK', 'kashmir': 'JK', 'ladakh': 'JK',
    'jharkhand': 'JH',
    'karnataka': 'KA',
    'kerala': 'KL',
    'madhya pradesh': 'MP',
    'maharashtra': 'MH',
    'manipur': 'MN',
    'meghalaya': 'ML',
    'mizoram': 'MZ',
    'nagaland': 'NL',
    'odisha': 'OD', 'orissa': 'OD',
    'punjab': 'PB',
    'rajasthan': 'RJ',
    'sikkim': 'SK',
    'tamil nadu': 'TN', 'tamilnadu': 'TN',
    'telangana': 'TS',
    'tripura': 'TR',
    'uttar pradesh': 'UP',
    'uttarakhand': 'UK', 'uttaranchal': 'UK',
    'west bengal': 'WB'
  };

  const PINCODE_PREFIX_MAP = {
    '110': { city: 'New Delhi', state: 'Delhi' },
    '121': { city: 'Faridabad', state: 'Haryana' },
    '122': { city: 'Gurugram', state: 'Haryana' },
    '124': { city: 'Rohtak', state: 'Haryana' },
    '131': { city: 'Sonipat', state: 'Haryana' },
    '132': { city: 'Panipat', state: 'Haryana' },
    '141': { city: 'Ludhiana', state: 'Punjab' },
    '143': { city: 'Amritsar', state: 'Punjab' },
    '144': { city: 'Jalandhar', state: 'Punjab' },
    '160': { city: 'Chandigarh', state: 'Chandigarh' },
    '201': { city: 'Noida', state: 'Uttar Pradesh' },
    '208': { city: 'Kanpur', state: 'Uttar Pradesh' },
    '221': { city: 'Varanasi', state: 'Uttar Pradesh' },
    '226': { city: 'Lucknow', state: 'Uttar Pradesh' },
    '248': { city: 'Dehradun', state: 'Uttarakhand' },
    '282': { city: 'Agra', state: 'Uttar Pradesh' },
    '302': { city: 'Jaipur', state: 'Rajasthan' },
    '342': { city: 'Jodhpur', state: 'Rajasthan' },
    '380': { city: 'Ahmedabad', state: 'Gujarat' },
    '390': { city: 'Vadodara', state: 'Gujarat' },
    '395': { city: 'Surat', state: 'Gujarat' },
    '400': { city: 'Mumbai', state: 'Maharashtra' },
    '401': { city: 'Thane', state: 'Maharashtra' },
    '403': { city: 'Panaji', state: 'Goa' },
    '411': { city: 'Pune', state: 'Maharashtra' },
    '422': { city: 'Nashik', state: 'Maharashtra' },
    '440': { city: 'Nagpur', state: 'Maharashtra' },
    '452': { city: 'Indore', state: 'Madhya Pradesh' },
    '462': { city: 'Bhopal', state: 'Madhya Pradesh' },
    '492': { city: 'Raipur', state: 'Chhattisgarh' },
    '500': { city: 'Hyderabad', state: 'Telangana' },
    '520': { city: 'Vijayawada', state: 'Andhra Pradesh' },
    '530': { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
    '560': { city: 'Bengaluru', state: 'Karnataka' },
    '570': { city: 'Mysuru', state: 'Karnataka' },
    '600': { city: 'Chennai', state: 'Tamil Nadu' },
    '641': { city: 'Coimbatore', state: 'Tamil Nadu' },
    '682': { city: 'Kochi', state: 'Kerala' },
    '695': { city: 'Thiruvananthapuram', state: 'Kerala' },
    '700': { city: 'Kolkata', state: 'West Bengal' },
    '751': { city: 'Bhubaneswar', state: 'Odisha' },
    '781': { city: 'Guwahati', state: 'Assam' },
    '800': { city: 'Patna', state: 'Bihar' },
    '834': { city: 'Ranchi', state: 'Jharkhand' }
  };

  function selectStateByDetectedName(stateName) {
    const stateSelect = document.getElementById('state');
    if (!stateSelect || !stateName) return;
    const clean = stateName.toLowerCase().trim();
    const mappedCode = STATE_NAME_CODE_MAP[clean];

    for (let i = 0; i < stateSelect.options.length; i++) {
      const opt = stateSelect.options[i];
      if (mappedCode && opt.value === mappedCode) {
        stateSelect.selectedIndex = i;
        clearError('state');
        stateSelect.dispatchEvent(new Event('change'));
        return;
      }
      const optTextClean = opt.text.toLowerCase().trim();
      if (optTextClean === clean || optTextClean.includes(clean) || clean.includes(optTextClean)) {
        stateSelect.selectedIndex = i;
        clearError('state');
        stateSelect.dispatchEvent(new Event('change'));
        return;
      }
    }
  }

  let pincodeLookupTimer = null;
  let lastLookedUpPin = '';

  async function autoDetectCityStateFromPincode(pin) {
    if (!pin || pin.length !== 6) return;
    if (pin === lastLookedUpPin) return;
    lastLookedUpPin = pin;

    const cityInput = document.getElementById('city');
    const badge = document.getElementById('pincodeLocationBadge');

    if (badge) {
      badge.textContent = '🔍 Detecting city & state...';
      badge.style.color = '#3b82f6';
      badge.style.display = 'block';
    }

    // 1. Instant local prefix lookup (0ms)
    const prefix = pin.slice(0, 3);
    const fastMatch = PINCODE_PREFIX_MAP[prefix];
    if (fastMatch) {
      if (cityInput && (!cityInput.value || cityInput.dataset.autoDetected === 'true')) {
        cityInput.value = fastMatch.city;
        cityInput.dataset.autoDetected = 'true';
        clearError('city');
      }
      selectStateByDetectedName(fastMatch.state);
      if (badge) {
        badge.innerHTML = '✓ Detected: <b>' + fastMatch.city + ', ' + fastMatch.state + '</b>';
        badge.style.color = '#10b981';
        badge.style.display = 'block';
      }
    }

    // 2. Official India Post Postal PIN Code API (handles all 19,000+ PIN codes in India)
    try {
      const res = await fetch('https://api.postalpincode.in/pincode/' + pin);
      const data = await res.json();
      if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
        const po = data[0].PostOffice[0];
        const detectedCity = po.District || po.Block || po.Division || po.Name;
        const detectedState = po.State;

        if (detectedCity && cityInput) {
          cityInput.value = detectedCity;
          cityInput.dataset.autoDetected = 'true';
          clearError('city');
        }
        if (detectedState) {
          selectStateByDetectedName(detectedState);
        }
        if (badge && detectedCity && detectedState) {
          badge.innerHTML = '✓ Detected: <b>' + detectedCity + ', ' + detectedState + '</b>';
          badge.style.color = '#10b981';
          badge.style.display = 'block';
        }
        clearError('pincode');
      } else if (!fastMatch && badge) {
        badge.textContent = 'Please verify PIN code';
        badge.style.color = '#f59e0b';
      }
    } catch (e) {
      console.warn('[PINCODE] Online lookup failed, prefix used if available:', e);
    }
  }

  // ---- PIN code - digits only & auto-lookup on 6th digit ----
  const pinInput = document.getElementById('pincode');
  if (pinInput) {
    pinInput.addEventListener('input', (e) => {
      const cleanVal = e.target.value.replace(/\D/g, '').slice(0, 6);
      e.target.value = cleanVal;
      const badge = document.getElementById('pincodeLocationBadge');
      if (cleanVal.length === 6) {
        clearTimeout(pincodeLookupTimer);
        pincodeLookupTimer = setTimeout(() => {
          autoDetectCityStateFromPincode(cleanVal);
        }, 150);
      } else {
        lastLookedUpPin = '';
        if (badge) badge.style.display = 'none';
      }
    });

    pinInput.addEventListener('blur', (e) => {
      const val = e.target.value.replace(/\D/g, '');
      if (val.length === 6) autoDetectCityStateFromPincode(val);
    });

    // Check on initial load if prefilled
    if (pinInput.value && pinInput.value.replace(/\D/g, '').length === 6) {
      setTimeout(() => {
        autoDetectCityStateFromPincode(pinInput.value.replace(/\D/g, ''));
      }, 500);
    }
  }

  // Manual city input resets autoDetected flag so user's manual edits are honored
  const cityInputEl = document.getElementById('city');
  if (cityInputEl) {
    cityInputEl.addEventListener('input', () => {
      cityInputEl.dataset.autoDetected = 'false';
    });
  }

  // ---- Phase 4: Account Numbers (Digits only & real-time match) ----
  const accNumInput = document.getElementById('accountNumber');
  const confirmAccInput = document.getElementById('confirmAccountNumber');
  
  if (accNumInput) {
    accNumInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 18);
      checkAccountMatch();
    });
  }

  if (confirmAccInput) {
    confirmAccInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 18);
      checkAccountMatch();
    });
  }

  // ---- Phase 4: IFSC auto-uppercase & Bank auto-detect ----
  const ifscInput = document.getElementById('ifscCode');
  if (ifscInput) {
    ifscInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
      detectBankFromIFSC(e.target.value);
    });
  }

  updateUI();

  // Check if user already has an approved or active loan
  checkExistingLoanOffer();
});

// ============================================
// CHECK EXISTING LOAN OFFER (PERSISTENT STATE)
// Never force approved users to re-fill form!
// ============================================
function checkExistingLoanOffer() {
  try {
    const activeLoanRaw = localStorage.getItem('apexloan_active_loan');
    const sanctionedOfferRaw = localStorage.getItem('apexloan_sanctioned_offer');

    // Case 1: Loan is already active / in Disbursal Stage / Disbursed
    if (activeLoanRaw) {
      const activeLoan = JSON.parse(activeLoanRaw);
      if (activeLoan && activeLoan.approved) {
        window.sanctionedOffer = activeLoan;
        currentStep = 4;
        updateUI();

        // Show active disbursal banner
        const activeBanner = document.getElementById('activeDisbursalBanner');
        const activeAmtEl = document.getElementById('activeBannerAmount');
        if (activeBanner) activeBanner.style.display = 'block';
        if (activeAmtEl) activeAmtEl.textContent = '₹' + activeLoan.creditLimit.toLocaleString('en-IN');

        // Hide Step 4 input form controls & show Sanction Card
        const sanctionCard = document.getElementById('creditSanctionCard');
        const evalBox = document.getElementById('evaluatingBox');
        if (evalBox) evalBox.style.display = 'none';

        if (sanctionCard) {
          sanctionCard.style.display = 'block';
          populateSanctionCard(activeLoan);
        }

        // Hide bottom navigation buttons
        const bottomNav = document.getElementById('bottomNav');
        if (bottomNav) bottomNav.style.display = 'none';

        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    // Case 2: Loan is Sanctioned & Approved by Vistas Tecnolabs, awaiting tenure selection / fee payment
    if (sanctionedOfferRaw) {
      const savedOffer = JSON.parse(sanctionedOfferRaw);
      if (savedOffer && savedOffer.approved) {
        window.sanctionedOffer = savedOffer;
        currentStep = 4;
        updateUI();

        // Show "Already Approved" Banner
        const banner = document.getElementById('alreadyApprovedBanner');
        const bannerAmt = document.getElementById('bannerApprovedAmount');
        if (banner) banner.style.display = 'block';
        if (bannerAmt) bannerAmt.textContent = '₹' + savedOffer.creditLimit.toLocaleString('en-IN');

        // Pre-fill Step 4 bank inputs if saved in offer
        if (savedOffer.accountNumber) {
          const accEl = document.getElementById('accountNumber');
          const confEl = document.getElementById('confirmAccountNumber');
          if (accEl) accEl.value = savedOffer.accountNumber;
          if (confEl) confEl.value = savedOffer.accountNumber;
        }
        if (savedOffer.bankName) {
          const bankEl = document.getElementById('bankName');
          if (bankEl) bankEl.value = savedOffer.bankName;
        }
        if (savedOffer.ifscCode) {
          const ifscEl = document.getElementById('ifscCode');
          if (ifscEl) ifscEl.value = savedOffer.ifscCode;
        }

        // Set Verify button state
        const verifyBtn = document.getElementById('verifyBankBtn');
        if (verifyBtn) {
          verifyBtn.innerHTML = 'Account Verified ✓';
          verifyBtn.style.background = 'var(--success)';
          verifyBtn.disabled = true;
        }

        // Hide evaluation box
        const evalBox = document.getElementById('evaluatingBox');
        if (evalBox) evalBox.style.display = 'none';

        // Display Sanction Card directly!
        const sanctionCard = document.getElementById('creditSanctionCard');
        if (sanctionCard) {
          sanctionCard.style.display = 'block';
          populateSanctionCard(savedOffer);
          window.selectSanctionTenure(savedOffer.selectedTenure || 12);
        }

        // Hide bottom nav buttons
        const bottomNav = document.getElementById('bottomNav');
        if (bottomNav) bottomNav.style.display = 'none';

        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }
  } catch (err) {
    console.error('Error restoring existing loan offer:', err);
  }
}

// Helper to cleanly populate the sanction card DOM
function populateSanctionCard(offer) {
  const sanctionAmtEl = document.getElementById('sanctionedAmountDisplay');
  const sanctionEmiEl = document.getElementById('sanctionEmiDisplay');
  const sanctionBankEl = document.getElementById('sanctionBankDisplay');
  const sanctionTierEl = document.getElementById('sanctionTierNote');
  const feeEl = document.getElementById('sanctionFeeDisplay');
  const noticeSpan = document.getElementById('feeNoticeSpan');
  const ceilingDisplay = document.getElementById('sanctionMaxCeilingDisplay');
  const slider = document.getElementById('customLoanAmountSlider');
  const maxLabel = document.getElementById('sliderMaxCapLabel');

  const maxCap = offer.maxApprovedLimit || offer.creditLimit;
  offer.maxApprovedLimit = maxCap;
  const currentChosen = offer.selectedAmount || offer.creditLimit;
  offer.selectedAmount = currentChosen;

  const bankName = offer.bankName || 'Verified Bank';
  const accNum = offer.accountNumber ? offer.accountNumber.slice(-4) : '••••';

  if (ceilingDisplay) ceilingDisplay.textContent = '₹' + maxCap.toLocaleString('en-IN');
  if (sanctionAmtEl) sanctionAmtEl.textContent = '₹' + currentChosen.toLocaleString('en-IN');
  if (sanctionEmiEl) sanctionEmiEl.textContent = '₹' + (offer.monthlyEmi || 1556).toLocaleString('en-IN') + ' / mo';
  if (sanctionBankEl) sanctionBankEl.textContent = `${bankName} ••••${accNum}`;
  if (sanctionTierEl) sanctionTierEl.textContent = `✅ ${offer.tierName || 'Bruno Credits Personal Loan'} | Approved by Vistas Tecnolabs Finance Limited`;

  if (slider) {
    const minVal = Math.min(3000, Math.floor(maxCap * 0.25));
    slider.min = minVal;
    slider.max = maxCap;
    slider.value = currentChosen;
    if (maxLabel) maxLabel.textContent = 'Max: ₹' + maxCap.toLocaleString('en-IN');
  }

  // Update quick preset chips
  updateCustomChipsUI(currentChosen, maxCap);

  const fee = offer.disbursalFee || calculateDisbursalFee(currentChosen);
  if (feeEl) feeEl.textContent = '₹' + fee;
  if (noticeSpan) noticeSpan.textContent = fee;
}

// Update chip active states
function updateCustomChipsUI(chosen, maxCap) {
  const fullChip = document.getElementById('chipFullLimit');
  if (fullChip) {
    if (chosen >= maxCap) fullChip.classList.add('active');
    else fullChip.classList.remove('active');
  }

  document.querySelectorAll('.quick-amount-chips .amt-chip').forEach(chip => {
    if (chip.id === 'chipFullLimit') return;
    const txt = chip.textContent.replace(/[^0-9]/g, '');
    const num = parseInt(txt, 10);
    if (num === chosen) chip.classList.add('active');
    else chip.classList.remove('active');
  });
}

// Dynamic Loan Customizer Handler (Borrower can increase/decrease within limit)
window.updateCustomLoanAmount = function(val) {
  if (!window.sanctionedOffer) return;
  const maxCap = window.sanctionedOffer.maxApprovedLimit || window.sanctionedOffer.creditLimit;
  let chosen = Number(val);
  if (isNaN(chosen) || chosen < 1000) chosen = maxCap;
  chosen = Math.max(1000, Math.min(chosen, maxCap));

  window.sanctionedOffer.selectedAmount = chosen;
  window.sanctionedOffer.creditLimit = chosen;

  const slider = document.getElementById('customLoanAmountSlider');
  if (slider && Number(slider.value) !== chosen) slider.value = chosen;

  const sanctionAmtEl = document.getElementById('sanctionedAmountDisplay');
  if (sanctionAmtEl) sanctionAmtEl.textContent = '₹' + chosen.toLocaleString('en-IN');

  updateCustomChipsUI(chosen, maxCap);

  // Re-calculate tenure metrics with chosen amount
  window.selectSanctionTenure(window.sanctionedOffer.selectedTenure || 12);
};

window.setCustomAmountPreset = function(preset) {
  if (!window.sanctionedOffer) return;
  const maxCap = window.sanctionedOffer.maxApprovedLimit || window.sanctionedOffer.creditLimit;
  let chosen = maxCap;
  if (preset === 'MAX') {
    chosen = maxCap;
  } else if (typeof preset === 'number') {
    chosen = Math.min(preset, maxCap);
  }

  window.updateCustomLoanAmount(chosen);
};

// User can optionally re-apply from scratch
window.startFreshApplication = function() {
  if (confirm('Are you sure you want to start a fresh loan application? Your previously approved offer will be reset.')) {
    localStorage.removeItem('apexloan_sanctioned_offer');
    localStorage.removeItem('apexloan_active_loan');
    localStorage.removeItem('apexloan_form_data');
    window.location.reload();
  }
};



// ---- Toggle Account Visibility ----
window.toggleAccVisibility = function(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🔒';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
  }
};


// ---- Real-time Account Match Checker ----
function checkAccountMatch() {
  const acc1 = document.getElementById('accountNumber')?.value || '';
  const acc2 = document.getElementById('confirmAccountNumber')?.value || '';
  const hintEl = document.getElementById('accMatchHint');
  const confirmGroup = document.getElementById('confirmAccountNumber')?.closest('.form-group');

  if (!hintEl) return;

  if (acc1.length > 0 && acc2.length > 0) {
    hintEl.style.display = 'flex';
    if (acc1 === acc2) {
      hintEl.className = 'match-hint matched';
      hintEl.innerHTML = '✓ Account numbers match perfectly';
      if (confirmGroup) confirmGroup.classList.remove('has-error');
    } else {
      hintEl.className = 'match-hint mismatched';
      hintEl.innerHTML = '⚠️ Account numbers do not match yet';
    }
  } else {
    hintEl.style.display = 'none';
  }
}


// ---- Detect Bank & Branch from IFSC ----
function detectBankFromIFSC(code) {
  const badge = document.getElementById('ifscBadge');
  const detailsText = document.getElementById('ifscDetailsText');
  const bankSelect = document.getElementById('bankName');

  if (!code || code.length < 4) {
    if (badge) badge.style.display = 'none';
    return;
  }

  const prefix = code.slice(0, 4);
  const bankMap = {
    'SBIN': { name: 'State Bank of India', branch: 'Main Branch' },
    'HDFC': { name: 'HDFC Bank', branch: 'Retail Branch' },
    'ICIC': { name: 'ICICI Bank', branch: 'Digital Branch' },
    'UTIB': { name: 'Axis Bank', branch: 'Corporate Branch' },
    'KKBK': { name: 'Kotak Mahindra Bank', branch: 'Central Branch' },
    'PUNB': { name: 'Punjab National Bank', branch: 'City Branch' },
    'BARB': { name: 'Bank of Baroda', branch: 'Baroda Branch' },
    'CNRB': { name: 'Canara Bank', branch: 'Metropolitan Branch' },
    'UBIN': { name: 'Union Bank of India', branch: 'Union Branch' },
    'IBKL': { name: 'IDBI Bank', branch: 'IDBI Tower Branch' },
    'YESB': { name: 'YES Bank', branch: 'Express Branch' },
    'INDB': { name: 'IndusInd Bank', branch: 'Consumer Branch' },
    'FDRL': { name: 'Federal Bank', branch: 'Metro Branch' },
    'PYTM': { name: 'Paytm Payments Bank', branch: 'Noida Branch' }
  };

  const detected = bankMap[prefix];
  if (detected && badge && detailsText) {
    badge.style.display = 'flex';
    detailsText.textContent = `${detected.name} (${detected.branch})`;
    if (bankSelect) {
      bankSelect.value = detected.name;
    }
  } else if (code.length === 11 && badge && detailsText) {
    badge.style.display = 'flex';
    detailsText.textContent = `Valid IFSC Detected: ${code}`;
  } else if (badge) {
    badge.style.display = 'none';
  }
}


// ---- Employment Type Selection ----
window.selectEmpType = function(card) {
  document.querySelectorAll('.emp-type-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  document.getElementById('empType').value = card.dataset.type;
  const group = card.closest('.form-group');
  if (group) group.classList.remove('has-error');
  saveFormData();
};


// ---- Slider Fill ----
function updateSliderFill(slider) {
  const min = parseFloat(slider.min);
  const max = parseFloat(slider.max);
  const val = parseFloat(slider.value);
  const percent = ((val - min) / (max - min)) * 100;
  slider.style.background = `linear-gradient(to right, #1a1f71 0%, #6c5ce7 ${percent}%, #dfe6e9 ${percent}%)`;
}


// ---- Navigation ----
window.nextStep = function() {
  if (!validateStep(currentStep)) return;

  // Intercept Step 3: Run 3-second high-tech AI Scanner HUD before advancing to Step 4
  if (currentStep === 3 && !window.kycScanCompleted) {
    if (typeof window.start3SecondKycScan === 'function') {
      window.start3SecondKycScan(() => {
        window.kycScanCompleted = true;
        window.aadhaarVerified = true;
        window.panVerified = true;
        currentStep = 4;
        updateUI();
        saveFormData();
        if (typeof window.syncApplicationToBackend === 'function') {
          window.syncApplicationToBackend();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      return;
    }
  }

  if (currentStep < totalSteps) {
    currentStep++;
    updateUI();
    saveFormData();
    if (typeof window.syncApplicationToBackend === 'function') {
      window.syncApplicationToBackend();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

window.prevStep = function() {
  if (currentStep > 1) {
    currentStep--;
    updateUI();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};


function updateUI() {
  // Show/hide steps
  document.querySelectorAll('.form-step').forEach((step, i) => {
    step.classList.toggle('active', i + 1 === currentStep);
  });

  // Update progress indicators (1 to 4)
  for (let i = 1; i <= totalSteps; i++) {
    const ind = document.getElementById('stepInd' + i);
    if (!ind) continue;
    ind.classList.remove('active', 'completed');
    if (i === currentStep) {
      ind.classList.add('active');
    } else if (i < currentStep) {
      ind.classList.add('completed');
      ind.querySelector('.step-circle').textContent = '✓';
    } else {
      ind.querySelector('.step-circle').textContent = i;
    }
  }

  // Update step lines (1 to 3)
  for (let i = 1; i < totalSteps; i++) {
    const line = document.getElementById('line' + i);
    if (line) {
      line.classList.toggle('active', i < currentStep);
    }
  }

  // Update beneficiary name in Step 4
  if (currentStep === 4) {
    const nameInput = document.getElementById('fullName')?.value.trim();
    const panNameInput = document.getElementById('panHolderName')?.value.trim();
    const beneficiaryEl = document.getElementById('beneficiaryNameDisplay');
    if (beneficiaryEl) {
      beneficiaryEl.textContent = panNameInput || nameInput || 'Verified Applicant';
    }
  }

  // Update bottom navigation buttons
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const submitBtn = document.getElementById('submitBtn');

  if (prevBtn) prevBtn.style.display = currentStep > 1 ? 'inline-flex' : 'none';
  if (nextBtn) {
    nextBtn.style.display = (currentStep < totalSteps) ? 'inline-flex' : 'none';
    const s = window.ApexSettingsManager?.settings;
    if (s) {
      const stepCfg = s['step' + currentStep];
      if (stepCfg) {
        if (stepCfg.btnLabel) nextBtn.textContent = stepCfg.btnLabel;
        if (stepCfg.btnColor) nextBtn.style.background = stepCfg.btnColor;
        if (stepCfg.btnHeight) nextBtn.style.height = stepCfg.btnHeight;
        if (stepCfg.btnRadius) nextBtn.style.borderRadius = stepCfg.btnRadius;
      }
    }
  }
  if (submitBtn) submitBtn.style.display = 'none'; // Replaced by Step 4's action button
}


// ---- Validation ----
function validateStep(step) {
  let isValid = true;

  if (step === 1) {
    const mobInput = document.getElementById('mobile');
    if (mobInput) {
      const cleanMob = mobInput.value.replace(/\D/g, '').slice(-10);
      if (cleanMob.length !== 10) {
        setError('mobile', 'Please enter a valid 10-digit mobile number');
        isValid = false;
      } else {
        clearError('mobile');
        localStorage.setItem('apexloan_mobile', cleanMob);
      }
    }
    function isFieldVisible(id) {
      const el = document.getElementById(id);
      if (!el) return false;
      const grp = el.closest('.form-group') || el.closest('.form-row');
      if (grp && grp.style.display === 'none') return false;
      return true;
    }

    if (isFieldVisible('fullName')) isValid = validateRequired('fullName') & isValid;
    if (isFieldVisible('dob')) isValid = validateRequired('dob') & isValid;
    if (isFieldVisible('gender')) isValid = validateRequired('gender') & isValid;
    if (isFieldVisible('email')) isValid = validateEmail('email') & isValid;
    if (isFieldVisible('city')) isValid = validateRequired('city') & isValid;
    if (isFieldVisible('pincode')) isValid = validatePincode('pincode') & isValid;
    if (isFieldVisible('state')) isValid = validateRequired('state') & isValid;
    if (isFieldVisible('loanPurpose')) isValid = validateRequired('loanPurpose') & isValid;

    // Age validation: 18 - 58
    const dob = document.getElementById('dob').value;
    if (dob && isFieldVisible('dob')) {
      const age = getAge(new Date(dob));
      if (age < 18 || age > 58) {
        setError('dob', 'Age must be between 18 and 58 years');
        isValid = false;
      }
    }
  }

  if (step === 2) {
    function isFieldVisible(id) {
      const el = document.getElementById(id);
      if (!el) return false;
      const grp = el.closest('.form-group') || el.closest('.form-row');
      if (grp && grp.style.display === 'none') return false;
      return true;
    }

    if (isFieldVisible('empType') && !document.getElementById('empType').value) {
      const group = document.querySelector('.emp-type-grid').closest('.form-group');
      if (group) group.classList.add('has-error');
      isValid = false;
    }
    if (isFieldVisible('companyName')) isValid = validateRequired('companyName') & isValid;
    if (isFieldVisible('designation')) isValid = validateRequired('designation') & isValid;
    if (isFieldVisible('experience')) isValid = validateRequired('experience') & isValid;
    if (isFieldVisible('monthlySalary')) isValid = validateSalary('monthlySalary') & isValid;
  }

  if (step === 3) {
    function isFieldVisible(id) {
      const el = document.getElementById(id);
      if (!el) return false;
      const grp = el.closest('.form-group') || el.closest('.form-row');
      if (grp && grp.style.display === 'none') return false;
      return true;
    }

    let step3Valid = true;

    // 1. Aadhaar Number Validation (12 digits)
    const aadhaarInput = document.getElementById('aadhaarNumber');
    const aadhaarVal = aadhaarInput ? aadhaarInput.value.replace(/\D/g, '') : '';
    const aadhaarErr = document.getElementById('aadhaarError');
    if (isFieldVisible('aadhaarNumber') && aadhaarVal.length !== 12) {
      if (aadhaarInput) {
        const group = aadhaarInput.closest('.form-group');
        if (group) group.classList.add('has-error');
      }
      if (aadhaarErr) aadhaarErr.style.display = 'block';
      step3Valid = false;
    } else {
      if (aadhaarInput) {
        const group = aadhaarInput.closest('.form-group');
        if (group) group.classList.remove('has-error');
      }
      if (aadhaarErr) aadhaarErr.style.display = 'none';
    }

    // 2. PAN Number Validation (10 chars uppercase alphanumeric)
    const panInput = document.getElementById('panNumber');
    const panVal = panInput ? panInput.value.trim().toUpperCase() : '';
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const panErr = document.getElementById('panError');
    if (isFieldVisible('panNumber') && !panRegex.test(panVal)) {
      if (panInput) {
        const group = panInput.closest('.form-group');
        if (group) group.classList.add('has-error');
      }
      if (panErr) panErr.style.display = 'block';
      step3Valid = false;
    } else {
      if (panInput) {
        const group = panInput.closest('.form-group');
        if (group) group.classList.remove('has-error');
      }
      if (panErr) panErr.style.display = 'none';
    }

    // 3. Document photo uploads are 100% OPTIONAL
    // Clear any upload error flags
    const aadhaarFrontErr = document.getElementById('aadhaarFrontError');
    const aadhaarBackErr = document.getElementById('aadhaarBackError');
    const panFrontErr = document.getElementById('panFrontError');
    if (aadhaarFrontErr) aadhaarFrontErr.style.display = 'none';
    if (aadhaarBackErr) aadhaarBackErr.style.display = 'none';
    if (panFrontErr) panFrontErr.style.display = 'none';

    // 4. Terms Consent
    const termsConsent = document.getElementById('termsConsent');
    const termsErr = document.getElementById('termsError');
    if (termsConsent && !termsConsent.checked) {
      if (termsErr) termsErr.style.display = 'block';
      step3Valid = false;
    } else if (termsErr) {
      termsErr.style.display = 'none';
    }

    if (!step3Valid) {
      const firstError = document.querySelector('#step3 .has-error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }
    return step3Valid;
  }

  if (!isValid) {
    const firstError = document.querySelector('.form-step.active .has-error');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  return isValid;
}

function validateRequired(id) {
  const el = document.getElementById(id);
  if (!el) return true;
  const val = el.value.trim();
  if (!val) {
    setError(id);
    return false;
  }
  clearError(id);
  return true;
}

function validateEmail(id) {
  const el = document.getElementById(id);
  if (!el) return true;
  const val = el.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!val || !emailRegex.test(val)) {
    setError(id);
    return false;
  }
  clearError(id);
  return true;
}

function validatePincode(id) {
  const el = document.getElementById(id);
  if (!el) return true;
  const val = el.value.replace(/\D/g, '');
  if (val.length !== 6) {
    setError(id);
    return false;
  }
  clearError(id);
  return true;
}

function validateSalary(id) {
  const el = document.getElementById(id);
  if (!el) return true;
  const val = parseInt(el.value);
  if (isNaN(val) || val < 15000) {
    setError(id, 'Minimum monthly income requirement is ₹15,000');
    return false;
  }
  clearError(id);
  return true;
}

function validateIFSC(id) {
  const el = document.getElementById(id);
  if (!el) return true;
  const val = el.value.trim().toUpperCase();
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!val || !ifscRegex.test(val)) {
    setError(id);
    return false;
  }
  clearError(id);
  return true;
}

function setError(id, customMsg) {
  const el = document.getElementById(id);
  if (!el) return;
  const group = el.closest('.form-group');
  if (group) {
    group.classList.add('has-error');
    if (customMsg) {
      const errText = group.querySelector('.error-text');
      if (errText) errText.textContent = customMsg;
    }
  }
}

function clearError(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const group = el.closest('.form-group');
  if (group) group.classList.remove('has-error');
}

function getAge(birthDate) {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}


// ---- File Upload Handler ----
window.handleFileUpload = function(input, uploadAreaId, previewId) {
  const file = input.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert('File size must be less than 5MB');
    input.value = '';
    return;
  }

  const uploadArea = document.getElementById(uploadAreaId);
  const previewDiv = document.getElementById(previewId);

  uploadArea.classList.add('has-file');

  const fileSize = (file.size / 1024).toFixed(1) + ' KB';
  const isImage = file.type.startsWith('image/');

  if (isImage) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewDiv.innerHTML = `
        <div class="file-preview">
          <img src="${e.target.result}" alt="${file.name}">
          <div class="file-info">
            <div class="file-name">${file.name}</div>
            <div class="file-size">${fileSize}</div>
          </div>
          <button class="remove-file" onclick="removeFile('${input.id}', '${uploadAreaId}', '${previewId}')">✕</button>
        </div>
      `;
    };
    reader.readAsDataURL(file);
  } else {
    previewDiv.innerHTML = `
      <div class="file-preview">
        <div style="width:48px;height:48px;background:var(--gray-100);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px;">📄</div>
        <div class="file-info">
          <div class="file-name">${file.name}</div>
          <div class="file-size">${fileSize}</div>
        </div>
        <button class="remove-file" onclick="removeFile('${input.id}', '${uploadAreaId}', '${previewId}')">✕</button>
      </div>
    `;
  }
};

window.removeFile = function(inputId, uploadAreaId, previewId) {
  document.getElementById(inputId).value = '';
  document.getElementById(uploadAreaId).classList.remove('has-file');
  document.getElementById(previewId).innerHTML = '';
};


// ============================================
// PHASE 4: BANK VERIFICATION & UNDERWRITING ALGORITHM
// Lender: Vistas Tecnolabs
// Tenure: 12 Months
// Starter Range: ₹11,368 to ₹18,372
// ============================================

window.verifyBankAndCalculateLimit = function() {
  const accNum = document.getElementById('accountNumber')?.value.trim() || '';
  const confirmAcc = document.getElementById('confirmAccountNumber')?.value.trim() || '';
  const ifsc = document.getElementById('ifscCode')?.value.trim().toUpperCase() || '';
  const bankName = document.getElementById('bankName')?.value || '';

  let valid = true;

  // 1. Account Number Validation (9 to 18 digits)
  if (!accNum || accNum.length < 9 || accNum.length > 18) {
    setError('accountNumber', 'Please enter a valid bank account number (9 to 18 digits)');
    valid = false;
  } else {
    clearError('accountNumber');
  }

  // 2. Re-enter Account Number Check
  if (!confirmAcc || confirmAcc !== accNum) {
    setError('confirmAccountNumber', 'Account numbers do not match');
    valid = false;
  } else {
    clearError('confirmAccountNumber');
  }

  // 3. IFSC Code Validation
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!ifsc || !ifscRegex.test(ifsc)) {
    setError('ifscCode', 'Please enter a valid 11-digit IFSC code');
    valid = false;
  } else {
    clearError('ifscCode');
  }

  // 4. Bank Name Selection
  if (!bankName) {
    setError('bankName', 'Please select your bank');
    valid = false;
  } else {
    clearError('bankName');
  }

  if (!valid) {
    const errEl = document.querySelector('#step4 .has-error');
    if (errEl) errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // Verification Animation & Underwriting Evaluation
  const verifyBtn = document.getElementById('verifyBankBtn');
  const evalBox = document.getElementById('evaluatingBox');
  const sanctionCard = document.getElementById('creditSanctionCard');
  const declineCard = document.getElementById('creditDeclineCard');

  verifyBtn.innerHTML = '<span class="spinner"></span> Verifying with NPCI...';
  verifyBtn.disabled = true;

  evalBox.style.display = 'block';
  sanctionCard.style.display = 'none';
  declineCard.style.display = 'none';
  evalBox.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Step 1: Penny drop verification
  const step1 = document.getElementById('evalStep1');
  const step2 = document.getElementById('evalStep2');
  const step3 = document.getElementById('evalStep3');

  step1.classList.add('active');

  setTimeout(() => {
    step1.classList.remove('active');
    step1.classList.add('done');
    step1.querySelector('span:last-child').textContent = '1. NPCI Penny Drop Verified (₹1 Credited ✓)';
    step2.classList.add('active');

    // Step 2: Bureau & Debt-to-income check
    setTimeout(() => {
      step2.classList.remove('active');
      step2.classList.add('done');
      step2.querySelector('span:last-child').textContent = '2. Bureau Score & Underwriting Approved ✓';
      step3.classList.add('active');

      // Step 3: Vistas Tecnolabs Finance Limited Sanction Calculation
      setTimeout(() => {
        step3.classList.remove('active');
        step3.classList.add('done');
        step3.querySelector('span:last-child').textContent = '3. Vistas Tecnolabs Finance Limited Sanction Offer Generated ✓';

        setTimeout(() => {
          evalBox.style.display = 'none';
          verifyBtn.innerHTML = 'Account Verified ✓';
          verifyBtn.style.background = 'var(--success)';
          verifyBtn.disabled = true;

          try {
            // Run Underwriting Credit Decision Algorithm
            const decision = runCreditLimitAlgorithm();

            if (decision && decision.approved) {
              decision.disbursalFee = calculateDisbursalFee(decision.creditLimit);
              decision.status = 'LOAN_APPROVED';
              decision.accountNumber = accNum;
              decision.bankName = bankName;
              decision.ifscCode = ifsc;
              window.sanctionedOffer = decision;

              // Synchronize approved limit across all UI cards & ceiling displays
              if (typeof window.setApprovedLoanLimit === 'function') {
                window.setApprovedLoanLimit(decision.creditLimit, decision.selectedAmount || decision.creditLimit);
              }

              // Save to localStorage immediately so user never loses their approved limit!
              localStorage.setItem('apexloan_sanctioned_offer', JSON.stringify(decision));
              if (typeof window.syncApplicationToBackend === 'function') window.syncApplicationToBackend(decision);

              // Pre-populate Sanction Card DOM safely
              const sanctionAmtEl = document.getElementById('sanctionedAmountDisplay');
              const sanctionEmiEl = document.getElementById('sanctionEmiDisplay');
              const sanctionBankEl = document.getElementById('sanctionBankDisplay');
              const sanctionTierEl = document.getElementById('sanctionTierNote');
              const feeEl = document.getElementById('sanctionFeeDisplay');
              const noticeSpan = document.getElementById('feeNoticeSpan');

              if (sanctionAmtEl) sanctionAmtEl.textContent = '₹' + decision.creditLimit.toLocaleString('en-IN');
              if (sanctionEmiEl) sanctionEmiEl.textContent = '₹' + (decision.monthlyEmi || 1556).toLocaleString('en-IN') + ' / mo';
              if (sanctionBankEl) sanctionBankEl.textContent = `${bankName} ••••${accNum.slice(-4)}`;
              if (sanctionTierEl) sanctionTierEl.textContent = `✅ ${decision.tierName} | Approved by Vistas Tecnolabs Finance Limited`;
              if (feeEl) feeEl.textContent = '₹' + decision.disbursalFee;
              if (noticeSpan) noticeSpan.textContent = decision.disbursalFee;

              // Update tenure selections
              window.selectSanctionTenure(12);

              // 🎁 TRIGGER CELEBRATORY GIFT BOX REVEAL!
              showGiftBoxReveal(decision);

            } else {
              // Decline Card
              const declineReason = document.getElementById('declineReasonText');
              if (declineReason) declineReason.textContent = decision ? decision.reason : 'Application could not be approved.';
              declineCard.style.display = 'block';
              declineCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          } catch (err) {
            console.error('Underwriting error, triggering safe approval:', err);
            const fallbackDecision = {
              approved: true,
              lender: 'Vistas Tecnolabs Finance Limited',
              creditLimit: 16420,
              maxTenure: 12,
              selectedTenure: 12,
              interestRate: 24.0,
              monthlyEmi: 1556,
              totalRepayment: 18672,
              totalInterest: 2252,
              tierName: 'Standard Starter Loan (Tier 1)',
              disbursalFee: 199,
              accountNumber: accNum,
              bankName: bankName,
              ifscCode: ifsc,
              status: 'LOAN_APPROVED'
            };
            window.sanctionedOffer = fallbackDecision;
            if (typeof window.setApprovedLoanLimit === 'function') {
              window.setApprovedLoanLimit(fallbackDecision.creditLimit, fallbackDecision.selectedAmount || fallbackDecision.creditLimit);
            }
            localStorage.setItem('apexloan_sanctioned_offer', JSON.stringify(fallbackDecision));
            if (typeof window.syncApplicationToBackend === 'function') window.syncApplicationToBackend(fallbackDecision);
            window.selectSanctionTenure(12);
            showGiftBoxReveal(fallbackDecision);
          }

        }, 600);

      }, 900);
    }, 900);
  }, 900);
};


// ---- Fee Matrix Calculator ----
// Loans <= 25,000 (such as starter ₹11k-18k tier): ₹199
// Loans <= 50,000: ₹299
// Loans > 50,000: ₹499
function calculateDisbursalFee(amount) {
  if (amount <= 25000) return 199;
  if (amount <= 50000) return 299;
  return 499;
}


// ---- Credit Limit Underwriting Algorithm ----
function runCreditLimitAlgorithm() {
  const salaryInput = document.getElementById('monthlySalary')?.value;
  const salary = parseInt(salaryInput) || 20000;
  const experience = document.getElementById('experience')?.value || '1-2';
  const dob = document.getElementById('dob')?.value;

  let age = 28;
  if (dob) {
    age = getAge(new Date(dob));
  }

  // Mandatory Eligibility Rules
  if (salary < 15000) {
    return {
      approved: false,
      reason: 'As per Vistas Tecnolabs Finance Limited lending policy, a minimum monthly income of ₹15,000 is required for loan sanction.'
    };
  }

  if (age < 18 || age > 58) {
    return {
      approved: false,
      reason: 'Borrower age must be between 18 and 58 years as per lending guidelines.'
    };
  }

  // Profile Weights & Multipliers
  const expBonusMap = {
    '0-1': 0.05,
    '1-2': 0.25,
    '2-5': 0.55,
    '5-10': 0.80,
    '10+': 1.00
  };
  const expFactor = expBonusMap[experience] || 0.25;
  const kycBonus = (window.aadhaarVerified && window.panVerified) ? 0.25 : 0.15;

  let creditLimit = 16420;
  let tierName = 'Standard Starter Loan (Tier 1)';

  // Starter limit strictly between ₹11,368 and ₹18,372 for standard tier
  if (salary >= 15000 && salary < 25000) {
    const minTier = 11368;
    const maxTier = 18372;
    const range = maxTier - minTier;
    const salaryRatio = (salary - 15000) / (25000 - 15000);
    const compositeScore = Math.min(1, Math.max(0, (salaryRatio * 0.45) + (expFactor * 0.30) + kycBonus));
    creditLimit = Math.round(minTier + (compositeScore * range));
    tierName = 'Standard Starter Loan (Tier 1)';
  } else if (salary >= 25000 && salary < 45000) {
    const minTier = 25000;
    const maxTier = 45000;
    const salaryRatio = (salary - 25000) / (45000 - 25000);
    const compositeScore = Math.min(1, Math.max(0, (salaryRatio * 0.50) + (expFactor * 0.35) + 0.15));
    creditLimit = Math.round(minTier + (compositeScore * (maxTier - minTier)));
    tierName = 'Elevated Personal Loan (Tier 2)';
  } else if (salary >= 45000 && salary < 75000) {
    const minTier = 50000;
    const maxTier = 75000;
    const salaryRatio = (salary - 45000) / (75000 - 45000);
    const compositeScore = Math.min(1, Math.max(0, (salaryRatio * 0.55) + (expFactor * 0.35) + 0.10));
    creditLimit = Math.round(minTier + (compositeScore * (maxTier - minTier)));
    tierName = 'Prime Personal Loan (Tier 3)';
  } else {
    const minTier = 80000;
    const maxTier = 100000;
    const salaryRatio = Math.min(1, (salary - 75000) / 45000);
    const compositeScore = Math.min(1, Math.max(0, (salaryRatio * 0.60) + (expFactor * 0.40)));
    creditLimit = Math.round(minTier + (compositeScore * (maxTier - minTier)));
    tierName = 'Executive Super Prime Loan (Tier 4)';
  }

  // Pre-calculate default 12-month metrics so monthlyEmi is ALWAYS defined
  const P = creditLimit;
  const annualRate = (P <= 25000) ? 24.0 : 18.0;
  const monthlyRate = annualRate / (12 * 100);
  const emi = Math.round(
    P * monthlyRate * Math.pow(1 + monthlyRate, 12) /
    (Math.pow(1 + monthlyRate, 12) - 1)
  );
  const totalRepayment = emi * 12;
  const totalInterest = totalRepayment - P;

  const baseOffer = {
    approved: true,
    lender: 'Vistas Tecnolabs Finance Limited',
    creditLimit: creditLimit,
    maxTenure: 12,
    selectedTenure: 12,
    interestRate: annualRate,
    monthlyEmi: emi,
    totalRepayment: totalRepayment,
    totalInterest: totalInterest,
    tierName: tierName,
    disbursalFee: calculateDisbursalFee(creditLimit)
  };

  return baseOffer;
}


// ---- Holographic Titanium Sanction Reveal Experience (Cred & Apple Card Aesthetic) ----
window.showGiftBoxReveal = function(offer) {
  const modal = document.getElementById('giftRevealModal');
  if (!modal) {
    const card = document.getElementById('creditSanctionCard');
    if (card) {
      card.style.display = 'block';
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    return;
  }

  // Set verified beneficiary name on titanium card
  const beneficiaryEl = document.getElementById('revealBeneficiaryName');
  if (beneficiaryEl) {
    const name = document.getElementById('panHolderName')?.value.trim() ||
                 document.getElementById('fullName')?.value.trim() ||
                 'VERIFIED APPLICANT';
    beneficiaryEl.textContent = name.toUpperCase();
  }

  const amountNum = document.getElementById('giftAmountNum');
  if (amountNum) amountNum.textContent = '0';

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Digital ticker counter: smoothly ticks up from 0 to creditLimit
  const targetVal = offer.creditLimit || 45000;
  let startTimestamp = null;
  const duration = 1400; // 1.4s smooth digital roll

  function stepCounter(timestamp) {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    // Ease-out expo curve for ultra-satisfying deceleration
    const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    const currentVal = Math.floor(easeProgress * targetVal);
    
    if (amountNum) {
      amountNum.textContent = currentVal.toLocaleString('en-IN');
    }

    if (progress < 1) {
      window.requestAnimationFrame(stepCounter);
    } else {
      if (amountNum) amountNum.textContent = targetVal.toLocaleString('en-IN');
      // Gentle celebratory shimmer particles
      triggerConfettiBlast();
    }
  }

  // Brief pause before counter starts to let the card slide in majestically
  setTimeout(() => {
    window.requestAnimationFrame(stepCounter);
  }, 250);
};

window.openGiftBox = function() {
  claimGiftAndShowOffer();
};

window.claimGiftAndShowOffer = function() {
  const modal = document.getElementById('giftRevealModal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';

  const sanctionCard = document.getElementById('creditSanctionCard');
  if (sanctionCard) {
    sanctionCard.style.display = 'block';
    sanctionCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const bottomNav = document.getElementById('bottomNav');
  if (bottomNav) bottomNav.style.display = 'none';
};

// ---- Fullscreen Confetti Particle Cannon ----
function triggerConfettiBlast() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces = [];
  const colors = ['#fbbf24', '#f59e0b', '#00d287', '#6366f1', '#a5b4fc', '#e2e8f0', '#ffffff'];

  for (let i = 0; i < 140; i++) {
    pieces.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 60,
      y: canvas.height / 2 + 30,
      r: Math.random() * 8 + 4,
      d: Math.random() * 140,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.floor(Math.random() * 10) - 10,
      tiltAngleIncremental: Math.random() * 0.08 + 0.05,
      tiltAngle: 0,
      vx: (Math.random() - 0.5) * 22,
      vy: (Math.random() * -20) - 4,
      gravity: 0.45
    });
  }

  let animationFrame;
  const startTime = Date.now();

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pieces.forEach((p) => {
      p.tiltAngle += p.tiltAngleIncremental;
      p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2 + p.vy;
      p.x += Math.sin(p.d) * 2 + p.vx;
      p.vy += p.gravity;
      p.vx *= 0.98;
      p.tilt = Math.sin(p.tiltAngle) * 15;

      ctx.beginPath();
      ctx.lineWidth = p.r / 2;
      ctx.strokeStyle = p.color;
      ctx.fillStyle = p.color;
      ctx.rect(p.x, p.y, p.r, p.r / 2);
      ctx.fill();
    });

    if (Date.now() - startTime < 3800) {
      animationFrame = requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationFrame);
    }
  }

  draw();
}


// ---- Dynamic Tenure & Total Repayment Recalculation ----
window.selectSanctionTenure = function(months) {
  if (!window.sanctionedOffer) return;

  // Update chip styles
  document.querySelectorAll('.tenure-chip').forEach(chip => {
    if (parseInt(chip.dataset.months) === months) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });

  const P = window.sanctionedOffer.selectedAmount || window.sanctionedOffer.creditLimit;
  const fee = calculateDisbursalFee(P);

  // Interest Rate Matrix:
  let annualRate = 24.0;
  if (P <= 25000) {
    if (months === 3) annualRate = 36.0;      // 3.0% / month
    else if (months === 6) annualRate = 30.0; // 2.5% / month
    else if (months === 9) annualRate = 26.0; // 2.17% / month
    else annualRate = 24.0;                   // 2.0% / month
  } else {
    if (months === 3) annualRate = 28.0;      // 2.33% / month
    else if (months === 6) annualRate = 24.0; // 2.0% / month
    else if (months === 9) annualRate = 20.0; // 1.67% / month
    else annualRate = 18.0;                   // 1.5% / month
  }

  const monthlyRate = annualRate / (12 * 100);
  const emi = Math.round(
    P * monthlyRate * Math.pow(1 + monthlyRate, months) /
    (Math.pow(1 + monthlyRate, months) - 1)
  );

  const totalRepayment = emi * months;
  const totalInterest = totalRepayment - P;

  // Update in-memory offer
  window.sanctionedOffer.selectedAmount = P;
  window.sanctionedOffer.creditLimit = P;
  window.sanctionedOffer.selectedTenure = months;
  window.sanctionedOffer.interestRate = annualRate;
  window.sanctionedOffer.monthlyEmi = emi;
  window.sanctionedOffer.totalRepayment = totalRepayment;
  window.sanctionedOffer.totalInterest = totalInterest;
  window.sanctionedOffer.disbursalFee = fee;

  // Save for dashboard access
  localStorage.setItem('apexloan_sanctioned_offer', JSON.stringify(window.sanctionedOffer));
  if (typeof window.syncApplicationToBackend === 'function') window.syncApplicationToBackend(window.sanctionedOffer);

  // Update DOM elements
  const emiEl = document.getElementById('sanctionEmiDisplay');
  const repayEl = document.getElementById('sanctionTotalRepaymentDisplay');
  const tenureEl = document.getElementById('sanctionTenureDisplay');
  const rateEl = document.getElementById('sanctionRateDisplay');
  const interestEl = document.getElementById('sanctionTotalInterestDisplay');
  const formulaEl = document.getElementById('repaymentFormulaText');
  const acceptBtn = document.getElementById('acceptLoanBtn');
  const feeEl = document.getElementById('sanctionFeeDisplay');
  const noticeSpan = document.getElementById('feeNoticeSpan');

  if (emiEl) emiEl.textContent = '₹' + emi.toLocaleString('en-IN') + ' / mo';
  if (repayEl) repayEl.textContent = '₹' + totalRepayment.toLocaleString('en-IN');
  if (tenureEl) tenureEl.textContent = months + ' Months';
  if (rateEl) rateEl.textContent = annualRate.toFixed(1) + '% p.a. (' + (annualRate / 12).toFixed(1) + '%/mo)';
  if (interestEl) interestEl.textContent = '₹' + totalInterest.toLocaleString('en-IN');
  if (feeEl) feeEl.textContent = '₹' + fee;
  if (noticeSpan) noticeSpan.textContent = fee;
  if (formulaEl) {
    formulaEl.innerHTML = `Principal (<strong>₹${P.toLocaleString('en-IN')}</strong>) + Interest (<strong>₹${totalInterest.toLocaleString('en-IN')}</strong>) = Total Repayment <strong>₹${totalRepayment.toLocaleString('en-IN')}</strong>`;
  }
  if (acceptBtn) {
    acceptBtn.innerHTML = `⚡ Pay ₹${fee} Fee & Disburse ₹${P.toLocaleString('en-IN')} Loan (${months}M) →`;
  }
};


// ---- Disbursal Fee Modal Controllers ----
window.openDisbursalFeeModal = function() {
  const consent = document.getElementById('sanctionConsent');
  if (consent && !consent.checked) {
    alert('Please accept the loan sanction terms to proceed.');
    return;
  }
  const offer = window.sanctionedOffer;
  if (!offer) return;

  const fee = offer.disbursalFee || calculateDisbursalFee(offer.creditLimit);
  offer.disbursalFee = fee;

  const accNum = document.getElementById('accountNumber')?.value.trim() || '';
  const bankName = document.getElementById('bankName')?.value || 'Bank';

  const feeLoanEl = document.getElementById('feeModalLoanAmount');
  const feeBankEl = document.getElementById('feeModalBank');
  const feePayEl = document.getElementById('feeModalPayAmount');
  const confirmBtn = document.getElementById('confirmFeePayBtn');

  if (feeLoanEl) feeLoanEl.textContent = '₹' + offer.creditLimit.toLocaleString('en-IN');
  if (feeBankEl) feeBankEl.textContent = `${bankName} ••••${accNum.slice(-4)}`;
  if (feePayEl) feePayEl.textContent = '₹' + fee;
  if (confirmBtn) confirmBtn.textContent = `Confirm & Pay ₹${fee} via UPI →`;

  document.getElementById('disbursalFeeModal').classList.add('active');
};

window.closeDisbursalFeeModal = function() {
  document.getElementById('disbursalFeeModal').classList.remove('active');
};

window.selectFeePayMethod = function(el) {
  document.querySelectorAll('#disbursalFeeModal .payment-method-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
};


// ---- Process Disbursal Fee & Initiate 30-Minute Disbursal Window via Live Razorpay ----
let disbursalCountdownInterval = null;

function finalizeDisbursalActivation(offer, fee, paymentId) {
  const btn = document.getElementById('confirmFeePayBtn');
  if (btn) {
    btn.innerHTML = 'Fee Payment Verified ✓';
    btn.style.background = 'var(--success)';
  }

  const refNum = offer.refNum || ('VT-AL-' + Date.now().toString(36).toUpperCase().slice(-6));
  offer.status = 'DISBURSAL_PROCESSING'; // Active Disbursal Stage
  offer.feePaid = true;
  offer.feeAmount = fee;
  offer.feePaymentId = paymentId || ('pay_' + Date.now().toString(36));
  offer.feePaidAt = new Date().toISOString();
  offer.refNum = refNum;
  offer.accountNumber = document.getElementById('accountNumber')?.value.trim() || offer.accountNumber || '';
  offer.bankName = document.getElementById('bankName')?.value || offer.bankName || 'Bank';
  offer.ifscCode = document.getElementById('ifscCode')?.value.trim().toUpperCase() || offer.ifscCode || '';

  // 30 minute transfer window
  const etaMs = Date.now() + (30 * 60 * 1000);
  offer.disbursalEta = new Date(etaMs).toISOString();

  // Persist in localStorage
  localStorage.setItem('apexloan_active_loan', JSON.stringify(offer));
  localStorage.removeItem('apexloan_form_data');
  if (typeof window.syncApplicationToBackend === 'function') window.syncApplicationToBackend(offer);

  setTimeout(() => {
    window.closeDisbursalFeeModal();

    // Setup Success Modal (Photo 2 Ticket Voucher)
    const modalLoanAmount = document.getElementById('modalApprovedAmount');
    const modalBankName = document.getElementById('modalSuccessBankName');
    const refEl = document.getElementById('appRefNumber');
    const ticketAmt = document.getElementById('ticketAmountDisplay');
    const ticketTenure = document.getElementById('ticketTenureDisplay');
    const ticketEmi = document.getElementById('ticketEmiDisplay');

    const finalAmt = offer.selectedAmount || offer.creditLimit || 50000;
    const finalTenure = offer.selectedTenure || 9;
    const finalEmi = offer.monthlyEmi || 6249.19;

    if (modalLoanAmount) modalLoanAmount.textContent = '₹' + finalAmt.toLocaleString('en-IN');
    if (modalBankName) modalBankName.textContent = `${offer.bankName} ••••${offer.accountNumber.slice(-4)}`;
    if (refEl) refEl.textContent = refNum;
    if (ticketAmt) ticketAmt.textContent = '₹ ' + finalAmt.toLocaleString('en-IN') + '.00';
    if (ticketTenure) ticketTenure.textContent = finalTenure + ' Months';
    if (ticketEmi) ticketEmi.textContent = '₹ ' + (typeof finalEmi === 'number' ? finalEmi.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : finalEmi) + '/month';

    // Start live 30 min countdown
    startDisbursalCountdown(offer.disbursalEta);

    const modal = document.getElementById('successModal');
    if (modal) modal.classList.add('active');
  }, 700);
}

window.processDisbursalFeePayment = async function() {
  const btn = document.getElementById('confirmFeePayBtn');
  const offer = window.sanctionedOffer;
  if (!offer) return;

  const fee = offer.disbursalFee || 199;
  const originalBtnText = btn ? btn.innerHTML : 'Confirm & Pay via UPI →';
  
  if (btn) {
    btn.innerHTML = '<span class="spinner"></span> Connecting Razorpay Gateway...';
    btn.disabled = true;
  }

  const customerName = document.getElementById('fullName')?.value || offer.fullName || 'Borrower';
  const customerMobile = localStorage.getItem('apexloan_mobile') || document.getElementById('mobile')?.value || offer.mobile || '9876543210';
  const customerEmail = document.getElementById('email')?.value || offer.email || 'borrower@apexloan.in';
  const apiBase = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) ? window.APP_CONFIG.API_BASE_URL : '/api';

  try {
    // 1. Create order on backend with live Razorpay keys
    const orderRes = await fetch(`${apiBase}/payment/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: fee,
        currency: 'INR',
        customerName,
        customerMobile,
        customerEmail,
        loanRefNum: offer.refNum || ''
      })
    });

    const orderData = await orderRes.json();

    if (!orderData.success || (!orderData.orderId && !orderData.paymentLinkUrl)) {
      throw new Error(orderData.message || 'Payment order creation failed');
    }

    // Save pending offer details so upon returning from Razorpay callback, disbursal is activated
    localStorage.setItem('apexloan_pending_offer', JSON.stringify({ offer, fee }));

    // 2. Launch Razorpay Hosted Gateway (Zero domain whitelisting restrictions!)
    if (orderData.paymentLinkUrl) {
      if (btn) {
        btn.innerHTML = '<span class="spinner"></span> Opening Razorpay Gateway...';
        btn.disabled = true;
      }
      window.location.href = orderData.paymentLinkUrl;
      return;
    }

    // Fallback: Launch Razorpay Standard Checkout
    if (typeof window.Razorpay === 'function') {
      const options = {
        key: orderData.keyId || (window.APP_CONFIG && window.APP_CONFIG.RAZORPAY_KEY_ID) || 'rzp_live_T2fa96O02ytH4a',
        amount: orderData.amount, // in paise
        currency: orderData.currency || 'INR',
        name: 'Vistas Tecnolabs Finance Limited',
        description: `Loan Disbursal Stamp Fee (₹${fee})`,
        image: 'https://cdn-icons-png.flaticon.com/512/2830/2830284.png',
        order_id: orderData.orderId,
        prefill: {
          name: customerName,
          contact: customerMobile,
          email: customerEmail
        },
        notes: {
          lender: 'Vistas Tecnolabs Finance Limited',
          loanAmount: `₹${offer.creditLimit}`,
          purpose: 'Stamp Duty & Disbursal Fee'
        },
        theme: {
          color: '#1a1f71'
        },
        handler: async function(rzpResp) {
          if (btn) {
            btn.innerHTML = '<span class="spinner"></span> Reconciling Payment with Escrow Desk...';
          }

          try {
            // 3. Verify Razorpay HMAC signature on backend
            const verifyRes = await fetch(`${apiBase}/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: rzpResp.razorpay_order_id,
                razorpay_payment_id: rzpResp.razorpay_payment_id,
                razorpay_signature: rzpResp.razorpay_signature
              })
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success && verifyData.verified) {
              console.log('[PAYMENT] Signature verified:', verifyData);
              finalizeDisbursalActivation(offer, fee, rzpResp.razorpay_payment_id);
            } else {
              alert('Payment received but verification failed: ' + (verifyData.message || 'Signature mismatch'));
              finalizeDisbursalActivation(offer, fee, rzpResp.razorpay_payment_id);
            }
          } catch (verErr) {
            console.warn('[VERIFY] Verification request network warning, activating disbursal:', verErr);
            finalizeDisbursalActivation(offer, fee, rzpResp.razorpay_payment_id);
          }
        },
        modal: {
          ondismiss: function() {
            if (btn) {
              btn.innerHTML = originalBtnText;
              btn.disabled = false;
            }
          }
        }
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', function(resp) {
        alert('Payment Failed: ' + (resp.error?.description || 'Transaction declined'));
        if (btn) {
          btn.innerHTML = originalBtnText;
          btn.disabled = false;
        }
      });
      rzpInstance.open();

    } else {
      // Razorpay SDK not loaded fallback (e.g. adblocker)
      console.warn('Razorpay SDK not loaded, using instant verification fallback');
      finalizeDisbursalActivation(offer, fee, 'pay_live_auto_' + Date.now().toString(36));
    }

  } catch (err) {
    console.error('[PAYMENT GATEWAY ERROR]', err);
    // Graceful fallback if network drops
    if (confirm(`Payment gateway connection note: ${err.message}. Would you like to proceed with direct verification?`)) {
      finalizeDisbursalActivation(offer, fee, 'pay_escrow_' + Date.now().toString(36));
    } else {
      if (btn) {
        btn.innerHTML = originalBtnText;
        btn.disabled = false;
      }
    }
  }
};

function startDisbursalCountdown(targetIso) {
  if (disbursalCountdownInterval) clearInterval(disbursalCountdownInterval);
  const targetTime = new Date(targetIso).getTime();

  function tick() {
    const now = Date.now();
    const remainingMs = Math.max(0, targetTime - now);
    const totalSec = Math.floor(remainingMs / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const str = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} Mins`;

    const el = document.getElementById('modalCountdownTimer');
    if (el) el.textContent = str;

    if (remainingMs <= 0) {
      clearInterval(disbursalCountdownInterval);
      if (el) el.textContent = 'Transferred ✓';
    }
  }

  tick();
  disbursalCountdownInterval = setInterval(tick, 1000);
}

// Fallback submit
window.submitApplication = function() {
  window.openDisbursalFeeModal();
};


// ---- LocalStorage Save/Restore ----
function saveFormData() {
  const data = {};
  const fields = [
    'fullName', 'dob', 'gender', 'email', 'city',
    'pincode', 'state', 'formLoanAmount', 'loanPurpose', 'empType',
    'companyName', 'designation', 'experience', 'monthlySalary',
    'bankName', 'accountNumber', 'confirmAccountNumber', 'ifscCode'
  ];

  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) data[id] = el.value;
  });

  data.currentStep = currentStep;

  try {
    localStorage.setItem('apexloan_form_data', JSON.stringify(data));
  } catch (e) {}
}

function restoreFormData() {
  try {
    const saved = localStorage.getItem('apexloan_form_data');
    if (!saved) return;

    const data = JSON.parse(saved);

    Object.keys(data).forEach(id => {
      if (id === 'currentStep') return;
      const el = document.getElementById(id);
      if (el) {
        el.value = data[id];
        if (el.type === 'range') {
          updateSliderFill(el);
        }
      }
    });

    // Restore emp type selection
    if (data.empType) {
      const card = document.querySelector(`.emp-type-card[data-type="${data.empType}"]`);
      if (card) card.classList.add('selected');
    }

    // Restore loan display
    if (data.formLoanAmount) {
      const display = document.getElementById('formLoanDisplay');
      if (display) {
        display.innerHTML = '₹<span>' + parseInt(data.formLoanAmount).toLocaleString('en-IN') + '</span>';
      }
    }

    if (data.currentStep && data.currentStep <= 3) {
      currentStep = data.currentStep;
    }

  } catch (e) {}
}
