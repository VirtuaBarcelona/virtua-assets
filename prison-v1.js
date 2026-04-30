/* ═══════════════════════════════════════════════════════════════════
   THE PRISON — prison-v1.js
   Virtua Barcelona | Sin City Noir | 2026
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

// ── CONFIG ────────────────────────────────────────────────────────
const CONFIG = {
    lenisLerp:    0.08,
    scrollScrub:  1.5,
    audioVolume:  0.12,
    mobileBreak:  768,
    wpBase:       'https://virtuabarcelona.com/wp-content/uploads/2026/04/',
    cfBase:       'https://iframe.videodelivery.net/',
};

const CF = {
    highlight:  '43af39cf601034a89c73b31616affc81',
    endingGood: 'a92916fd56865ecb8a6b6bd49674d0c6',
    endingBad:  '60b88a586743cb815454e2d753b21b25',
};

// ── STATE ─────────────────────────────────────────────────────────
const state = {
    currentChapter: 0,
    audioEnabled:   false,
    audioCtx:       null,
    currentSource:  null,
    currentGain:    null,
    sfxBuffers:     {},
    isMobile:       window.matchMedia(`(max-width: ${CONFIG.mobileBreak}px)`).matches,
};

// ── BOOT ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    gsap.registerPlugin(ScrollTrigger);
    initLoader();
    initLenis();
    initCursor();
    initProgressNav();
    initGSAP();
    initThreeJS();
    initHotspots();
    initAudio();
    initEvidenceStrings();
    initTrophies();
    initSlider();
    initWantedPoster();
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
});

// ── LOADER ────────────────────────────────────────────────────────
function initLoader() {
    const loader = document.querySelector('#prison-loader');
    const fill   = document.querySelector('#prison-loader-fill');
    if (!loader) return;

    let pct = 0;
    const tick = setInterval(() => {
        pct += Math.random() * 18 + 6;
        if (pct >= 100) {
            pct = 100;
            clearInterval(tick);
            setTimeout(() => {
                loader.classList.add('hidden');
                setTimeout(() => loader.remove(), 900);
            }, 280);
        }
        if (fill) fill.style.width = pct + '%';
    }, 110);
}

// ── LENIS ─────────────────────────────────────────────────────────
function initLenis() {
    window._prisonLenis = new Lenis({
        lerp:           CONFIG.lenisLerp,
        smoothWheel:    true,
        normalizeWheel: false,
    });

    window._prisonLenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => window._prisonLenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    // Audio unlock on first scroll — ESTANDAR_MOBILE §9
    window._prisonLenis.on('scroll', _tryInitAudio);
    window.addEventListener('pointerdown', _tryInitAudio, { once: true, passive: true });

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            state.isMobile = window.matchMedia(`(max-width: ${CONFIG.mobileBreak}px)`).matches;
            ScrollTrigger.refresh(true);
        }, 250);
    });
    window.addEventListener('load', () => setTimeout(() => ScrollTrigger.refresh(true), 500));
}

// ── CURSOR ────────────────────────────────────────────────────────
function initCursor() {
    if (state.isMobile) return;
    const cursor = document.querySelector('#prison-cursor');
    if (!cursor) return;

    let mouseX = 0, mouseY = 0, curX = 0, curY = 0;

    document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });

    const interactiveEls = '.prison-hotspot, .panel-clickable, .photo-hotspot-overlay, .cta-main-btn, .pnav-dot, .trophy-item, .wanted-submit, .modal-close';
    document.querySelectorAll(interactiveEls).forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });

    // Re-bind after modals open
    document.addEventListener('prison:modal-opened', () => {
        document.querySelectorAll(interactiveEls).forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
        });
    });

    (function animateCursor() {
        curX += (mouseX - curX) * 0.15;
        curY += (mouseY - curY) * 0.15;
        cursor.style.transform = `translate(${curX - 14}px, ${curY - 14}px)`;
        requestAnimationFrame(animateCursor);
    })();
}

// ── PROGRESS NAV ──────────────────────────────────────────────────
const CHAPTER_LABELS = [
    'Hero', 'I · Detención', 'II · Celda',
    'III · Tablero', 'IV · Ficha', 'V · Condena', 'VI · Fuga',
];

function initProgressNav() {
    const nav = document.querySelector('#prison-progress-nav');
    if (!nav) return;

    CHAPTER_LABELS.forEach((label, i) => {
        const dot = document.createElement('button');
        dot.className = 'pnav-dot';
        dot.setAttribute('aria-label', label);
        dot.addEventListener('click', () => {
            const target = document.querySelector(`[data-chapter="${i}"]`);
            if (target && window._prisonLenis) {
                window._prisonLenis.scrollTo(target, { duration: 1.2, easing: t => 1 - Math.pow(1 - t, 3) });
            }
        });
        nav.appendChild(dot);
    });

    _setActiveChapter(0);
}

function _setActiveChapter(i) {
    document.querySelectorAll('.pnav-dot').forEach((dot, idx) => {
        dot.classList.toggle('active', idx === i);
    });
}

// ── GSAP SCROLL ───────────────────────────────────────────────────
function initGSAP() {
    gsap.utils.toArray('.prison-section').forEach((section, i) => {
        const chapter   = parseInt(section.dataset.chapter ?? i, 10);
        const hasBudget = section.classList.contains('has-budget') || section.classList.contains('has-budget-lg');
        const budgetVH  = section.classList.contains('has-budget-lg') ? 320 : 250;

        // Chapter tracker
        ScrollTrigger.create({
            trigger:     section,
            start:       'top 55%',
            end:         hasBudget ? `+=${budgetVH}vh` : 'bottom 45%',
            onEnter:     () => _onChapterChange(chapter),
            onEnterBack: () => _onChapterChange(chapter),
        });

        if (!hasBudget) return;

        const panels     = section.querySelectorAll('[data-panel]');
        const bubbles    = section.querySelectorAll('.speech-bubble');
        const specLines  = section.querySelectorAll('[data-spec-line]');
        const specFills  = section.querySelectorAll('.spec-bar-fill');
        const trophyRows = section.querySelectorAll('.trophy-item');

        ScrollTrigger.create({
            trigger: section,
            start:   'top top',
            end:     `+=${budgetVH}vh`,
            scrub:   CONFIG.scrollScrub,
            snap: {
                snapTo:   [0, 1],
                duration: { min: 0.4, max: 0.8 },
                ease:     'power1.inOut',
                onComplete: () => {
                    gsap.fromTo('#prison-flash',
                        { opacity: 1 },
                        { opacity: 0, duration: 0.08, ease: 'none' }
                    );
                },
            },
            onUpdate: self => _animateSection(panels, bubbles, specLines, specFills, trophyRows, self.progress),
        });
    });

    // Evidence board photos enter animation
    ScrollTrigger.create({
        trigger: '#prison-cap-3',
        start:   'top 60%',
        onEnter: () => {
            gsap.utils.toArray('.evidence-photo').forEach((photo, i) => {
                gsap.to(photo, { opacity: 1, y: 0, duration: 0.65, delay: 0.1 + i * 0.14, ease: 'back.out(1.5)' });
            });
            gsap.utils.toArray('.evidence-sticky').forEach((note, i) => {
                gsap.to(note, { opacity: 1, duration: 0.5, delay: 0.55 + i * 0.1 });
            });
        },
    });

    // Electric chair hover SFX
    const cap5 = document.querySelector('#prison-cap-5');
    if (cap5) cap5.addEventListener('mouseenter', () => playSFX('sfx-electric-spark'));
}

function _onChapterChange(chapter) {
    if (state.currentChapter === chapter) return;
    state.currentChapter = chapter;
    _setActiveChapter(chapter);
    playAudioForChapter(chapter);
    gsap.fromTo('#prison-flash', { opacity: 1 }, { opacity: 0, duration: 0.08, ease: 'none' });
}

function _animateSection(panels, bubbles, specLines, specFills, trophyRows, progress) {
    // Comic panels — panel-pop
    panels.forEach((panel, i) => {
        const start = i * 0.1;
        const p = gsap.utils.clamp(0, 1, (progress - start) / 0.18);
        gsap.set(panel, { opacity: p, scale: gsap.utils.interpolate(0.85, 1, p) });
        if (p > 0.05 && !panel._sfxFired) {
            panel._sfxFired = true;
            playSFX('sfx-panel-enter');
        }
    });

    // Speech bubbles
    bubbles.forEach((bub, i) => {
        const start = 0.28 + i * 0.1;
        const p = gsap.utils.clamp(0, 1, (progress - start) / 0.15);
        gsap.set(bub, { clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` });
    });

    // Spec lines
    specLines.forEach((line, i) => {
        const start = 0.2 + i * 0.08;
        const p = gsap.utils.clamp(0, 1, (progress - start) / 0.12);
        gsap.set(line, { opacity: p, x: gsap.utils.interpolate(20, 0, p) });
    });

    // Spec bars
    specFills.forEach(fill => {
        const target = parseInt(fill.dataset.fill ?? 100, 10);
        const p = gsap.utils.clamp(0, 1, (progress - 0.4) / 0.2);
        fill.style.width = (target * p) + '%';
    });

    // Trophy items (Cap 4)
    trophyRows.forEach((row, i) => {
        const start = 0.12 + i * 0.09;
        const p = gsap.utils.clamp(0, 1, (progress - start) / 0.14);
        gsap.set(row, { opacity: p, x: gsap.utils.interpolate(30, 0, p) });
    });
}

// ── THREE.JS ──────────────────────────────────────────────────────
function initThreeJS() {
    if (state.isMobile || typeof THREE === 'undefined') return;
    initCellBars();
    initElectricChair();
}

function initCellBars() {
    const canvas = document.querySelector('#prison-bars-canvas');
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(60, canvas.offsetWidth / canvas.offsetHeight, 0.1, 100);
    camera.position.set(0, 0, 4);

    const barMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.3, metalness: 0.7 });
    for (let i = -4; i <= 4; i++) {
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 10, 8), barMat);
        bar.position.x = i * 0.45;
        scene.add(bar);
    }
    [-2.2, 2.2].forEach(y => {
        const hBar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 4.5, 8), barMat.clone());
        hBar.rotation.z = Math.PI / 2;
        hBar.position.y = y;
        scene.add(hBar);
    });

    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const spot = new THREE.SpotLight(0xffffff, 2.5, 15, Math.PI / 6, 0.3);
    spot.position.set(0, 3, 5);
    scene.add(spot);

    let tX = 0, tY = 0, cX = 0, cY = 0;
    document.addEventListener('mousemove', e => {
        tX = (e.clientX / innerWidth  - 0.5) * 6;
        tY = (e.clientY / innerHeight - 0.5) * -4;
    });

    window.addEventListener('resize', () => {
        camera.aspect = canvas.offsetWidth / canvas.offsetHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    });

    (function animate() {
        requestAnimationFrame(animate);
        cX += (tX - cX) * 0.05;
        cY += (tY - cY) * 0.05;
        spot.position.set(cX, cY + 3, 5);
        renderer.render(scene, camera);
    })();
}

function initElectricChair() {
    const canvas = document.querySelector('#prison-chair-canvas');
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(60, canvas.offsetWidth / canvas.offsetHeight, 0.1, 100);
    camera.position.set(0, 0, 5);

    const COUNT = 400;
    const positions  = new Float32Array(COUNT * 3);
    const velocities = [];

    for (let i = 0; i < COUNT; i++) {
        positions[i*3]   = (Math.random() - 0.5) * 2;
        positions[i*3+1] = Math.random() * 3 - 1;
        positions[i*3+2] = (Math.random() - 0.5) * 2;
        velocities.push({ x: (Math.random()-0.5)*0.02, y: Math.random()*0.03+0.01, life: Math.random() });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xFF4400, size: 0.05, opacity: 0.75, transparent: true });
    scene.add(new THREE.Points(geo, mat));
    scene.add(new THREE.AmbientLight(0xffffff, 0.1));

    window.addEventListener('resize', () => {
        camera.aspect = canvas.offsetWidth / canvas.offsetHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    });

    (function animate() {
        requestAnimationFrame(animate);
        const pos = geo.attributes.position.array;
        for (let i = 0; i < COUNT; i++) {
            pos[i*3]   += velocities[i].x;
            pos[i*3+1] += velocities[i].y;
            pos[i*3+2] += velocities[i].x * 0.5;
            velocities[i].life -= 0.004;
            if (velocities[i].life <= 0) {
                pos[i*3]   = (Math.random()-0.5) * 2;
                pos[i*3+1] = -1;
                pos[i*3+2] = (Math.random()-0.5) * 2;
                velocities[i].life = Math.random();
                velocities[i].x    = (Math.random()-0.5)*0.02;
                velocities[i].y    = Math.random()*0.03+0.01;
            }
        }
        geo.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
    })();
}

// ── HOTSPOTS & MODALES ────────────────────────────────────────────
function initHotspots() {
    document.querySelectorAll('.prison-hotspot, .panel-clickable, .photo-hotspot-overlay').forEach(el => {
        el.addEventListener('click', e => {
            const id = el.dataset.modal;
            if (id) openModal(id, el, e);
        });
    });
}

function openModal(modalId, originEl) {
    closeModal(true);
    playSFX('sfx-modal-open');

    const modal = document.createElement('div');
    modal.id = 'prison-modal';
    modal.innerHTML = _buildModalHTML(modalId);
    document.body.appendChild(modal);

    const rect = originEl.getBoundingClientRect();
    const ox = ((rect.left + rect.width  / 2) / innerWidth  * 100).toFixed(1) + '%';
    const oy = ((rect.top  + rect.height / 2) / innerHeight * 100).toFixed(1) + '%';

    gsap.fromTo(modal.querySelector('.modal-content'),
        { opacity: 0, scale: 0.72, transformOrigin: `${ox} ${oy}` },
        { opacity: 1, scale: 1, duration: 0.38, ease: 'power2.out' }
    );

    modal.querySelector('.modal-close')?.addEventListener('click', () => closeModal());
    modal.querySelector('.modal-backdrop')?.addEventListener('click', () => closeModal());

    document.dispatchEvent(new Event('prison:modal-opened'));
}

function closeModal(silent = false) {
    const modal = document.querySelector('#prison-modal');
    if (!modal) return;
    if (!silent) playSFX('sfx-modal-close');
    modal.querySelectorAll('video').forEach(v => v.pause());
    gsap.to(modal.querySelector('.modal-content'), {
        opacity: 0, scale: 0.88, duration: 0.22, ease: 'power2.in',
        onComplete: () => modal.remove(),
    });
}

function _buildModalHTML(id) {
    const body = MODAL_CONTENTS[id] ?? `<div style="padding:40px;text-align:center;font-family:'Oswald',sans-serif">CONTENIDO NO ENCONTRADO</div>`;
    return `<div class="modal-backdrop"></div><div class="modal-content"><button class="modal-close" aria-label="Cerrar">✕</button>${body}</div>`;
}

const WP = CONFIG.wpBase;
const CF_URL = CONFIG.cfBase;

const MODAL_CONTENTS = {
    'clip-highlight': `
        <div class="modal-video-wrapper">
            <iframe src="${CF_URL}${CF.highlight}?autoplay=true&controls=true&preload=auto"
                allowfullscreen allow="autoplay; fullscreen; picture-in-picture"></iframe>
        </div>`,

    'criminal-file': `
        <div class="modal-file">
            <div class="modal-file-header">EXPEDIENTE POLICIAL — CASO #2719-VB</div>
            <img src="${WP}mugshot.webp" alt="Mugshot" loading="lazy">
            <div class="modal-file-row"><strong>NOMBRE:</strong> <span class="redacted">███████████████</span></div>
            <div class="modal-file-row"><strong>FECHA DETENCIÓN:</strong> <span class="redacted">██ / ██ / 20██</span></div>
            <div class="modal-file-row"><strong>CARGOS:</strong> <span class="redacted">████████████████████</span></div>
            <div class="modal-file-row"><strong>CONDENA:</strong> 60 MINUTOS — FASE EJECUTORIA</div>
            <div class="modal-file-row"><strong>N.º RECLUSO:</strong> #2719-VB</div>
            <div class="modal-file-row"><strong>INSTITUCIÓN:</strong> PRISIÓN ESTATAL BARCELONÉS</div>
            <div class="modal-file-row"><strong>PELIGROSIDAD:</strong> <span style="color:#CC0000;font-weight:700">MÁXIMA — NIVEL 5</span></div>
            <div style="margin-top:14px;font-size:11px;color:#7A7A7A;font-family:'Courier Prime',monospace">
                Documento clasificado. Acceso restringido. Propiedad del Estado.
            </div>
        </div>`,

    'clip-stealth': `
        <div class="modal-video-wrapper">
            <video src="${WP}clip-stealth.webm" controls playsinline></video>
        </div>`,

    'clip-interrogation': `
        <div class="modal-video-wrapper">
            <video src="${WP}clip-interrogation.webm" controls playsinline></video>
        </div>`,

    'clip-cell': `
        <div class="modal-video-wrapper">
            <video src="${WP}clip-cell.webm" controls playsinline></video>
        </div>`,

    'clip-laundry': `
        <div class="modal-video-wrapper">
            <video src="${WP}clip-laundry.webm" controls playsinline></video>
        </div>`,

    'clip-execution': `
        <div class="modal-video-wrapper">
            <video src="${WP}clip-execution.webm" controls playsinline></video>
        </div>`,

    'clip-endings': `
        <div style="padding:14px 18px 8px;background:#1A1A1A">
            <div class="caption-box" style="font-size:11px;background:#CC0000;color:#F0EDE6;border-color:#CC0000">
                DOS CAMINOS. UNA SOLA OPORTUNIDAD.
            </div>
        </div>
        <div class="modal-endings">
            <iframe src="${CF_URL}${CF.endingGood}?controls=true"
                allowfullscreen allow="fullscreen; picture-in-picture"></iframe>
            <iframe src="${CF_URL}${CF.endingBad}?controls=true"
                allowfullscreen allow="fullscreen; picture-in-picture"></iframe>
        </div>
        <div class="modal-endings-label">
            <span>FINAL BUENO — LA FUGA</span>
            <span>FINAL MALO — LA CONDENA</span>
        </div>`,
};

// ── AUDIO ─────────────────────────────────────────────────────────
const AUDIO_MAP = {
    'ambient-chains':       `${WP}ambient-chains.mp3`,
    'ambient-recorder':     `${WP}ambient-recorder.mp3`,
    'ambient-electric-hum': `${WP}ambient-electric-hum.mp3`,
    'ambient-drip':         `${WP}ambient-drip.mp3`,
    'ambient-static':       `${WP}ambient-static.mp3`,
    'ambient-wind':         `${WP}ambient-wind.mp3`,
};

const SFX_MAP = {
    'sfx-modal-open':    `${WP}sfx-modal-open.mp3`,
    'sfx-modal-close':   `${WP}sfx-modal-close.mp3`,
    'sfx-panel-enter':   `${WP}sfx-panel-enter.mp3`,
    'sfx-slider-drag':   `${WP}sfx-slider-drag.mp3`,
    'sfx-electric-spark':`${WP}sfx-electric-spark.mp3`,
    'sfx-trophy-open':   `${WP}sfx-trophy-open.mp3`,
};

let _audioInited = false;

function _tryInitAudio() {
    if (_audioInited) return;
    _audioInited = true;
    if (window._prisonLenis) window._prisonLenis.off('scroll', _tryInitAudio);

    try {
        state.audioCtx    = new (window.AudioContext || window.webkitAudioContext)();
        state.audioEnabled = true;
        _preloadSFX();
        playAudioForChapter(state.currentChapter);
    } catch(e) {
        console.warn('[Prison] Audio unavailable:', e);
    }
}

function initAudio() {
    // Real unlock happens via _tryInitAudio on first scroll/touch
}

function _preloadSFX() {
    if (!state.audioCtx) return;
    Object.entries(SFX_MAP).forEach(([key, url]) => {
        fetch(url)
            .then(r => r.arrayBuffer())
            .then(buf => state.audioCtx.decodeAudioData(buf))
            .then(decoded => { state.sfxBuffers[key] = decoded; })
            .catch(() => {});
    });
}

function playSFX(key) {
    if (!state.audioEnabled || !state.audioCtx || !state.sfxBuffers[key]) return;
    const src  = state.audioCtx.createBufferSource();
    const gain = state.audioCtx.createGain();
    src.buffer = state.sfxBuffers[key];
    gain.gain.value = CONFIG.audioVolume * 1.4;
    src.connect(gain);
    gain.connect(state.audioCtx.destination);
    src.start();
}

function playAudioForChapter(chapterIndex) {
    if (!state.audioEnabled || !state.audioCtx) return;

    const section  = document.querySelector(`[data-chapter="${chapterIndex}"]`);
    const audioKey = section?.dataset.audio;
    if (!audioKey || !AUDIO_MAP[audioKey]) return;

    // Fade out current source
    if (state.currentGain) {
        const g = state.currentGain;
        g.gain.linearRampToValueAtTime(0, state.audioCtx.currentTime + 1.5);
        const src = state.currentSource;
        setTimeout(() => { try { src?.stop(); } catch(e) {} }, 1700);
        state.currentSource = null;
        state.currentGain   = null;
    }

    fetch(AUDIO_MAP[audioKey])
        .then(r => r.arrayBuffer())
        .then(buf => state.audioCtx.decodeAudioData(buf))
        .then(decoded => {
            const src  = state.audioCtx.createBufferSource();
            const gain = state.audioCtx.createGain();
            src.buffer = decoded;
            src.loop   = true;
            gain.gain.setValueAtTime(0, state.audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(CONFIG.audioVolume, state.audioCtx.currentTime + 1.5);
            src.connect(gain);
            gain.connect(state.audioCtx.destination);
            src.start();
            state.currentSource = src;
            state.currentGain   = gain;
        })
        .catch(() => {});
}

// ── EVIDENCE STRINGS ──────────────────────────────────────────────
function initEvidenceStrings() {
    const board  = document.querySelector('#prison-evidence-board');
    const photos = board?.querySelectorAll('.evidence-photo');
    const svg    = board?.querySelector('.evidence-strings-svg');
    if (!svg || !photos || photos.length < 4) return;

    const CONNECTIONS = [[0, 1], [1, 3], [0, 2], [2, 3], [1, 2]];

    function drawStrings() {
        const br  = board.getBoundingClientRect();
        const pts = Array.from(photos).map(p => {
            const r = p.getBoundingClientRect();
            return { x: r.left - br.left + r.width / 2, y: r.top - br.top + r.height / 2 };
        });

        svg.innerHTML = CONNECTIONS.map(([a, b], i) => {
            const ox = (i % 2 === 0 ? -25 : 25);
            const oy = (i % 3 === 0 ? -35 : 20);
            const mx = (pts[a].x + pts[b].x) / 2 + ox;
            const my = (pts[a].y + pts[b].y) / 2 + oy;
            return `<path class="evidence-string"
                d="M ${pts[a].x.toFixed(1)} ${pts[a].y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${pts[b].x.toFixed(1)} ${pts[b].y.toFixed(1)}"
                stroke="#CC0000" stroke-width="1.5" fill="none" opacity="0.65"
                stroke-dasharray="1000" stroke-dashoffset="1000"/>`;
        }).join('');
    }

    drawStrings();
    window.addEventListener('resize', drawStrings);

    ScrollTrigger.create({
        trigger: '#prison-cap-3',
        start:   'top 50%',
        onEnter: () => {
            svg.querySelectorAll('.evidence-string').forEach((path, i) => {
                gsap.to(path, {
                    strokeDashoffset: 0,
                    duration: 0.9,
                    delay:    0.6 + i * 0.15,
                    ease:     'power2.inOut',
                });
            });
        },
    });
}

// ── TROFEOS ───────────────────────────────────────────────────────
function initTrophies() {
    document.querySelectorAll('.trophy-item').forEach(btn => {
        const desc = btn.nextElementSibling;
        if (!desc?.classList.contains('trophy-desc')) return;

        btn.addEventListener('click', () => {
            playSFX('sfx-trophy-open');
            const wasOpen = btn.classList.contains('open');

            document.querySelectorAll('.trophy-item.open').forEach(b => {
                b.classList.remove('open');
                b.setAttribute('aria-expanded', 'false');
                b.nextElementSibling?.classList.remove('expanded');
            });

            if (!wasOpen) {
                btn.classList.add('open');
                btn.setAttribute('aria-expanded', 'true');
                desc.classList.add('expanded');
            }
        });
    });
}

// ── SPLIT SLIDER ──────────────────────────────────────────────────
function initSlider() {
    const handle = document.querySelector('#slider-handle');
    const left   = document.querySelector('#slider-left');
    const right  = document.querySelector('#slider-right');
    if (!handle || !left || !right) return;

    let dragging  = false;
    let sfxSource = null;

    function startDrag() {
        dragging = true;
        _startSliderSFX();
    }
    function endDrag() {
        dragging = false;
        _stopSliderSFX();
    }
    function moveSlider(clientX) {
        if (!dragging) return;
        const slider = document.querySelector('#prison-split-slider');
        const rect = slider.getBoundingClientRect();
        const pct  = Math.max(15, Math.min(85, (clientX - rect.left) / rect.width * 100));
        left.style.width   = pct + '%';
        right.style.width  = (100 - pct) + '%';
        handle.style.left  = pct + '%';
    }

    handle.addEventListener('mousedown',  startDrag);
    handle.addEventListener('touchstart', startDrag, { passive: true });
    window.addEventListener('mouseup',    endDrag);
    window.addEventListener('touchend',   endDrag);
    window.addEventListener('mousemove',  e => moveSlider(e.clientX));
    window.addEventListener('touchmove',  e => moveSlider(e.touches[0].clientX), { passive: true });

    function _startSliderSFX() {
        if (!state.audioEnabled || !state.audioCtx || !state.sfxBuffers['sfx-slider-drag']) return;
        sfxSource = state.audioCtx.createBufferSource();
        const gain = state.audioCtx.createGain();
        sfxSource.buffer = state.sfxBuffers['sfx-slider-drag'];
        sfxSource.loop   = true;
        gain.gain.value  = CONFIG.audioVolume * 0.8;
        sfxSource.connect(gain);
        gain.connect(state.audioCtx.destination);
        sfxSource.start();
    }
    function _stopSliderSFX() {
        try { sfxSource?.stop(); } catch(e) {}
        sfxSource = null;
    }
}

// ── WANTED POSTER ─────────────────────────────────────────────────
function initWantedPoster() {
    const form    = document.querySelector('#prison-wanted-form');
    const canvas  = document.querySelector('#prison-wanted-canvas');
    const actions = document.querySelector('#prison-wanted-actions');
    const dlBtn   = document.querySelector('#prison-wanted-download');
    const shareBtn = document.querySelector('#prison-wanted-share');
    if (!form || !canvas) return;

    form.addEventListener('submit', e => {
        e.preventDefault();
        const name  = (form.querySelector('[name="nombre"]').value || 'DESCONOCIDO').trim().toUpperCase();
        const crime = form.querySelector('[name="crimen"]').value;

        generateWantedPoster(canvas, name, crime);
        canvas.style.display = 'block';
        if (actions) actions.style.display = 'flex';

        if (dlBtn) {
            dlBtn.href     = canvas.toDataURL('image/png');
            dlBtn.download = `wanted-${name.replace(/\s+/g, '_')}.png`;
        }

        canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    shareBtn?.addEventListener('click', async () => {
        const name = form.querySelector('[name="nombre"]').value || 'DESCONOCIDO';
        if (navigator.share) {
            try {
                const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
                await navigator.share({
                    title: 'Mi cartel de buscado — The Prison',
                    text:  `${name} es buscado en The Prison · Virtua Barcelona`,
                    files: [new File([blob], 'wanted.png', { type: 'image/png' })],
                });
            } catch(err) { dlBtn?.click(); }
        } else {
            dlBtn?.click();
        }
    });
}

function generateWantedPoster(canvas, name, crime) {
    const ctx = canvas.getContext('2d');
    const W = 600, H = 800;
    canvas.width = W; canvas.height = H;

    // Fondo papel envejecido
    ctx.fillStyle = '#C8B89A';
    ctx.fillRect(0, 0, W, H);

    // Grain
    for (let i = 0; i < 9000; i++) {
        ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.035})`;
        ctx.fillRect(Math.random() * W | 0, Math.random() * H | 0, 1, 1);
    }

    // Bordes dobles
    ctx.strokeStyle = '#0A0A0A';
    ctx.lineWidth = 10;
    ctx.strokeRect(14, 14, W - 28, H - 28);
    ctx.lineWidth = 2;
    ctx.strokeRect(22, 22, W - 44, H - 44);

    // Header
    ctx.fillStyle = '#0A0A0A';
    ctx.textAlign = 'center';
    ctx.font = `bold 72px 'Bebas Neue', sans-serif`;
    ctx.fillText('SE BUSCA', W / 2, 95);

    ctx.font = `600 20px 'Oswald', sans-serif`;
    ctx.fillText('VIVO O MUERTO', W / 2, 126);

    // Línea separadora
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 140); ctx.lineTo(W - 40, 140);
    ctx.stroke();

    // Mugshot placeholder
    const mX = 160, mY = 156, mW = 280, mH = 340;
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(mX, mY, mW, mH);
    // Silueta cabeza
    ctx.fillStyle = '#1c1c1c';
    ctx.beginPath();
    ctx.arc(W / 2, mY + 110, 58, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(W / 2 - 68, mY + 162, 136, 140);

    // Sello rojo
    ctx.save();
    ctx.translate(448, 218);
    ctx.rotate(0.32);
    ctx.strokeStyle = 'rgba(204,0,0,0.75)';
    ctx.lineWidth = 3;
    ctx.strokeRect(-48, -24, 96, 48);
    ctx.fillStyle = 'rgba(204,0,0,0.7)';
    ctx.font = `bold 17px 'Oswald', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('PELIGROSO', 0, 7);
    ctx.restore();

    // Línea separadora
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 510); ctx.lineTo(W - 40, 510);
    ctx.stroke();

    // Nombre
    ctx.fillStyle = '#CC0000';
    ctx.textAlign = 'center';
    ctx.font = `bold 52px 'Bebas Neue', sans-serif`;
    ctx.fillText(name.substring(0, 18), W / 2, 572);

    // Datos
    ctx.fillStyle = '#0A0A0A';
    ctx.font = `600 19px 'Oswald', sans-serif`;
    ctx.fillText(`CARGO: ${crime.toUpperCase()}`, W / 2, 614);

    ctx.font = `400 13px 'Courier Prime', monospace`;
    ctx.fillStyle = '#333';
    ctx.fillText('N.º RECLUSO: #2719-VB', W / 2, 648);
    ctx.fillText('PRISIÓN ESTATAL BARCELONÉS', W / 2, 670);

    // Línea footer
    ctx.strokeStyle = '#0A0A0A';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 694); ctx.lineTo(W - 40, 694);
    ctx.stroke();

    ctx.fillStyle = '#0A0A0A';
    ctx.font = `bold 22px 'Bebas Neue', sans-serif`;
    ctx.fillText('THE PRISON — VIRTUA BARCELONA', W / 2, 730);

    ctx.fillStyle = '#555';
    ctx.font = `400 12px 'Courier Prime', monospace`;
    ctx.fillText('virtuabarcelona.com/the-prison', W / 2, 755);
}
