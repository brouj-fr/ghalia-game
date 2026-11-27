/* «عالم المسبح» page controller: illustrated pool deck (GhaliaPoolScene) + walking Ghalia sprite + first-person slide rides (GhaliaPoolRide). */
(function () {
  'use strict';
  var T = THREE, K = GhaliaSceneKit, Q = K.detectQuality(), A = window.PoolAudio, ART = GhaliaArt.pool;
  var NAMES = { spiral: 'Pink Twister 🌀', drop: 'Sunny Drop ⚡', rainbow: 'Rainbow Tube 🌈', surf: "Surf's Up 🏄", river: 'Lazy River 🛟' };
  var SAY_GO = { spiral: 'اللولبية! 🌀', drop: 'النزلة الكبيرة! ⚡', rainbow: 'قوس قزح! 🌈', surf: 'ركمجة! 🏄', river: 'مسبح النهر! 🛟' };
  var HUD = { spiral: '👆 اضغطي مطوّل = أسرع · ↔ اسحبي = ميلي', drop: '👆 اضغطي مطوّل = أسرع · ↔ اسحبي = ميلي', rainbow: '👆 اضغطي مطوّل = أسرع · ↔ اسحبي = ميلي', surf: '👆 اسحبي = اقطعي الموجة · اضغطي مطوّل = أسرع', river: '👆 اسحبي = لفي الطوق · اضغطي = دفعة' };
  var canvas = document.getElementById('gl'), ov = document.getElementById('fx2d'), ox = ov.getContext('2d');
  var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: false, powerPreference: 'high-performance' });
  K.setupRenderer(T, renderer, Q); renderer.setSize(innerWidth, innerHeight);
  var scene = new T.Scene(), camera = new T.PerspectiveCamera(30, innerWidth / innerHeight, .5, 80);
  var mode = 'pool', busy = false, rides = 0;
  try { rides = +localStorage.getItem('ghalia_pool_rides') || 0; } catch (e) {}
  var countEl = document.getElementById('count'); function showCount() { countEl.textContent = '💦 ' + rides; } showCount();

  var world = GhaliaPoolScene.build(T, scene, { renderer: renderer, quality: Q, width: innerWidth, height: innerHeight, onEvent: onWorld });
  var fx = K.createPostFX(T, renderer, scene, camera, { quality: Q, bloom: Q === 'low' ? .5 : .6, radius: .55, threshold: .84, vignette: .38, grain: .045 });
  var ride = GhaliaPoolRide.create(T, renderer, { quality: Q, overlay: ov, audio: A, onEvent: onRide });
  var ghalia = createGhalia(T, {}); scene.add(ghalia.group);
  var gPos = { x: 0, z: .5 }, target = null, arrive = null, hidden = false;
  window.__pool = { world: world, ride: ride, ghalia: ghalia, camera: camera, get pos() { return gPos; }, get mode() { return mode; }, pick: pickSlide, startRide: startRide, events: [] };

  function placeGhalia() { var a = world.actorAt(gPos.x, gPos.z); ghalia.group.position.copy(a.position); ghalia.group.scale.setScalar(a.height / 1.62); ghalia.group.traverse(function (o) { o.renderOrder = a.renderOrder; }); return a; }
  function resize() { var w = innerWidth, h = innerHeight; renderer.setSize(w, h); fx.setSize(w, h); world.setView(camera, w, h); ride.resize(w, h); layoutCards(); }
  world.ready.then(function () { gPos.x = world.spawn.x; gPos.z = world.spawn.z; resize(); var l = document.getElementById('loader'); l.style.opacity = 0; setTimeout(function () { l.remove(); }, 500); window.__ready = true;
    setTimeout(function () { ghalia.react('wave'); ghalia.setExpression('happy', { duration: 2 }); say('يلا نتزحلق! 💦'); }, 600); });
  world.on('variant', function () { gPos.x = world.spawn.x; gPos.z = world.spawn.z; });
  addEventListener('resize', resize);

  /* thumbnails cropped from the painted plate */
  var CROP = { spiral: [.12, .08, .4, .7], drop: [.42, .1, .63, .72], rainbow: [.6, .2, .92, .74] };
  function layoutCards() { document.querySelectorAll('.sl').forEach(function (b) { var im = b.querySelector('.im'), id = b.dataset.slide;
    if (id === 'surf' || id === 'river') { im.style.backgroundImage = 'url(img/thumbs/pool-' + id + '.jpg)'; im.style.backgroundSize = 'cover'; im.style.backgroundPosition = 'center'; return; }
    var c = CROP[id], w = b.clientWidth, h = b.clientHeight, sx = w / (c[2] - c[0]), sy = h / (c[3] - c[1]), s = Math.max(sx, sy * 16 / 9), bw = s, bh = s * 9 / 16;
    im.style.backgroundSize = bw + 'px ' + bh + 'px'; im.style.backgroundPosition = (-(c[0] + c[2]) / 2 * bw + w / 2) + 'px ' + (-(c[1] + c[3]) / 2 * bh + h / 2) + 'px'; }); }

  var sayEl = document.getElementById('say'), sayT = 0;
  function say(t, ms) { sayEl.textContent = t; sayEl.classList.add('on'); clearTimeout(sayT); sayT = setTimeout(function () { sayEl.classList.remove('on'); }, ms || 1800); }
  function flash(on) { document.getElementById('flash').style.opacity = on ? 1 : 0; }

  function onWorld(type, d) {
    if (type === 'tap' || type === 'variant') return; window.__pool.events.push(type);
    if (type === 'slide') pickSlide(d.id);
    else if (type === 'flamingo') { A.boing(); ghalia.setExpression('happy', { duration: 1.5 }); ghalia.react('jump'); say('فلامنغو! 🦩'); }
    else if (type === 'ball') { A.boing(); ghalia.react('cheer'); say('كورة! ⚽'); }
    else if (type === 'water') { A.bubbles(6); var p = d.point ? worldToScreen(d.point) : null; if (p) splashAt(p.x, p.y, .45); ghalia.setExpression('surprised', { duration: 1 }); }
  }

  function slideSpot(id) { var extra = { surf: { x: -.7, z: .42 }, river: { x: .7, z: .42 } }; if (extra[id]) return extra[id]; var h = (world.stage.cfg.hits || []).filter(function (x) { return x.name === 'slide:' + id; })[0]; return h && h.spot ? { x: h.spot[0], z: h.spot[1] } : { x: 0, z: .3 }; }
  function pickSlide(id) {
    if (busy || mode !== 'pool' || !world.stage.ready) return false; busy = true; A.unlock(); A.pop();
    var sp = world.clampToWalkable(slideSpot(id)); target = sp; var t0 = performance.now();
    say(SAY_GO[id] || 'يلا! 💦');
    arrive = function () { ghalia.react('cheer'); ghalia.setExpression('happy', { duration: 2 }); A.giggle(3);
      setTimeout(function () { flash(true); A.whoosh(); setTimeout(function () { startRide(id); flash(false); }, 260); }, 650); };
    setTimeout(function () { if (arrive && performance.now() - t0 > 1500) { target = null; var f = arrive; arrive = null; f(); } }, 1600);
    return true;
  }
  function startRide(id) { mode = 'ride'; document.body.classList.add('riding'); document.getElementById('say').classList.remove('on'); document.getElementById('ridename').textContent = NAMES[id] || id; var hud = document.querySelector('#ridehud .chip'); if (hud) hud.textContent = HUD[id] || HUD.spiral; ride.start(id); }
  var lastRide = null;
  function onRide(type, d) {
    window.__pool.events.push('ride:' + type);
    if (type === 'done') { lastRide = d.id; mode = 'post'; document.body.classList.remove('riding'); ride.clearOverlay(); popUp(d.id); }
  }

  function worldToScreen(v) { var p = v.clone().project(camera); return { x: (p.x * .5 + .5) * innerWidth, y: (-p.y * .5 + .5) * innerHeight }; }
  function uvToScreen(u, v) { return worldToScreen(world.stage.uvToWorld(u, v, 0)); }

  /* Ghalia pops out of the water laughing */
  var pop = document.getElementById('pop'), popImg = document.getElementById('popimg'); popImg.src = ART.laugh;
  function popUp(id) {
    var slides = world.stage.cfg.slides || {}, ex = (slides[id] && slides[id].exit) || [.5, .74], p = uvToScreen(ex[0], ex[1]), h = Math.min(innerHeight * .42, innerWidth * .62), w = h * 640 / 453;
    pop.style.display = 'block'; pop.style.width = w + 'px'; pop.style.height = h + 'px'; pop.style.left = (Math.max(8, Math.min(innerWidth - w - 8, p.x - w / 2))) + 'px'; pop.style.top = (p.y - h * .92) + 'px';
    pop.querySelector('.clip').style.height = h + 'px'; pop.classList.remove('up'); void pop.offsetWidth; pop.classList.add('up');
    hidden = true; ghalia.group.visible = false; splashAt(p.x, p.y, 1.4); rides++; try { localStorage.setItem('ghalia_pool_rides', rides); } catch (e) {} showCount();
    setTimeout(function () { A.giggle(8); }, 350); setTimeout(function () { A.say(id === 'river' ? 'Ha ha ha! So relaxing! Again, again!' : 'Ha ha ha! That was so much fun! Again, again!'); }, 1500);
    setTimeout(function () { say(id === 'surf' ? 'هههه! موجة ثانية؟ 🏄' : id === 'river' ? 'هههه! مرة ثانية؟ 🛟' : 'هههه! مرة ثانية؟ 💦', 2200); }, 600);
    setTimeout(function () { splashAt(p.x, p.y, .5); }, 3000);
    setTimeout(function () { pop.style.display = 'none'; pop.classList.remove('up'); var sp = world.clampToWalkable(slideSpot(id)); gPos.x = sp.x; gPos.z = Math.min(1, sp.z + .35); ghalia.group.visible = true; hidden = false; ghalia.react('jump'); ghalia.setExpression('happy', { duration: 3 }); A.pop(); mode = 'pool'; busy = false; }, 3450);
  }

  /* 2D illustrated splash (droplets with ink outline, crown, rings) — pool mode only */
  var drops = [], rings = [];
  function splashAt(x, y, k) {
    var s = Math.min(innerWidth, innerHeight) / 700 * k;
    for (var i = 0; i < 46 * k; i++) { var a = -Math.PI / 2 + (Math.random() - .5) * 2.4, v = (260 + Math.random() * 520) * s; drops.push({ x: x + (Math.random() - .5) * 40 * s, y: y, vx: Math.cos(a) * v * .8, vy: Math.sin(a) * v, r: (4 + Math.random() * 9) * Math.max(.6, s), life: 1 + Math.random() * .5, y0: y }); }
    for (var j = 0; j < 3; j++) rings.push({ x: x, y: y, r: 10 * s, vr: (140 + j * 70) * s, life: 1.4 + j * .3, t: -j * .18, s: s });
  }
  function drawSplash(dt) {
    ox.clearRect(0, 0, ov.width, ov.height); if (!drops.length && !rings.length) return;
    rings = rings.filter(function (r) { r.t += dt; if (r.t < 0) return true; r.r += r.vr * dt; r.vr *= Math.exp(-1.6 * dt); var al = Math.max(0, 1 - r.t / r.life); ox.strokeStyle = 'rgba(255,255,255,' + (al * .9).toFixed(3) + ')'; ox.lineWidth = 5 * r.s + 1; ox.beginPath(); ox.ellipse(r.x, r.y, r.r, r.r * .3, 0, 0, Math.PI * 2); ox.stroke(); return r.t < r.life; });
    drops = drops.filter(function (d) { d.vy += 1400 * dt * (innerHeight / 844); d.x += d.vx * dt; d.y += d.vy * dt; d.life -= dt; if (d.y > d.y0 + 6 && d.vy > 0) d.life = 0;
      ox.fillStyle = '#ffffff'; ox.strokeStyle = 'rgba(70,140,200,.85)'; ox.lineWidth = 2; ox.beginPath(); var ang = Math.atan2(d.vy, d.vx); ox.ellipse(d.x, d.y, d.r * 1.35, d.r * .85, ang, 0, Math.PI * 2); ox.fill(); ox.stroke();
      ox.fillStyle = '#bff3ff'; ox.beginPath(); ox.arc(d.x + d.r * .25, d.y + d.r * .2, d.r * .4, 0, Math.PI * 2); ox.fill(); return d.life > 0; });
  }

  /* input */
  var ray = new T.Raycaster(), ndc = new T.Vector2(), px = 0, py = 0, down = null;
  addEventListener('pointermove', function (e) {
    if (mode === 'ride') { if (down) ride.lean((e.clientX - down.x) / (innerWidth * .25) * -1); return; }
    if (e.pointerType === 'mouse') { px = e.clientX / innerWidth * 2 - 1; py = -(e.clientY / innerHeight * 2 - 1); }
  });
  canvas.addEventListener('pointerdown', function (e) { A.unlock(); down = { x: e.clientX, y: e.clientY, t: performance.now() }; if (mode === 'ride') ride.boost(true); });
  addEventListener('pointerup', function (e) { var d = down; down = null; if (mode === 'ride') { ride.boost(false); ride.lean(0); return; } if (!d || e.target !== canvas) return; if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 14) tap(e.clientX, e.clientY); });
  addEventListener('pointercancel', function () { down = null; ride.boost(false); ride.lean(0); });
  function tap(x, y) {
    if (mode !== 'pool' || !world.stage.ready) return; ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
    var hit = K.pick(ray, world.interactables);
    if (hit) { hit.entry.onTap(hit.point); return; }
    var f = ray.intersectObject(world.stage.plate); if (f.length) { var fl = world.floorFromHit(f[0]); if (fl && fl.z > -.4 && fl.z < 1.2) { target = world.clampToWalkable({ x: fl.x, z: fl.z }); A.pop(); } }
  }
  document.querySelectorAll('.sl').forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); A.unlock(); if (!pickSlide(b.dataset.slide)) A.tick(); }); });
  var snd = document.getElementById('snd'); function sndIcon() { snd.textContent = A.on ? '🔊' : '🔇'; } sndIcon();
  snd.addEventListener('click', function () { A.unlock(); A.setOn(!A.on); sndIcon(); });
  document.getElementById('home').addEventListener('click', function (e) { e.preventDefault(); var go = function () { location.href = 'index.html#menu'; }; (window.V2 && V2.wipe) ? V2.wipe(go, 'القائمة') : go(); });
  window.__walk = function (x, z) { target = world.clampToWalkable({ x: x, z: z }); };

  /* loop */
  var last = performance.now();
  function frame() {
    requestAnimationFrame(frame);
    var now = performance.now(), dt = Math.min((now - last) / 1000, .1); last = now; if (window.__pause) return;
    if (mode === 'ride') { ride.update(dt); if (mode === 'ride' || ride.active) { ride.render(dt); return; } }
    world.update(dt);
    if (world.stage.ready) {
      var a = placeGhalia();
      if (target) { var dx = target.x - gPos.x, dz = target.z - gPos.z, dd = Math.hypot(dx * 1.6, dz);
        if (dd < .012) { target = null; if (arrive) { var f = arrive; arrive = null; f(); } }
        else { var sp = .55 * Math.max(.45, a.speedScale) * dt, k = Math.min(1, sp / dd); gPos.x += dx * k; gPos.z += dz * k; world.clampToWalkable(gPos); } }
      placeGhalia();
      if (target) { var yaw = Math.atan2((target.x - gPos.x) * 1.6, target.z - gPos.z), cur = ghalia.group.rotation.y; ghalia.group.rotation.y = cur + Math.atan2(Math.sin(yaw - cur), Math.cos(yaw - cur)) * Math.min(1, dt * 8); }
      else ghalia.group.rotation.y = K.damp(ghalia.group.rotation.y, 0, 3, dt);
      ghalia.update(dt, target ? { speed: 1.6, turnRate: 0 } : { speed: 0, turnRate: 0 });
    }
    world.updateCamera(camera, dt, px, py);
    fx.render(dt);
    drawSplash(dt);
  }
  requestAnimationFrame(frame);
})();
