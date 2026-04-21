/**
 * S.O.S. SANTA — Christmas VR Landing Page
 * Version: 1.0
 * Author: Virtua Barcelona
 * Dependencies: None (vanilla JS)
 */

(function() {
  'use strict';

  try {

  /* ============================================================
     SNOWFALL GENERATOR
     ============================================================ */
  const snowContainer = document.getElementById('xmas-snow');
  if (snowContainer && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const flakeCount = 35;
    for (let i = 0; i < flakeCount; i++) {
      const flake = document.createElement('div');
      flake.className = 'xmas-snowflake';
      const size = Math.random() * 4 + 2;
      const left = Math.random() * 100;
      const duration = Math.random() * 12 + 8;
      const delay = Math.random() * 15;
      const drift = (Math.random() - 0.5) * 80;
      const opacity = Math.random() * 0.5 + 0.2;

      flake.style.cssText = `
        left: ${left}%;
        width: ${size}px;
        height: ${size}px;
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
        --xmas-drift: ${drift}px;
        opacity: ${opacity};
      `;
      snowContainer.appendChild(flake);
    }
  }

  /* ============================================================
     INTRO OVERLAY — "Carta de socorro"
     ============================================================ */
  const intro = document.getElementById('xmas-intro');
  if (intro) {
    const lines = intro.querySelectorAll('.xmas-intro-line');
    const bar = intro.querySelector('.xmas-intro-bar');
    const fill = document.getElementById('xmas-intro-fill');
    const result = document.getElementById('xmas-intro-result');

    let delay = 300;
    lines.forEach((line, i) => {
      setTimeout(() => line.classList.add('xmas-visible'), delay);
      delay += 400;
    });

    setTimeout(() => {
      bar.classList.add('xmas-visible');
      setTimeout(() => { fill.style.width = '100%'; }, 100);
    }, delay);

    setTimeout(() => {
      result.classList.add('xmas-visible');
    }, delay + 1600);

    setTimeout(() => {
      intro.classList.add('xmas-done');
    }, delay + 2800);
  }

  /* ============================================================
     SCROLL REVEAL — IntersectionObserver
     ============================================================ */
  const revealElements = document.querySelectorAll('.xmas-reveal, .xmas-data-card');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('xmas-visible');
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  revealElements.forEach(el => {
    const delayClass = ['xmas-reveal-delay-1','xmas-reveal-delay-2','xmas-reveal-delay-3','xmas-reveal-delay-4'];
    const delays = ['0.1s','0.2s','0.3s','0.4s'];
    let d = '0s';
    delayClass.forEach((cls, i) => { if (el.classList.contains(cls)) d = delays[i]; });
    el.style.transition = `opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${d}, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${d}`;
    revealObserver.observe(el);
  });

  /* ============================================================
     MAGNETIC HOVER — Benefit cards
     ============================================================ */
  document.querySelectorAll('.xmas-benefit-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      card.style.transform = `perspective(600px) rotateY(${x * 0.02}deg) rotateX(${-y * 0.02}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(600px) rotateY(0) rotateX(0) translateY(0)';
      card.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), border-color 0.3s, box-shadow 0.3s';
    });
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'border-color 0.3s, box-shadow 0.3s';
    });
  });

  /* ============================================================
     STICKY CTA BAR
     ============================================================ */
  const stickyBar = document.getElementById('xmas-sticky');
  const mainCta = document.getElementById('xmas-main-cta');
  let footerEl = null;

  const possibleFooters = document.querySelectorAll('footer, .elementor-location-footer, .site-footer, .site-below-footer-wrap');
  if (possibleFooters.length > 0) footerEl = possibleFooters[possibleFooters.length - 1];

  if (stickyBar && mainCta) {
    const stickyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) {
          stickyBar.classList.add('xmas-active');
        } else {
          stickyBar.classList.remove('xmas-active');
        }
      });
    }, { threshold: 0 });

    stickyObserver.observe(mainCta);

    if (footerEl) {
      const footerObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            stickyBar.classList.remove('xmas-active');
          }
        });
      }, { threshold: 0.1 });
      footerObserver.observe(footerEl);
    }
  }

  } catch(err) {
    console.error('[S.O.S. Santa] Init error:', err);
  }

})();
