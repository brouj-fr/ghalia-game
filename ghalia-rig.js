/* Ghalia procedural character rig (three r128, classic script).
   Body: walk/run cycle (legs, arm swing, bob, turn lean), idle (breathing, blinks, weight shift, look-around, sleepy),
   tap reactions (wave / jump / spin with squash & stretch), braid with spring secondary motion.
   Face: canvas texture on a front patch of the head, redrawn only when the expression / blink / gaze changes.
   Expressions: neutral, happy, surprised, thinking, sad, sleepy (+ blink).                                  */
(function () {
  'use strict';
  var T = THREE;
  function M(hex, r) { return new T.MeshStandardMaterial({ color: hex, roughness: r == null ? 0.6 : r, metalness: 0.02 }); }
  var SKIN = 0xfcd5b5, HAIR = 0x4a2c2a;

  /* ---------- face painter ---------- */
  function drawFace(x, e, blink, gx, gy, talk) {
    var W = 512, H = 256; x.clearRect(0, 0, W, H);
    var cx = 256, ey = 134, ex = 70, my = 214;
    // cheeks
    x.fillStyle = e === 'sad' ? 'rgba(255,130,160,.25)' : (e === 'happy' || e === 'surprised') ? 'rgba(255,110,150,.55)' : 'rgba(255,130,160,.38)';
    [-1, 1].forEach(function (s) { x.beginPath(); x.ellipse(cx + s * 118, 180, 30, 17, 0, 0, 7); x.fill(); });
    x.strokeStyle = '#3b2338'; x.fillStyle = '#3b2338'; x.lineCap = 'round'; x.lineJoin = 'round';
    // brows
    x.lineWidth = 6;
    [-1, 1].forEach(function (s) {
      var bx = cx + s * ex, by = ey - 50, a = 0, dy = 0;
      if (e === 'surprised') dy = -14; else if (e === 'sad') a = s * -0.35; else if (e === 'thinking') { dy = s > 0 ? -12 : 2; a = s > 0 ? -0.15 : 0.1; } else if (e === 'happy') dy = -6; else if (e === 'sleepy') dy = 6;
      x.save(); x.translate(bx, by + dy); x.rotate(a); x.beginPath(); x.moveTo(-20, 3); x.quadraticCurveTo(0, -6, 20, 3); x.stroke(); x.restore();
    });
    // eyes
    [-1, 1].forEach(function (s) {
      var px = cx + s * ex, py = ey;
      var closed = blink > 0.5 || e === 'happy';
      if (e === 'happy' && blink <= 0.5) { // smiling closed eyes ^ ^
        x.lineWidth = 8; x.beginPath(); x.arc(px, py + 8, 20, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); return;
      }
      if (closed) { x.lineWidth = 7; x.beginPath(); x.arc(px, py - 4, 20, Math.PI * 0.15, Math.PI * 0.85); x.stroke(); return; }
      var rx = e === 'surprised' ? 23 : 19, ry = e === 'surprised' ? 30 : 26;
      x.fillStyle = '#fff'; x.beginPath(); x.ellipse(px, py, rx + 4, ry + 3, 0, 0, 7); x.fill();
      var ox = gx * 7, oy = gy * 6;
      x.fillStyle = '#3b2338'; x.beginPath(); x.ellipse(px + ox, py + oy + 2, rx - 2, ry - 3, 0, 0, 7); x.fill();
      x.fillStyle = '#6b3a55'; x.beginPath(); x.ellipse(px + ox, py + oy + 8, rx - 8, ry - 12, 0, 0, 7); x.fill();
      x.fillStyle = '#fff'; x.beginPath(); x.arc(px + ox - 6, py + oy - 9, 7, 0, 7); x.fill(); x.beginPath(); x.arc(px + ox + 6, py + oy + 9, 3.2, 0, 7); x.fill();
      if (e === 'sleepy') { x.fillStyle = 'rgba(252,213,181,1)'; x.fillRect(px - rx - 6, py - ry - 6, (rx + 6) * 2, ry + 4); x.lineWidth = 6; x.beginPath(); x.moveTo(px - rx - 3, py - 2); x.lineTo(px + rx + 3, py - 2); x.stroke(); }
      x.lineWidth = 5; x.strokeStyle = '#3b2338'; x.beginPath(); x.moveTo(px + s * (rx - 2), py - ry + 6); x.lineTo(px + s * (rx + 9), py - ry - 2); x.stroke();
    });
    // mouth
    x.lineWidth = 6; x.strokeStyle = '#8a2a4a'; x.fillStyle = '#8a2a4a';
    if (e === 'happy') {
      x.beginPath(); x.moveTo(cx - 34, my - 12); x.quadraticCurveTo(cx, my + 34, cx + 34, my - 12); x.closePath(); x.fill();
      x.fillStyle = '#ff8fab'; x.beginPath(); x.ellipse(cx, my + 8, 15, 8, 0, 0, 7); x.fill();
      x.fillStyle = '#fff'; x.fillRect(cx - 22, my - 12, 44, 7);
    } else if (e === 'surprised') {
      x.beginPath(); x.ellipse(cx, my, 13, 17 + talk * 4, 0, 0, 7); x.fill(); x.fillStyle = '#ff8fab'; x.beginPath(); x.ellipse(cx, my + 7, 8, 6, 0, 0, 7); x.fill();
    } else if (e === 'sad') {
      x.beginPath(); x.moveTo(cx - 22, my + 8); x.quadraticCurveTo(cx, my - 12, cx + 22, my + 8); x.stroke();
      x.fillStyle = 'rgba(140,200,255,.9)'; x.beginPath(); x.ellipse(cx + ex + 8, ey + 40, 6, 10, 0, 0, 7); x.fill();
    } else if (e === 'thinking') {
      x.beginPath(); x.moveTo(cx - 18, my + 2); x.quadraticCurveTo(cx + 4, my - 6, cx + 22, my - 4); x.stroke();
    } else if (e === 'sleepy') {
      x.beginPath(); x.ellipse(cx, my, 9, 7 + talk * 3, 0, 0, 7); x.fill();
    } else {
      x.beginPath(); x.moveTo(cx - 22, my - 6); x.quadraticCurveTo(cx, my + 14, cx + 22, my - 6); x.stroke();
    }
  }

  function create(opts) {
    opts = opts || {};
    var root = new T.Group(), hips = new T.Group(); root.add(hips);
    var dMat = M(opts.dress || '#ff4f9a', 0.55), skinM = M(SKIN, 0.7), hairM = M(HAIR, 0.55), bowM = M(0xff4f9a, 0.45), shoeM = M(0xff6fa6, 0.35);
    // legs (under the long skirt; shoes peek out while stepping)
    var legs = [-1, 1].map(function (s) {
      var p = new T.Group(); p.position.set(s * 0.1, 0.46, 0);
      var leg = new T.Mesh(new T.CylinderGeometry(0.05, 0.045, 0.4, 10), M(0xfff1f5, 0.6)); leg.position.y = -0.22; p.add(leg);
      var shoe = new T.Mesh(new T.SphereGeometry(0.075, 12, 10), shoeM); shoe.scale.set(0.9, 0.6, 1.4); shoe.position.set(0, -0.42, 0.04); shoe.castShadow = true; p.add(shoe);
      hips.add(p); return p;
    });
    var skirtG = new T.Group(); skirtG.position.y = 0.84; hips.add(skirtG);
    var skirt = new T.Mesh(new T.CylinderGeometry(0.2, 0.42, 0.74, 24, 1, true), dMat); skirt.position.y = -0.37; skirt.castShadow = true; skirt.material.side = T.DoubleSide; skirtG.add(skirt);
    var hem = new T.Mesh(new T.TorusGeometry(0.42, 0.025, 6, 32), M(0xffffff, 0.5)); hem.rotation.x = Math.PI / 2; hem.position.y = -0.73; skirtG.add(hem);
    var torso = new T.Group(); torso.position.y = 0.82; hips.add(torso);
    var bodice = new T.Mesh(new T.CylinderGeometry(0.17, 0.205, 0.4, 20), dMat); bodice.position.y = 0.14; bodice.castShadow = true; torso.add(bodice);
    var sash = new T.Mesh(new T.CylinderGeometry(0.212, 0.212, 0.08, 20), M(0xffd166, 0.35)); torso.add(sash);
    var collar = new T.Mesh(new T.TorusGeometry(0.12, 0.03, 6, 20), M(0xffffff, 0.5)); collar.rotation.x = Math.PI / 2; collar.position.y = 0.34; torso.add(collar);
    var arms = [-1, 1].map(function (s) {
      var sh = new T.Group(); sh.position.set(s * 0.23, 0.28, 0);
      var up = new T.Mesh(new T.CylinderGeometry(0.062, 0.056, 0.2, 10), dMat); up.position.y = -0.1; up.castShadow = true; sh.add(up);
      var el = new T.Group(); el.position.y = -0.2; sh.add(el);
      var fo = new T.Mesh(new T.CylinderGeometry(0.05, 0.045, 0.17, 10), skinM); fo.position.y = -0.085; el.add(fo);
      var hand = new T.Mesh(new T.SphereGeometry(0.056, 12, 10), skinM); hand.position.y = -0.19; el.add(hand);
      sh.rotation.z = s * 0.12; torso.add(sh); sh.userData.el = el; return sh;
    });
    var neck = new T.Group(); neck.position.y = 0.38; torso.add(neck);
    var headG = new T.Group(); headG.position.y = 0.2; neck.add(headG);
    var head = new T.Mesh(new T.SphereGeometry(0.27, 28, 22), skinM); head.castShadow = true; headG.add(head);
    // face patch
    var fc = document.createElement('canvas'); fc.width = 512; fc.height = 256; var fx = fc.getContext('2d');
    var ftex = new T.CanvasTexture(fc); ftex.encoding = T.sRGBEncoding; ftex.anisotropy = 4;
    var face = new T.Mesh(new T.SphereGeometry(0.2715, 40, 20, Math.PI / 2 - 1.2, 2.4, 0.9, 1.25),
      new T.MeshStandardMaterial({ map: ftex, transparent: true, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false }));
    headG.add(face);
    // hair: cap, buns, bows, braid
    var cap = new T.Mesh(new T.SphereGeometry(0.287, 26, 20, 0, Math.PI * 2, 0, Math.PI * 0.55), hairM); cap.rotation.x = -0.32; headG.add(cap);
    var fringe = new T.Mesh(new T.SphereGeometry(0.29, 22, 10, Math.PI / 2 - 0.9, 1.8, 0.35, 0.42), hairM); headG.add(fringe);
    var buns = [-1, 1].map(function (s) { var b = new T.Mesh(new T.SphereGeometry(0.11, 14, 12), hairM); b.position.set(s * 0.23, 0.18, -0.05); headG.add(b); return b; });
    [-1, 1].forEach(function (s) { var bw = new T.Mesh(new T.ConeGeometry(0.07, 0.13, 8), bowM); bw.rotation.z = -s * Math.PI / 2; bw.position.set(s * 0.065, 0.285, 0.06); headG.add(bw); });
    var knot = new T.Mesh(new T.SphereGeometry(0.03, 8, 6), bowM); knot.position.set(0, 0.285, 0.06); headG.add(knot);
    var braidAnchor = new T.Object3D(); braidAnchor.position.set(0, -0.02, -0.26); headG.add(braidAnchor);
    var braid = [], N = 6, SEG = 0.075;
    for (var i = 0; i < N; i++) { var bm = new T.Mesh(new T.SphereGeometry(0.06 - i * 0.005, 10, 8), hairM); bm.scale.y = 1.25; bm.castShadow = true; root.add(bm); braid.push({ m: bm, p: new T.Vector3(), o: new T.Vector3(), init: false }); }
    var tipBow = new T.Mesh(new T.TorusGeometry(0.04, 0.018, 6, 12), bowM); root.add(tipBow);
    // accessories kept for the house world
    var backpack = new T.Mesh(new T.BoxGeometry(0.32, 0.34, 0.18), M(0x1ec8f3, 0.5)); backpack.position.set(0, 0.12, -0.25); backpack.visible = !!opts.backpack; torso.add(backpack);
    var crown = new T.Mesh(new T.ConeGeometry(0.12, 0.16, 6), M(0xffd166, 0.3)); crown.position.set(0, 0.36, 0.02); crown.visible = !!opts.crown; headG.add(crown);

    // ---------- state ----------
    var S = { phase: 0, speed: 0, turn: 0, lastPos: new T.Vector3(), lastYaw: 0, first: true, idleT: 0, blinkT: 2 + Math.random() * 2, blink: 0,
      expr: 'neutral', exprT: 0, react: null, reactT: 0, lookT: 0, lookOff: new T.Vector2(), gaze: new T.Vector2(), faceKey: '', camera: opts.camera || null, target: null,
      weight: 0, talk: 0 };
    function redraw() {
      var e = S.expr, k = e + '|' + (S.blink > 0.5 ? 1 : 0) + '|' + Math.round(S.gaze.x * 4) + '|' + Math.round(S.gaze.y * 4) + '|' + Math.round(S.talk * 3);
      if (k === S.faceKey) return; S.faceKey = k; drawFace(fx, e, S.blink, Math.round(S.gaze.x * 4) / 4, Math.round(S.gaze.y * 4) / 4, S.talk); ftex.needsUpdate = true;
      portraits.forEach(paintPortrait);
    }
    var portraits = [];
    function paintPortrait(c) {
      var x = c.getContext('2d'), w = c.width, h = c.height; x.clearRect(0, 0, w, h);
      x.fillStyle = '#4a2c2a'; [-1, 1].forEach(function (s) { x.beginPath(); x.arc(w / 2 + s * w * 0.36, h * 0.3, w * 0.17, 0, 7); x.fill(); });
      x.beginPath(); x.arc(w / 2, h * 0.55, w * 0.43, 0, 7); x.fill();
      x.fillStyle = '#fcd5b5'; x.beginPath(); x.arc(w / 2, h * 0.6, w * 0.38, 0, 7); x.fill();
      x.save(); x.beginPath(); x.arc(w / 2, h * 0.6, w * 0.38, 0, 7); x.clip();
      x.drawImage(fc, 120, 70, 272, 186, w * 0.12, h * 0.42, w * 0.76, h * 0.52); x.restore();
      x.fillStyle = '#4a2c2a'; x.beginPath(); x.ellipse(w / 2, h * 0.3, w * 0.36, h * 0.13, 0, Math.PI, 0); x.fill();
      x.fillStyle = '#ff4f9a'; [-1, 1].forEach(function (s) { x.beginPath(); x.moveTo(w / 2, h * 0.16); x.lineTo(w / 2 + s * w * 0.14, h * 0.08); x.lineTo(w / 2 + s * w * 0.14, h * 0.24); x.fill(); });
    }
    var api = {
      portrait: function (c) { portraits.push(c); paintPortrait(c); },
      root: root, dMat: dMat, arms: arms, headG: headG, backpack: backpack, crown: crown,
      setCamera: function (c) { S.camera = c; },
      lookAt: function (v) { S.target = v; },
      expr: function (name, dur) { S.expr = name; S.exprT = dur == null ? 2.2 : dur; S.idleT = Math.min(S.idleT, 3); },
      react: function (name) { if (S.react && S.reactT < 0.5) return; S.react = name || ['wave', 'jump', 'spin'][Math.floor(Math.random() * 3)]; S.reactT = 0; S.idleT = 0;
        api.expr(S.react === 'jump' ? 'surprised' : 'happy', S.react === 'jump' ? 0.5 : 1.8); if (S.react === 'jump') setTimeout(function () { if (S.expr === 'surprised') api.expr('happy', 1.4); }, 520); },
      busy: function () { return !!S.react; },
      state: function () { return { expr: S.expr, react: S.react, speed: +S.speed.toFixed(2), blink: S.blink, idle: +S.idleT.toFixed(1) }; },
      update: function (dt, t) {
        dt = Math.min(dt, 0.05);
        // measure motion from what the game did to root this frame
        var wp = root.position;
        if (S.first) { S.lastPos.copy(wp); S.lastYaw = root.rotation.y; S.first = false; }
        var v = Math.hypot(wp.x - S.lastPos.x, wp.z - S.lastPos.z) / Math.max(dt, 1e-3);
        var dyaw = root.rotation.y - S.lastYaw; dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw));
        S.lastPos.copy(wp); S.lastYaw = root.rotation.y;
        S.speed += (Math.min(v, 7) - S.speed) * Math.min(1, dt * 10);
        S.turn += (dyaw / Math.max(dt, 1e-3) - S.turn) * Math.min(1, dt * 8);
        var moving = S.speed > 0.35, run = S.speed > 4.0;
        if (moving) S.idleT = 0; else S.idleT += dt;
        // expression timers
        if (S.exprT > 0) { S.exprT -= dt; if (S.exprT <= 0) S.expr = 'neutral'; }
        if (S.idleT > 14 && S.expr === 'neutral') S.expr = 'sleepy';
        if (S.expr === 'sleepy' && S.idleT < 1) S.expr = 'neutral';
        // blink
        S.blinkT -= dt; if (S.blinkT < 0) { S.blink = 1; if (S.blinkT < -0.13) { S.blink = 0; S.blinkT = 1.8 + Math.random() * 3.2; } }
        S.talk = (S.expr === 'surprised' || S.expr === 'sleepy') ? (Math.sin(t * (S.expr === 'sleepy' ? 1.5 : 9)) * 0.5 + 0.5) : 0;
        // ---- locomotion ----
        var amp = Math.min(1, S.speed / 3.2), cad = run ? 15 : 10.5;
        if (moving) S.phase += dt * cad * Math.max(0.55, Math.min(1.3, S.speed / 3.2)); else S.phase += (Math.round(S.phase / Math.PI) * Math.PI - S.phase) * Math.min(1, dt * 8);
        var sw = Math.sin(S.phase), swing = (run ? 0.75 : 0.5) * amp;
        legs[0].rotation.x = sw * swing; legs[1].rotation.x = -sw * swing;
        var breathe = Math.sin(t * 2.1);
        var bob = moving ? Math.abs(Math.sin(S.phase)) * (run ? 0.09 : 0.05) * amp : breathe * 0.006;
        S.weight += ((moving ? 0 : Math.sin(t * 0.45) * 0.035) - S.weight) * Math.min(1, dt * 3);
        var lean = moving ? (run ? 0.2 : 0.07) * amp : 0;
        var turnLean = T.MathUtils.clamp(-S.turn * 0.05 * amp, -0.22, 0.22);
        hips.position.set(S.weight, bob, 0); hips.rotation.set(lean, 0, turnLean + S.weight * 0.6); hips.scale.set(1, 1, 1);
        torso.scale.set(1 + breathe * 0.012, 1 + breathe * 0.018, 1 + breathe * 0.012);
        skirtG.rotation.x = -sw * 0.05 * amp - lean * 0.4; skirtG.rotation.z = Math.sin(S.phase * 2) * 0.02 * amp;
        // arms
        var armX = [-sw * (run ? 1.0 : 0.6) * amp, sw * (run ? 1.0 : 0.6) * amp], idleArm = moving ? 0 : Math.sin(t * 1.3) * 0.04;
        arms.forEach(function (a, i) { var s = i ? 1 : -1; a.rotation.x += (armX[i] + idleArm - a.rotation.x) * Math.min(1, dt * 12); a.rotation.z += (s * (0.12 + (run ? 0.18 : 0)) - a.rotation.z) * Math.min(1, dt * 10); a.userData.el.rotation.x += ((moving ? -0.35 - (run ? 0.6 : 0) : -0.08) - a.userData.el.rotation.x) * Math.min(1, dt * 10); a.userData.el.rotation.z += (0 - a.userData.el.rotation.z) * Math.min(1, dt * 10); });
        // head: look toward camera / target, idle look-around, sleepy droop
        S.lookT -= dt; if (S.lookT < 0) { S.lookT = 1.6 + Math.random() * 2.6; S.lookOff.set((Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.3); if (Math.random() < 0.45) S.lookOff.set(0, 0); }
        var yaw = 0, pitch = 0;
        var tgt = S.target || (S.camera && S.camera.position);
        if (tgt && !moving) {
          var hp = new T.Vector3(); headG.getWorldPosition(hp);
          var dx = tgt.x - hp.x, dz = tgt.z - hp.z, dy = tgt.y - hp.y;
          var ang = Math.atan2(dx, dz) - root.rotation.y; ang = Math.atan2(Math.sin(ang), Math.cos(ang));
          yaw = T.MathUtils.clamp(ang, -0.75, 0.75); pitch = T.MathUtils.clamp(-Math.atan2(dy, Math.hypot(dx, dz)) * 0.5, -0.3, 0.25);
          if (Math.abs(ang) > 1.6) yaw = 0;
        }
        if (!moving) { yaw += S.lookOff.x * 0.5; pitch += S.lookOff.y * 0.5; }
        if (S.expr === 'thinking') { yaw += 0.18; pitch -= 0.18; }
        if (S.expr === 'sad') pitch += 0.18;
        if (S.expr === 'sleepy') { pitch += 0.28 + Math.sin(t * 1.5) * 0.06; }
        var tilt = moving ? Math.sin(S.phase * 0.5) * 0.04 : (S.expr === 'thinking' ? 0.18 : Math.sin(t * 0.9) * 0.04) + (S.expr === 'happy' ? Math.sin(t * 6) * 0.06 : 0);
        headG.rotation.y += (yaw - headG.rotation.y) * Math.min(1, dt * 6); headG.rotation.x += (pitch - headG.rotation.x) * Math.min(1, dt * 6); headG.rotation.z += (tilt - headG.rotation.z) * Math.min(1, dt * 6);
        // eye gaze follows head intention a bit further
        var gxT = T.MathUtils.clamp(-yaw * 1.4 + (S.expr === 'thinking' ? -0.8 : 0), -1, 1), gyT = T.MathUtils.clamp(pitch * 2 + (S.expr === 'thinking' ? -0.9 : 0), -1, 1);
        if (moving) { gxT = 0; gyT = 0.1; }
        S.gaze.x += (gxT - S.gaze.x) * Math.min(1, dt * 8); S.gaze.y += (gyT - S.gaze.y) * Math.min(1, dt * 8);
        // happy bounce when idle & happy
        if (!moving && !S.react && S.expr === 'happy') { hips.position.y += Math.abs(Math.sin(t * 7)) * 0.03; }
        // thinking pose: hand to chin
        if (!moving && !S.react && S.expr === 'thinking') { var ra = arms[1]; ra.rotation.x += (-1.5 - ra.rotation.x) * Math.min(1, dt * 8); ra.rotation.z += (-0.35 - ra.rotation.z) * Math.min(1, dt * 8); ra.userData.el.rotation.x += (-1.6 - ra.userData.el.rotation.x) * Math.min(1, dt * 8); }
        if (!moving && !S.react && S.expr === 'sad') { arms.forEach(function (a, i) { a.rotation.x += (0.25 - a.rotation.x) * Math.min(1, dt * 6); a.rotation.z += ((i ? 0.25 : -0.25) - a.rotation.z) * Math.min(1, dt * 6); }); hips.rotation.x -= 0.05; }
        // ---- reactions ----
        if (S.react) {
          S.reactT += dt; var r = S.reactT;
          if (S.react === 'wave') {
            var D = 1.7, k = Math.min(1, r / 0.2) * Math.min(1, (D - r) / 0.25);
            var a1 = arms[1]; a1.rotation.z = -2.5 * k + 0.12 * (1 - k); a1.rotation.x = -0.2 * k; a1.userData.el.rotation.z = Math.sin(r * 14) * 0.55 * k; a1.userData.el.rotation.x = 0;
            headG.rotation.z += 0.12 * k; hips.rotation.z -= 0.05 * k;
            if (r > D) S.react = null;
          } else if (S.react === 'jump') {
            var D2 = 1.0, y = 0, sy = 1;
            if (r < 0.18) { sy = 1 - 0.22 * Math.sin(r / 0.18 * Math.PI / 2); }
            else if (r < 0.78) { var u = (r - 0.18) / 0.6; y = 4 * u * (1 - u) * 0.55; sy = 1 + 0.16 * Math.max(0, 1 - u * 2.2) - 0.04; arms.forEach(function (a, i) { a.rotation.z = (i ? -1 : 1) * 2.4 * Math.sin(Math.min(1, u * 1.6) * Math.PI / 2); }); legs.forEach(function (l, i) { l.rotation.x = (i ? 0.3 : -0.3) * Math.sin(u * Math.PI); }); }
            else if (r < D2) { var u2 = (r - 0.78) / 0.22; sy = 1 - 0.2 * Math.sin(u2 * Math.PI); }
            else S.react = null;
            hips.position.y += y; hips.scale.set(1 / Math.sqrt(sy), sy, 1 / Math.sqrt(sy));
          } else if (S.react === 'spin') {
            var D3 = 1.0, u3 = Math.min(1, r / D3), e3 = u3 < 0.5 ? 4 * u3 * u3 * u3 : 1 - Math.pow(-2 * u3 + 2, 3) / 2;
            hips.rotation.y = e3 * Math.PI * 2; hips.position.y += Math.sin(u3 * Math.PI) * 0.22;
            var s3 = 1 + Math.sin(u3 * Math.PI) * 0.08; hips.scale.set(1 + (s3 - 1) * 0.6, 1 / s3 * (u3 > 0.9 ? 0.92 + (1 - u3) * 0.8 : 1), 1 + (s3 - 1) * 0.6);
            arms.forEach(function (a, i) { a.rotation.z = (i ? -1 : 1) * 1.3 * Math.sin(u3 * Math.PI); });
            if (r > D3) { S.react = null; hips.rotation.y = 0; }
          }
        }
        // ---- braid spring (verlet in world space) ----
        root.updateMatrixWorld(true);
        var anchor = new T.Vector3(); braidAnchor.getWorldPosition(anchor);
        var prev = anchor, g = -9.8 * dt * dt;
        for (var i2 = 0; i2 < N; i2++) {
          var b = braid[i2];
          if (!b.init) { b.p.set(anchor.x, anchor.y - SEG * (i2 + 1), anchor.z); b.o.copy(b.p); b.init = true; }
          var vx = (b.p.x - b.o.x) * 0.9, vy = (b.p.y - b.o.y) * 0.9, vz = (b.p.z - b.o.z) * 0.9;
          b.o.copy(b.p); b.p.x += vx; b.p.y += vy + g; b.p.z += vz;
          var d = b.p.clone().sub(prev), L = d.length() || 1e-4; b.p.copy(prev).addScaledVector(d, SEG / L);
          // keep the braid behind the head/body (soft collision with a sphere around the head/back)
          var hc = new T.Vector3(); head.getWorldPosition(hc); var ds = b.p.clone().sub(hc), dl = ds.length(); if (dl < 0.3) b.p.copy(hc).addScaledVector(ds, 0.3 / (dl || 1));
          prev = b.p;
        }
        var inv = new T.Matrix4().copy(root.matrixWorld).invert();
        braid.forEach(function (b) { b.m.position.copy(b.p).applyMatrix4(inv); });
        tipBow.position.copy(braid[N - 1].m.position); tipBow.position.y -= 0.05;
        redraw();
      }
    };
    root.userData = { dMat: dMat, arms: arms, headG: headG, backpack: backpack, crown: crown, rig: api, isGhalia: true };
    redraw();
    return api;
  }
  window.GhaliaRig = { create: create, drawFace: drawFace };
})();

