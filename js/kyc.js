/* ========================================
   ApexLoan - KYC Verification Logic
   Aadhaar OTP, PAN Verification (Mock)
   ======================================== */

// ---- State ----
window.aadhaarVerified = false;
window.panVerified = false;
let otpTimerInterval = null;
let generatedOTP = '';


// ---- Toggle KYC Cards ----
window.toggleKycCard = function(cardId) {
  const card = document.getElementById(cardId);
  if (!card) return;
  card.classList.toggle('open');
};


// ==============================
// AADHAAR OTP VERIFICATION
// ==============================

window.sendAadhaarOTP = function() {
  const aadhaarInput = document.getElementById('aadhaarNumber');
  const aadhaarNum = aadhaarInput.value.replace(/\s/g, '');

  // Validate 12 digits
  if (aadhaarNum.length !== 12 || !/^\d{12}$/.test(aadhaarNum)) {
    setError('aadhaarNumber');
    return;
  }
  clearError('aadhaarNumber');

  const sendBtn = document.getElementById('sendOtpBtn');
  const otpSection = document.getElementById('otpSection');

  // Show loading
  sendBtn.innerHTML = '<span class="spinner"></span> Sending OTP...';
  sendBtn.disabled = true;

  // Simulate API call (2 seconds delay)
  setTimeout(() => {
    // Generate mock OTP
    generatedOTP = String(Math.floor(100000 + Math.random() * 900000));

    // Show OTP section
    otpSection.style.display = 'block';

    // Update button
    sendBtn.innerHTML = 'OTP Sent ✓';
    sendBtn.classList.remove('btn-primary');
    sendBtn.classList.add('btn-secondary');

    // Show mock OTP hint (for demo purposes)
    showStatus('aadhaarStatus', 'pending', `📱 OTP sent! (Demo OTP: ${generatedOTP})`);

    // Start timer
    startOTPTimer();

    // Focus first OTP input
    const firstOtp = document.querySelector('.otp-input[data-index="0"]');
    if (firstOtp) firstOtp.focus();

    // Setup OTP input handlers
    setupOTPInputs();

  }, 2000);
};


function setupOTPInputs() {
  const otpInputs = document.querySelectorAll('.otp-input');

  otpInputs.forEach((input, index) => {
    // Remove existing listeners by cloning
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);

    newInput.addEventListener('input', (e) => {
      const val = e.target.value.replace(/\D/g, '');
      e.target.value = val.slice(0, 1);

      if (val && index < otpInputs.length - 1) {
        document.querySelectorAll('.otp-input')[index + 1].focus();
      }
    });

    newInput.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        document.querySelectorAll('.otp-input')[index - 1].focus();
      }
    });

    newInput.addEventListener('paste', (e) => {
      e.preventDefault();
      const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
      const currentInputs = document.querySelectorAll('.otp-input');
      for (let i = 0; i < Math.min(paste.length, 6); i++) {
        currentInputs[i].value = paste[i];
      }
      if (paste.length >= 6) {
        currentInputs[5].focus();
      }
    });
  });
}


function startOTPTimer() {
  let seconds = 30;
  const timerEl = document.getElementById('otpTimer');
  const resendBtn = document.getElementById('resendOtpBtn');

  resendBtn.disabled = true;

  clearInterval(otpTimerInterval);

  otpTimerInterval = setInterval(() => {
    seconds--;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (seconds <= 0) {
      clearInterval(otpTimerInterval);
      timerEl.textContent = '00:00';
      resendBtn.disabled = false;

      // Reset send button
      const sendBtn = document.getElementById('sendOtpBtn');
      sendBtn.innerHTML = 'Resend OTP';
      sendBtn.disabled = false;
      sendBtn.classList.remove('btn-secondary');
      sendBtn.classList.add('btn-primary');
    }
  }, 1000);
}


