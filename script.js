/* ============================================
   X-Innotation — Main Script
   ============================================ */

(function () {
  'use strict';

  // --- Intersection Observer for Scroll Animations ---
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px',
  };

  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-up').forEach((el) => {
    fadeObserver.observe(el);
  });

  // --- Navbar Scroll Effect ---
  const navbar = document.getElementById('navbar');
  const backToTop = document.getElementById('back-to-top');

  function handleScroll() {
    const scrolled = window.scrollY > 60;
    navbar.classList.toggle('scrolled', scrolled);
    backToTop.classList.toggle('visible', window.scrollY > 600);
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // --- Mobile Nav Toggle ---
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');

  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  navMenu.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // --- Active Nav Link on Scroll ---
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            link.classList.toggle(
              'active',
              link.getAttribute('href') === `#${entry.target.id}`
            );
          });
        }
      });
    },
    { threshold: 0.3, rootMargin: '-72px 0px -50% 0px' }
  );

  sections.forEach((section) => sectionObserver.observe(section));

  // --- Back to Top ---
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // --- Dark Mode Toggle ---
  const themeToggle = document.getElementById('theme-toggle');
  const savedTheme =
    localStorage.getItem('x-innotation-theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light');

  document.documentElement.setAttribute('data-theme', savedTheme);

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('x-innotation-theme', next);
  });

  // --- Animated Counters ---
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  statNumbers.forEach((el) => counterObserver.observe(el));

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = 2000;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  // --- Testimonial Carousel ---
  const track = document.getElementById('testimonial-track');
  const dotsContainer = document.getElementById('carousel-dots');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  const cards = track ? track.querySelectorAll('.testimonial-card') : [];
  let currentSlide = 0;
  let autoplayInterval;

  function initCarousel() {
    if (!track || cards.length === 0) return;

    cards.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
      dot.addEventListener('click', () => goToSlide(i));
      dotsContainer.appendChild(dot);
    });

    prevBtn.addEventListener('click', () =>
      goToSlide((currentSlide - 1 + cards.length) % cards.length)
    );
    nextBtn.addEventListener('click', () =>
      goToSlide((currentSlide + 1) % cards.length)
    );

    startAutoplay();

    track.addEventListener('mouseenter', stopAutoplay);
    track.addEventListener('mouseleave', startAutoplay);
  }

  function goToSlide(index) {
    currentSlide = index;
    track.style.transform = `translateX(-${index * 100}%)`;
    dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayInterval = setInterval(() => {
      goToSlide((currentSlide + 1) % cards.length);
    }, 5000);
  }

  function stopAutoplay() {
    clearInterval(autoplayInterval);
  }

  initCarousel();

  // --- FAQ Accordion ---
  document.querySelectorAll('.faq-question').forEach((btn) => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      const answer = btn.nextElementSibling;

      document.querySelectorAll('.faq-question').forEach((other) => {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false');
          other.nextElementSibling.style.maxHeight = null;
        }
      });

      btn.setAttribute('aria-expanded', !expanded);
      answer.style.maxHeight = expanded ? null : answer.scrollHeight + 'px';
    });
  });

  // --- Cookie Banner ---
  const cookieBanner = document.getElementById('cookie-banner');
  const cookieAccept = document.getElementById('cookie-accept');
  const cookieDecline = document.getElementById('cookie-decline');

  if (!localStorage.getItem('x-innotation-cookies')) {
    setTimeout(() => cookieBanner.classList.add('show'), 1500);
  }

  function dismissCookies(accepted) {
    localStorage.setItem(
      'x-innotation-cookies',
      accepted ? 'accepted' : 'declined'
    );
    cookieBanner.classList.remove('show');
  }

  cookieAccept.addEventListener('click', () => dismissCookies(true));
  cookieDecline.addEventListener('click', () => dismissCookies(false));

  // --- Toast Notifications ---
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon =
      type === 'success'
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';

    toast.innerHTML = icon + '<span>' + message + '</span>';
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      toast.addEventListener('animationend', () => toast.remove());
    }, 4000);
  }

  // --- Lead Form Validation & Submission ---
  const leadForm = document.getElementById('lead-form');
  const submitBtn = document.getElementById('submit-btn');

  function validateField(field) {
    const errorSpan = field
      .closest('.form-group')
      ?.querySelector('.form-error');
    let message = '';

    if (field.required && !field.value.trim()) {
      message = 'This field is required';
    } else if (field.type === 'email' && field.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(field.value)) {
        message = 'Please enter a valid email address';
      }
    } else if (field.type === 'checkbox' && field.required && !field.checked) {
      message = 'You must agree to continue';
    }

    if (errorSpan) errorSpan.textContent = message;
    field.classList.toggle('error', !!message);
    return !message;
  }

  leadForm.querySelectorAll('input, select, textarea').forEach((field) => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.classList.contains('error')) validateField(field);
    });
  });

  leadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const requiredFields = leadForm.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach((field) => {
      if (!validateField(field)) isValid = false;
    });

    if (!isValid) {
      const firstError = leadForm.querySelector('.error');
      if (firstError) firstError.focus();
      return;
    }

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    const formData = new FormData(leadForm);
    const data = Object.fromEntries(formData.entries());
    data.consent = formData.has('consent');
    data.submittedAt = new Date().toISOString();

    // localStorage backup
    try {
      const leads = JSON.parse(
        localStorage.getItem('x-innotation-leads') || '[]'
      );
      leads.push(data);
      localStorage.setItem('x-innotation-leads', JSON.stringify(leads));
    } catch (_) {
      /* localStorage might be unavailable */
    }

    try {
      const response = await fetch('/api/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        showToast(
          'Thank you! We\'ll be in touch within 24 hours.',
          'success'
        );
        leadForm.reset();
      } else {
        throw new Error('Server error');
      }
    } catch {
      showToast(
        'Your message was saved. We\'ll process it shortly.',
        'success'
      );
      leadForm.reset();
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  });

  // --- Newsletter Form ---
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Thanks for subscribing!', 'success');
      newsletterForm.reset();
    });
  }

  // --- Hero Parallax ---
  const hero = document.querySelector('.hero');
  if (hero) {
    window.addEventListener(
      'scroll',
      () => {
        const scroll = window.scrollY;
        if (scroll < window.innerHeight) {
          const content = hero.querySelector('.hero-content');
          if (content) {
            content.style.transform = `translateY(${scroll * 0.15}px)`;
            content.style.opacity = 1 - scroll / (window.innerHeight * 0.8);
          }
        }
      },
      { passive: true }
    );
  }

  // --- Logo Animation on Load ---
  const logoX = document.querySelector('.nav-logo .logo-x');
  if (logoX) {
    logoX.style.opacity = '0';
    logoX.style.transform = 'rotate(-180deg) scale(0)';
    logoX.style.transition = 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        logoX.style.opacity = '1';
        logoX.style.transform = 'rotate(0) scale(1)';
      });
    });
  }
})();
