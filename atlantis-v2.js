// =========================================================================
// VIRTUA ATLANTIS V2 - MOTOR PRINCIPAL
// =========================================================================

// =========================================================================
// 1. UTILIDADES Y SÓNAR
// =========================================================================
function fireSonarPing(x = '50%', y = '50%') {
  const wave = document.getElementById('at-sonar-wave');
  if (!wave) return;
  
  wave.style.setProperty('--at-sonar-x', typeof x === 'number' ? x + 'px' : x);
  wave.style.setProperty('--at-sonar-y', typeof y === 'number' ? y + 'px' : y);
  
  wave.classList.remove('at-active');
  void wave.offsetWidth; 
  wave.classList.add('at-active');
  
  wave.addEventListener('animationend', () => wave.classList.remove('at-active'), { once: true });
  
  // Ping en HUD
  const hudSonar = document.getElementById('at-hud-sonar');
  if (hudSonar) {
    hudSonar.classList.remove('at-ping');
    void hudSonar.offsetWidth;
    hudSonar.classList.add('at-ping');
  }

  // Reproducir audio
  const sonarAudio = document.getElementById('at-audio-sonar');
  if (sonarAudio) {
    sonarAudio.currentTime = 0;
    sonarAudio.play().catch(() => {});
  }
}

// =========================================================================
// 2. TEXT SCRAMBLE (Encriptación Atlante)
// =========================================================================
class AtlantisTextScramble {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\\\/[]{}—=+*^?#________';
    this.update = this.update.bind(this);
  }
  setText(newText) {
    const oldText = this.el.innerText;
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise((resolve) => this.resolve = resolve);
    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || '';
      const to = newText[i] || '';
      const start = Math.floor(Math.random() * 40);
      const end = start + Math.floor(Math.random() * 40);
      this.queue.push({ from, to, start, end });
    }
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }
  update() {
    let output = '';
    let complete = 0;
    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { from, to, start, end, char } = this.queue[i];
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.randomChar();
          this.queue[i].char = char;
        }
        output += `<span class="at-scramble-char">${char}</span>`;
      } else {
        output += from;
      }
    }
    this.el.innerHTML = output;
    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }
  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
}

function triggerSectionReveal(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section || section.dataset.revealed) return;
  section.dataset.revealed = 'true';

  section.querySelectorAll('[data-scramble]').forEach(el => {
    const target = el.getAttribute('data-scramble');
    new AtlantisTextScramble(el).setText(target);
  });

  gsap.fromTo(section.querySelectorAll('.at-kpi, .at-runes-wrap, .at-glass-panel, .at-gallery-item, .at-gallery-title'), {
    opacity: 0, y: 30
  }, {
    opacity: 1, y: 0,
    stagger: 0.15,
    duration: 1.2,
    ease: 'power2.out'
  });
}

// =========================================================================
// 3. SISTEMA DE PROFUNDIDAD
// =========================================================================
function initDepthScroll() {
  const depthEl = document.getElementById('at-depth-value');
  const statusEl = document.getElementById('at-hud-status');
  const contentEl = document.getElementById('at-content');

  if (!depthEl || !contentEl) return;

  const DEPTH_STAGES = [
    { depth: 0,    stage: 0, status: 'SUPERFICIE',                  section: null },
    { depth: 200,  stage: 1, status: 'ZONA CREPUSCULAR',            section: null },
    { depth: 700,  stage: 2, status: 'ZONA MEDIA · INTEL ACTIVO',   section: 'at-briefing' },
    { depth: 1400, stage: 3, status: 'ZONA ABISAL · ARCHIVOS',      section: 'at-gallery-section' },
    { depth: 2100, stage: 4, status: 'FONDO ALCANZADO',             section: 'at-cta-section' },
    { depth: 2450, stage: 4, status: 'ESTRUCTURA CONFIRMADA',       section: null },
  ];

  let lastStage = -1;

  ScrollTrigger.create({
    trigger: contentEl,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate(self) {
      const depth = Math.round(self.progress * 2450);
      depthEl.textContent = depth.toLocaleString('es-ES');

      const stageData = [...DEPTH_STAGES].reverse().find(s => depth >= s.depth);
      if (!stageData) return;

      document.body.style.setProperty('--at-depth-progress', self.progress);

      if (stageData.stage !== lastStage) {
        lastStage = stageData.stage;
        document.body.setAttribute('data-depth-stage', stageData.stage);
        statusEl.textContent = stageData.status;
        
        // No hacer ping en el 0
        if (stageData.stage > 0) {
          fireSonarPing();
        }

        if (stageData.section) {
          triggerSectionReveal(stageData.section);
        }
      }
    }
  });
}