window.verifyAadhaarOTP = function() {
  const otpInputs = document.querySelectorAll('.otp-input');
  let enteredOTP = '';
  otpInputs.forEach(input => {
    enteredOTP += input.value;
  });

  if (enteredOTP.length !== 6) {
    showStatus('aadhaarStatus', 'error', '❌ Please enter complete 6-digit OTP');
    return;
  }

  const verifyBtn = document.getElementById('verifyOtpBtn');
  verifyBtn.innerHTML = '<span class="spinner"></span> Verifying...';
  verifyBtn.disabled = true;

  // Simulate verification (1.5 seconds)
  setTimeout(() => {
    if (enteredOTP === generatedOTP) {
      // Success
      window.aadhaarVerified = true;
      clearInterval(otpTimerInterval);

      showStatus('aadhaarStatus', 'success', '✅ Aadhaar verified successfully!');

      verifyBtn.innerHTML = 'Verified ✓';
      verifyBtn.classList.remove('btn-success');
      verifyBtn.style.background = 'var(--success)';
      verifyBtn.style.color = 'white';
      verifyBtn.disabled = true;

      // Disable aadhaar input
      document.getElementById('aadhaarNumber').readOnly = true;
      document.getElementById('aadhaarNumber').classList.add('success');
      document.getElementById('sendOtpBtn').style.display = 'none';

      // Disable OTP inputs
      otpInputs.forEach(input => {
        input.readOnly = true;
        input.style.borderColor = 'var(--success)';
        input.style.background = 'rgba(39, 174, 96, 0.05)';
      });

      // Auto-open PAN card section
      setTimeout(() => {
        const panCardEl = document.getElementById('panCard');
        if (panCardEl && !panCardEl.classList.contains('open')) {
          panCardEl.classList.add('open');
          panCardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);

    } else {
      // Failed
      showStatus('aadhaarStatus', 'error', '❌ Invalid OTP. Please try again.');
      verifyBtn.innerHTML = 'Verify OTP ✓';
      verifyBtn.disabled = false;

      // Shake animation
      otpInputs.forEach(input => {
        input.style.borderColor = 'var(--danger)';
        input.value = '';
      });
      otpInputs[0].focus();

      setTimeout(() => {
        otpInputs.forEach(input => {
          input.style.borderColor = 'var(--gray-300)';
        });
      }, 1500);
    }
  }, 1500);
};


// ==============================
// PAN VERIFICATION
// ==============================

window.verifyPAN = function() {
  const panInput = document.getElementById('panNumber');
  const panNum = panInput.value.trim().toUpperCase();

  // PAN format: ABCDE1234F
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(panNum)) {
    setError('panNumber');
    return;
  }
  clearError('panNumber');

  const verifyBtn = document.getElementById('verifyPanBtn');
  verifyBtn.innerHTML = '<span class="spinner"></span> Verifying PAN...';
  verifyBtn.disabled = true;

  // Simulate PAN verification API (2 seconds)
  setTimeout(() => {
    window.panVerified = true;

    // Get name from personal info for comparison
    const fullName = document.getElementById('fullName')?.value.trim() || 'Name Not Available';

    // Mock PAN holder name (in real app, this comes from NSDL API)
    const panHolderName = fullName.toUpperCase();

    // Show PAN holder name
    const panNameGroup = document.getElementById('panNameGroup');
    const panHolderNameInput = document.getElementById('panHolderName');
    panNameGroup.style.display = 'block';
    panHolderNameInput.value = panHolderName;

    // Name match check
    const nameFromForm = fullName.toUpperCase().trim();
    const nameFromPAN = panHolderName.trim();

    if (nameFromForm === nameFromPAN || nameFromPAN.includes(nameFromForm) || nameFromForm.includes(nameFromPAN)) {
      document.getElementById('panNameMatch').style.display = 'flex';
      document.getElementById('panNameMismatch').style.display = 'none';
    } else {
      document.getElementById('panNameMatch').style.display = 'none';
      document.getElementById('panNameMismatch').style.display = 'flex';
    }

    // Update button
    verifyBtn.innerHTML = 'PAN Verified ✓';
    verifyBtn.style.background = 'var(--success)';
    verifyBtn.style.color = 'white';
    verifyBtn.disabled = true;

    // Mark PAN input as verified
    panInput.readOnly = true;
    panInput.classList.add('success');

    showStatus('panStatus', 'success', '✅ PAN verification successful!');

  }, 2000);
};


// ==============================
// UTILITY FUNCTIONS
// ==============================

function showStatus(containerId, type, message) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="verification-status ${type}">
      <span>${message}</span>
    </div>
  `;
}

// These functions are also defined in apply.js, using window scope to avoid conflicts
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
