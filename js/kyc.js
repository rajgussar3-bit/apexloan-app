/* =========================================================
   Bruno Credits - KYC Document Upload & AI Verification Controller
   Aadhaar (Front + Back) & PAN (Front) + 3-Second Scanning HUD
   ========================================================= */

// ---- State ----
window.aadhaarVerified = false;
window.panVerified = false;
window.kycScanCompleted = false;
window.kycDocs = {
  aadhaarFront: null,
  aadhaarBack: null,
  panFront: null
};

// ---- Document Upload Handler with Instant Image Preview ----
window.handleDocUpload = function(input, boxId, previewId, docLabel) {
  if (!input || !input.files || input.files.length === 0) return;
  
  const file = input.files[0];
  const box = document.getElementById(boxId);
  const preview = document.getElementById(previewId);
  
  // Clear any existing error state
  if (box) {
    box.classList.remove('has-error');
    box.classList.add('has-file');
    const labelEl = box.querySelector('.doc-upload-label');
    if (labelEl) labelEl.textContent = `${docLabel} ✓`;
    const subtextEl = box.querySelector('.doc-upload-subtext');
    if (subtextEl) subtextEl.textContent = 'File attached (tap to replace)';
  }

  // Update kycDocs state
  if (boxId.includes('aadhaarFront')) window.kycDocs.aadhaarFront = file.name;
  if (boxId.includes('aadhaarBack')) window.kycDocs.aadhaarBack = file.name;
  if (boxId.includes('panFront')) window.kycDocs.panFront = file.name;

  // Hide error text
  const errEl = document.getElementById(boxId.replace('Box', 'Error'));
  if (errEl) errEl.style.display = 'none';

  // Render Image Preview Thumbnail
  if (preview) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const fileSizeKb = Math.round(file.size / 1024);
      preview.innerHTML = `
        <div class="doc-preview-wrapper">
          <img src="${e.target.result}" class="doc-thumb-img" alt="${docLabel}">
          <div class="doc-file-info">
            <div class="doc-file-name">${file.name}</div>
            <div class="doc-file-meta">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              <span>${docLabel} Attached (${fileSizeKb} KB)</span>
            </div>
          </div>
          <button type="button" class="btn-retake-doc" onclick="window.reuploadDoc('${input.id}')">Change</button>
        </div>
      `;
    };
    reader.readAsDataURL(file);
  }
};

window.reuploadDoc = function(inputId) {
  const el = document.getElementById(inputId);
  if (el) el.click();
};

// ---- 3-Second High-Tech AI Verification Scanner Routine ----
window.start3SecondKycScan = function(onComplete) {
  if (window.enableAiScannerHud === false) {
    if (typeof onComplete === 'function') onComplete();
    return;
  }
  const overlay = document.getElementById('kycScanningOverlay');
  if (!overlay) {
    if (typeof onComplete === 'function') onComplete();
    return;
  }

  // Reset elements
  const progressBar = document.getElementById('scannerProgressBar');
  const headline = document.getElementById('scannerHeadline');
  const subtext = document.getElementById('scannerSubtext');
  const chipText = document.getElementById('scannerStatusChipText');
  const check1 = document.getElementById('scanCheck1');
  const check2 = document.getElementById('scanCheck2');
  const check3 = document.getElementById('scanCheck3');
  const icon1 = document.getElementById('scanCheckIcon1');
  const icon2 = document.getElementById('scanCheckIcon2');
  const icon3 = document.getElementById('scanCheckIcon3');

  // Initial State (0ms)
  overlay.style.display = 'flex';
  if (progressBar) progressBar.style.width = '20%';
  if (headline) headline.textContent = 'Verifying Documents...';
  if (subtext) subtext.textContent = 'Scanning Aadhaar & PAN security holograms & micro-text...';
  if (chipText) chipText.textContent = 'AI OCR SCAN IN PROGRESS';

  if (check1) { check1.className = 'scan-check-item active'; }
  if (check2) { check2.className = 'scan-check-item'; }
  if (check3) { check3.className = 'scan-check-item'; }
  if (icon1) icon1.textContent = '1';
  if (icon2) icon2.textContent = '2';
  if (icon3) icon3.textContent = '3';

  // Phase 2 (1100ms)
  setTimeout(() => {
    if (progressBar) progressBar.style.width = '65%';
    if (headline) headline.textContent = 'Government Gateway Matching...';
    if (subtext) subtext.textContent = 'Querying NSDL PAN database & UIDAI Aadhaar registry...';
    if (chipText) chipText.textContent = 'CENTRAL REGISTRY QUERY';

    if (check1) { check1.className = 'scan-check-item done'; }
    if (icon1) icon1.textContent = '✓';
    if (check2) { check2.className = 'scan-check-item active'; }
  }, 1100);

  // Phase 3 (2200ms)
  setTimeout(() => {
    if (progressBar) progressBar.style.width = '100%';
    if (headline) headline.textContent = 'Documents Verified! ✓';
    if (subtext) subtext.textContent = 'Aadhaar & PAN 100% matched. Sanction underwriting cleared.';
    if (chipText) chipText.textContent = 'KYC VERIFIED & APPROVED';

    if (check2) { check2.className = 'scan-check-item done'; }
    if (icon2) icon2.textContent = '✓';
    if (check3) { check3.className = 'scan-check-item done'; }
    if (icon3) icon3.textContent = '✓';
  }, 2200);

  // Phase 4: Finish at exactly 3000ms (3 seconds)
  setTimeout(() => {
    overlay.style.display = 'none';
    window.aadhaarVerified = true;
    window.panVerified = true;
    window.kycScanCompleted = true;
    if (typeof onComplete === 'function') {
      onComplete();
    }
  }, 3000);
};

// ---- Document Auto-Formatters & Event Listeners ----
document.addEventListener('DOMContentLoaded', () => {
  // Aadhaar Auto-Format: XXXX XXXX XXXX
  const aadhaarInput = document.getElementById('aadhaarNumber');
  if (aadhaarInput) {
    aadhaarInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').slice(0, 12);
      let formatted = '';
      for (let i = 0; i < val.length; i++) {
        if (i > 0 && i % 4 === 0) formatted += ' ';
        formatted += val[i];
      }
      e.target.value = formatted;
      if (val.length === 12) {
        const group = aadhaarInput.closest('.form-group');
        if (group) group.classList.remove('has-error');
      }
    });
  }

  // PAN Auto-Uppercase: 10 chars
  const panInput = document.getElementById('panNumber');
  if (panInput) {
    panInput.addEventListener('input', (e) => {
      let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
      e.target.value = val;
      if (/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val)) {
        const group = panInput.closest('.form-group');
        if (group) group.classList.remove('has-error');
      }
    });
  }
});


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
