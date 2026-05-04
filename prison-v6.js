/* ═══════════════════════════════════════════════════════════════════
   THE PRISON — prison-v1.js  v1.1
   Virtua Barcelona | Sin City Noir | 2026
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

// ── CONFIG ────────────────────────────────────────────────────────
const CONFIG = {
    lenisLerp:    0.08,
    scrollScrub:  1.2,
    audioVolume:  0.28,
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
    currentChapter: -1,
    audioEnabled:   false,
    currentAudio:   null,
    isMobile:       window.matchMedia(`(max-width: ${CONFIG.mobileBreak}px)`).matches,
};

// ── PANEL ENTRY DIRECTIONS (per data-panel index, from GUIA-DISENO) ─
const PANEL_FROM = {
    '0': { x: -80, y:   0 },   // Panel izquierda — entra desde izquierda
    '1': { x:  80, y:   0 },   // Panel derecha — entra desde derecha
    '2': { x:  60, y:  35 },   // Panel bot derecha — desde derecha-abajo
    '3': { x:  80, y:   0 },   // Specs panel — desde derecha
    '4': { x:   0, y:  60 },   // Panel inferior — desde abajo
    '5': { x:  60, y:   0 },   // CTA overlay — desde derecha
};

// ── BOOT ──────────────────────────────────────────────────────────
function _boot() {
    gsap.registerPlugin(ScrollTrigger);
    _initEvidencePhotoStates();
    initHeroAnim();
    initLoader();
    initLenis();
    initIntroScreen();
    initCursor();
    initProgressNav();
    initCTAScene();
    initGSAP();
    initThreeJS();
    initHotspots();
    initEvidenceStrings();
    initTrophies();
    initSlider();
    initWantedPoster();
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _boot);
} else {
    _boot();
}

// ── PRE-INIT: fijar estado inicial de fotos del tablero ───────────
function _initEvidencePhotoStates() {
    document.querySelectorAll('.evidence-photo').forEach(photo => {
        const m   = photo.style.transform?.match(/rotate\((-?[\d.]+)deg\)/);
        const rot = parseFloat(m?.[1] ?? 0);
        photo.dataset.initRot = rot;
        photo.style.transform = '';
        gsap.set(photo, { opacity: 0, y: -28, rotation: rot });
    });
}

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
                setTimeout(() => { loader.style.display = 'none'; }, 900);
            }, 280);
        }
        if (fill) fill.style.width = pct + '%';
    }, 110);
}

// ── LENIS ─────────────────────────────────────────────────────────
function initLenis() {
    window._prisonLenis = new Lenis({
        lerp:           CONFIG.lenisLerp,
        smoothWheel:    false,  // wheel gestionado por capture listener en inline script
        normalizeWheel: false,
    });

    window._prisonLenis.on('scroll', ScrollTrigger.update);
    window._prisonLenis.on('scroll', _tryInitAudio);
    gsap.ticker.add(time => window._prisonLenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    // Audio unlock — también via eventos nativos por si Lenis no está activo aún
    _UNLOCK_EVENTS.forEach(ev => window.addEventListener(ev, _tryInitAudio, { passive: true }));

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

    document.addEventListener('mousemove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Usar delegación de eventos para no perder hover al agregar elementos dinámicos
    document.addEventListener('mouseenter', e => {
        if (!(e.target instanceof Element)) return;
        if (e.target.matches('.prison-hotspot, .panel-clickable, .photo-hotspot-overlay, .cta-main-btn, .pnav-dot, .trophy-item, .wanted-submit, .modal-close, .trophy-desc, button')) {
            cursor.classList.add('hover');
        }
    }, true);
    document.addEventListener('mouseleave', e => {
        if (!(e.target instanceof Element)) return;
        if (e.target.matches('.prison-hotspot, .panel-clickable, .photo-hotspot-overlay, .cta-main-btn, .pnav-dot, .trophy-item, .wanted-submit, .modal-close, .trophy-desc, button')) {
            cursor.classList.remove('hover');
        }
    }, true);

    let _curScale = 1;
    (function animateCursor() {
        curX    += (mouseX - curX) * 0.15;
        curY    += (mouseY - curY) * 0.15;
        _curScale += ((cursor.classList.contains('hover') ? 1.6 : 1) - _curScale) * 0.18;
        cursor.style.transform = `translate(${curX - 14}px, ${curY - 14}px) scale(${_curScale.toFixed(3)})`;
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
    document.querySelectorAll('.pnav-dot').forEach((dot, idx) => dot.classList.toggle('active', idx === i));
}

// ── GSAP SCROLL ───────────────────────────────────────────────────
function initGSAP() {
    // Desactivar normalización de scroll de GSAP — conflicta con Lenis
    ScrollTrigger.normalizeScroll(false);

    gsap.utils.toArray('.prison-section').forEach((section, i) => {
        const chapter   = parseInt(section.dataset.chapter ?? i, 10);
        const hasBudget = section.classList.contains('has-budget') || section.classList.contains('has-budget-lg') || section.classList.contains('has-budget-sm') || section.classList.contains('has-budget-md');
        const budgetVH  = section.classList.contains('has-budget-lg') ? 400
                        : section.classList.contains('has-budget-md') ? 200
                        : section.classList.contains('has-budget-sm') ? 150 : 250;
        // GSAP ignora unidades 'vh' en end — convertir a px con función para que recalcule en resize
        const budgetPX  = () => `+=${budgetVH * window.innerHeight / 100}`;

        // Chapter tracker (NO snap — sólo detección)
        ScrollTrigger.create({
            trigger:     section,
            start:       'top 55%',
            end:         hasBudget ? budgetPX : 'bottom 45%',
            onEnter:     () => _onChapterChange(chapter),
            onEnterBack: () => _onChapterChange(chapter),
        });

        if (!hasBudget) return;

        // Excluir paneles que ya tienen opacity:1 inline (paneles Cap 2 que son siempre visibles)
        const panels       = Array.from(section.querySelectorAll('[data-panel]'))
                               .filter(p => p.style.opacity !== '1');
        const bubbles      = section.querySelectorAll('.speech-bubble');
        const specLines    = section.querySelectorAll('[data-spec-line]');
        const specFills    = section.querySelectorAll('.spec-bar-fill');
        const trophyRows   = section.querySelectorAll('.trophy-item');
        const evidPhotos   = Array.from(section.querySelectorAll('.evidence-photo'));
        const evidStickies = Array.from(section.querySelectorAll('.evidence-sticky'));
        const evidSvg      = section.querySelector('.evidence-strings-svg');

        if (evidStickies.length) gsap.set(evidStickies, { opacity: 0 });

        const stickyEl = section.querySelector('.sticky-content');
        ScrollTrigger.create({
            trigger:             section,
            start:               'top top',
            end:                 budgetPX,
            pin:                 stickyEl,
            pinSpacing:          false,
            anticipatePin:       1,
            invalidateOnRefresh: true,
            scrub:               section.dataset.scene === 'cta-reveal' ? 0.4 : CONFIG.scrollScrub,
            onEnter:     () => { stickyEl.style.zIndex = '200'; },
            onLeave:     () => { stickyEl.style.zIndex = ''; },
            onEnterBack: () => { stickyEl.style.zIndex = '200'; },
            onLeaveBack: () => {
                stickyEl.style.zIndex = '';
                if (section.dataset.scene === 'cta-reveal') _resetCTAScene(section);
            },
            onUpdate: self => {
                _animateSection(panels, bubbles, specLines, specFills, trophyRows, self.progress);
                if (evidPhotos.length) _animateEvidenceBoard(evidPhotos, evidStickies, evidSvg, self.progress);
                if (section.dataset.scene === 'cta-reveal') _animateCTAScene(self.progress);
            },
        });

        // Spec lines en Cap 2: animar desde estado oculto
        if (specLines.length) {
            gsap.set(Array.from(specLines), { opacity: 0, x: 20 });
        }
    });

    // Cap-3 evidence board animado por scroll (via onUpdate del pin — ver arriba)

    // Cap 5 — hover SFX silla eléctrica (debounce 2s para no apilarse)
    let _sparkTimer = null;
    const cap5 = document.querySelector('#prison-cap-5');
    if (cap5) cap5.addEventListener('mouseenter', () => {
        if (_sparkTimer) return;
        playSFX('sfx-electric-spark');
        _sparkTimer = setTimeout(() => { _sparkTimer = null; }, 2000);
    }, false);
}

function _onChapterChange(chapter) {
    if (state.currentChapter === chapter) return;
    state.currentChapter = chapter;
    _setActiveChapter(chapter);
    playAudioForChapter(chapter);
    gsap.timeline()
        .to('#prison-flash', { opacity: 1, duration: 0.12, ease: 'none' })
        .to('#prison-flash', { opacity: 0, duration: 0.5,  ease: 'power2.out' });
}

function _animateSection(panels, bubbles, specLines, specFills, trophyRows, progress) {
    // Paneles cómics — panel-pop CON dirección de entrada
    panels.forEach((panel, i) => {
        const from  = PANEL_FROM[panel.dataset.panel] ?? { x: 0, y: 0 };
        const start = i * 0.08;
        const p     = gsap.utils.clamp(0, 1, (progress - start) / 0.15);

        gsap.set(panel, {
            opacity: p,
            scale:   gsap.utils.interpolate(0.88, 1, p),
            x:       gsap.utils.interpolate(from.x, 0, p),
            y:       gsap.utils.interpolate(from.y, 0, p),
        });

        if (p > 0.05 && !panel._sfxFired) {
            panel._sfxFired = true;
            playSFX('sfx-panel-enter');
        }
    });

    // Speech bubbles — clip-path reveal
    bubbles.forEach((bub, i) => {
        const start = 0.18 + i * 0.08;
        const p     = gsap.utils.clamp(0, 1, (progress - start) / 0.12);
        gsap.set(bub, { clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` });
    });

    // Spec lines — slide in desde derecha
    specLines.forEach((line, i) => {
        const start = 0.05 + i * 0.06;
        const p     = gsap.utils.clamp(0, 1, (progress - start) / 0.1);
        gsap.set(line, { opacity: p, x: gsap.utils.interpolate(20, 0, p) });
    });

    // Spec bars — fill
    specFills.forEach(fill => {
        const target = parseInt(fill.dataset.fill ?? 100, 10);
        const p      = gsap.utils.clamp(0, 1, (progress - 0.3) / 0.2);
        fill.style.width = (target * p) + '%';
    });

    // Trophy items — slide in desde derecha (Cap 4)
    trophyRows.forEach((row, i) => {
        const start = 0.03 + i * 0.07;
        const p     = gsap.utils.clamp(0, 1, (progress - start) / 0.1);
        gsap.set(row, { opacity: p, x: gsap.utils.interpolate(20, 0, p) });
    });
}

function _animateEvidenceBoard(photos, stickies, svg, progress) {
    // Fotos: primer tercio del scroll (3% → 34%) — terminan rápido para dar tiempo de clickar
    photos.forEach((photo, i) => {
        const start = 0.03 + i * 0.07;
        const p     = gsap.utils.clamp(0, 1, (progress - start) / 0.10);
        const rot   = parseFloat(photo.dataset.initRot ?? 0);
        gsap.set(photo, {
            opacity:  p,
            y:        gsap.utils.interpolate(-28, 0, p),
            rotation: gsap.utils.interpolate(rot + (i % 2 === 0 ? -6 : 6), rot, p),
        });
    });

    // Stickies: mitad-tres cuartos (35% → 65%)
    stickies.forEach((note, i) => {
        const start = 0.35 + i * 0.07;
        const p     = gsap.utils.clamp(0, 1, (progress - start) / 0.12);
        gsap.set(note, { opacity: p });
    });

    // Strings: segunda mitad (46% → 82%) — lazy cache para evitar DOM query en cada frame
    if (svg) {
        if (!svg._strings || !svg._strings.length) {
            svg._strings = Array.from(svg.querySelectorAll('.evidence-string'));
        }
        svg._strings.forEach((path, i) => {
            const start = 0.46 + i * 0.055;
            const p     = gsap.utils.clamp(0, 1, (progress - start) / 0.14);
            path.setAttribute('stroke-dashoffset', ((1 - p) * 1000).toFixed(1));
        });
    }
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

    // Defer to ensure CSS layout is computed — canvas.offsetWidth is 0 at DOMContentLoaded
    requestAnimationFrame(() => {
    const cW = canvas.offsetWidth  || canvas.parentElement?.offsetWidth  || Math.round(window.innerWidth * 0.55);
    const cH = canvas.offsetHeight || canvas.parentElement?.offsetHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(cW, cH);

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(60, cW / cH, 0.1, 100);
    camera.position.set(0, 0, 4);

    const barMat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.15, metalness: 0.85 });
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

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const spot = new THREE.SpotLight(0xffffff, 5, 20, Math.PI / 5, 0.4);
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
    }); // end requestAnimationFrame
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

    const COUNT    = 400;
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
    const ox   = ((rect.left + rect.width  / 2) / innerWidth  * 100).toFixed(1) + '%';
    const oy   = ((rect.top  + rect.height / 2) / innerHeight * 100).toFixed(1) + '%';

    gsap.fromTo(modal.querySelector('.modal-content'),
        { opacity: 0, scale: 0.72, transformOrigin: `${ox} ${oy}` },
        { opacity: 1, scale: 1, duration: 0.38, ease: 'power2.out' }
    );

    modal.querySelector('.modal-close')?.addEventListener('click',    () => closeModal());
    modal.querySelector('.modal-backdrop')?.addEventListener('click', () => closeModal());

    // Autoclose when video ends (no controls)
    const autoCloseVid = modal.querySelector('video[data-autoclose]');
    if (autoCloseVid) {
        autoCloseVid.addEventListener('ended', () => closeModal());
    }

    // Autoclose for Cloudflare Stream iframe via postMessage
    const cfIframe = modal.querySelector('iframe[src*="videodelivery"]');
    if (cfIframe) {
        const _cfHandler = (e) => {
            try {
                const d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
                if (d?.event === 'ended') {
                    window.removeEventListener('message', _cfHandler);
                    window._prisonCFHandler = null;
                    closeModal();
                }
            } catch {}
        };
        window._prisonCFHandler = _cfHandler;
        window.addEventListener('message', _cfHandler);
    }
}

function closeModal(silent = false) {
    const modal = document.querySelector('#prison-modal');
    if (!modal) return;
    if (!silent) playSFX('sfx-modal-close');
    modal.querySelectorAll('video').forEach(v => v.pause());
    if (window._prisonCFHandler) {
        window.removeEventListener('message', window._prisonCFHandler);
        window._prisonCFHandler = null;
    }
    const content = modal.querySelector('.modal-content');
    gsap.to(content, {
        opacity: 0, scale: 0.88, duration: 0.2, ease: 'power2.in',
        onComplete: () => modal.remove(),
    });
    gsap.to(modal.querySelector('.modal-backdrop'), { opacity: 0, duration: 0.2 });
}

function _buildModalHTML(id) {
    const body = MODAL_CONTENTS[id] ?? `<div style="padding:40px;text-align:center;font-family:'Oswald',sans-serif">CONTENIDO NO ENCONTRADO</div>`;
    return `<div class="modal-backdrop"></div><div class="modal-content"><button class="modal-close" aria-label="Cerrar">✕</button>${body}</div>`;
}

const WP     = CONFIG.wpBase;
const CF_URL = CONFIG.cfBase;

const MODAL_CONTENTS = {
    'clip-highlight': `
        <div class="modal-video-wrapper">
            <iframe src="${CF_URL}${CF.highlight}?autoplay=1&playerApi=1"
                allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
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

    'clip-stealth':      `<div class="modal-video-wrapper"><video src="${WP}clip-stealth.webm" autoplay playsinline data-autoclose></video></div>`,
    'clip-interrogation':`<div class="modal-video-wrapper"><video src="${WP}clip-interrogation.webm" autoplay playsinline data-autoclose></video></div>`,
    'clip-cell':         `<div class="modal-video-wrapper"><video src="${WP}clip-cell.webm" autoplay playsinline data-autoclose></video></div>`,
    'clip-laundry':      `<div class="modal-video-wrapper"><video src="${WP}clip-laundry.webm" autoplay playsinline data-autoclose></video></div>`,
    'clip-execution':    `<div class="modal-video-wrapper"><video src="${WP}clip-execution.webm" autoplay playsinline data-autoclose></video></div>`,

    'clip-endings': `
        <div style="padding:14px 18px 8px;background:#1A1A1A">
            <div class="caption-box" style="font-size:11px;background:#CC0000;color:#F0EDE6;border-color:#CC0000">
                DOS CAMINOS. UNA SOLA OPORTUNIDAD.
            </div>
        </div>
        <div class="modal-endings">
            <iframe src="${CF_URL}${CF.endingGood}?controls=true" allowfullscreen allow="fullscreen; picture-in-picture"></iframe>
            <iframe src="${CF_URL}${CF.endingBad}?controls=true"  allowfullscreen allow="fullscreen; picture-in-picture"></iframe>
        </div>
        <div class="modal-endings-label">
            <span>FINAL BUENO — LA FUGA</span>
            <span>FINAL MALO — LA CONDENA</span>
        </div>`,
};

// ── AUDIO — HTMLAudioElement (sin CORS) ──────────────────────────
// Usar HTMLAudio en lugar de Web Audio API + fetch para evitar problemas de CORS con WordPress

const AUDIO_MAP = {
    'ambient-chains':       `${WP}ambient-chains.mp3`,
    'ambient-recorder':     `${WP}ambient-recorder.mp3`,
    'ambient-electric-hum': `${WP}ambient-electric-hum.mp3`,
    'ambient-drip':         `${WP}ambient-drip.mp3`,
    'ambient-static':       `${WP}ambient-static.mp3`,
    'ambient-wind':         `${WP}ambient-wind.mp3`,
    'bg-music':             'https://virtuabarcelona.com/wp-content/uploads/2026/05/bg-music-prison.mp3',
};

const SFX_MAP = {
    'sfx-modal-open':     `${WP}sfx-modal-open.mp3`,
    'sfx-modal-close':    `${WP}sfx-modal-close.mp3`,
    'sfx-panel-enter':    `${WP}sfx-panel-enter.mp3`,
    'sfx-slider-drag':    `${WP}sfx-slider-drag.mp3`,
    'sfx-electric-spark': `${WP}sfx-electric-spark.mp3`,
    'sfx-trophy-open':    `${WP}sfx-trophy-open.mp3`,
    'sfx-bars-lock':      'https://virtuabarcelona.com/wp-content/uploads/2026/05/sfx-bars-lock.mp3',
};

let _audioInited   = false;
let _audioProbing  = false;
let _sliderAudio   = null;

const _UNLOCK_EVENTS = ['pointerdown', 'click', 'touchstart', 'keydown', 'wheel'];

function _tryInitAudio() {
    if (_audioInited || _audioProbing) return;
    _audioProbing = true;

    // Probe con data-URI silencioso — sin red, verifica si el contexto es un gesto real
    const probe = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
    probe.volume = 0;
    probe.play().then(() => {
        probe.pause();
        _audioInited       = true;
        state.audioEnabled = true;
        _UNLOCK_EVENTS.forEach(ev => window.removeEventListener(ev, _tryInitAudio));

        if (AUDIO_MAP['bg-music']) {
            const bgMusic  = new Audio(AUDIO_MAP['bg-music']);
            bgMusic.loop   = true;
            bgMusic.volume = 0.12;
            bgMusic.play().catch(() => {});
        }
        playAudioForChapter(state.currentChapter >= 0 ? state.currentChapter : 0);
    }).catch(() => { _audioProbing = false; }); // Gesto no real — reintentará en el próximo evento
}

function playAudioForChapter(chapterIndex) {
    if (!state.audioEnabled) return;

    const section  = document.querySelector(`[data-chapter="${chapterIndex}"]`);
    const audioKey = section?.dataset.audio;
    const url      = audioKey && AUDIO_MAP[audioKey];
    if (!url) return;

    // Si ya toca la misma pista, no interrumpir
    if (state.currentAudio?._key === audioKey) return;

    // Fade out y detener pista anterior
    if (state.currentAudio) _fadeAudioOut(state.currentAudio);

    const audio   = new Audio(url);
    audio._key    = audioKey;
    audio.loop    = true;
    audio.volume  = 0;

    audio.play().then(() => _fadeAudioIn(audio, CONFIG.audioVolume)).catch(() => {});
    state.currentAudio = audio;
}

function _fadeAudioIn(audio, targetVol) {
    if (audio._fadeTimer) { clearInterval(audio._fadeTimer); audio._fadeTimer = null; }
    audio._fadeTimer = setInterval(() => {
        if (!audio.paused && audio.volume < targetVol) {
            audio.volume = Math.min(targetVol, audio.volume + 0.006);
        } else {
            clearInterval(audio._fadeTimer);
            audio._fadeTimer = null;
        }
    }, 50);
}

function _fadeAudioOut(audio) {
    if (audio._fadeTimer) { clearInterval(audio._fadeTimer); audio._fadeTimer = null; }
    audio._fadeTimer = setInterval(() => {
        if (audio.volume > 0.005) {
            audio.volume = Math.max(0, audio.volume - 0.006);
        } else {
            audio.pause();
            clearInterval(audio._fadeTimer);
            audio._fadeTimer = null;
        }
    }, 50);
}

function playSFX(key) {
    if (!state.audioEnabled || !SFX_MAP[key]) return;
    const sfx   = new Audio(SFX_MAP[key]);
    sfx.volume  = Math.min(1, CONFIG.audioVolume * 1.5);
    sfx.play().catch(() => {});
}

// ── EVIDENCE STRINGS ──────────────────────────────────────────────
function initEvidenceStrings() {
    if (state.isMobile) return;
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
            const mx = (pts[a].x + pts[b].x) / 2 + (i % 2 === 0 ? -25 : 25);
            const my = (pts[a].y + pts[b].y) / 2 + (i % 3 === 0 ? -30 : 18);
            return `<path class="evidence-string"
                d="M ${pts[a].x.toFixed(1)} ${pts[a].y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${pts[b].x.toFixed(1)} ${pts[b].y.toFixed(1)}"
                stroke="#CC0000" stroke-width="1.5" fill="none" opacity="0.7"
                stroke-dasharray="1000" stroke-dashoffset="1000"/>`;
        }).join('');
        svg._strings = null; // Invalida cache de _animateEvidenceBoard tras redibujado
    }

    drawStrings();
    window.addEventListener('resize', drawStrings);
    // Animación de las strings: gestionada por _animateEvidenceBoard vía scrub
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

// ── HERO CINEMATIC ENTRANCE ───────────────────────────────────────
function initHeroAnim() {
    const title    = document.querySelector('#prison-hero .hero-title');
    const subtitle = document.querySelector('#prison-hero .hero-subtitle');
    if (!title) return;
    gsap.set(title, { scale: 3.5, opacity: 0, transformOrigin: 'center center' });
    if (subtitle) gsap.set(subtitle, { opacity: 0 });
}

function _triggerHeroAnim() {
    const title    = document.querySelector('#prison-hero .hero-title');
    const subtitle = document.querySelector('#prison-hero .hero-subtitle');
    if (!title) return;
    gsap.to(title, { scale: 1, opacity: 1, duration: 1.5, ease: 'power3.out', delay: 0.1 });
    if (subtitle) _typewriter(subtitle, 1750);
}

function _typewriter(el, delayMs) {
    const parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = '';
    el.style.opacity = '1';
    let pIdx = 0, cIdx = 0;
    setTimeout(() => {
        const tick = setInterval(() => {
            cIdx++;
            const done    = parts.slice(0, pIdx).join('<br>');
            const partial = parts[pIdx].slice(0, cIdx);
            el.innerHTML  = (done ? done + '<br>' : '') + partial + '<span class="tw-cursor">|</span>';
            if (cIdx >= parts[pIdx].length) {
                pIdx++; cIdx = 0;
                if (pIdx >= parts.length) {
                    clearInterval(tick);
                    el.innerHTML = parts.join('<br>');
                }
            }
        }, 38);
    }, delayMs);
}

// ── CTA SCENE — Cap 6 scroll-driven reveal ───────────────────────
let _ctaHookParts = null;
let _ctaHookTotal = 0;

function initCTAScene() {
    const section = document.querySelector('#prison-cta');
    if (!section) return;
    const title = section.querySelector('.cta-title');
    const hook  = section.querySelector('.cta-hook');
    const btn   = section.querySelector('.cta-main-btn');
    const specs = section.querySelector('.cta-specs');

    if (hook) {
        _ctaHookParts = hook.innerHTML.split(/<br\s*\/?>/i);
        _ctaHookTotal = _ctaHookParts.reduce((a, p) => a + p.length, 0);
        hook.innerHTML = '';
        gsap.set(hook, { opacity: 0 });
    }
    if (title) gsap.set(title, { scale: 3.5, opacity: 0, transformOrigin: 'center center' });
    if (btn)   gsap.set(btn,   { opacity: 0 });
    if (specs) gsap.set(specs, { opacity: 0 });
}

function _animateCTAScene(progress) {
    const section = document.querySelector('#prison-cta');
    if (!section || !_ctaHookParts) return;
    const title = section.querySelector('.cta-title');
    const hook  = section.querySelector('.cta-hook');
    const btn   = section.querySelector('.cta-main-btn');
    const specs = section.querySelector('.cta-specs');

    // Phase 1 (0→20%): title zooms from viewer
    if (title) {
        const p1 = gsap.utils.clamp(0, 1, progress / 0.20);
        gsap.set(title, { scale: gsap.utils.interpolate(3.5, 1, p1), opacity: p1 });
    }

    // Phase 2 (22→58%): scroll-driven typewriter on hook
    if (hook && _ctaHookTotal > 0) {
        const p2 = gsap.utils.clamp(0, 1, (progress - 0.22) / 0.36);
        if (p2 <= 0) {
            hook.innerHTML = '';
            hook.style.opacity = '0';
        } else {
            hook.style.opacity = '1';
            const nChars = Math.floor(p2 * _ctaHookTotal);
            let shown = 0, html = '';
            for (let i = 0; i < _ctaHookParts.length; i++) {
                if (shown >= nChars && i > 0) break;
                const take = Math.min(_ctaHookParts[i].length, Math.max(0, nChars - shown));
                html += (i > 0 ? '<br>' : '') + _ctaHookParts[i].slice(0, take);
                shown += take;
            }
            hook.innerHTML = html + (p2 < 1 ? '<span class="tw-cursor">|</span>' : '');
        }
    }

    // Phase 3 (60→78%): CTA button + chips fade in
    const p3 = gsap.utils.clamp(0, 1, (progress - 0.60) / 0.18);
    if (btn)   gsap.set(btn,   { opacity: p3 });
    if (specs) gsap.set(specs, { opacity: p3 });
}

function _resetCTAScene(section) {
    const title = section.querySelector('.cta-title');
    const hook  = section.querySelector('.cta-hook');
    const btn   = section.querySelector('.cta-main-btn');
    const specs = section.querySelector('.cta-specs');
    if (title) gsap.set(title, { scale: 3.5, opacity: 0 });
    if (hook)  { hook.innerHTML = ''; gsap.set(hook, { opacity: 0 }); }
    if (btn)   gsap.set(btn, { opacity: 0 });
    if (specs) gsap.set(specs, { opacity: 0 });
}

// ── INTRO SCREEN — gate de entrada + audio unlock ────────────────
function initIntroScreen() {
    const intro = document.querySelector('#prison-intro');

    // Generar rejas aunque el elemento ya esté siendo manejado por el inline
    const barsWrap = document.querySelector('.intro-bars-wrap');
    if (barsWrap && !barsWrap.dataset.built) {
        barsWrap.dataset.built = '1';
        for (let i = 0; i < 14; i++) {
            const b = document.createElement('div');
            b.className = 'intro-bar-v';
            barsWrap.appendChild(b);
        }
        [22, 68].forEach(pct => {
            const h = document.createElement('div');
            h.className = 'intro-bar-h';
            h.style.top = `${pct}%`;
            barsWrap.appendChild(h);
        });
    }

    // Lógica post-click: audio + lenis + hero
    function afterEnter() {
        if (!_audioInited) {
            _audioInited       = true;
            state.audioEnabled = true;
            _UNLOCK_EVENTS.forEach(ev => window.removeEventListener(ev, _tryInitAudio));
            if (AUDIO_MAP['bg-music']) {
                const bgMusic  = new Audio(AUDIO_MAP['bg-music']);
                bgMusic.loop   = true;
                bgMusic.volume = 0.12;
                bgMusic.play().catch(() => {});
            }
            playAudioForChapter(state.currentChapter >= 0 ? state.currentChapter : 0);
        }
        if (window._prisonLenis) {
            window._prisonLenis.start();
            // Recalcular posiciones de ScrollTrigger ahora que la intro ha desaparecido
            // y el layout del documento es visible por primera vez
            setTimeout(() => ScrollTrigger.refresh(true), 150);
        }
        _triggerHeroAnim();
    }

    // Registrar callback para el script inline (el click lo gestiona él)
    window._prisonOnEnter = afterEnter;

    // Si el usuario ya hizo click ANTES de que este script cargara desde CDN,
    // la intro tiene display:none pero Lenis nunca arrancó — arrancamos ahora.
    if (!intro || intro.style.display === 'none') {
        afterEnter();
        return;
    }

    // Intro todavía visible — detener Lenis hasta que el usuario haga click
    window._prisonLenis?.stop();

    // Fallback: si el script inline no corrió (ig no seteado), manejamos nosotros
    if (intro && !intro.dataset.ig) {
        function enter() {
            intro.removeEventListener('click',   enter);
            intro.removeEventListener('keydown', onKey);
            gsap.to(intro, {
                y: '-100%', duration: 0.85, ease: 'power2.inOut',
                onComplete: () => { intro.remove(); afterEnter(); },
            });
        }
        function onKey(e) { if (e.key === 'Enter' || e.key === ' ') enter(); }
        intro.addEventListener('click',   enter);
        intro.addEventListener('keydown', onKey);
    }
}


// ── SPLIT SLIDER ──────────────────────────────────────────────────
function initSlider() {
    const handle = document.querySelector('#slider-handle');
    const left   = document.querySelector('#slider-left');
    const right  = document.querySelector('#slider-right');
    if (!handle || !left || !right) return;

    let dragging = false;

    function startDrag() {
        dragging = true;
        if (state.audioEnabled && !_sliderAudio) {
            _sliderAudio        = new Audio(SFX_MAP['sfx-slider-drag']);
            _sliderAudio.loop   = true;
            _sliderAudio.volume = CONFIG.audioVolume * 0.8;
            _sliderAudio.play().catch(() => {});
        }
    }
    function endDrag() {
        dragging = false;
        if (_sliderAudio) { _sliderAudio.pause(); _sliderAudio = null; }
    }
    function moveSlider(clientX) {
        if (!dragging) return;
        const slider = document.querySelector('#prison-split-slider');
        const rect   = slider.getBoundingClientRect();
        const pct    = Math.max(15, Math.min(85, (clientX - rect.left) / rect.width * 100));
        left.style.width  = pct + '%';
        right.style.width = (100 - pct) + '%';
        handle.style.left = pct + '%';
    }

    handle.addEventListener('mousedown',  startDrag);
    handle.addEventListener('touchstart', startDrag, { passive: true });
    window.addEventListener('mouseup',    endDrag);
    window.addEventListener('touchend',   endDrag);
    window.addEventListener('mousemove',  e => moveSlider(e.clientX));
    window.addEventListener('touchmove',  e => moveSlider(e.touches[0].clientX), { passive: true });
}

// ── WANTED POSTER ─────────────────────────────────────────────────
function initWantedPoster() {
    const form        = document.querySelector('#prison-wanted-form');
    const canvas      = document.querySelector('#prison-wanted-canvas');
    const actions     = document.querySelector('#prison-wanted-actions');
    const dlBtn       = document.querySelector('#prison-wanted-download');
    const shareBtn    = document.querySelector('#prison-wanted-share');
    const photoInput  = document.querySelector('#prison-wanted-photo');
    const previewWrap = document.querySelector('#prison-wanted-preview-wrap');
    const previewImg  = document.querySelector('#prison-wanted-preview');
    const clearBtn    = document.querySelector('#prison-wanted-photo-clear');
    if (!form || !canvas) return;

    let _wantedPhoto = null;

    photoInput?.addEventListener('change', () => {
        const file = photoInput.files[0];
        if (!file) return;
        _wantedPhoto = file;
        previewImg.src = URL.createObjectURL(file);
        previewWrap?.classList.add('visible');
    });

    clearBtn?.addEventListener('click', () => {
        _wantedPhoto = null;
        photoInput.value = '';
        previewImg.src = '';
        previewWrap?.classList.remove('visible');
    });

    form.addEventListener('submit', async e => {
        e.preventDefault();
        const name  = (form.querySelector('[name="nombre"]').value || 'DESCONOCIDO').trim().toUpperCase();
        const crime = form.querySelector('[name="crimen"]').value;
        const btn   = form.querySelector('.wanted-submit');
        if (btn) { btn.disabled = true; btn.textContent = '...'; }

        await generateWantedPoster(canvas, name, crime, _wantedPhoto);

        if (btn) { btn.disabled = false; btn.textContent = 'GENERAR'; }
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
            } catch(_) { dlBtn?.click(); }
        } else {
            dlBtn?.click();
        }
    });
}

async function generateWantedPoster(canvas, name, crime, photoFile) {
    const ctx = canvas.getContext('2d');
    const W = 600, H = 800;
    canvas.width = W; canvas.height = H;

    // Fondo papel envejecido + ruido
    ctx.fillStyle = '#C8B89A';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 9000; i++) {
        ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.035})`;
        ctx.fillRect(Math.random() * W | 0, Math.random() * H | 0, 1, 1);
    }

    // Bordes
    ctx.strokeStyle = '#0A0A0A'; ctx.lineWidth = 10;
    ctx.strokeRect(14, 14, W - 28, H - 28);
    ctx.lineWidth = 2;
    ctx.strokeRect(22, 22, W - 44, H - 44);

    // Cabecera
    ctx.fillStyle = '#0A0A0A'; ctx.textAlign = 'center';
    ctx.font = `bold 72px 'Bebas Neue', sans-serif`;
    ctx.fillText('SE BUSCA', W / 2, 95);
    ctx.font = `600 20px 'Oswald', sans-serif`;
    ctx.fillText('VIVO O MUERTO', W / 2, 126);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(40, 140); ctx.lineTo(W - 40, 140); ctx.stroke();

    // Zona mugshot (160, 156, 280, 340)
    if (photoFile) {
        try {
            const img = await new Promise((resolve, reject) => {
                const el  = new Image();
                const url = URL.createObjectURL(photoFile);
                el.onload  = () => { URL.revokeObjectURL(url); resolve(el); };
                el.onerror = () => { URL.revokeObjectURL(url); reject(); };
                el.src = url;
            });
            ctx.save();
            // Clip al rectángulo del mugshot
            ctx.beginPath();
            ctx.rect(160, 156, 280, 340);
            ctx.clip();
            // Filtro B&N + alto contraste = aspecto ficha policial real
            ctx.filter = 'grayscale(1) contrast(1.75) brightness(0.88)';
            const iw = img.naturalWidth, ih = img.naturalHeight;
            const ratio = Math.max(280 / iw, 340 / ih);
            const dw = iw * ratio, dh = ih * ratio;
            ctx.drawImage(img, 160 + (280 - dw) / 2, 156 + (340 - dh) / 2, dw, dh);
            ctx.filter = 'none';
            // Viñeta para oscurecer bordes del mugshot
            const vign = ctx.createRadialGradient(300, 326, 55, 300, 326, 195);
            vign.addColorStop(0, 'rgba(0,0,0,0)');
            vign.addColorStop(1, 'rgba(0,0,0,0.55)');
            ctx.fillStyle = vign;
            ctx.fillRect(160, 156, 280, 340);
            ctx.restore();
        } catch(_) {
            _drawMugshotSilhouette(ctx, W);
        }
    } else {
        _drawMugshotSilhouette(ctx, W);
    }

    // Sello PELIGROSO
    ctx.save(); ctx.translate(448, 218); ctx.rotate(0.32);
    ctx.strokeStyle = 'rgba(204,0,0,0.75)'; ctx.lineWidth = 3;
    ctx.strokeRect(-48, -24, 96, 48);
    ctx.fillStyle = 'rgba(204,0,0,0.7)';
    ctx.font = `bold 17px 'Oswald', sans-serif`;
    ctx.fillText('PELIGROSO', 0, 7);
    ctx.restore();

    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(40, 510); ctx.lineTo(W - 40, 510); ctx.stroke();

    // Nombre + cargo
    ctx.fillStyle = '#CC0000';
    ctx.font = `bold 52px 'Bebas Neue', sans-serif`;
    ctx.fillText(name.substring(0, 18), W / 2, 572);
    ctx.fillStyle = '#0A0A0A';
    ctx.font = `600 19px 'Oswald', sans-serif`;
    ctx.fillText(`CARGO: ${crime.toUpperCase()}`, W / 2, 614);
    ctx.fillStyle = '#333';
    ctx.font = `400 13px 'Courier Prime', monospace`;
    ctx.fillText('N.º RECLUSO: #2719-VB', W / 2, 648);
    ctx.fillText('PRISIÓN ESTATAL BARCELONÉS', W / 2, 670);

    ctx.strokeStyle = '#0A0A0A'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(40, 694); ctx.lineTo(W - 40, 694); ctx.stroke();
    ctx.fillStyle = '#0A0A0A';
    ctx.font = `bold 22px 'Bebas Neue', sans-serif`;
    ctx.fillText('THE PRISON — VIRTUA BARCELONA', W / 2, 730);
    ctx.fillStyle = '#555';
    ctx.font = `400 12px 'Courier Prime', monospace`;
    ctx.fillText('virtuabarcelona.com/the-prison', W / 2, 755);
}

function _drawMugshotSilhouette(ctx, W) {
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(160, 156, 280, 340);
    ctx.fillStyle = '#1c1c1c';
    ctx.beginPath(); ctx.arc(W / 2, 266, 58, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(W / 2 - 68, 318, 136, 140);
}
