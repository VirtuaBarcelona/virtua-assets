// ======================================================================
// SURVIVAL — LÓGICA GSAP & INTERACTIVIDAD v20.0 (GHOST TOUCH FIX)
// ======================================================================

document.addEventListener("DOMContentLoaded", () => {
    // Registrar Plugins GSAP
    gsap.registerPlugin(ScrollTrigger, TextPlugin, Draggable);
    
    // Optimizaciones Mobile UX (Evitar saltos con barra de navegación)
    ScrollTrigger.config({ ignoreMobileResize: true });
    ScrollTrigger.normalizeScroll(true);

    // ── 1. ESTADOS INICIALES ─────────────────────────────────────────────
    gsap.set(".srv-polaroid", { opacity: 0, y: -100, xPercent: -50, yPercent: -50, scale: 0.5, rotation: 0 });
    gsap.set("#srv-radio", { opacity: 0, scale: 0.8 });
    gsap.set("#srv-radio-text", { text: "" });
    gsap.set("#srv-crt-glow", { opacity: 0 });
    gsap.set("#srv-torch", { opacity: 0, y: 150 });
    gsap.set("#srv-torch-glow", { opacity: 0 });
    gsap.set("#srv-helicopter", { opacity: 0, x: -300, y: 50, scale: 0.1 });
    gsap.set("#srv-blackout", { opacity: 0 });
    gsap.set("#srv-final-ui", { opacity: 0 });
    gsap.set(".srv-pre-title", { opacity: 0, scale: 5 });
    gsap.set("#srv-nexus-text", { opacity: 0, y: 20 });
    gsap.set("#srv-heli-shout", { opacity: 0, scale: 0.8 });

    // ── 2. GESTIÓN DE AUDIO (Howler.js) ──────────────────────────────────
    const audioThud = new Howl({ src: ['https://cdn.jsdelivr.net/gh/VirtuaBarcelona/virtua-assets@main/survival-assets/sfx_thud.mp3'], volume: 0.8 });
    const audioHeroDrop = new Howl({ src: ['https://cdn.jsdelivr.net/gh/VirtuaBarcelona/virtua-assets@main/survival-assets/SFX-HERO-DROP.MP3'], volume: 1.0 });
    const audioLeaves = new Howl({ src: ['https://cdn.jsdelivr.net/gh/VirtuaBarcelona/virtua-assets@main/survival-assets/SFX-SCROLL-HOJAS.MP3'], volume: 0.6 });
    const audioStatic = new Howl({ src: ['https://cdn.jsdelivr.net/gh/VirtuaBarcelona/virtua-assets@main/survival-assets/sfx_static.mp3'], loop: true, volume: 0.3 });
    const audioIgnite = new Howl({ src: ['https://cdn.jsdelivr.net/gh/VirtuaBarcelona/virtua-assets@main/survival-assets/SFX-ANTORCHA-ENCENDIDO.mp3'], volume: 1.0 });
    const audioHeliApproach = new Howl({ src: ['https://cdn.jsdelivr.net/gh/VirtuaBarcelona/virtua-assets@main/survival-assets/SFX-HELICOPTERO-APPROACH.MP3'], volume: 1.0 });
    const audioHeliHover = new Howl({ src: ['https://cdn.jsdelivr.net/gh/VirtuaBarcelona/virtua-assets@main/survival-assets/SFX-HELICOPTERO-HOVER.MP3'], loop: true, volume: 0 });
    
    // Música de fondo
    const musicDia = new Howl({ src: ['https://cdn.jsdelivr.net/gh/VirtuaBarcelona/virtua-assets@main/survival-assets/AUDIO-BGM-DIA.mp3'], loop: true, volume: 0 });
    const musicTarde = new Howl({ src: ['https://cdn.jsdelivr.net/gh/VirtuaBarcelona/virtua-assets@main/survival-assets/AUDIO-BGM-TARDE.MP3'], loop: true, volume: 0 });
    const musicNoche = new Howl({ src: ['https://cdn.jsdelivr.net/gh/VirtuaBarcelona/virtua-assets@main/survival-assets/AUDIO-BGM-NOCHE.MP3'], loop: true, volume: 0 });
    const musicInstrumental = new Howl({ src: ['https://cdn.jsdelivr.net/gh/VirtuaBarcelona/virtua-assets@main/survival-assets/AUDIO-INSTRUMENTAL.mp3'], loop: true, volume: 0 });

    let playedThud = false;
    let playedLeaves = false;

    // Desbloqueo de Audio
    document.body.style.overflow = "hidden"; // Bloquear scroll hasta click
    document.getElementById("srv-btn-start").addEventListener("click", () => {
        gsap.to("#srv-audio-unlock", { opacity: 0, duration: 0.5, onComplete: () => {
            document.getElementById("srv-audio-unlock").remove();
            document.body.style.overflow = ""; // Restaurar scroll
            
            // CRÍTICO PARA MOBILE: Forzar recálculo tras quitar el overflow:hidden
            setTimeout(() => {
                ScrollTrigger.refresh();
            }, 100);
        }});
        musicDia.play();
        musicDia.fade(0, 0.4, 2000);
        musicTarde.play();
        musicNoche.play();
        musicInstrumental.play();
        musicInstrumental.fade(0, 0.15, 2000);
    });

    // ── 3. TIMELINE PRINCIPAL SCROLLTRIGGER ─────────────────────────────
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: "#srv-section",
            start: "top top",
            end: "+=12000",
            pin: "#srv-sticky-content",
            scrub: 1.5,
            anticipatePin: 1
        }
    });

    // --- FASE 1: APERTURA (Hojas y Títulos) ---
    tl.to("#srv-hint", { opacity: 0, duration: 0.5 }, 0);

    tl.to("#srv-fg-left", { 
        xPercent: -80, rotation: -10, scale: 1.2, duration: 3, ease: "power2.inOut",
        onStart: () => { if (!playedLeaves) { audioLeaves.play(); playedLeaves = true; } }
    }, 0);
    tl.to("#srv-fg-right", { xPercent: 80, rotation: 10, scale: 1.2, duration: 3, ease: "power2.inOut" }, 0);

    // Phrase 1
    tl.to("#srv-phrase-1", {
        opacity: 1, scale: 1, duration: 0.8, ease: "power1.out",
        onStart: () => { if (!playedThud) { audioThud.play(); playedThud = true; } }
    }, 1.5);
    tl.to("#srv-phrase-1", { opacity: 0, scale: 0.9, duration: 0.8 }, "+=1");

    // Phrase 2
    tl.to("#srv-phrase-2", { opacity: 1, scale: 1, duration: 0.8, ease: "power1.out" }, "+=0.2");
    tl.to("#srv-phrase-2", { opacity: 0, scale: 0.9, duration: 0.8 }, "+=1");

    // Phrase 3
    tl.to("#srv-phrase-3", { opacity: 1, scale: 1, duration: 0.8, ease: "power1.out" }, "+=0.2");
    tl.to("#srv-phrase-3", { opacity: 0, scale: 0.9, duration: 0.8 }, "+=0.8");

    // Phrase 4
    tl.to("#srv-phrase-4", { opacity: 1, scale: 1, duration: 0.8, ease: "power1.out" }, "+=0.2");
    tl.to("#srv-phrase-4", { opacity: 0, scale: 0.9, duration: 0.8 }, "+=1");

    tl.to("#srv-title", { opacity: 1, scale: 1, duration: 2, ease: "power1.out", onStart: () => audioHeroDrop.play() }, "+=0.2");
    tl.to("#srv-subtitle", { opacity: 1, duration: 1.5, ease: "power1.out" }, "<0.5");

    tl.to({}, { duration: 6 }); // Pausa más larga para disfrutar el día

    // --- FASE 2: RADIO (Narrativa) ---
    tl.to("#srv-title", { opacity: 0, scale: 1.1, duration: 2 });
    tl.to("#srv-subtitle", { opacity: 0, duration: 1 }, "<");
    
    // Transición de fondo: Día a Tarde
    tl.addLabel("tarde-start");
    tl.to("#srv-bg-tarde", { opacity: 1, duration: 4 }, "tarde-start");
    tl.to(musicDia, { volume: 0, duration: 4 }, "tarde-start");
    tl.to(musicTarde, { volume: 0.4, duration: 4 }, "tarde-start");
    
    // Aparece texto nexus (Glue narrative)
    tl.to("#srv-nexus-text", { opacity: 1, y: 0, duration: 1.5, ease: "power2.out" }, "tarde-start+=1");

    tl.to("#srv-radio", { opacity: 1, scale: 1, duration: 2, ease: "back.out(1.2)" }, "tarde-start+=1.5");
    tl.to("#srv-crt-glow", { opacity: 1, duration: 1 }, "tarde-start+=2.5");

    tl.to("#srv-radio-text", {
        text: "> Transmisión interceptada...<br>> ¿Hay alguien ahí?<br>> Necesitamos extracción.<br>> Coordenadas: 41°23'N 2°10'E<br>> ...<br>> [ESTÁTICA]",
        duration: 3,
        ease: "none",
        onStart: () => audioStatic.play()
    });

    tl.to({}, { duration: 1.5 }); 
    tl.to("#srv-radio-text", { text: "", duration: 0.1 }); // Borrar
    
    tl.to("#srv-radio-text", {
        text: "> ESCAPE ROOM DATA:<br>> DIFICULTAD: 5/10<br>> JUGADORES: 2-6<br>> TIEMPO: 60 MIN<br>> EDAD: +10<br>> TAGS: SUPERVIVENCIA, FAMILIAR, INVESTIGACIÓN",
        duration: 3,
        ease: "none",
        onComplete: () => { audioStatic.fade(0.3, 0, 1000); },
        onReverseComplete: () => { audioStatic.fade(0.3, 0, 1000); setTimeout(() => audioStatic.stop(), 1000); }
    });

    tl.to({}, { duration: 2.5 }); 

    tl.to("#srv-nexus-text", { opacity: 0, duration: 1.5 }, "+=0");
    tl.to("#srv-radio", { opacity: 0, scale: 1.1, duration: 1.5 }, "<");
    tl.to("#srv-crt-glow", { opacity: 0, duration: 1 }, "<");

    // --- FASE 3: POLAROIDS ---
    tl.addLabel("noche-start");
    tl.to("#srv-bg-noche", { opacity: 1, duration: 4 }, "noche-start");
    tl.to(musicTarde, { volume: 0, duration: 4 }, "noche-start");
    tl.to(musicNoche, { volume: 0.4, duration: 4 }, "noche-start");

    const pols = ["#pol-1", "#pol-2", "#pol-3", "#pol-4", "#pol-5", "#pol-6"];
    const rotFinal = [-12, 8, -6, 14, -8, 10];
    const isMobile = window.innerWidth <= 768;
    const xPos = isMobile ? [-80, 80, -40, 40, -90, 90] : [-200, 200, -120, 120, -220, 220];
    const yPos = isMobile ? [-150, -180, -20, 40, 100, 130] : [-80, -120, 40, 80, -20, 150];

    pols.forEach((pol) => {
        tl.to(pol, {
            opacity: 1, y: 0, scale: 0.9,
            rotation: (Math.random() - 0.5) * 30,
            duration: 0.8, ease: "back.out(1.5)"
        }, "noche-start+=1");
    });

    tl.to({}, { duration: 1 });

    pols.forEach((pol, i) => {
        tl.to(pol, {
            x: xPos[i], y: yPos[i], rotation: rotFinal[i], scale: 0.75,
            duration: 2, ease: "power3.inOut"
        }, "scatter");
    });

    tl.to({}, { duration: 3 }); 

    tl.to(".srv-polaroid", { opacity: 0, y: "+=150", stagger: 0.1, duration: 1.5, ease: "power2.in" });

    // --- FASE 4: CLÍMAX (Antorcha) ---
    tl.to("#srv-torch", { 
        opacity: 1, y: 0, duration: 2, ease: "back.out(1.2)", pointerEvents: "auto",
        onReverseComplete: () => {
            // Reset en caso de scroll back
            isTorchLit = false;
            document.getElementById("srv-torch").classList.remove("is-lit");
            gsap.set("#srv-torch", { pointerEvents: "none" });
            gsap.to("#srv-torch-glow", { opacity: 0, duration: 0.3 });
            gsap.to("#srv-final-ui", { opacity: 0, duration: 0.5 });
            gsap.to("#srv-blackout", { opacity: 0, duration: 0.5 });
            gsap.set("#srv-helicopter", { opacity: 0, x: -300 });
            gsap.to("#srv-torch-hint", { opacity: 0, duration: 0.3 });
            audioHeliHover.fade(audioHeliHover.volume(), 0, 1000);
            setTimeout(() => { audioHeliHover.stop(); audioHeliApproach.stop(); }, 1000);
        }
    }, "torch-in");
    tl.to("#srv-torch-hint", { opacity: 1, y: -20, duration: 1 }, "torch-in+=1");

    // Fin del scroll GSAP timeline.
    tl.to({}, { duration: 2 }); 

    // ── 4. HOVER, FLIP Y DRAGGABLE ───────────────────────────────────────────

    pols.forEach((polSelector) => {
        const el = document.querySelector(polSelector);
        if(!el) return;
        
        // Touch support base
        el.addEventListener('touchstart', (e) => {
            // Unflip and scale down others
            pols.forEach(p => { 
                const pe = document.querySelector(p);
                if (pe && pe !== el) {
                    pe.classList.remove('is-flipped');
                    gsap.to(pe, { scale: 0.75, zIndex: 25, duration: 0.3 });
                }
            });
        }, { passive: true });

        // Click / Flip interaction
        el.addEventListener('click', (e) => {
            if (navigator.vibrate) navigator.vibrate(50);
            // Toggle flip on the clicked polaroid
            el.classList.toggle('is-flipped');
            
            // Unflip all others
            pols.forEach(p => { 
                const pe = document.querySelector(p);
                if (pe && pe !== el) {
                    pe.classList.remove('is-flipped');
                    gsap.to(pe, { scale: 0.75, zIndex: 25, duration: 0.3 });
                }
            });

            // Adjust scale based on flip state
            if(el.classList.contains('is-flipped')) {
                gsap.to(el, { scale: 1.4, zIndex: 35, duration: 0.3, ease: "back.out(1.5)" });
            } else {
                gsap.to(el, { scale: 1.1, zIndex: 30, duration: 0.3 });
            }
        });

        // Hover (Mouse)
        el.addEventListener('mouseenter', () => {
            if(!el.classList.contains('is-flipped')) {
                gsap.to(el, { scale: 1.1, zIndex: 30, duration: 0.3 });
            }
        });
        el.addEventListener('mouseleave', () => {
            if(!el.classList.contains('is-flipped')) {
                gsap.to(el, { scale: 0.75, zIndex: 25, duration: 0.3 });
            }
        });
    });

    // Close flipped polaroids when clicking/touching outside
    const closeAllPolaroids = (e) => {
        if (!e.target.closest('.srv-polaroid')) {
            pols.forEach(p => {
                const pe = document.querySelector(p);
                if(pe) {
                    pe.classList.remove('is-flipped');
                    gsap.to(pe, { scale: 0.75, zIndex: 25, duration: 0.3 });
                }
            });
        }
    };
    document.addEventListener('touchstart', closeAllPolaroids, { passive: true });
    document.addEventListener('click', closeAllPolaroids);

    let isTorchLit = false;

    const igniteTorch = () => {
        if (isTorchLit) return;
        // Verify opacity to prevent early accidental triggers
        if (gsap.getProperty("#srv-torch", "opacity") < 0.5) return; 
        isTorchLit = true;
        document.getElementById("srv-torch").classList.add("is-lit");
        gsap.to("#srv-torch-glow", { opacity: 1, duration: 0.3 });
        audioIgnite.play();
        if (navigator.vibrate) navigator.vibrate(200);
        triggerFinalCinematic();
    };

    const torchEl = document.getElementById("srv-torch");
    if (torchEl) {
        torchEl.addEventListener("click", igniteTorch);
        torchEl.addEventListener("touchstart", igniteTorch, { passive: true });
    }

    Draggable.create("#srv-torch", {
        type: "x,y",
        bounds: "#sala-survival",
        edgeResistance: 0.8,
        onDragStart: igniteTorch
    });

    function triggerFinalCinematic() {
        const finalTl = gsap.timeline();
        
        finalTl.to("#srv-torch-hint", { opacity: 0, duration: 0.5 }); // Hide hint
        
        finalTl.to("#srv-helicopter", {
            opacity: 1, x: window.innerWidth * 0.9, y: 80, scale: 2.5,
            duration: 5, ease: "power1.inOut",
            onStart: () => {
                audioHeliApproach.play();
                audioHeliHover.play();
                audioHeliHover.fade(0, 1.0, 5000);
            }
        });
        
        // Shout text appears when helicopter is approaching
        finalTl.to("#srv-heli-shout", { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.5)" }, "-=4");
        finalTl.to("#srv-heli-shout", { opacity: 0, scale: 0.9, duration: 0.5 }, "-=2.5");

        finalTl.to("#srv-blackout", { opacity: 1, duration: 2 }, "-=2");
        
        finalTl.to("#srv-final-ui", { opacity: 1, duration: 0.1 });
        finalTl.to("#srv-final-title", { opacity: 1, scale: 1, duration: 2, ease: "power2.out" });
        finalTl.to("#srv-final-tags", { opacity: 1, y: 0, duration: 1 }, "-=1");
        finalTl.to("#srv-rescue-cta", { opacity: 1, duration: 1.5, ease: "power2.out", pointerEvents: "auto" }, "-=0.5");
    }

});
