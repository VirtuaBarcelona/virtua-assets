/* ================================================================
   JUNGLE QUEST — v2.0 · Virtua Barcelona · Abril 2026
   Scrollytelling completo: portales, Lenis, grain, aurora, skew
   ================================================================ */
'use strict';

const JQ = {
  BASE: 'https://virtuabarcelona.com/wp-content/uploads/2026/04/',
  audio: { ambient: null, chime: null, whoosh: null, discovery: null },
  audioEnabled: false,
  bootDone:     false,
  hudState:     { blue: false, green: false, purple: false, gold: false },
  lenis:        null,
};

/* ================================================================
   BOOT
   ================================================================ */
function jqInit() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', jqBoot);
  } else {
    jqBoot();
  }
}

function jqBoot() {
  document.body.style.overflow = 'hidden';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    JQ.reducedMotion = true;
  }

  initCursor();
  initNav();
  initParticles();
  initFilmGrain();
  initAudio();
  syncFooter();
  initStickyBtn();
  initWhatsApp();
  initBootGate();

  window.addEventListener('resize', () => {
    syncFooter();
    if (JQ.lenis) JQ.lenis.resize();
  });
  window.addEventListener('load', syncFooter);

  document.addEventListener('jq:booted', () => {
    initLenis();
    initHeroScrollytelling();
    initPortalReveals();
    initScrollAnimations();
    initScrollSkew();
    initCardGlow();
    initCrystalHUD();
    initSectionAccents();
    initGalleryPortalSequence();
    initMagneticElements();
    initFooterReveal();
  });
}

/* ================================================================
   LENIS — smooth scroll
   ================================================================ */
function initLenis() {
  if (typeof Lenis === 'undefined') return;
  JQ.lenis = new Lenis({
    lerp:         0.085,
    smoothWheel:  true,
    smoothTouch:  false,
    overscroll:   false,
    prevent: node => !!node.closest('#jq-menu-overlay'),
  });
  JQ.lenis.on('scroll', () => {
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.update();
  });
  gsap.ticker.add(time => JQ.lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ================================================================
   CURSOR
   ================================================================ */
function initCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  const dot  = document.getElementById('jq-cursor-dot');
  const ring = document.getElementById('jq-cursor-ring');
  if (!dot || !ring) return;

  const xDot  = gsap.quickTo(dot,  'x', { duration: 0.08, ease: 'none' });
  const yDot  = gsap.quickTo(dot,  'y', { duration: 0.08, ease: 'none' });
  const xRing = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power3' });
  const yRing = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power3' });

  window.addEventListener('mousemove', e => {
    xDot(e.clientX); yDot(e.clientY);
    xRing(e.clientX); yRing(e.clientY);
  });

  document.addEventListener('mouseover', e => {
    if (e.target.closest('a, button, [data-hover]'))
      document.body.classList.add('jq-cursor-hover');
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest('a, button, [data-hover]'))
      document.body.classList.remove('jq-cursor-hover');
  });
}

/* ================================================================
   NAV
   ================================================================ */
function initNav() {
  const btn     = document.getElementById('jq-menu-btn');
  const overlay = document.getElementById('jq-menu-overlay');
  if (!btn || !overlay) return;

  btn.addEventListener('click', () => {
    if (!JQ.bootDone) return;
    const open = overlay.classList.toggle('open');
    btn.classList.toggle('open', open);
    overlay.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (JQ.lenis) open ? JQ.lenis.stop() : JQ.lenis.start();
  });

  overlay.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      overlay.classList.remove('open');
      btn.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (JQ.lenis) JQ.lenis.start();
    });
  });
}

/* ================================================================
   FILM GRAIN — canvas noise overlay
   ================================================================ */
function initFilmGrain() {
  const canvas = document.getElementById('jq-grain');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = 300; canvas.height = 300;

  (function drawGrain() {
    const img = ctx.createImageData(300, 300);
    const d   = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      d[i] = d[i+1] = d[i+2] = v;
      d[i+3] = 13;
    }
    ctx.putImageData(img, 0, 0);
    setTimeout(() => requestAnimationFrame(drawGrain), 55);
  })();
}

/* ================================================================
   BOOT GATE
   ================================================================ */
