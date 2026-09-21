/* ========================================================
   ApexLoan / Bruno Credits - Central Dynamic Settings Applier
   Applies granular field-level and visual customizations across all views
   Supports 0ms synchronous localStorage hydration & real-time BroadcastChannel sync
   ======================================================== */

(function(window) {
  'use strict';

  const STORAGE_KEY = 'apexloan_system_settings';
  const CHANNEL_NAME = 'apexloan_settings_channel';

  window.ApexSettingsManager = {
    settings: null,

    init() {
      // 1. Instant 0ms synchronous hydration from localStorage
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') {
            this.settings = parsed;
            this.apply(parsed);
          }
        }
      } catch (err) {
        console.warn('[SETTINGS_APPLIER] Cache read warning:', err);
      }

      // 2. Fetch fresh settings from server with cache-busting
      this.fetchFresh();

      // 3. Multi-tab / multi-window real-time live sync via BroadcastChannel
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const channel = new BroadcastChannel(CHANNEL_NAME);
          channel.onmessage = (event) => {
            if (event.data && typeof event.data === 'object') {
              this.settings = event.data;
              this.apply(event.data);
            }
          };
        } catch (e) {
          console.warn('[SETTINGS_APPLIER] BroadcastChannel not supported:', e);
        }
      }

      // 4. Cross-tab storage event listener
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            const updated = JSON.parse(e.newValue);
            if (updated && typeof updated === 'object') {
              this.settings = updated;
              this.apply(updated);
            }
          } catch (err) {}
        }
      });
    },

    async fetchFresh() {
      try {
        const apiBase = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) ? window.APP_CONFIG.API_BASE_URL : '/api';
        const res = await fetch(`${apiBase}/settings?_t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        if (data && data.success && data.settings) {
          this.settings = data.settings;
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.settings));
          } catch (e) {}
          this.apply(data.settings);
        }
      } catch (err) {
        console.warn('[SETTINGS_APPLIER] Failed to fetch fresh settings, using existing:', err);
      }
    },

    apply(s) {
      if (!s) return;
      this.settings = s;
      const root = document.documentElement;

      // 1. Global Themes & Branding
      const primary = s.themeColor || s.sanctionCardColor || s.sanctionCard?.btnColor || '#0d2b82';
      if (primary) {
        root.style.setProperty('--primary', primary);
        root.style.setProperty('--color-primary', primary);
        root.style.setProperty('--primary-blue', primary);
        root.style.setProperty('--primary-blue-vibrant', primary);
      }
      if (s.accentColor) {
        root.style.setProperty('--accent', s.accentColor);
        root.style.setProperty('--success', s.accentColor);
      }

      if (s.brandName) {
        document.querySelectorAll('.app-brand-name, .brand-title, #brandNameDisplay, .topbar-logo-txt').forEach(el => {
          el.textContent = s.brandName;
        });
      }
      if (s.lenderName) {
        document.querySelectorAll('.app-lender-name').forEach(el => {
          el.textContent = s.lenderName;
        });
      }
      if (s.supportPhone) {
        document.querySelectorAll('.app-support-phone').forEach(el => {
          el.textContent = s.supportPhone;
          if (el.tagName === 'A') el.href = 'tel:' + s.supportPhone;
        });
      }
      if (s.supportEmail) {
        document.querySelectorAll('.app-support-email').forEach(el => {
          el.textContent = s.supportEmail;
          if (el.tagName === 'A') el.href = 'mailto:' + s.supportEmail;
        });
      }

      // Helper: Apply field-level customizations (label, placeholder, visibility)
      function applyField(elId, cfg) {
        if (!cfg) return;
        const el = document.getElementById(elId);
        if (!el) return;

        const grp = el.closest('.form-group') || el.closest('.form-row');

        // Visibility toggle
        if (grp && cfg.visible !== undefined) {
          grp.style.display = cfg.visible ? '' : 'none';
        }

        // Update label text
        if (cfg.label) {
          let labelEl = null;
          if (grp) labelEl = grp.querySelector('label');
          if (!labelEl) labelEl = document.getElementById('lbl_' + elId);
          if (labelEl) {
            const isReq = cfg.required !== false;
            labelEl.innerHTML = `${cfg.label} ${isReq ? '<span class="required">*</span>' : ''}`;
          }
        }

        // Update placeholder
        if (cfg.placeholder !== undefined && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
          el.placeholder = cfg.placeholder;
        }
      }

      // 2. Granular Field Customizations per Phase
      const f = s.fields || {};

      // Phase 1 Fields
      if (f.step1) {
        applyField('fullName', f.step1.fullName);
        applyField('mobile', f.step1.mobile);
        applyField('dob', f.step1.dob);
        applyField('gender', f.step1.gender);
        applyField('email', f.step1.email);
        applyField('loanPurpose', f.step1.loanPurpose);
        applyField('city', f.step1.city);
        applyField('pincode', f.step1.pincode);
        applyField('state', f.step1.state);
        const calcBox = document.getElementById('step1LoanCalcBox');
        if (calcBox && f.step1.loanSlider) {
          calcBox.style.display = f.step1.loanSlider.visible === false ? 'none' : '';
          if (f.step1.loanSlider.label) {
            const calcLbl = calcBox.querySelector('label') || calcBox.querySelector('.calc-label');
            if (calcLbl) calcLbl.textContent = f.step1.loanSlider.label;
          }
        }
      }

      // Phase 2 Fields
      if (f.step2) {
        applyField('empType', f.step2.empType);
        applyField('companyName', f.step2.companyName);
        applyField('designation', f.step2.designation);
        applyField('experience', f.step2.experience);
        applyField('monthlySalary', f.step2.monthlySalary);
        const slipBox = document.getElementById('salarySlipUpload')?.closest('.form-group') || document.getElementById('salarySlipCard');
        if (slipBox && f.step2.salarySlip) {
          slipBox.style.display = f.step2.salarySlip.visible === false ? 'none' : '';
          if (f.step2.salarySlip.label) {
            const slipLbl = slipBox.querySelector('label');
            if (slipLbl) slipLbl.textContent = f.step2.salarySlip.label;
          }
        }
      }

      // Phase 3 Fields
      if (f.step3) {
        applyField('aadhaarNumber', f.step3.aadhaarNumber);
        applyField('panNumber', f.step3.panNumber);
        const photoBox = document.getElementById('step3PhotoUploadSection');
        if (photoBox && f.step3.docPhotos) {
          photoBox.style.display = f.step3.docPhotos.visible === true ? 'block' : 'none';
        }
        if (f.step3.aiScannerHud) {
          window.enableAiScannerHud = f.step3.aiScannerHud.visible !== false;
        }
      }

      // Phase 4 Fields
      if (f.step4) {
        applyField('bankName', f.step4.bankName);
        applyField('accountNumber', f.step4.accountNumber);
        applyField('confirmAccountNumber', f.step4.confirmAccountNumber);
        applyField('ifscCode', f.step4.ifscCode);
        if (f.step4.pennyDrop) {
          window.enablePennyDrop = f.step4.pennyDrop.visible !== false;
        }
        if (f.step4.giftBox) {
          window.enableGiftBox = f.step4.giftBox.visible !== false;
        }
      }

      // 3. Phase Headers & Action Buttons
      if (s.step1) {
        const titleEl = document.getElementById('step1Title');
        if (titleEl && s.step1.title) titleEl.textContent = s.step1.title;
        const subEl = document.getElementById('step1Subtitle');
        if (subEl && s.step1.subtitle) subEl.textContent = s.step1.subtitle;
      }

      // Apply Step Navigation Buttons (#nextBtn for Step 1-3)
      const nextBtn = document.getElementById('nextBtn');
      if (nextBtn) {
        const curStep = window.currentStep || 1;
        const stepCfg = s['step' + curStep];
        if (stepCfg) {
          if (stepCfg.btnLabel) nextBtn.textContent = stepCfg.btnLabel;
          if (stepCfg.btnColor) nextBtn.style.background = stepCfg.btnColor;
          if (stepCfg.btnHeight) nextBtn.style.height = stepCfg.btnHeight;
          if (stepCfg.btnRadius) nextBtn.style.borderRadius = stepCfg.btnRadius;
        }
      }

      if (s.step2) {
        const titleEl = document.getElementById('step2Title');
        if (titleEl && s.step2.title) titleEl.textContent = s.step2.title;
        const subEl = document.getElementById('step2Subtitle');
        if (subEl && s.step2.subtitle) subEl.textContent = s.step2.subtitle;
        if (s.step2.minSalary) window.minRequiredSalary = Number(s.step2.minSalary);
      }

      if (s.step3) {
        const titleEl = document.getElementById('step3Title');
        if (titleEl && s.step3.title) titleEl.textContent = s.step3.title;
        const subEl = document.getElementById('step3Subtitle');
        if (subEl && s.step3.subtitle) subEl.textContent = s.step3.subtitle;
      }

      if (s.step4) {
        const titleEl = document.getElementById('step4Title');
        if (titleEl && s.step4.title) titleEl.textContent = s.step4.title;
        const subEl = document.getElementById('step4Subtitle');
        if (subEl && s.step4.subtitle) subEl.textContent = s.step4.subtitle;

        const verifyBtn = document.getElementById('verifyBankBtn');
        if (verifyBtn) {
          if (s.step4.btnLabel) {
            const span = verifyBtn.querySelector('span');
            if (span) span.textContent = s.step4.btnLabel;
            else verifyBtn.textContent = s.step4.btnLabel;
          }
          if (s.step4.btnColor) verifyBtn.style.background = s.step4.btnColor;
          if (s.step4.btnHeight) verifyBtn.style.height = s.step4.btnHeight;
          if (s.step4.btnRadius) verifyBtn.style.borderRadius = s.step4.btnRadius;
        }
      }

      // 4. Sanction Card / Limit Offer Phase
      const sc = s.sanctionCard || {};
      const heroColor = sc.heroColor || s.sanctionCardColor || s.themeColor || '#0d2b82';
      const topHero = document.querySelector('.sanction-hero-top');
      if (topHero) topHero.style.background = heroColor;

      const ceilingLabel = document.getElementById('sanctionCeilingLabel');
      if (ceilingLabel && sc.ceilingText) {
        ceilingLabel.innerHTML = `${sc.ceilingText} <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
      }

      const chooseAmtLbl = document.getElementById('lblChooseLoanAmount');
      if (chooseAmtLbl && sc.chooseAmountLabel) chooseAmtLbl.textContent = sc.chooseAmountLabel;

      const choosePlanLbl = document.getElementById('lblChooseEmiPlan');
      if (choosePlanLbl && sc.choosePlanLabel) choosePlanLbl.textContent = sc.choosePlanLabel;

      const acceptBtn = document.getElementById('acceptLoanBtn');
      if (acceptBtn) {
        if (sc.btnLabel || s.btnLabel) acceptBtn.textContent = sc.btnLabel || s.btnLabel;
        if (sc.btnColor || s.btnColor) acceptBtn.style.background = sc.btnColor || s.btnColor;
        if (sc.btnHeight || s.btnHeight) acceptBtn.style.height = sc.btnHeight || s.btnHeight;
        if (sc.btnRadius || s.btnRadius) acceptBtn.style.borderRadius = sc.btnRadius || s.btnRadius;
      }

      const defaultLimit = Number(sc.defaultLimit || s.defaultCreditLimit || 50000);
      window.globalDefaultCreditLimit = defaultLimit;
      window.globalInterestRate = Number(sc.interestRate || s.interestRate || 24);
      window.globalDisbursalFee = Number(sc.disbursalFee || s.disbursalFee || 199);

      if (typeof window.setApprovedLoanLimit === 'function' && !window.sanctionedOffer) {
        window.setApprovedLoanLimit(defaultLimit, defaultLimit);
      }

      // 5. Customer Dashboard Customizations
      const d = s.dashboard || {};
      const heroTitleEl = document.querySelector('.quick-loan-title');
      if (heroTitleEl && d.heroTitle) heroTitleEl.textContent = d.heroTitle;

      const heroSubEl = document.querySelector('.quick-subtext');
      if (heroSubEl && d.heroSubtext) heroSubEl.textContent = d.heroSubtext;

      const heroBtnSpan = document.querySelector('.btn-primary-blue span');
      if (heroBtnSpan && d.heroBtnText) heroBtnSpan.textContent = d.heroBtnText;

      // Important notice card
      const impCard = document.querySelector('.important-card');
      if (impCard) {
        impCard.style.display = d.showImportant === false ? 'none' : 'block';
        const impTitle = impCard.querySelector('.important-title');
        if (impTitle && d.importantTitle) impTitle.textContent = d.importantTitle;
        const impSub = impCard.querySelector('.important-left-desc span');
        if (impSub && d.importantSubtext) impSub.textContent = d.importantSubtext;
      }

      // Live Announcement Banner
      const announceBanner = document.getElementById('dashAnnouncementBanner');
      const announceTxt = document.getElementById('dashAnnouncementText');
      if (announceBanner) {
        announceBanner.style.display = d.showAnnouncement === false ? 'none' : 'flex';
        if (announceTxt && d.announcementText) announceTxt.textContent = d.announcementText;
      }

      // Key Fact Statement (KFS) Strip
      const kfsStrips = document.querySelectorAll('.kfs-home-strip, #dashKfsCard');
      kfsStrips.forEach(el => {
        el.style.display = d.showKfsButton === false ? 'none' : 'flex';
      });

      // Customer Support Box / Menu Row
      const supportItems = document.querySelectorAll('#dashSupportBox, .menu-item-row[onclick*="Support"], .support-help-box');
      supportItems.forEach(el => {
        el.style.display = d.showSupportBox === false ? 'none' : 'flex';
      });
    }
  };

  // Immediate or DOM ready execution
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.ApexSettingsManager.init());
  } else {
    window.ApexSettingsManager.init();
  }
})(window);