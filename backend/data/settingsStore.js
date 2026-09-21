const fs = require('fs');
const path = require('path');
const os = require('os');

const SETTINGS_FILE = path.join(__dirname, 'settings.json');
const TMP_SETTINGS_FILE = path.join(os.tmpdir(), 'apexloan_settings.json');

const defaultSettings = {
  // Global Branding & Theme
  brandName: 'Bruno Credits',
  lenderName: 'Vistas Tecnolabs Finance Limited',
  rbiLicense: 'B-14.02528',
  supportPhone: '1800-209-4321',
  supportEmail: 'support@brunocredits.in',
  themeColor: '#0d2b82',
  themeGradient: 'linear-gradient(180deg, #09206d 0%, #0e2f8d 70%, #103bb3 100%)',
  accentColor: '#10b981',
  sanctionCardColor: '#0d2b82',
  btnColor: '#0d2b82',
  btnHeight: '52px',
  btnRadius: '14px',
  btnFontSize: '15px',
  btnLabel: 'Continue with loan amount',
  defaultCreditLimit: 50000,
  interestRate: 24.0,
  disbursalFee: 199,

  // Phase 1: Personal Info
  step1: {
    title: 'Personal Information',
    subtitle: 'Tell us about yourself to check pre-approved loan eligibility',
    showLoanSlider: true,
    showEmail: true,
    showGender: true,
    showAddress: true,
    btnLabel: 'Continue to Work Details →',
    btnColor: '#0d2b82',
    btnHeight: '52px',
    btnRadius: '14px'
  },

  // Phase 2: Employment & Income
  step2: {
    title: 'Employment & Income',
    subtitle: 'Provide your work profile for instant credit assessment',
    showCompany: true,
    showDesignation: true,
    showExperience: true,
    minSalary: 15000,
    btnLabel: 'Proceed to KYC Verification →',
    btnColor: '#0d2b82',
    btnHeight: '52px',
    btnRadius: '14px'
  },

  // Phase 3: KYC Verification
  step3: {
    title: 'KYC Verification',
    subtitle: 'Paperless instant verification via UIDAI & NSDL',
    showPhotoUploads: false,
    enableAiScannerHud: true,
    btnLabel: 'Verify & Check Credit Sanction →',
    btnColor: '#0d2b82',
    btnHeight: '52px',
    btnRadius: '14px'
  },

  // Phase 4: Bank & Sanction
  step4: {
    title: 'Bank Details & Sanction Approval',
    subtitle: 'Direct disbursal into your bank account within 30 minutes',
    enablePennyDrop: true,
    enableGiftBox: true,
    defaultLimit: 50000,
    interestRate: 24.0,
    disbursalFee: 199,
    btnLabel: 'Continue with loan amount',
    btnColor: '#0d2b82',
    btnHeight: '52px',
    btnRadius: '14px'
  },

  // Detailed Field-Level Descriptors per Phase
  fields: {
    step1: {
      fullName: { label: 'Full Name (as per Aadhaar)', placeholder: 'e.g. Rajesh Kumar Sharma', visible: true, required: true },
      mobile: { label: 'Mobile Number (Primary Identity)', placeholder: 'Enter 10-digit mobile number', visible: true, required: true },
      dob: { label: 'Date of Birth', placeholder: '', visible: true, required: true },
      gender: { label: 'Gender', placeholder: 'Select Gender', visible: true, required: true },
      email: { label: 'Email Address', placeholder: 'e.g. rajesh@email.com', visible: true, required: true },
      loanPurpose: { label: 'Loan Purpose', placeholder: 'Select Purpose', visible: true, required: true },
      city: { label: 'City', placeholder: 'e.g. Mumbai', visible: true, required: true },
      pincode: { label: 'Pin Code', placeholder: 'e.g. 400001', visible: true, required: true },
      state: { label: 'State', placeholder: 'Select State', visible: true, required: true },
      loanSlider: { label: 'Desired Loan Amount', placeholder: '', visible: true, required: true }
    },
    step2: {
      empType: { label: 'Employment Type', placeholder: '', visible: true, required: true },
      companyName: { label: 'Company / Business Name', placeholder: 'e.g. Tata Consultancy Services', visible: true, required: true },
      designation: { label: 'Designation', placeholder: 'e.g. Software Engineer', visible: true, required: true },
      experience: { label: 'Work Experience', placeholder: 'Select Experience', visible: true, required: true },
      monthlySalary: { label: 'Monthly Income / Salary', placeholder: 'e.g. 35000', visible: true, required: true },
      salarySlip: { label: 'Upload Salary Slip (Optional)', placeholder: 'Click to upload salary slip', visible: true, required: false }
    },
    step3: {
      aadhaarNumber: { label: 'Aadhaar Card Number', placeholder: 'XXXX XXXX XXXX (12 Digits)', visible: true, required: true },
      panNumber: { label: 'PAN Card Number', placeholder: 'ABCDE1234F', visible: true, required: true },
      docPhotos: { label: 'Document Photo Uploads (Aadhaar & PAN)', placeholder: 'Tap to upload (Optional)', visible: false, required: false },
      aiScannerHud: { label: '3-Second High-Tech AI KYC Scanner HUD', placeholder: '', visible: true, required: false }
    },
    step4: {
      bankName: { label: 'Bank Name', placeholder: 'Select Bank', visible: true, required: true },
      accountNumber: { label: 'Bank Account Number', placeholder: 'Enter bank account number', visible: true, required: true },
      confirmAccountNumber: { label: 'Re-enter Bank Account Number', placeholder: 'Re-enter bank account number', visible: true, required: true },
      ifscCode: { label: 'Bank IFSC Code', placeholder: 'e.g. SBIN0001234', visible: true, required: true },
      pennyDrop: { label: 'NPCI Penny Drop Verification', placeholder: '', visible: true, required: false },
      giftBox: { label: 'Celebratory Gift Box Reveal Animation', placeholder: '', visible: true, required: false }
    }
  },

  // Sanction Card / Limit Offer Phase
  sanctionCard: {
    heroColor: '#0d2b82',
    ceilingText: 'Approved limit',
    chooseAmountLabel: 'Choose your Loan amount',
    choosePlanLabel: "Choose EMI's plan",
    btnLabel: 'Continue with loan amount',
    btnColor: '#0d2b82',
    btnHeight: '52px',
    btnRadius: '14px',
    defaultLimit: 50000,
    interestRate: 24.0,
    disbursalFee: 199
  },

  // Dashboard Controls
  dashboard: {
    heroTitle: 'Get a credit limit up to ₹50,000',
    heroSubtext: 'Avail limit up to ₹50,000 in 4 easy steps',
    heroBtnText: 'Complete your application',
    importantTitle: 'Few steps left to unlock your money 💸',
    importantSubtext: 'Selfie and Bank account verification',
    showImportant: true,
    showAnnouncement: true,
    announcementText: '⚡ Instant Bank Disbursal is active for all approved borrowers via IMPS / RTGS.',
    showKfsButton: true,
    showSupportBox: true
  }
};

