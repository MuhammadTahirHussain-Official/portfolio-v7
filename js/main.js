/* Muhammad Tahir Hussain — portfolio v7
   One WebGL canvas sits behind the page. It holds a liquid chrome form that travels through every section,
   a 3D ring of project cards built from the GitHub API, and the portrait drawn with a fluid shader.
   Vanilla JS + Three.js + GSAP + Lenis, no build step. */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => t * t * (3 - 2 * t);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const USER = 'MuhammadTahirHussain-Official', EMAIL = 'mtahirhussainofficial@gmail.com';
  $$('.yr').forEach((n) => { n.textContent = new Date().getFullYear(); });

  /* ═════════ GitHub ═════════ description → card text · website → live link · topic "portfolio-hide" → hidden */
  const META = {
    'PAI-Sales-DataAnalysis': ['Store Sales Ecuador', 'A three million row retail pipeline, from five raw files to a model-ready table.'],
    'cropglobe-transfer': ['CropGlobe Transfer', 'A pre-registered study of cross-region crop-type transfer.'],
    'Predictive-Typing-Engine-In-C-That-Predict-Your-Next-Word-': ['Veryx Engine', 'A next-word prediction engine written in plain C.'],
    'Weather-Management-System-with-AI-assistant': ['StormWatch', 'A weather desk in C++17 with an LLM assistant built in.'],
    'Professional-Airline-Management-System': ['Nexus Air', 'A full airline, simulated in object-oriented C++.'],
    'Professional-Hospital-Management-System': ['Hospital Management', 'Records, search and multi-key sorting in a C console app.'],
    'Advance-arithmetic-quiz-system-with-timer-in-c': ['Arithmetic Quiz', 'A timed quiz with levels, progression and input timeouts.'],
    'Alien-Invasion-Game-in-Python': ['Alien Invasion', 'An arcade shooter built with Pygame.'],
    'Medicine-Inventory-Website': ['Medicine Inventory', 'A searchable stock website with a PHP backend.'],
    'My-Coding-Game-Journey': ['Coding Game Journey', 'Daily timed coding clashes, solved in C.'],
    'Basic-to-Advance-C-plus-plus': ['Basic to Advanced C++', 'C++20 from first steps upward, one CMake project per topic.'],
  };
  const HIDE = new Set(['portfolio', 'portfolio-v2', 'portfolio-v3', 'portfolio-v4', 'portfolio-v5', 'portfolio-v6', 'portfolio-v7', USER]);
  const SNAPSHOT = [['PAI-Sales-DataAnalysis', 'Python'], ['cropglobe-transfer', 'Jupyter Notebook'], ['Basic-to-Advance-C-plus-plus', 'C++'], ['Medicine-Inventory-Website', 'HTML'], ['My-Coding-Game-Journey', 'C'], ['Alien-Invasion-Game-in-Python', 'Python'], ['Weather-Management-System-with-AI-assistant', 'C++'], ['Professional-Airline-Management-System', 'C++'], ['Professional-Hospital-Management-System', 'C'], ['Predictive-Typing-Engine-In-C-That-Predict-Your-Next-Word-', 'C'], ['Advance-arithmetic-quiz-system-with-timer-in-c', 'C']]
    .map(([name, language]) => ({ name, language, html_url: `https://github.com/${USER}/${name}` }));
  const pretty = (n) => n.replace(/[-_]+/g, ' ').trim().replace(/\b[a-z]/g, (c) => c.toUpperCase());
  const norm = (r) => { const m = META[r.name] || [], lang = r.language === 'Jupyter Notebook' ? 'Jupyter' : r.language || 'Code';
    return { name: r.name, title: m[0] || pretty(r.name), desc: r.description || m[1] || (lang === 'Code' ? 'Source on GitHub.' : `A ${lang} project.`), lang, url: r.html_url, home: /^https?:\/\//.test(r.homepage || '') ? r.homepage : '', year: (r.pushed_at || '').slice(0, 4) }; };
  async function loadRepos() {
    const KEY = 'mth.v7.repos'; let cached = null; try { cached = JSON.parse(localStorage.getItem(KEY)); } catch {}
    if (cached && Date.now() - cached.t < 6e5) return [cached.list, 'Synced from GitHub'];
    try {
      const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 5000);
      const r = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`, { signal: ctl.signal, headers: { Accept: 'application/vnd.github+json' } }); clearTimeout(timer);
      if (!r.ok) throw 0;
      const list = (await r.json()).filter((x) => !x.fork && !x.archived && !HIDE.has(x.name) && !(x.topics || []).includes('portfolio-hide')).map(norm);
      if (!list.length) throw 0; try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), list })); } catch {} return [list, 'Live from GitHub'];
    } catch { return cached ? [cached.list, 'GitHub unreachable · last saved list'] : [SNAPSHOT.map(norm), 'GitHub unreachable · saved list']; }
  }

  /* ═════════ boot ═════════ */
  const num = $('#loadNum'); let shown = 0, target = 8;
  const counter = setInterval(() => { shown += Math.max(1, (target - shown) * .12); if (shown > target) shown = target; num.textContent = Math.floor(shown); }, 30);
  const fontsP = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('800 100px Syne'), document.fonts.load('700 100px Syne'), document.fonts.load('500 16px Manrope')]).catch(() => {}) : Promise.resolve();
  const imgP = new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = 'assets/img/portrait.webp'; });
  fontsP.then(() => { target = Math.max(target, 45); }); imgP.then(() => { target = Math.max(target, 70); });
  const reposP = loadRepos().then((r) => { target = Math.max(target, 88); return r; });

  let glOK = false;
  if (!reduce && typeof THREE !== 'undefined') { try { const t = document.createElement('canvas'); glOK = !!(t.getContext('webgl2') || t.getContext('webgl')); } catch {} }

  Promise.all([reposP, fontsP, imgP]).then(([[repos, note], , img]) => {
    // the plain list is always built: it is what readers without WebGL get
    const list = $('#workList'); repos.forEach((r) => { const li = el('li'), a = el('a', '', r.title + ' ↗'); a.href = r.url; a.target = '_blank'; a.rel = 'noopener'; li.append(a, el('p', '', `${r.lang} · ${r.desc}`)); list.append(li); });
    $('#repoCount').dataset.count = repos.length; $('#sync').textContent = `${repos.length} projects · ${note}`; $('#wTot').textContent = String(repos.length).padStart(2, '0');
    if (!glOK || typeof gsap === 'undefined') { document.documentElement.classList.add('nogl'); $('#loader').remove(); window.__started = true; $$('[data-count]').forEach((d) => { d.textContent = (+d.dataset.count).toLocaleString('en-US'); }); return; }
    try { run(repos, img); } catch (e) { console.error(e); document.documentElement.classList.add('nogl'); $('#loader').remove(); window.__started = true; }
  });

  /* ═════════ everything that moves ═════════ */
  function run(repos, img) {
    document.documentElement.classList.add('gl');
    gsap.registerPlugin(ScrollTrigger);
    const N = repos.length;
    $('#work').style.height = `${100 + Math.max(4, N) * 38}vh`;

    /* smooth scroll */
    const lenis = new Lenis({ duration: 1.2, easing: (t) => 1 - Math.pow(1 - t, 4) });
    let vel = 0; lenis.on('scroll', (l) => { vel = l.velocity; ScrollTrigger.update(); });
    gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
    document.addEventListener('click', (e) => { const a = e.target.closest('a[href^="#"]'); if (!a) return; const t = $(a.getAttribute('href')); if (!t) return; e.preventDefault(); lenis.scrollTo(t, { duration: 1.8 }); });

    /* ── WebGL ── */
    const canvas = $('#gl'), dpr = Math.min(devicePixelRatio || 1, 1.75);
    const R = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    R.setPixelRatio(dpr); R.outputEncoding = THREE.sRGBEncoding; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.05; R.autoClear = false; R.setClearColor(0x000000, 0);
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(35, 1, .1, 100);

    // an environment of coloured light panels, so the chrome has something to reflect
    const pm = new THREE.PMREMGenerator(R), es = new THREE.Scene();
    es.add(new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide,
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: 'varying vec3 vP; void main(){ float y = vP.y * .5 + .5; gl_FragColor = vec4(mix(vec3(.015, .015, .025), vec3(.07, .07, .1), y), 1.); }' })));
    [[0xffffff, 0, 5, 7, 7, 2, 5], [0xffffff, -7, 0, 3, 1.2, 9, 4], [0x7b5cff, 7, 2, -2, 4, 6, 2.6], [0xff4fd8, 0, -7, 3, 8, 3, 2.2], [0x3ee6ff, -4, -3, -6, 5, 4, 2.2], [0xffb36b, 4, 6, -5, 5, 3, 2]].forEach(([c, x, y, z, w, h, k]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); es.add(m); });
    const envTex = pm.fromScene(es, .035).texture; scene.environment = envTex;

    // the liquid chrome form: an icosphere displaced by layered noise in the vertex shader
    const NOISE = `vec3 m289(vec3 x){return x-floor(x*(1./289.))*289.;}vec4 m289(vec4 x){return x-floor(x*(1./289.))*289.;}vec4 perm(vec4 x){return m289(((x*34.)+1.)*x);}vec4 tis(vec4 r){return 1.79284291400159-.85373472095314*r;}
      float snoise(vec3 v){const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=m289(i);
      vec4 p=perm(perm(perm(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
      vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
      vec4 nm=tis(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=nm.x;p1*=nm.y;p2*=nm.z;p3*=nm.w;vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}`;
    const BU = { uTime: { value: 0 }, uAmp: { value: .3 }, uFreq: { value: 1.1 }, uSpike: { value: 0 } };
    const blobMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: .09, iridescence: .55, iridescenceIOR: 1.5, iridescenceThicknessRange: [260, 620], clearcoat: 1, clearcoatRoughness: .06, envMapIntensity: 1.5 });
    blobMat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, BU);
      sh.vertexShader = 'uniform float uTime, uAmp, uFreq, uSpike;\n' + NOISE + `
        float disp(vec3 p){ vec3 q = p * uFreq; float n = snoise(q + uTime * .32) * uAmp + snoise(q * 2.4 - uTime * .21) * uAmp * .33; n += pow(max(0., snoise(q * 3.1 + uTime * .5)), 3.) * uSpike; return n; }
      ` + sh.vertexShader
        .replace('#include <beginnormal_vertex>', `
          vec3 tg = normalize(cross(normal, abs(normal.y) < .99 ? vec3(0., 1., 0.) : vec3(1., 0., 0.)));
          vec3 bt = normalize(cross(normal, tg));
          vec3 d0 = position + normal * disp(position);
          vec3 pa = position + tg * .012; vec3 pb = position + bt * .012;
          vec3 da = pa + normalize(pa) * disp(pa); vec3 db = pb + normalize(pb) * disp(pb);
          vec3 objectNormal = normalize(cross(da - d0, db - d0)); objectNormal *= sign(dot(objectNormal, normal));
          #ifdef USE_TANGENT
            vec3 objectTangent = vec3(tangent.xyz);
          #endif`)
        .replace('#include <begin_vertex>', 'vec3 transformed = d0;');
    };
    blobMat.customProgramCacheKey = () => 'blob';
    const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, innerWidth < 760 ? 40 : 64), blobMat); scene.add(blob);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uO: { value: .35 } },
      vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform float uO; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1. - abs(dot(vN, vV)), 3.); gl_FragColor = vec4(mix(vec3(.48, .36, 1.), vec3(1., .31, .85), f) * f * uO * .6, 1.); }' }));
    glow.scale.setScalar(1.9); scene.add(glow);

    /* ── project ring ── */
    const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
    const PAL = ['#7b5cff', '#ff4fd8', '#3ee6ff', '#ffb36b', '#3dff9a'];
    function poster(r, i) {
      const c = document.createElement('canvas'), W = 600, H = 800, x = c.getContext('2d'); c.width = W; c.height = H; let s = hash(r.name); const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
      x.save(); x.beginPath(); x.roundRect ? x.roundRect(0, 0, W, H, 34) : x.rect(0, 0, W, H); x.clip();
      x.fillStyle = '#100f17'; x.fillRect(0, 0, W, H);
      for (let k = 0; k < 3; k++) { const cx = rnd() * W, cy = H * .15 + rnd() * H * .55, rr = 220 + rnd() * 260, g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, PAL[(i + k * 2) % PAL.length] + 'cc'); g.addColorStop(1, PAL[(i + k * 2) % PAL.length] + '00'); x.fillStyle = g; x.fillRect(0, 0, W, H); }
      x.globalAlpha = .14; x.strokeStyle = '#fff'; for (let gy = 0; gy < H; gy += 40) { x.beginPath(); x.moveTo(0, gy); x.lineTo(W, gy); x.stroke(); } x.globalAlpha = 1;
      x.fillStyle = '#efece6'; x.textBaseline = 'top'; x.font = '800 150px Syne, sans-serif'; x.fillText(String(i + 1).padStart(2, '0'), 34, 26);
      x.font = '800 58px Syne, sans-serif'; const words = r.title.toUpperCase().split(' '), lines = []; let ln = ''; const wmax = Math.max(...words.map((w) => x.measureText(w).width)); const fs = Math.min(58, 58 * (W - 72) / wmax); x.font = `800 ${fs.toFixed(1)}px Syne, sans-serif`;
      words.forEach((w) => { if (ln && x.measureText(ln + ' ' + w).width > W - 68) { lines.push(ln); ln = w; } else ln = ln ? ln + ' ' + w : w; }); lines.push(ln);
      lines.slice(-4).forEach((l, k, a) => x.fillText(l, 34, H - 120 - (a.length - k) * fs * 1.04));
      x.font = '500 24px Manrope, sans-serif'; const tag = r.lang.toUpperCase() + (r.year ? '  ·  ' + r.year : ''), tw = x.measureText(tag).width + 36;
      x.strokeStyle = 'rgba(239,236,230,.55)'; x.lineWidth = 2; x.beginPath(); x.roundRect ? x.roundRect(34, H - 92, tw, 50, 25) : x.rect(34, H - 92, tw, 50); x.stroke(); x.fillText(tag, 52, H - 79);
      x.restore(); x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = 3; x.beginPath(); x.roundRect ? x.roundRect(1.5, 1.5, W - 3, H - 3, 33) : x.rect(1.5, 1.5, W - 3, H - 3); x.stroke();
      const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = R.capabilities.getMaxAnisotropy(); return t;
    }
    const ring = new THREE.Group(), cards = [], CW = 1.5, CH = 2, RAD = Math.max(3, (N * CW * 1.28) / (Math.PI * 2));
    const cardGeo = new THREE.PlaneGeometry(CW, CH, 16, 1);
    { const p = cardGeo.attributes.position; for (let k = 0; k < p.count; k++) { const xx = p.getX(k); p.setZ(k, -(xx * xx) * .09); } p.needsUpdate = true; }   // a slight curve to each card
    repos.forEach((r, i) => { const m = new THREE.Mesh(cardGeo, new THREE.MeshBasicMaterial({ map: poster(r, i), transparent: true, side: THREE.DoubleSide, toneMapped: false })); const a = (i / N) * Math.PI * 2; m.position.set(Math.sin(a) * RAD, 0, Math.cos(a) * RAD); m.rotation.y = a; m.userData.i = i; ring.add(m); cards.push(m); });
    scene.add(ring);

    /* ── portrait plane, kept in step with its slot in the page ── */
    const sceneO = new THREE.Scene(), camO = new THREE.OrthographicCamera(-1, 1, 1, -1, -100, 100);
    const PU = { tex: { value: null }, uTime: { value: 0 }, uVel: { value: 0 }, uHover: { value: 0 }, uMouse: { value: new THREE.Vector2(.5, .5) }, uAspect: { value: 1 }, uImg: { value: 1100 / 1430 }, uReveal: { value: 0 } };
    if (img) { const t = new THREE.Texture(img); t.needsUpdate = true; PU.tex.value = t; }
    const portrait = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 32, 32), new THREE.ShaderMaterial({ uniforms: PU, transparent: true,
      vertexShader: `uniform float uVel, uTime; varying vec2 vUv; void main(){ vUv = uv; vec3 p = position; p.y += sin(uv.x * 3.14159) * uVel * .00035; p.x += sin(uv.y * 3.14159) * uVel * .00008; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }`,
      fragmentShader: `uniform sampler2D tex; uniform float uTime, uVel, uHover, uAspect, uImg, uReveal; uniform vec2 uMouse; varying vec2 vUv;
        float rr(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r; }
        void main(){
          vec2 uv = vUv; vec2 c = uv - .5; c.x *= uAspect;
          float corner = rr(c, vec2(.5 * uAspect, .5), .055); if (corner > 0.) discard;
          if (uv.y < 1. - uReveal * 1.05) discard;
          float d = distance(vec2(uv.x * uAspect, uv.y), vec2(uMouse.x * uAspect, uMouse.y));
          vec2 ripple = normalize(uv - uMouse + 1e-4) * sin(d * 34. - uTime * 6.) * .012 * uHover * smoothstep(.45, 0., d);
          vec3 bg = mix(vec3(.16, .11, .38), vec3(.45, .17, .5), uv.y);
          bg = mix(bg, vec3(.78, .41, .32), smoothstep(.55, 1., uv.x * .6 + (1. - uv.y) * .7) * .8);
          bg += vec3(.24, .9, 1.) * smoothstep(.5, 0., distance(uv, vec2(.1 + sin(uTime * .3) * .1, .15))) * .35;
          vec2 iu = uv + ripple; vec2 s = vec2(1.); if (uAspect > uImg) s.y = uImg / uAspect; else s.x = uAspect / uImg;
          iu = (iu - vec2(.5, 1.)) * s + vec2(.5, 1.);
          float shift = uVel * .00005 + uHover * .004;
          vec4 cr = texture2D(tex, iu + vec2(shift, 0.)), cg = texture2D(tex, iu), cb = texture2D(tex, iu - vec2(shift, 0.));
          vec3 col = mix(bg, vec3(cr.r, cg.g, cb.b), cg.a);
          col += (fract(sin(dot(uv * 900. + uTime, vec2(12.9898, 78.233))) * 43758.5453) - .5) * .05;
          float edge = smoothstep(.0, .025, uv.y - (1. - uReveal * 1.05)); col = mix(vec3(1.), col, clamp(edge + step(.999, uReveal), 0., 1.));
          gl_FragColor = vec4(col, 1.); }` }));
    sceneO.add(portrait);
    const slot = $('#portraitSlot');
    slot.addEventListener('pointermove', (e) => { const b = slot.getBoundingClientRect(); PU.uMouse.value.set((e.clientX - b.left) / b.width, 1 - (e.clientY - b.top) / b.height); gsap.to(PU.uHover, { value: 1, duration: .6 }); });
    slot.addEventListener('pointerleave', () => gsap.to(PU.uHover, { value: 0, duration: .8 }));
    ScrollTrigger.create({ trigger: slot, start: 'top 85%', once: true, onEnter: () => gsap.to(PU.uReveal, { value: 1, duration: 1.6, ease: 'power3.inOut' }) });

    /* ── sizing ── */
    let W = 1, H = 1, mobile = false;
    function resize() { W = innerWidth; H = innerHeight; mobile = W < 760; R.setSize(W, H, false); cam.aspect = W / H; cam.position.z = cam.aspect < 1 ? 6 * Math.min(1.8, .85 / cam.aspect) : 6; cam.updateProjectionMatrix(); camO.left = -W / 2; camO.right = W / 2; camO.top = H / 2; camO.bottom = -H / 2; camO.updateProjectionMatrix(); }
    resize(); addEventListener('resize', () => { resize(); ScrollTrigger.refresh(); });

    /* ── where the chrome form sits in each section ── */
    const KEYS = [['#hero', { x: 1.55, y: .5, s: .82, a: .22, f: .85, sp: 0, g: .35, z: 0 }], ['.manifesto', { x: 2.3, y: -.6, s: .62, a: .32, f: 1.3, sp: .08, g: .25, z: 0 }],
      ['#about', { x: 3.1, y: -1.25, s: .3, a: .28, f: 1.6, sp: 0, g: .2, z: 0 }], ['#work', { x: 0, y: 0, s: .5, a: .26, f: 1.4, sp: .0, g: .5, z: -RAD }],
      ['#stack', { x: 0, y: -.15, s: .9, a: .4, f: 1.7, sp: .35, g: .4, z: 0 }], ['#contact', { x: 2.7, y: .55, s: .9, a: .24, f: .85, sp: 0, g: .55, z: 0 }]].map(([s, v]) => [$(s), v]);
    const st = { ...KEYS[0][1] }, cur = { ...KEYS[0][1] };
    function targetState() {
      Object.assign(st, KEYS[0][1]);
      for (let k = 1; k < KEYS.length; k++) { const top = KEYS[k][0].getBoundingClientRect().top, f = ease(clamp(1 - top / H)); if (f <= 0) break; for (const key in st) st[key] = lerp(st[key], KEYS[k][1][key], f); }
      if (mobile) { st.x *= .3; st.y = st.y * .5 + .35; st.s *= .75; }
    }

    /* ── pointer ── */
    const mouse = { x: 0, y: 0, sx: 0, sy: 0, cx: -100, cy: -100 }; const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    addEventListener('pointermove', (e) => { mouse.x = (e.clientX / W) * 2 - 1; mouse.y = -(e.clientY / H) * 2 + 1; mouse.cx = e.clientX; mouse.cy = e.clientY; }, { passive: true });
    const work = $('#work'); let ringOn = 0, front = -1, hoverCard = -1;
    const pickCard = () => { if (ringOn < .5) return -1; ndc.set(mouse.x, mouse.y); ray.setFromCamera(ndc, cam); const h = ray.intersectObjects(cards, false)[0]; return h ? h.object.userData.i : -1; };
    addEventListener('click', (e) => { if (e.target.closest('a, button')) return; const i = pickCard(); if (i >= 0) window.open(repos[i].url, '_blank', 'noopener'); });

    /* ── work overlay text ── */
    const wIdx = $('#wIdx'), wTitle = $('#wTitle'), wDesc = $('#wDesc'), wLang = $('#wLang'), wLink = $('#wLink');
    function setFront(i) {
      if (i === front) return; front = i; const r = repos[i];
      gsap.to([wTitle, wDesc], { opacity: 0, y: -10, duration: .18, onComplete: () => { wIdx.textContent = String(i + 1).padStart(2, '0'); wTitle.textContent = r.title; wDesc.textContent = r.desc; wLang.textContent = r.lang + (r.year ? ' · ' + r.year : ''); wLink.href = r.home || r.url; wLink.textContent = r.home ? 'Visit live ↗' : 'View code ↗'; gsap.fromTo([wTitle, wDesc], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .45, stagger: .05, ease: 'power3.out' }); } });
    }
    setFront(0);

    /* ── frame ── */
    let rot = 0, last = performance.now();
    gsap.ticker.add(() => {
      const now = performance.now(), dt = Math.min(.05, (now - last) / 1000), t = now / 1000; last = now;
      mouse.sx = lerp(mouse.sx, mouse.x, .06); mouse.sy = lerp(mouse.sy, mouse.y, .06);
      targetState(); const k = 1 - Math.pow(.004, dt); for (const key in cur) cur[key] = lerp(cur[key], st[key], k);
      BU.uTime.value += dt * (1 + Math.min(Math.abs(vel), 60) * .04); BU.uAmp.value = cur.a + Math.min(Math.abs(vel), 60) * .004; BU.uFreq.value = cur.f; BU.uSpike.value = cur.sp;
      blob.position.set(cur.x + mouse.sx * .25, cur.y + mouse.sy * .2, cur.z); blob.scale.setScalar(cur.s); blob.rotation.set(t * .07 + mouse.sy * .4, t * .11 + mouse.sx * .6, 0);
      glow.position.copy(blob.position); glow.scale.setScalar(cur.s * 1.75); glow.material.uniforms.uO.value = cur.g;

      // ring: in view while the work section is pinned; scroll turns it to the next card
      const wb = work.getBoundingClientRect(), p = clamp(-wb.top / Math.max(1, wb.height - H)), inV = wb.top < H * .6 && wb.bottom > H * .4 ? 1 : 0;
      ringOn = lerp(ringOn, inV, 1 - Math.pow(.01, dt));
      const idx = p * (N - 1); rot = lerp(rot, -(idx / N) * Math.PI * 2, 1 - Math.pow(.002, dt));
      ring.visible = ringOn > .01; ring.position.set(mobile ? 0 : 1.35, mobile ? .55 : 0, -RAD + (1 - ringOn) * -4); ring.rotation.set(.06 + mouse.sy * .06, rot + mouse.sx * .12, 0); ring.scale.setScalar(mobile ? .78 : 1);
      if (ringOn > .5) setFront(clamp(Math.round(idx), 0, N - 1));
      hoverCard = fine ? pickCard() : -1;
      cards.forEach((c) => { c.updateMatrixWorld(); const wz = new THREE.Vector3().setFromMatrixPosition(c.matrixWorld).z, face = clamp((wz + RAD * 2) / (RAD * 2)); c.material.opacity = ringOn * (.12 + .88 * Math.pow(face, 2.2)); const sc = c.userData.i === hoverCard ? 1.06 : 1; c.scale.x = lerp(c.scale.x, sc, .15); c.scale.y = c.scale.x; });

      // portrait follows its slot
      const b = slot.getBoundingClientRect(); portrait.visible = b.bottom > -50 && b.top < H + 50;
      if (portrait.visible) { portrait.scale.set(b.width, b.height, 1); portrait.position.set(b.left + b.width / 2 - W / 2, H / 2 - b.top - b.height / 2, 0); PU.uAspect.value = b.width / b.height; }
      PU.uTime.value = t; PU.uVel.value = lerp(PU.uVel.value, clamp(vel * 60, -400, 400), .12);

      cam.position.x = lerp(cam.position.x, mouse.sx * .25, .05); cam.position.y = lerp(cam.position.y, mouse.sy * .15, .05); cam.lookAt(0, 0, 0);
      R.clear(); R.render(scene, cam); R.clearDepth(); R.render(sceneO, camO);
      cursorTick(); marqueeTick();
    });

    /* ── cursor ── */
    const cursor = $('#cursor'), ctext = $('#cursorTxt'); let cxp = -100, cyp = -100;
    function cursorTick() {
      if (!fine) return; cxp = lerp(cxp, mouse.cx, .2); cyp = lerp(cyp, mouse.cy, .2); cursor.style.transform = `translate(${cxp.toFixed(1)}px,${cyp.toFixed(1)}px)`;
      const overCard = hoverCard >= 0; cursor.classList.toggle('is-big', overCard || !!cursor.dataset.label); if (overCard) ctext.textContent = 'open';
    }
    if (fine) {
      document.documentElement.classList.add('has-cursor');
      document.addEventListener('mouseover', (e) => { const t = e.target.closest('[data-cursor], a, button'); cursor.classList.toggle('is-link', !!t && !(t.dataset && t.dataset.cursor)); if (t && t.dataset.cursor) { cursor.dataset.label = '1'; ctext.textContent = t.dataset.cursor; } else delete cursor.dataset.label; });
    }

    /* ── magnetic orb ── */
    $$('[data-magnet]').forEach((m) => { const qx = gsap.quickTo(m, 'x', { duration: .6, ease: 'power3' }), qy = gsap.quickTo(m, 'y', { duration: .6, ease: 'power3' });
      m.addEventListener('pointermove', (e) => { const b = m.getBoundingClientRect(); qx((e.clientX - b.left - b.width / 2) * .4); qy((e.clientY - b.top - b.height / 2) * .4); });
      m.addEventListener('pointerleave', () => { gsap.to(m, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1,.35)' }); }); });
    $('#copy').addEventListener('click', async (e) => { const b = e.currentTarget; try { await navigator.clipboard.writeText(EMAIL); b.textContent = 'Copied ✓'; } catch { b.textContent = EMAIL; } setTimeout(() => { b.textContent = 'Copy email'; }, 1800); });

    /* ── text motion ── */
    const man = $('#manifesto'); man.innerHTML = man.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
    const words = $$('.w', man); ScrollTrigger.create({ trigger: man, start: 'top 80%', end: 'bottom 40%', scrub: true, onUpdate: (s) => { const n = Math.round(s.progress * words.length); words.forEach((w, i) => { w.style.opacity = i < n ? 1 : .12; }); } });
    $$('.reveal-title').forEach((h) => gsap.from($$('.in', h), { yPercent: 110, duration: 1.2, ease: 'power4.out', stagger: .1, scrollTrigger: { trigger: h, start: 'top 85%', once: true } }));
    $$('[data-count]').forEach((d) => ScrollTrigger.create({ trigger: d, start: 'top 90%', once: true, onEnter: () => { const o = { v: 0 }; gsap.to(o, { v: +d.dataset.count, duration: 2.2, ease: 'power3.out', onUpdate: () => { d.textContent = Math.round(o.v).toLocaleString('en-US'); } }); } }));
    gsap.from('.about__body, .stats', { y: 40, opacity: 0, duration: 1, stagger: .12, ease: 'power3.out', scrollTrigger: { trigger: '.about__copy', start: 'top 75%', once: true } });
    gsap.from('.about__media', { clipPath: 'inset(100% 0 0 0 round 24px)', duration: 1.4, ease: 'power4.inOut', scrollTrigger: { trigger: '.about__media', start: 'top 85%', once: true } });
    gsap.to('.hero__title .line:first-child .in', { xPercent: -8, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__title .line--2 .in', { xPercent: 6, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
    const ct = $('#contactTitle'); ct.innerHTML = ct.innerHTML.replace(/(<em>)?([^<\s]+)(<\/em>)?/g, (m, a, w, b) => (a || '') + '<span class="wd">' + [...w].map((ch) => `<span class="c">${ch}</span>`).join('') + '</span>' + (b || ''));
    const chars = $$('.c', ct); gsap.from(chars, { yPercent: 120, opacity: 0, duration: 1, stagger: .02, ease: 'power4.out', scrollTrigger: { trigger: ct, start: 'top 80%', once: true } });
    ct.addEventListener('pointermove', (e) => chars.forEach((c) => { const b = c.getBoundingClientRect(), d = Math.hypot(e.clientX - b.left - b.width / 2, e.clientY - b.top - b.height / 2); c.style.transform = `translateY(${(-Math.max(0, 1 - d / 160) * 22).toFixed(1)}px)`; }));
    ct.addEventListener('pointerleave', () => chars.forEach((c) => { c.style.transform = ''; }));

    /* ── marquees ── */
    const langs = [...new Set(repos.map((r) => r.lang).filter((l) => l !== 'Code' && l !== 'Jupyter'))];
    const fill = (row, items) => { const html = items.map((s) => `<span>${s}</span>`).join(''); row.innerHTML = html + html; };
    const mq1 = $('#mq1'), mq2 = $('#mq2'); fill(mq1, [...langs, 'PyTorch', 'pandas']); fill(mq2, ['Streamlit', 'Plotly', 'Jupyter', 'Git', 'CMake', 'Hugging Face', 'Kaggle']);
    let m1 = 0, m2 = 0, dir = 1;
    function marqueeTick() { if (Math.abs(vel) > .2) dir = vel > 0 ? 1 : -1; const sp = (1.1 + Math.min(Math.abs(vel), 50) * .35) * dir, h1 = mq1.scrollWidth / 2, h2 = mq2.scrollWidth / 2;
      m1 -= sp; m2 += sp; if (m1 <= -h1) m1 += h1; if (m1 > 0) m1 -= h1; if (m2 >= 0) m2 -= h2; if (m2 < -h2) m2 += h2;
      const sk = clamp(-vel * .35, -10, 10); mq1.style.transform = `translateX(${m1.toFixed(1)}px) skewX(${sk}deg)`; mq2.style.transform = `translateX(${m2.toFixed(1)}px) skewX(${sk}deg)`; }

    /* ── intro ── */
    lenis.stop(); history.scrollRestoration = 'manual'; scrollTo(0, 0);
    gsap.set('.hero__title .in', { yPercent: 115 }); gsap.set('.hero__kicker, .hero__foot, .nav', { opacity: 0 }); blob.scale.setScalar(.01); cur.s = .01;
    target = 100;
    const go = () => { clearInterval(counter); num.textContent = '100'; window.__started = true;
      gsap.timeline()
        .to('#loader', { yPercent: -100, duration: 1.1, ease: 'power4.inOut', delay: .15 })
        .to('.hero__title .in', { yPercent: 0, duration: 1.3, ease: 'power4.out', stagger: .12 }, '-=.55')
        .to('.hero__kicker, .hero__foot, .nav', { opacity: 1, duration: .8, stagger: .08 }, '-=.9')
        .add(() => { $('#loader').remove(); lenis.start(); ScrollTrigger.refresh(); }); };
    const wait = setInterval(() => { if (shown >= 99) { clearInterval(wait); go(); } }, 60);
    window.__v7 = { lenis, cur, ring, step: (n = 60) => { for (let i = 0; i < n; i++) gsap.ticker.tick(); }, snap: () => { targetState(); Object.assign(cur, st); const wb = work.getBoundingClientRect(), p = clamp(-wb.top / Math.max(1, wb.height - H)); rot = -(p * (N - 1) / N) * Math.PI * 2; ringOn = wb.top < H * .6 && wb.bottom > H * .4 ? 1 : 0; gsap.ticker.tick(); } };
  }
})();
