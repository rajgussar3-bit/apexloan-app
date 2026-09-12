/* ========================================
   ApexLoan - Landing Page JavaScript
   Navbar, Mobile Menu & Scroll Animations
   (EMI Calculator moved to apply page)
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ---- Navbar scroll effect ----
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  // ---- Mobile Menu ----
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const menuClose = document.getElementById('menuClose');

  menuBtn.addEventListener('click', () => {
    mobileMenu.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  menuClose.addEventListener('click', closeMobileMenu);

  window.closeMobileMenu = function() {
    mobileMenu.classList.remove('active');
    document.body.style.overflow = '';
  };

  // Close mobile menu on link click
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      setTimeout(closeMobileMenu, 100);
    });
  });

  // ---- Smooth reveal on scroll ----
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  document.querySelectorAll('.feature-card, .eligibility-item, .calc-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

  // ---- Persistent Login & Approved Limit Detection ----
  if (localStorage.getItem('apexloan_logged_in') === 'true') {
    let activeLoan = null;
    try {
      activeLoan = JSON.parse(localStorage.getItem('apexloan_active_loan') || localStorage.getItem('apexloan_sanctioned_offer') || 'null');
    } catch (e) {}

    document.querySelectorAll('a[href="login.html"]').forEach(btn => {
      btn.href = 'dashboard.html';
      if (btn.classList.contains('nav-cta')) {
        btn.textContent = 'Dashboard →';
      } else if (btn.classList.contains('btn-success') || btn.classList.contains('btn-primary')) {
        if (activeLoan && activeLoan.status === 'DISBURSED') {
          btn.innerHTML = `Active Loan: ₹${activeLoan.creditLimit.toLocaleString('en-IN')} (View Schedule) →`;
        } else if (activeLoan && activeLoan.approved) {
          btn.innerHTML = `Approved Limit: ₹${activeLoan.creditLimit.toLocaleString('en-IN')} (Claim) →`;
        } else {
          btn.textContent = 'Go to Dashboard →';
        }
      }
    });

    if (activeLoan && activeLoan.approved) {
      const heroHighlight = document.querySelector('.hero h1 .highlight');
      if (heroHighlight) {
        if (activeLoan.status === 'DISBURSED') {
          heroHighlight.innerHTML = `Active Loan: ₹${activeLoan.creditLimit.toLocaleString('en-IN')}`;
        } else {
          heroHighlight.innerHTML = `Approved Limit: ₹${activeLoan.creditLimit.toLocaleString('en-IN')}`;
        }
      }
      const heroBadge = document.querySelector('.hero-badge');
      if (heroBadge) {
        heroBadge.innerHTML = `<span class="dot"></span> Approved by Vistas Tecnolabs Finance Limited`;
      }
    }
  }

});
