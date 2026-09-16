const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname);
const DATA_FILE = path.join(DATA_DIR, 'applications.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error('[STORE] Failed to create data dir:', e);
  }
}

let inMemoryStore = [];

// Seed initial demo application so dashboard and admin test data work seamlessly
const initialSeed = [
  {
    id: 'APP-9281',
    refNum: 'VT-AL-9281X',
    mobile: '9876543210',
    fullName: 'SUBIPRA CHOWDHURY',
    email: 'subipra.c@gmail.com',
    dob: '1995-08-14',
    gender: 'Male',
    address: 'Flat 402, Royal Palms, MG Road',
    pincode: '560001',
    empType: 'Salaried',
    monthlyIncome: 35000,
    companyName: 'Infosys BPM',
    experience: '2-5',
    loanPurpose: 'Medical Emergency',
    aadhaarNumber: '7829 4512 8839',
    panNumber: 'ABCDE1234F',
    bankName: 'State Bank of India',
    accountNumber: '38291048271',
    ifscCode: 'SBIN0004567',
    requestedAmount: 50000,
    creditLimit: 50000,
    selectedAmount: 50000,
    selectedTenure: 9,
    monthlyEmi: 6249,
    feeAmount: 299,
    feePaid: true,
    feePaymentId: 'pay_live_sample982',
    feePaidAt: new Date(Date.now() - 3600000).toISOString(),
    status: 'SANCTIONED', // SANCTIONED, DISBURSED, PENDING_REVIEW, REJECTED, ON_HOLD
    disbursalTxnId: '',
    disbursedAmount: 0,
    disbursedAt: null,
    adminRemarks: 'Aadhaar & PAN verified. Ready for IMPS bank transfer.',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  }
];

function loadFromFile() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      inMemoryStore = JSON.parse(raw);
      console.log(`[STORE] Loaded ${inMemoryStore.length} applications from ${DATA_FILE}`);
    } else {
      inMemoryStore = [...initialSeed];
      saveToFile();
    }
  } catch (err) {
    console.warn('[STORE] Error reading applications.json, using fallback store:', err.message);
    if (!inMemoryStore || inMemoryStore.length === 0) {
      inMemoryStore = [...initialSeed];
    }
  }
}

function saveToFile() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(inMemoryStore, null, 2), 'utf8');
  } catch (err) {
    console.warn('[STORE] Error saving applications to disk:', err.message);
  }
}

// Initial load
loadFromFile();

const ApplicationsStore = {
  getAll() {
    return inMemoryStore.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  },

  getById(id) {
    return inMemoryStore.find(a => a.id === id || a.refNum === id);
  },

  getByMobile(mobile) {
    if (!mobile) return null;
    const clean = String(mobile).replace(/\D/g, '').slice(-10);
    return inMemoryStore.find(a => String(a.mobile).replace(/\D/g, '').slice(-10) === clean);
  },

  saveOrUpdate(data) {
    if (!data.mobile) throw new Error('Mobile number is required for application');
    const cleanMobile = String(data.mobile).replace(/\D/g, '').slice(-10);
    let existingIndex = inMemoryStore.findIndex(a => String(a.mobile).replace(/\D/g, '').slice(-10) === cleanMobile);

    const now = new Date().toISOString();
    let record;

    if (existingIndex >= 0) {
      // Update existing record
      record = {
        ...inMemoryStore[existingIndex],
        ...data,
        mobile: cleanMobile,
        updatedAt: now
      };
      // Keep original id and createdAt
      record.id = inMemoryStore[existingIndex].id;
      record.createdAt = inMemoryStore[existingIndex].createdAt || now;
      inMemoryStore[existingIndex] = record;
    } else {
      // Create new application
      const id = 'APP-' + Math.floor(1000 + Math.random() * 9000);
      const refNum = data.refNum || ('VT-AL-' + id.slice(-4) + Date.now().toString(36).slice(-2).toUpperCase());
      record = {
        id,
        refNum,
        status: data.status || 'PENDING_REVIEW',
        disbursalTxnId: '',
        disbursedAmount: 0,
        disbursedAt: null,
        adminRemarks: '',
        ...data,
        mobile: cleanMobile,
        createdAt: now,
        updatedAt: now
      };
      inMemoryStore.unshift(record);
    }

    saveToFile();
    return record;
  },

  updateStatus(id, updates) {
    const idx = inMemoryStore.findIndex(a => a.id === id || a.refNum === id);
    if (idx === -1) return null;

    const current = inMemoryStore[idx];
    const now = new Date().toISOString();

    const updated = {
      ...current,
      ...updates,
      updatedAt: now
    };

    if (updates.status === 'DISBURSED' && !updated.disbursedAt) {
      updated.disbursedAt = now;
      if (!updated.disbursedAmount) {
        updated.disbursedAmount = updated.selectedAmount || updated.creditLimit || 50000;
      }
    }

    inMemoryStore[idx] = updated;
    saveToFile();
    return updated;
  },

  getStats() {
    const total = inMemoryStore.length;
    let pendingDisbursal = 0;
    let totalDisbursed = 0;
    let sanctionedCount = 0;

    for (const app of inMemoryStore) {
      if (app.status === 'SANCTIONED') pendingDisbursal++;
      if (app.status === 'DISBURSED') {
        totalDisbursed += Number(app.disbursedAmount || app.selectedAmount || app.creditLimit || 0);
      }
      if (app.status === 'SANCTIONED' || app.status === 'DISBURSED') {
        sanctionedCount++;
      }
    }

    return {
      total,
      pendingDisbursal,
      totalDisbursed,
      sanctionedCount
    };
  }
};

module.exports = ApplicationsStore;
