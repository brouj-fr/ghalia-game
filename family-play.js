/* Family / cousins play: place up to 4 guests + Ghalia in garden, toy room, water park and the 3D house.
   Tap = wave + Arabic name tag + English TTS. Drag onto another kid = hug / high-five / chase.
   Group games (hide-and-seek, tag, dance, ball, water fight, build, mama hug). Idle kids play on their own. */
(function () {
  'use strict';
  if (!window.FamilySprite) return;
  var FS = window.FamilySprite, AR = FS.arabic, SN = FS.sayName;
  var LINES = {
    hi: {
      hoor: ['هلا غالية! أنا حور! يلا نلعب! 💗', 'Hi Ghalia! It\'s me, Hoore! Let\'s play!'],
      nada: ['هلا! أنا ندى! يلا نلعب سوا!', 'Hi Ghalia! I am Nadah! Let\'s play together!'],
      fahad: ['أنا فهد! يلا نلعب!', 'Hi Ghalia! I am Fahad! Let\'s play!'],
      abdullah: ['أنا عبدالله! يلا!', 'Hi Ghalia! I am Abdullah! Come on, let\'s play!'],
      saud: ['أنا سعود، أخوج! 💙', 'Hi Ghalia! I am Saood, your brother!'],
      saif: ['سيف! هههه! 🍼', 'Hi! I am Sayf! Hee hee!'],
      mama: ['هلا بنتي غالية! 💗', 'Hello my darling Ghalia! Mama loves you!']
    },
    highfive: ['تخميلة! ✋', 'High five!'],
    hug: ['حضنة! 💗', 'Aww, a big hug!'],
    chase: ['لحّيس! يلا أمسكك!', 'Tag! I am going to catch you!'],
    seekStart: ['غميضة! واحد، اثنين، ثلاثة!', 'Hide and seek! One, two, three!'],
    seekFound: ['لقيتُك!', 'Found you!'],
    seekAll: ['لقيتكم كلكم! 🎉', 'I found you all! That was so much fun!'],
    dance: ['يلا نرقص! 💃', 'Let us hold hands and dance!'],
    ball: ['كورة! لفّوها! ⚽', 'Catch the ball!'],
    water: ['حرب مي! 💦', 'Water fight! Splash!'],
    build: ['نبني برج عالي سوا! 🧱', 'Let us build a tall tower together!'],
    mamaHug: ['تعالي يا غالية! حضنة من ماما!', 'Come here, Ghalia! A big hug from Mama!']
  };
  var ROSTERS = {
    garden: ['mama', 'hoor', 'saud', 'fahad', 'saif', 'abdullah', 'nada'],
    toys: ['nada', 'abdullah', 'saud', 'fahad', 'hoor'],
    pool: ['hoor', 'nada', 'fahad', 'abdullah', 'saif'],
    house: ['mama', 'saud', 'saif', 'hoor']
  };
  var GAMES = {
    garden: ['seek', 'tag', 'dance', 'highfive', 'ball', 'mamaHug'],
    toys: ['seek', 'tag', 'dance', 'highfive', 'build'],
    pool: ['seek', 'tag', 'dance', 'highfive', 'water'],
    house: ['seek', 'dance', 'highfive', 'mamaHug']
  };
  var GAME_AR = { seek: 'غميضة', tag: 'لحّيس', dance: 'رقصة', highfive: 'تخميلة', ball: 'كورة', water: 'حرب مي', build: 'نبني', mamaHug: 'حضنة ماما' };

  var st = null; /* active session */
  var seed = (Date.now() / 1000 | 0);

  function pick(arr, n) {
    var a = arr.slice(), out = [], i, j, t;
    for (i = a.length - 1; i > 0; i--) { j = (seed = (seed * 1103515245 + 12345) & 0x7fffffff) % (i + 1); t = a[i]; a[i] = a[j]; a[j] = t; }
    n = Math.min(n, a.length);
    for (i = 0; i < n; i++) out.push(a[i]);
    return out;
  }
  function line(key, who) {
    var L = (who && LINES[key] && LINES[key][who]) || LINES[key];
    if (!L) return;
    if (typeof L[0] === 'string' && !Array.isArray(L[0])) bubble(L[0], who); else bubble(L[0], who);
    var en = Array.isArray(L) ? L[1] : '';
    if (en) FS.speak(en, who || 'hoor');
    if (window.VOICE_EN && VOICE_EN.dict && L[0]) { try { /* already speaking via FS.speak */ } catch (e) {} }
  }
  function bubble(ar, who) {
    if (!st) return;
    var host = st.fx || st.layer || document.body;
    var b = document.createElement('div'); b.className = 'fam-say'; b.textContent = ar;
    host.appendChild(b);
    var p = who && actorScreen(who);
    b.style.left = ((p && p.x) || (st.mode === '3d' ? innerWidth / 2 : 640)) + 'px';
    b.style.top = ((p && p.y) || 180) + 'px';
    setTimeout(function () { if (b.parentNode) b.remove(); }, 2400);
  }
  function hearts(who, n) {
    if (!st) return;
    var host = st.fx || st.layer || document.body, p = actorScreen(who); if (!p) return;
    n = n || 5;
    for (var i = 0; i < n; i++) (function (i) {
      setTimeout(function () {
        var h = document.createElement('div'); h.className = 'fam-heart'; h.textContent = '💗';
        h.style.left = (p.x + (Math.random() - .5) * 50) + 'px'; h.style.top = (p.y + (Math.random() - .3) * 30) + 'px';
        host.appendChild(h); setTimeout(function () { h.remove(); }, 1100);
      }, i * 80);
    })(i);
  }
  function actorScreen(who) {
    if (!st) return null;
    if (who === 'ghalia') return ghaliaScreen();
    var a = st.actors[who]; if (!a) return null;
    if (a.kind === 'dom') {
      var r = a.api.el.getBoundingClientRect(), host = (st.layer || a.api.el.parentNode).getBoundingClientRect();
      /* convert to layer-local if layer is the 1280 scene */
      if (st.mode === '2d') return { x: a.api.S.x, y: a.api.S.y - 160 };
      return { x: r.left + r.width / 2, y: r.top };
    }
    if (a.kind === '3d' && st.camera) {
      var v = a.api.group.position.clone(); v.y += 1.3; v.project(st.camera);
      return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight };
    }
    return null;
  }
  function ghaliaScreen() {
    if (!st) return null;
    if (st.mode === '2d' && st.g2d) return { x: st.g2d.x, y: st.g2d.y - 180 };
    if (st.mode === 'toys' && st.toys && st.toys.g) return { x: st.toys.g.x, y: st.toys.g.y - 200 };
    if (st.mode === '3d' && st.g3d && st.camera) {
      var g = st.g3d.group || st.g3d; var v = g.position.clone(); v.y += 1.2; v.project(st.camera);
      return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight };
    }
    return { x: 640, y: 200 };
  }
  function giggle() {
    if (!FS.soundOn()) return;
    try {
      var C = st.ac || (st.ac = new (window.AudioContext || window.webkitAudioContext)());
      if (C.state === 'suspended') C.resume();
      var t = C.currentTime + .02;
      for (var i = 0; i < 5; i++) {
        var o = C.createOscillator(), g = C.createGain(), f = (620 + Math.random() * 80) * (1 - i * .04), t0 = t + i * .1;
        o.type = 'triangle'; o.frequency.setValueAtTime(f * 1.25, t0); o.frequency.exponentialRampToValueAtTime(f * .85, t0 + .08);
        g.gain.setValueAtTime(.0001, t0); g.gain.linearRampToValueAtTime(.1, t0 + .01); g.gain.exponentialRampToValueAtTime(.0008, t0 + .09);
        o.connect(g); g.connect(C.destination); o.start(t0); o.stop(t0 + .1);
      }
    } catch (e) {}
  }

  /* ---------- rosters ---------- */
  function rosterFor(room) {
    var pool = ROSTERS[room] || ROSTERS.garden;
    var needMama = (room === 'house' || room === 'garden') && pool.indexOf('mama') >= 0;
    var kids = pool.filter(function (id) { return id !== 'mama'; });
    var n = room === 'house' ? 2 : 3;
    var ids = pick(kids, n);
    if (needMama) ids.unshift('mama');
    if (!needMama) ids = pick(pool, room === 'pool' ? 4 : 4);
    return ids;
  }

  /* ---------- 2D garden / generic scene ---------- */
  function ghalia2d() {
    var A = window.GAME && GAME.api, r = A && A.getR && A.getR();
    var el = r && r.chars && r.chars.ghalia;
    if (!el) return null;
    return {
      get x() { return el._x; }, get y() { return el._y; }, el: el,
      walkTo: function (x, y, cb) { st.gWalk = { x: x, y: y, cb: cb }; },
      bounce: function () { if (window.LIFE) LIFE.react(el, 'ghalia', true); else if (A && A.hop) A.hop(el); },
      setPose: function () {},
      setVisible: function (v) { el.style.visibility = v ? '' : 'hidden'; }
    };
  }
  function tickGhalia2d(dt) {
    if (!st || !st.gWalk || !st.g2d) return;
    var el = st.g2d.el, t = st.gWalk, dx = t.x - el._x, dy = t.y - el._y, d = Math.hypot(dx, dy);
    if (d < 4) { if (window.GAME && GAME.api.putChar) GAME.api.putChar('ghalia', t.x, t.y); st.gWalk = null; if (t.cb) t.cb(); return; }
    var k = Math.min(1, 240 * dt / d);
    if (window.GAME && GAME.api.putChar) GAME.api.putChar('ghalia', el._x + dx * k, el._y + dy * k);
  }

  function place2d(room, layer, unitPx, spots) {
    var ids = rosterFor(room), actors = {}, i, id, p, api;
    for (i = 0; i < ids.length; i++) {
      id = ids[i]; p = spots[i] || { x: 200 + i * 180, y: 680 };
      api = FS.dom(id, { x: p.x, y: p.y, unitPx: unitPx || 300 });
      layer.appendChild(api.el);
      bindDrag(api, room);
      api.el.addEventListener('click', function (e) { /* handled in pointerup of drag as tap */ });
      actors[id] = { id: id, kind: 'dom', api: api, busy: 0 };
    }
    return actors;
  }
  function bindDrag(api, room) {
    var el = api.el, start = null;
    el.addEventListener('pointerdown', function (e) {
      e.stopPropagation(); e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
      start = { x: e.clientX, y: e.clientY, sx: api.S.x, sy: api.S.y, t: Date.now() };
      el.classList.add('lift'); api.S.tx = api.S.ty = null;
    });
    el.addEventListener('pointermove', function (e) {
      if (!start || !st) return;
      var sc = stageScale();
      api.setPos(start.sx + (e.clientX - start.x) / sc, start.sy + (e.clientY - start.y) / sc);
    });
    function end(e) {
      if (!start) return; el.classList.remove('lift');
      var dist = Math.hypot(e.clientX - start.x, e.clientY - start.y), tap = dist < 12 && Date.now() - start.t < 500;
      start = null;
      if (tap) { onTap(api.id); return; }
      var hit = hitOther(api.id, api.S.x, api.S.y);
      if (hit) pair(api.id, hit);
      else clampPos(api, room);
    }
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', function () { start = null; el.classList.remove('lift'); });
  }
  function stageScale() {
    var sc = document.getElementById('scene');
    if (!sc) return 1;
    var r = sc.getBoundingClientRect();
    return r.width / 1280 || 1;
  }
  function clampPos(api, room) {
    var x = Math.max(60, Math.min(1220, api.S.x)), y;
    if (room === 'toys') y = Math.max(634, Math.min(700, api.S.y));
    else y = Math.max(540, Math.min(712, api.S.y));
    api.setPos(x, y);
  }
  function hitOther(id, x, y) {
    if (!st) return null;
    var k, a, d;
    if (st.g2d && Math.hypot((st.g2d.x || 0) - x, (st.g2d.y || 0) - y) < 70) return 'ghalia';
    if (st.mode === 'toys' && st.toys && st.toys.g && Math.hypot(st.toys.g.x - x, st.toys.g.y - y) < 70) return 'ghalia';
    for (k in st.actors) {
      if (k === id) continue; a = st.actors[k];
      d = a.kind === 'dom' ? Math.hypot(a.api.S.x - x, a.api.S.y - y) : 999;
      if (d < 70) return k;
    }
    return null;
  }

  function onTap(id) {
    if (!st || (st.game && st.game.type === 'seek' && st.game.phase === 'hiding')) { foundSeek(id); return; }
    if (st.game && st.game.type === 'seek' && st.game.phase === 'seek') { foundSeek(id); return; }
    var a = st.actors[id]; if (!a) return;
    a.api.setPose('wave', 2.2); a.api.bounce(1); giggle(); hearts(id, 4);
    line('hi', id);
  }

  function pair(a, b) {
    if (!st || a === b) return;
    var kinds = ['highfive', 'hug', 'chase'];
    var k = kinds[(seed = (seed * 1103515245 + 12345) & 0x7fffffff) % 3];
    if (a === 'mama' || b === 'mama') k = 'hug';
    if (k === 'chase') startTag(a, b);
    else if (k === 'hug') doHug(a, b);
    else doHighfive(a, b);
  }
  function actorApi(id) {
    if (id === 'ghalia') {
      if (st.g2d) return st.g2d;
      if (st.mode === 'toys') return toysGhaliaApi();
      if (st.g3dApi) return st.g3dApi;
      return null;
    }
    return st.actors[id] && st.actors[id].api;
  }
  function meet(a, b, cb) {
    var A = actorApi(a), B = actorApi(b); if (!A || !B) { if (cb) cb(); return; }
    var mx, my;
    if (A.S && B.S) { mx = (A.S.x + B.S.x) / 2; my = (A.S.y + B.S.y) / 2; A.walkTo(mx - 30, my); B.walkTo(mx + 30, my, cb); }
    else if (A.walkTo && B.pos && A.pos) { /* 3d */ var x = (A.pos.x + B.pos.x) / 2, z = (A.pos.z + B.pos.z) / 2; A.walkTo(x - .08, z, st.world); B.walkTo(x + .08, z, st.world, cb); }
    else if (cb) setTimeout(cb, 400);
  }
  function doHighfive(a, b) {
    meet(a, b, function () {
      var A = actorApi(a), B = actorApi(b);
      if (A && A.setPose) A.setPose('wave', 2); if (B && B.setPose) B.setPose('wave', 2);
      if (A && A.bounce) A.bounce(1); if (B && B.bounce) B.bounce(1);
      giggle(); hearts(a, 4); hearts(b, 4); line('highfive', a === 'ghalia' ? b : a);
    });
  }
  function doHug(a, b) {
    meet(a, b, function () {
      var A = actorApi(a), B = actorApi(b);
      if (A && A.setPose) A.setPose(a === 'mama' ? 'hug' : 'wave', 2.6);
      if (B && B.setPose) B.setPose(b === 'mama' ? 'hug' : 'wave', 2.6);
      if (A && A.bounce) A.bounce(1); if (B && B.bounce) B.bounce(1);
      giggle(); hearts(a, 6); hearts(b, 6); line(a === 'mama' || b === 'mama' ? 'mamaHug' : 'hug', a === 'mama' || b === 'mama' ? 'mama' : a);
    });
  }

  /* ---------- games ---------- */
  function clearGame() { if (st) { st.game = null; if (st.ball) { st.ball.remove(); st.ball = null; } if (st.ring) { st.ring.remove(); st.ring = null; } setDock(); } }
  function startSeek() {
    if (!st) return; clearGame();
    var hiders = Object.keys(st.actors), spots = hideSpots(), i;
    st.game = { type: 'seek', phase: 'count', found: {}, left: hiders.slice() };
    line('seekStart', 'ghalia');
    for (i = 0; i < hiders.length; i++) (function (id, p) {
      var a = st.actors[id];
      a.api.walkTo(p.x, p.z != null ? p.z : p.y, st.world, function () {
        a.api.setPose(FS.last[id] || 'sit'); a.api.el && a.api.el.classList.add('hiding');
      });
    })(hiders[i], spots[i % spots.length]);
    setTimeout(function () { if (st && st.game && st.game.type === 'seek') st.game.phase = 'seek'; }, 2200);
  }
  function hideSpots() {
    if (st.mode === 'toys') return [{ x: 90, y: 690 }, { x: 1180, y: 690 }, { x: 240, y: 640 }, { x: 980, y: 640 }, { x: 640, y: 700 }];
    if (st.mode === '3d') return [{ x: -.8, z: .35 }, { x: .8, z: .35 }, { x: -.4, z: .85 }, { x: .5, z: .8 }, { x: 0, z: .3 }];
    return [{ x: 90, y: 620 }, { x: 1180, y: 630 }, { x: 260, y: 560 }, { x: 1000, y: 560 }, { x: 640, y: 710 }];
  }
  function foundSeek(id) {
    if (!st || !st.game || st.game.type !== 'seek' || st.game.phase !== 'seek') return;
    if (st.game.found[id] || !st.actors[id]) return;
    st.game.found[id] = 1;
    var a = st.actors[id]; a.api.setPose('wave', 2); a.api.bounce(1); if (a.api.el) { a.api.el.classList.remove('hiding'); a.api.el.classList.add('found'); }
    giggle(); hearts(id, 5); line('seekFound', id);
    var left = st.game.left.filter(function (x) { return !st.game.found[x]; });
    if (!left.length) { setTimeout(function () { line('seekAll', 'ghalia'); clearGame(); }, 900); }
  }
  function startTag(it, target) {
    if (!st) return;
    var ids = Object.keys(st.actors);
    it = it || ids[0]; target = target || ids[1] || 'ghalia';
    st.game = { type: 'tag', it: it, target: target, t: 0 };
    line('chase', it);
  }
  function tickTag(dt) {
    var g = st.game, It = actorApi(g.it), T = actorApi(g.target); if (!It || !T) return;
    g.t += dt;
    if (It.S && T.S) {
      if (g.t > .3) It.walkTo(T.S.x + (Math.random() - .5) * 10, T.S.y);
      if (g.t < 1.4 && !T.walking()) T.walkTo(Math.max(80, Math.min(1200, T.S.x + (T.S.x > 640 ? -180 : 180))), T.S.y);
      if (Math.hypot(It.S.x - T.S.x, It.S.y - T.S.y) < 40 && g.t > .6) {
        if (It.setPose) It.setPose('wave', 1.2); if (It.bounce) It.bounce(1);
        giggle(); hearts(g.it, 3);
        var ids = Object.keys(st.actors).concat(['ghalia']), next = ids[(ids.indexOf(g.target) + 1) % ids.length];
        if (next === g.it) next = ids[(ids.indexOf(next) + 1) % ids.length];
        g.it = g.target; g.target = next; g.t = 0;
      }
    } else if (It.pos && T.pos && st.world) {
      It.walkTo(T.pos.x, T.pos.z, st.world);
      if (Math.hypot((It.pos.x - T.pos.x) * 1.6, It.pos.z - T.pos.z) < .12 && g.t > .6) {
        if (It.bounce) It.bounce(1); giggle();
        var ids2 = Object.keys(st.actors), n2 = ids2[(ids2.indexOf(g.target) + 1) % ids2.length];
        g.it = g.target; g.target = n2; g.t = 0;
      }
    }
  }
  function startDance() {
    if (!st) return; clearGame();
    st.game = { type: 'dance', t: 0 };
    line('dance', Object.keys(st.actors)[0]);
    if (st.mode !== '3d') {
      var ring = document.createElement('div'); ring.className = 'fam-ring';
      (st.layer || document.body).appendChild(ring); st.ring = ring;
    }
  }
  function tickDance(dt) {
    var g = st.game; g.t += dt;
    var ids = Object.keys(st.actors), n = ids.length, i, a, ang, cx, cy, r;
    if (st.mode === '3d') {
      for (i = 0; i < n; i++) {
        a = st.actors[ids[i]]; ang = g.t * 1.1 + i * (Math.PI * 2 / n);
        a.api.walkTo(Math.cos(ang) * .35, .55 + Math.sin(ang) * .22, st.world);
        if (a.api.setPose) a.api.setPose('wave');
      }
      return;
    }
    cx = 640; cy = st.mode === 'toys' ? 668 : 660; r = st.mode === 'toys' ? 160 : 200;
    if (st.ring) { st.ring.style.left = cx + 'px'; st.ring.style.top = cy + 'px'; st.ring.style.width = (r * 2) + 'px'; st.ring.style.height = (r * 1.1) + 'px'; }
    for (i = 0; i < n; i++) {
      a = st.actors[ids[i]]; ang = g.t * 1.15 + i * (Math.PI * 2 / n);
      a.api.walkTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r * .28);
      if ((g.t * 4 | 0) % 2 === 0) a.api.setPose('wave');
    }
    var G = actorApi('ghalia');
    if (G && G.walkTo && G.S) G.walkTo(cx, cy + 10);
    else if (G && G.walkTo && st.mode === 'toys') G.walkTo(cx, cy + 10);
  }
  function startHighfives() {
    if (!st) return; clearGame();
    var ids = Object.keys(st.actors), i;
    line('highfive', ids[0]);
    for (i = 0; i < ids.length; i++) doHighfive(ids[i], i + 1 < ids.length ? ids[i + 1] : 'ghalia');
  }
  function startBall() {
    if (!st) return; clearGame();
    st.game = { type: 'ball', i: 0, t: 0, flying: 0 };
    line('ball', Object.keys(st.actors)[0]);
    var b = document.createElement('div'); b.className = 'fam-ball'; (st.layer || document.body).appendChild(b); st.ball = b;
  }
  function tickBall(dt) {
    var ids = Object.keys(st.actors).concat(['ghalia']), g = st.game;
    g.t += dt;
    if (!g.flying && g.t > .3) {
      g.flying = 1; g.from = ids[g.i % ids.length]; g.to = ids[(g.i + 1) % ids.length]; g.i++; g.u = 0;
      var A = actorApi(g.from); if (A && A.setPose) A.setPose('wave', 1); if (A && A.bounce) A.bounce(.8);
    }
    if (g.flying) {
      g.u += dt * 1.4;
      var a = actorScreen(g.from) || { x: 200, y: 400 }, b = actorScreen(g.to) || { x: 900, y: 400 };
      var u = Math.min(1, g.u), x = a.x + (b.x - a.x) * u, y = a.y + (b.y - a.y) * u - Math.sin(u * Math.PI) * 120;
      if (st.ball) { st.ball.style.left = x + 'px'; st.ball.style.top = y + 'px'; }
      if (u >= 1) { g.flying = 0; g.t = 0; var T = actorApi(g.to); if (T && T.setPose) T.setPose('wave', 1); if (T && T.bounce) T.bounce(1); giggle(); }
    }
  }
  function startWater() {
    if (!st) return; clearGame();
    st.game = { type: 'water', t: 0 };
    line('water', Object.keys(st.actors)[0]);
  }
  function tickWater(dt) {
    var g = st.game; g.t += dt;
    if (g.t > .55) {
      g.t = 0;
      var ids = Object.keys(st.actors), a = ids[(Math.random() * ids.length) | 0], b = ids[(Math.random() * ids.length) | 0] || 'ghalia';
      if (a === b) b = 'ghalia';
      var A = actorApi(a), B = actorApi(b);
      if (A && A.setPose) A.setPose('wave', 1);
      splash(a); splash(b); giggle();
      if (st.mode === '3d' && window.__pool && __pool.ghalia) { /* reuse pool splash if any */ }
    }
  }
  function splash(who) {
    var p = actorScreen(who), host = st.fx || st.layer || document.body; if (!p) return;
    for (var i = 0; i < 8; i++) {
      var d = document.createElement('div'); d.className = 'fam-splash';
      d.style.left = p.x + 'px'; d.style.top = (p.y + 40) + 'px';
      var ang = -Math.PI / 2 + (Math.random() - .5) * 2.2, dist = 40 + Math.random() * 70;
      d.style.setProperty('--x', Math.cos(ang) * dist + 'px'); d.style.setProperty('--y', Math.sin(ang) * dist + 'px');
      host.appendChild(d); (function (d) { setTimeout(function () { d.remove(); }, 700); })(d);
    }
  }
  function startBuild() {
    if (!st) return; clearGame();
    line('build', Object.keys(st.actors)[0]);
    var ids = Object.keys(st.actors), dest = { x: 820, y: 670 }, i;
    try { var ts = window.TOYROOM && TOYROOM.state && TOYROOM.state(); if (ts && ts.toy && ts.toy.build) dest = { x: ts.toy.build.x || 820, y: (ts.toy.build.base || 690) - 10 }; } catch (e) {}
    for (i = 0; i < ids.length; i++) (function (id, k) {
      st.actors[id].api.walkTo(dest.x - 50 + k * 40, dest.y, function () { st.actors[id].api.setPose('wave', 2); st.actors[id].api.bounce(1); });
    })(ids[i], i);
    var G = actorApi('ghalia'); if (G && G.walkTo) G.walkTo(dest.x, dest.y);
    try { if (window.TOYROOM && TOYROOM.play && TOYROOM.play.build && TOYROOM.state()) { /* leave toys to handle if already open */ } } catch (e) {}
    setTimeout(function () { giggle(); hearts(ids[0], 6); }, 1400);
  }
  function startMamaHug() {
    if (!st || !st.actors.mama) { /* skip if mama not in roster */ return; }
    doHug('mama', 'ghalia');
  }

  /* ---------- idle AI ---------- */
  function tickIdle(dt) {
    if (!st || st.game) return;
    st.idleT = (st.idleT || 0) + dt;
    if (st.idleT < 3.5 + (seed % 3)) return;
    st.idleT = 0;
    var ids = Object.keys(st.actors), id = ids[(seed = (seed * 1103515245 + 12345) & 0x7fffffff) % ids.length], a = st.actors[id];
    if (!a || a.api.walking()) return;
    var roll = (seed % 100);
    if (roll < 35 && ids.length > 1) {
      var other = ids[(ids.indexOf(id) + 1) % ids.length];
      if (roll < 18) doHighfive(id, other);
      else if (roll < 26) doHug(id, other);
      else { var B = st.actors[other]; if (a.kind === 'dom') a.api.walkTo(B.api.S.x + 40, B.api.S.y); else if (st.world) a.api.walkTo(B.api.pos.x + .1, B.api.pos.z, st.world); }
    } else {
      if (a.kind === 'dom') {
        var nx = Math.max(80, Math.min(1200, a.api.S.x + (Math.random() - .5) * 280));
        var ny = st.mode === 'toys' ? Math.max(634, Math.min(700, a.api.S.y + (Math.random() - .5) * 40)) : Math.max(560, Math.min(710, a.api.S.y + (Math.random() - .5) * 60));
        a.api.walkTo(nx, ny, function () { if (Math.random() < .4) { a.api.setPose('wave', 1.6); giggle(); } });
      } else if (st.world) {
        a.api.walkTo(Math.max(-.8, Math.min(.8, a.api.pos.x + (Math.random() - .5) * .5)), Math.max(.25, Math.min(.9, a.api.pos.z + (Math.random() - .5) * .3)), st.world, function () { if (Math.random() < .4) a.api.setPose('wave', 1.6); });
      }
    }
  }

  /* ---------- dock ---------- */
  function setDock() {
    if (!st || !st.dock) return;
    var games = GAMES[st.room] || GAMES.garden, h = '', i;
    for (i = 0; i < games.length; i++) {
      if (games[i] === 'mamaHug' && !st.actors.mama) continue;
      h += '<button type="button" data-act="' + games[i] + '"' + (st.game && st.game.type === games[i] ? ' class="on"' : '') + '>' + GAME_AR[games[i]] + '</button>';
    }
    st.dock.innerHTML = h;
  }
  function makeDock(parent) {
    var d = document.createElement('div'); d.className = 'fam-dock'; parent.appendChild(d);
    d.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button[data-act]'); if (!b) return;
      var act = b.dataset.act;
      if (st.game && st.game.type === act) { clearGame(); return; }
      if (act === 'seek') startSeek();
      else if (act === 'tag') startTag();
      else if (act === 'dance') startDance();
      else if (act === 'highfive') startHighfives();
      else if (act === 'ball') startBall();
      else if (act === 'water') startWater();
      else if (act === 'build') startBuild();
      else if (act === 'mamaHug') startMamaHug();
      setDock();
    });
    return d;
  }

  /* ---------- loop ---------- */
  function tick(dt) {
    if (!st || st.dead) return;
    var k, a;
    for (k in st.actors) {
      a = st.actors[k];
      if (a.kind === 'dom') a.api.update(dt);
      else if (a.kind === '3d') { if (!st.camera && window.__pool && __pool.camera) st.camera = __pool.camera; a.api.update(dt, st.world, st.camera); }
    }
    tickGhalia2d(dt);
    if (st.game) {
      if (st.game.type === 'tag') tickTag(dt);
      else if (st.game.type === 'dance') tickDance(dt);
      else if (st.game.type === 'ball') tickBall(dt);
      else if (st.game.type === 'water') tickWater(dt);
    } else tickIdle(dt);
    place3dLabels();
  }
  function place3dLabels() {
    if (!st || st.mode !== '3d' || !st.camera) return;
    var k, p, tag;
    for (k in st.actors) {
      p = actorScreen(k); if (!p || p.x < 8 || p.x > innerWidth - 8 || p.y < 0 || p.y > innerHeight) {
        if (st.labels[k]) st.labels[k].style.display = 'none';
        continue;
      }
      tag = st.labels[k];
      if (!tag) {
        tag = document.createElement('b'); tag.className = 'fam-tag fam-tag3d'; tag.textContent = AR[k] || k;
        document.body.appendChild(tag); st.labels[k] = tag;
      }
      tag.style.display = st.actors[k].api.S && st.actors[k].api.S.hidden ? 'none' : 'block';
      tag.style.left = p.x + 'px'; tag.style.top = (p.y - 18) + 'px';
    }
  }
  function loop(now) {
    if (!st || st.dead) return;
    requestAnimationFrame(loop);
    var dt = Math.min(.05, (now - (st.last || now)) / 1000); st.last = now;
    tick(dt);
  }
  function stop() {
    if (!st) return;
    st.dead = true;
    var k, a;
    for (k in st.actors) {
      a = st.actors[k];
      if (a.kind === '3d') { if (a.api.group && a.api.group.parent) a.api.group.parent.remove(a.api.group); if (a.api.dispose) a.api.dispose(); }
      else if (a.api && a.api.el && a.api.el.parentNode) a.api.el.remove();
    }
    if (st.dock && st.dock.parentNode) st.dock.remove();
    if (st.ball) st.ball.remove(); if (st.ring) st.ring.remove();
    if (st.labels) { for (k in st.labels) if (st.labels[k].parentNode) st.labels[k].remove(); }
    st = null;
  }

  /* ---------- enter rooms ---------- */
  function enterGarden(r) {
    stop();
    var scene = (window.GAME && GAME.api && GAME.api.scene) ? GAME.api.scene() : document.getElementById('scene');
    if (!scene) return;
    var layer = document.createElement('div'); layer.className = 'fam-layer'; layer.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:8';
    scene.appendChild(layer);
    /* pointer-events on children only */
    var spots = [{ x: 300, y: 690 }, { x: 820, y: 700 }, { x: 1100, y: 680 }, { x: 500, y: 710 }];
    /* if mama in roster, stand a little back */
    st = { room: 'garden', mode: '2d', layer: layer, fx: (window.GAME && GAME.api && GAME.api.fx) || scene, actors: {}, dead: false, last: performance.now() };
    /* move layer kids into scene so they share z with chars; pointer-events auto on chars */
    scene.appendChild(layer);
    st.actors = place2d('garden', scene, r.charH || 300, spots);
    /* un-nest: place2d already appended to scene */
    layer.remove();
    st.layer = scene;
    st.fx = (window.GAME && GAME.api && GAME.api.fx) || scene;
    st.g2d = ghalia2d();
    var roomEl = document.getElementById('room') || scene.parentNode;
    st.dock = makeDock(roomEl);
    setDock();
    /* wrap charDrop so dragging Ghalia/Khala onto a kid pairs them */
    if (r.def) {
      var prev = r.def.charDrop;
      r.def.charDrop = function (who, x, y) {
        var hit = hitOther('__none', x, y);
        if (hit && who) { pair(who, hit); return true; }
        return prev ? prev.apply(this, arguments) : false;
      };
    }
    requestAnimationFrame(loop);
  }

  function toysGhaliaApi() {
    if (!st || !st.toys || !st.toys.g) return null;
    var g = st.toys.g;
    return {
      get x() { return g.x; }, get y() { return g.y; }, S: g,
      walkTo: function (x, y, cb) { g.tx = x; g.ty = y; if (cb) { var prev = g.cb; g.cb = function () { if (prev) prev(); cb(); }; } },
      bounce: function () { try { if (window.TOYROOM && TOYROOM.state()) { /* react via ghit */ } } catch (e) {} },
      setPose: function () {},
      walking: function () { return Math.hypot(g.tx - g.x, g.ty - g.y) > 3; }
    };
  }
  function enterToys() {
    var ts = window.TOYROOM && TOYROOM.state && TOYROOM.state(); if (!ts || !ts.root) return;
    stop();
    var spots = [{ x: 180, y: 690 }, { x: 430, y: 700 }, { x: 900, y: 690 }, { x: 1100, y: 680 }];
    st = { room: 'toys', mode: 'toys', layer: ts.root, fx: ts.fx || ts.root, toys: ts, actors: {}, dead: false, last: performance.now() };
    st.actors = place2d('toys', ts.gLayer || ts.root, 260, spots);
    var roomEl = document.getElementById('room') || ts.root.parentNode;
    st.dock = makeDock(roomEl);
    setDock();
    requestAnimationFrame(loop);
  }

  function enter3d(opts) {
    stop();
    var T = window.THREE, world = opts.world, scene = opts.scene, camera = opts.camera, room = opts.room || 'pool';
    if (!T || !world || !FS.create) return;
    var ids = rosterFor(room), spots, i, api, actors = {};
    if (room === 'pool') spots = [{ x: .42, z: .58 }, { x: -.52, z: .62 }, { x: .72, z: .42 }, { x: -.18, z: .72 }, { x: .15, z: .4 }];
    else spots = [{ x: .72, z: .38 }, { x: -.72, z: .42 }, { x: .55, z: .78 }, { x: -.5, z: .8 }];
    st = { room: room, mode: '3d', world: world, scene: scene, camera: camera, g3d: opts.ghalia, actors: {}, labels: {}, dead: false, last: performance.now(), fx: document.body };
    if (opts.ghalia && opts.gPos) {
      st.g3dApi = {
        group: opts.ghalia.group || opts.ghalia, pos: opts.gPos,
        walkTo: function (x, z, world, cb) { if (window.__walk) window.__walk(x, z); if (opts.walkTo) opts.walkTo(x, z, cb); },
        setPose: function (p) { try { if (opts.ghalia.react) opts.ghalia.react(p === 'wave' ? 'wave' : 'cheer'); } catch (e) {} },
        bounce: function () { try { if (opts.ghalia.react) opts.ghalia.react('jump'); } catch (e) {} }
      };
    }
    for (i = 0; i < ids.length; i++) {
      api = FS.create(T, ids[i], { x: spots[i].x, z: spots[i].z });
      scene.add(api.group);
      if (world.interactables) {
        world.interactables.push({ object: api.card.mesh, name: 'fam:' + ids[i], onTap: (function (id) { return function () { onTap(id); }; })(ids[i]) });
      }
      actors[ids[i]] = { id: ids[i], kind: '3d', api: api };
      /* start some sitting in the river / wave-pool line */
      if (room === 'pool' && (ids[i] === 'saif' || i === 2)) api.setPose('sit');
    }
    st.actors = actors;
    var host = document.body;
    st.dock = makeDock(host);
    setDock();
    requestAnimationFrame(loop);
  }

  /* ---------- hooks ---------- */
  function hookLife() {
    if (!window.LIFE || LIFE._famHooked) return;
    LIFE._famHooked = 1;
    var prev = LIFE.onRoom;
    LIFE.onRoom = function (r) {
      if (prev) prev.apply(this, arguments);
      try { if (r && r.id === 'garden') setTimeout(function () { enterGarden(r); }, 80); else if (st && st.room === 'garden') stop(); } catch (e) { console.warn('[family] garden', e); }
    };
  }
  function hookToys() {
    if (!window.GAME || !GAME.ROOMS || !GAME.ROOMS.toys || GAME.ROOMS.toys._famHooked) return;
    GAME.ROOMS.toys._famHooked = 1;
    var prev = GAME.ROOMS.toys.init;
    GAME.ROOMS.toys.init = function (R) {
      prev.apply(this, arguments);
      var tries = 0, t = setInterval(function () {
        tries++;
        if (window.TOYROOM && TOYROOM.state && TOYROOM.state() && TOYROOM.state().gLayer) { clearInterval(t); try { enterToys(); } catch (e) { console.warn('[family] toys', e); } }
        else if (tries > 40) clearInterval(t);
      }, 100);
    };
  }
  function hookHouse() {
    if (!window.V2ILL || V2ILL._famHooked) return;
    V2ILL._famHooked = 1;
    var create0 = V2ILL.create;
    V2ILL.create = function (o) {
      var api = create0.apply(this, arguments);
      if (o && o.Module && o.Module === window.GhaliaHouseScene) {
        try {
          var wait = function () {
            if (!api.world || !api.ready) { setTimeout(wait, 200); return; }
            enter3d({ room: 'house', world: api.world, scene: api.scene, camera: api.camera, ghalia: o.rig && o.rig.module, gPos: api.pos, walkTo: function (x, z, cb) { if (api.walkTo) api.walkTo(x, z, cb); } }); if (st && st.dock) st.dock.classList.add('fam-house');
          };
          setTimeout(wait, 400);
        } catch (e) { console.warn('[family] house', e); }
      }
      return api;
    };
  }
  function hookPool() {
    if (window._famPoolHooked) return;
    if (!/pool3d\.html/i.test(location.pathname + location.href)) return;
    window._famPoolHooked = 1;
    var tries = 0, t = setInterval(function () {
      tries++;
      var P = window.__pool;
      if (P && P.world && P.ghalia && (window.__ready || P.world.stage)) {
        clearInterval(t);
        try {
          var scene = (P.ghalia.group && P.ghalia.group.parent) || null;
          enter3d({ room: 'pool', world: P.world, scene: scene, camera: P.camera, ghalia: P.ghalia, gPos: P.pos });
          if (st && st.dock) st.dock.classList.add('fam-pool');
        } catch (e) { console.warn('[family] pool', e); }
      } else if (tries > 80) clearInterval(t);
    }, 150);
  }

  hookLife(); hookToys(); hookHouse(); hookPool();
  document.addEventListener('DOMContentLoaded', function () { hookLife(); hookToys(); hookHouse(); hookPool(); });

  window.FamilyPlay = {
    enterGarden: enterGarden, enterToys: enterToys, enter3d: enter3d, stop: stop,
    state: function () { return st; }, start: function (act) {
      if (act === 'seek') startSeek(); else if (act === 'tag') startTag(); else if (act === 'dance') startDance();
      else if (act === 'highfive') startHighfives(); else if (act === 'ball') startBall();
      else if (act === 'water') startWater(); else if (act === 'build') startBuild(); else if (act === 'mamaHug') startMamaHug();
    }
  };
})();