// =========================================================================
// 4. GALERÍA
// =========================================================================
function initGalleryDesktop() {
  if (window.matchMedia('(pointer: coarse)').matches) return; 

  const track = document.getElementById('at-gallery-track');
  const section = document.getElementById('at-gallery-section');
  if (!track || !section) return;

  const totalWidth = () => track.scrollWidth - window.innerWidth;

  ScrollTrigger.create({
    trigger: section,
    pin: true,
    start: 'top top',
    end: () => `+=${totalWidth() + window.innerHeight}`,
    scrub: 1,
    invalidateOnRefresh: true,
    onUpdate(self) {
      gsap.set(track, { x: -totalWidth() * self.progress });
    }
  });
}

function initGalleryMobile() {
  if (!window.matchMedia('(pointer: coarse)').matches) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      e.target.classList.toggle('at-active', e.isIntersecting);
    });
  }, { rootMargin: '-40% 0px -40% 0px' });

  document.querySelectorAll('.at-gallery-item').forEach(el => observer.observe(el));
}

// =========================================================================
// 5. STICKY BUTTON Y BOOT GATE
// =========================================================================
function initStickyBtn() {
  const btn = document.getElementById('at-sticky-btn');
  if (!btn) return;

  const targets = [
    document.getElementById('at-cta-section'),
    document.querySelector('#colophon'),
    document.querySelector('.site-footer'),
    document.querySelector('.site-below-footer-wrap'),
  ].filter(Boolean);

  if (!targets.length) return;

  const observer = new IntersectionObserver((entries) => {
    const visible = entries.some(e => e.isIntersecting);
    btn.classList.toggle('at-sticky--hidden', visible);
  });

  targets.forEach(t => observer.observe(t));
}

function initBootGate() {
  const gate = document.getElementById('at-boot-gate');
  const btn = document.getElementById('at-boot-cta');
  const wipe = document.getElementById('at-portal-wipe');
  if (!gate || !btn || !wipe) return;

  gsap.from('#at-boot-content > *', {
    opacity: 0, y: 20,
    stagger: 0.18,
    duration: 0.7,
    ease: 'power2.out',
    delay: 0.3,
  });

  btn.addEventListener('click', () => {
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top  + rect.height / 2;

    wipe.style.setProperty('--at-wipe-x', cx + 'px');
    wipe.style.setProperty('--at-wipe-y', cy + 'px');
    wipe.classList.add('at-wipe-active');

    // Arrancar ambient audio
    const ambient = document.getElementById('at-audio-ambient');
    if(ambient){
      ambient.volume = 0.25;
      ambient.play().catch(() => {});
    }

    wipe.addEventListener('animationend', () => {
      gate.style.display = 'none';
      wipe.classList.remove('at-wipe-active');
    }, { once: true });
  });
}

function initCTAPortal() {
  const btn = document.getElementById('at-cta-btn');
  const wipe = document.getElementById('at-portal-wipe');
  if (!btn || !wipe) return;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    wipe.style.setProperty('--at-wipe-x', e.clientX + 'px');
    wipe.style.setProperty('--at-wipe-y', e.clientY + 'px');
    wipe.classList.add('at-wipe-active');
    
    if (!e.clientX) {
      wipe.style.setProperty('--at-wipe-x', '50%');
      wipe.style.setProperty('--at-wipe-y', '50%');
    }
    
    const portalAudio = document.getElementById('at-audio-portal');
    if(portalAudio) portalAudio.play().catch(() => {});

    wipe.addEventListener('animationend', () => {
      window.location.href = btn.href;
    }, { once: true });
  });
}

// =========================================================================
// 6. HERO VIDEO & WEBGL TURBULENCE
// =========================================================================
function initHeroVideo() {
  const isMobile = window.innerWidth <= 768;
  const activeVideo = isMobile ? document.getElementById('at-video-v') : document.getElementById('at-video-h');
  if (activeVideo) {
    activeVideo.play().catch(e => console.warn("Video autoplay prevented.", e));
  }
  return activeVideo;
}

let turbLoc = null;
let gl = null;

