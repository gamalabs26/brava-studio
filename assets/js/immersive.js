/* BRAVA — capa inmersiva (nivel 2: ambiente vivo · nivel 3: kettlebell 3D) */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;

/* ═══ Nivel 2 — polvo dorado reactivo en el hero ═══ */
(function dust() {
  if (reduced) return;
  const hero = document.getElementById('hero');
  const cv = document.getElementById('dust');
  if (!hero || !cv) return;
  const ctx = cv.getContext('2d');
  let w, h, parts = [], mx = -999, my = -999, running = false, raf = 0;

  function size() {
    w = cv.width = hero.clientWidth;
    h = cv.height = hero.clientHeight;
  }
  function seed() {
    parts = Array.from({ length: 70 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: 0.6 + Math.random() * 1.8,
      vx: -0.08 - Math.random() * 0.15, vy: -0.05 - Math.random() * 0.1,
      o: 0.15 + Math.random() * 0.45, ph: Math.random() * Math.PI * 2
    }));
  }
  function tick(t) {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
      if (d2 < 22500) { const f = (1 - d2 / 22500) * 0.6; p.x += (dx / Math.sqrt(d2 + 1)) * f; p.y += (dy / Math.sqrt(d2 + 1)) * f; }
      p.x += p.vx; p.y += p.vy;
      if (p.x < -5) p.x = w + 5; if (p.y < -5) p.y = h + 5;
      const tw = 0.7 + 0.3 * Math.sin(t / 900 + p.ph);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 7);
      ctx.fillStyle = `rgba(255,205,140,${(p.o * tw).toFixed(3)})`;
      ctx.fill();
    }
    raf = requestAnimationFrame(tick);
  }
  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    mx = e.clientX - r.left; my = e.clientY - r.top;
  });
  hero.addEventListener('pointerleave', () => { mx = my = -999; });
  new IntersectionObserver(([e]) => {
    running = e.isIntersecting && !document.hidden;
    if (running) { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); }
  }, { threshold: 0.05 }).observe(hero);
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); }
  });
  size(); seed();
  addEventListener('resize', () => { size(); seed(); });
})();

/* ═══ Nivel 2 — luz cálida que sigue al cursor (solo desktop) ═══ */
(function spotlight() {
  if (reduced || !finePointer) return;
  const s = document.getElementById('spotlight');
  if (!s) return;
  let tx = innerWidth / 2, ty = innerHeight / 3, x = tx, y = ty, raf = 0;
  addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; });
  (function loop() {
    x += (tx - x) * 0.06; y += (ty - y) * 0.06;
    s.style.background = `radial-gradient(520px at ${x}px ${y}px, rgba(255,190,120,.06), transparent 65%)`;
    raf = requestAnimationFrame(loop);
  })();
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(raf);
    if (!document.hidden) raf = requestAnimationFrame(function loop2() {
      x += (tx - x) * 0.06; y += (ty - y) * 0.06;
      s.style.background = `radial-gradient(520px at ${x}px ${y}px, rgba(255,190,120,.06), transparent 65%)`;
      raf = requestAnimationFrame(loop2);
    });
  });
})();

/* ═══ Nivel 3 — kettlebell 3D navegable ═══ */
(function kettlebell() {
  const wrap = document.getElementById('kb3d');
  if (!wrap) return;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) {
    wrap.classList.add('kb-fallback');
    return;
  }
  const DPR = Math.min(devicePixelRatio, 1.6);
  renderer.setPixelRatio(DPR);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  wrap.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  camera.position.set(2.6, 1.9, 4.2);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  /* luz de amanecer: dorada desde la izquierda (como el ventanal) */
  const sun = new THREE.DirectionalLight(0xffb877, 3.0);
  sun.position.set(-3.5, 4.5, 5);
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xffe6c8, 0x30241c, 1.25));
  const rim = new THREE.DirectionalLight(0xffe0c0, 0.9);
  rim.position.set(4, 3, -4);
  scene.add(rim);

  /* kettlebell procedural: cuerpo + base + asa (hierro fundido: mate, no cromo) */
  const iron = new THREE.MeshStandardMaterial({ color: 0x2b2829, roughness: 0.52, metalness: 0.5 });
  const kb = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), iron);
  body.scale.set(1, 0.94, 1);
  body.position.y = 1.0;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.18, 48), iron);
  base.position.y = 0.09;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.135, 28, 64, Math.PI), iron);
  handle.position.y = 1.78;
  const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.16, 0.5, 24), iron);
  postL.position.set(-0.58, 1.62, 0);
  const postR = postL.clone();
  postR.position.x = 0.58;
  kb.add(body, base, handle, postL, postR);
  scene.add(kb);

  /* sombra falsa: plano con gradiente radial */
  const sc = document.createElement('canvas'); sc.width = sc.height = 256;
  const sg = sc.getContext('2d');
  const grad = sg.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, 'rgba(34,28,23,.42)'); grad.addColorStop(1, 'rgba(34,28,23,0)');
  sg.fillStyle = grad; sg.fillRect(0, 0, 256, 256);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 3.4),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.005;
  scene.add(shadow);

  /* controles: solo desktop; móvil = autorrotación (no secuestrar scroll) */
  let controls = null, userTouched = false;
  if (finePointer) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.0, 0);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minPolarAngle = 0.6;
    controls.maxPolarAngle = 1.75;
    controls.addEventListener('start', () => { userTouched = true; wrap.classList.add('kb-touched'); });
  }

  /* hotspots que siguen puntos 3D */
  const spots = [
    { el: document.querySelector('[data-spot="asa"]'), p: new THREE.Vector3(0, 1.95, 0) },
    { el: document.querySelector('[data-spot="cuerpo"]'), p: new THREE.Vector3(0.85, 0.9, 0.4) }
  ].filter(s => s.el);

  function layout() {
    const r = wrap.getBoundingClientRect();
    const w = Math.max(r.width, 1), h = Math.max(r.height, 1);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  layout();
  addEventListener('resize', layout);

  let visible = false, raf = 0;
  const v = new THREE.Vector3();
  function render(t) {
    if (!visible) return;
    if (!userTouched && !reduced) kb.rotation.y = t / 4200;
    if (controls) controls.update();
    renderer.render(scene, camera);
    const r = wrap.getBoundingClientRect();
    for (const s of spots) {
      v.copy(s.p).applyMatrix4(kb.matrixWorld).project(camera);
      s.el.style.transform = `translate(${((v.x + 1) / 2 * r.width).toFixed(1)}px, ${((1 - v.y) / 2 * r.height).toFixed(1)}px)`;
      s.el.style.opacity = v.z < 1 ? 1 : 0;
    }
    raf = requestAnimationFrame(render);
  }
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting && !document.hidden;
    if (visible) { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); }
  }, { threshold: 0.1 }).observe(wrap);
  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    if (visible) { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); }
  });
})();
