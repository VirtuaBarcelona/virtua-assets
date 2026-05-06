/**
 * VIRTUA SURVIVAL - SCROLLYTELLING Y LOGICA DE INTERACCION
 * Versión 1.0
 */

document.addEventListener("DOMContentLoaded", () => {
    
    // 1. REGISTRO DE PLUGINS GSAP Y SOLUCIÓN LENIS/ELEMENTOR
    gsap.registerPlugin(ScrollTrigger);

    // Evitar que Elementor secuestre el scroll de las anclas/scrollTrigger
    ScrollTrigger.config({ ignoreMobileResize: true });

    // 1.5 CONFIGURACIÓN DE AUDIO (HOWLER.JS)
    const CDN_URL = "https://cdn.jsdelivr.net/gh/VirtuaBarcelona/virtua-assets@main/survival-assets/";
    
    const bgmDia = new Howl({ src: [CDN_URL + 'AUDIO-BGM-DIA.mp3'], loop: true, volume: 0 });
    const bgmTarde = new Howl({ src: [CDN_URL + 'AUDIO-BGM-TARDE.MP3'], loop: true, volume: 0 });
    const bgmNoche = new Howl({ src: [CDN_URL + 'AUDIO-BGM-NOCHE.MP3'], loop: true, volume: 0 });
    
    const sfxHojas = new Howl({ src: [CDN_URL + 'SFX-SCROLL-HOJAS.MP3'], volume: 0.8 });
    const sfxIgnite = new Howl({ src: [CDN_URL + 'SFX-ANTORCHA-ENCENDIDO.mp3'], volume: 1.0 });
    const sfxFuegoLoop = new Howl({ src: [CDN_URL + 'SFX-FUEGO-LOOP.MP3'], loop: true, volume: 0.8 });
    const sfxHeliApproach = new Howl({ src: [CDN_URL + 'SFX-HELICOPTERO-APPROACH.MP3'], volume: 1.0 });
    const sfxHeliHover = new Howl({ src: [CDN_URL + 'SFX-HELICOPTERO-HOVER.MP3'], loop: true, volume: 0.9 });

    let audioUnlocked = false;

    // Desbloqueo de audio en el primer scroll o clic
    const unlockAudio = () => {
        if (!audioUnlocked) {
            audioUnlocked = true;
            bgmDia.play();
            bgmDia.fade(0, 0.5, 2000);
            sfxHojas.play();
        }
    };

    window.addEventListener('scroll', unlockAudio, { once: true });
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });

    // 2. REFERENCIAS AL DOM
    const masterContainer = document.getElementById("srv-master-container");
    const scrollProxy = document.getElementById("srv-scroll-proxy");
    
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

    // 3. FIJAR EL CONTENEDOR MAESTRO (PIN)
    // El scroll real ocurre en 'srv-scroll-proxy', pero el usuario ve 'srv-master-container' fijo.
    ScrollTrigger.create({
        trigger: scrollProxy,
        start: "top top",
        end: "bottom bottom",
        pin: masterContainer,
        pinSpacing: false,
        scrub: true
    });

    // 4. TIMELINE PRINCIPAL (PINNED CROSSFADE)
    const tlMaster = gsap.timeline({
        scrollTrigger: {
            trigger: scrollProxy,
            start: "top top",
            end: "bottom bottom",
            scrub: 1 // Suavizado del scroll
        }
    });

    // --- FASE 1: INICIO (APARTAR MALEZA) ---
    // Las hojas se hacen enormes y se apartan lateralmente
    tlMaster.to(fgLeft, { x: "-100%", scale: 1.5, ease: "power1.inOut" }, 0)
            .to(fgRight, { x: "100%", scale: 1.5, ease: "power1.inOut" }, 0)
            // Entra el primer HUD
            .to(hud1, { opacity: 1, y: 0, duration: 0.5 }, 0.1);

    // --- FASE 2: ATARDECER ---
    // El HUD 1 se desvanece
    tlMaster.to(hud1, { opacity: 0, y: -30, duration: 0.5 }, 0.3)
            // El Día se desvanece, revelando la Tarde que está debajo
            .to(bgDia, { 
                opacity: 0, 
                ease: "none",
                onStart: () => {
                    if(audioUnlocked) {
                        bgmDia.fade(0.5, 0, 1000);
                        bgmTarde.play();
                        bgmTarde.fade(0, 0.6, 1000);
                    }
                },
                onReverseComplete: () => {
                    if(audioUnlocked) {
                        bgmTarde.fade(0.6, 0, 1000);
                        bgmDia.fade(0, 0.5, 1000);
                    }
                }
            }, 0.3)
            // Entra el HUD 2
            .to(hud2, { opacity: 1, y: 0, pointerEvents: "auto", duration: 0.5 }, 0.4);

    // --- FASE 3: NOCHE ---
    tlMaster.to(hud2, { opacity: 0, y: -30, duration: 0.5, pointerEvents: "none" }, 0.7)
            // La Tarde se desvanece, revelando la Noche
            .to(bgTarde, { 
                opacity: 0, 
                ease: "none",
                onStart: () => {
                    if(audioUnlocked) {
                        bgmTarde.fade(0.6, 0, 1000);
                        bgmNoche.play();
                        bgmNoche.fade(0, 0.7, 1000);
                    }
                },
                onReverseComplete: () => {
                    if(audioUnlocked) {
                        bgmNoche.fade(0.7, 0, 1000);
                        bgmTarde.fade(0, 0.6, 1000);
                    }
                }
            }, 0.7)
            // Sube la antorcha apagada desde abajo
            .to(torch, { bottom: "10%", ease: "back.out(1.5)" }, 0.8);

    // 5. INTERACCIÓN CLÍMAX (LA ANTORCHA)
    let isLit = false;

    torch.addEventListener("click", () => {
        if (isLit) return;
        isLit = true;

        // 5.1 Cambio visual de la antorcha
        torch.classList.add("is-lit");
        
        // 5.2 Reproducir Sonidos (Howler.js)
        sfxIgnite.play();
        setTimeout(() => sfxFuegoLoop.play(), 500); // El loop de fuego comienza poco después de la ignición
        setTimeout(() => sfxHeliApproach.play(), 1000);
        setTimeout(() => sfxHeliHover.play(), 4500); // Transición de acercamiento a hover estático

        // 5.3 Iluminar el entorno
        gsap.to(torchGlow, { opacity: 1, duration: 0.5, ease: "power2.out" });
        gsap.to(torchGlow, {
            scale: 1.05,
            opacity: 0.8,
            duration: 0.1,
            yoyo: true,
            repeat: -1,
            ease: "rough({ template: none.out, strength: 1, points: 20, taper: none, randomize: true, clamp: false })"
        });

        // 5.4 Entrada Épica del Helicóptero
        const tlRescue = gsap.timeline({ delay: 1 });
        
        tlRescue.to(helicopter, {
            opacity: 1,
            x: window.innerWidth * 0.4, // Se mueve al centro aprox
            y: 50,
            duration: 4,
            ease: "power2.out"
        })
        .to(heliLight, {
            opacity: 0.6,
            duration: 0.5
        }, "-=1.5") // La luz se enciende un poco antes de llegar
        .to(rescueCta, {
            opacity: 1,
            pointerEvents: "auto",
            y: -30,
            duration: 1,
            ease: "back.out(1.2)"
        }, "-=0.5");

    });

    // Notas de Responsividad: El listener de "resize" deberá recalcular posiciones
    // si el viewport cambia drásticamente, pero el uso de vw/vh ayuda a mitigarlo.
});