function initWebGL(activeVideo) {
  const canvas = document.getElementById('at-webgl-canvas');
  if (!canvas || !activeVideo) return;

  gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return;

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;
  gl.viewport(0, 0, width, height);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    gl.viewport(0, 0, width, height);
  });

  const vsSource = `
    attribute vec2 a_pos;
    varying vec2 v_uv;
    void main() {
      gl_Position = vec4(a_pos, 0.0, 1.0);
      v_uv = a_pos * 0.5 + 0.5;
      v_uv.y = 1.0 - v_uv.y; 
    }
  `;

  const fsSource = `
    precision highp float;
    varying vec2 v_uv;
    uniform sampler2D u_img;
    uniform float u_time;
    uniform float u_turbulence;
    void main() {
      vec2 uv = v_uv;
      float turb = 0.015 + u_turbulence * 0.025;
      float wave1 = sin(uv.y * 12.0 + u_time * 1.5) * turb;
      float wave2 = cos(uv.x * 8.0 + u_time * 2.0) * turb;
      uv.x += wave1;
      uv.y += wave2;
      gl_FragColor = texture2D(u_img, uv);
    }
  `;

  function compileShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, vsSource));
  gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, fsSource));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(prog, "a_pos");
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  const timeLoc = gl.getUniformLocation(prog, "u_time");
  turbLoc = gl.getUniformLocation(prog, "u_turbulence");

  function draw(time) {
    if (activeVideo.readyState >= 3) {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, activeVideo);
    }
    gl.uniform1f(timeLoc, time * 0.001);
    
    // Default turbulence without scroll is 0
    if (!turbLoc._updated) gl.uniform1f(turbLoc, 0.0);
    
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}

// =========================================================================
// 7. PARTICLES
// =========================================================================
function initParticles() {
  const canvas = document.getElementById('at-particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const resize = () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const PARTICLE_COUNT = window.matchMedia('(pointer: coarse)').matches ? 40 : 80;

  const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
    x:     Math.random() * canvas.width,
    y:     Math.random() * canvas.height,
    r:     Math.random() * 2.5 + 0.5,
    speedY: -(Math.random() * 0.5 + 0.2),
    speedX: (Math.random() - 0.5) * 0.1,
    opacity: Math.random() * 0.4 + 0.1,
  }));

  (function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const baseAlpha = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--at-particle-alpha') || '0.5'
    );
    particles.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX;
      if (p.y < -5) { p.y = canvas.height + 5; p.x = Math.random() * canvas.width; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180,240,255,${p.opacity * baseAlpha})`;
      ctx.fill();
    });
    requestAnimationFrame(render);
  })();
}

// =========================================================================
// 8. AUDIO
// =========================================================================
function initAudio() {
  const ambient = document.getElementById('at-audio-ambient');
  if(!ambient) return;
  
  ScrollTrigger.create({
    trigger: '#at-content',
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate(self) {
      if (!ambient.paused) ambient.volume = 0.25 + self.progress * 0.4;
    }
  });
}

// =========================================================================
// 9. CORE INIT (LENIS + START)
// =========================================================================
function initLenis() {
  const lenis = new Lenis({
    lerp: 0.09,           
    smoothTouch: false,
    overscroll: false,
  });

  lenis.on('scroll', ScrollTrigger.update);
  
  lenis.on('scroll', ({ velocity }) => {
    const turbulence = Math.min(Math.abs(velocity) / 60, 1.0);
    if (gl && turbLoc) {
      turbLoc._updated = true;
      gl.uniform1f(turbLoc, turbulence);
    }
  });

  gsap.ticker.add((time) => { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

function initScrollTriggerRefresh() {
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => ScrollTrigger.refresh(true), 250);
  });
  window.addEventListener('load', () => setTimeout(() => ScrollTrigger.refresh(true), 500));
  window.addEventListener('orientationchange', () => setTimeout(() => ScrollTrigger.refresh(true), 300), { passive: true });
}

function atInit() {
  gsap.registerPlugin(ScrollTrigger);

  const lenis = initLenis();
  initBootGate();
  initParticles();
  
  const activeVideo = initHeroVideo();
  initWebGL(activeVideo);
  
  initDepthScroll();
  initGalleryDesktop();
  initGalleryMobile();
  initCTAPortal();
  initAudio();
  initStickyBtn();
  initScrollTriggerRefresh();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', atInit);
} else {
  atInit();
}
