/*!
 * ghalia-sprite.js — Ghalia as a high-quality 2.5D illustrated billboard for Three.js (r128+).
 * Same API as ghalia-character.js:  createGhalia(THREE, opts) -> { group, update, setExpression, react, lookAt, ... }
 *
 *   <script src="lib/three.min.js"></script>
 *   <script src="ghalia-sprite-atlas.js"></script>   <!-- art embedded as data URI: works offline / file:// -->
 *   <script src="ghalia-sprite.js"></script>
 *   const g = createGhalia(THREE);  scene.add(g.group);
 *   // the game moves g.group (position x/z, rotation.y = atan2(dx,dz)) exactly as before
 *   g.update(dt);  g.setExpression('happy');  g.react('jump');  g.lookAt(v3|null);
 *
 * The card always faces the active camera (cylindrical billboard, set in onBeforeRender) and picks the
 * front / side / 3-4 / back art from the character's facing relative to that camera.
 * Feet at y = 0, ~1.62 units tall.  Do not animate group.position.y — bob/squash/jump are internal.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) { root.GhaliaSprite = api; root.createGhalia = api.createGhalia; }
})(typeof self !== 'undefined' ? self : (typeof globalThis !== 'undefined' ? globalThis : this), function () {
  'use strict';
  var EXPRESSIONS = ['neutral', 'happy', 'surprised', 'thinking', 'sad', 'sleepy'];
  var REACTIONS = { wave: 1.9, jump: 1.0, spin: 1.1, cheer: 1.5, nod: 0.9 };
  var CYCLES = {
    front: ['front_walk_0', 'front_walk_1', 'front_walk_2', 'front_walk_3'],
    side: ['side_walk_0', 'side_walk_1', 'side_walk_2', 'side_walk_3'],
    back: ['back_walk_0', 'back_walk_1', 'back_walk_2', 'back_walk_1']
  };
  // braid region per frame family in normalised frame coords (u from left, v from top): centre u, root v, length
  var BRAID = {
    front: [0.78, 0.18, 0.26], side: [0.22, 0.18, 0.27], back: [0.53, 0.16, 0.3], q34: [0.86, 0.2, 0.22],
    wave: [0.77, 0.24, 0.22], cheer: [0.6, 0.24, 0.2], jump: [0.62, 0.22, 0.2]
  };
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function damp(a, b, r, dt) { return a + (b - a) * (1 - Math.exp(-r * dt)); }
  function smooth(e0, e1, x) { var t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }
  function bell(t, a, b) { return smooth(0, a, t) * (1 - smooth(b, 1, t)); }
  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function createGhalia(THREE, opts) {
    opts = opts || {};
    var A = opts.atlas || (typeof self !== 'undefined' && self.GHALIA_ATLAS);
    if (!A) throw new Error('ghalia-sprite: load ghalia-sprite-atlas.js first (or pass opts.atlas)');
    var HEIGHT = 1.62 * (opts.scale || 1);
    var PPU = A.standHeightPx / HEIGHT;           // atlas px per world unit
    var sleepAfter = opts.sleepAfter != null ? opts.sleepAfter : 18;
    var runSpeed = opts.runSpeed || 3.6;
    var autoGlance = opts.autoGlance !== false;
    var disposables = [];

    // ---- texture from embedded atlas ----
    var img = new Image();
    var tex = new THREE.Texture(img);
    if (THREE.sRGBEncoding !== undefined && opts.srgb !== false) tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 4; tex.premultiplyAlpha = false;
    var ready = false;
    img.onload = function () { tex.needsUpdate = true; ready = true; if (opts.onReady) opts.onReady(api); };
    img.src = A.src;
    disposables.push(tex);

    // ---- material with bend / braid warp ----
    function makeMat() {
      var m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, depthWrite: true, color: opts.tint != null ? opts.tint : 0xffffff });
      m.userData.u = { uBend: { value: 0 }, uBraid: { value: new THREE.Vector4(0.78, 0.18, 0.26, 0) }, uFlip: { value: 1 } };
      m.onBeforeCompile = function (sh) {
        Object.assign(sh.uniforms, m.userData.u);
        sh.vertexShader = 'uniform float uBend; uniform vec4 uBraid; uniform float uFlip;\n' + sh.vertexShader.replace('#include <begin_vertex>',
          '#include <begin_vertex>\n' +
          'float hgt = transformed.y + 0.5;\n' +                        // 0 at feet .. 1 at top of card
          'vec2 q = vec2(transformed.x + 0.5, 0.5 - transformed.y);\n' +  // frame uv (u right, v down)
          'float below = clamp((q.y - uBraid.y) / uBraid.z, 0.0, 1.0);\n' +
          'float wx = exp(-pow((q.x - uBraid.x) / 0.09, 2.0));\n' +
          'float wy = smoothstep(-0.02, 0.05, q.y - uBraid.y) * (1.0 - smoothstep(uBraid.y + uBraid.z, uBraid.y + uBraid.z + 0.08, q.y));\n' +
          'transformed.x += uBraid.w * wx * wy * below * below;\n' +
          'transformed.x += uBend * hgt * hgt;\n');
      };
      m.customProgramCacheKey = function () { return 'ghaliaSprite'; };
      disposables.push(m);
      return m;
    }
    function makeCard(segX, segY) {
      var g = new THREE.PlaneGeometry(1, 1, segX, segY); disposables.push(g);
      var mesh = new THREE.Mesh(g, makeMat()); mesh.frustumCulled = false;
      mesh.userData.base = g.attributes.uv.array.slice();
      return mesh;
    }
    function setRect(mesh, r) { // map card UVs to an atlas rect
      var uv = mesh.geometry.attributes.uv, base = mesh.userData.base, W = A.size[0], H = A.size[1];
      for (var i = 0; i < uv.count; i++) {
        var u = base[i * 2], v = base[i * 2 + 1];
        uv.array[i * 2] = (r.x + u * r.w) / W;
        uv.array[i * 2 + 1] = 1 - (r.y + (1 - v) * r.h) / H;
      }
      uv.needsUpdate = true;
    }

    var group = new THREE.Group(); group.name = 'Ghalia';
    var holder = new THREE.Group(); group.add(holder);       // yaw-locked to the camera
    var rig = new THREE.Group(); holder.add(rig);              // bob / squash / jump / spin
    var body = makeCard(6, 14); rig.add(body); body.renderOrder = 1;
    var headA = makeCard(1, 1), headB = makeCard(1, 1);
    [headA, headB].forEach(function (h, i) { h.material.alphaTest = 0.02; h.material.depthWrite = false; h.renderOrder = 2 + i; h.position.z = 0.004 + i * 0.001; rig.add(h); });
    // blob shadow (on the ground, not billboarded)
    var sc = document.createElement('canvas'); sc.width = sc.height = 64;
    var sx = sc.getContext('2d'), gr = sx.createRadialGradient(32, 32, 2, 32, 32, 32);
    gr.addColorStop(0, 'rgba(20,8,30,0.55)'); gr.addColorStop(0.6, 'rgba(20,8,30,0.25)'); gr.addColorStop(1, 'rgba(20,8,30,0)');
    sx.fillStyle = gr; sx.fillRect(0, 0, 64, 64);
    var stex = new THREE.CanvasTexture(sc); disposables.push(stex);
    var shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), new THREE.MeshBasicMaterial({ map: stex, transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.006; shadow.renderOrder = 0; group.add(shadow);
    disposables.push(shadow.geometry, shadow.material);

    // attach points (follow the card)
    var attach = { head: new THREE.Group(), back: new THREE.Group(), handL: new THREE.Group(), handR: new THREE.Group() };
    attach.head.position.set(0, HEIGHT * 1.0, 0.01); attach.back.position.set(0, HEIGHT * 0.55, -0.02);
    attach.handL.position.set(0.22, HEIGHT * 0.38, 0.02); attach.handR.position.set(-0.22, HEIGHT * 0.38, 0.02);
    Object.keys(attach).forEach(function (k) { rig.add(attach[k]); });

    // ---- camera-facing ----
    var lastCam = opts.camera || null;
    var tmpV = new THREE.Vector3(), tmpV2 = new THREE.Vector3(), tmpQ = new THREE.Quaternion(), camRight = new THREE.Vector3();
    function faceCamera(cam) {
      if (!cam) return;
      group.updateWorldMatrix(true, false);
      var gp = tmpV.setFromMatrixPosition(group.matrixWorld);
      var cp = tmpV2.setFromMatrixPosition(cam.matrixWorld);
      var camYaw = Math.atan2(cp.x - gp.x, cp.z - gp.z);
      group.getWorldQuaternion(tmpQ);
      var gYaw = new THREE.Euler().setFromQuaternion(tmpQ, 'YXZ').y;
      holder.rotation.y = camYaw - gYaw;
    }
    body.onBeforeRender = function (r, s, cam) { lastCam = cam; faceCamera(cam); };

    // ---- state ----
    var st = {
      t: 0, phase: 0, speed: 0, run: 0, move: 0, turn: 0, idle: 0, view: 'front', flip: false,
      base: 'neutral', baseUntil: 0, temp: null, tempUntil: 0, shownHead: 'neutral', headFade: 1,
      blinkT: 2.5, blinkAge: 99, blinkDur: 0.14, reaction: null, rt: 0, glanceT: 3, glance: 0,
      lookTarget: null, prevPos: null, prevYaw: null, vel: new THREE.Vector3(), prevVel: new THREE.Vector3(), acc: new THREE.Vector3(),
      braid: 0, braidV: 0, bend: 0, yawn: 0, yawnT: 6
    };

    function frameInfo(name) { return A.frames[name]; }
    function placeBody(name, flip) {
      var f = frameInfo(name); setRect(body, f);
      var w = f.w / PPU, h = f.h / PPU;
      body.scale.set(w * (flip ? -1 : 1), h, 1);
      var cx = (f.w / 2 - f.ax) / PPU; body.position.set(flip ? -cx : cx, (f.ay - f.h / 2) / PPU, 0);
      return f;
    }
    function placeHead(mesh, frameName, headName, flip, dy) {
      var hp = A.headPlace[frameName], hd = A.heads[headName], f = A.frames[frameName];
      if (!hp || !hd) { mesh.visible = false; return; }
      setRect(mesh, hd);
      var s = hp.s, left = hp.x + hd.ox * s, top = hp.y + hd.oy * s, w = hd.w * s, h = hd.h * s;
      var cx = (left + w / 2 - f.ax) / PPU, cy = (f.ay - (top + h / 2)) / PPU;
      mesh.scale.set(w / PPU * (flip ? -1 : 1), h / PPU, 1);
      mesh.position.x = flip ? -cx : cx; mesh.position.y = cy + (dy || 0);
      mesh.visible = true;
    }

    function setExpression(name, o) {
      if (EXPRESSIONS.indexOf(name) < 0) { console.warn('[ghalia] unknown expression', name); return; }
      o = o || {}; st.base = name; st.temp = null; st.idle = 0; st.baseUntil = o.duration ? st.t + o.duration : 0;
    }
    function react(name) {
      if (!REACTIONS[name]) { console.warn('[ghalia] unknown reaction', name); return; }
      st.reaction = name; st.rt = 0; st.idle = 0;
      st.temp = name === 'jump' ? 'surprised' : name === 'nod' ? null : 'happy';
      st.tempUntil = st.t + REACTIONS[name] + 0.4;
    }
    function lookAt(v) { st.lookTarget = v ? (v.isVector3 ? v.clone() : new THREE.Vector3(v.x, v.y, v.z)) : null; }

    function chooseView(cam) {
      if (!cam) return { view: 'front', flip: false, side: 1 };
      group.updateWorldMatrix(true, false);
      var gp = tmpV.setFromMatrixPosition(group.matrixWorld), cp = tmpV2.setFromMatrixPosition(cam.matrixWorld);
      var tx = cp.x - gp.x, tz = cp.z - gp.z, tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
      group.getWorldQuaternion(tmpQ);
      var yaw = new THREE.Euler().setFromQuaternion(tmpQ, 'YXZ').y;
      var fx = Math.sin(yaw), fz = Math.cos(yaw);
      var dot = fx * tx + fz * tz;                 // 1 = facing the camera
      camRight.set(1, 0, 0).applyQuaternion(cam.quaternion);
      var side = fx * camRight.x + fz * camRight.z; // >0 = facing screen-right
      var hy = 0.06;                               // hysteresis
      var v = st.view;
      var frontT = v === 'front' ? 0.5 - hy : 0.5 + hy, backT = v === 'back' ? -0.5 + hy : -0.5 - hy;
      var view = dot > frontT ? 'front' : dot < backT ? 'back' : 'side';
      return { view: view, flip: side < 0, side: side, dot: dot };
    }

    function update(dt, input) {
      dt = clamp(dt || 0, 0, 0.05); input = input || {};
      st.t += dt; var t = st.t;
      var cam = input.camera || lastCam;
      // measure motion
      group.updateWorldMatrix(true, false);
      var pos = new THREE.Vector3().setFromMatrixPosition(group.matrixWorld), yaw = group.rotation.y;
      if (!st.prevPos) { st.prevPos = pos.clone(); st.prevYaw = yaw; }
      var mSpeed = 0, mTurn = 0;
      if (dt > 0) {
        var vel = pos.clone().sub(st.prevPos).divideScalar(dt); vel.y = 0; mSpeed = vel.length();
        var dy = yaw - st.prevYaw; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI; mTurn = dy / dt;
        st.vel.lerp(vel, 1 - Math.exp(-12 * dt)); st.acc.subVectors(st.vel, st.prevVel).divideScalar(dt); st.prevVel.copy(st.vel);
      }
      st.prevPos.copy(pos); st.prevYaw = yaw;
      var speed = input.speed != null ? input.speed : mSpeed, turn = input.turnRate != null ? input.turnRate : mTurn;
      st.speed = damp(st.speed, speed, 10, dt); st.turn = damp(st.turn, clamp(turn, -8, 8), 6, dt);
      var moving = st.speed > 0.15;
      st.move = damp(st.move, moving ? 1 : 0, 8, dt);
      st.run = damp(st.run, smooth(runSpeed * 0.7, runSpeed * 1.15, st.speed), 5, dt);
      if (moving || st.reaction) st.idle = 0; else st.idle += dt;

      // expression
      if (st.baseUntil && t > st.baseUntil) { st.base = 'neutral'; st.baseUntil = 0; }
      if (st.temp && t > st.tempUntil) st.temp = null;
      var expr = st.temp || st.base;
      if (!st.temp && st.base === 'neutral' && st.idle > sleepAfter) expr = 'sleepy';
      // blink
      st.blinkT -= dt; st.blinkAge += dt;
      if (st.blinkT <= 0) { st.blinkAge = 0; st.blinkDur = expr === 'sleepy' ? 0.5 : 0.13; st.blinkT = (expr === 'sleepy' ? 1.8 : 2.2) + Math.random() * 3; if (Math.random() < 0.18) st.blinkT = 0.25; }
      var blinking = st.blinkAge < st.blinkDur && expr !== 'happy';
      // glance / look target -> 'lookleft' head (her left = screen right when facing the camera)
      var lookLeft = false;
      if (st.lookTarget && cam) {
        var tl = st.lookTarget.clone(); holder.worldToLocal(tl);
        lookLeft = tl.x > 0.35 * Math.max(0.5, Math.abs(tl.z));
      } else if (autoGlance && st.move < 0.5 && !st.reaction && expr === 'neutral') {
        st.glanceT -= dt; if (st.glanceT < 0) { st.glance = Math.random() < 0.35 ? 1 : 0; st.glanceT = 2 + Math.random() * 3.5; }
        lookLeft = st.glance === 1;
      }
      var headName = blinking ? 'blink' : (expr === 'neutral' && lookLeft) ? 'lookleft' : expr;

      // view & frame
      var vw = chooseView(cam); st.view = vw.view; st.flip = vw.flip;
      var frame, flip = false, family = vw.view, mv = st.move, run = st.run;
      var stride = lerp(0.42, 0.75, run), freq = clamp(st.speed / (2 * stride), 0.9, 3.4);
      if (mv > 0.02) st.phase += freq * dt * (mv > 0.3 ? 1 : 0);
      var cyc = st.phase - Math.floor(st.phase);
      if (mv > 0.3) {
        var list = CYCLES[family]; frame = list[Math.floor(cyc * list.length) % list.length];
        flip = family === 'side' ? vw.flip : false;
      } else {
        if (family === 'front') frame = 'front_idle';
        else if (family === 'back') frame = 'back_idle';
        else { frame = 'q34_idle'; flip = !vw.flip; family = 'q34'; } // q34 art faces screen-left
      }
      var y = 0, sxk = 1, syk = 1, bend = 0, headDy = 0, spinA = 0, liftComp = 0;
      // locomotion feel: double bob per cycle, lean
      if (mv > 0.3) {
        y += Math.abs(Math.sin(cyc * Math.PI * 4)) * lerp(0.03, 0.07, run) * mv;
        syk *= 1 + Math.sin(cyc * Math.PI * 4) * 0.015 * mv;
        var lean = lerp(0.03, 0.14, run) * mv;
        if (family === 'side') bend += lean * (flip ? -1 : 1);
      } else {
        var br = Math.sin(t * (expr === 'sleepy' ? 1.4 : 2.3));
        syk *= 1 + br * 0.008; sxk *= 1 - br * 0.004;           // breathing
        bend += Math.sin(t * 0.55) * 0.012;                     // weight shift
        if (expr === 'happy') y += Math.abs(Math.sin(t * 4.2)) * 0.02;
        if (expr === 'sleepy') headDy -= Math.pow(0.5 + 0.5 * Math.sin(t * 0.9), 6) * 0.012;
        if (expr === 'sad') headDy -= 0.005;
      }
      // turn lean (screen-space)
      bend += clamp(-st.turn * st.speed * 0.02, -0.12, 0.12) * (family === 'front' ? 1 : family === 'back' ? -1 : 0.4);

      // reactions
      if (st.reaction) {
        var dur = REACTIONS[st.reaction]; st.rt += dt; var u = st.rt / dur;
        if (u >= 1) st.reaction = null;
        else if (st.reaction === 'wave') {
          frame = 'wave'; flip = false; family = 'wave';
          var e = bell(u, 0.1, 0.9); bend += Math.sin(st.rt * 7) * 0.025 * e; y += Math.abs(Math.sin(st.rt * 7)) * 0.015 * e;
        } else if (st.reaction === 'cheer') {
          frame = 'cheer'; flip = false; family = 'cheer';
          var p = Math.abs(Math.sin(st.rt * 8)); y += p * 0.09 * bell(u, 0.1, 0.85); syk *= 1 + (p - 0.5) * 0.05;
        } else if (st.reaction === 'jump') {
          family = 'jump'; flip = false;
          if (u < 0.22) { frame = 'jump_crouch'; var a = Math.sin(Math.PI * u / 0.22); syk *= 1 - 0.05 * a; sxk *= 1 + 0.03 * a; }
          else if (u < 0.75) {
            frame = 'jump_air'; var air = (u - 0.22) / 0.53; liftComp = A.frames.jump_air.ay - A.frames.jump_air.h; // art is already lifted
            y += 4 * air * (1 - air) * 0.22; var str = 1 - smooth(0, 0.5, air); syk *= 1 + 0.1 * str; sxk *= 1 - 0.05 * str;
          } else if (u < 0.9) { frame = 'jump_crouch'; var l = Math.sin(Math.PI * (u - 0.75) / 0.15); syk *= 1 - 0.08 * l; sxk *= 1 + 0.05 * l; }
          else { frame = 'front_idle'; syk *= 1 + 0.03 * Math.sin(Math.PI * (u - 0.9) / 0.1); }
        } else if (st.reaction === 'spin') {
          spinA = easeInOut(clamp((u - 0.05) / 0.9, 0, 1)) * Math.PI * 2;
          y += Math.sin(Math.PI * clamp((u - 0.05) / 0.9, 0, 1)) * 0.12;
          var c = Math.cos(spinA), s = Math.sin(spinA);
          if (c > 0.55) { frame = 'front_idle'; family = 'front'; flip = false; }
          else if (c < -0.55) { frame = 'back_idle'; family = 'back'; flip = false; }
          else { frame = 'q34_idle'; family = 'q34'; flip = s > 0; }
          sxk *= 0.75 + 0.25 * Math.abs(c) + 0.25 * Math.abs(s);
        } else if (st.reaction === 'nod') {
          headDy += Math.sin(u * Math.PI * 4) * 0.012 * bell(u, 0.1, 0.8);
        }
      }

      // braid spring (screen-space sway)
      var drive = clamp(-st.turn * st.speed * 0.006, -0.05, 0.05) + (mv > 0.3 ? Math.sin(cyc * Math.PI * 2) * 0.012 * mv : 0) - bend * 0.2;
      if (st.reaction === 'spin') drive += Math.sin(spinA) * 0.05;
      if (st.reaction === 'jump') drive += 0.02 * Math.sin(st.rt * 20) * (1 - st.rt);
      st.braidV += (60 * (drive - st.braid) - 6 * st.braidV) * dt; st.braid += st.braidV * dt;

      // apply
      var f = placeBody(frame, flip);
      rig.position.y = y - (liftComp ? 0 : 0);
      rig.scale.set(sxk, syk, 1);
      var flipSign = flip ? -1 : 1;
      var bmU = body.material.userData.u; bmU.uBend.value = bend / Math.max(0.2, Math.abs(body.scale.x)) * (flip ? -1 : 1); bmU.uFlip.value = flipSign;
      var bp = BRAID[family] || BRAID.front; bmU.uBraid.value.set(bp[0], bp[1], bp[2], clamp(st.braid, -0.08, 0.08) / Math.max(0.2, Math.abs(body.scale.x)));
      shadow.scale.setScalar(clamp(1 - y * 0.9, 0.45, 1.1)); shadow.material.opacity = clamp(1 - y * 1.2, 0.35, 1);
      // head overlay (front art only), cross-fade between expressions
      var hasHead = !!A.headPlace[frame];
      if (hasHead) {
        if (headName !== st.shownHead) {
          if (headName === 'blink' || st.shownHead === 'blink') st.headFade = 1; else st.headFade = 0;
          st.prevHead = st.shownHead; st.shownHead = headName;
        }
        st.headFade = Math.min(1, st.headFade + dt / 0.14);
        placeHead(headA, frame, st.shownHead, false, headDy);
        // follow the body's bend at head height
        var hn = (headA.position.y - (body.position.y - body.scale.y / 2)) / body.scale.y, bx = bend * hn * hn;
        headA.position.x += bx;
        if (st.headFade < 1 && st.prevHead) { placeHead(headB, frame, st.prevHead, false, headDy); headB.position.x += bx; headB.material.opacity = 1 - st.headFade; headB.renderOrder = 3; }
        else headB.visible = false;
        headA.material.opacity = 1;
        // nod/sleepy head offsets also move the body card's head? keep body; overlay covers it.
      } else { headA.visible = false; headB.visible = false; }
      body.material.opacity = 1;
      st.lastFrame = frame; st.lastFlip = flip; st.lastHead = hasHead ? st.shownHead : null;
    }

    function setColors() { /* painted art: colours are baked. Use opts.tint for a global multiply. */ }
    function dispose() { disposables.forEach(function (d) { d.dispose && d.dispose(); }); if (group.parent) group.parent.remove(group); }

    var api = {
      group: group, rig: rig, height: HEIGHT, attach: attach, bones: { body: body, head: headA },
      update: update, setExpression: setExpression, react: react, lookAt: lookAt, setColors: setColors, dispose: dispose,
      get expression() { return st.temp || (st.base === 'neutral' && st.idle > sleepAfter ? 'sleepy' : st.base); },
      get isReacting() { return !!st.reaction; },
      get ready() { return ready; },
      get debug() { return { frame: st.lastFrame, flip: st.lastFlip, head: st.lastHead, view: st.view }; },
      EXPRESSIONS: EXPRESSIONS.slice(), REACTIONS: Object.keys(REACTIONS)
    };
    group.userData.ghalia = api;
    // initial frame so it renders correctly before the first update
    placeBody('front_idle', false); placeHead(headA, 'front_idle', 'neutral', false, 0); headB.visible = false;
    return api;
  }
  return { createGhalia: createGhalia, EXPRESSIONS: EXPRESSIONS, REACTIONS: Object.keys(REACTIONS), version: '2.0.0-sprite' };
});