function initBootGate() {
  const gate = document.getElementById('jq-boot-gate');
  const btn  = document.getElementById('jq-boot-btn');
  if (!gate || !btn) return;

  gsap.from('.jq-boot-portal-img', {
    opacity: 0, scale: 0.8, rotation: -15,
    duration: 2.2, delay: 0.3, ease: 'power2.out',
  });
  gsap.from('#jq-boot-content > *', {
    opacity: 0, y: 36, duration: 1.2,
    stagger: 0.18, delay: 0.7, ease: 'power3.out',
  });

  btn.addEventListener('click', dismissBootGate);
}

function dismissBootGate() {
  const gate = document.getElementById('jq-boot-gate');
  const wipe = document.getElementById('jq-portal-wipe');
  startAmbient();

  const tl = gsap.timeline({
    onComplete: () => {
      gate.style.display  = 'none';
      if (wipe) wipe.style.display = 'none';
      document.body.style.overflow = '';
      JQ.bootDone = true;
      document.dispatchEvent(new Event('jq:booted'));
    }
  });

  tl.to('#jq-boot-content', { opacity: 0, scale: 0.95, duration: 0.35, ease: 'power2.in' });

  if (wipe) {
    wipe.style.display = 'block';
    tl.fromTo(wipe,
      { clipPath: 'circle(0% at 50% 50%)' },
      { clipPath: 'circle(160% at 50% 50%)', duration: 1.0, ease: 'power2.inOut' },
      '-=0.1'
    );
  } else {
    tl.to(gate, { opacity: 0, duration: 0.7 }, '-=0.1');
  }
}

/* ================================================================
   PARTICLES — rising fireflies
   ================================================================ */
function initParticles() {
  const canvas = document.getElementById('jq-particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const COLORS = ['#29B6F6','#26A65B','#9B59B6','#F4D03F','#ffffff','#a8f0c6'];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const isMobile = window.matchMedia('(max-width: 640px)').matches;
  const particles = Array.from({ length: isMobile ? 55 : 140 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    size:   Math.random() * 2.2 + 0.4,
    speedY: -(Math.random() * 0.42 + 0.08),
    speedX: (Math.random() - 0.5) * 0.18,
    op:     Math.random() * 0.55 + 0.15,
    color:  COLORS[Math.floor(Math.random() * COLORS.length)],
    phase:  Math.random() * Math.PI * 2,
  }));

  (function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.phase += 0.032;
      p.y     += p.speedY;
      p.x     += p.speedX;
      if (p.y < -6) { p.y = canvas.height + 6; p.x = Math.random() * canvas.width; }
      const alpha = p.op * (0.45 + 0.55 * Math.sin(p.phase));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2,'0');
      ctx.fill();
    });
    requestAnimationFrame(render);
  })();
}

/* ================================================================
   AUDIO
   ================================================================ */
function initAudio() {
  const B = JQ.BASE;
  JQ.audio.ambient   = new Audio(B + 'JQ_Ambient_Loop.mp3');
  JQ.audio.chime     = new Audio(B + 'JQ_Crystal_Chime.mp3');
  JQ.audio.whoosh    = new Audio(B + 'JQ_Portal_Whoosh.mp3');
  JQ.audio.discovery = new Audio(B + 'JQ_Discovery.mp3');
  JQ.audio.ambient.loop   = true;
  JQ.audio.ambient.volume = 0;
}
function startAmbient() {
  const a = JQ.audio.ambient;
  if (!a) return;
  a.play().catch(() => {});
  gsap.to(a, { volume: 0.22, duration: 3 });
  JQ.audioEnabled = true;
}
function playChime() {
  const a = JQ.audio.chime;
  if (!JQ.audioEnabled || !a) return;
  a.currentTime = 0; a.volume = 0.28; a.play().catch(() => {});
}
function playWhoosh() {
  const a = JQ.audio.whoosh;
  if (!a) return;
  a.currentTime = 0; a.volume = 0.55; a.play().catch(() => {});
}
function playDiscovery() {
  const a = JQ.audio.discovery;
  if (!JQ.audioEnabled || !a) return;
  a.currentTime = 0; a.volume = 0.45; a.play().catch(() => {});
}

/* ================================================================
   HERO — PINNED SCROLLYTELLING
   ================================================================ */
