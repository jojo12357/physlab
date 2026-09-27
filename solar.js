(() => {
  'use strict';

  const canvas = document.getElementById('solar-system');
  if (!canvas || !canvas.getContext) return;

  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const bodies = [
    { name: 'Меркурий', au: .387, e: .206, period: 88, radius: 3.1, tint: '#b5a79a', kind: 'mercury' },
    { name: 'Венера', au: .723, e: .007, period: 225, radius: 4.5, tint: '#e5c58e', kind: 'venus' },
    { name: 'Жер', au: 1, e: .017, period: 365.25, radius: 5, tint: '#4b9bcb', kind: 'earth' },
    { name: 'Марс', au: 1.524, e: .093, period: 687, radius: 4, tint: '#c75d47', kind: 'mars' },
    { name: 'Юпитер', au: 5.203, e: .049, period: 4333, radius: 12.8, tint: '#d1ae8a', kind: 'jupiter' },
    { name: 'Сатурн', au: 9.537, e: .057, period: 10759, radius: 10.8, tint: '#dbc494', kind: 'saturn' },
    { name: 'Уран', au: 19.19, e: .046, period: 30687, radius: 7.6, tint: '#9edbdc', kind: 'uranus' },
    { name: 'Нептун', au: 30.07, e: .011, period: 60190, radius: 7.8, tint: '#4777c9', kind: 'neptune' }
  ];
  const TAU = Math.PI * 2;
  let width = 0, height = 0, dpr = 1, stars = [], textures = {};
  let frame = 0, elapsed = 0, lastFrame = 0, destroyed = false;

  function randomFrom(seed) {
    let value = seed >>> 0;
    return () => {
      value += 0x6D2B79F5;
      let t = value;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeSurface(kind) {
    const size = 192;
    const surface = document.createElement('canvas');
    surface.width = surface.height = size;
    const g = surface.getContext('2d');
    const rand = randomFrom(kind.length * 997 + kind.charCodeAt(0) * 31);
    const palettes = {
      mercury: ['#8d8984', '#6f706f', '#c0b4a6', '#555b5f'],
      venus: ['#dbbd83', '#f0d8a7', '#b88e59', '#e9c995'],
      earth: ['#0866a0', '#1688bd', '#064a80', '#60c9d3'],
      mars: ['#9d4934', '#c16a4b', '#71392f', '#dc8861'],
      jupiter: ['#bd9d7d', '#e0c4a0', '#a97e62', '#d5aa83'],
      saturn: ['#cbb486', '#e6d2a8', '#a99166', '#d9c18e'],
      uranus: ['#9ad4d4', '#c2ece4', '#74bfc8', '#b0e4df'],
      neptune: ['#17419b', '#285ec2', '#3275d8', '#102c79']
    }[kind];

    g.fillStyle = palettes[0];
    g.fillRect(0, 0, size, size);

    if (['jupiter', 'saturn', 'uranus', 'neptune'].includes(kind)) {
      let y = 0;
      let band = 0;
      while (y < size) {
        const h = 4 + rand() * (kind === 'jupiter' ? 14 : 19);
        g.globalAlpha = .32 + rand() * .42;
        g.fillStyle = palettes[1 + (band++ % (palettes.length - 1))];
        g.fillRect(0, y, size, h);
        if (rand() > .42) {
          g.globalAlpha = .16;
          g.strokeStyle = palettes[(band + 1) % palettes.length];
          g.lineWidth = 1 + rand() * 2;
          g.beginPath();
          const shift = rand() * 30;
          g.moveTo(0, y + h * .72);
          g.bezierCurveTo(55, y + h + shift, 132, y - shift, size, y + h * .4);
          g.stroke();
        }
        y += h;
      }
      g.globalAlpha = 1;
    }

    if (kind === 'earth') {
      const continents = [
        [[.10,.23],[.17,.15],[.26,.17],[.29,.24],[.25,.31],[.29,.38],[.25,.47],[.21,.54],[.18,.48],[.15,.42],[.10,.37],[.08,.29]],
        [[.28,.53],[.34,.55],[.38,.63],[.36,.72],[.32,.81],[.28,.73],[.26,.64]],
        [[.43,.22],[.50,.18],[.57,.20],[.63,.24],[.70,.23],[.77,.28],[.84,.30],[.88,.37],[.83,.43],[.77,.42],[.73,.47],[.68,.45],[.64,.40],[.58,.42],[.55,.37],[.50,.40],[.45,.35],[.41,.29]],
        [[.49,.43],[.55,.46],[.57,.55],[.55,.65],[.52,.76],[.48,.69],[.46,.59],[.47,.50]],
        [[.76,.56],[.83,.58],[.86,.65],[.83,.74],[.78,.77],[.74,.69]]
      ];
      continents.forEach((points, index) => {
        g.beginPath();
        points.forEach(([x, y], i) => i ? g.lineTo(x * size, y * size) : g.moveTo(x * size, y * size));
        g.closePath();
        g.fillStyle = index % 2 ? '#65a76f' : '#39865e';
        g.fill();
        g.strokeStyle = '#8cbf78';
        g.lineWidth = 2;
        g.stroke();
      });
      g.globalAlpha = .6;
      for (let i = 0; i < 24; i++) {
        const y = rand() * size, x = rand() * size;
        g.strokeStyle = i % 2 ? '#e5f4ec' : '#d5e7e8';
        g.lineWidth = 1 + rand() * 3;
        g.beginPath();
        g.moveTo(x - 34, y - 8);
        g.bezierCurveTo(x - 10, y - 24, x + 12, y + 20, x + 38, y + 3);
        g.stroke();
      }
      g.globalAlpha = 1;
    }

    if (kind === 'mercury' || kind === 'mars') {
      const count = kind === 'mercury' ? 115 : 78;
      for (let i = 0; i < count; i++) {
        const x = rand() * size, y = rand() * size, r = 1.2 + rand() * (kind === 'mercury' ? 8 : 6);
        g.globalAlpha = .16 + rand() * .36;
        g.fillStyle = palettes[1 + Math.floor(rand() * (palettes.length - 1))];
        g.beginPath();
        g.ellipse(x, y, r, r * (.65 + rand() * .2), 0, 0, TAU);
        g.fill();
        g.globalAlpha = .22;
        g.strokeStyle = '#f4d1b5';
        g.lineWidth = Math.max(.5, r * .13);
        g.beginPath();
        g.arc(x - r * .08, y - r * .08, r * .76, Math.PI * 1.05, Math.PI * 1.85);
        g.stroke();
      }
      g.globalAlpha = 1;
    }

    if (kind === 'venus' || kind === 'mars') {
      for (let i = 0; i < 25; i++) {
        const x = rand() * size, y = rand() * size;
        g.globalAlpha = .13 + rand() * .18;
        g.strokeStyle = palettes[1 + Math.floor(rand() * (palettes.length - 1))];
        g.lineWidth = 2 + rand() * 7;
        g.beginPath();
        g.moveTo(x - 25, y + 4);
        g.bezierCurveTo(x - 5, y - 20, x + 15, y + 23, x + 36, y - 5);
        g.stroke();
      }
      g.globalAlpha = 1;
    }

    if (kind === 'jupiter') {
      const x = 126, y = 114, rx = 29, ry = 15;
      const storm = g.createRadialGradient(x - 5, y - 2, 2, x, y, rx);
      storm.addColorStop(0, '#f4b095');
      storm.addColorStop(.62, '#cb765a');
      storm.addColorStop(1, '#8e594f');
      g.fillStyle = storm;
      g.beginPath();
      g.ellipse(x, y, rx, ry, -.12, 0, TAU);
      g.fill();
      g.strokeStyle = '#efc1a2';
      g.globalAlpha = .65;
      g.lineWidth = 2;
      g.beginPath();
      g.ellipse(x, y - 2, rx * .78, ry * .55, -.12, 0, TAU);
      g.stroke();
      g.globalAlpha = 1;
    }

    if (kind === 'saturn') {
      g.globalAlpha = .2;
      for (let i = 0; i < 5; i++) {
        g.fillStyle = i % 2 ? '#fff1cf' : '#947b56';
        g.fillRect(0, 79 + i * 8, size, 2);
      }
      g.globalAlpha = 1;
    }

    const haze = g.createRadialGradient(size * .34, size * .28, size * .04, size * .55, size * .54, size * .72);
    haze.addColorStop(0, 'rgba(255,255,255,.2)');
    haze.addColorStop(.55, 'rgba(255,255,255,.015)');
    haze.addColorStop(1, 'rgba(0,0,0,.28)');
    g.fillStyle = haze;
    g.fillRect(0, 0, size, size);
    return surface;
  }

  function createTextures() {
    bodies.forEach(body => { textures[body.kind] = makeSurface(body.kind); });
  }

  function createStars() {
    const rand = randomFrom(Math.round(width * 13 + height * 7));
    const count = Math.max(70, Math.min(190, Math.round(width * height / 5200)));
    stars = Array.from({ length: count }, () => ({
      x: rand(), y: rand(), r: .35 + rand() * 1.05,
      phase: rand() * TAU, alpha: .2 + rand() * .55,
      cool: rand() > .68
    }));
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width || window.innerWidth);
    height = Math.max(1, rect.height || window.innerHeight);
    const mobile = width < 650;
    dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.2 : 1.45);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    createStars();
    paint(elapsed, performance.now());
  }

  function drawSaturnRings(x, y, radius, orbitScale, front) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-.18);
    const inner = radius * 1.22;
    const outer = radius * 2.02;
    if (front) {
      ctx.beginPath();
      ctx.rect(-outer * 1.4, 0, outer * 2.8, outer * 1.35);
      ctx.clip();
    }
    const colors = ['rgba(245,224,183,.58)', 'rgba(140,118,84,.34)', 'rgba(238,215,172,.55)', 'rgba(99,84,64,.46)', 'rgba(229,205,159,.48)'];
    colors.forEach((color, i) => {
      const r1 = inner + (outer - inner) * i / colors.length;
      const r2 = inner + (outer - inner) * (i + .72) / colors.length;
      ctx.beginPath();
      ctx.ellipse(0, 0, (r1 + r2) / 2, (r1 + r2) / 2 * .34, 0, 0, TAU);
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, (r2 - r1) * .85);
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 1.54, radius * 1.54 * .34, 0, 0, TAU);
    ctx.strokeStyle = 'rgba(20,27,37,.7)';
    ctx.lineWidth = Math.max(1, radius * .07);
    ctx.stroke();
    ctx.restore();
  }

  function drawBody(body, x, y, r, phase) {
    if (body.kind === 'saturn') drawSaturnRings(x, y, r, 1, false);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(phase);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.clip();
    ctx.drawImage(textures[body.kind], -r, -r, r * 2, r * 2);
    const light = ctx.createRadialGradient(-r * .45, -r * .5, r * .08, r * .13, r * .1, r * 1.45);
    light.addColorStop(0, 'rgba(255,255,255,.19)');
    light.addColorStop(.5, 'rgba(255,255,255,.015)');
    light.addColorStop(1, 'rgba(1,7,18,.72)');
    ctx.fillStyle = light;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.restore();
    if (body.kind === 'earth') {
      ctx.beginPath();
      ctx.arc(x, y, r * 1.08, 0, TAU);
      ctx.strokeStyle = 'rgba(117,221,255,.36)';
      ctx.lineWidth = Math.max(.6, r * .1);
      ctx.stroke();
    }
    if (body.kind === 'saturn') drawSaturnRings(x, y, r, 1, true);
  }

  function drawSun(x, y, r, time) {
    ctx.save();
    const halo = ctx.createRadialGradient(x, y, r * .25, x, y, r * 6.5);
    halo.addColorStop(0, 'rgba(255,214,117,.35)');
    halo.addColorStop(.26, 'rgba(255,130,48,.14)');
    halo.addColorStop(1, 'rgba(255,91,31,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, r * 6.5, 0, TAU);
    ctx.fill();

    ctx.translate(x, y);
    const rays = 28;
    for (let i = 0; i < rays; i++) {
      const a = i * TAU / rays + time * .000018;
      const inner = r * (1.08 + .06 * Math.sin(i * 1.73));
      const outer = r * (1.28 + .15 * (.5 + .5 * Math.sin(i * 2.41 + time * .0005)));
      ctx.beginPath();
      ctx.moveTo(Math.cos(a - .035) * inner, Math.sin(a - .035) * inner);
      ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
      ctx.lineTo(Math.cos(a + .035) * inner, Math.sin(a + .035) * inner);
      ctx.closePath();
      ctx.fillStyle = i % 3 ? 'rgba(255,185,81,.13)' : 'rgba(255,224,133,.22)';
      ctx.fill();
    }
    const disk = ctx.createRadialGradient(-r * .32, -r * .42, r * .08, 0, 0, r * 1.12);
    disk.addColorStop(0, '#fff6bb');
    disk.addColorStop(.25, '#ffe17a');
    disk.addColorStop(.58, '#ff9c37');
    disk.addColorStop(1, '#e95126');
    ctx.fillStyle = disk;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r * .97, 0, TAU);
    ctx.clip();
    const rand = randomFrom(41);
    for (let i = 0; i < 45; i++) {
      const a = rand() * TAU, rr = Math.sqrt(rand()) * r * .94, spot = .4 + rand() * r * .13;
      ctx.fillStyle = i % 3 ? 'rgba(255,247,165,.18)' : 'rgba(218,78,29,.12)';
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * rr, Math.sin(a) * rr, spot, spot * (.45 + rand()), a, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    ctx.restore();
  }

  function paint(time, now) {
    if (destroyed || !width || !height) return;
    ctx.clearRect(0, 0, width, height);
    const twinkleTime = time * .001;
    stars.forEach(star => {
      const alpha = star.alpha * (.72 + .28 * Math.sin(twinkleTime * .7 + star.phase));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = star.cool ? '#b8ddff' : '#fff0c7';
      ctx.beginPath();
      ctx.arc(star.x * width, star.y * height, star.r, 0, TAU);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    const cx = width * .53;
    const cy = height * .48;
    const maxOrbit = Math.max(52, Math.min(width * .48, height * .43));
    const scale = Math.max(.56, Math.min(1, Math.min(width, height) / 760));
    const bodyScale = Math.max(.68, Math.min(1.12, Math.min(width, height) / 760));
    const orbitRot = -.14;

    bodies.forEach((body, i) => {
      const major = maxOrbit * Math.sqrt(body.au / 30.07);
      const minor = major * Math.sqrt(1 - body.e * body.e);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(orbitRot);
      ctx.beginPath();
      ctx.ellipse(-major * body.e, 0, major, minor, 0, 0, TAU);
      ctx.strokeStyle = i < 4 ? 'rgba(130,205,231,.14)' : 'rgba(130,205,231,.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    });

    const sunRadius = Math.max(13, 23 * bodyScale);
    drawSun(cx, cy, sunRadius, time);
    bodies.forEach((body, i) => {
      const major = maxOrbit * Math.sqrt(body.au / 30.07);
      const minor = major * Math.sqrt(1 - body.e * body.e);
      const visiblePeriod = 52 * Math.pow(body.period / 365.25, .43);
      const angle = time / (visiblePeriod * 1000) * TAU + i * .94;
      const ex = -major * body.e + major * Math.cos(angle);
      const ey = minor * Math.sin(angle);
      const x = cx + ex * Math.cos(orbitRot) - ey * Math.sin(orbitRot);
      const y = cy + ex * Math.sin(orbitRot) + ey * Math.cos(orbitRot);
      const radius = Math.max(2.7, body.radius * scale);
      drawBody(body, x, y, radius, time / (body.period * 80) + i * .21);
    });

    const vignette = ctx.createRadialGradient(width * .52, height * .48, Math.min(width, height) * .19, width * .52, height * .48, Math.max(width, height) * .72);
    vignette.addColorStop(0, 'rgba(3,10,19,0)');
    vignette.addColorStop(1, 'rgba(3,10,19,.34)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }

  function animate(now) {
    frame = 0;
    if (destroyed || document.hidden || reducedMotion.matches) return;
    if (!lastFrame) lastFrame = now;
    const delta = Math.min(.06, Math.max(0, (now - lastFrame) / 1000));
    if (now - lastFrame >= (width < 650 ? 48 : 32)) {
      elapsed += delta * 1000;
      lastFrame = now;
      paint(elapsed, now);
    }
    frame = requestAnimationFrame(animate);
  }

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastFrame = 0;
  }

  function start() {
    stop();
    paint(elapsed, performance.now());
    if (!destroyed && !document.hidden && !reducedMotion.matches) frame = requestAnimationFrame(animate);
  }

  function onVisibility() {
    if (document.hidden) stop();
    else start();
  }

  createTextures();
  resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(document.documentElement);
  else window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', start);
  else reducedMotion.addListener(start);
  start();
  window.addEventListener('pagehide', () => {
    destroyed = true;
    stop();
    document.removeEventListener('visibilitychange', onVisibility);
  }, { once: true });
})();
