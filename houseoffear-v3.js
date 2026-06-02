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

  let audioCtx = null;
  let whisperSource = null;
  let whisperPanner = null;
  let whisperGainNode = null;
  let isAudioMuted = false;

  function initWebAudio() {
    if (audioCtx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      audioCtx = new AudioContextClass();
      whisperSource = audioCtx.createMediaElementSource(whisperAudio);
      if (audioCtx.createStereoPanner) {
        whisperPanner = audioCtx.createStereoPanner();
      } else {
        whisperPanner = audioCtx.createPanner();
        whisperPanner.panningModel = 'HRTF';
      }
      whisperGainNode = audioCtx.createGain();
      
      whisperSource.connect(whisperPanner);
      whisperPanner.connect(whisperGainNode);
      whisperGainNode.connect(audioCtx.destination);
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  function updateWhisperAudio(targetVol, panVal) {
    if (isAudioMuted) {
      whisperAudio.volume = 0;
      if (whisperGainNode) whisperGainNode.gain.value = 0;
      return;
    }
    if (whisperGainNode) {
      whisperGainNode.gain.value += (targetVol - whisperGainNode.gain.value) * 0.08;
      whisperAudio.volume = 1;
      if (whisperPanner) {
        if (whisperPanner.pan) {
          whisperPanner.pan.value = panVal;
        } else if (whisperPanner.setPosition) {
          whisperPanner.setPosition(panVal, 0, 1 - Math.abs(panVal));
        }
      }
    } else {
      whisperAudio.volume += (targetVol - whisperAudio.volume) * 0.08;
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      ambientAudio.pause();
      whisperAudio.pause();
    } else {
      if (ambientAudio.currentTime > 0 && !isAudioMuted) ambientAudio.play().catch(() => {});
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

    // Pre-generate 6 frames of noise data in memory (ImageData)
    const frames = [];
    const numFrames = 6;
    for (let f = 0; f < numFrames; f++) {
      const imgData = ctx.createImageData(480, 270);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const on = Math.random() > 0.92;
        const v  = on ? Math.floor(Math.random() * 200 + 55) : 0;
        data[i] = data[i + 1] = data[i + 2] = v;
        data[i + 3] = on ? 220 : 0;
      }
      frames.push(imgData);
    }

    let currentFrameIndex = 0;
    let frameInterval = 0;

    function renderStatic() {
      // Render every 2 frames to look more like television noise (30fps noise)
      frameInterval++;
      if (frameInterval >= 2) {
        currentFrameIndex = (currentFrameIndex + 1) % numFrames;
        frameInterval = 0;
      }
      ctx.putImageData(frames[currentFrameIndex], 0, 0);
      requestAnimationFrame(renderStatic);
    }
    renderStatic();
  }
  initTVStatic();

  /* ============================================================
     SYNC LAYER HEIGHTS — ensures each section pair matches.
     ============================================================ */
  function syncLayerHeights() {
    const safe    = document.querySelectorAll('.layer-safe .hof-section');
    const haunted = document.querySelectorAll('.layer-haunted .hof-section');
    document.querySelectorAll('.hof-section').forEach(s => { 
      s.style.minHeight = ''; 
      s.style.height = ''; 
    });
    safe.forEach((s, i) => {
      const h = haunted[i];
      if (!h) return;
      const height = Math.max(s.scrollHeight, h.scrollHeight);
      s.style.height = `${height}px`;
      h.style.height = `${height}px`;
    });
  }
  window.addEventListener('load', () => {
    syncLayerHeights();
    setTimeout(syncLayerHeights, 400);
  });
  if (document.fonts) {
    document.fonts.ready.then(syncLayerHeights);
  }
  window.addEventListener('resize', syncLayerHeights, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(syncLayerHeights, 300), { passive: true });

  /* ============================================================
     COMMUNICATIONS COUNTER — counts up from "last contact"
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
      // Initialize Web Audio API
      initWebAudio();
      if (audioCtx) audioCtx.resume().catch(() => {});

      if (!prefersReducedMotion) glitchEl.classList.add('is-glitching');
      new Audio('https://assets.virtuabarcelona.com/HOUSE%20OF%20FEAR%20ASSETS/Hit-Horror.mp3').play().catch(() => {});
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
          cur.x += (tgt.x - cur.x) * 0.08;
          cur.y += (tgt.y - cur.y) * 0.08;

          radius += breathe * 0.12;
          if (radius > 132) breathe = -1;
          if (radius < 110) breathe =  1;

          hauntedLayer.style.setProperty('--mouse-x',           `${cur.x + window.scrollX - elemDocLeft}px`);
          hauntedLayer.style.setProperty('--mouse-y',           `${cur.y + window.scrollY - elemDocTop}px`);
          hauntedLayer.style.setProperty('--flashlight-radius', `${radius}px`);

          if (emilySection) {
            const dx = (cur.x + window.scrollX) - emilyCenterX;
            const dy = (cur.y + window.scrollY) - emilyCenterY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const proximity = Math.max(0, 1 - dist / 400);
            const targetVol = proximity * 0.55;

            // Calculate Pan Value: -0.85 (left) to +0.85 (right)
            const panVal = Math.max(-0.85, Math.min(0.85, ((cur.x / window.innerWidth) * 2) - 1));

            updateWhisperAudio(targetVol, panVal);

            const currentVol = whisperGainNode ? whisperGainNode.gain.value : whisperAudio.volume;
            if (currentVol > 0.02 && whisperAudio.paused && !isAudioMuted) {
              whisperAudio.play().catch(() => {});
            }
          }

          requestAnimationFrame(animFlashlight);
        }
        animFlashlight();

      } else {
        let hasGyro = false;

        function activateGyro() {
          if (mobileHint) mobileHint.classList.add('hidden');
          window.addEventListener('deviceorientation', e => {
            if (e.gamma === null) return;
            hasGyro = true;
            const x = ((e.gamma + 45) / 90) * window.innerWidth;
            const yInViewport = ((e.beta - 45) / 60) * window.innerHeight + window.innerHeight / 2;
            const y = yInViewport + window.scrollY;
            hauntedLayer.style.setProperty('--mouse-x', `${Math.max(0, Math.min(window.innerWidth, x))}px`);
            hauntedLayer.style.setProperty('--mouse-y', `${Math.max(0, Math.min(hauntedLayer.scrollHeight, y))}px`);
          }, { passive: true });
        }

        // Swipe Fallback
        function updateTouchCoords(e) {
          if (hasGyro) return;
          const touch = e.touches[0];
          const x = touch.clientX;
          const y = touch.clientY + window.scrollY;
          hauntedLayer.style.setProperty('--mouse-x', `${Math.max(0, Math.min(window.innerWidth, x))}px`);
          hauntedLayer.style.setProperty('--mouse-y', `${Math.max(0, Math.min(hauntedLayer.scrollHeight, y))}px`);
        }
        window.addEventListener('touchstart', updateTouchCoords, { passive: true });
        window.addEventListener('touchmove', updateTouchCoords, { passive: true });

        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') {
          if (mobileHint) mobileHint.style.display = 'block';
          if (mobileHint) mobileHint.addEventListener('click', () => {
            DeviceOrientationEvent.requestPermission()
              .then(s => { 
                if (s === 'granted') {
                  activateGyro();
                } else {
                  if (mobileHint) mobileHint.classList.add('hidden');
                }
              }).catch(() => {
                if (mobileHint) mobileHint.classList.add('hidden');
              });
          });
        } else if (window.DeviceOrientationEvent) {
          activateGyro();
          setTimeout(() => {
            if (hasGyro && mobileHint) mobileHint.classList.add('hidden');
          }, 300);
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
        const url = btn.getAttribute('href') || '/reservas_virtua/';
        new Audio('https://assets.virtuabarcelona.com/HOUSE%20OF%20FEAR%20ASSETS/tension-riser.mp3').play().catch(() => {});
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
       E. HERO LIGHT FLICKER
       ---------------------------------------------------------- */
    function initHeroFlicker() {
      const overlay = document.querySelector('.hero-flicker-overlay');
      if (!overlay || prefersReducedMotion) return;
      function doFlicker() {
        overlay.style.opacity = '1';
        setTimeout(() => {
          overlay.style.opacity = '0';
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
        ambientAudio.volume = isAudioMuted ? 0 : (0.25 + progress * 0.4);
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
          
          updateWhisperAudio(targetVol, 0);

          const currentVol = whisperGainNode ? whisperGainNode.gain.value : whisperAudio.volume;
          if (currentVol > 0.02 && whisperAudio.paused && !isAudioMuted) {
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
        const footerElements = document.querySelectorAll('footer, .vh-footer-fixed-behind, .cta-section');
        
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
       K. AUDIO WIDGET CONTROLLER (MUTE / UNMUTE)
       ---------------------------------------------------------- */
    const audioCtrlBtn = document.getElementById('hof-audio-control');
    if (audioCtrlBtn) {
      audioCtrlBtn.classList.add('is-playing');

      audioCtrlBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isAudioMuted = !isAudioMuted;
        if (isAudioMuted) {
          audioCtrlBtn.classList.remove('is-playing');
          audioCtrlBtn.classList.add('is-muted');
          ambientAudio.volume = 0;
          whisperAudio.volume = 0;
          if (whisperGainNode) whisperGainNode.gain.value = 0;
          ambientAudio.pause();
          whisperAudio.pause();
        } else {
          audioCtrlBtn.classList.remove('is-muted');
          audioCtrlBtn.classList.add('is-playing');
          if (audioCtx) audioCtx.resume().catch(() => {});
          
          // Trigger scroll event to recalculate volumes based on current scroll position
          window.dispatchEvent(new Event('scroll'));
          ambientAudio.play().catch(() => {});
        }
      });
    }

    /* ----------------------------------------------------------
       L. CENSORSHIP HOVER REVEAL (SCRAMBLE)
       ---------------------------------------------------------- */
    document.querySelectorAll('.blackout').forEach(el => {
      const originalText = el.textContent.trim();
      let revealed = false;
      
      el.addEventListener('mouseenter', () => {
        if (revealed) return;
        revealed = true;
        el.classList.remove('blackout');
        el.style.color = '#ff0000';
        el.style.backgroundColor = 'transparent';
        scrambleText(el, originalText, 600);
      });
    });

  } // end initTerrorMechanics

});
