/*!
 * ghalia-character.js — Ghalia, a stylised procedural 3D girl for Three.js (r128+).
 * No external assets: hair/clothes are primitives, the face is a canvas texture
 * redrawn only when its (blended) parameters change.  Works offline.
 *
 * Usage (classic <script>, same as the game's global THREE):
 *   <script src="lib/three.min.js"></script>
 *   <script src="ghalia-character.js"></script>
 *   const g = createGhalia(THREE, { shadows: true });
 *   scene.add(g.group);
 *   // per frame (the game moves/rotates g.group itself):
 *   g.update(dt);                     // speed & turn are measured from group motion
 *   g.update(dt, { speed: 3.2 });     // or pass them explicitly (m/s, rad/s)
 *   g.setExpression('happy');  g.react('jump');  g.lookAt(vec3 | null);
 *
 * The character faces +Z (same convention as the game: rotation.y = atan2(dx, dz)),
 * feet at y = 0, height ≈ 1.62 units.  Do NOT write group.position.y for bobbing —
 * all bob / squash / spin happens on an inner node (g.rig).
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) { root.GhaliaCharacter = api; root.createGhalia = api.createGhalia; }
})(typeof self !== 'undefined' ? self : (typeof globalThis !== 'undefined' ? globalThis : this), function () {
  'use strict';

  var EXPRESSIONS = ['neutral', 'happy', 'surprised', 'thinking', 'sad', 'sleepy'];
  var REACTIONS = { wave: 1.9, jump: 1.05, spin: 1.15, cheer: 1.4, nod: 0.9 };

  // ---- face parameter sets (blended by weight) ----
  var FACE = {
    neutral:   { open: 1.0,  lower: 0.08, smile: 0.45, mouthOpen: 0.10, mouthW: 1.0, mouthX: 0, browUp: 0,    browTilt: 0,   browAsym: 0,   blush: 0.55, pupil: 1.0,  gazeX: 0,    gazeY: 0,    pout: 0, sparkle: 0, gloss: 0 },
    happy:     { open: 0.9,  lower: 0.62, smile: 1.0,  mouthOpen: 0.62, mouthW: 1.15, mouthX: 0, browUp: 0.35, browTilt: 0,   browAsym: 0,   blush: 1.0,  pupil: 1.0,  gazeX: 0,    gazeY: 0,    pout: 0, sparkle: 0.6, gloss: 0 },
    surprised: { open: 1.22, lower: 0.0,  smile: 0.25, mouthOpen: 0.95, mouthW: 0.55, mouthX: 0, browUp: 1.0,  browTilt: 0.1, browAsym: 0,   blush: 0.85, pupil: 0.82, gazeX: 0,    gazeY: 0,    pout: 0, sparkle: 1.0, gloss: 0 },
    thinking:  { open: 0.82, lower: 0.18, smile: 0.0,  mouthOpen: 0.0,  mouthW: 0.55, mouthX: 0.35, browUp: 0.25, browTilt: 0, browAsym: 0.9, blush: 0.45, pupil: 1.0,  gazeX: 0.65, gazeY: 0.75, pout: 0.3, sparkle: 0, gloss: 0 },
    sad:       { open: 0.78, lower: 0.15, smile: -0.85, mouthOpen: 0.06, mouthW: 0.72, mouthX: 0, browUp: 0.15, browTilt: 1.0, browAsym: 0,   blush: 0.35, pupil: 1.08, gazeX: 0,    gazeY: -0.45, pout: 1, sparkle: 0, gloss: 1 },
    sleepy:    { open: 0.3,  lower: 0.12, smile: 0.12, mouthOpen: 0.0,  mouthW: 0.5,  mouthX: 0, browUp: -0.25, browTilt: 0.35, browAsym: 0, blush: 0.65, pupil: 1.0,  gazeX: 0,    gazeY: -0.3, pout: 0, sparkle: 0, gloss: 0 }
  };
  var FACE_KEYS = Object.keys(FACE.neutral);

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function damp(a, b, rate, dt) { return a + (b - a) * (1 - Math.exp(-rate * dt)); }
  function smooth(e0, e1, x) { var t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }
  function bell(t, a, b) { return smooth(0, a, t) * (1 - smooth(b, 1, t)); } // ramp in to a, out after b
  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function createGhalia(THREE, opts) {
    opts = opts || {};
    var C = Object.assign({
      skin: 0xe9b48e, hair: 0x1f1512, shirt: 0x9fc4ee, shirtTrim: 0x24345e, dress: 0x1d2b55,
      socks: 0xf6f6f8, shoes: 0xff6fae, soles: 0xffffff, hairTie: 0x7cb8ff, iris: '#6b3f22'
    }, opts.colors || {});
    var style = opts.style || 'soft';         // 'soft' (PBR + rim) or 'toon'
    var shadows = opts.shadows !== false;
    var faceRes = opts.faceResolution || 512;
    var sleepAfter = opts.sleepAfter != null ? opts.sleepAfter : 18;   // seconds of idle → sleepy
    var autoGlance = opts.autoGlance !== false;
    var scale = opts.scale || 1;
    var rimColor = new THREE.Color(opts.rimColor != null ? opts.rimColor : 0xffc2dc);
    var rimStrength = opts.rimStrength != null ? opts.rimStrength : 0.25;
    // r128 has no colour management: with renderer.outputEncoding = sRGBEncoding (what the game uses)
    // hex colours must be linearised or navy turns lavender. Auto-off when ColorManagement is enabled.
    var linearize = opts.linearizeColors != null ? opts.linearizeColors : !(THREE.ColorManagement && THREE.ColorManagement.enabled);
    function col(hex) { var c = new THREE.Color(hex); if (linearize && c.convertSRGBToLinear) c.convertSRGBToLinear(); return c; }
    rimColor = col(rimColor.getHex());

    var disposables = [];
    function track(o) { disposables.push(o); return o; }

    // ---------- materials ----------
    var toonGrad = null;
    if (style === 'toon') {
      var gd = new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
      toonGrad = track(new THREE.DataTexture(gd, 3, 1, THREE.RGBAFormat));
      toonGrad.minFilter = toonGrad.magFilter = THREE.NearestFilter; toonGrad.needsUpdate = true;
    }
    function addRim(m, strength) {
      if (!strength) return m;
      m.onBeforeCompile = function (sh) {
        sh.uniforms.uRimColor = { value: rimColor };
        sh.uniforms.uRimStr = { value: strength };
        sh.fragmentShader = 'uniform vec3 uRimColor;\nuniform float uRimStr;\n' + sh.fragmentShader.replace(
          '#include <dithering_fragment>',
          'float ghRim = 1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0);\n' +
          'gl_FragColor.rgb += uRimColor * pow(ghRim, 2.6) * uRimStr;\n#include <dithering_fragment>');
      };
      m.customProgramCacheKey = function () { return 'ghaliaRim' + strength; };
      return m;
    }
    function mat(hex, rough, extra) {
      var m;
      if (style === 'toon') m = new THREE.MeshToonMaterial(Object.assign({ color: col(hex), gradientMap: toonGrad }, extra || {}));
      else m = new THREE.MeshStandardMaterial(Object.assign({ color: col(hex), roughness: rough != null ? rough : 0.7, metalness: 0 }, extra || {}));
      return track(addRim(m, rimStrength));
    }
    var M = {
      skin: mat(C.skin, 0.55, { emissive: col(C.skin).multiplyScalar(0.1) }),
      hair: mat(C.hair, 0.42),
      hairHi: mat(0x3a2a24, 0.35),
      shirt: mat(C.shirt, 0.75),
      trim: mat(C.shirtTrim, 0.7),
      dress: mat(C.dress, 0.82),
      pocket: mat(new THREE.Color(C.dress).offsetHSL(0, 0, 0.05).getHex(), 0.85),
      socks: mat(C.socks, 0.9),
      shoes: mat(C.shoes, 0.5),
      soles: mat(C.soles, 0.6),
      tie: mat(C.hairTie, 0.4),
      button: mat(0xffffff, 0.3)
    };
    M.dress.side = THREE.DoubleSide;

    var geoCache = {};
    function G(key, make) { if (!geoCache[key]) geoCache[key] = track(make()); return geoCache[key]; }
    function sphere(r, w, h) { return G('s' + r + ':' + (w || 18) + ':' + (h || 14), function () { return new THREE.SphereGeometry(r, w || 18, h || 14); }); }
    function cyl(rt, rb, h, s) { return G('c' + rt + ':' + rb + ':' + h + ':' + (s || 14), function () { return new THREE.CylinderGeometry(rt, rb, h, s || 14); }); }
    function mesh(geo, m, parent, x, y, z) {
      var o = new THREE.Mesh(geo, m);
      o.position.set(x || 0, y || 0, z || 0);
      o.castShadow = shadows;
      if (parent) parent.add(o);
      return o;
    }
    function node(parent, x, y, z) { var g = new THREE.Group(); g.position.set(x || 0, y || 0, z || 0); if (parent) parent.add(g); return g; }

    // ---------- rig ----------
    var group = new THREE.Group(); group.name = 'Ghalia';
    var rig = node(group); rig.rotation.order = 'YXZ'; rig.scale.setScalar(scale);
    var hips = node(rig, 0, 0.58, 0);
    var spine = node(hips, 0, 0.22, 0);       // world y ≈ 0.80
    var neck = node(spine, 0, 0.30, 0);       // world y ≈ 1.10
    var head = node(neck, 0, 0.23, 0.01);     // head centre world y ≈ 1.33
    var HEAD_R = 0.27;

    // legs
    function buildLeg(side) {
      var thigh = node(hips, side * 0.078, 0, 0);
      mesh(cyl(0.056, 0.05, 0.25), M.skin, thigh, 0, -0.12, 0);
      var knee = node(thigh, 0, -0.24, 0);
      mesh(sphere(0.05, 12, 10), M.skin, knee);
      mesh(cyl(0.05, 0.043, 0.13), M.skin, knee, 0, -0.06, 0);
      mesh(cyl(0.05, 0.047, 0.14), M.socks, knee, 0, -0.185, 0);
      var foot = node(knee, 0, -0.26, 0);
      var shoe = mesh(sphere(0.07, 18, 12), M.shoes, foot, 0, -0.028, 0.035); shoe.scale.set(1.05, 0.72, 1.6);
      var sole = mesh(sphere(0.07, 18, 10), M.soles, foot, 0, -0.058, 0.035); sole.scale.set(1.12, 0.32, 1.7);
      var cuff = mesh(cyl(0.055, 0.06, 0.04), M.shoes, foot, 0, 0.0, -0.005);
      for (var i = 0; i < 3; i++) { var lace = mesh(G('lace', function () { return new THREE.BoxGeometry(0.05, 0.008, 0.012); }), M.soles, foot, 0, 0.012 - i * 0.008, 0.04 + i * 0.026); lace.rotation.x = 0.55; lace.castShadow = false; }
      return { thigh: thigh, knee: knee, foot: foot };
    }
    var legL = buildLeg(1), legR = buildLeg(-1);   // her left = +X

    // pinafore skirt (lathe) on hips
    var skirtPts = [[0.168, 0.27], [0.172, 0.2], [0.195, 0.09], [0.235, -0.02], [0.28, -0.11], [0.305, -0.16], [0.3, -0.172], [0.285, -0.175]]
      .map(function (p) { return new THREE.Vector2(p[0], p[1]); });
    var skirt = mesh(track(new THREE.LatheGeometry(skirtPts, 28)), M.dress, hips);
    function skirtR(y) { for (var i = 0; i < skirtPts.length - 1; i++) { var a = skirtPts[i], b = skirtPts[i + 1]; if (y <= a.y && y >= b.y) return lerp(a.x, b.x, (a.y - y) / (a.y - b.y)); } return 0.2; }
    [-1, 1].forEach(function (s) {
      var y = -0.02, r = skirtR(y);
      var pk = mesh(G('pocket', function () { return new THREE.BoxGeometry(0.1, 0.1, 0.012); }), M.pocket, skirt, s * 0.11, y, 0);
      var ang = s * 0.5; pk.position.x = Math.sin(ang) * (r + 0.004); pk.position.z = Math.cos(ang) * (r + 0.004);
      pk.rotation.y = ang; pk.rotation.x = -0.4; pk.castShadow = false;
      var top = mesh(G('pockTop', function () { return new THREE.BoxGeometry(0.104, 0.012, 0.016); }), M.trim, pk, 0, 0.05, 0.002); top.castShadow = false;
    });

    // torso (spine): shirt core, pinafore bodice, collar, buttons
    mesh(cyl(0.13, 0.148, 0.26, 18), M.shirt, spine, 0, 0.17, 0).scale.z = 0.92;
    var shoulderBall = mesh(sphere(0.16, 18, 10), M.shirt, spine, 0, 0.27, 0); shoulderBall.scale.set(1.12, 0.45, 0.88);
    var bodice = mesh(cyl(0.152, 0.172, 0.27, 20), M.dress, spine, 0, 0.135, 0); bodice.scale.set(1.04, 1, 0.95);
    mesh(cyl(0.055, 0.06, 0.1, 12), M.skin, spine, 0, 0.32, 0.0);
    var placket = mesh(G('placket', function () { return new THREE.BoxGeometry(0.05, 0.06, 0.02); }), M.shirt, spine, 0, 0.275, 0.128); placket.rotation.x = -0.25;
    [-1, 1].forEach(function (s) { // polo collar: flat rounded triangles resting on the chest
      var cg = node(spine, s * 0.045, 0.312, 0.075); cg.rotation.set(0.95, 0, s * -0.35);
      var flap = mesh(G('collar', function () { var g = new THREE.CylinderGeometry(0.058, 0.058, 0.012, 3); g.rotateY(Math.PI / 6); return g; }), M.shirt, cg, 0, 0, 0);
      flap.scale.set(1, 1, 1.2); flap.position.z = 0.01;
      var edge = mesh(G('collarEdge', function () { var g = new THREE.CylinderGeometry(0.062, 0.062, 0.008, 3); g.rotateY(Math.PI / 6); return g; }), M.trim, cg, 0, -0.006, 0.01);
      edge.scale.set(1, 1, 1.2); edge.castShadow = false;
    });
    for (var bi = 0; bi < 2; bi++) mesh(sphere(0.008, 8, 6), M.button, spine, 0, 0.29 - bi * 0.028, 0.14 - bi * 0.005).castShadow = false;
    mesh(cyl(0.17, 0.17, 0.03, 20), M.trim, spine, 0, 0.005, 0).scale.z = 0.92; // waist seam

    // arms
    function buildArm(side) {
      var sh = node(spine, side * 0.19, 0.235, 0);
      sh.rotation.order = 'ZXY';
      var puff = mesh(sphere(0.078, 14, 10), M.shirt, sh, side * 0.01, -0.035, 0); puff.scale.set(1, 1.15, 1);
      var trim1 = mesh(G('slTrim', function () { return new THREE.TorusGeometry(0.068, 0.008, 6, 16); }), M.trim, sh, side * 0.012, -0.105, 0); trim1.rotation.x = Math.PI / 2;
      mesh(cyl(0.04, 0.036, 0.16, 10), M.skin, sh, side * 0.008, -0.16, 0);
      var elbow = node(sh, side * 0.008, -0.235, 0);
      elbow.rotation.order = 'ZXY';
      mesh(sphere(0.037, 10, 8), M.skin, elbow);
      mesh(cyl(0.036, 0.032, 0.15, 10), M.skin, elbow, 0, -0.075, 0);
      var hand = node(elbow, 0, -0.17, 0.0);
      var palm = mesh(sphere(0.045, 12, 10), M.skin, hand); palm.scale.set(0.85, 1.05, 0.75);
      var thumb = mesh(sphere(0.018, 8, 6), M.skin, hand, -side * 0.03, 0.01, 0.02);
      return { shoulder: sh, elbow: elbow, hand: hand };
    }
    var armL = buildArm(1), armR = buildArm(-1);

    // head: skull, ears, nose, face decal
    var skull = mesh(sphere(HEAD_R, 32, 24), M.skin, head); skull.scale.set(1, 0.96, 0.95);
    [-1, 1].forEach(function (s) { var e = mesh(sphere(0.05, 10, 8), M.skin, head, s * 0.262, -0.03, 0.0); e.scale.set(0.5, 1, 0.8); });
    var nose = mesh(sphere(0.02, 10, 8), M.skin, head, 0, -0.035, 0.252); nose.scale.set(1.15, 0.75, 0.6); nose.castShadow = false;

    var faceCanvas = document.createElement('canvas'); faceCanvas.width = faceCanvas.height = faceRes;
    var fctx = faceCanvas.getContext('2d');
    var faceTex = track(new THREE.CanvasTexture(faceCanvas));
    if (THREE.sRGBEncoding !== undefined) faceTex.encoding = THREE.sRGBEncoding;
    faceTex.anisotropy = 4;
    var FACE_PHI = 2.1, FACE_THETA = 1.75;
    var faceGeo = track(new THREE.SphereGeometry(HEAD_R * 1.006, 32, 24, Math.PI / 2 - FACE_PHI / 2, FACE_PHI, Math.PI / 2 - FACE_THETA / 2, FACE_THETA));
    var faceMat = track(new THREE.MeshStandardMaterial({ map: faceTex, transparent: true, roughness: 0.45, metalness: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, emissive: 0xffffff, emissiveMap: faceTex, emissiveIntensity: 0.16 }));
    var face = new THREE.Mesh(faceGeo, faceMat); face.scale.set(1, 0.96, 0.95); face.renderOrder = 2; head.add(face);

    // hair
    var hairGroup = node(head);
    // two half-caps parted in the middle; tilted so the hairline curves down at the temples
    [1, -1].forEach(function (sd) {
      var hg = node(hairGroup, 0, 0.0, -0.005);
      hg.rotation.order = 'YXZ'; hg.rotation.set(0.2, sd * 0.1, -sd * 0.02);
      var half = mesh(track(new THREE.SphereGeometry(HEAD_R * 1.075, 20, 12, sd > 0 ? Math.PI / 2 : Math.PI * 1.5, Math.PI, 0, 1.17)), M.hair, hg);
      half.scale.set(1.03, 1, 1.02);
    });
    var back = mesh(track(new THREE.SphereGeometry(HEAD_R * 1.1, 28, 18, Math.PI / 2 + 0.95, Math.PI * 2 - 1.9, 0.35, 1.9)), M.hair, hairGroup, 0, -0.01, -0.012);
    back.scale.set(1.04, 1.02, 1.02);
    [-1, 1].forEach(function (s) { // face-framing wavy locks
      var lock = mesh(sphere(0.08, 12, 10), M.hair, hairGroup, s * 0.235, -0.03, 0.1);
      lock.scale.set(0.5, 1.45, 0.75); lock.rotation.z = s * 0.15;
      var wave = mesh(sphere(0.075, 12, 10), M.hair, hairGroup, s * 0.225, -0.16, 0.04); wave.scale.set(0.55, 1.15, 0.8);
    });
    var shine = mesh(track(new THREE.TorusGeometry(0.21, 0.01, 6, 28, 1.6)), M.hairHi, hairGroup, 0, 0.12, 0.0); shine.rotation.set(-1.05, 0, Math.PI / 2 - 0.8); shine.castShadow = false;

    // braid: spring chain from behind her left ear, falling in front of her left shoulder
    var braidRoot = node(head, 0.19, -0.12, -0.03);
    var braidSegs = [], BRAID_N = 7, SEG = 0.056;
    var parent = braidRoot;
    var gather = mesh(sphere(0.075, 12, 10), M.hair, braidRoot, -0.02, 0.04, 0.0); gather.scale.set(0.9, 1.1, 0.9);
    for (var i = 0; i < BRAID_N; i++) {
      var piv = node(parent, 0, i === 0 ? 0 : -SEG, 0);
      var w = 1 - i / (BRAID_N + 3);
      var lobe = mesh(sphere(0.05, 12, 9), M.hair, piv, (i % 2 ? 0.012 : -0.012) * w, -SEG * 0.5, 0);
      lobe.scale.set(1.0 * w, 0.85, 0.85 * w); lobe.rotation.z = (i % 2 ? 0.45 : -0.45);
      braidSegs.push({ node: piv, ax: 0, az: 0, vx: 0, vz: 0, restX: i === 0 ? -0.5 : (i < 3 ? 0.05 : 0.0), restZ: i === 0 ? 0.25 : (i === 1 ? 0.12 : 0) });
      parent = piv;
    }
    var tieNode = node(parent, 0, -SEG * 0.85, 0);
    var tie = mesh(G('tie', function () { return new THREE.TorusGeometry(0.03, 0.013, 8, 14); }), M.tie, tieNode); tie.rotation.x = Math.PI / 2;
    var tuft = mesh(sphere(0.04, 10, 8), M.hair, tieNode, 0, -0.045, 0); tuft.scale.set(0.9, 1.4, 0.8);

    // attachment points for accessories
    var attach = {
      head: node(head, 0, HEAD_R + 0.04, 0),
      back: node(spine, 0, 0.13, -0.17),
      handL: armL.hand, handR: armR.hand
    };

    // ---------- face drawing ----------
    var lastFaceKey = '';
    function drawFace(p) {
      var S = faceRes, c = fctx;
      c.clearRect(0, 0, S, S);
      c.lineCap = 'round'; c.lineJoin = 'round';
      // cheeks
      [-1, 1].forEach(function (s) {
        var gx = S * (0.5 + s * 0.235), gy = S * 0.665, gr = S * 0.075;
        var g = c.createRadialGradient(gx, gy, 0, gx, gy, gr);
        g.addColorStop(0, 'rgba(255,105,135,' + (0.42 * p.blush) + ')'); g.addColorStop(1, 'rgba(255,105,135,0)');
        c.fillStyle = g; c.beginPath(); c.arc(gx, gy, gr, 0, Math.PI * 2); c.fill();
      });
      // eyes
      var ey = S * 0.548, rx = S * 0.078, ry = S * 0.088 * (0.92 + 0.08 * clamp(p.open, 0, 1.25));
      [-1, 1].forEach(function (s) {
        var cx = S * (0.5 + s * 0.152);
        var open = p.open * (1 - p.blink);
        var corner = ey + ry * 0.12;
        var upPeak = lerp(ey + ry * 0.3, ey - ry * 1.08, clamp(open, 0, 1.3));
        var lowPeak = lerp(ey + ry * 1.05, ey + ry * 0.05, clamp(p.lower, 0, 1));
        var closed = (upPeak > lowPeak - ry * 0.18) || open < 0.12;
        var X0 = cx - rx * 1.12, X1 = cx + rx * 1.12;
        if (!closed) {
          c.save();
          c.beginPath(); c.ellipse(cx, ey, rx, ry * 1.08, 0, 0, Math.PI * 2); c.clip();
          c.beginPath(); c.moveTo(X0, corner); c.quadraticCurveTo(cx, 2 * upPeak - corner, X1, corner);
          c.quadraticCurveTo(cx, 2 * lowPeak - corner, X0, corner); c.closePath(); c.clip();
          c.fillStyle = '#fffaf6'; c.fillRect(cx - rx * 1.2, ey - ry * 1.3, rx * 2.4, ry * 2.6);
          var ix = cx + p.lookX * rx * 0.38 + s * -rx * 0.04, iy = ey + p.lookY * -ry * 0.32 + ry * 0.04, ir = rx * 0.8;
          var ig = c.createRadialGradient(ix, iy + ir * 0.25, ir * 0.1, ix, iy, ir);
          ig.addColorStop(0, '#a8703f'); ig.addColorStop(0.55, C.iris); ig.addColorStop(1, '#2a160d');
          c.fillStyle = ig; c.beginPath(); c.arc(ix, iy, ir, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#120a07'; c.beginPath(); c.arc(ix, iy, ir * 0.45 * p.pupil, 0, Math.PI * 2); c.fill();
          // lid shadow
          var sg = c.createLinearGradient(0, upPeak - ry * 0.1, 0, upPeak + ry * 0.45);
          sg.addColorStop(0, 'rgba(90,40,30,0.35)'); sg.addColorStop(1, 'rgba(90,40,30,0)');
          c.fillStyle = sg; c.fillRect(cx - rx * 1.3, upPeak - ry * 0.2, rx * 2.6, ry * 0.8);
          c.fillStyle = '#ffffff';
          var hs = 1 + 0.45 * p.sparkle;
          c.beginPath(); c.arc(ix - ir * 0.36, iy - ir * 0.38, ir * 0.24 * hs, 0, Math.PI * 2); c.fill();
          c.beginPath(); c.arc(ix + ir * 0.34, iy + ir * 0.32, ir * 0.11 * hs, 0, Math.PI * 2); c.fill();
          if (p.sparkle > 0.3) { c.globalAlpha = p.sparkle; c.beginPath(); c.arc(ix + ir * 0.3, iy - ir * 0.45, ir * 0.08, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; }
          if (p.gloss > 0.05) { // watery eyes
            c.fillStyle = 'rgba(200,235,255,' + (0.55 * p.gloss) + ')';
            c.beginPath(); c.ellipse(cx, lowPeak - ry * 0.12, rx * 0.75, ry * 0.12, 0, 0, Math.PI * 2); c.fill();
          }
          c.restore();
          // upper lid / lashes
          c.strokeStyle = '#1a0f0b'; c.lineWidth = S * 0.017;
          c.beginPath(); c.moveTo(X0, corner); c.quadraticCurveTo(cx, 2 * upPeak - corner, X1, corner); c.stroke();
          var outer = s > 0 ? X1 : X0; // outer lash flick
          c.lineWidth = S * 0.011; c.beginPath(); c.moveTo(outer, corner - ry * 0.05); c.lineTo(outer + s * rx * 0.28, corner - ry * 0.32); c.stroke();
          c.beginPath(); c.moveTo(outer - s * rx * 0.25, corner - ry * 0.32 * (upPeak < ey ? 1.6 : 0.5)); c.lineTo(outer + s * rx * 0.08, corner - ry * 0.62 * (upPeak < ey ? 1.2 : 0.3)); c.stroke();
          // lower lid line
          c.strokeStyle = 'rgba(120,60,45,' + (0.25 + 0.35 * p.lower) + ')'; c.lineWidth = S * 0.006;
          c.beginPath(); c.moveTo(X0 + rx * 0.25, corner + ry * 0.1); c.quadraticCurveTo(cx, 2 * lowPeak - corner + ry * 0.08, X1 - rx * 0.25, corner + ry * 0.1); c.stroke();
        } else {
          c.strokeStyle = '#1a0f0b'; c.lineWidth = S * 0.016;
          var happyArc = p.lower > 0.45;
          c.beginPath(); c.moveTo(X0, corner); c.quadraticCurveTo(cx, corner + (happyArc ? -ry * 0.9 : ry * 0.55), X1, corner); c.stroke();
          var o = s > 0 ? X1 : X0; c.lineWidth = S * 0.01;
          c.beginPath(); c.moveTo(o, corner); c.lineTo(o + s * rx * 0.25, corner + (happyArc ? ry * 0.1 : -ry * 0.15)); c.stroke();
        }
        // brow
        var by = ey - ry * 1.72 - p.browUp * S * 0.03 - (s > 0 ? p.browAsym * S * 0.028 : -p.browAsym * S * 0.006);
        var inner = cx - s * rx * 0.95, outerX = cx + s * rx * 1.05;
        var innerY = by - p.browTilt * S * 0.03 + (p.browTilt < 0 ? 0 : 0) + S * 0.008;
        var outerY = by + p.browTilt * S * 0.012 + S * 0.01;
        c.strokeStyle = '#2a1812'; c.lineWidth = S * 0.02;
        c.beginPath(); c.moveTo(inner, innerY); c.quadraticCurveTo(cx, by - S * 0.018, outerX, outerY); c.stroke();
      });
      // nose
      c.strokeStyle = 'rgba(160,85,60,0.55)'; c.lineWidth = S * 0.008;
      c.beginPath(); c.moveTo(S * 0.485, S * 0.655); c.quadraticCurveTo(S * 0.5, S * 0.668, S * 0.515, S * 0.655); c.stroke();
      // mouth
      var mx = S * (0.5 + p.mouthX * 0.06), my = S * 0.728, w = S * 0.085 * p.mouthW;
      var cornerY = my - p.smile * S * 0.022;
      var openH = p.mouthOpen * S * 0.1;
      if (openH > S * 0.006) {
        var topY = my - S * 0.004 + p.smile * S * 0.004 - (1 - p.mouthW) * openH * 0.35;
        var botY = my + openH + Math.max(0, p.smile) * S * 0.018;
        c.save();
        c.beginPath(); c.moveTo(mx - w, cornerY);
        c.bezierCurveTo(mx - w * 0.6, topY - (1 - p.mouthW) * openH * 0.25, mx + w * 0.6, topY - (1 - p.mouthW) * openH * 0.25, mx + w, cornerY);
        c.bezierCurveTo(mx + w * 0.75, botY, mx - w * 0.75, botY, mx - w, cornerY); c.closePath();
        c.fillStyle = '#6e1f2c'; c.fill(); c.clip();
        if (p.smile > 0.3) { c.fillStyle = '#ffffff'; c.fillRect(mx - w, topY - S * 0.01, w * 2, S * 0.012 + openH * 0.22); }
        c.fillStyle = '#ff8a9a'; c.beginPath(); c.ellipse(mx, botY + openH * 0.05, w * 0.6, openH * 0.42, 0, 0, Math.PI * 2); c.fill();
        c.restore();
        c.strokeStyle = '#7d2e30'; c.lineWidth = S * 0.007;
        c.beginPath(); c.moveTo(mx - w, cornerY);
        c.bezierCurveTo(mx - w * 0.6, topY - (1 - p.mouthW) * openH * 0.25, mx + w * 0.6, topY - (1 - p.mouthW) * openH * 0.25, mx + w, cornerY);
        c.bezierCurveTo(mx + w * 0.75, botY, mx - w * 0.75, botY, mx - w, cornerY); c.stroke();
      } else {
        c.strokeStyle = '#8a3536'; c.lineWidth = S * 0.011;
        c.beginPath(); c.moveTo(mx - w, cornerY); c.quadraticCurveTo(mx, my + p.smile * S * 0.022, mx + w, cornerY); c.stroke();
        if (p.smile > 0.2) { c.lineWidth = S * 0.006; [-1, 1].forEach(function (s) { c.beginPath(); c.moveTo(mx + s * w * 1.02, cornerY - S * 0.006); c.lineTo(mx + s * w * 1.12, cornerY + S * 0.004); c.stroke(); }); }
      }
      if (p.pout > 0.05) { // lower lip
        c.strokeStyle = 'rgba(200,90,100,' + (0.6 * p.pout) + ')'; c.lineWidth = S * 0.01;
        c.beginPath(); c.moveTo(mx - w * 0.45, my + S * 0.022 + openH); c.quadraticCurveTo(mx, my + S * 0.036 + openH, mx + w * 0.45, my + S * 0.022 + openH); c.stroke();
      }
      faceTex.needsUpdate = true;
    }

    // ---------- animation state ----------
    var st = {
      t: 0, phase: 0, speed: 0, run: 0, move: 0, turn: 0, idle: 0,
      blink: 0, blinkT: 2.5, blinkDur: 0, blinkAge: 99, doubleBlink: false,
      base: 'neutral', baseUntil: 0, temp: null, tempUntil: 0,
      w: { neutral: 1, happy: 0, surprised: 0, thinking: 0, sad: 0, sleepy: 0 },
      reaction: null, rt: 0,
      lookTarget: null, glance: new THREE.Vector2(0, 0), glanceT: 3, headYaw: 0, headPitch: 0, eyeX: 0, eyeY: 0,
      yawn: 0, yawnT: 6,
      prevPos: null, prevYaw: null, vel: new THREE.Vector3(), acc: new THREE.Vector3(), prevVel: new THREE.Vector3(),
      bobPrev: 0, bobVel: 0, spinVel: 0, prevSpin: 0, face: {}
    };
    FACE_KEYS.forEach(function (k) { st.face[k] = FACE.neutral[k]; });

    var tmpV = new THREE.Vector3(), tmpV2 = new THREE.Vector3(), tmpQ = new THREE.Quaternion();

    function setExpression(name, o) {
      if (!FACE[name]) { console.warn('[ghalia] unknown expression', name); return; }
      o = o || {};
      st.base = name; st.temp = null; st.idle = 0;
      st.baseUntil = o.duration ? st.t + o.duration : 0;
    }
    function react(name) {
      if (!REACTIONS[name]) { console.warn('[ghalia] unknown reaction', name); return; }
      st.reaction = name; st.rt = 0; st.idle = 0;
      st.temp = name === 'jump' ? 'surprised' : name === 'nod' ? null : 'happy';
      st.tempUntil = st.t + REACTIONS[name] + 0.4;
      if (name === 'nod') st.temp = null;
    }
    function lookAt(v) { st.lookTarget = v ? (v.isVector3 ? v.clone() : new THREE.Vector3(v.x, v.y, v.z)) : null; }

    function update(dt, input) {
      dt = clamp(dt || 0, 0, 0.05);
      input = input || {};
      st.t += dt; var t = st.t;

      // --- measure motion of the outer group ---
      group.updateWorldMatrix(true, false);
      var pos = tmpV.setFromMatrixPosition(group.matrixWorld);
      var yaw = group.rotation.y;
      if (!st.prevPos) { st.prevPos = pos.clone(); st.prevYaw = yaw; }
      var mSpeed = 0, mTurn = 0;
      if (dt > 0) {
        tmpV2.subVectors(pos, st.prevPos).divideScalar(dt); tmpV2.y = 0;
        // into group-local frame
        group.getWorldQuaternion(tmpQ).invert();
        var localVel = tmpV2.clone().applyQuaternion(tmpQ);
        st.vel.lerp(localVel, 1 - Math.exp(-12 * dt));
        mSpeed = tmpV2.length();
        var dy = yaw - st.prevYaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
        mTurn = dy / dt;
        st.acc.subVectors(st.vel, st.prevVel).divideScalar(dt);
        st.prevVel.copy(st.vel);
      }
      st.prevPos.copy(pos); st.prevYaw = yaw;
      var speed = input.speed != null ? input.speed : mSpeed;
      var turn = input.turnRate != null ? input.turnRate : mTurn;
      st.speed = damp(st.speed, speed, 10, dt);
      st.turn = damp(st.turn, clamp(turn, -8, 8), 6, dt);
      var moving = st.speed > 0.15;
      st.move = damp(st.move, moving ? 1 : 0, 8, dt);
      var runSpeed = opts.runSpeed || 3.6;
      st.run = damp(st.run, smooth(runSpeed * 0.7, runSpeed * 1.15, st.speed), 5, dt);
      if (moving || st.reaction) st.idle = 0; else st.idle += dt;

      // --- expression weights ---
      if (st.baseUntil && t > st.baseUntil) { st.base = 'neutral'; st.baseUntil = 0; }
      if (st.temp && t > st.tempUntil) st.temp = null;
      var target = st.temp || st.base;
      var sleepy = !st.temp && st.base === 'neutral' && st.idle > sleepAfter;
      if (sleepy) target = 'sleepy';
      if (!sleepy && st.base === 'sleepy' && moving) {} // manual sleepy persists
      EXPRESSIONS.forEach(function (n) { st.w[n] = damp(st.w[n], n === target ? 1 : 0, 9, dt); });
      var W = st.w, sumW = 0; EXPRESSIONS.forEach(function (n) { sumW += W[n]; });

      // blinking
      st.blinkT -= dt; st.blinkAge += dt;
      if (st.blinkT <= 0) {
        st.blinkAge = 0; st.blinkDur = W.sleepy > 0.5 ? 0.45 : 0.16;
        st.doubleBlink = Math.random() < 0.18;
        st.blinkT = (W.sleepy > 0.5 ? 1.6 : 2.2) + Math.random() * 3.2;
      }
      var b = st.blinkAge < st.blinkDur ? Math.sin(Math.PI * st.blinkAge / st.blinkDur) : 0;
      if (st.doubleBlink && st.blinkAge > st.blinkDur + 0.06 && st.blinkAge < st.blinkDur * 2 + 0.06) b = Math.sin(Math.PI * (st.blinkAge - st.blinkDur - 0.06) / st.blinkDur);
      st.blink = b;

      // yawn while sleepy
      if (W.sleepy > 0.6) { st.yawnT -= dt; if (st.yawnT < 0) { st.yawn = 0.0001; st.yawnT = 7 + Math.random() * 5; } }
      if (st.yawn > 0) { st.yawn += dt / 2.2; if (st.yawn >= 1) st.yawn = 0; }
      var yawnAmt = st.yawn > 0 ? Math.sin(Math.PI * st.yawn) : 0;

      // --- look target / glance ---
      var wantYaw = 0, wantPitch = 0;
      if (st.lookTarget) {
        head.updateWorldMatrix(true, false);
        tmpV2.copy(st.lookTarget); rig.worldToLocal(tmpV2);
        var hy = 1.33;
        wantYaw = Math.atan2(tmpV2.x, tmpV2.z);
        wantPitch = -Math.atan2(tmpV2.y - hy, Math.hypot(tmpV2.x, tmpV2.z));
        if (Math.abs(wantYaw) > 2.0) { wantYaw = 0; wantPitch = 0; }
      } else if (autoGlance && st.move < 0.5 && !st.reaction) {
        st.glanceT -= dt;
        if (st.glanceT < 0) {
          st.glanceT = 2.2 + Math.random() * 3.5;
          if (Math.random() < 0.35) st.glance.set(0, 0); else st.glance.set((Math.random() - 0.5) * 1.3, (Math.random() - 0.4) * 0.35);
        }
        wantYaw = st.glance.x; wantPitch = -st.glance.y;
      }
      if (W.sleepy > 0.5) { wantYaw *= 0.2; wantPitch *= 0.2; }
      var headYawT = clamp(wantYaw, -1.1, 1.1) * 0.62, headPitchT = clamp(wantPitch, -0.5, 0.5) * 0.6;
      st.headYaw = damp(st.headYaw, headYawT, 6, dt); st.headPitch = damp(st.headPitch, headPitchT, 6, dt);
      st.eyeX = damp(st.eyeX, clamp((wantYaw - st.headYaw) / 0.45, -1, 1), 14, dt);
      st.eyeY = damp(st.eyeY, clamp(-(wantPitch - st.headPitch) / 0.35, -1, 1), 14, dt);

      // --- face params ---
      var P = {};
      FACE_KEYS.forEach(function (k) { var v = 0; EXPRESSIONS.forEach(function (n) { v += FACE[n][k] * W[n]; }); P[k] = v / sumW; });
      P.mouthOpen = Math.max(P.mouthOpen, yawnAmt * 1.0); P.mouthW = lerp(P.mouthW, 0.6, yawnAmt); P.open = P.open * (1 - yawnAmt * 0.9);
      P.blink = st.blink;
      P.lookX = clamp(st.eyeX + P.gazeX, -1, 1); P.lookY = clamp(st.eyeY + P.gazeY, -1, 1);
      var key = FACE_KEYS.map(function (k) { return P[k].toFixed(2); }).join(',') + P.blink.toFixed(2) + P.lookX.toFixed(2) + P.lookY.toFixed(2);
      if (key !== lastFaceKey) { lastFaceKey = key; drawFace(P); }

      // --- locomotion ---
      var mv = st.move, run = st.run;
      var stride = lerp(0.42, 0.78, run);
      var freq = clamp(st.speed / (2 * stride), 0.9, 3.4);
      st.phase += Math.PI * 2 * freq * dt * (mv > 0.02 ? 1 : 0);
      var ph = st.phase, s1 = Math.sin(ph), c1 = Math.cos(ph);
      var legAmp = lerp(0.5, 0.95, run) * mv, kneeAmp = lerp(0.75, 1.45, run) * mv;
      var armAmp = lerp(0.42, 0.95, run) * mv;

      // idle layer
      var idleW = 1 - mv;
      var breathe = Math.sin(t * (W.sleepy > 0.5 ? 1.4 : 2.3));
      var shift = Math.sin(t * 0.55);
      var happyBounce = W.happy * idleW * Math.abs(Math.sin(t * 4.2)) * 0.025;

      var bob = mv * lerp(0.035, 0.085, run) * (0.5 + 0.5 * Math.cos(2 * ph)) - mv * lerp(0.0, 0.02, run);
      var rigY = bob + happyBounce;
      var lean = mv * lerp(0.06, 0.26, run) + W.sad * 0.05 * idleW;
      var roll = clamp(-st.turn * st.speed * 0.045, -0.3, 0.3) + idleW * shift * 0.025;
      var hipYaw = s1 * lerp(0.12, 0.2, run) * mv;
      var hipRoll = s1 * 0.04 * mv * (1 - run) + idleW * shift * 0.04;
      var hipX = idleW * shift * 0.012;

      // legs
      var thL = -s1 * legAmp, thR = s1 * legAmp;
      var knL = kneeAmp * Math.max(0, c1) + mv * 0.08, knR = kneeAmp * Math.max(0, -c1) + mv * 0.08;
      // idle weight shift: relax the unloaded knee
      knL += idleW * Math.max(0, -shift) * 0.16; knR += idleW * Math.max(0, shift) * 0.16;
      thL -= idleW * Math.max(0, -shift) * 0.08; thR -= idleW * Math.max(0, shift) * 0.08;
      // arms
      var shL = s1 * armAmp, shR = -s1 * armAmp;
      var shLz = 0.12 + run * 0.12, shRz = -(0.12 + run * 0.12);
      var elL = -0.15 - run * 1.0 - mv * 0.15 - Math.max(0, s1) * 0.25 * mv, elR = -0.15 - run * 1.0 - mv * 0.15 - Math.max(0, -s1) * 0.25 * mv;
      var elLz = 0, elRz = 0;
      shL += idleW * breathe * 0.02; shR += idleW * breathe * 0.02;
      var spineX = lerp(0, 0.06, run) * mv + idleW * breathe * 0.012, spineYaw = -hipYaw * 0.8, spineZ = 0;
      var headX = st.headPitch - lean * 0.6, headY = st.headYaw, headZ = -roll * 0.4;
      var crouch = 0, sx = 1, sy = 1, spin = 0, skirtFlare = 1 + run * 0.06 * mv;
      var spineScaleY = 1 + idleW * breathe * 0.012;

      // expression body poses
      // thinking: right hand to chin, head tilt
      var thk = W.thinking * idleW;
      shR = lerp(shR, -1.15, thk); shRz = lerp(shRz, 0.38, thk); elR = lerp(elR, -1.95, thk); elRz = lerp(elRz, -0.25, thk);
      shL = lerp(shL, -0.35, thk); elL = lerp(elL, -1.2, thk); shLz = lerp(shLz, -0.15, thk);
      headZ += thk * 0.16; headX -= thk * 0.06;
      // sad: slump
      var sd = W.sad;
      headX += sd * 0.28; spineX += sd * 0.08 * idleW; shL += sd * 0.1 * idleW; shR += sd * 0.1 * idleW;
      shLz = lerp(shLz, 0.03, sd * idleW); shRz = lerp(shRz, -0.03, sd * idleW);
      // surprised: arms out, lean back
      var sp = W.surprised * idleW;
      shLz += sp * 0.45; shRz -= sp * 0.45; elL -= sp * 0.5; elR -= sp * 0.5; headX -= sp * 0.12; spineX -= sp * 0.05;
      // sleepy: droop + slow nod + yawn stretch
      var sl = W.sleepy * idleW;
      var nod = Math.pow(0.5 + 0.5 * Math.sin(t * 0.9), 6);
      headX += sl * (0.12 + nod * 0.22); headZ += sl * 0.1; shLz = lerp(shLz, 0.04, sl); shRz = lerp(shRz, -0.04, sl);
      if (yawnAmt > 0) { shL -= yawnAmt * 2.3 * sl; shR -= yawnAmt * 2.3 * sl; elL -= yawnAmt * 0.6 * sl; elR -= yawnAmt * 0.6 * sl; headX -= yawnAmt * 0.35 * sl; spineX -= yawnAmt * 0.08; }
      // happy: hands clasped a little forward
      var hp = W.happy * idleW;
      shL -= hp * 0.25; shR -= hp * 0.25; elL -= hp * 0.6; elR -= hp * 0.6; shLz -= hp * 0.15; shRz += hp * 0.15; headZ += hp * Math.sin(t * 2.1) * 0.06;

      // --- reactions ---
      if (st.reaction) {
        var dur = REACTIONS[st.reaction]; st.rt += dt; var u = st.rt / dur;
        if (u >= 1) { st.reaction = null; }
        else if (st.reaction === 'wave') {
          var e = bell(u, 0.15, 0.82);
          shRz = lerp(shRz, -2.45, e); shR = lerp(shR, -0.25, e); elRz = lerp(elRz, -0.55 + Math.sin(st.rt * 15) * 0.42, e); elR = lerp(elR, -0.2, e);
          headZ += e * 0.12; spineZ += e * 0.05; rigY += e * Math.abs(Math.sin(st.rt * 7.5)) * 0.015;
        } else if (st.reaction === 'jump') {
          // 0-.2 anticipation, .2-.72 air, .72-.86 land squash, .86-1 settle
          var ant = bell(u / 0.24, 0.6, 0.85) * (u < 0.24 ? 1 : 0);
          var air = u > 0.2 && u < 0.72 ? (u - 0.2) / 0.52 : -1;
          var land = u >= 0.7 && u < 0.92 ? Math.sin(Math.PI * (u - 0.7) / 0.22) : 0;
          crouch = Math.max(ant * 0.65, land * 0.55);
          if (air >= 0) {
            rigY += 4 * air * (1 - air) * 0.62;
            var stretch = 1 - smooth(0, 0.6, air);
            sy = 1 + 0.16 * stretch; sx = 1 - 0.07 * stretch;
            var up = Math.sin(Math.PI * air);
            shLz += up * 2.2; shRz -= up * 2.2; elL -= up * 0.3; elR -= up * 0.3;
            thL = -0.55 * up; thR = -0.2 * up; knL = 1.1 * up; knR = 0.5 * up; headX -= up * 0.15;
          }
          if (ant > 0) { sy *= 1 - 0.12 * ant; sx *= 1 + 0.07 * ant; shL += ant * 0.6; shR += ant * 0.6; }
          if (land > 0) { sy *= 1 - 0.14 * land; sx *= 1 + 0.08 * land; shLz += land * 0.5; shRz -= land * 0.5; }
          if (u > 0.9) { var ov = Math.sin(Math.PI * (u - 0.9) / 0.1); sy *= 1 + 0.04 * ov; }
        } else if (st.reaction === 'spin') {
          var su = clamp((u - 0.08) / 0.84, 0, 1);
          spin = easeInOut(su) * Math.PI * 2;
          var se = bell(u, 0.15, 0.85);
          rigY += Math.sin(Math.PI * su) * 0.12;
          shLz = lerp(shLz, 1.25, se); shRz = lerp(shRz, -1.25, se); elL = lerp(elL, -0.3, se); elR = lerp(elR, -0.3, se);
          skirtFlare += se * 0.22 * Math.sin(Math.PI * su); headX -= se * 0.1;
          thL = lerp(thL, -0.4, se * 0.6); knL = lerp(knL, 1.0, se * 0.6);
        } else if (st.reaction === 'cheer') {
          var ce = bell(u, 0.12, 0.85), pump = Math.abs(Math.sin(st.rt * 9));
          shLz = lerp(shLz, 2.7, ce); shRz = lerp(shRz, -2.7, ce); elLz = lerp(0, 0.4 * pump, ce); elRz = lerp(0, -0.4 * pump, ce);
          rigY += ce * pump * 0.08; crouch = Math.max(crouch, ce * (1 - pump) * 0.25); headX -= ce * 0.15;
        } else if (st.reaction === 'nod') {
          headX += Math.sin(u * Math.PI * 4) * 0.25 * bell(u, 0.1, 0.8);
        }
      }

      // crouch (knee bend lowers hips, feet stay planted)
      if (crouch > 0) {
        var a = crouch * 0.9;
        thL -= a; thR -= a; knL += a * 2; knR += a * 2; shL += crouch * 0.4; shR += crouch * 0.4; spineX += crouch * 0.2;
        rigY -= 0.5 * (1 - Math.cos(a));
      }

      // --- apply ---
      rig.position.y = rigY; rig.rotation.x = lean; rig.rotation.z = roll; rig.rotation.y = spin;
      rig.scale.set(sx * scale, sy * scale, sx * scale);
      hips.position.x = hipX; hips.rotation.set(0, hipYaw, hipRoll);
      spine.rotation.set(spineX, spineYaw, spineZ - hipRoll * 0.7); spine.scale.y = spineScaleY;
      neck.rotation.set(headX * 0.3, headY * 0.3, headZ * 0.3);
      head.rotation.set(headX * 0.7, headY * 0.7, headZ * 0.7);
      legL.thigh.rotation.set(thL, 0, 0.03); legR.thigh.rotation.set(thR, 0, -0.03);
      legL.knee.rotation.x = knL; legR.knee.rotation.x = knR;
      var toeL = mv * Math.max(0, -s1) * 0.35 * (1 - Math.max(0, c1)), toeR = mv * Math.max(0, s1) * 0.35 * (1 - Math.max(0, -c1));
      legL.foot.rotation.x = -(thL + knL) * (rigY > 0.15 ? 0.3 : 1) + toeL * 0.5 + lean * -1 * 0; legR.foot.rotation.x = -(thR + knR) * (rigY > 0.15 ? 0.3 : 1) + toeR * 0.5;
      armL.shoulder.rotation.set(shL, 0, shLz); armR.shoulder.rotation.set(shR, 0, shRz);
      armL.elbow.rotation.set(elL, 0, elLz); armR.elbow.rotation.set(elR, 0, elRz);
      skirt.scale.set(skirtFlare, 1 - (skirtFlare - 1) * 0.4, skirtFlare);

      // --- braid secondary motion (springs) ---
      var bobAcc = (rigY - st.bobPrev) / Math.max(dt, 1e-4); var bAcc = (bobAcc - st.bobVel) / Math.max(dt, 1e-4); st.bobVel = bobAcc; st.bobPrev = rigY;
      var spinVel = (spin - st.prevSpin) / Math.max(dt, 1e-4); st.prevSpin = spin;
      var accX = clamp(st.acc.x - st.turn * st.speed, -25, 25), accZ = clamp(st.acc.z, -25, 25);
      var driveX = clamp(accZ * 0.02 + st.speed * 0.06, -0.8, 0.8);    // swing back when accelerating / moving forward
      var driveZ = clamp(-accX * 0.016 + spinVel * spinVel * 0.012, -0.9, 0.9);
      // walking shoulder sway shakes the braid laterally
      driveZ += mv * Math.sin(ph) * 0.12; driveX += mv * Math.abs(Math.cos(ph)) * 0.1 * run;
      var steps = dt > 0.02 ? 2 : 1, h = dt / steps;
      for (var sI = 0; sI < steps; sI++) {
        for (var k = 0; k < BRAID_N; k++) {
          var sg = braidSegs[k], wgt = 0.16 + k * 0.04;
          var kStiff = 70 - k * 5, kDamp = 7;
          sg.vx += (kStiff * (driveX * wgt + clamp(bAcc, -80, 80) * -0.002 * wgt - sg.ax) - kDamp * sg.vx) * h; sg.ax += sg.vx * h;
          sg.vz += (kStiff * (driveZ * wgt - sg.az) - kDamp * sg.vz) * h; sg.az += sg.vz * h;
        }
      }
      for (var j = 0; j < BRAID_N; j++) {
        var s2 = braidSegs[j];
        // gravity compensation: the braid hangs down regardless of head tilt
        var gx = j === 1 ? -(head.rotation.x + neck.rotation.x + lean) * 0.7 : 0;
        var gz = j === 1 ? -(head.rotation.z + neck.rotation.z + roll) * 0.7 : 0;
        s2.node.rotation.set(s2.restX + clamp(s2.ax, -0.4, 0.4) + gx, 0, s2.restZ + clamp(s2.az, -0.45, 0.45) + gz);
      }
    }

    function setColors(c) {
      if (c.dress != null) { M.dress.color.copy(col(c.dress)); M.pocket.color.copy(col(new THREE.Color(c.dress).offsetHSL(0, 0, 0.05).getHex())); }
      if (c.shirt != null) M.shirt.color.copy(col(c.shirt));
      if (c.shoes != null) M.shoes.color.copy(col(c.shoes));
      if (c.hairTie != null) M.tie.color.copy(col(c.hairTie));
    }
    function dispose() {
      disposables.forEach(function (d) { if (d && d.dispose) d.dispose(); });
      if (group.parent) group.parent.remove(group);
    }

    drawFace(Object.assign({}, FACE.neutral, { blink: 0, lookX: 0, lookY: 0 }));
    group.traverse(function (o) { if (o.isMesh) o.frustumCulled = true; });

    var api = {
      group: group, rig: rig, height: 1.62 * scale,
      bones: { hips: hips, spine: spine, neck: neck, head: head, armL: armL, armR: armR, legL: legL, legR: legR, braid: braidSegs.map(function (b) { return b.node; }) },
      attach: attach, materials: M, faceCanvas: faceCanvas,
      update: update, setExpression: setExpression, react: react, lookAt: lookAt, setColors: setColors, dispose: dispose,
      get expression() { return st.temp || (st.base === 'neutral' && st.idle > sleepAfter ? 'sleepy' : st.base); },
      get isReacting() { return !!st.reaction; },
      EXPRESSIONS: EXPRESSIONS.slice(), REACTIONS: Object.keys(REACTIONS)
    };
    group.userData.ghalia = api;
    return api;
  }

  return { createGhalia: createGhalia, EXPRESSIONS: EXPRESSIONS, REACTIONS: Object.keys(REACTIONS), version: '1.0.0' };
});
