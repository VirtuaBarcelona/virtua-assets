// ======================================================================
// SURVIVAL — LÓGICA GSAP & INTERACTIVIDAD v20.0 (GHOST TOUCH FIX)
// ======================================================================

document.addEventListener("DOMContentLoaded", () => {
    // Registrar Plugins GSAP
    gsap.registerPlugin(ScrollTrigger, TextPlugin, Draggable);
    
    ScrollTrigger.config({ ignoreMobileResize: true });
    ScrollTrigger.normalizeScroll(true);

    // ESTANDAR_MOBILE: Recálculo Dinámico para GSAP ScrollTrigger
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => ScrollTrigger.refresh(true), 250);
    });
    window.addEventListener('load', () => setTimeout(() => ScrollTrigger.refresh(true), 500));

    const isMobile = window.innerWidth <= 768;
    const volMod = isMobile ? 0.7 : 1.0;

    // ── 1. ESTADOS INICIALES ─────────────────────────────────────────────
    gsap.set(".srv-polaroid", { opacity: 0, y: -100, xPercent: -50, yPercent: -50, scale: 0.5, rotation: 0 });
    gsap.set("#srv-radio", { opacity: 0, scale: 0.8 });
    gsap.set("#srv-radio-text", { text: "" });
    gsap.set("#srv-crt-glow", { opacity: 0 });
    gsap.set("#srv-torch", { opacity: 0, y: 150, pointerEvents: "none" });
    gsap.set("#srv-torch-glow", { opacity: 0 });
    gsap.set("#srv-helicopter", { opacity: 0, x: -300, y: 50, scale: 0.1 });
    gsap.set("#srv-blackout", { opacity: 0 });
    gsap.set("#srv-final-ui", { opacity: 0 });
    gsap.set(".srv-pre-title", { opacity: 0, scale: 5 });
    gsap.set("#srv-nexus-text", { opacity: 0, y: 20 });
    gsap.set("#srv-heli-shout", { opacity: 0, scale: 0.8 });

    // ── 2. GESTIÓN DE AUDIO (Howler.js) ──────────────────────────────────
    const audioThud = new Howl({ src: ['https://cdn.jsdelivr.net/gh/VirtuaBarcelona/virtua-assets@main/survival-assets/sfx_thud.mp3'], volume: 0.8 * volMod });
    const audioHeroDrop = new Howl({ src: ['https://cdn.jsdelivr.net/gh/VirtuaBarcelona/virtua-assets@main/survival-assets/SFX-HERO-DROP.MP3'], volume: 1.0 * volMod });
    const audioLeaves = new Howl({ src: ['https://cdn.jsdelivr.net/gh/VirtuaBarcelona/virtua-assets@main/survival-assets/SFX-SCROLL-HOJAS.MP3'], volume: 0.6 * volMod });
    const audioStatic = new Howl({ src: ['https://cdn.jsdelivr.net/gh/VirtuaBarcelona/virtua-assets@main/survival-assets/sfx_static.mp3'], loop: true, volume: 0.3 * volMod });
    const audioIgnite = new Howl({ src: ['https://cdn.jsdelivr.net/gh/VirtuaBarcelona/virtua-assets@main/survival-assets/SFX-ANTORCHA-ENCENDIDO.mp3'], volume: 1.0 * volMod });
    const audioHeliApproach = new Howl({ src: ['https://cdn.jsdelivr.net/gh/VirtuaBarcelona/virtua-assets@main/survival-assets/SFX-HELICOPTERO-APPROACH.MP3'], volume: 1.0 * volMod });
    const audioHeliHover = new Howl({ src: ['https://cdn.jsdelivr.net/gh/VirtuaBarcelona/virtua-assets@main/survival-assets/SFX-HELICOPTERO-HOVER.MP3'], loop: true, volume: 0 });
    
    const musicDia = new Howl({ src: ['https://cdn.jsdelivr.net/gh/VirtuaBarcelona/virtua-assets@main/survival-assets/AUDIO-BGM-DIA.mp3'], loop: true, volume: 0 });
    const musicTarde = new Howl({ src: ['https://cdn.jsdelivr.net/gh/VirtuaBarcelona/virtua-assets@main/survival-assets/AUDIO-BGM-TARDE.MP3'], loop: true, volume: 0 });
    const musicNoche = new Howl({ src: ['https://cdn.jsdelivr.net/gh/VirtuaBarcelona/virtua-assets@main/survival-assets/AUDIO-BGM-NOCHE.MP3'], loop: true, volume: 0 });
    const musicInstrumental = new Howl({ src: ['https://cdn.jsdelivr.net/gh/VirtuaBarcelona/virtua-assets@main/survival-assets/AUDIO-INSTRUMENTAL.mp3'], loop: true, volume: 0 });

    const audioTacticalHover = new Howl({ src: ['https://cdn.jsdelivr.net/gh/VirtuaBarcelona/virtua-assets@main/survival-assets/SFX-TACTICAL-HOVER.mp3'], volume: 0.5 * volMod });
    const audioRescueImpact = new Howl({ src: ['https://cdn.jsdelivr.net/gh/VirtuaBarcelona/virtua-assets@main/survival-assets/SFX-RESCUE-IMPACT.mp3'], volume: 1.0 * volMod });

    let isAudioUnlocked = false;

    // Mutear audio cuando el móvil se bloquea o se cambia de pestaña
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            Howler.mute(true);
        } else {
            Howler.mute(false);
        }
    });

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
        musicDia.fade(0, 1.0 * volMod, 2000);
        musicTarde.play();
        musicNoche.play();
        musicInstrumental.play();
        
        // Flag to allow onUpdate to modify volumes
        isAudioUnlocked = true;
    });

    // ── 3. TIMELINE PRINCIPAL SCROLLTRIGGER ─────────────────────────────
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: "#srv-section",
            start: "top top",
            end: "+=12000",
            pin: "#srv-sticky-content",
            scrub: 1.5,
            anticipatePin: 1,
            onUpdate: (self) => {
                if (!isAudioUnlocked) return;
                
                const progress = self.progress;

                // Zona 1: Día (0.00 - 0.50)
                if (progress <= 0.41) {
                    musicDia.volume(1 * volMod);
                } else if (progress > 0.41 && progress <= 0.50) {
                    musicDia.volume((1 - (progress - 0.41) / 0.09) * volMod);
                } else {
                    musicDia.volume(0);
                }

                // Zona 2: Tarde (0.41 - 0.79)
                if (progress < 0.41) {
                    musicTarde.volume(0);
                } else if (progress >= 0.41 && progress < 0.50) {
                    musicTarde.volume(((progress - 0.41) / 0.09) * volMod);
                } else if (progress >= 0.50 && progress <= 0.70) {
                    musicTarde.volume(1 * volMod);
                } else if (progress > 0.70 && progress <= 0.79) {
                    musicTarde.volume((1 - (progress - 0.70) / 0.09) * volMod);
                } else {
                    musicTarde.volume(0);
                }

                // Zona 3: Noche (0.70 - 1.00) -> SE MANTIENE EL AMBIENTE para inmersión
                if (progress < 0.70) {
                    musicNoche.volume(0);
                } else if (progress >= 0.70 && progress < 0.79) {
                    musicNoche.volume(((progress - 0.70) / 0.09) * volMod);
                } else {
                    musicNoche.volume(1 * volMod);
                }

                // Zona 4: Instrumental (Clímax, 0.85 - 1.00)
                if (progress < 0.85) {
                    musicInstrumental.volume(0);
                } else if (progress >= 0.85 && progress < 0.95) {
                    musicInstrumental.volume(((progress - 0.85) / 0.10) * volMod);
                } else {
                    musicInstrumental.volume(1 * volMod);
                }
            }
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
        text: "> DATA:<br>> DIFICULTAD: 5/10 | JUGADORES: 2-6<br>> TIEMPO: 60 MIN | EDAD: +10<br>> TAGS: SUPERVIVENCIA, INVESTIGACIÓN",
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

    const pols = ["#pol-1", "#pol-2", "#pol-3", "#pol-4", "#pol-5", "#pol-6"];
    const rotFinal = [-12, 8, -6, 14, -8, 10];
    // Reduce spread on mobile to prevent lateral overflow
    const xPos = isMobile ? [-40, 50, -20, 30, -50, 40] : [-200, 200, -120, 120, -220, 220];
    const yPos = isMobile ? [-120, -150, -30, 30, 90, 120] : [-80, -120, 40, 80, -20, 150];

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
        opacity: 1, y: 0, duration: 2, ease: "back.out(1.2)",
        onComplete: () => gsap.set("#srv-torch", { pointerEvents: "auto" }),
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

    pols.forEach((polSelector, idx) => {
        const el = document.querySelector(polSelector);
        if(!el) return;

        // Click / Flip interaction
        el.addEventListener('click', (e) => {
            if (navigator.vibrate) navigator.vibrate(50);
            
            const wasFlipped = el.classList.contains('is-flipped');
            
            // Toggle state
            if (wasFlipped) {
                el.classList.remove('is-flipped');
                el.classList.remove('is-active'); // Removes unblur
            } else {
                el.classList.add('is-flipped');
                el.classList.add('is-active'); // Triggers unblur
            }
            
            // Unflip all others and return them to scatter pos, ONLY if they are flipped
            pols.forEach((p, otherIdx) => { 
                const pe = document.querySelector(p);
                if (pe && pe !== el && pe.classList.contains('is-flipped')) {
                    pe.classList.remove('is-flipped');
                    pe.classList.remove('is-active');
                    gsap.to(pe, { x: xPos[otherIdx], y: yPos[otherIdx], rotation: rotFinal[otherIdx], scale: 0.75, zIndex: 25, duration: 0.4 });
                }
            });

            // Adjust the clicked one
            const scaleFlip = isMobile ? 0.95 : 1.4; // Slightly smaller on mobile to ensure it fits
            if(!wasFlipped) { // if it just got flipped
                gsap.to(el, { x: 0, y: 0, rotation: 0, scale: scaleFlip, zIndex: 40, duration: 0.5, ease: "back.out(1.2)" });
            } else { // if it got unflipped
                gsap.to(el, { x: xPos[idx], y: yPos[idx], rotation: rotFinal[idx], scale: 1.05, zIndex: 30, duration: 0.4 });
            }
        });

        // Hover (Mouse)
        el.addEventListener('mouseenter', () => {
            if(!el.classList.contains('is-flipped')) {
                gsap.to(el, { scale: 0.85, zIndex: 30, duration: 0.3 });
                if (isAudioUnlocked) audioTacticalHover.play();
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
            pols.forEach((p, idx) => {
                const pe = document.querySelector(p);
                if(pe && pe.classList.contains('is-flipped')) {
                    pe.classList.remove('is-flipped');
                    pe.classList.remove('is-active');
                    gsap.to(pe, { x: xPos[idx], y: yPos[idx], rotation: rotFinal[idx], scale: 0.75, zIndex: 25, duration: 0.4 });
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
        if (gsap.getProperty("#srv-torch", "opacity") < 0.9) return; 
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
                audioHeliHover.fade(0, 1.0 * volMod, 5000);
            }
        });
        
        // Shout text appears when helicopter is approaching
        finalTl.to("#srv-heli-shout", { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.5)" }, "-=4");
        finalTl.to("#srv-heli-shout", { opacity: 0, scale: 0.9, duration: 0.5 }, "-=2.5");

        // Fade out torch exactly when helicopter arrives
        finalTl.to("#srv-torch", { opacity: 0, scale: 0.8, duration: 1, pointerEvents: "none" }, "-=1");
        finalTl.to("#srv-torch-glow", { opacity: 0, duration: 1 }, "<");

        finalTl.to("#srv-blackout", { opacity: 1, duration: 2 }, "-=1");
        
        finalTl.to("#srv-final-ui", { opacity: 1, duration: 0.1 });
        finalTl.to("#srv-final-title", { opacity: 1, scale: 1, duration: 2, ease: "power2.out" });
        finalTl.to("#srv-final-tags", { opacity: 1, y: 0, duration: 1 }, "-=1");
        finalTl.to("#srv-rescue-cta", { opacity: 1, duration: 1.5, ease: "power2.out", pointerEvents: "auto" }, "-=0.5");
    }

    // --- 5. EVENTOS FINALES DE UI ---
    const btnRescue = document.querySelector(".srv-btn-rescue");
    if (btnRescue) {
        btnRescue.addEventListener("click", () => {
            if (isAudioUnlocked) audioRescueImpact.play();
        });
    }

});