function splitChars(el) {
  if (!el) return;
  const orig = el.innerHTML;
  el.innerHTML = '';
  el.style.perspective = '600px';
  const tmp = document.createElement('div');
  tmp.innerHTML = orig;
  tmp.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      [...node.textContent].forEach(ch => {
        const s = document.createElement('span');
        s.className = 'char';
        s.style.cssText = 'display:inline-block;will-change:transform,opacity;';
        s.textContent = ch;
        el.appendChild(s);
      });
    } else if (node.nodeName === 'BR') {
      el.appendChild(document.createElement('br'));
    } else {
      el.appendChild(node.cloneNode(true));
    }
  });
}

function initHeroScrollytelling() {
  if (typeof ScrollTrigger === 'undefined') return;

  const hero     = document.getElementById('section-hero');
  if (!hero) return;
  const island   = hero.querySelector('.jq-hero-island');
  const titleEl  = hero.querySelector('.jq-hero-title');
  const sub      = hero.querySelector('.jq-hero-sub');
  const eyebrow  = hero.querySelector('.jq-hero-eyebrow');
  const crystals = hero.querySelectorAll('.jq-crystal-img');
  const hint     = hero.querySelector('.jq-scroll-hint');
  const clouds   = document.querySelectorAll('.jq-cloud');
  const vegLeft  = document.querySelector('.jq-veg-left');
  const vegRight = document.querySelector('.jq-veg-right');

  splitChars(titleEl);

  // Set all invisible before animation starts
  gsap.set(island,   { autoAlpha: 0, scale: 0.88, y: 70 });
  gsap.set(titleEl.querySelectorAll('.char'), { autoAlpha: 0, y: 55, rotateX: -65 });
  gsap.set(sub,      { autoAlpha: 0, y: 22 });
  gsap.set(eyebrow,  { autoAlpha: 0, y: 10 });
  gsap.set(crystals, { autoAlpha: 0, scale: 0.6 });
  gsap.set(hint,     { autoAlpha: 0 });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: hero,
      start:   'top top',
      end:     '+=200%',
      pin:     true,
      scrub:   1.5,
      anticipatePin: 1,
    }
  });

  // 0.00–0.20 island rises and scales in
  tl.to(island, { autoAlpha: 1, scale: 1.0, y: 0, duration: 0.22, ease: 'power2.out' }, 0);

  // 0.08–0.12 eyebrow
  tl.to(eyebrow, { autoAlpha: 1, y: 0, duration: 0.12 }, 0.08);

  // 0.18–0.55 title chars cascade
  tl.to(titleEl.querySelectorAll('.char'), {
    autoAlpha: 1, y: 0, rotateX: 0,
    stagger: 0.015, duration: 0.32, ease: 'back.out(1.6)',
  }, 0.18);

  // 0.48–0.66 subtitle
  tl.to(sub, { autoAlpha: 1, y: 0, duration: 0.16 }, 0.48);

  // 0.52–0.72 crystals pop in
  tl.to(crystals, {
    autoAlpha: 1, scale: 1,
    stagger: 0.04, duration: 0.16, ease: 'back.out(2)',
  }, 0.52);

  // 0.70–1.0 island ascends (camera descends into the world)
  tl.to(island, { y: -45, scale: 1.06, duration: 0.28 }, 0.70);
  tl.to(clouds,  { y: -60, duration: 0.30 }, 0.70);

  // 0.82 scroll hint fades in
  tl.to(hint, { autoAlpha: 1, duration: 0.14 }, 0.82);

  // vegetation: slides in from sides as island rises
  if (vegLeft)  tl.fromTo(vegLeft,  { x: -60, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.25 }, 0.55);
  if (vegRight) tl.fromTo(vegRight, { x:  60, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.25 }, 0.55);

  // Leaves follow through hero, fade when first section opens
  const vegEls = [vegLeft, vegRight].filter(Boolean);
  if (vegEls.length) {
    ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: '+=230%',
      onLeave:      () => gsap.to(vegEls, { autoAlpha: 0, duration: 1.4, ease: 'power2.inOut' }),
      onEnterBack:  () => gsap.to(vegEls, { autoAlpha: 1, duration: 0.8, ease: 'power2.out' }),
    });
  }

  // Ambient volume swells during pin
  ScrollTrigger.create({
    trigger: hero, start: 'top top', end: '+=200%',
    onUpdate: self => {
      if (JQ.audio.ambient && JQ.audioEnabled)
        JQ.audio.ambient.volume = Math.min(0.32, 0.08 + self.progress * 0.24);
    }
  });

  // Mouse parallax (only active when hero is in view)
  hero.addEventListener('mousemove', e => {
    const r  = hero.getBoundingClientRect();
    const mx = (e.clientX - r.width  / 2) / r.width;
    const my = (e.clientY - r.height / 2) / r.height;
    gsap.to(island, { x: mx * 24, y: `+=${my * 12}`, duration: 1.4, ease: 'power2.out', overwrite: 'auto' });
    crystals.forEach((c, i) => {
      gsap.to(c, { x: mx * (28 + i * 9), y: my * (18 + i * 5), duration: 1.1, ease: 'power2.out', overwrite: 'auto' });
    });
    gsap.to(clouds, { x: mx * (window.innerWidth * 0.035), duration: 1.8, ease: 'power2.out', overwrite: 'auto' });
  });
}