function deepMerge(target, source) {
  if (!source || typeof source !== 'object') return target;
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result;
}

let currentSettings = { ...defaultSettings };

function loadSettings() {
  try {
    if (fs.existsSync(TMP_SETTINGS_FILE)) {
      const raw = fs.readFileSync(TMP_SETTINGS_FILE, 'utf8');
      currentSettings = deepMerge(defaultSettings, JSON.parse(raw));
      return;
    }
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
      currentSettings = deepMerge(defaultSettings, JSON.parse(raw));
    } else {
      currentSettings = { ...defaultSettings };
      saveSettings();
    }
  } catch (e) {
    console.warn('[SETTINGS] Error loading settings, using defaults:', e.message);
    currentSettings = { ...defaultSettings };
  }
}

function saveSettings() {
  const jsonStr = JSON.stringify(currentSettings, null, 2);
  try {
    fs.writeFileSync(TMP_SETTINGS_FILE, jsonStr, 'utf8');
  } catch (e) {
    console.warn('[SETTINGS] Error saving settings to tmp file:', e.message);
  }
  try {
    fs.writeFileSync(SETTINGS_FILE, jsonStr, 'utf8');
  } catch (e) {
    // Expected on serverless read-only filesystem
  }
}

loadSettings();

const SettingsStore = {
  get() {
    return { ...currentSettings };
  },

  update(newSettings) {
    currentSettings = deepMerge(currentSettings, newSettings);
    // Keep top-level keys synchronized if sub-objects were changed
    if (newSettings.sanctionCard) {
      if (newSettings.sanctionCard.defaultLimit !== undefined) currentSettings.defaultCreditLimit = Number(newSettings.sanctionCard.defaultLimit);
      if (newSettings.sanctionCard.interestRate !== undefined) currentSettings.interestRate = Number(newSettings.sanctionCard.interestRate);
      if (newSettings.sanctionCard.disbursalFee !== undefined) currentSettings.disbursalFee = Number(newSettings.sanctionCard.disbursalFee);
      if (newSettings.sanctionCard.btnLabel !== undefined) currentSettings.btnLabel = newSettings.sanctionCard.btnLabel;
      if (newSettings.sanctionCard.btnColor !== undefined) currentSettings.btnColor = newSettings.sanctionCard.btnColor;
      if (newSettings.sanctionCard.heroColor !== undefined) currentSettings.sanctionCardColor = newSettings.sanctionCard.heroColor;
    }
    if (newSettings.step4) {
      if (newSettings.step4.defaultLimit !== undefined) currentSettings.defaultCreditLimit = Number(newSettings.step4.defaultLimit);
      if (newSettings.step4.interestRate !== undefined) currentSettings.interestRate = Number(newSettings.step4.interestRate);
      if (newSettings.step4.disbursalFee !== undefined) currentSettings.disbursalFee = Number(newSettings.step4.disbursalFee);
      if (newSettings.step4.btnLabel !== undefined) currentSettings.btnLabel = newSettings.step4.btnLabel;
      if (newSettings.step4.btnColor !== undefined) currentSettings.btnColor = newSettings.step4.btnColor;
      if (newSettings.step4.btnHeight !== undefined) currentSettings.btnHeight = newSettings.step4.btnHeight;
      if (newSettings.step4.btnRadius !== undefined) currentSettings.btnRadius = newSettings.step4.btnRadius;
    }
    if (newSettings.themeColor) {
      currentSettings.sanctionCardColor = newSettings.themeColor;
    }
    currentSettings.updatedAt = new Date().toISOString();
    saveSettings();
    return { ...currentSettings };
  }
};

module.exports = SettingsStore;