/* ---- Adapter: when the dedicated character module (ghalia-sprite.js / ghalia-character.js → createGhalia)
   is loaded, GhaliaRig.create() returns it behind the same small API the game pages use.
   The built-in procedural rig above stays as the fallback. ---- */
(function () {
  'use strict';
  if (!window.GhaliaRig || typeof window.createGhalia !== 'function') return;
  var legacy = window.GhaliaRig.create, T = THREE;
  window.GhaliaRig.create = function (opts) {
    opts = opts || {};
    var g, cam = opts.camera || null;
    try { g = window.createGhalia(T, { shadows: true, camera: cam }); } catch (e) { console.warn('[ghalia] module failed, using built-in rig', e); return legacy(opts); }
    var root = g.group, A = window.GHALIA_ATLAS, at = g.attach || {};
    var mk = function (geo, hex) { return new T.Mesh(geo, new T.MeshStandardMaterial({ color: hex, roughness: 0.45, metalness: 0.2 })); };
    var backpack = mk(new T.BoxGeometry(0.3, 0.32, 0.12), 0x1ec8f3); backpack.position.set(0, 0, -0.08); backpack.visible = !!opts.backpack; (at.back || g.bones.spine || root).add(backpack);
    var crown = mk(new T.ConeGeometry(0.1, 0.14, 6), 0xffd166); crown.position.set(0, 0.02, 0.02); crown.visible = !!opts.crown; (at.head || g.bones.head || root).add(crown);
    var dMat = { color: { set: function (c) { try { g.setColors({ dress: c }); } catch (e) {} } } };
    var img = null; if (A && A.src) { img = new Image(); img.src = A.src; }
    var portraits = [], lastP = 0, lastE = '';
    function paint(c) {
      var x = c.getContext('2d'), w = c.width, h = c.height; x.clearRect(0, 0, w, h);
      x.fillStyle = '#ffe3ef'; x.beginPath(); x.arc(w / 2, h / 2, w * 0.48, 0, 7); x.fill();
      var e = g.expression || 'neutral', hd = A && A.heads && (A.heads[e] || A.heads.neutral);
      if (img && img.complete && img.naturalWidth && hd) {
        x.save(); x.beginPath(); x.arc(w / 2, h / 2, w * 0.48, 0, 7); x.clip();
        var s = Math.min(w / hd.w, h / hd.h) * 0.98; x.drawImage(img, hd.x, hd.y, hd.w, hd.h, (w - hd.w * s) / 2, h * 0.04, hd.w * s, hd.h * s); x.restore();
      } else if (g.faceCanvas) { var fc = g.faceCanvas; x.drawImage(fc, fc.width * 0.16, fc.height * 0.2, fc.width * 0.68, fc.height * 0.68, w * 0.14, h * 0.22, w * 0.72, h * 0.72); }
      lastE = e;
    }
    function tick() { var n = performance.now(); if (portraits.length && n - lastP > 150) { lastP = n; var e = g.expression; portraits.forEach(function (c) { if (c.offsetParent && (e !== lastE || !c.__p)) { c.__p = 1; paint(c); } }); } }
    var api = {
      root: root, dMat: dMat, arms: [], headG: at.head || g.bones.head, backpack: backpack, crown: crown, module: g,
      setCamera: function (c) { cam = c; }, lookAt: function (v) { g.lookAt(v || null); },
      expr: function (name, dur) { try { g.setExpression(name, dur && name !== 'neutral' ? { duration: dur } : undefined); } catch (e) {} },
      react: function (name) { var R = g.REACTIONS || ['wave', 'jump', 'spin']; var pick = ['wave', 'jump', 'spin', 'cheer'].filter(function (r) { return R.indexOf(r) >= 0; }); g.react(name || pick[Math.floor(Math.random() * pick.length)]); },
      busy: function () { return g.isReacting; },
      state: function () { return { expr: g.expression, react: g.isReacting }; },
      portrait: function (c) { portraits.push(c); paint(c); if (img && !img.complete) img.addEventListener('load', function () { paint(c); }); },
      tickPortrait: tick,
      update: function (dt) { g.update(dt, cam ? { camera: cam } : undefined); tick(); }
    };
    root.userData.dMat = dMat; root.userData.backpack = backpack; root.userData.crown = crown; root.userData.rig = api;
    return api;
  };
})();
