/* BRAVA Studio — amanecer, reveals, ritual, tilt, magnetic, counters */
(function () {
  'use strict';
  const docEl = document.documentElement;
  docEl.classList.remove('no-js');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;

  /* ── utils ── */
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  const smooth = (a, b, x) => { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
  const hexToRgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (c1, c2, t) => c1.map((v, i) => Math.round(lerp(v, c2[i], t)));

  /* ── Amanecer: espresso → brasa → oro → crema ── */
  const SKY = ['#1E1A17', '#33241C', '#7A4A33', '#C99A6E', '#F6F1EA'].map(hexToRgb);
  const INK_L = hexToRgb('#F3EDE4'), INK_D = hexToRgb('#221C17');
  const dawn = document.getElementById('dawn');
  const disciplinas = document.querySelector('.disciplinas');
  const ritual = document.getElementById('ritual');
  const nav = document.getElementById('nav');

  function skyColor(t) {
    const seg = clamp(t, 0, 1) * (SKY.length - 1);
    const i = Math.min(Math.floor(seg), SKY.length - 2);
    return mix(SKY[i], SKY[i + 1], seg - i);
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = window.scrollY;
      nav.classList.toggle('solid', y > 30);

      /* progreso del amanecer: de mitad de la promesa al inicio del ritual */
      const end = ritual ? ritual.offsetTop - innerHeight * 0.25 : innerHeight * 3;
      const start = innerHeight * 0.6;
      const p = reduced ? (y > (start + end) / 2 ? 1 : 0) : smooth(start, end, y);
      const [r, g, b] = skyColor(p);
      dawn.style.setProperty('--dawn-bg', `rgb(${r},${g},${b})`);
      document.body.classList.toggle('day', p > 0.72);

      /* tinta fluida de la sección disciplinas (legible en plena transición) */
      if (disciplinas) {
        const ink = mix(INK_L, INK_D, smooth(0.55, 0.85, p));
        disciplinas.style.setProperty('--ink-now', `rgb(${ink[0]},${ink[1]},${ink[2]})`);
      }
    });
  }
  dawn.style.setProperty('--dawn-bg', '#1E1A17');
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Reveals + counters ── */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      if (e.target.classList.contains('lines')) e.target.classList.add('play');
      e.target.querySelectorAll?.('[data-count]').forEach(runCounter);
      if (e.target.hasAttribute && e.target.hasAttribute('data-count')) runCounter(e.target);
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -10% 0px' });

  document.querySelectorAll('.rev').forEach(el => io.observe(el));
  document.querySelectorAll('.lines').forEach(el => { el.classList.add('pre'); io.observe(el); });
  document.querySelectorAll('.stats').forEach(el => io.observe(el));

  const counted = new WeakSet();
  function runCounter(el) {
    if (counted.has(el) || reduced) { el.textContent = el.dataset.count; return; }
    counted.add(el);
    const end = parseInt(el.dataset.count, 10), t0 = performance.now(), dur = 1400;
    (function tick(now) {
      const p = clamp((now - t0) / dur, 0, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* Barrido inicial: lo que ya está en viewport se revela sin esperar al observer */
  document.querySelectorAll('.rev, .lines, .stats').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight * 0.92 && r.bottom > 0) {
      el.classList.add('in');
      if (el.classList.contains('lines')) el.classList.add('play');
      el.querySelectorAll('[data-count]').forEach(runCounter);
      io.unobserve(el);
    }
  });

  /* ── Ritual: paso activo ⇄ frame visible ── */
  const steps = document.querySelectorAll('.step');
  const frames = document.querySelectorAll('.rframe');
  if (steps.length && frames.length) {
    const sio = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const n = e.target.dataset.step;
        steps.forEach(s => s.classList.toggle('on', s.dataset.step === n));
        frames.forEach(f => f.classList.toggle('on', f.dataset.step === n));
      });
    }, { rootMargin: '-40% 0px -40% 0px' });
    steps.forEach(s => sio.observe(s));
  }

  /* ── Tilt 3D en cards (solo pointer fino) ── */
  if (finePointer && !reduced) {
    document.querySelectorAll('.tilt').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - 0.5) * -7;
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 7;
        card.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });

    /* ── Botones magnéticos ── */
    document.querySelectorAll('.magnetic').forEach(el => {
      const strength = el.classList.contains('fab') ? 0.4 : 0.35;
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ── Hero video: pausa fuera de viewport ── */
  const vid = document.getElementById('hero-video');
  if (vid) {
    if (reduced) { vid.removeAttribute('autoplay'); vid.pause(); }
    else new IntersectionObserver(([e]) =>
      e.isIntersecting ? vid.play().catch(() => {}) : vid.pause()
    , { threshold: 0.1 }).observe(vid);
  }
})();
