/**
 * CHERNOBYL VR — Escape Room Landing Page
 * Versión: 1.0
 * Autor: Virtua Barcelona
 * Dependencias: GSAP 3.12.2 + ScrollTrigger
 */

(function() {
  'use strict';

  try {

  /* ============================================================
     INTRO BOOT SEQUENCE
     ============================================================ */
  const intro = document.getElementById('chIntro');
  const lines = ['chLine1', 'chLine2', 'chLine3', 'chDosimeter', 'chLine4'];
  const dosimeterFill = document.getElementById('chDosimeterFill');
  const result = document.getElementById('chResult');

  let delay = 300;
  lines.forEach((id, i) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.classList.add('ch-visible');

      // Start dosimeter fill after dosimeter line appears
      if (id === 'chDosimeter') {
        setTimeout(() => {
          dosimeterFill.style.width = '75%';
          dosimeterFill.style.background = 'var(--ch-green)';
        }, 200);
      }

      // Show result after last line
      if (id === 'chLine4') {
        setTimeout(() => {
          result.classList.add('ch-visible');
          // Dismiss intro
          setTimeout(() => {
            intro.classList.add('ch-intro--done');
            document.body.style.overflow = '';
            initAnimations();
          }, 1200);
        }, 500);
      }
    }, delay);
    delay += id === 'chDosimeter' ? 900 : 600;
  });

  // Block scroll during intro
  document.body.style.overflow = 'hidden';

  /* ============================================================
     ASH / EMBER PARTICLES
     ============================================================ */
  const canvas = document.getElementById('chParticles');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animFrame;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * canvas.width;
      this.y = -10;
      this.size = Math.random() * 2.5 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.8;
      this.speedY = Math.random() * 1.2 + 0.3;
      this.opacity = Math.random() * 0.5 + 0.1;
      // Mix of grey ash and orange embers
      const isEmber = Math.random() > 0.7;
      this.color = isEmber
        ? `rgba(255, ${120 + Math.floor(Math.random() * 80)}, 20, ${this.opacity})`
        : `rgba(180, 180, 180, ${this.opacity * 0.6})`;
      this.drift = Math.random() * 0.02;
      this.angle = Math.random() * Math.PI * 2;
    }

    update() {
      this.x += this.speedX + Math.sin(this.angle) * 0.3;
      this.y += this.speedY;
      this.angle += this.drift;
      this.opacity -= 0.001;

      if (this.y > canvas.height + 10 || this.opacity <= 0) {
        this.reset();
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }

  function initParticles() {
    resizeCanvas();
    const count = window.innerWidth < 768 ? 25 : 50;
    particles = [];
    for (let i = 0; i < count; i++) {
      const p = new Particle();
      p.y = Math.random() * canvas.height;
      particles.push(p);
    }
    animateParticles();
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    animFrame = requestAnimationFrame(animateParticles);
  }

  window.addEventListener('resize', resizeCanvas);
  initParticles();

  /* ============================================================
     GSAP ANIMATIONS (called after intro)
     ============================================================ */
  function initAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    // -- Data Cards entrance --
    gsap.utils.toArray('.ch-data-card').forEach((card, i) => {
      gsap.to(card, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        delay: i * 0.15,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          once: true
        }
      });
    });

    // -- Declassified Files entrance --
    gsap.utils.toArray('.ch-file').forEach((file, i) => {
      gsap.to(file, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: file,
          start: 'top 80%',
          once: true
        }
      });
    });

    // -- Redacted text reveal --
    gsap.utils.toArray('[data-reveal]').forEach(el => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 75%',
        once: true,
        onEnter: () => el.classList.add('ch-revealed')
      });
    });

    // -- Radiation Progress Bar --
    const radBar = document.getElementById('chRadiation');
    const radIcon = document.getElementById('chRadiationIcon');
    const radFill = document.getElementById('chRadiationFill');

    if (radBar && radFill) {
      // Show after intro
      setTimeout(() => {
        radBar.classList.add('ch-active');
        radIcon.classList.add('ch-active');
      }, 500);

      ScrollTrigger.create({
        trigger: '#chernobyl-app',
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          const pct = self.progress * 100;
          radFill.style.height = pct + '%';

          if (pct < 40) {
            radFill.style.background = 'var(--ch-green)';
          } else if (pct < 70) {
            radFill.style.background = 'var(--ch-amber)';
          } else {
            radFill.style.background = 'var(--ch-red)';
          }
        }
      });
    }

    // -- Sticky CTA --
    const stickyCta = document.getElementById('chStickyCta');
    const footer = document.querySelector('footer, .site-below-footer-wrap, .ch-auth');
    let stickyShown = false;

    ScrollTrigger.create({
      trigger: '#chFiles',
      start: 'top 60%',
      onEnter: () => {
        if (!stickyShown) {
          stickyCta.classList.add('ch-visible');
          stickyShown = true;
        }
      }
    });

    // Hide near CTA section / footer
    if (footer) {
      ScrollTrigger.create({
        trigger: '#chAuth',
        start: 'top 90%',
        onEnter: () => stickyCta.classList.add('ch-hidden'),
        onLeaveBack: () => stickyCta.classList.remove('ch-hidden')
      });
    }

    // -- CTA click effect --
    const authBtn = document.getElementById('chAuthBtn');
    if (authBtn) {
      authBtn.addEventListener('click', (e) => {
        // Red flash
        const flash = document.createElement('div');
        flash.style.cssText = `
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(255, 45, 45, 0.15); z-index: 9999;
          pointer-events: none; animation: ch-flash 0.6s ease forwards;
        `;
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 700);
      });
    }
  }

  // Flash animation
  const flashStyle = document.createElement('style');
  flashStyle.textContent = `
    @keyframes ch-flash {
      0% { opacity: 1; }
      100% { opacity: 0; }
    }
  `;
  document.head.appendChild(flashStyle);

  /* ============================================================
     GEIGER COUNTER — Subtle audio on scroll
     ============================================================ */
  let geigerEnabled = false;
  let audioCtx = null;

  function initGeiger() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      geigerEnabled = true;
    } catch(e) {
      geigerEnabled = false;
    }
  }

  function geigerClick() {
    if (!geigerEnabled || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = 800 + Math.random() * 400;
      osc.type = 'square';
      gain.gain.value = 0.015; // Very subtle
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.008);
    } catch(e) {}
  }

  // Activate geiger on first interaction
  document.addEventListener('click', function enableGeiger() {
    initGeiger();
    document.removeEventListener('click', enableGeiger);

    // Random clicks based on scroll
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const now = Date.now();
      if (now - lastScroll > 300 && Math.random() > 0.6) {
        geigerClick();
        lastScroll = now;
      }
    });
  }, { once: true });

  } catch(err) {
    console.error('[Chernobyl] Init error:', err);
  }

})();