/* ================================================================
   PORTAL REVEALS — viewer rushes INTO each section through a portal
   power2.in: slow at distance, accelerates as you pass through
   ================================================================ */
function initPortalReveals() {
  if (typeof ScrollTrigger === 'undefined') return;

  if (JQ.reducedMotion) {
    document.querySelectorAll('.jq-section').forEach(s => {
      gsap.set(s, { clipPath: 'none', webkitClipPath: 'none' });
    });
    return;
  }

  // All sections share this portal reveal — gallery included (no pin)
  document.querySelectorAll('.jq-section').forEach(section => {
    // Start as a tiny point of light — portal far in the dark void
    gsap.set(section, {
      clipPath: 'circle(6% at 50% 50%)',
      webkitClipPath: 'circle(6% at 50% 50%)',
    });

    // Scroll = approach speed. power2.in = distant → accelerating rush
    gsap.to(section, {
      clipPath: 'circle(160% at 50% 50%)',
      webkitClipPath: 'circle(160% at 50% 50%)',
      ease: 'power2.in',
      scrollTrigger: {
        trigger: section,
        start:   'top 88%',
        end:     'top -28%',
        scrub:   2.5,
      }
    });

    // Glow ring — the portal rim, visible on approach, dissolves on entry
    const ring = section.querySelector('.jq-portal-ring');
    if (!ring) return;
    gsap.fromTo(ring,
      { scale: 0.12, opacity: 0 },
      {
        scale: 1.0, opacity: 1,
        scrollTrigger: { trigger: section, start: 'top 88%', end: 'top 44%', scrub: true }
      }
    );
    gsap.to(ring, {
      opacity: 0, scale: 1.4,
      scrollTrigger: { trigger: section, start: 'top 44%', end: 'top 5%', scrub: true }
    });
  });
}

/* ================================================================
   MAGNETIC ELEMENTS — subtle cursor pull on crystals and clouds
   ================================================================ */
function initMagneticElements() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  function magnetize(el, strength, maxDist) {
    window.addEventListener('mousemove', e => {
      const r  = el.getBoundingClientRect();
      const cx = r.left + r.width  / 2;
      const cy = r.top  + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < maxDist) {
        const pull = (1 - dist / maxDist) * strength;
        gsap.to(el, { x: dx * pull, y: dy * pull * 0.65, duration: 1.6, ease: 'power2.out', overwrite: 'auto' });
      } else {
        gsap.to(el, { x: 0, y: 0, duration: 2.2, ease: 'power3.out', overwrite: 'auto' });
      }
    });
  }

  document.querySelectorAll('.jq-crystal-img').forEach(c => magnetize(c, 0.14, 360));
  document.querySelectorAll('.jq-cloud').forEach(c       => magnetize(c, 0.04, 650));
}

/* ================================================================
   FOOTER REVEAL — hidden until CTA section is reached
   ================================================================ */
function initFooterReveal() {
  if (typeof ScrollTrigger === 'undefined') return;
  const footer = document.getElementById('jq-footer-target');
  if (!footer) return;
  ScrollTrigger.create({
    trigger: '#section-cta',
    start:   'top 35%',
    onEnter:     () => { footer.style.opacity = '1'; },
    onLeaveBack: () => { footer.style.opacity = '0'; },
  });
}

/* ================================================================
   SECTION ANIMATIONS
   ================================================================ */
