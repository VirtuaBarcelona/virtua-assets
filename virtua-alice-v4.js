document.addEventListener("DOMContentLoaded", () => {

                const rootEl = document.getElementById('virtua-alice-root');

                // ========================================
                // 0a. LENIS SMOOTH SCROLLING
                // ========================================
                const lenis = new Lenis({
                    duration: 1.1,
                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                    orientation: 'vertical',
                    smoothWheel: true
                });

                lenis.on('scroll', ScrollTrigger.update);
                gsap.ticker.add((time) => lenis.raf(time * 1000));
                gsap.ticker.lagSmoothing(0);

                // ========================================
                // 0b. SCROLL PROGRESS BAR
                // ========================================
                const scrollBar = document.getElementById('alice-scroll-bar');
                if (scrollBar) {
                    gsap.to(scrollBar, {
                        scaleX: 1,
                        ease: 'none',
                        scrollTrigger: {
                            trigger: rootEl,
                            start: 'top top',
                            end: 'bottom bottom',
                            scrub: 0.3
                        }
                    });
                }

                // ========================================
                // 0c. PARTICLE GENERATOR
                // ========================================
                const particleContainer = document.createElement('div');
                particleContainer.className = 'alice-particles-container';
                rootEl.insertBefore(particleContainer, rootEl.firstChild);

                for (let i = 0; i < 40; i++) {
                    const p = document.createElement('div');
                    const isGolden = Math.random() > 0.6;
                    p.className = 'alice-petal' + (isGolden ? ' golden' : '');
                    let d = document.createElement('div'); d.className='alice-petal-inner'; p.appendChild(d);
                    p.style.left = Math.random() * 100 + 'vw';
                    p.style.animationDuration = (Math.random() * 15 + 12) + 's';
                    p.style.animationDelay = (Math.random() * -25) + 's';

                    if (!isGolden) {
                        const rotation = Math.random() * 360;
                        p.querySelector('.alice-petal-inner').style.transform = "rotate(" + rotation + "deg)";
                    }

                    particleContainer.appendChild(p);
                }

                // ========================================
                // 1. CUSTOM CURSOR
                // ========================================
                const cursor = document.querySelector('.alice-cursor');
                const cursorDot = document.querySelector('.alice-cursor-dot');
                const isMobile = window.innerWidth <= 768;

                if (!isMobile && cursor) {
                    document.addEventListener('mousemove', (e) => {
                        cursor.style.left = e.clientX - 16 + 'px';
                        cursor.style.top = e.clientY - 16 + 'px';
                    });

                    // Trail effect
                    const trailPool = [];
                    for (let i = 0; i < 8; i++) {
                        const t = document.createElement('div');
                        t.className = 'alice-cursor-trail';
                        rootEl.appendChild(t);
                        trailPool.push(t);
                    }

                    let trailIdx = 0;
                    let lastTrailTime = 0;
                    document.addEventListener('mousemove', (e) => {
                        const now = Date.now();
                        if (now - lastTrailTime < 50) return;
                        lastTrailTime = now;

                        const t = trailPool[trailIdx % trailPool.length];
                        t.style.left = e.clientX - 2 + 'px';
                        t.style.top = e.clientY - 2 + 'px';
                        t.style.opacity = '0.5';

                        gsap.to(t, {
                            opacity: 0,
                            scale: 0.3,
                            duration: 0.6,
                            ease: "power2.out",
                            onStart: () => { t.style.transform = 'scale(1)'; }
                        });
                        trailIdx++;
                    });

                    // Hover effect on interactive elements
                    rootEl.addEventListener('mouseover', (e) => {
                        if (e.target.closest('a, button, .alice-card, .alice-cta-btn, .alice-sticky-btn')) {
                            cursor.classList.add('hovering');
                        }
                    });
                    rootEl.addEventListener('mouseout', (e) => {
                        if (e.target.closest('a, button, .alice-card, .alice-cta-btn, .alice-sticky-btn')) {
                            cursor.classList.remove('hovering');
                        }
                    });

                    // Hide default cursor
                    rootEl.style.cursor = 'none';
                    rootEl.querySelectorAll('a, button').forEach(el => el.style.cursor = 'none');
                }

                // ========================================
                // 2. INTRO TIMELINE
                // ========================================
                const introOverlay = document.querySelector('.alice-intro-overlay');
                const introText = document.querySelector('.alice-intro-text');
                const canvasEl = document.getElementById('alice-webgl-canvas');

                const introTL = gsap.timeline();

                introTL
                    .to(introText, { opacity: 1, duration: 1.2, delay: 0.5, ease: "power2.inOut" })
                    .to(introText, { opacity: 0, duration: 0.8, delay: 0.8, ease: "power2.in" })
                    .to(introOverlay, {
                        opacity: 0, duration: 1, ease: "power2.inOut",
                        onComplete: () => { introOverlay.style.display = 'none'; }
                    }, "-=0.3");

                // ========================================
                // 3. FLOATING OBJECTS PARALLAX
                // ========================================
                const floatObjs = document.querySelectorAll('.alice-float-obj');
                gsap.to(floatObjs, { opacity: 0.6, duration: 2, delay: 3, stagger: 0.2, ease: "power2.out" });
                floatObjs.forEach((obj, i) => {
                    const speed = parseFloat(obj.dataset.speed) || 0.3;
                    gsap.to(obj, { y: (-20 - i * 5) + "px", rotation: 15 - i * 3, duration: 3 + speed * 4, repeat: -1, yoyo: true, ease: "sine.inOut", delay: i * 0.3 });
                });

                document.querySelectorAll('.alice-float-obj').forEach(obj => {
                    const speed = parseFloat(obj.getAttribute('data-speed')) || 0.3;
                    gsap.to(obj, { y: () => speed * -600, rotation: speed * 180, ease: 'none', scrollTrigger: { trigger: '#alice-sec-hero', start: 'top top', end: 'bottom top', scrub: 1.5 } });
                });

                document.querySelectorAll('.alice-chapter-img').forEach(img => {
                    gsap.to(img, { y: -40, scale: 1.05, ease: 'none', scrollTrigger: { trigger: img.closest('.alice-chapter'), start: 'top 90%', end: 'bottom 10%', scrub: 2 } });
                });

                const crystallizeTargets = document.querySelectorAll('.alice-crystallize');
                crystallizeTargets.forEach(el => {
                    const finalSpacing = el.getAttribute('data-final-letter-spacing') || 'normal';
                    gsap.to(el, { scrollTrigger: { trigger: el, start: "top 92%", toggleActions: "play none none none" }, opacity: 1, letterSpacing: finalSpacing, scale: 1, y: 0, duration: 1.5, ease: "expo.out" });
                });

                // ========================================
                // 5. CTA FALLING CARDS
                // ========================================
                const fallingCardsContainer = document.getElementById('alice-falling-cards');
                const suits = ['♥️', '♠️', '♦️', '♣️', '🃏'];
                for (let i = 0; i < 20; i++) {
                    const card = document.createElement('div');
                    card.className = 'alice-falling-card';
                    card.textContent = suits[Math.floor(Math.random() * suits.length)];
                    card.style.left = Math.random() * 100 + '%';
                    card.style.animationDuration = (Math.random() * 12 + 8) + 's';
                    card.style.animationDelay = (Math.random() * -20) + 's';
                    card.style.fontSize = (Math.random() * 1.5 + 1) + 'rem';
                    fallingCardsContainer.appendChild(card);
                }

                const bottles = document.querySelectorAll('.alice-bottle.filled');
                bottles.forEach((b, i) => {
                    gsap.from(b, { scrollTrigger: { trigger: '#alice-sec-data', start: "top 70%", toggleActions: "play none none reverse" }, height: 5, opacity: 0, duration: 0.6, delay: i * 0.08, ease: "back.out(2)" });
                });

                const stickyBtn = document.getElementById('alice-btn-sticky');
                const wave = document.querySelector('.alice-radial-wave');
                setTimeout(() => { if (stickyBtn) document.body.appendChild(stickyBtn); if (wave) document.body.appendChild(wave); }, 500);

                if (stickyBtn) {
                    stickyBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        gsap.killTweensOf(wave); gsap.set(wave, { scale: 0, opacity: 1 });
                        gsap.to(wave, { scale: 400, duration: 1.2, ease: "power3.in", onComplete: () => { window.location.assign('https://virtuabarcelona.com/reservas_virtua/'); } });
                    });
                    const ctaSection = document.getElementById('alice-sec-cta');
                    if (ctaSection) {
                        window.addEventListener('scroll', () => {
                            const rect = ctaSection.getBoundingClientRect();
                            if (rect.top <= window.innerHeight) { stickyBtn.classList.add('alice-hidden'); } else { stickyBtn.classList.remove('alice-hidden'); }
                        });
                    }
                }

                const ctaMainBtn = document.getElementById('alice-cta-main');
                if (ctaMainBtn) {
                    ctaMainBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        gsap.killTweensOf(wave); gsap.set(wave, { scale: 0, opacity: 1 });
                        gsap.to(wave, { scale: 400, duration: 1.2, ease: "power3.in", onComplete: () => { window.location.assign('https://virtuabarcelona.com/reservas_virtua/'); } });
                    });
                }

                // ========================================
                // 8. WEBGL VIDEO SHADER
                // ========================================
                function initWebGLShader() {
                    const activeVideo = isMobile ? document.getElementById('alice-hero-v') : document.getElementById('alice-hero-h');
                    if (!activeVideo || !activeVideo.src || activeVideo.getAttribute('src') === '') return;

                    activeVideo.play().catch(e => console.warn("Video autoplay prevented.", e));
                    const gl = canvasEl.getContext('webgl') || canvasEl.getContext('experimental-webgl');
                    if (!gl) return;
                    let width = canvasEl.width = window.innerWidth;
                    let height = canvasEl.height = window.innerHeight;
                    gl.viewport(0, 0, width, height);
                    window.addEventListener('resize', () => { width = canvasEl.width = window.innerWidth; height = canvasEl.height = window.innerHeight; gl.viewport(0, 0, width, height); });
                    const vsSource = "attribute vec2 a_pos; varying vec2 v_uv; void main() { gl_Position = vec4(a_pos, 0.0, 1.0); v_uv = a_pos * 0.5 + 0.5; v_uv.y = 1.0 - v_uv.y; }";
                    const fsSource = "precision highp float; varying vec2 v_uv; uniform sampler2D u_img; uniform float u_time; void main() { vec2 uv = v_uv; float wave1 = sin(uv.y * 8.0 + u_time * 0.8) * 0.012; float wave2 = cos(uv.x * 6.0 + u_time * 1.2) * 0.01; float wave3 = sin(uv.x * uv.y * 15.0 + u_time) * 0.005; uv.x += wave1 + wave3; uv.y += wave2; vec4 color = texture2D(u_img, uv); color.r *= 0.9; color.b *= 1.1; gl_FragColor = color; }";
                    function compileShader(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
                    const prog = gl.createProgram(); if (!prog) return;
                    gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, vsSource));
                    gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, fsSource));
                    gl.linkProgram(prog); gl.useProgram(prog);
                    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
                    const posLoc = gl.getAttribLocation(prog, "a_pos");
                    gl.enableVertexAttribArray(posLoc); gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
                    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                    const timeLoc = gl.getUniformLocation(prog, "u_time");
                    gsap.to(canvasEl, { opacity: 0.7, duration: 2, delay: 3 });
                    function draw(time) {
                        if (activeVideo.readyState >= 3) {
                            gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, activeVideo);
                        }
                        gl.uniform1f(timeLoc, time * 0.001); gl.drawArrays(gl.TRIANGLES, 0, 6);
                        requestAnimationFrame(draw);
                    }
                    requestAnimationFrame(draw);
                }
                if (canvasEl) initWebGLShader();

                document.querySelectorAll('.alice-page-turn').forEach(pt => {
                    gsap.from(pt, { scrollTrigger: { trigger: pt, start: "top 85%", toggleActions: "play none none none" }, scaleX: 0, opacity: 0, duration: 1.2, ease: "power2.inOut" });
                });

                document.querySelectorAll('.alice-chapter').forEach((ch, i) => {
                    const body = ch.querySelector('.alice-chapter-body'); if (!body) return;
                    const isEven = i % 2 === 1;
                    gsap.from(body, { scrollTrigger: { trigger: ch, start: "top 80%", toggleActions: "play none none none" }, rotateY: isEven ? -8 : 8, opacity: 0.3, x: isEven ? 60 : -60, duration: 1.4, ease: "power3.out" });
                });

                const gallerySection = document.getElementById('alice-sec-gallery');
                const galleryTrack = gallerySection?.querySelector('.alice-gallery');
                if (galleryTrack && !isMobile) {
                    const totalScrollWidth = galleryTrack.scrollWidth - window.innerWidth + 200;
                    gsap.to(galleryTrack, { x: () => -totalScrollWidth, ease: 'none', scrollTrigger: { trigger: gallerySection, start: 'top top', end: () => "+=" + totalScrollWidth, scrub: 1, pin: true, anticipatePin: 1, invalidateOnRefresh: true } });
                }

            });
