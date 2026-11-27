/* Family + cousins sprites. Billboard cards from FAMILY_ATLAS (family-sprite-atlas.js).
   Same conventions as khala-sprite.js: 1.62 world units = Ghalia's standing height, feet at the group origin.
   DOM helper for 2D rooms.  API:
     FamilySprite.create(THREE, id, opts) -> { group, card, setPose, walkTo, update, ... }
     FamilySprite.dom(id, opts)           -> 2D element with the same pose/walk helpers
     FamilySprite.meta, .speak, .sayName, .arabic
   CousinsSprite is an alias for the four cousins (hoor, nada, fahad, abdullah).
*/
(function (root) {
  'use strict';
  var A = root.FAMILY_ATLAS, tex = null, shadowTex = null, U = 1.62, mats = [];
  var AR = { hoor: 'حور', nada: 'ندى', fahad: 'فهد', abdullah: 'عبدالله', saud: 'سعود', saif: 'سيف', mama: 'ماما', ghalia: 'غالية', khala: 'خالة' };
  var SAY = { hoor: 'Hoore', nada: 'Nadah', fahad: 'Fahad', abdullah: 'Abdullah', saud: 'Saood', saif: 'Sayf', mama: 'Mama', ghalia: 'Ghalia', khala: 'Khala' };
  var SCALE = { hoor: 1.06, nada: 1.12, fahad: .82, abdullah: 1, saud: .96, saif: .62, mama: 1.3 };
  var LAST = { hoor: 'sit', nada: 'sit', fahad: 'sit', abdullah: 'sit', saud: 'sit', saif: 'sit', mama: 'hug' };
  var KIDS = ['hoor', 'nada', 'fahad', 'abdullah', 'saud', 'saif'];
  var COUSINS = ['hoor', 'nada', 'fahad', 'abdullah'];
  var voice = null;
  function score(v) { var n = v.name || '', l = (v.lang || '').replace('_', '-'); if (!/^en(-|$)/i.test(l)) return -1; var s = 0;
    if (/en-US/i.test(l)) s += 30; else if (/en-GB/i.test(l)) s += 26; else s += 12;
    if (/natural|neural|online|premium|enhanced/i.test(n)) s += 40; if (/google/i.test(n)) s += 25;
    if (/samantha|ava|allison|susan|serena|karen|moira|tessa|kate|aria|jenny|zira|libby|sonia|emma|olivia/i.test(n)) s += 15;
    if (/novelty|bells|bubbles|bad news|good news|whisper|zarvox|trinoids|cellos|organ|boing|albert|jester|superstar|wobble|hysterical|pipe|bahh|deranged/i.test(n)) s -= 100; return s; }
  function pickVoice() { try { if (root.VOICE_EN && VOICE_EN.voice && VOICE_EN.voice()) return (voice = VOICE_EN.voice());
    var vs = speechSynthesis.getVoices(), best = null, bs = 0; for (var i = 0; i < vs.length; i++) { var s = score(vs[i]); if (s > bs) { bs = s; best = vs[i]; } } voice = best; } catch (e) { voice = null; } return voice; }
  if (root.speechSynthesis) { pickVoice(); try { speechSynthesis.addEventListener('voiceschanged', pickVoice); } catch (e) {} }
  function soundOn() { try { return !(root.V2 && V2.isSound) || V2.isSound(); } catch (e) { return true; } }
  function speak(en, who) {
    return new Promise(function (res) {
      var done = false, fin = function () { if (!done) { done = true; res(); } };
      var est = 500 + en.split(/\s+/).length * 340;
      setTimeout(fin, est + 1200);
      if (!soundOn() || !root.speechSynthesis || !(voice || pickVoice())) { setTimeout(fin, est); return; }
      try { var u = new SpeechSynthesisUtterance(en); u.voice = voice; u.lang = voice.lang || 'en-US';
        u.rate = who === 'saif' ? 1.08 : who === 'mama' ? .94 : 1.02;
        u.pitch = who === 'saif' ? 1.7 : who === 'mama' ? 1.12 : /fahad|abdullah|saud/.test(who) ? 1.28 : 1.5;
        u.volume = 1; u.onend = fin; u.onerror = fin; speechSynthesis.speak(u); } catch (e) { setTimeout(fin, est); }
    });
  }
  function texture(T) {
    if (tex) return tex;
    var im = new Image(); tex = new T.Texture(im);
    if (T.sRGBEncoding !== undefined) tex.encoding = T.sRGBEncoding;
    tex.minFilter = T.LinearMipmapLinearFilter; tex.magFilter = T.LinearFilter; tex.anisotropy = 4;
    im.onload = function () { tex.needsUpdate = true; tex.userData.ready = true; mats.forEach(function (m) { m.visible = true; }); };
    im.src = A.src; tex.userData = { ready: false };
    return tex;
  }
  function shadowTexture(T) {
    if (shadowTex) return shadowTex;
    var c = document.createElement('canvas'); c.width = c.height = 64; var x = c.getContext('2d');
    var g = x.createRadialGradient(32, 32, 2, 32, 32, 31); g.addColorStop(0, 'rgba(40,10,30,.55)'); g.addColorStop(1, 'rgba(40,10,30,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64); shadowTex = new T.CanvasTexture(c); return shadowTex;
  }
  function frameOf(id, pose) { return A.frames[id + '_' + pose] || A.frames[id + '_idle']; }
  function card3(T) {
    var geo = new T.PlaneGeometry(1, 1); geo.translate(0, .5, 0);
    var mat = new T.MeshBasicMaterial({ map: texture(T), transparent: true, alphaTest: .02, depthWrite: false, side: T.DoubleSide });
    if (!tex.userData.ready) { mat.visible = false; mats.push(mat); }
    var mesh = new T.Mesh(geo, mat), uv = geo.attributes.uv, c = { mesh: mesh, frame: null, flip: false, w: 1, h: 1, sx: 1, sy: 1 };
    c.set = function (name, flip) {
      var f = A.frames[name]; if (!f) return c; flip = !!flip; if (c.frame === name && c.flip === flip) return c;
      c.frame = name; c.flip = flip;
      var W = A.size[0], H = A.size[1], u0 = (f.x + .5) / W, u1 = (f.x + f.w - .5) / W, v0 = 1 - (f.y + f.h - .5) / H, v1 = 1 - (f.y + .5) / H;
      if (flip) { var t = u0; u0 = u1; u1 = t; }
      uv.setXY(0, u0, v1); uv.setXY(1, u1, v1); uv.setXY(2, u0, v0); uv.setXY(3, u1, v0); uv.needsUpdate = true;
      c.w = f.w / A.unitPx * U; c.h = f.h / A.unitPx * U; c.apply(); return c;
    };
    c.apply = function () { mesh.scale.set(c.w * c.sx, c.h * c.sy, 1); };
    c.squash = function (sx, sy) { c.sx = sx; c.sy = sy; c.apply(); };
    c.opacity = function (v) { mat.opacity = v; mesh.visible = v > .01; };
    c.dispose = function () { geo.dispose(); mat.dispose(); };
    return c;
  }
  function create(T, id, opts) {
    opts = opts || {};
    var group = new T.Group(), pivot = new T.Group(); group.add(pivot);
    var sh = new T.Mesh(new T.PlaneGeometry(1.0, .42), new T.MeshBasicMaterial({ map: shadowTexture(T), transparent: true, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = .006; group.add(sh);
    var c = card3(T).set(id + '_idle'); pivot.add(c.mesh);
    var S = { id: id, pos: { x: opts.x || 0, z: opts.z == null ? .5 : opts.z }, target: null, onArrive: null,
      pose: 'idle', poseT: 0, phase: 0, t: 0, flip: false, bounce: 0, speed: opts.speed || .38, hidden: false };
    var api = { group: group, card: c, pos: S.pos, S: S, id: id };
    api.setPose = function (name, dur) { S.pose = name || 'idle'; S.poseT = dur == null ? 0 : dur; c.set(id + '_' + S.pose, S.flip && S.pose === 'walk'); return api; };
    api.walkTo = function (x, z, world, cb) {
      var p = { x: x, z: z }; if (world && world.clampToWalkable) world.clampToWalkable(p);
      S.target = p; S.onArrive = cb || null; return api;
    };
    api.walking = function () { return !!S.target; };
    api.bounce = function (v) { S.bounce = v == null ? 1 : v; };
    api.face = function (left) { S.flip = !!left; };
    api.setVisible = function (v) { S.hidden = !v; group.visible = !!v; };
    api.update = function (dt, world, camera) {
      S.t += dt;
      var a = world && world.actorAt ? world.actorAt(S.pos.x, S.pos.z) : null, moving = false;
      if (S.target) {
        var tx = S.target.x - S.pos.x, tz = S.target.z - S.pos.z, d = Math.hypot(tx * 1.6, tz);
        if (d < .012) { S.target = null; var cb = S.onArrive; S.onArrive = null; if (cb) cb(); }
        else { var st = S.speed * (a && a.speedScale ? Math.max(.45, a.speedScale) : 1) * dt, k = Math.min(1, st / d); S.pos.x += tx * k; S.pos.z += tz * k; moving = true; if (Math.abs(tx) > .004) S.flip = tx < 0; }
        if (world && world.actorAt) a = world.actorAt(S.pos.x, S.pos.z);
      }
      if (a) {
        group.position.copy(a.position); group.scale.setScalar(a.height / U);
        if (camera) { var dx = camera.position.x - group.position.x, dz = camera.position.z - group.position.z; pivot.rotation.y = Math.atan2(dx, dz); }
        if (group.__ro !== a.renderOrder) { group.__ro = a.renderOrder; group.traverse(function (o) { o.renderOrder = a.renderOrder; }); }
      }
      if (S.poseT > 0) { S.poseT -= dt; if (S.poseT <= 0) api.setPose('idle'); }
      var bob = 0, sx = 1, sy = 1, rz = 0;
      if (moving) {
        S.phase += dt * 7.5; c.set(id + '_walk', S.flip);
        bob = Math.abs(Math.sin(S.phase * Math.PI)) * .025; rz = (S.flip ? 1 : -1) * .03;
      } else {
        c.set(id + '_' + S.pose, false);
        var br = Math.sin(S.t * 2.1); sy = 1 + br * .008; sx = 1 - br * .004; rz = Math.sin(S.t * .9) * .012;
        if (S.pose === 'wave' || S.pose === 'hug') bob += Math.abs(Math.sin(S.t * 6)) * .02;
      }
      if (S.bounce > 0) { S.bounce = Math.max(0, S.bounce - dt * 2.4); var b = Math.sin((1 - S.bounce) * Math.PI); bob += b * .12; sy *= 1 + b * .05; sx *= 1 - b * .03; }
      c.squash(sx, sy); c.mesh.position.y = bob; c.mesh.rotation.z = rz;
      sh.scale.setScalar(1 - bob * 2);
    };
    api.dispose = function () { c.dispose(); };
    return api;
  }

  /* -------- 2D DOM card (garden, toy room) -------- */
  function applyBg(el, name, flip, unitPx) {
    var f = A.frames[name]; if (!f) return;
    var k = unitPx / A.unitPx;
    el.style.width = (f.w * k) + 'px';
    el.style.height = (f.h * k) + 'px';
    el.style.backgroundImage = 'url(' + A.src + ')';
    el.style.backgroundRepeat = 'no-repeat';
    el.style.backgroundSize = (A.size[0] * k) + 'px ' + (A.size[1] * k) + 'px';
    el.style.backgroundPosition = (-f.x * k) + 'px ' + (-f.y * k) + 'px';
    el.style.transform = flip ? 'scaleX(-1)' : '';
    el._fw = f.w * k; el._fh = f.h * k;
  }
  function dom(id, opts) {
    opts = opts || {};
    var unitPx = opts.unitPx || 300;
    var el = document.createElement('div'); el.className = 'fam-char'; el.dataset.who = id;
    var card = document.createElement('div'); card.className = 'fam-card';
    var tag = document.createElement('b'); tag.className = 'fam-tag'; tag.textContent = AR[id] || id;
    el.appendChild(card); el.appendChild(tag);
    var S = { id: id, x: opts.x || 640, y: opts.y || 680, tx: null, ty: null, onArrive: null, pose: 'idle', poseT: 0,
      flip: false, t: 0, bounce: 0, phase: 0, speed: opts.speed || 220, hidden: false, busy: 0 };
    applyBg(card, id + '_idle', false, unitPx);
    function place() {
      var w = card._fw || 80, h = card._fh || 200;
      el.style.left = (S.x - w / 2) + 'px'; el.style.top = (S.y - h) + 'px';
      el.style.zIndex = String(100 + Math.round(S.y));
      el.style.opacity = S.hidden ? .0 : 1;
      el.style.pointerEvents = S.hidden ? 'none' : 'auto';
    }
    place();
    var api = { el: el, card: card, id: id, S: S, get x() { return S.x; }, get y() { return S.y; } };
    api.setPose = function (name, dur) { S.pose = name || 'idle'; S.poseT = dur == null ? 0 : dur; if (!api.walking()) applyBg(card, id + '_' + S.pose, false, unitPx); place(); return api; };
    api.walkTo = function (x, y, cb) { S.tx = x; S.ty = y; S.onArrive = cb || null; return api; };
    api.walking = function () { return S.tx != null; };
    api.face = function (left) { S.flip = !!left; };
    api.bounce = function (v) { S.bounce = v == null ? 1 : v; };
    api.setVisible = function (v) { S.hidden = !v; place(); };
    api.setPos = function (x, y) { S.x = x; S.y = y; place(); return api; };
    api.update = function (dt) {
      S.t += dt;
      var moving = false;
      if (S.tx != null) {
        var dx = S.tx - S.x, dy = S.ty - S.y, d = Math.hypot(dx, dy);
        if (d < 3) { S.x = S.tx; S.y = S.ty; S.tx = S.ty = null; var cb = S.onArrive; S.onArrive = null; if (cb) cb(); }
        else { var st = S.speed * dt, k = Math.min(1, st / d); S.x += dx * k; S.y += dy * k; moving = true; if (Math.abs(dx) > 1) S.flip = dx < 0; }
      }
      if (S.poseT > 0) { S.poseT -= dt; if (S.poseT <= 0 && !moving) api.setPose('idle'); }
      var bob = 0, sc = 1;
      if (moving) { S.phase += dt * 7.5; applyBg(card, id + '_walk', S.flip, unitPx); bob = Math.abs(Math.sin(S.phase * Math.PI)) * 6; }
      else { applyBg(card, id + '_' + S.pose, false, unitPx); bob = Math.sin(S.t * 2.1) * 2; }
      if (S.bounce > 0) { S.bounce = Math.max(0, S.bounce - dt * 2.4); bob += Math.sin((1 - S.bounce) * Math.PI) * 28; sc = 1 + Math.sin((1 - S.bounce) * Math.PI) * .06; }
      place();
      el.style.transform = 'translateY(' + (-bob) + 'px) scale(' + sc + ')';
    };
    return api;
  }

  root.FamilySprite = {
    create: create, dom: dom, atlas: A, arabic: AR, sayName: SAY, scale: SCALE, last: LAST, kids: KIDS, cousins: COUSINS,
    speak: speak, pickVoice: pickVoice, soundOn: soundOn, frameOf: frameOf,
    ready: function () { return !!(A && A.src); }
  };
  root.CousinsSprite = root.FamilySprite;
})(typeof window !== 'undefined' ? window : this);
