const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, 'settings.json');

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

  // Dashboard Controls
  dashboard: {
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
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(currentSettings, null, 2), 'utf8');
  } catch (e) {
    console.warn('[SETTINGS] Error saving settings to disk:', e.message);
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
