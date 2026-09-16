const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, 'settings.json');

const defaultSettings = {
  themeColor: '#0d2b82',
  themeGradient: 'linear-gradient(180deg, #09206d 0%, #0e2f8d 70%, #103bb3 100%)',
  sanctionCardColor: '#0d2b82',
  btnColor: 'linear-gradient(135deg, #0d2b82 0%, #103bb3 100%)',
  btnHeight: '52px',
  btnRadius: '14px',
  btnFontSize: '15px',
  btnLabel: 'Continue with loan amount',
  defaultCreditLimit: 50000,
  interestRate: 24.0,
  disbursalFee: 199,
  brandName: 'Bruno Credits',
  lenderName: 'Vistas Tecnolabs Finance Limited',
  rbiLicense: 'B-14.02528',
  supportPhone: '1800-209-4321'
};

let currentSettings = { ...defaultSettings };

function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
      currentSettings = { ...defaultSettings, ...JSON.parse(raw) };
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
    currentSettings = {
      ...currentSettings,
      ...newSettings,
      updatedAt: new Date().toISOString()
    };
    saveSettings();
    return { ...currentSettings };
  }
};

module.exports = SettingsStore;
