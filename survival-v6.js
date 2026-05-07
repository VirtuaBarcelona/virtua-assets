/**
 * VIRTUA SURVIVAL - SCROLLYTELLING Y LOGICA DE INTERACCION
 * Versión 4.0 (Auditoría Agente 05)
 * - Refactorizado a position: sticky para blindaje contra Elementor.
 * - Incluye Gate de entrada para asegurar políticas de audio del navegador.
 * - Animaciones y crossfades mejorados con ScrollTrigger sin pin de GSAP.
 */

const initSurvival = () => {
    
    // 1. REGISTRO DE PLUGINS GSAP
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    // 1.1 INICIALIZAR LENIS (Desactivado para asegurar scroll nativo)
    // let lenis;

    // 2. REFERENCIAS AL DOM
    const triggerSection = document.getElementById("srv-section");
    
    const bgDia = document.getElementById("srv-bg-dia");
    const bgTarde = document.getElementById("srv-bg-tarde");
    const bgNoche = document.getElementById("srv-bg-noche");
    
    const fgLeft = document.getElementById("srv-fg-left");
    const fgRight = document.getElementById("srv-fg-right");
    
    const hud1 = document.getElementById("srv-hud-1");
    const hud2 = document.getElementById("srv-hud-2");
    
    const torch = document.getElementById("srv-torch");
    const torchGlow = document.getElementById("srv-torch-glow");
    const helicopter = document.getElementById("srv-helicopter");
    const heliLight = document.getElementById("srv-heli-light");
    const rescueCta = document.getElementById("srv-rescue-cta");

    // Seguridad: Si algún elemento falla, abortamos
    if (!triggerSection || !bgDia) {
        console.warn("Virtua Survival: Faltan contenedores del payload. Abortando JS.");
        return;
    }

    // Asegurar opacidades iniciales
    gsap.set([bgDia, fgLeft, fgRight], { opacity: 1 });
    gsap.set([bgTarde, bgNoche, hud2, torchGlow, helicopter, heliLight, rescueCta], { opacity: 0 });
    gsap.set(hud1, { opacity: 0, y: 30 });
    gsap.set(torch, { bottom: "-150px" });

    // 3. CONFIGURACIÓN DE AUDIO (HOWLER.JS)
    const CDN_URL = "https://cdn.jsdelivr.net/gh/VirtuaBarcelona/virtua-assets@main/survival-assets/";
    
    const bgmDia = new Howl({ src: [CDN_URL + 'AUDIO-BGM-DIA.mp3'], loop: true, volume: 0 });
    const bgmTarde = new Howl({ src: [CDN_URL + 'AUDIO-BGM-TARDE.MP3'], loop: true, volume: 0 });
    const bgmNoche = new Howl({ src: [CDN_URL + 'AUDIO-BGM-NOCHE.MP3'], loop: true, volume: 0 });
    
    const sfxHojas = new Howl({ src: [CDN_URL + 'SFX-SCROLL-HOJAS.MP3'], volume: 0.8 });
    const sfxIgnite = new Howl({ src: [CDN_URL + 'SFX-ANTORCHA-ENCENDIDO.mp3'], volume: 1.0 });
    const sfxFuegoLoop = new Howl({ src: [CDN_URL + 'SFX-FUEGO-LOOP.MP3'], loop: true, volume: 0.8 });
    const sfxHeliApproach = new Howl({ src: [CDN_URL + 'SFX-HELICOPTERO-APPROACH.MP3'], volume: 1.0 });
    const sfxHeliHover = new Howl({ src: [CDN_URL + 'SFX-HELICOPTERO-HOVER.MP3'], loop: true, volume: 0.9 });

    // 4. LÓGICA DE AUDIO (FIRST INTERACTION)
    let audioStarted = false;
    const startAudio = () => {
        if (audioStarted) return;
        audioStarted = true;
        bgmDia.play();
        bgmDia.fade(0, 0.5, 2000);
        sfxHojas.play();
        window.removeEventListener("scroll", startAudio);
        window.removeEventListener("touchstart", startAudio);
        window.removeEventListener("click", startAudio);
    };
    window.addEventListener("scroll", startAudio, { once: true, passive: true });
    window.addEventListener("touchstart", startAudio, { once: true, passive: true });
    window.addEventListener("click", startAudio, { once: true, passive: true });

    // Referencias a textos nuevos
    const srvTitle = document.getElementById("srv-title");
    const srvHint = document.getElementById("srv-hint");

    // 5. TIMELINE PRINCIPAL (SCROLLYTELLING)
    const tlMaster = gsap.timeline({
        scrollTrigger: {
            trigger: triggerSection,
            start: "top top",
            end: "+=600%", // Suavizado del scroll de 6 pantallas
            scrub: 1, 
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true
        }
    });

    // --- FASE 0: INICIO DEL VIAJE (HOJAS Y TÍTULO) ---
    tlMaster.addLabel("inicio", 0)
            // Desaparece el hint
            .to(srvHint, { opacity: 0, duration: 0.05 }, "inicio")
            // Se abren las hojas
            .to(fgLeft, { x: "-100%", scale: 1.5, duration: 0.2, ease: "power1.inOut" }, "inicio")
            .to(fgRight, { x: "100%", scale: 1.5, duration: 0.2, ease: "power1.inOut" }, "inicio")
            // Entra el título de forma cinematográfica CUANDO las hojas terminan (0.2)
            .to(srvTitle, { opacity: 1, scale: 1.2, duration: 0.2, ease: "power2.out" }, "inicio+=0.2")
            // Desaparece el título
            .to(srvTitle, { opacity: 0, scale: 1.4, duration: 0.15 }, "inicio+=0.5")
            // Aparece la historia de HUD 1
            .to(hud1, { opacity: 1, y: 0, duration: 0.15, ease: "power2.out" }, "inicio+=0.6");

    // --- FASE 1: ATARDECER ---
    tlMaster.addLabel("tarde", 0.45)
            // El HUD 1 se desvanece
            .to(hud1, { opacity: 0, y: -30, duration: 0.3 }, "tarde")
            // El Día se desvanece
            .to(bgDia, { 
                opacity: 0, 
                duration: 0.4,
                ease: "none",
                onStart: () => {
                    bgmDia.fade(0.5, 0, 1000);
                    bgmTarde.play();
                    bgmTarde.fade(0, 0.6, 1000);
                },
                onReverseComplete: () => {
                    bgmTarde.fade(0.6, 0, 1000);
                    bgmDia.fade(0, 0.5, 1000);
                }
            }, "tarde")
            // Aparece la tarde y HUD 2
            .to(bgTarde, { opacity: 1, duration: 0.4 }, "tarde")
            .to(hud2, { opacity: 1, y: 0, pointerEvents: "auto", duration: 0.3 }, "tarde+=0.2");

    // --- FASE 2: NOCHE ---
    tlMaster.addLabel("noche", 0.75)
            // HUD 2 se desvanece
            .to(hud2, { opacity: 0, y: -30, duration: 0.3, pointerEvents: "none" }, "noche")
            // La tarde se desvanece
            .to(bgTarde, { 
                opacity: 0, 
                duration: 0.4,
                ease: "none",
                onStart: () => {
                    bgmTarde.fade(0.6, 0, 1000);
                    bgmNoche.play();
                    bgmNoche.fade(0, 0.7, 1000);
                },
                onReverseComplete: () => {
                    bgmNoche.fade(0.7, 0, 1000);
                    bgmTarde.fade(0, 0.6, 1000);
                }
            }, "noche")
            // Aparece la noche
            .to(bgNoche, { opacity: 1, duration: 0.4 }, "noche")
            // Aparece la antorcha apagada
            .to(torch, { bottom: "10%", opacity: 1, ease: "back.out(1.5)", duration: 0.4 }, "noche+=0.2");

    // 6. INTERACCIÓN CLÍMAX (LA ANTORCHA)
    let isLit = false;

    torch.addEventListener("click", () => {
        if (isLit) return;
        isLit = true;

        // 6.1 Cambio visual de la antorcha
        torch.classList.add("is-lit");
        
        // 6.2 Reproducir Sonidos (Howler.js)
        sfxIgnite.play();
        setTimeout(() => sfxFuegoLoop.play(), 500); 
        setTimeout(() => sfxHeliApproach.play(), 1000);
        setTimeout(() => sfxHeliHover.play(), 4500);

        // 6.3 Iluminar el entorno
        gsap.to(torchGlow, { opacity: 1, duration: 0.5, ease: "power2.out" });
        gsap.to(torchGlow, {
            scale: 1.05,
            opacity: 0.8,
            duration: 0.1,
            yoyo: true,
            repeat: -1,
            ease: "rough({ template: none.out, strength: 1, points: 20, taper: none, randomize: true, clamp: false })"
        });

        // 6.4 Entrada Épica del Helicóptero
        const tlRescue = gsap.timeline({ delay: 1 });
        
        tlRescue.to(helicopter, {
            opacity: 1,
            x: window.innerWidth * 0.4,
            y: 50,
            duration: 4,
            ease: "power2.out"
        })
        .to(heliLight, {
            opacity: 0.6,
            duration: 0.5
        }, "-=1.5")
        .to(rescueCta, {
            opacity: 1,
            pointerEvents: "auto",
            y: -30,
            duration: 1,
            ease: "back.out(1.2)"
        }, "-=0.5");
    });
};

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", initSurvival);
} else {
    initSurvival();
}