function initScrollAnimations() {
  if (typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  // ── S2 Adventure ──────────────────────────────────────────────
  gsap.from('#section-adventure .jq-island-right', {
    x: 140, opacity: 0, scale: 0.92,
    duration: 1.3, ease: 'power3.out',
    scrollTrigger: { trigger: '#section-adventure', start: 'top 72%' },
  });
  gsap.from('#section-adventure .jq-ui-label', {
    x: 30, opacity: 0, duration: 0.7, stagger: 0.16, ease: 'power2.out',
    scrollTrigger: { trigger: '#section-adventure', start: 'top 58%' },
  });
  gsap.from('#section-adventure .jq-adventure-text > *', {
    y: 44, opacity: 0, duration: 1, stagger: 0.14, ease: 'power3.out',
    scrollTrigger: { trigger: '#section-adventure', start: 'top 72%' },
  });

  // ── S3 Expedition cards ───────────────────────────────────────
  gsap.from('#section-expedition .jq-section-title', {
    y: 55, opacity: 0, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: '#section-expedition', start: 'top 78%' },
  });
  gsap.from('#section-expedition .jq-section-body', {
    y: 30, opacity: 0, duration: 0.9, delay: 0.1, ease: 'power3.out',
    scrollTrigger: { trigger: '#section-expedition', start: 'top 74%' },
  });
  gsap.from('#section-expedition .jq-card', {
    y: 80, opacity: 0, rotateX: 14, transformOrigin: '50% 100%',
    duration: 1, stagger: 0.15, ease: 'power3.out',
    scrollTrigger: { trigger: '#section-expedition .jq-cards-grid', start: 'top 82%' },
  });
  gsap.from('.jq-expedition-quote', {
    opacity: 0, y: 40, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: '.jq-expedition-quote', start: 'top 82%' },
  });

  // ── S4 Animals — scroll-driven depth parallax ─────────────────
  [
    { sel: '.jq-animal-leon',     speed: 0.13, from: -110 },
    { sel: '.jq-animal-cebra',    speed: 0.22, from:  110 },
    { sel: '.jq-animal-flamenco', speed: 0.07, from:    0 },
  ].forEach(({ sel, speed, from }) => {
    const el = document.querySelector(sel);
    if (!el) return;
    gsap.from(el, {
      opacity: 0, scale: 0.82, x: from,
      duration: 1.4, ease: 'power3.out',
      scrollTrigger: { trigger: '#section-creatures', start: 'top 78%' },
    });
    
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (!isTouch) {
      ScrollTrigger.create({
        trigger: '#section-creatures',
        start: 'top bottom', end: 'bottom top', scrub: true,
        onUpdate: self =>
          gsap.set(el, { y: (self.progress - 0.5) * 220 * speed * -1 }),
      });
    }
  });
  gsap.from('#section-creatures .jq-creatures-text > *', {
    y: 44, opacity: 0, stagger: 0.16, duration: 1.1, ease: 'power3.out',
    scrollTrigger: { trigger: '#section-creatures', start: 'top 72%' },
  });

  // ── S5 Gallery — handled entirely by initGalleryPortalSequence()

  // ── S6 CTA ────────────────────────────────────────────────────
  gsap.from('#section-cta .jq-cta-title', {
    scale: 0.78, opacity: 0, duration: 1.3, ease: 'back.out(1.6)',
    scrollTrigger: { trigger: '#section-cta', start: 'top 76%' },
  });
  gsap.from('#section-cta .jq-cta-sub', {
    y: 32, opacity: 0, duration: 1, delay: 0.2, ease: 'power3.out',
    scrollTrigger: { trigger: '#section-cta', start: 'top 72%' },
  });
  gsap.from('#section-cta .jq-all-crystals img', {
    scale: 0, opacity: 0, duration: 0.9, stagger: 0.1, ease: 'back.out(2.2)',
    scrollTrigger: { trigger: '#section-cta', start: 'top 68%' },
  });
  gsap.from('#jq-reserve-btn', {
    y: 36, opacity: 0, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: '#section-cta', start: 'top 62%' },
  });

  // ── Generic eyebrows ─────────────────────────────────────────
  document.querySelectorAll('.jq-eyebrow, .jq-cta-eyebrow').forEach(el => {
    if (el.closest('#section-expedition, #section-creatures, #section-gallery')) return;
    gsap.from(el, {
      opacity: 0, y: 16, letterSpacing: '0.6em', duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 86%' },
    });
  });
}

