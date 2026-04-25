function initCyberpunk() {
  // 1. CUSTOM CURSOR
  const cursor = document.querySelector('.cp-cursor');
  const interactionZones = document.querySelectorAll('.interaction-zone, a, button');

  if (cursor && window.matchMedia('(pointer: fine)').matches) {
    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Smooth cursor movement
    gsap.ticker.add(() => {
      cursorX += (mouseX - cursorX) * 0.2;
      cursorY += (mouseY - cursorY) * 0.2;
      cursor.style.left = cursorX + 'px';
      cursor.style.top = cursorY + 'px';
    });

    interactionZones.forEach(zone => {
      zone.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
      zone.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
    });
  }

  // 2. TEXT SCRAMBLE EFFECT
  class TextScramble {
    constructor(el) {
      this.el = el;
      this.chars = '!<>-_\\\\/[]{}—=+*^?#_';
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
        const start = Math.floor(Math.random() * 80); // Slower start
        const end = start + Math.floor(Math.random() * 80); // Slower end
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
          output += `<span style="color:var(--cp-neon-cyan)">${char}</span>`;
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

  // Apply scramble to terminal texts when they enter viewport
  const terminalTexts = document.querySelectorAll('.cp-terminal-body p');
  terminalTexts.forEach(p => {
    const originalHTML = p.innerHTML;
    // Strip tags temporarily to get raw text for scramble
    const rawText = p.innerText;
    p.innerHTML = '';
    
    const scrambler = new TextScramble(p);
    
    ScrollTrigger.create({
      trigger: p,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        scrambler.setText(rawText).then(() => {
          p.innerHTML = originalHTML; // Restore spans with highlights
        });
      }
    });
  });

  // 3. HUD BARS ANIMATION
  const hudItems = document.querySelectorAll('.cp-hud-item');
  hudItems.forEach((item, index) => {
    gsap.fromTo(item, 
      { x: -50, opacity: 0 },
      {
        x: 0, opacity: 1, duration: 0.6,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.cp-hud',
          start: 'top 85%'
        },
        delay: index * 0.15
      }
    );
  });

  // 4. GALLERY REVEAL
  const galleryItems = document.querySelectorAll('.cp-gallery-item');
  galleryItems.forEach((item, index) => {
    gsap.fromTo(item,
      { scale: 0.8, opacity: 0, rotationX: 20 },
      {
        scale: 1, opacity: 1, rotationX: 0, duration: 0.8,
        ease: 'back.out(1.2)',
        scrollTrigger: {
          trigger: '.cp-gallery-grid',
          start: 'top 80%'
        },
        delay: index * 0.1
      }
    );
  });

  // 5. HACKING MINI-GAME (CTA BUTTON)
  const hackBtn = document.getElementById('hack-btn');
  const hackProgress = document.querySelector('.hack-progress');
  const hackText = document.querySelector('.hack-text');
  let isHacking = false;

  if (hackBtn) {
    hackBtn.addEventListener('click', (e) => {
      if (isHacking) return;
      isHacking = true;
      let progress = 0;
      hackText.innerText = 'BYPASSING FIREWALL...';
      hackBtn.style.pointerEvents = 'none';
      
      const hackInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
          progress = 100;
          clearInterval(hackInterval);
          hackProgress.style.width = '100%';
          hackProgress.style.background = '#fff';
          hackText.style.color = '#000';
          hackText.innerText = 'ACCESS GRANTED [ REDIRECTING ]';
          
          setTimeout(() => {
            window.location.href = hackBtn.getAttribute('data-url');
          }, 800);
        } else {
          hackProgress.style.width = progress + '%';
          if (progress > 30 && progress < 60) hackText.innerText = 'DECRYPTING DATA...';
          else if (progress >= 60) hackText.innerText = 'EXTRACTING FILES...';
        }
      }, 100);
    });
  }

  // 6. SYSTEM OVERLOAD RANDOM GLITCH
  function triggerRandomGlitch() {
    // Random delay between 15s and 45s
    const nextGlitchIn = Math.random() * 30000 + 15000;
    
    setTimeout(() => {
      document.body.classList.add('system-glitch');
      const override = document.querySelector('.cyberpunk-elementor-override');
      if (override) override.classList.add('system-glitch');
      
      setTimeout(() => {
        document.body.classList.remove('system-glitch');
        if (override) override.classList.remove('system-glitch');
      }, 300); // Glitch duration
      
      // Queue next
      triggerRandomGlitch();
    }, nextGlitchIn);
  }
  
  // Start loop
  triggerRandomGlitch();

  // 7. MATRIX RAIN EFFECT (GALLERY CANVAS)
  const matrixCanvases = document.querySelectorAll('.matrix-canvas');
  matrixCanvases.forEach(canvas => {
    const ctx = canvas.getContext('2d');
    
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*'.split('');
    const fontSize = 14;
    let columns = canvas.width / fontSize;
    const drops = [];
    for (let x = 0; x < columns; x++) drops[x] = 1;

    const drawMatrix = () => {
      columns = canvas.width / fontSize;
      if (drops.length < columns) {
        for(let i = drops.length; i < columns; i++) drops[i] = 1;
      }
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#00ff9d';
      ctx.font = fontSize + 'px "Share Tech Mono"';
      
      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };
    
    setInterval(drawMatrix, 50);
  });

  // 8. BACKGROUND PARTICLES (DIGITAL DUST)
  const bgCanvas = document.getElementById('bg-canvas');
  if (bgCanvas) {
    const bgCtx = bgCanvas.getContext('2d');
    let bgW, bgH;
    
    const resizeBg = () => {
      bgW = bgCanvas.width = window.innerWidth;
      bgH = bgCanvas.height = window.innerHeight;
    };
    resizeBg();
    window.addEventListener('resize', resizeBg);
    
    const particles = [];
    for(let i=0; i<80; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        s: Math.random() * 2 + 1,
        vx: (Math.random() - 0.5) * 0.5,
        vy: Math.random() * -1 - 0.5
      });
    }
    
    const drawBg = () => {
      bgCtx.fillStyle = '#030508'; // Base cyberpunk background
      bgCtx.fillRect(0, 0, bgW, bgH);
      
      bgCtx.fillStyle = '#00ff9d';
      
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.y < -10) p.y = bgH + 10;
        if (p.x < -10) p.x = bgW + 10;
        if (p.x > bgW + 10) p.x = -10;
        
        bgCtx.globalAlpha = Math.random() * 0.5 + 0.1;
        bgCtx.fillRect(p.x, p.y, p.s, p.s);
      });
      requestAnimationFrame(drawBg);
    };
    drawBg();
  }

  // 9. STICKY BUTTON LOGIC
  const stickyBtn = document.getElementById('sticky-book-btn');
  const heroSection = document.querySelector('.cp-hero');
  const ctaSection = document.querySelector('.cp-cta-section');

  if (stickyBtn && heroSection && ctaSection) {
    // Show after hero, hide at final CTA
    window.addEventListener('scroll', () => {
      const heroBottom = heroSection.getBoundingClientRect().bottom;
      const ctaTop = ctaSection.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;

      // If we scrolled past the hero AND we haven't reached the final CTA button yet
      if (heroBottom < windowHeight / 2 && ctaTop > windowHeight) {
        stickyBtn.classList.add('is-visible');
      } else {
        stickyBtn.classList.remove('is-visible');
      }
    });
  }
} // End initCyberpunk

// Check if document is already loaded when script is injected in Elementor
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCyberpunk);
} else {
  initCyberpunk();
}

