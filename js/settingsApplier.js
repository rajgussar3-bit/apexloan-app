/* ========================================================
   ApexLoan / Bruno Credits - Central Dynamic Settings Applier
   Applies granular field-level and visual customizations across all views
   ======================================================== */

(function(window) {
  'use strict';

  window.ApexSettingsManager = {
    settings: null,

    async init() {
      try {
        const apiBase = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) ? window.APP_CONFIG.API_BASE_URL : '/api';
        const res = await fetch(`${apiBase}/settings?_t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        if (data && data.success && data.settings) {
          this.settings = data.settings;
          this.apply(data.settings);
        }
      } catch (err) {
        console.warn('[SETTINGS_APPLIER] Failed to fetch settings, using defaults:', err);
      }
    },

    apply(s) {
      if (!s) return;
      this.settings = s;
      const root = document.documentElement;

      // 1. Global Themes & Branding
      const primary = s.themeColor || s.sanctionCard?.btnColor || '#0d2b82';
      if (primary) {
        root.style.setProperty('--primary', primary);
        root.style.setProperty('--color-primary', primary);
      }
      if (s.accentColor) {
        root.style.setProperty('--accent', s.accentColor);
        root.style.setProperty('--success', s.accentColor);
      }

      if (s.brandName) {
        document.querySelectorAll('.app-brand-name, .brand-title, #brandNameDisplay').forEach(el => {
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
            const calcLbl = calcBox.querySelector('label');
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
        const slipBox = document.getElementById('salarySlipUpload')?.closest('.form-group');
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
        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn && window.currentStep === 1) {
          if (s.step1.btnLabel) nextBtn.textContent = s.step1.btnLabel;
          if (s.step1.btnColor) nextBtn.style.background = s.step1.btnColor;
          if (s.step1.btnHeight) nextBtn.style.height = s.step1.btnHeight;
          if (s.step1.btnRadius) nextBtn.style.borderRadius = s.step1.btnRadius;
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
      }

      // 4. Sanction Card / Limit Offer Phase
      const sc = s.sanctionCard || {};
      const heroColor = sc.heroColor || s.themeColor || '#0d2b82';
      const topHero = document.querySelector('.sanction-hero-top');
      if (topHero) topHero.style.background = heroColor;

      const ceilingLabel = document.getElementById('sanctionCeilingLabel');
      if (ceilingLabel && sc.ceilingText) ceilingLabel.textContent = sc.ceilingText;

      const chooseAmtLbl = document.getElementById('lblChooseLoanAmount');
      if (chooseAmtLbl && sc.chooseAmountLabel) chooseAmtLbl.textContent = sc.chooseAmountLabel;

      const choosePlanLbl = document.getElementById('lblChooseEmiPlan');
      if (choosePlanLbl && sc.choosePlanLabel) choosePlanLbl.textContent = sc.choosePlanLabel;

      const acceptBtn = document.getElementById('acceptLoanBtn');
      if (acceptBtn) {
        if (sc.btnLabel) acceptBtn.textContent = sc.btnLabel;
        if (sc.btnColor) acceptBtn.style.background = sc.btnColor;
        if (sc.btnHeight) acceptBtn.style.height = sc.btnHeight;
        if (sc.btnRadius) acceptBtn.style.borderRadius = sc.btnRadius;
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

  document.addEventListener('DOMContentLoaded', () => {
    window.ApexSettingsManager.init();
  });
})(window);