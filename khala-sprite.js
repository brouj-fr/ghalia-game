/* Khala (Ghalia's aunt): 2.5D illustrated billboard cards from KHALA_ATLAS (khala-sprite-atlas.js).
   Same conventions as ghalia-sprite.js: 1.62 world units = Ghalia's standing height, feet at the group origin,
   cylindrical billboard toward the camera. Also renders the "moment" cards (Ghalia + Khala painted together)
   and Ghalia's hide-and-seek poses.  API:
     const K = KhalaSprite.create(THREE)            // -> { group, card, pos, update(dt, world, camera), setPose, walkTo, ... }
     const c = KhalaSprite.card(THREE)              // bare card: c.set(frame, flip), c.mesh, c.opacity(v)
*/
(function (root) {
  'use strict';
  var A = root.KHALA_ATLAS, tex = null, shadowTex = null, U = 1.62, mats = [];
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
  /* one painted card; geometry pivot at the bottom-centre so squash/sway hinge on the feet */
  function card(T) {
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
  function shadow(T, w) {
    var m = new T.Mesh(new T.PlaneGeometry(w, w * .42), new T.MeshBasicMaterial({ map: shadowTexture(T), transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.y = .006; return m;
  }
  /* a billboard holder: group at the feet, inner pivot faces the camera (yaw only) */
  function holder(T, shadowW) {
    var group = new T.Group(), pivot = new T.Group(); group.add(pivot);
    var sh = shadowW ? shadow(T, shadowW) : null; if (sh) group.add(sh);
    return { group: group, pivot: pivot, shadow: sh,
      place: function (a, camera) {
        group.position.copy(a.position); group.scale.setScalar(a.height / U);
        if (camera) { var dx = camera.position.x - group.position.x, dz = camera.position.z - group.position.z; pivot.rotation.y = Math.atan2(dx, dz); }
        if (group.__ro !== a.renderOrder) { group.__ro = a.renderOrder; group.traverse(function (o) { o.renderOrder = a.renderOrder; }); }
      } };
  }
  var WALK = ['k_walk_0', 'k_walk_1', 'k_walk_2', 'k_walk_3'];
  function create(T, opts) {
    opts = opts || {};
    var h = holder(T, 1.0), c = card(T).set('k_idle'), c2 = card(T).set('k_happy');
    c2.opacity(0); c2.mesh.position.z = .002; h.pivot.add(c.mesh); h.pivot.add(c2.mesh);
    var S = { pos: { x: opts.x || -.5, z: opts.z == null ? .6 : opts.z }, target: null, onArrive: null, pose: 'k_idle', poseT: 0, phase: 0, t: 0,
      flip: false, fade: 0, from: 'k_idle', bounce: 0, wiggle: 0, speed: .3, hidden: false };
    var api = { group: h.group, card: c, pos: S.pos, S: S };
    api.setPose = function (name, dur) {             // crossfade to a held pose; dur (s) then back to idle
      if (S.pose !== name) { S.from = c.frame; S.pose = name; S.fade = 1; }
      S.poseT = dur == null ? 0 : dur; return api;
    };
    api.walkTo = function (x, z, world, cb) {
      var p = { x: x, z: z }; if (world && world.clampToWalkable) world.clampToWalkable(p);
      S.target = p; S.onArrive = cb || null; return api;
    };
    api.walking = function () { return !!S.target; };
    api.bounce = function (v) { S.bounce = v == null ? 1 : v; };
    api.wiggle = function (v) { S.wiggle = v == null ? 1 : v; };
    api.face = function (left) { S.flip = !!left; };
    api.setVisible = function (v) { S.hidden = !v; h.group.visible = !!v; };
    api.update = function (dt, world, camera) {
      S.t += dt; if (!world || !world.actorAt) return;
      var a = world.actorAt(S.pos.x, S.pos.z), moving = false;
      if (S.target) {
        var tx = S.target.x - S.pos.x, tz = S.target.z - S.pos.z, d = Math.hypot(tx * 1.6, tz);
        if (d < .012) { S.target = null; var cb = S.onArrive; S.onArrive = null; if (cb) cb(); }
        else { var st = S.speed * Math.max(.45, a.speedScale) * dt, k = Math.min(1, st / d); S.pos.x += tx * k; S.pos.z += tz * k; moving = true; if (Math.abs(tx) > .004) S.flip = tx < 0; }
        a = world.actorAt(S.pos.x, S.pos.z);
      }
      h.place(a, camera);
      if (S.poseT > 0) { S.poseT -= dt; if (S.poseT <= 0) api.setPose('k_idle'); }
      var bob = 0, sx = 1, sy = 1, rz = 0;
      if (moving) {
        S.phase += dt * 7.5; var fi = Math.floor(S.phase) % 4; c.set(WALK[fi], S.flip); c2.opacity(0);
        bob = Math.abs(Math.sin(S.phase * Math.PI)) * .025; rz = (S.flip ? 1 : -1) * .03;
      } else {
        // pose crossfade: c shows target, c2 shows the previous frame fading out
        if (S.fade > 0) { c2.set(S.from, S.flip && /walk/.test(S.from)); S.fade = Math.max(0, S.fade - dt / .16); c2.opacity(S.fade); }
        else c2.opacity(0);
        c.set(S.pose, false);
        var br = Math.sin(S.t * 2.1); sy = 1 + br * .008; sx = 1 - br * .004; rz = Math.sin(S.t * .9) * .012;
        if (S.pose === 'k_laugh') { sy += Math.abs(Math.sin(S.t * 14)) * .025; rz += Math.sin(S.t * 14) * .02; }
        if (S.pose === 'k_happy') bob += Math.abs(Math.sin(S.t * 6)) * .02;
        if (S.pose === 'k_search') rz += Math.sin(S.t * 2.4) * .05;
        if (S.pose === 'k_cover') rz += Math.sin(S.t * 3) * .015;
      }
      if (S.bounce > 0) { S.bounce = Math.max(0, S.bounce - dt * 2.4); var b = Math.sin((1 - S.bounce) * Math.PI); bob += b * .12; sy *= 1 + b * .05; sx *= 1 - b * .03; }
      if (S.wiggle > 0) { S.wiggle = Math.max(0, S.wiggle - dt * .8); rz += Math.sin(S.t * 22) * .05 * S.wiggle; }
      c.squash(sx, sy); c2.squash(sx, sy);
      c.mesh.position.y = c2.mesh.position.y = bob; c.mesh.rotation.z = c2.mesh.rotation.z = rz;
      if (h.shadow) h.shadow.scale.setScalar(1 - bob * 2);
    };
    api.dispose = function () { c.dispose(); c2.dispose(); };
    return api;
  }
  root.KhalaSprite = { create: create, card: card, holder: holder, atlas: A, ready: function () { return !!(tex && tex.userData.ready); } };
})(typeof window !== 'undefined' ? window : this);
