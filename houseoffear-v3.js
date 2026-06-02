/**
 * House of Fear: Call of Blood
 * Version: 6.0 — Blood Cursor, Scanlines, Counter, Flicker, Scroll Audio, Emily Whisper
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth <= 768;

  /* ============================================================
     GLITCH TARGET — .virtua-elementor-override, not body.
     body transforms create stacking contexts that trap fixed els.
     ============================================================ */
  const glitchEl = document.querySelector('.virtua-elementor-override') || document.body;

  /* ============================================================
     EMILY FLASH — portal to body so it escapes any transforms
     ============================================================ */
  const emilyFlash = document.getElementById('emily-flash');
  if (emilyFlash && emilyFlash.parentElement !== document.body) {
    document.body.appendChild(emilyFlash);
  }

  /* ============================================================
     AUDIO
     ============================================================ */
  const ambientAudio = new Audio('https://virtuabarcelona.com/wp-content/uploads/2026/04/Deadly_Husk_Loop_Roomtone_Layer.wav');
  ambientAudio.loop   = true;
  ambientAudio.volume = 0.25;

  const whisperAudio = new Audio('https://virtuabarcelona.com/wp-content/uploads/2026/04/CBO_Whisper_Emily.mp3');
  whisperAudio.loop   = true;
  whisperAudio.volume = 0;

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      ambientAudio.pause();
      whisperAudio.pause();
    } else {
      if (ambientAudio.currentTime > 0) ambientAudio.play().catch(() => {});
    }
  });

  /* ============================================================
     TV STATIC
     ============================================================ */
  function initTVStatic() {
    const canvas = document.getElementById('hof-static');
    if (!canvas || prefersReducedMotion) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = 480;
    canvas.height = 270;
    const id = ctx.createImageData(480, 270);
    const d  = id.data;
    function renderStatic() {
      for (let i = 0; i < d.length; i += 4) {
        const on = Math.random() > 0.92;
        const v  = on ? Math.floor(Math.random() * 200 + 55) : 0;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = on ? 220 : 0;
      }
      ctx.putImageData(id, 0, 0);
      requestAnimationFrame(renderStatic);
    }
    renderStatic();
  }
  initTVStatic();

  /* ============================================================
     SYNC LAYER HEIGHTS — ensures each section pair matches.
     Runs on load (images resolved) and resize.
     ============================================================ */
  function syncLayerHeights() {
    const safe    = document.querySelectorAll('.layer-safe .hof-section');
    const haunted = document.querySelectorAll('.layer-haunted .hof-section');
    document.querySelectorAll('.hof-section').forEach(s => { s.style.minHeight = ''; });
    safe.forEach((s, i) => {
      const h = haunted[i];
      if (!h) return;
      const height = Math.max(s.scrollHeight, h.scrollHeight);
      s.style.minHeight = `${height}px`;
      h.style.minHeight = `${height}px`;
    });
  }
  window.addEventListener('load', () => {
    syncLayerHeights();
    setTimeout(syncLayerHeights, 400);
  });
  document.fonts.ready.then(syncLayerHeights);
  window.addEventListener('resize', syncLayerHeights, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(syncLayerHeights, 300), { passive: true });

  /* ============================================================
     COMMUNICATIONS COUNTER — counts up from "last contact"
     Starts immediately so it's already running when boot unlocks.
     ============================================================ */
  function initCommsCounter() {
    const el = document.getElementById('comms-time');
    if (!el) return;
    let seconds = 2 * 3600 + 17 * 60 + 43; // 2h 17m 43s since last contact
    function update() {
      seconds++;
      const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
      const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      el.textContent = `${h}:${m}:${s}`;
    }
    setInterval(update, 1000);
    update();
  }
  initCommsCounter();

  /* ============================================================
     SCRAMBLE TEXT
     ============================================================ */
  function scrambleText(el, finalText, duration) {
    duration = duration || 900;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!$%&?';
    const total = Math.round(duration / 28);
    let frame = 0;
    const timer = setInterval(() => {
      const progress = frame / total;
      el.textContent = finalText.split('').map((ch, i) => {
        if (ch === ' ') return ch;
        return (i / finalText.length < progress)
          ? ch : chars[Math.floor(Math.random() * chars.length)];
      }).join('');
      frame++;
      if (frame > total) { clearInterval(timer); el.textContent = finalText; }
    }, 28);
  }

  /* ============================================================
     SCARE BOOT
     ============================================================ */
  const bootScreen = document.getElementById('scare-boot');
  const unlockBtn  = document.getElementById('btn-unlock');
  const titleLine1 = document.getElementById('title-line-1');
  const titleLine2 = document.getElementById('title-line-2');

  if (bootScreen && unlockBtn) {
    unlockBtn.addEventListener('click', () => {
      if (!prefersReducedMotion) glitchEl.classList.add('is-glitching');
      new Audio('https://virtuabarcelona.com/wp-content/uploads/2026/04/Hit-Horror.wav').play().catch(() => {});
      ambientAudio.play().catch(() => {});
      setTimeout(() => {
        glitchEl.classList.remove('is-glitching');
        bootScreen.classList.add('hidden');
        if (!prefersReducedMotion) {
          if (titleLine1) scrambleText(titleLine1, 'HOUSE OF FEAR', 800);
          if (titleLine2) setTimeout(() => scrambleText(titleLine2, 'CALL OF BLOOD', 800), 280);
        }
        initTerrorMechanics();
      }, 400);
    });
  } else {
    initTerrorMechanics();
  }

  /* ============================================================
     TERROR MECHANICS
     ============================================================ */
  function initTerrorMechanics() {
    const hauntedLayer = document.querySelector('.layer-haunted');
    const mobileHint   = document.getElementById('mobile-hint');
    const emilySection = document.getElementById('emily-section');

    /* ----------------------------------------------------------
       A. FLASHLIGHT — Lerp inertia + Emily proximity whisper
       ---------------------------------------------------------- */
    if (hauntedLayer && !prefersReducedMotion) {
      let elemDocLeft = 0, elemDocTop = 0;
      let emilyCenterX = 0, emilyCenterY = 0;

      function cacheOffsets() {
        const r = hauntedLayer.getBoundingClientRect();
        elemDocLeft = r.left + window.scrollX;
        elemDocTop  = r.top  + window.scrollY;
        if (emilySection) {
          const er = emilySection.getBoundingClientRect();
          emilyCenterX = er.left + window.scrollX + er.width  / 2;
          emilyCenterY = er.top  + window.scrollY + er.height / 2;
        }
      }
      cacheOffsets();
      window.addEventListener('resize', cacheOffsets, { passive: true });
      window.addEventListener('load',   cacheOffsets);

      if (!isMobile) {
        const tgt = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        const cur = { x: tgt.x, y: tgt.y };
        let radius = 120, breathe = 1;

        window.addEventListener('mousemove', e => {
          tgt.x = e.clientX;
          tgt.y = e.clientY;
        }, { passive: true });

        function animFlashlight() {
          // Lerp
          cur.x += (tgt.x - cur.x) * 0.08;
          cur.y += (tgt.y - cur.y) * 0.08;

          // Breathing radius
          radius += breathe * 0.12;
          if (radius > 132) breathe = -1;
          if (radius < 110) breathe =  1;

          // Apply flashlight
          hauntedLayer.style.setProperty('--mouse-x',           `${cur.x + window.scrollX - elemDocLeft}px`);
          hauntedLayer.style.setProperty('--mouse-y',           `${cur.y + window.scrollY - elemDocTop}px`);
          hauntedLayer.style.setProperty('--flashlight-radius', `${radius}px`);

          // Emily proximity whisper
          if (emilySection) {
            const dx = (cur.x + window.scrollX) - emilyCenterX;
            const dy = (cur.y + window.scrollY) - emilyCenterY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const proximity = Math.max(0, 1 - dist / 400);
            const targetVol = proximity * 0.55;
            whisperAudio.volume += (targetVol - whisperAudio.volume) * 0.04;
            if (whisperAudio.volume > 0.02 && whisperAudio.paused) {
              whisperAudio.play().catch(() => {});
            }
          }

          requestAnimationFrame(animFlashlight);
        }
        animFlashlight();

      } else {
        function activateGyro() {
          if (mobileHint) mobileHint.classList.add('hidden');
          window.addEventListener('deviceorientation', e => {
            if (e.gamma === null) return;
            const x = ((e.gamma + 45) / 90) * window.innerWidth;
            const yInViewport = ((e.beta - 45) / 60) * window.innerHeight + window.innerHeight / 2;
            const y = yInViewport + window.scrollY;
            hauntedLayer.style.setProperty('--mouse-x', `${Math.max(0, Math.min(window.innerWidth, x))}px`);
            hauntedLayer.style.setProperty('--mouse-y', `${Math.max(0, Math.min(hauntedLayer.scrollHeight, y))}px`);
          }, { passive: true });
        }
        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') {
          if (mobileHint) mobileHint.style.display = 'block';
          if (mobileHint) mobileHint.addEventListener('click', () => {
            DeviceOrientationEvent.requestPermission()
              .then(s => { if (s === 'granted') activateGyro(); }).catch(() => {});
          });
        } else if (window.DeviceOrientationEvent) {
          activateGyro();
        }
      }
    }

    /* ----------------------------------------------------------
       B. RANDOM GLITCHES
       ---------------------------------------------------------- */
    if (!prefersReducedMotion) {
      setInterval(() => {
        if (Math.random() > 0.90) {
          glitchEl.classList.add('is-glitching');
          setTimeout(() => glitchEl.classList.remove('is-glitching'), 100 + Math.random() * 200);
        }
      }, 4000);
    }

    /* ----------------------------------------------------------
       C. IDLE SCARE
       ---------------------------------------------------------- */
    if (!isMobile && !prefersReducedMotion && emilyFlash) {
      let idleTimer;
      const resetIdle = () => {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
          emilyFlash.style.opacity = '0.4';
          setTimeout(() => { emilyFlash.style.opacity = '0'; }, 200);
        }, 12000);
      };
      window.addEventListener('mousemove', resetIdle, { passive: true });
      window.addEventListener('keypress',  resetIdle, { passive: true });
      resetIdle();
    }

    /* ----------------------------------------------------------
       D. CTA STROBE
       ---------------------------------------------------------- */
    document.querySelectorAll('.cta-trigger').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const url = btn.getAttribute('href');
        new Audio('https://virtuabarcelona.com/wp-content/uploads/2026/04/TensionRiser04.mp3').play().catch(() => {});
        if (!prefersReducedMotion && emilyFlash) {
          glitchEl.classList.add('extreme-glitching');
          [0, 130, 290, 520, 820, 1200].forEach((t, i) => {
            setTimeout(() => { emilyFlash.style.opacity = (i % 2 === 0) ? '0.85' : '0'; }, t);
          });
          setTimeout(() => { emilyFlash.style.opacity = '1'; }, 1500);
          setTimeout(() => {
            document.body.style.transition = 'opacity 0.15s';
            document.body.style.opacity    = '0';
            setTimeout(() => { window.location.href = url; }, 200);
          }, 1900);
        } else {
          window.location.href = url;
        }
      });
    });

    /* ----------------------------------------------------------
       E. HERO LIGHT FLICKER — occasional dark flash on bg image
       Uses an overlay div, not filter animation, for reliability
       ---------------------------------------------------------- */
    function initHeroFlicker() {
      const overlay = document.querySelector('.hero-flicker-overlay');
      if (!overlay || prefersReducedMotion) return;
      function doFlicker() {
        overlay.style.opacity = '1';
        setTimeout(() => {
          overlay.style.opacity = '0';
          // Occasional double-flicker
          if (Math.random() > 0.55) {
            setTimeout(() => {
              overlay.style.opacity = '1';
              setTimeout(() => { overlay.style.opacity = '0'; }, 45);
            }, 70);
          }
          setTimeout(doFlicker, 7000 + Math.random() * 13000);
        }, 45);
      }
      setTimeout(doFlicker, 4000 + Math.random() * 6000);
    }
    initHeroFlicker();

    /* ----------------------------------------------------------
       F. SCROLL AUDIO — ambient drone deepens as you scroll
       ---------------------------------------------------------- */
    function initScrollAudio() {
      window.addEventListener('scroll', () => {
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        if (maxScroll <= 0) return;
        const progress = Math.min(1, window.scrollY / maxScroll);
        // Volume: 0.25 (top) → 0.65 (bottom)
        ambientAudio.volume = 0.25 + progress * 0.4;
        // Pitch: very slight slowdown adds dread (0.98 → 0.94)
        if (!prefersReducedMotion) {
          ambientAudio.playbackRate = 1 - progress * 0.06;
        }

        // Mobile whisper proximity based on scroll
        if (isMobile && emilySection && whisperAudio) {
          const rect = emilySection.getBoundingClientRect();
          const elementCenter = rect.top + rect.height / 2;
          const viewportCenter = window.innerHeight / 2;
          const distance = Math.abs(elementCenter - viewportCenter);
          const maxDistance = window.innerHeight * 0.8; // Active range
          const proximity = Math.max(0, 1 - distance / maxDistance);
          const targetVol = proximity * 0.55;
          whisperAudio.volume += (targetVol - whisperAudio.volume) * 0.08;
          if (whisperAudio.volume > 0.02 && whisperAudio.paused) {
            whisperAudio.play().catch(() => {});
          }
        }
      }, { passive: true });
    }
    initScrollAudio();

    /* ----------------------------------------------------------
       G. GSAP SCROLL ANIMATIONS
       ---------------------------------------------------------- */
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);

      // Pair and animate paper notes
      const safeNotes = gsap.utils.toArray('.paper-note');
      const hauntedNotes = gsap.utils.toArray('.paper-note-bloody');
      safeNotes.forEach((el, i) => {
        const partner = hauntedNotes[i];
        gsap.from(el, {
          scrollTrigger: { trigger: el, start: 'top 85%' },
          y: 30, opacity: 0, duration: 0.8, ease: 'power3.out'
        });
        if (partner) {
          if (!prefersReducedMotion) {
            gsap.from(partner, {
              scrollTrigger: { trigger: el, start: 'top 85%' },
              y: 30, opacity: 0, scale: 1.04, duration: 0.8, ease: 'power3.out'
            });
          } else {
            gsap.from(partner, {
              scrollTrigger: { trigger: el, start: 'top 85%' },
              y: 30, opacity: 0, duration: 0.8, ease: 'power3.out'
            });
          }
        }
      });

      gsap.from('.stats-block', {
        scrollTrigger: { trigger: '.stats-block', start: 'top 85%' },
        opacity: 0, y: 20, duration: 0.8, ease: 'power2.out'
      });

      // Synchronize Emily Card animations
      gsap.from('.investigation-file, .emily-haunted-wrap', {
        scrollTrigger: { trigger: '.investigation-file', start: 'top 85%' },
        opacity: 0, y: 25, duration: 0.9, ease: 'power3.out'
      });

      // Synchronize Gallery Image animations
      const safeGalleryItems = gsap.utils.toArray('.safe-gallery .gallery-img-wrapper');
      const hauntedGalleryItems = gsap.utils.toArray('.haunted-gallery .gallery-img-wrapper');
      safeGalleryItems.forEach((el, i) => {
        const partner = hauntedGalleryItems[i];
        gsap.from(el, {
          scrollTrigger: { trigger: el, start: 'top 90%' },
          opacity: 0, y: 20, duration: 0.6, delay: i * 0.1, ease: 'power2.out'
        });
        if (partner) {
          gsap.from(partner, {
            scrollTrigger: { trigger: el, start: 'top 90%' },
            opacity: 0, y: 20, duration: 0.6, delay: i * 0.1, ease: 'power2.out'
          });
        }
      });

      if (!prefersReducedMotion) {
        gsap.utils.toArray('.layer-haunted .psychotic-text').forEach(el => {
          gsap.from(el, { scrollTrigger: { trigger: el, start: 'top 88%' }, opacity: 0, skewX: -15, duration: 0.35, ease: 'power4.out' });
        });
      }
    }

    /* ----------------------------------------------------------
       H. MOBILE GALLERY OBSERVER
       ---------------------------------------------------------- */
    if (isMobile) {
      const galleryItemsMobile = document.querySelectorAll('.gallery-img-wrapper');
      if (galleryItemsMobile.length > 0) {
        const galleryObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('hof-active');
            } else {
              entry.target.classList.remove('hof-active');
            }
          });
        }, {
          rootMargin: '-40% 0px -40% 0px',
          threshold: 0
        });
        galleryItemsMobile.forEach(item => galleryObserver.observe(item));
      }
    }

    /* ----------------------------------------------------------
       I. STICKY BUTTON LOGIC (STANDARD MÓVIL)
       ---------------------------------------------------------- */
    const stickyBtn = document.getElementById('sticky-book-btn');
    const heroSection = document.querySelector('.hof-hero');

    if (stickyBtn && heroSection) {
      window.addEventListener('scroll', () => {
        const heroRect = heroSection.getBoundingClientRect();
        const footerElements = document.querySelectorAll('footer, .elementor-location-footer, .site-footer, .site-below-footer-wrap, .cta-section');
        
        let isFooterVisible = false;
        footerElements.forEach(f => {
          const rect = f.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            isFooterVisible = true;
          }
        });

        if (heroRect.bottom < window.innerHeight / 2 && !isFooterVisible) {
          stickyBtn.classList.add('is-visible');
        } else {
          stickyBtn.classList.remove('is-visible');
        }
      });
    }

    /* ----------------------------------------------------------
       J. BFCACHE RESTORE — Reset transitions/black screens on history back
       ---------------------------------------------------------- */
    window.addEventListener('pageshow', (event) => {
      // Restablecer estilos del body que puedan haberse modificado en la transición
      document.body.style.opacity = '';
      document.body.style.transition = '';
      
      // Quitar clases de glitch extremo
      if (glitchEl) {
        glitchEl.classList.remove('extreme-glitching', 'is-glitching');
      }
      if (emilyFlash) {
        emilyFlash.style.opacity = '0';
      }
    });

    /* ----------------------------------------------------------
       K. GSAP MOBILE REFRESH
       ---------------------------------------------------------- */
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh(true);
      }, 250);
    });
    window.addEventListener('load', () => {
      setTimeout(() => {
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh(true);
      }, 500);
    });

  } // end initTerrorMechanics

});
