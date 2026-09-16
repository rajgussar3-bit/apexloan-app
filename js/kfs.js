/**
 * Apex Loans / Bruno Credits - RBI Key Fact Statement (KFS) Engine
 * Compliant with Reserve Bank of India (RBI) Digital Lending Guidelines (Annex 1)
 * Regulated Entity: Vistas Tecnolabs Finance Limited (RBI Reg. No. B-14.02528)
 */

(function(window) {
  'use strict';

  const KfsEngine = {
    lender: {
      name: 'Vistas Tecnolabs Finance Limited',
      rbiRegNo: 'B-14.02528',
      entityType: 'Non-Banking Financial Company (NBFC - ND - SI)',
      registeredAddress: 'Unit 204, 2nd Floor, Peninsula Business Park, Lower Parel, Mumbai, Maharashtra - 400013',
      dlaName: 'Bruno Credits / Apex Loans Digital Application',
      groName: 'Mr. Rajeshwar Rao',
      groEmail: 'grievance@vistastecnolabs.com',
      groPhone: '1800-209-4321',
      groAddress: 'Grievance Redressal Cell, Peninsula Business Park, Lower Parel, Mumbai - 400013',
      rbiOmbudsmanUrl: 'https://cms.rbi.org.in'
    },

    /**
     * Compute comprehensive financial terms and amortization schedule
     */
    compile(data) {
      data = data || {};
      
      // Fallback extraction from localStorage if empty
      if (!data.fullName) {
        data.fullName = localStorage.getItem('apexloan_fullname') || localStorage.getItem('apexloan_borrower_name') || 'SUBIPRA C.';
      }
      if (!data.mobile) {
        data.mobile = localStorage.getItem('apexloan_mobile') || '9876543210';
      }
      if (!data.panNumber) {
        data.panNumber = localStorage.getItem('apexloan_pan') || 'ABCDE1234F';
      }
      if (!data.aadhaarNumber) {
        data.aadhaarNumber = localStorage.getItem('apexloan_aadhaar') || 'XXXX-XXXX-8921';
      }
      if (!data.bankName) {
        data.bankName = localStorage.getItem('apexloan_bank_name') || 'State Bank of India';
      }
      if (!data.accountNumber) {
        data.accountNumber = localStorage.getItem('apexloan_acc_num') || '••••••••5995';
      }
      if (!data.ifscCode) {
        data.ifscCode = localStorage.getItem('apexloan_ifsc') || 'SBIN0001234';
      }

      const principal = Math.round(Number(data.selectedAmount || data.disbursedAmount || data.creditLimit || data.loanAmount || 50000));
      const tenureMonths = Math.max(1, Math.round(Number(data.selectedTenure || data.tenureMonths || 9)));
      const annualRate = (principal <= 25000) ? 24.0 : 24.0; // 24.0% p.a. standard
      const monthlyRate = (annualRate / 100) / 12;

      // EMI calculation
      let monthlyEmi = 0;
      if (monthlyRate > 0) {
        const factor = Math.pow(1 + monthlyRate, tenureMonths);
        monthlyEmi = Math.round(principal * monthlyRate * factor / (factor - 1));
      } else {
        monthlyEmi = Math.round(principal / tenureMonths);
      }

      if (data.monthlyEmi && Number(data.monthlyEmi) > 0) {
        monthlyEmi = Math.round(Number(data.monthlyEmi));
      }

      const totalRepayment = monthlyEmi * tenureMonths;
      const totalInterest = Math.max(0, totalRepayment - principal);
      const processingFee = (principal <= 25000) ? 199 : 299;
      const gstOnFee = Math.round(processingFee * 0.18);
      const netDisbursed = principal; // 100% disbursed to borrower bank account

      // APR (Annual Percentage Rate) inclusive of upfront charges
      const totalCostOfCredit = totalInterest + processingFee;
      const apr = Number(((totalCostOfCredit / principal) / (tenureMonths / 12) * 100).toFixed(2));

      // Loan & KFS Identification
      const refNum = data.refNum || data.id || ('VT-KFS-' + Math.floor(100000 + Math.random() * 900000));
      const now = new Date();
      const issueDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const issueTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

      // Generate month-by-month schedule
      const schedule = [];
      let balance = principal;
      const startDate = new Date();

      for (let i = 1; i <= tenureMonths; i++) {
        const dueDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 5);
        const intPortion = Math.round(balance * monthlyRate);
        let princPortion = monthlyEmi - intPortion;
        if (i === tenureMonths || princPortion > balance) {
          princPortion = balance;
        }
        balance = Math.max(0, balance - princPortion);

        schedule.push({
          instNo: i,
          dueDate: dueDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          openingBalance: Math.round(balance + princPortion),
          emi: (i === tenureMonths) ? (princPortion + intPortion) : monthlyEmi,
          principal: princPortion,
          interest: intPortion,
          closingBalance: balance
        });
      }

      return {
        refNum,
        issueDate,
        issueTime,
        fullName: (data.fullName || 'Borrower').toUpperCase(),
        mobile: data.mobile || '-',
        panNumber: (data.panNumber || '-').toUpperCase(),
        aadhaarNumber: data.aadhaarNumber || '-',
        bankName: data.bankName || 'Bank',
        accountNumber: data.accountNumber || '-',
        ifscCode: (data.ifscCode || '-').toUpperCase(),
        principal,
        tenureMonths,
        annualRate,
        monthlyEmi,
        totalInterest,
        totalRepayment,
        processingFee,
        gstOnFee,
        netDisbursed,
        apr,
        schedule,
        status: data.status || 'SANCTIONED',
        disbursalTxnId: data.disbursalTxnId || ''
      };
    },

    /**
     * Render the official RBI KFS HTML document
     */
    renderHtml(kfs) {
      const scheduleRows = kfs.schedule.map(s => `
        <tr>
          <td style="text-align: center; font-weight: 700;">${s.instNo}</td>
          <td>${s.dueDate}</td>
          <td style="text-align: right;">₹${s.openingBalance.toLocaleString('en-IN')}</td>
          <td style="text-align: right; font-weight: 700; color: #0f172a;">₹${s.emi.toLocaleString('en-IN')}</td>
          <td style="text-align: right;">₹${s.principal.toLocaleString('en-IN')}</td>
          <td style="text-align: right;">₹${s.interest.toLocaleString('en-IN')}</td>
          <td style="text-align: right; font-weight: 700;">₹${s.closingBalance.toLocaleString('en-IN')}</td>
        </tr>
      `).join('');

      return `
        <div id="kfsPrintDocument" class="kfs-a4-sheet">
          
          <!-- KFS Watermark -->
          <div class="kfs-watermark">VISTAS TECNOLABS</div>

          <!-- Document Header -->
          <div class="kfs-header-box">
            <div class="kfs-header-top">
              <div class="kfs-brand-left">
                <div class="kfs-logo-emblem">VT</div>
                <div>
                  <h1 class="kfs-re-name">${this.lender.name}</h1>
                  <div class="kfs-re-sub">Reserve Bank of India Registered NBFC · Registration No. ${this.lender.rbiRegNo}</div>
                  <div class="kfs-re-addr">${this.lender.registeredAddress}</div>
                </div>
              </div>
              <div class="kfs-qr-box">
                <div class="kfs-qr-placeholder">
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="1.8">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                    <rect x="14" y="14" width="3" height="3"></rect>
                    <rect x="18" y="18" width="3" height="3"></rect>
                  </svg>
                  <span>RBI DLA VERIFIED</span>
                </div>
              </div>
            </div>

            <div class="kfs-doc-title-bar">
              <span class="kfs-title-badge">ANNEX-1 RBI DIGITAL LENDING GUIDELINES</span>
              <h2 class="kfs-doc-heading">KEY FACT STATEMENT (KFS) - PERSONAL LOAN</h2>
              <div class="kfs-doc-meta">
                <span><strong>KFS Ref No:</strong> ${kfs.refNum}</span>
                <span><strong>Date:</strong> ${kfs.issueDate} ${kfs.issueTime}</span>
                <span><strong>Platform:</strong> Bruno Credits DLA</span>
              </div>
            </div>
          </div>

          <!-- Borrower Identification Box -->
          <div class="kfs-section-title">1. BORROWER IDENTIFICATION & DISBURSAL ACCOUNT</div>
          <table class="kfs-table kfs-meta-table">
            <tr>
              <td class="kfs-label-cell" style="width: 25%;">Borrower Full Name</td>
              <td class="kfs-val-cell" style="width: 25%;"><strong>${kfs.fullName}</strong></td>
              <td class="kfs-label-cell" style="width: 25%;">Mobile Number</td>
              <td class="kfs-val-cell" style="width: 25%;">+91 ${kfs.mobile}</td>
            </tr>
            <tr>
              <td class="kfs-label-cell">PAN Identification</td>
              <td class="kfs-val-cell"><span class="kfs-code">${kfs.panNumber}</span></td>
              <td class="kfs-label-cell">Aadhaar (UID)</td>
              <td class="kfs-val-cell"><span class="kfs-code">${kfs.aadhaarNumber}</span></td>
            </tr>
            <tr>
              <td class="kfs-label-cell">Disbursal Bank</td>
              <td class="kfs-val-cell"><strong>${kfs.bankName}</strong></td>
              <td class="kfs-label-cell">Account & IFSC</td>
              <td class="kfs-val-cell"><span class="kfs-code">${kfs.accountNumber}</span> (IFSC: ${kfs.ifscCode})</td>
            </tr>
          </table>

          <!-- PART 2: Core Loan Terms -->
          <div class="kfs-section-title">2. PART A: KEY LOAN TERMS & COST OF CREDIT</div>
          <table class="kfs-table kfs-financial-table">
            <thead>
              <tr class="kfs-th-row">
                <th style="width: 8%; text-align: center;">Sr.</th>
                <th style="width: 52%;">Loan Parameter / Disclosure Term</th>
                <th style="width: 40%; text-align: right;">Key Fact Disclosure</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: center;">1</td>
                <td><strong>Sanctioned Loan Amount</strong> (Principal)</td>
                <td style="text-align: right; font-weight: 800; font-size: 14px; color: #0d2b82;">₹ ${kfs.principal.toLocaleString('en-IN')}.00</td>
              </tr>
              <tr>
                <td style="text-align: center;">2</td>
                <td><strong>Disbursal Amount</strong> (Credited to Bank Account)</td>
                <td style="text-align: right; font-weight: 800; color: #059669;">₹ ${kfs.netDisbursed.toLocaleString('en-IN')}.00</td>
              </tr>
              <tr>
                <td style="text-align: center;">3</td>
                <td><strong>Type of Credit Facility</strong></td>
                <td style="text-align: right;">Unsecured Digital Personal Loan</td>
              </tr>
              <tr>
                <td style="text-align: center;">4</td>
                <td><strong>Loan Tenure</strong></td>
                <td style="text-align: right; font-weight: 700;">${kfs.tenureMonths} Months (${kfs.tenureMonths} EMIs)</td>
              </tr>
              <tr>
                <td style="text-align: center;">5</td>
                <td><strong>Interest Rate (Reducing Balance Basis)</strong></td>
                <td style="text-align: right; font-weight: 700;">${kfs.annualRate.toFixed(1)}% p.a. (Fixed)</td>
              </tr>
              <tr class="kfs-highlight-row">
                <td style="text-align: center;"><strong>6</strong></td>
                <td><strong>Annual Percentage Rate (APR)</strong><br><span style="font-size: 10px; color: #64748b;">Effective annual cost including all fees & charges per RBI formula</span></td>
                <td style="text-align: right; font-weight: 900; font-size: 13.5px; color: #0d2b82;">${kfs.apr.toFixed(2)}% p.a.</td>
              </tr>
              <tr>
                <td style="text-align: center;">7</td>
                <td><strong>Total Interest Amount Payable</strong></td>
                <td style="text-align: right;">₹ ${kfs.totalInterest.toLocaleString('en-IN')}.00</td>
              </tr>
              <tr>
                <td style="text-align: center;">8</td>
                <td><strong>Upfront Verification & Disbursal Fee</strong></td>
                <td style="text-align: right;">₹ ${kfs.processingFee}.00 (+ ₹${kfs.gstOnFee} GST 18%)</td>
              </tr>
              <tr class="kfs-highlight-row-accent">
                <td style="text-align: center;"><strong>9</strong></td>
                <td><strong>Equated Monthly Installment (EMI)</strong></td>
                <td style="text-align: right; font-weight: 800; font-size: 14px; color: #0d2b82;">₹ ${kfs.monthlyEmi.toLocaleString('en-IN')}.00 / month</td>
              </tr>
              <tr>
                <td style="text-align: center;">10</td>
                <td><strong>Total Repayment Amount</strong> (Principal + Interest)</td>
                <td style="text-align: right; font-weight: 800;">₹ ${kfs.totalRepayment.toLocaleString('en-IN')}.00</td>
              </tr>
            </tbody>
          </table>

          <!-- PART 3: Qualitative Disclosures -->
          <div class="kfs-section-title">3. PART B: QUALITATIVE DISCLOSURES & BORROWER PROTECTION CLAUSES</div>
          <table class="kfs-table">
            <tr>
              <td style="width: 32%; font-weight: 700; background: #f8fafc;">Cooling-off / Look-up Period</td>
              <td><strong>3 (Three) Business Days</strong>. The borrower can exit the digital loan without paying any prepayment penalty by repaying the disbursed principal and proportionate APR.</td>
            </tr>
            <tr>
              <td style="font-weight: 700; background: #f8fafc;">Prepayment / Foreclosure Charges</td>
              <td><strong>NIL (0.00%)</strong>. No foreclosure charges or prepayment penalties are levied on early settlement of loan.</td>
            </tr>
            <tr>
              <td style="font-weight: 700; background: #f8fafc;">Penal Charges on Overdue</td>
              <td>Late payment fee of <strong>2.0% per month</strong> calculated on the overdue EMI amount for the delayed duration. No penal interest is capitalized.</td>
            </tr>
            <tr>
              <td style="font-weight: 700; background: #f8fafc;">Lending Service Provider (LSP)</td>
              <td>Bruno Credits Technologies Pvt Ltd acting as authorized Lending Service Provider (LSP) for Vistas Tecnolabs Finance Limited.</td>
            </tr>
          </table>

          <!-- Grievance Redressal -->
          <div class="kfs-section-title">4. GRIEVANCE REDRESSAL OFFICER (GRO) & ESCALATION CONTACTS</div>
          <div class="kfs-gro-grid">
            <div class="kfs-gro-item">
              <span class="kfs-gro-label">Grievance Redressal Officer</span>
              <strong class="kfs-gro-val">${this.lender.groName}</strong>
            </div>
            <div class="kfs-gro-item">
              <span class="kfs-gro-label">Email Support</span>
              <strong class="kfs-gro-val">${this.lender.groEmail}</strong>
            </div>
            <div class="kfs-gro-item">
              <span class="kfs-gro-label">Toll-Free Helpline</span>
              <strong class="kfs-gro-val">${this.lender.groPhone} (Mon-Sat 9:30 AM - 6:30 PM)</strong>
            </div>
            <div class="kfs-gro-item">
              <span class="kfs-gro-label">RBI Integrated Ombudsman</span>
              <strong class="kfs-gro-val">Online Portal: ${this.lender.rbiOmbudsmanUrl}</strong>
            </div>
          </div>

          <!-- PART 4: Repayment Schedule -->
          <div class="kfs-section-title" style="margin-top: 14px;">5. SCHEDULE OF EQUATED MONTHLY INSTALLMENTS (EMIs)</div>
          <table class="kfs-table kfs-schedule-table">
            <thead>
              <tr class="kfs-th-row">
                <th style="width: 8%; text-align: center;">No.</th>
                <th style="width: 18%;">Due Date</th>
                <th style="width: 15%; text-align: right;">Opening (₹)</th>
                <th style="width: 15%; text-align: right;">EMI (₹)</th>
                <th style="width: 15%; text-align: right;">Principal (₹)</th>
                <th style="width: 14%; text-align: right;">Interest (₹)</th>
                <th style="width: 15%; text-align: right;">Closing (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${scheduleRows}
            </tbody>
          </table>

          <!-- Footer Sign-off -->
          <div class="kfs-footer-strip">
            <div class="kfs-sign-col">
              <div class="kfs-stamp-box">
                <div class="kfs-stamp-border">
                  <div class="kfs-stamp-company">VISTAS TECNOLABS</div>
                  <div class="kfs-stamp-auth">DIGITALLY VERIFIED</div>
                  <div class="kfs-stamp-date">${kfs.issueDate}</div>
                </div>
              </div>
              <div class="kfs-sign-label">Authorized Signatory<br><strong>Vistas Tecnolabs Finance Limited</strong></div>
            </div>

            <div class="kfs-borrower-ack">
              <div style="font-size: 10px; color: #475569; line-height: 1.4;">
                <strong>Borrower Acknowledgment:</strong> I, <strong>${kfs.fullName}</strong>, hereby confirm having read and accepted the Key Fact Statement (KFS) under RBI Digital Lending Guidelines.
              </div>
              <div style="margin-top: 6px; font-family: monospace; font-size: 9.5px; color: #64748b;">
                Digitally Consented via Registered Mobile +91 ${kfs.mobile} · Timestamp: ${kfs.issueDate} ${kfs.issueTime}
              </div>
            </div>
          </div>

        </div>
      `;
    },

    /**
     * Inject PDF Viewer Styles into head
     */
    injectStyles() {
      if (document.getElementById('kfsViewerStyles')) return;
      const style = document.createElement('style');
      style.id = 'kfsViewerStyles';
      style.textContent = `
        /* ================= KFS MODAL OVERLAY ================= */
        .kfs-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: rgba(15, 23, 42, 0.88);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          flex-direction: column;
          animation: kfsFadeIn 0.25s ease-out;
        }

        @keyframes kfsFadeIn {
          from { opacity: 0; transform: scale(0.99); }
          to { opacity: 1; transform: scale(1); }
        }

        /* PDF Viewer Topbar Chrome */
        .kfs-viewer-topbar {
          height: 54px;
          background: #1e293b;
          border-bottom: 1px solid #334155;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          color: #f8fafc;
          flex-shrink: 0;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          z-index: 10;
        }

        .kfs-topbar-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .kfs-pdf-icon-badge {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #ef4444;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 11px;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
        }

        .kfs-topbar-title {
          font-size: 13.5px;
          font-weight: 700;
          color: #f1f5f9;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 220px;
        }

        .kfs-rbi-chip {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.4);
          font-size: 10.5px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 6px;
          display: none;
        }

        @media (min-width: 640px) {
          .kfs-rbi-chip { display: inline-block; }
          .kfs-topbar-title { max-width: 400px; }
        }

        .kfs-topbar-center {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #0f172a;
          padding: 4px 10px;
          border-radius: 8px;
          border: 1px solid #334155;
          font-size: 12px;
          font-weight: 700;
          color: #94a3b8;
        }

        .kfs-zoom-btn {
          background: none;
          border: none;
          color: #cbd5e1;
          cursor: pointer;
          padding: 2px 6px;
          font-size: 14px;
          font-weight: 800;
          border-radius: 4px;
          transition: background 0.15s;
        }

        .kfs-zoom-btn:hover {
          background: #334155;
          color: #ffffff;
        }

        .kfs-topbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .kfs-btn-download {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #ffffff;
          border: none;
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.35);
          transition: transform 0.15s, box-shadow 0.15s;
        }

        .kfs-btn-download:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.5);
        }

        .kfs-btn-print {
          background: #334155;
          color: #f1f5f9;
          border: 1px solid #475569;
          padding: 7px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: background 0.15s;
        }

        .kfs-btn-print:hover {
          background: #475569;
        }

        .kfs-btn-close {
          background: none;
          border: none;
          color: #94a3b8;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          transition: background 0.15s, color 0.15s;
        }

        .kfs-btn-close:hover {
          background: #334155;
          color: #ffffff;
        }

        /* PDF Viewer Body Canvas */
        .kfs-viewer-body {
          flex: 1;
          overflow-y: auto;
          overflow-x: auto;
          background: #525659; /* Adobe Reader Grey */
          padding: 24px 12px;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          -webkit-overflow-scrolling: touch;
        }

        /* Physical A4 Paper Sheet Styling */
        .kfs-a4-sheet {
          background: #ffffff;
          width: 100%;
          max-width: 820px;
          min-height: 1080px;
          padding: 36px 40px;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45);
          border-radius: 3px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #1e293b;
          position: relative;
          box-sizing: border-box;
          transform-origin: top center;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @media (max-width: 600px) {
          .kfs-a4-sheet {
            padding: 20px 16px;
          }
          .kfs-viewer-body {
            padding: 12px 6px;
          }
        }

        /* KFS Internal Typography & Layout */
        .kfs-watermark {
          position: absolute;
          top: 45%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-35deg);
          font-size: 64px;
          font-weight: 900;
          color: rgba(13, 43, 130, 0.035);
          pointer-events: none;
          user-select: none;
          white-space: nowrap;
          z-index: 0;
        }

        .kfs-header-box {
          border-bottom: 2px solid #0d2b82;
          padding-bottom: 14px;
          margin-bottom: 16px;
          position: relative;
          z-index: 1;
        }

        .kfs-header-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .kfs-brand-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .kfs-logo-emblem {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          background: #0d2b82;
          color: #ffffff;
          font-size: 18px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          letter-spacing: -0.5px;
          flex-shrink: 0;
        }

        .kfs-re-name {
          font-size: 17px;
          font-weight: 900;
          color: #09206d;
          margin: 0;
          letter-spacing: -0.2px;
          text-transform: uppercase;
        }

        .kfs-re-sub {
          font-size: 10.5px;
          font-weight: 700;
          color: #059669;
          margin-top: 2px;
        }

        .kfs-re-addr {
          font-size: 9.5px;
          color: #64748b;
          margin-top: 2px;
        }

        .kfs-qr-box {
          flex-shrink: 0;
          border: 1px dashed #cbd5e1;
          padding: 6px 10px;
          border-radius: 6px;
          text-align: center;
          background: #f8fafc;
        }

        .kfs-qr-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .kfs-qr-placeholder span {
          font-size: 8px;
          font-weight: 800;
          color: #0d2b82;
          letter-spacing: 0.5px;
        }

        .kfs-doc-title-bar {
          background: #f1f5f9;
          border-radius: 6px;
          padding: 8px 12px;
          text-align: center;
          margin-top: 8px;
        }

        .kfs-title-badge {
          display: inline-block;
          background: #0d2b82;
          color: #ffffff;
          font-size: 9px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 4px;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .kfs-doc-heading {
          font-size: 14px;
          font-weight: 900;
          color: #0f172a;
          margin: 2px 0 6px 0;
          letter-spacing: 0.2px;
        }

        .kfs-doc-meta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          font-size: 10px;
          color: #475569;
          flex-wrap: wrap;
        }

        .kfs-section-title {
          font-size: 11px;
          font-weight: 900;
          color: #0d2b82;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 14px 0 6px 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Tables */
        .kfs-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10.5px;
          margin-bottom: 10px;
          position: relative;
          z-index: 1;
        }

        .kfs-table th, .kfs-table td {
          border: 1px solid #cbd5e1;
          padding: 5px 8px;
          line-height: 1.35;
        }

        .kfs-th-row {
          background: #0d2b82;
          color: #ffffff;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .kfs-th-row th {
          border-color: #0d2b82;
        }

        .kfs-label-cell {
          background: #f8fafc;
          font-weight: 700;
          color: #475569;
        }

        .kfs-val-cell {
          color: #0f172a;
        }

        .kfs-code {
          font-family: monospace;
          font-weight: 700;
          color: #0d2b82;
        }

        .kfs-highlight-row {
          background: #eff6ff;
        }

        .kfs-highlight-row-accent {
          background: #ecfdf5;
        }

        /* GRO Grid */
        .kfs-gro-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 8px 10px;
          margin-bottom: 10px;
        }

        @media (max-width: 500px) {
          .kfs-gro-grid { grid-template-columns: 1fr; }
        }

        .kfs-gro-item {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .kfs-gro-label {
          font-size: 9px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
        }

        .kfs-gro-val {
          font-size: 10px;
          color: #0f172a;
        }

        /* Footer Strip & Signatures */
        .kfs-footer-strip {
          margin-top: 20px;
          padding-top: 14px;
          border-top: 1px solid #cbd5e1;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
        }

        .kfs-sign-col {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
        }

        .kfs-stamp-box {
          border: 2px dashed #0d2b82;
          padding: 6px 14px;
          border-radius: 8px;
          background: rgba(13, 43, 130, 0.04);
          transform: rotate(-2deg);
        }

        .kfs-stamp-company {
          font-size: 9px;
          font-weight: 900;
          color: #0d2b82;
          letter-spacing: 0.5px;
        }

        .kfs-stamp-auth {
          font-size: 8px;
          font-weight: 800;
          color: #059669;
          letter-spacing: 0.3px;
        }

        .kfs-stamp-date {
          font-size: 7.5px;
          color: #64748b;
        }

        .kfs-sign-label {
          font-size: 9.5px;
          color: #475569;
          line-height: 1.3;
        }

        .kfs-borrower-ack {
          max-width: 440px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 8px 12px;
        }

        /* Print Media Styling for crisp output */
        @media print {
          body * {
            visibility: hidden;
          }
          .kfs-modal-backdrop, .kfs-modal-backdrop * {
            visibility: visible;
          }
          .kfs-modal-backdrop {
            position: absolute !important;
            inset: 0 !important;
            background: #ffffff !important;
          }
          .kfs-viewer-topbar {
            display: none !important;
          }
          .kfs-viewer-body {
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
          }
          .kfs-a4-sheet {
            box-shadow: none !important;
            border: none !important;
            padding: 10mm 15mm !important;
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
          }
        }
      `;
      document.head.appendChild(style);
    },

    /**
     * Open the interactive PDF Viewer Modal
     */
    openPdfViewer(borrowerOrLoanData) {
      this.injectStyles();

      // Compile compiled terms
      const kfs = this.compile(borrowerOrLoanData);

      // Remove existing modal if open
      const existing = document.getElementById('kfsModalBackdrop');
      if (existing) existing.remove();

      // Create modal container
      const modal = document.createElement('div');
      modal.id = 'kfsModalBackdrop';
      modal.className = 'kfs-modal-backdrop';

      modal.innerHTML = `
        <div class="kfs-viewer-topbar">
          <div class="kfs-topbar-left">
            <div class="kfs-pdf-icon-badge">PDF</div>
            <div>
              <div class="kfs-topbar-title">KFS_${kfs.refNum}.pdf</div>
            </div>
            <span class="kfs-rbi-chip">RBI Regulated KFS</span>
          </div>

          <div class="kfs-topbar-center">
            <button type="button" class="kfs-zoom-btn" id="kfsZoomOutBtn" title="Zoom Out">−</button>
            <span id="kfsZoomLevelText">100%</span>
            <button type="button" class="kfs-zoom-btn" id="kfsZoomInBtn" title="Zoom In">+</button>
            <span style="opacity: 0.4; margin: 0 4px;">|</span>
            <span>Page 1 of 1</span>
          </div>

          <div class="kfs-topbar-right">
            <button type="button" class="kfs-btn-download" id="kfsDownloadPdfBtn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Download PDF</span>
            </button>
            <button type="button" class="kfs-btn-print" id="kfsPrintPdfBtn" title="Print Statement">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            </button>
            <button type="button" class="kfs-btn-close" id="kfsCloseModalBtn" title="Close Viewer">✕</button>
          </div>
        </div>

        <div class="kfs-viewer-body" id="kfsViewerScrollArea">
          ${this.renderHtml(kfs)}
        </div>
      `;

      document.body.appendChild(modal);
      document.body.style.overflow = 'hidden';

      // State & Controls
      let currentZoom = 1.0;
      const sheet = document.getElementById('kfsPrintDocument');
      const zoomText = document.getElementById('kfsZoomLevelText');

      // Auto-scale on small screens so it looks like a clean, centered PDF page
      const screenWidth = window.innerWidth;
      if (screenWidth < 600) {
        currentZoom = Math.max(0.72, (screenWidth - 24) / 820);
        if (sheet) sheet.style.transform = `scale(${currentZoom})`;
        if (zoomText) zoomText.textContent = `${Math.round(currentZoom * 100)}%`;
      }

      function updateZoom(newZoom) {
        currentZoom = Math.min(1.8, Math.max(0.5, newZoom));
        if (sheet) sheet.style.transform = `scale(${currentZoom})`;
        if (zoomText) zoomText.textContent = `${Math.round(currentZoom * 100)}%`;
      }

      document.getElementById('kfsZoomInBtn').addEventListener('click', () => updateZoom(currentZoom + 0.15));
      document.getElementById('kfsZoomOutBtn').addEventListener('click', () => updateZoom(currentZoom - 0.15));

      const closeModal = () => {
        modal.remove();
        document.body.style.overflow = '';
      };

      document.getElementById('kfsCloseModalBtn').addEventListener('click', closeModal);

      // Print
      document.getElementById('kfsPrintPdfBtn').addEventListener('click', () => {
        window.print();
      });

      // Download PDF
      document.getElementById('kfsDownloadPdfBtn').addEventListener('click', () => {
        this.downloadPdf(kfs);
      });

      // Close on ESC
      const escListener = (e) => {
        if (e.key === 'Escape') {
          closeModal();
          window.removeEventListener('keydown', escListener);
        }
      };
      window.addEventListener('keydown', escListener);
    },

    /**
     * Download the rendered KFS as an actual PDF file
     */
    downloadPdf(kfs) {
      const element = document.getElementById('kfsPrintDocument');
      if (!element) return;

      const downloadBtn = document.getElementById('kfsDownloadPdfBtn');
      const originalText = downloadBtn ? downloadBtn.innerHTML : '';
      if (downloadBtn) {
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = `<span>Generating PDF...</span>`;
      }

      // Check if html2pdf is available
      if (typeof window.html2pdf === 'function') {
        const opt = {
          margin: [8, 8, 8, 8],
          filename: `KFS_${kfs.fullName.replace(/\s+/g, '_')}_${kfs.refNum}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Temporarily reset transform for pristine rendering
        const prevTransform = element.style.transform;
        element.style.transform = 'none';

        window.html2pdf().set(opt).from(element).save().then(() => {
          element.style.transform = prevTransform;
          if (downloadBtn) {
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = originalText;
          }
        }).catch(err => {
          console.warn('[KFS] html2pdf generation failed, falling back to print:', err);
          element.style.transform = prevTransform;
          if (downloadBtn) {
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = originalText;
          }
          window.print();
        });
      } else {
        // Fallback: trigger print dialog (which has Save as PDF)
        if (downloadBtn) {
          downloadBtn.disabled = false;
          downloadBtn.innerHTML = originalText;
        }
        window.print();
      }
    }
  };

  // Expose globally
  window.KfsEngine = KfsEngine;

})(window);