/* ================================================================
   GALLERY PORTAL SEQUENCE
   Point-triggered · no pin · scroll flows freely
   Grid items burst open from circle(5%) → circle(160%) in stagger
   ================================================================ */
function initGalleryPortalSequence() {
  const section = document.getElementById('section-gallery');
  if (!section || typeof ScrollTrigger === 'undefined') return;
  if (JQ.reducedMotion) return;

  // ── Textos de sección ──────────────────────────────────────────
  gsap.from('#section-gallery .jq-eyebrow', {
    opacity: 0, y: 16, letterSpacing: '0.6em', duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: section, start: 'top 72%' },
  });
  gsap.from('#section-gallery .jq-section-title', {
    y: 50, opacity: 0, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: section, start: 'top 68%' },
  });
  gsap.from('#section-gallery .jq-section-body', {
    y: 30, opacity: 0, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: section, start: 'top 64%' },
  });

  // ── Screenshots (grid principal) ───────────────────────────────
  const gridItems = [...section.querySelectorAll('.jq-gallery-grid .jq-gallery-item')];
  if (gridItems.length) {
    gsap.set(gridItems, {
      clipPath:       'circle(5% at 50% 50%)',
      webkitClipPath: 'circle(5% at 50% 50%)',
      scale:          0.06,
      autoAlpha:      0,
      transformOrigin: '50% 50%',
    });
    gsap.to(gridItems, {
      clipPath:       'circle(160% at 50% 50%)',
      webkitClipPath: 'circle(160% at 50% 50%)',
      scale:     1,
      autoAlpha: 1,
      ease:      'power2.out',
      duration:  0.75,
      stagger:   { amount: 1.1, from: 'start' },
      scrollTrigger: {
        trigger: '#section-gallery .jq-gallery-grid',
        start:   'top 60%',
      },
    });
  }

  // ── Fotos reales ───────────────────────────────────────────────
  const realItems = [...section.querySelectorAll('.jq-gallery-real .jq-gallery-item')];
  if (realItems.length) {
    gsap.set(realItems, {
      clipPath:       'circle(5% at 50% 50%)',
      webkitClipPath: 'circle(5% at 50% 50%)',
      scale:          0.06,
      autoAlpha:      0,
      transformOrigin: '50% 50%',
    });
    gsap.to(realItems, {
      clipPath:       'circle(160% at 50% 50%)',
      webkitClipPath: 'circle(160% at 50% 50%)',
      scale:     1,
      autoAlpha: 1,
      ease:      'power2.out',
      duration:  0.75,
      stagger:   { amount: 0.5, from: 'start' },
      scrollTrigger: {
        trigger: '#section-gallery .jq-gallery-real',
        start:   'top 82%',
      },
    });
  }

  // ── Caption ────────────────────────────────────────────────────
  const caption = section.querySelector('.jq-gallery-caption');
  if (caption) {
    gsap.set(caption, { autoAlpha: 0, y: 20 });
    gsap.to(caption, {
      autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: caption, start: 'top 88%' },
    });
  }
}

/* ================================================================
   SCROLL VELOCITY SKEW
   ================================================================ */
function initScrollSkew() {
  if (typeof ScrollTrigger === 'undefined') return;
  const targets = document.querySelectorAll('.jq-section-title, .jq-cta-title, .jq-hero-title');
  if (!targets.length) return;

  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  const maxDeg  = isTouch ? 2 : 5;
  const clamp   = gsap.utils.clamp(-maxDeg, maxDeg);
  const divider = isTouch ? -1100 : -650;
  
  const setter = gsap.quickSetter(targets, 'skewY', 'deg');
  let debounce;

  ScrollTrigger.create({
    onUpdate: self => {
      setter(clamp(self.getVelocity() / divider));
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        gsap.to(targets, { skewY: 0, duration: 0.55, ease: 'power3' });
      }, 80);
    }
  });
}

/* ================================================================
   CARD GLOW — radial light follows cursor
   ================================================================ */
function initCardGlow() {
  document.querySelectorAll('.jq-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width  * 100).toFixed(1) + '%');
      card.style.setProperty('--my', ((e.clientY - r.top)  / r.height * 100).toFixed(1) + '%');
    });
  });
}

/* ================================================================
   SECTION ACCENT COLOURS
   ================================================================ */
