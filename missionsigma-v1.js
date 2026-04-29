/* missionsigma-v1.js — Mission Sigma Landing Page
 * Requiere: GSAP + ScrollTrigger, Lenis, Three.js r128 (global)
 * Versión: 1.0 · Abril 2026
 */

(function() {
'use strict';

// Fake loading screen for local preview testing (remove in prod if not needed, but good for safety)
setTimeout(function() {
  var loader = document.getElementById('ms-loading');
  if (loader) loader.classList.add('hidden');
}, 1000);

// ── 1. GUARDS ──────────────────────────────────────────────────────────────
// No ejecutar si no es la página correcta
if (!document.getElementById('ms-hero')) return;

// Esperar a que fonts estén listas antes de ScrollTrigger
document.fonts.ready.then(function() {

// ── 2. CONSTANTES Y ESTADO GLOBAL ─────────────────────────────────────────
  var isMobile   = window.matchMedia('(pointer: coarse)').matches;
  var isReduced  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = window.innerWidth, H = window.innerHeight;

// ── 3. LENIS SMOOTH SCROLL ────────────────────────────────────────────────
  var lenis = new Lenis({
    lerp: 0.07,
    smoothTouch: false,
    syncTouch: false,
  });
  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.lagSmoothing(0);

// ── 4. STAGE SYSTEM ───────────────────────────────────────────────────────
// Actualiza --ms-accent y data-stage en body al cambiar de sección
  var STAGE_COLORS = ['#e53935','#ff6f00','#9e9d24','#00897b','#00e676','#ff6d00'];
  var STAGE_ZONES  = ['PATIO · EXTERIOR','SÓTANO','COCINA / ASCENSOR','CONDUCTOS','REACTOR','AZOTEA'];

  function setStage(n) {
    document.body.dataset.floorStage = n;
    document.documentElement.style.setProperty('--ms-accent', STAGE_COLORS[n]);
    var floorEl = document.getElementById('ms-hud-floor');
    if (floorEl) floorEl.textContent = 'PLANTA · ' + STAGE_ZONES[n];
    // Alert beep al cambiar de stage
    playBeep();
    // Actualizar edificio SVG
    updateBuildingSVG(n);
  }

  document.querySelectorAll('.ms-section').forEach(function(section) {
    ScrollTrigger.create({
      trigger: section,
      start: 'top center',
      end: 'bottom center',
      onEnter: function()      { setStage(parseInt(section.dataset.stage || 0)); },
      onEnterBack: function()  { setStage(parseInt(section.dataset.stage || 0)); },
    });
  });

// ── 5. COUNTDOWN TIMER ────────────────────────────────────────────────────
  var totalSecs  = 58 * 60 + 47;
  var timerEl    = document.getElementById('ms-hud-timer');
  var timerDone  = false;
  setInterval(function() {
    if (timerDone) return;
    totalSecs = Math.max(0, totalSecs - 1);
    var m = String(Math.floor(totalSecs / 60)).padStart(2, '0');
    var s = String(totalSecs % 60).padStart(2, '0');
    if (timerEl) timerEl.textContent = '☢ ' + m + ':' + s;
  }, 1000);

// ── 6. EDIFICIO SVG — CROSS-SECTION ───────────────────────────────────────
  function updateBuildingSVG(stage) {
    var svg = document.getElementById('ms-building-svg');
    if (!svg) return;
    svg.querySelectorAll('[data-floor]').forEach(function(floor) {
      var n = parseInt(floor.dataset.floor);
      floor.classList.remove('floor-active', 'floor-done', 'floor-future');
      if (n === stage)       floor.classList.add('floor-active');
      else if (n < stage)    floor.classList.add('floor-done');
      else                   floor.classList.add('floor-future');
    });
  }

// ── 7. FONDO — BUILDING CUTAWAY CON PARALLAX (ascensión)
// El edificio empieza mostrando la parte baja (patio) y sube hacia la azotea
// mientras el usuario hace scroll — sensación de ascender el edificio.
  // Empieza mostrando el fondo del edificio (patio) y asciende hasta la azotea
  gsap.fromTo('#ms-building-fixed .ms-building-img.desktop-only',
    { yPercent: -50 },
    {
      yPercent: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: '#ms-content',
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
      }
    }
  );

// ── 8. HERO — TEXTO LÍNEA A LÍNEA ─────────────────────────────────────────
  if (!isReduced) {
    var heroItems = document.querySelectorAll('#ms-hero .ms-hero-content > *');
    gsap.from(heroItems, {
      opacity: 0, y: 18,
      duration: 0.7, stagger: 0.12, ease: 'power2.out',
      delay: 0.3,
    });
  }

// ── 9. BRIEFING — EFECTO REDACTED + DESCLASIFICACIÓN ─────────────────────
  document.querySelectorAll('.ms-kpi-item.ms-redacted').forEach(function(item) {
    ScrollTrigger.create({
      trigger: item, start: 'top 80%',
      once: true,
      onEnter: function() {
        gsap.to(item, { filter:'blur(0px) brightness(1)', duration: 0.7, ease:'power2.out' });
        item.classList.remove('ms-redacted');
      }
    });
  });

  // Desbloquear ms-stat-num.ms-redacted (el "380V")
  document.querySelectorAll('.ms-stat-num.ms-redacted').forEach(function(el) {
    ScrollTrigger.create({
      trigger: el, start: 'top 85%',
      once: true,
      onEnter: function() {
        gsap.to(el, { filter:'blur(0px) brightness(1)', duration: 1.0, ease:'power2.out' });
        el.classList.remove('ms-redacted');
      }
    });
  });

// ── 10. TEXTO SCRAMBLE ────────────────────────────────────────────────────
  function SigmaTextScramble(el) {
    var chars = '!<>-_\\/[]{}—=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    this.el = el; this.queue = []; this.frame = 0;
    var self = this;
    this.setText = function(text) {
      var length = Math.max(el.textContent.length, text.length);
      self.queue = [];
      for (var i = 0; i < length; i++) {
        var start = Math.floor(Math.random() * 8);
        var end   = start + Math.floor(Math.random() * 10);
        self.queue.push({ from: el.textContent[i]||'', to: text[i]||'', start:start, end:end });
      }
      cancelAnimationFrame(self.frameReq);
      self.update();
    };
    this.update = function() {
      var output = '', complete = 0;
      for (var i = 0; i < self.queue.length; i++) {
        var q = self.queue[i];
        if (self.frame >= q.end) { complete++; output += q.to; }
        else if (self.frame >= q.start) { output += chars[Math.floor(Math.random()*chars.length)]; }
        else { output += q.from; }
      }
      self.el.textContent = output;
      if (complete < self.queue.length) {
        self.frame++; self.frameReq = requestAnimationFrame(self.update);
      }
    };
  }

  document.querySelectorAll('.ms-mission-stat').forEach(function(el) {
    var numEl = el.querySelector('.ms-stat-num');
    if (!numEl) return;
    var ts = new SigmaTextScramble(numEl);
    ScrollTrigger.create({
      trigger: el, start: 'top 75%', once: true,
      onEnter: function() { ts.setText(numEl.dataset.target || numEl.textContent); }
    });
  });

// ── 11. GALERÍA CCTV ──────────────────────────────────────────────────────
  document.querySelectorAll('.ms-gallery-item').forEach(function(item, i) {
    ScrollTrigger.create({
      trigger: item, start: 'top 85%', once: true,
      onEnter: function() {
        gsap.fromTo(item,
          { opacity:0, scale:0.96 },
          { opacity:1, scale:1, duration:0.6, delay: i * 0.08, ease:'power2.out' }
        );
      }
    });
    // Desktop: hover quita el filtro CCTV
    if (!isMobile) {
      item.addEventListener('mouseenter', function() { item.classList.add('ms-cam-off'); });
      item.addEventListener('mouseleave', function() { item.classList.remove('ms-cam-off'); });
    }
  });

// ── 12. TYPEWRITER TÁCTICO ────────────────────────────────────────────────
  var CHAR_SPEED   = isMobile ? 15 : 40;
  var LINE_STAGGER = isMobile ? 80 : 200;

  function typewriteLine(el, text, cb) {
    var i = 0;
    var iv = setInterval(function() {
      el.textContent = text.slice(0, ++i);
      playTypewriter();
      if (i >= text.length) { clearInterval(iv); if (cb) cb(); }
    }, CHAR_SPEED);
    return iv;
  }

  var objSection = document.getElementById('ms-objectives');
  if (objSection) {
    if (isReduced) {
      // Sin animación: mostrar todo directamente
      objSection.querySelectorAll('.ms-obj-item').forEach(function(item) {
        item.querySelector('.ms-obj-text').textContent = item.dataset.fulltext;
        item.classList.add('ms-visible');
      });
    } else {
      ScrollTrigger.create({
        trigger: objSection, start: 'top 65%', once: true,
        onEnter: function() {
          var items = objSection.querySelectorAll('.ms-obj-item');
          items.forEach(function(item, i) {
            var textEl = item.querySelector('.ms-obj-text');
            var full   = item.dataset.fulltext;
            setTimeout(function() {
              item.classList.add('ms-visible');
              typewriteLine(textEl, full);
            }, i * LINE_STAGGER);
          });
          // Si el usuario scrollea fuera antes de terminar, completar todo
          ScrollTrigger.create({
            trigger: objSection, start: 'bottom top', once: true,
            onLeave: function() {
              items.forEach(function(item) {
                item.querySelector('.ms-obj-text').textContent = item.dataset.fulltext;
              });
            }
          });
        }
      });
    }
  }

// ── 13. THREE.JS — MISIL 3D ───────────────────────────────────────────────
  var GLB_URL='https://cdn.jsdelivr.net/gh/VirtuaBarcelona/virtua-assets@main/missile_fateh_110.glb';
  var HDRI_URL='https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/industrial_sunset_02_1k.hdr';
  var DRACO_PATH='https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/';

  var ChromaticShader={uniforms:{tDiffuse:{value:null},uOffset:{value:0.0025}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform sampler2D tDiffuse;uniform float uOffset;varying vec2 vUv;void main(){vec2 d=normalize(vUv-0.5);float l=length(vUv-0.5);vec2 o=d*l*uOffset;float r=texture2D(tDiffuse,vUv-o).r;float g=texture2D(tDiffuse,vUv).g;float b=texture2D(tDiffuse,vUv+o).b;gl_FragColor=vec4(r,g,b,1.0);}'};
  var GrainShader={uniforms:{tDiffuse:{value:null},uTime:{value:0.0},uAmount:{value:isMobile?0.022:0.038}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform sampler2D tDiffuse;uniform float uTime,uAmount;varying vec2 vUv;float noise(vec2 p){return fract(sin(dot(p+uTime,vec2(127.1,311.7)))*43758.5453);}void main(){vec4 c=texture2D(tDiffuse,vUv);float n=(noise(vUv*600.0)*2.0-1.0)*uAmount;gl_FragColor=vec4(c.rgb+n,c.a);}'};
  var VignetteShader={uniforms:{tDiffuse:{value:null},uStrength:{value:0.5}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform sampler2D tDiffuse;uniform float uStrength;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);float d=length(vUv-0.5)*2.0;float v=1.0-d*d*uStrength;gl_FragColor=vec4(c.rgb*clamp(v,0.0,1.0),c.a);}'};

  var msCanvas=document.getElementById('ms-canvas');
  if(!msCanvas) return; // Si no hay canvas, no ejecutar Three.js
  
  var msRenderer=new THREE.WebGLRenderer({canvas:msCanvas,antialias:!isMobile});
  msRenderer.setPixelRatio(Math.min(window.devicePixelRatio,isMobile?1.5:2));
  msRenderer.setSize(W,H);
  msRenderer.toneMapping=THREE.ACESFilmicToneMapping;
  msRenderer.toneMappingExposure=1.3;
  msRenderer.outputEncoding=THREE.sRGBEncoding;
  msRenderer.shadowMap.enabled=!isMobile;
  msRenderer.shadowMap.type=THREE.PCFSoftShadowMap;
  msRenderer.physicallyCorrectLights=true;

  var msScene=new THREE.Scene();
  msScene.background=new THREE.Color(0x060404);
  msScene.fog=new THREE.FogExp2(0x060404,0.018);
  var msCamera=new THREE.PerspectiveCamera(42,W/H,0.1,200);
  msCamera.position.set(4,2,14); msCamera.lookAt(0,2,0);

  var msComposer=new THREE.EffectComposer(msRenderer);
  msComposer.addPass(new THREE.RenderPass(msScene,msCamera));
  var msBloom=new THREE.UnrealBloomPass(new THREE.Vector2(W,H),isMobile?0.9:1.5,0.6,0.70);
  msComposer.addPass(msBloom);
  var msChrPass=new THREE.ShaderPass(ChromaticShader); msComposer.addPass(msChrPass);
  var msGrainPass=new THREE.ShaderPass(GrainShader); msComposer.addPass(msGrainPass);
  var msVigPass=new THREE.ShaderPass(VignetteShader); msVigPass.renderToScreen=true; msComposer.addPass(msVigPass);

  msScene.add(new THREE.AmbientLight(0x0a0806,0.6));
  var msMoon=new THREE.DirectionalLight(0xb0c8ff,1.8); msMoon.position.set(-10,16,8);
  if(!isMobile){msMoon.castShadow=true;msMoon.shadow.mapSize.width=msMoon.shadow.mapSize.height=2048;msMoon.shadow.camera.left=msMoon.shadow.camera.bottom=-12;msMoon.shadow.camera.right=msMoon.shadow.camera.top=12;msMoon.shadow.bias=-0.0005;}
  msScene.add(msMoon);
  var msNuclearL=new THREE.PointLight(0x00ff41,isMobile?3:6,25,2); msNuclearL.position.set(1,-7,2); msScene.add(msNuclearL);
  var msExhaustL=new THREE.PointLight(0xff4500,isMobile?3:7,16,2); msExhaustL.position.set(0,-9,0); msScene.add(msExhaustL);
  var msFillL=new THREE.PointLight(0xc47a20,1.2,30,2); msFillL.position.set(10,5,5); msScene.add(msFillL);
  var msRimL=new THREE.DirectionalLight(0x0a1a0a,0.8); msRimL.position.set(8,0,-12); msScene.add(msRimL);

  var msSP=new Float32Array((isMobile?600:1400)*3);
  for(var si=0;si<msSP.length/3;si++){msSP[si*3]=(Math.random()-.5)*220;msSP[si*3+1]=Math.random()*90+10;msSP[si*3+2]=(Math.random()-.5)*220;}
  var msStarGeo=new THREE.BufferGeometry(); msStarGeo.setAttribute('position',new THREE.BufferAttribute(msSP,3));
  var msStars=new THREE.Points(msStarGeo,new THREE.PointsMaterial({color:0xffffff,size:0.11,transparent:true,opacity:0.5}));
  msScene.add(msStars);

  new THREE.RGBELoader().setDataType(THREE.HalfFloatType).load(HDRI_URL,function(hdr){var pmrem=new THREE.PMREMGenerator(msRenderer);pmrem.compileEquirectangularShader();msScene.environment=pmrem.fromEquirectangular(hdr).texture;hdr.dispose();pmrem.dispose();},undefined,function(){});

  var msRoof=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshStandardMaterial({color:0x0c0a07,metalness:.05,roughness:.98}));
  msRoof.rotation.x=-Math.PI/2; msRoof.position.y=-6; msRoof.receiveShadow=true; msScene.add(msRoof);
  var msGrid=new THREE.GridHelper(44,26,0x141008,0x141008); msGrid.position.y=-5.98; msScene.add(msGrid);

  var msPoolA=new THREE.Mesh(new THREE.CircleGeometry(2,36),new THREE.MeshBasicMaterial({color:0xff4000,transparent:true,opacity:.08}));
  msPoolA.rotation.x=-Math.PI/2; msPoolA.position.y=-5.95; msScene.add(msPoolA);
  var msPoolB=new THREE.Mesh(new THREE.CircleGeometry(5,36),new THREE.MeshBasicMaterial({color:0xff2200,transparent:true,opacity:.04}));
  msPoolB.rotation.x=-Math.PI/2; msPoolB.position.y=-5.96; msScene.add(msPoolB);

  var msPC=isMobile?120:280;
  var msPPos=new Float32Array(msPC*3),msPVel=[],msPLife=[],msPMaxL=[];
  for(var pi=0;pi<msPC;pi++){msPLife[pi]=Math.random();msPMaxL[pi]=.6+Math.random()*.8;msPVel[pi]={x:(Math.random()-.5)*.06,y:-(0.04+Math.random()*.12),z:(Math.random()-.5)*.06};msPPos[pi*3]=(Math.random()-.5)*.3;msPPos[pi*3+1]=-3.5;msPPos[pi*3+2]=(Math.random()-.5)*.3;}
  var msPGeo=new THREE.BufferGeometry(); msPGeo.setAttribute('position',new THREE.BufferAttribute(msPPos,3));
  var msPMat=new THREE.PointsMaterial({color:0xff4400,size:.18,transparent:true,opacity:.72,blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true});
  var msParts=new THREE.Points(msPGeo,msPMat); msScene.add(msParts);

  var msMissile=null,msLaunched=false;
  var msRawMX=0,msRawMY=0,msSmoothMX=0,msSmoothMY=0;
  var msMouse2D=new THREE.Vector2(-99,-99),msRaycaster=new THREE.Raycaster(),msIsHovering=false;
  var msDragRotY=0,msTargetRotY=0,msIsDragging=false,msPrevX=0;
  var msHoverSnapY=0,msBaseScale=1.0,msHoverScaleCur=1.0;
  var msCursorEl=document.getElementById('ms-cursor');
  var msTargetEl=document.getElementById('ms-target');
  var msTargetPart=document.getElementById('ms-target-part');
  var MS_PARTS=[{minY:3,label:'OJIVA NUCLEAR · W-76 MOD2'},{minY:0,label:'SISTEMA DE GUÍA INS/GPS'},{minY:-2,label:'PROPULSANTE SÓLIDO · HTPB'},{minY:-99,label:'TOBERA DE EXPANSIÓN'}];
  function msPartLabel(y){for(var k=0;k<MS_PARTS.length;k++)if(y>=MS_PARTS[k].minY)return MS_PARTS[k].label;return 'OJIVA';}

  if(!isMobile){
    window.addEventListener('mousemove',function(e){msRawMX=(e.clientX/W)*2-1;msRawMY=-((e.clientY/H)*2-1);msMouse2D.set(msRawMX,msRawMY);if(msCursorEl)msCursorEl.style.transform='translate('+e.clientX+'px,'+e.clientY+'px) translate(-50%,-50%)';});
    msCanvas.addEventListener('mousedown',function(e){msIsDragging=true;msPrevX=e.clientX;});
    window.addEventListener('mousemove',function(e){if(!msIsDragging)return;msTargetRotY+=(e.clientX-msPrevX)*.007;msPrevX=e.clientX;});
    window.addEventListener('mouseup',function(){msIsDragging=false;});
  }

  var msDraco=new THREE.DRACOLoader(); msDraco.setDecoderPath(DRACO_PATH);
  var msGLTFLoader=new THREE.GLTFLoader(); msGLTFLoader.setDRACOLoader(msDraco);
  msGLTFLoader.load(GLB_URL,function(gltf){
    var model=gltf.scene;
    var box=new THREE.Box3().setFromObject(model);
    var size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
    var scale=9/Math.max(size.x,size.y,size.z);
    model.scale.setScalar(scale); model.position.sub(center.multiplyScalar(scale));
    msBaseScale=scale; msHoverScaleCur=scale;
    if(size.y<size.x||size.y<size.z){model.rotation.z=size.x>=size.z?Math.PI/2:0;if(size.z>size.x)model.rotation.x=Math.PI/2;}
    model.traverse(function(child){if(!child.isMesh)return;child.castShadow=child.receiveShadow=!isMobile;var mats=child.material?(Array.isArray(child.material)?child.material:[child.material]):[];mats.forEach(function(m){m.envMapIntensity=1.8;m.needsUpdate=true;});});
    model.rotation.z=(model.rotation.z||0)+Math.PI*.195;
    msScene.add(model); msMissile=model; msParts.position.copy(model.position);
    gsap.to(msMissile.rotation,{z:0,scrollTrigger:{trigger:'#ms-briefing',start:'top bottom',endTrigger:'#ms-cta',end:'center center',scrub:2.5}});
    gsap.to(msCamera.position,{z:10,y:3,scrollTrigger:{trigger:'#ms-cta',start:'top bottom',end:'bottom top',scrub:3}});
    gsap.to(msBloom,{strength:isMobile?1.4:2.2,scrollTrigger:{trigger:'#ms-reactor',start:'top center',end:'bottom center',scrub:2}});
  },undefined,function(err){console.error('GLB:',err);});

  var msClock=new THREE.Clock();
  function msAnimate(){
    requestAnimationFrame(msAnimate);
    var dt=Math.min(msClock.getDelta(),.05),t=msClock.getElapsedTime();
    // Mouse tracking — rápido y fluido
    msSmoothMX+=(msRawMX-msSmoothMX)*.09; msSmoothMY+=(msRawMY-msSmoothMY)*.09;
    if(!msLaunched){
      // Luces — más dramáticas en hover
      var hB=msIsHovering?2.8:0;
      msNuclearL.intensity=(isMobile?3:6)+Math.sin(t*(msIsHovering?5.5:2.8))*(.8+(msIsHovering?.9:0))+Math.sin(t*7.1)*.3+hB;
      msExhaustL.intensity=(isMobile?3:7)+Math.sin(t*4.9)*(1.2+(msIsHovering?1.8:0));
      if(msIsHovering){msPoolA.material.opacity=.18+Math.sin(t*7)*.06;msPoolB.material.opacity=.09+Math.sin(t*6)*.03;}
      else{msPoolA.material.opacity=.08+Math.sin(t*3.1)*.025;msPoolB.material.opacity=.04+Math.sin(t*2.4)*.014;}
      // Rotación idle — casi se detiene al hovear (misil "esperando orden")
      if(msMissile&&!msIsDragging) msDragRotY+=(msIsHovering?.0004:.0015);
    }
    if(msMissile&&!msLaunched){
      // Influencia del ratón más pronunciada
      msMissile.rotation.x+=(msSmoothMY*.26-msMissile.rotation.x)*.07;
      msMissile.rotation.y+=(msTargetRotY+msDragRotY+msSmoothMX*.22+msHoverSnapY-msMissile.rotation.y)*.08;
      msHoverSnapY*=.86; // decay del snap
      // Scale en hover
      if(msBaseScale>0){
        var tsv=msIsHovering?msBaseScale*1.07:msBaseScale;
        msHoverScaleCur+=(tsv-msHoverScaleCur)*.07;
        msMissile.scale.setScalar(msHoverScaleCur);
      }
    }
    // Cámara sigue al ratón más dramáticamente
    if(!msLaunched)msCamera.position.x+=(4+msSmoothMX*1.2-msCamera.position.x)*.04;
    msStars.rotation.y=t*.00035;
    if(!isMobile&&msMissile&&!msLaunched){
      msRaycaster.setFromCamera(msMouse2D,msCamera);
      var hits=msRaycaster.intersectObject(msMissile,true);
      if(hits.length>0){
        if(!msIsHovering){
          msIsHovering=true;
          msHoverSnapY=0.14; // impulso de snap al entrar
          if(msTargetEl)msTargetEl.classList.add('visible');
          if(msCursorEl)msCursorEl.classList.add('locked');
        }
        if(msTargetPart)msTargetPart.textContent=msPartLabel(hits[0].point.y);
        msChrPass.uniforms.uOffset.value=.007; // aberración cromática fuerte
      } else {
        if(msIsHovering){
          msIsHovering=false;
          msHoverSnapY=-0.06; // rebote al salir
          if(msTargetEl)msTargetEl.classList.remove('visible');
          if(msCursorEl)msCursorEl.classList.remove('locked');
        }
        msChrPass.uniforms.uOffset.value=.0025;
      }
    }
    var ppos=msPGeo.attributes.position.array;
    var ox=msMissile?msMissile.position.x:0,oy=msMissile?msMissile.position.y:0,oz=msMissile?msMissile.position.z:0;
    for(var pi=0;pi<msPC;pi++){msPLife[pi]+=dt;if(msPLife[pi]>msPMaxL[pi]){msPLife[pi]=0;msPMaxL[pi]=.5+Math.random()*.9;var sp=msLaunched?.8:.25;ppos[pi*3]=ox+(Math.random()-.5)*sp;ppos[pi*3+1]=oy-3.5;ppos[pi*3+2]=oz+(Math.random()-.5)*sp;msPVel[pi]={x:(Math.random()-.5)*(msLaunched?.15:.06),y:-(0.05+Math.random()*(msLaunched?.3:.12)),z:(Math.random()-.5)*(msLaunched?.15:.06)};}else{ppos[pi*3]+=msPVel[pi].x;ppos[pi*3+1]+=msPVel[pi].y;ppos[pi*3+2]+=msPVel[pi].z;}}
    msPGeo.attributes.position.needsUpdate=true;
    msPMat.opacity=msLaunched?Math.min(.9,msPMat.opacity+dt*2):.65;
    msGrainPass.uniforms.uTime.value=t*.8;
    msCamera.lookAt(0,2,0);
    msComposer.render();
  }
  msAnimate();

  window._msMissileLaunch=function(){
    if(msLaunched||!msMissile)return; msLaunched=true;
    gsap.killTweensOf(msMissile.rotation);gsap.killTweensOf(msMissile.position);
    var tl=gsap.timeline();
    tl.to(msMissile.rotation,{z:0,duration:.4,ease:'power2.inOut'})
      .to(msMissile.position,{x:.08,duration:.05,repeat:9,yoyo:true,ease:'none'},.35)
      .to(msMissile.position,{y:35,duration:1.8,ease:'power3.in'},.7)
      .to(msExhaustL,{intensity:22,duration:.3},.7)
      .to(msNuclearL,{intensity:0,duration:.9},.7)
      .to(msBloom,{strength:4,duration:.5},.9)
      .to('#ms-flash',{opacity:1,duration:.12,ease:'power3.in'},1.15)
      .to('#ms-flash',{opacity:0,duration:.9,ease:'power2.out'},1.27);
  };

  window.addEventListener('resize',function(){W=window.innerWidth;H=window.innerHeight;msCamera.aspect=W/H;msCamera.updateProjectionMatrix();msRenderer.setSize(W,H);msComposer.setSize(W,H);msBloom.resolution.set(W,H);});

// ── 14. EDIFICIO PARALLAX (fondo) ─────────────────────────────────────────
// Ya gestionado en §7

// ── 15. SONAR PING ────────────────────────────────────────────────────────
  function sonarPing() {
    if (isReduced) return;
    var el = document.getElementById('ms-sonar-wave');
    if (!el) return;
    el.classList.remove('ms-sonar-active'); void el.offsetWidth;
    el.classList.add('ms-sonar-active');
  }

// ── 16. NUCLEAR SWITCH + CTA ──────────────────────────────────────────────
  var switchEl = document.getElementById('ms-switch');
  var coverEl  = document.getElementById('ms-cover');
  var fireBtn  = document.getElementById('ms-fire-btn');

  if (isMobile && coverEl) {
    coverEl.addEventListener('click', function() {
      switchEl.classList.toggle('is-open');
    });
  }

  if (fireBtn) {
    fireBtn.addEventListener('click', function() {
      timerDone = true;
      var timer = document.getElementById('ms-hud-timer');
      if (timer) {
        timer.style.color = '#00e676';
        timer.textContent = '✓ MISIÓN: ACTIVA';
      }
      // Countdown contenedores → 0
      var c = 4;
      var el = document.getElementById('ms-containers');
      var iv = setInterval(function() { c--; if(el) el.textContent=c; if(c<=0) clearInterval(iv); }, 180);
      // Sonar
      sonarPing();
      
      // Launch missile
      if(window._msMissileLaunch) window._msMissileLaunch();

      // Portal wipe tras 1.2s
      setTimeout(initPortalWipe, 1200);
    });
  }

// ── 17. PORTAL WIPE ───────────────────────────────────────────────────────
  function initPortalWipe(e) {
    var wipe = document.getElementById('ms-portal-wipe');
    if (!wipe) return;
    var x = (e && e.clientX) || W/2;
    var y = (e && e.clientY) || H/2;
    var maxR = Math.hypot(Math.max(x, W-x), Math.max(y, H-y));
    wipe.style.clipPath = 'circle(0px at '+x+'px '+y+'px)';
    wipe.style.display  = 'block';
    gsap.to(wipe, {
      clipPath: 'circle('+maxR+'px at '+x+'px '+y+'px)',
      duration: 0.8, ease: 'power2.inOut',
      onComplete: function() {
        window.location.href = wipe.dataset.href || '#reserva';
      }
    });
  }

// ── 18. PARTÍCULAS (brasas) ───────────────────────────────────────────────
  if (!isReduced) {
    initParticles();
  }
  function initParticles() {
    var cvs = document.getElementById('ms-particles');
    if (!cvs) return;
    var ctx = cvs.getContext('2d');
    cvs.width  = W; cvs.height = H;
    var N = isMobile ? 35 : 75;
    var sparks = [];
    for (var i = 0; i < N; i++) sparks.push(newSpark());
    function newSpark() {
      return {
        x: Math.random() * W,
        y: H + Math.random() * 40,
        r: 0.8 + Math.random() * 2,
        speed: 0.4 + Math.random() * 0.8,
        opacity: 0.3 + Math.random() * 0.5,
        drift: (Math.random() - 0.5) * 0.3,
      };
    }
    function drawParticles() {
      ctx.clearRect(0, 0, W, H);
      var accent = getComputedStyle(document.documentElement).getPropertyValue('--ms-accent') || '#e53935';
      sparks.forEach(function(s) {
        s.y -= s.speed; s.x += s.drift;
        if (s.y < -10) Object.assign(s, newSpark(), {y: H + 10});
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
        ctx.fillStyle = accent.trim();
        ctx.globalAlpha = s.opacity;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      requestAnimationFrame(drawParticles);
    }
    drawParticles();
  }

// ── 19. AUDIO ─────────────────────────────────────────────────────────────
  var audioStarted = false;
  var ambientAudio, beepAudio, typeAudio;

  function initAudio() {
    if (audioStarted) return;
    audioStarted = true;
    ambientAudio = new Audio('https://virtuabarcelona.com/wp-content/uploads/2026/04/MS_Ambient_Loop.mp3');
    ambientAudio.loop = true; ambientAudio.volume = 0;
    ambientAudio.play().catch(function(){});
    gsap.to(ambientAudio, { volume: 0.18, duration: 2 });

    beepAudio = new Audio('https://virtuabarcelona.com/wp-content/uploads/2026/04/MS_Alert_Beep-1.mp3');
    beepAudio.volume = 0.35;

    typeAudio = new Audio('https://virtuabarcelona.com/wp-content/uploads/2026/04/MS_Typewriter.mp3');
    typeAudio.volume = 0.25; typeAudio.playbackRate = 1.5;
  }

  function playBeep() {
    if (!beepAudio) return;
    beepAudio.currentTime = 0;
    beepAudio.play().catch(function(){});
  }
  function playTypewriter() {
    if (!typeAudio || !audioStarted) return;
    typeAudio.currentTime = 0;
    typeAudio.play().catch(function(){});
  }

  // Lenis intercepta el scroll nativo — usar lenis.on('scroll') + pointerdown
  var _audioInited = false;
  function _tryInitAudio() {
    if (_audioInited) return;
    _audioInited = true;
    initAudio();
    var hint = document.querySelector('.ms-scroll-hint');
    if (hint) hint.style.opacity = '0';
  }
  lenis.on('scroll', _tryInitAudio);
  window.addEventListener('pointerdown', _tryInitAudio, { once: true, passive: true });

// ── 20. RESIZE ────────────────────────────────────────────────────────────
  var resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      W = window.innerWidth; H = window.innerHeight;
      ScrollTrigger.refresh();
    }, 200);
  });
  window.addEventListener('orientationchange', function() {
    setTimeout(function() { ScrollTrigger.refresh(); }, 300);
  });

}); // end fonts.ready
})(); // end IIFE
