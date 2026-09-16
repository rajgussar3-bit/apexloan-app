const express = require('express');
const router = express.Router();
const ApplicationsStore = require('../data/applicationsStore');

const VALID_PASSCODES = ['8791', 'admin2026', '16132', 'apexadmin'];

// ---- Employee / Staff Authentication ----
router.post('/auth', (req, res) => {
  const { passcode } = req.body;
  if (!passcode) {
    return res.status(400).json({ success: false, message: 'Employee passcode is required' });
  }

  const cleanPasscode = String(passcode).trim();
  if (VALID_PASSCODES.includes(cleanPasscode)) {
    const token = 'staff_sec_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    return res.json({
      success: true,
      token,
      staff: {
        role: 'Operations Desk Officer',
        lender: 'Vistas Tecnolabs Finance Limited',
        accessLevel: 'FULL_DISBURSAL_ACCESS'
      }
    });
  } else {
    return res.status(401).json({ success: false, message: 'Invalid employee passcode. Access denied.' });
  }
});

// ---- Fetch All Borrower Applications & Portfolio Stats ----
router.get('/applications', (req, res) => {
  try {
    const apps = ApplicationsStore.getAll();
    const stats = ApplicationsStore.getStats();
    res.json({
      success: true,
      applications: apps,
      stats
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---- Fetch Single Borrower Application Details ----
router.get('/applications/:id', (req, res) => {
  try {
    const app = ApplicationsStore.getById(req.params.id);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    res.json({
      success: true,
      application: app
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---- Update Application Status, Disbursal UTR & Sanction Ceiling ----
router.put('/applications/:id', (req, res) => {
  try {
    const { status, disbursalTxnId, disbursedAmount, creditLimit, selectedTenure, monthlyEmi, adminRemarks } = req.body;
    
    const updates = {};
    if (status) updates.status = status;
    if (disbursalTxnId !== undefined) updates.disbursalTxnId = String(disbursalTxnId).trim();
    if (disbursedAmount !== undefined) updates.disbursedAmount = Number(disbursedAmount);
    if (creditLimit !== undefined) {
      updates.creditLimit = Number(creditLimit);
      updates.selectedAmount = Number(creditLimit);
    }
    if (selectedTenure !== undefined) updates.selectedTenure = Number(selectedTenure);
    if (monthlyEmi !== undefined) updates.monthlyEmi = Number(monthlyEmi);
    if (adminRemarks !== undefined) updates.adminRemarks = String(adminRemarks).trim();

    const updated = ApplicationsStore.updateStatus(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Application not found to update' });
    }

    console.log(`[ADMIN] Updated application ${req.params.id}: Status = ${updated.status}, UTR = ${updated.disbursalTxnId || 'None'}`);

    res.json({
      success: true,
      message: 'Application updated successfully. Changes reflected to borrower app.',
      application: updated,
      stats: ApplicationsStore.getStats()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const SettingsStore = require('../data/settingsStore');

// ---- Get System & Sanction Customization Settings ----
router.get('/settings', (req, res) => {
  try {
    const settings = SettingsStore.get();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---- Update System & Sanction Customization Settings ----
router.put('/settings', (req, res) => {
  try {
    const updated = SettingsStore.update(req.body);
    console.log('[ADMIN] System settings updated:', updated);
    res.json({
      success: true,
      message: 'App theme and sanction customization settings saved successfully!',
      settings: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
