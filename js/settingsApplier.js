/* ========================================================
   ApexLoan / Bruno Credits - Central Dynamic Settings Applier
   Applies admin customizer configuration dynamically across all views
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
      const primary = s.themeColor || s.step4?.btnColor || '#0d2b82';
      if (primary) {
        root.style.setProperty('--primary', primary);
        root.style.setProperty('--color-primary', primary);
      }
      if (s.accentColor) {
        root.style.setProperty('--accent', s.accentColor);
        root.style.setProperty('--success', s.accentColor);
      }

      // Brand text replacements
      if (s.brandName) {
        document.querySelectorAll('.app-brand-name, .brand-title').forEach(el => {
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

      // 2. Phase 1 Customizations (apply.html)
      if (s.step1) {
        const st1 = s.step1;
        const titleEl = document.getElementById('step1Title');
        if (titleEl && st1.title) titleEl.textContent = st1.title;

        const subEl = document.getElementById('step1Subtitle');
        if (subEl && st1.subtitle) subEl.textContent = st1.subtitle;

        // Toggles
        const calcBox = document.getElementById('step1LoanCalcBox');
        if (calcBox) calcBox.style.display = st1.showLoanSlider === false ? 'none' : '';

        const emailGrp = document.getElementById('email')?.closest('.form-group');
        if (emailGrp) emailGrp.style.display = st1.showEmail === false ? 'none' : '';

        const genderGrp = document.getElementById('gender')?.closest('.form-group');
        if (genderGrp) genderGrp.style.display = st1.showGender === false ? 'none' : '';

        const addressRow = document.getElementById('city')?.closest('.form-row') || document.getElementById('city')?.closest('.form-group');
        const stateGrp = document.getElementById('state')?.closest('.form-group');
        const pinGrp = document.getElementById('pincode')?.closest('.form-group');
        if (addressRow && st1.showAddress === false) addressRow.style.display = 'none';
        if (stateGrp && st1.showAddress === false) stateGrp.style.display = 'none';
        if (pinGrp && st1.showAddress === false) pinGrp.style.display = 'none';

        // Step 1 Button
        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn && window.currentStep === 1) {
          if (st1.btnLabel) nextBtn.textContent = st1.btnLabel;
          if (st1.btnColor) nextBtn.style.background = st1.btnColor;
          if (st1.btnHeight) nextBtn.style.height = st1.btnHeight;
          if (st1.btnRadius) nextBtn.style.borderRadius = st1.btnRadius;
        }
      }

      // 3. Phase 2 Customizations
      if (s.step2) {
        const st2 = s.step2;
        const titleEl = document.getElementById('step2Title');
        if (titleEl && st2.title) titleEl.textContent = st2.title;

        const subEl = document.getElementById('step2Subtitle');
        if (subEl && st2.subtitle) subEl.textContent = st2.subtitle;

        const compGrp = document.getElementById('companyName')?.closest('.form-group');
        if (compGrp) compGrp.style.display = st2.showCompany === false ? 'none' : '';

        const desigGrp = document.getElementById('designation')?.closest('.form-group');
        if (desigGrp) desigGrp.style.display = st2.showDesignation === false ? 'none' : '';

        const expGrp = document.getElementById('experience')?.closest('.form-group');
        if (expGrp) expGrp.style.display = st2.showExperience === false ? 'none' : '';

        if (st2.minSalary) window.minRequiredSalary = Number(st2.minSalary);
      }

      // 4. Phase 3 Customizations
      if (s.step3) {
        const st3 = s.step3;
        const titleEl = document.getElementById('step3Title');
        if (titleEl && st3.title) titleEl.textContent = st3.title;

        const subEl = document.getElementById('step3Subtitle');
        if (subEl && st3.subtitle) subEl.textContent = st3.subtitle;

        const photoBox = document.getElementById('step3PhotoUploadSection');
        if (photoBox) photoBox.style.display = st3.showPhotoUploads === true ? 'block' : 'none';

        window.enableAiScannerHud = st3.enableAiScannerHud !== false;
      }

      // 5. Phase 4 Customizations
      if (s.step4) {
        const st4 = s.step4;
        const titleEl = document.getElementById('step4Title');
        if (titleEl && st4.title) titleEl.textContent = st4.title;

        const subEl = document.getElementById('step4Subtitle');
        if (subEl && st4.subtitle) subEl.textContent = st4.subtitle;

        const topHero = document.querySelector('.sanction-hero-top');
        if (topHero && (st4.btnColor || s.themeColor)) {
          topHero.style.background = s.themeColor || st4.btnColor;
        }

        const acceptBtn = document.getElementById('acceptLoanBtn');
        if (acceptBtn) {
          if (st4.btnLabel) acceptBtn.textContent = st4.btnLabel;
          if (st4.btnColor) acceptBtn.style.background = st4.btnColor;
          if (st4.btnHeight) acceptBtn.style.height = st4.btnHeight;
          if (st4.btnRadius) acceptBtn.style.borderRadius = st4.btnRadius;
        }

        if (st4.defaultLimit) {
          window.globalDefaultCreditLimit = Number(st4.defaultLimit);
          if (typeof window.setApprovedLoanLimit === 'function' && !window.sanctionedOffer) {
            window.setApprovedLoanLimit(st4.defaultLimit, st4.defaultLimit);
          }
        }
        if (st4.interestRate) window.globalInterestRate = Number(st4.interestRate);
        if (st4.disbursalFee) window.globalDisbursalFee = Number(st4.disbursalFee);
      }

      // 6. Dashboard Customizations (dashboard.html)
      if (s.dashboard) {
        const d = s.dashboard;
        const banner = document.getElementById('dashAnnouncementBanner');
        const bannerTxt = document.getElementById('dashAnnouncementText');
        if (banner) {
          banner.style.display = d.showAnnouncement === false ? 'none' : 'flex';
          if (bannerTxt && d.announcementText) bannerTxt.textContent = d.announcementText;
        }

        const kfsCard = document.getElementById('dashKfsCard');
        if (kfsCard) kfsCard.style.display = d.showKfsButton === false ? 'none' : 'block';

        const supportBox = document.getElementById('dashSupportBox');
        if (supportBox) supportBox.style.display = d.showSupportBox === false ? 'none' : 'block';
      }
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    window.ApexSettingsManager.init();
  });
})(window);