function initSectionAccents() {
  if (typeof ScrollTrigger === 'undefined') return;
  const curtain = document.getElementById('main-curtain');
  if (!curtain) return;
  [
    ['section-adventure',  'rgba(41,182,246,0.05)'],
    ['section-expedition', 'rgba(38,166,91,0.06)'],
    ['section-creatures',  'rgba(155,89,182,0.06)'],
    ['section-gallery',    'rgba(244,208,63,0.05)'],
    ['section-cta',        'rgba(38,166,91,0.04)'],
  ].forEach(([id, color]) => {
    ScrollTrigger.create({
      trigger: `#${id}`, start: 'top 55%', end: 'bottom 45%',
      onEnter:     () => { curtain.style.backgroundColor = color; },
      onEnterBack: () => { curtain.style.backgroundColor = color; },
      onLeave:     () => { curtain.style.backgroundColor = 'transparent'; },
      onLeaveBack: () => { curtain.style.backgroundColor = 'transparent'; },
    });
  });
}

/* ================================================================
   CRYSTAL HUD
   ================================================================ */
function initCrystalHUD() {
  const hud = document.getElementById('jq-crystal-hud');
  if (!hud) return;
  const map = {
    'section-adventure':  'blue',
    'section-expedition': 'green',
    'section-creatures':  'purple',
    'section-gallery':    'gold',
  };
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const crystal = map[e.target.id];
      if (!crystal || JQ.hudState[crystal]) return;
      JQ.hudState[crystal] = true;
      const pip = hud.querySelector(`[data-crystal="${crystal}"]`);
      if (pip) { pip.classList.add('collected'); playDiscovery(); }
      if (Object.values(JQ.hudState).every(Boolean)) {
        hud.classList.add('all-collected');
        setTimeout(() => hud.classList.remove('all-collected'), 1100);
      }
    });
  }, { threshold: 0.35 });
  Object.keys(map).forEach(id => {
    const el = document.getElementById(id);
    if (el) obs.observe(el);
  });
}

/* ================================================================
   STICKY + WHATSAPP + HUD visibility
   ================================================================ */
function initStickyBtn() {
  const btn    = document.getElementById('jq-sticky-btn');
  const hero   = document.getElementById('section-hero');
  const footer = document.getElementById('jq-footer-target');
  const hud    = document.getElementById('jq-crystal-hud');
  if (!btn || !hero) return;

  new IntersectionObserver(entries => {
    entries.forEach(e => {
      const gone = !e.isIntersecting;
      btn.classList.toggle('visible', gone);
      if (hud) hud.classList.toggle('visible', gone);
    });
  }, { threshold: 0.15 }).observe(hero);

  if (footer) {
    new IntersectionObserver(entries => {
      entries.forEach(e => btn.classList.toggle('hidden-by-footer', e.isIntersecting));
    }, { threshold: 0.1 }).observe(footer);
  }
}

function initWhatsApp() {
  const wa = document.getElementById('jq-wa-btn');
  if (wa) setTimeout(() => wa.classList.add('visible'), 2200);
}

/* ================================================================
   FOOTER SYNC
   ================================================================ */
function syncFooter() {
  const footer  = document.getElementById('jq-footer-target');
  const curtain = document.getElementById('main-curtain');
  if (!footer || !curtain) return;
  curtain.style.marginBottom = footer.offsetHeight + 'px';
}

/* ================================================================
   CTA — portal wipe to reservas
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('jq-reserve-btn');
  if (!btn) return;
  btn.addEventListener('click', e => {
    e.preventDefault();
    const href = btn.getAttribute('href') || 'https://virtuabarcelona.com/reservas_virtua/';
    playWhoosh();
    const x = (e.clientX || window.innerWidth  / 2).toFixed(0) + 'px';
    const y = (e.clientY || window.innerHeight / 2).toFixed(0) + 'px';
    const wipe = document.getElementById('jq-portal-wipe');
    if (wipe) {
      wipe.style.cssText = 'display:block; background: radial-gradient(circle at center, #26A65B 0%, #9B59B6 45%, #080C1A 100%);';
      gsap.fromTo(wipe,
        { clipPath: `circle(0% at ${x} ${y})` },
        { clipPath: `circle(200% at ${x} ${y})`, duration: 0.95, ease: 'power2.inOut',
          onComplete: () => { window.location.href = href; } }
      );
    } else {
      window.location.href = href;
    }
  });
});

jqInit();
