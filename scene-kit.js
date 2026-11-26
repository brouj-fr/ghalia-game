/* GhaliaSceneKit — shared procedural helpers for the «لعبة غالية» 3D scenes.
   three r128 (classic <script>, global THREE), fully offline. No runtime downloads.
   Load order: lib/three.min.js → lib/fx/*.js (optional, for bloom) → scene-kit.js → house-scene.js / class-scene.js */
(function (root) {
  'use strict';
  var K = {};

  /* ---------- quality ---------- */
  K.detectQuality = function () {
    try {
      var q = (location.search.match(/[?&]q=(low|high)/) || [])[1];
      if (q) return q;
    } catch (e) {}
    var ua = (navigator.userAgent || '');
    var mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (navigator.maxTouchPoints > 1 && Math.min(screen.width, screen.height) < 900);
    var small = Math.min(innerWidth, innerHeight) < 600;
    var weak = (navigator.deviceMemory && navigator.deviceMemory < 4) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4);
    return (mobile || small || weak) ? 'low' : 'high';
  };
  K.setupRenderer = function (THREE, renderer, quality) {
    var low = quality === 'low';
    renderer.setPixelRatio(Math.min(root.devicePixelRatio || 1, low ? 1.5 : 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .95;
    renderer.physicallyCorrectLights = false;
  };

  /* ---------- math / anim ---------- */
  K.damp = function (a, b, lambda, dt) { return a + (b - a) * (1 - Math.exp(-lambda * dt)); };
  K.easeOutBack = function (t) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  K.easeInOut = function (t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
  /* critically-damped-ish spring: s = {x, v}; returns new x */
  K.spring = function (s, target, k, c, dt) { var a = (target - s.x) * k - s.v * c; s.v += a * dt; s.x += s.v * dt; return s.x; };
  K.rand = function (seed) { var s = seed || 1; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };

  /* ---------- geometry ---------- */
  /* rounded box with analytic normals (smooth bevels, no seams) */
  K.roundedBox = function (THREE, w, h, d, r, s) {
    s = s || 3; r = Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4);
    var N = 2 * s + 1, g = new THREE.BoxGeometry(1, 1, 1, N, N, N);
    var pos = g.attributes.position, nor = g.attributes.normal, half = [w / 2, h / 2, d / 2];
    var v = new THREE.Vector3(), inner = [0, 0, 0], off = new THREE.Vector3();
    function remap(c, hf) {
      var k = Math.round((c + 0.5) * N), ir = hf - r;
      if (k <= s) return -ir - r * (1 - k / s);
      if (k >= N - s) return ir + r * (1 - (N - k) / s);
      return -ir + 2 * ir * ((k - s) / (N - 2 * s));
    }
    for (var i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      var u = [remap(v.x, half[0]), remap(v.y, half[1]), remap(v.z, half[2])];
      for (var a = 0; a < 3; a++) { var ir = half[a] - r; inner[a] = Math.max(-ir, Math.min(ir, u[a])); }
      off.set(u[0] - inner[0], u[1] - inner[1], u[2] - inner[2]);
      if (off.lengthSq() < 1e-12) off.set(0, 1, 0);
      off.normalize();
      pos.setXYZ(i, inner[0] + off.x * r, inner[1] + off.y * r, inner[2] + off.z * r);
      nor.setXYZ(i, off.x, off.y, off.z);
    }
    pos.needsUpdate = true; nor.needsUpdate = true; g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  };
  K.roundedRectShape = function (THREE, w, h, r) {
    var s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  };
  /* arch (rectangle with semicircle top), bottom-centre origin */
  K.archPath = function (THREE, w, h, target) {
    var s = target || new THREE.Shape(), r = w / 2, x0 = -r, yStraight = h - r;
    s.moveTo(x0, 0); s.lineTo(r, 0); s.lineTo(r, yStraight); s.absarc(0, yStraight, r, 0, Math.PI, false); s.lineTo(x0, 0);
    return s;
  };
  K.archPoints = function (w, h, n) {
    var r = w / 2, pts = [[-r, 0], [-r, h - r]];
    for (var i = 0; i <= n; i++) { var a = Math.PI - i / n * Math.PI; pts.push([Math.cos(a) * r, h - r + Math.sin(a) * r]); }
    pts.push([r, 0]); return pts;
  };
  K.heartShape = function (THREE, s) {
    var sh = new THREE.Shape(), p = K.heartPath(s, 48);
    sh.moveTo(p[0][0], p[0][1]); for (var i = 1; i < p.length; i++) sh.lineTo(p[i][0], p[i][1]);
    return sh;
  };
  K.heartPath = function (s, n) { n = n || 64; var p = []; for (var i = 0; i <= n; i++) { var t = i / n * Math.PI * 2; p.push([s * Math.pow(Math.sin(t), 3), s * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16]); } return p; };
  K.starPath = function (r, inner, rounded) { var p = []; for (var i = 0; i <= 10; i++) { var a = Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * (inner || .45) : r; p.push([Math.cos(a) * rr, Math.sin(a) * rr]); } return p; };
  K.starShape = function (THREE, r, inner) { var sh = new THREE.Shape(), p = K.starPath(r, inner); sh.moveTo(p[0][0], p[0][1]); for (var i = 1; i < p.length; i++) sh.lineTo(p[i][0], p[i][1]); return sh; };
  /* leaf: flat shape with a gentle bend, origin at stem */
  K.leafGeometry = function (THREE, len, wid, bend, seg) {
    seg = seg || 8; var sh = new THREE.Shape();
    sh.moveTo(0, 0); sh.bezierCurveTo(wid * .9, len * .2, wid * .7, len * .75, 0, len); sh.bezierCurveTo(-wid * .7, len * .75, -wid * .9, len * .2, 0, 0);
    var g = new THREE.ShapeGeometry(sh, seg), p = g.attributes.position;
    for (var i = 0; i < p.count; i++) { var x = p.getX(i), y = p.getY(i), t = y / len; p.setZ(i, (bend || .3) * len * t * t + Math.abs(x) * .25); }
    g.computeVertexNormals(); return g;
  };

  /* ---------- textures ---------- */
  K.canvasTexture = function (THREE, w, h, draw, o) {
    o = o || {}; var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h, c);
    var t = new THREE.CanvasTexture(c); if (o.srgb !== false) t.encoding = THREE.sRGBEncoding; t.anisotropy = o.aniso || 4;
    if (o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(o.repeat[0], o.repeat[1]); }
    t.userData = { canvas: c, draw: draw }; return t;
  };
  K.radialTexture = function (THREE, inner, outer, mid) {
    return K.canvasTexture(THREE, 128, 128, function (x) { var g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, inner); if (mid) g.addColorStop(.35, mid); g.addColorStop(1, outer); x.fillStyle = g; x.fillRect(0, 0, 128, 128); }, { srgb: false });
  };
  K.woodFloorTexture = function (THREE, o) {
    o = o || {}; var hue = o.hue == null ? 24 : o.hue, sat = o.sat == null ? 55 : o.sat, lit = o.light == null ? 40 : o.light, rows = o.rows || 8;
    var rnd = K.rand(o.seed || 7);
    return K.canvasTexture(THREE, 1024, 1024, function (x, w, h) {
      var ph = h / rows;
      for (var r = 0; r < rows; r++) {
        var xx = -(r % 2) * 180 - rnd() * 100;
        while (xx < w) {
          var len = 260 + rnd() * 240, l = lit - 3 + rnd() * 9;
          x.fillStyle = 'hsl(' + (hue + rnd() * 7) + ',' + (sat + rnd() * 9) + '%,' + l + '%)'; x.fillRect(xx, r * ph, len, ph);
          for (var k = 0; k < 16; k++) { x.strokeStyle = 'rgba(60,25,8,' + (0.04 + rnd() * .08) + ')'; x.lineWidth = 1 + rnd() * 2.2; x.beginPath(); var yy = r * ph + rnd() * ph; x.moveTo(xx, yy); x.bezierCurveTo(xx + len * .3, yy + 5, xx + len * .6, yy - 5, xx + len, yy + 2); x.stroke(); }
          var g = x.createLinearGradient(0, r * ph, 0, r * ph + ph); g.addColorStop(0, 'rgba(255,230,200,.10)'); g.addColorStop(1, 'rgba(0,0,0,.10)'); x.fillStyle = g; x.fillRect(xx, r * ph, len, ph);
          x.fillStyle = 'rgba(35,12,4,.6)'; x.fillRect(xx, r * ph, 3, ph); xx += len;
        }
        x.fillStyle = 'rgba(35,12,4,.65)'; x.fillRect(0, r * ph, w, 3);
      }
    }, { repeat: o.repeat || [3, 2], aniso: 8 });
  };
  K.noiseTexture = function (THREE, size, a, b) {
    return K.canvasTexture(THREE, size, size, function (x, w) { x.fillStyle = a; x.fillRect(0, 0, w, w); for (var i = 0; i < w * w / 6; i++) { x.fillStyle = b.replace('A', (Math.random() * .25).toFixed(3)); x.fillRect(Math.random() * w, Math.random() * w, 1 + Math.random() * 2, 1 + Math.random() * 2); } }, { repeat: [2, 2] });
  };

  /* ---------- materials ---------- */
  K.std = function (THREE, color, rough, metal, extra) {
    var m = new THREE.MeshStandardMaterial({ color: color, roughness: rough == null ? .6 : rough, metalness: metal || 0, envMapIntensity: .9 });
    if (extra) for (var k in extra) m[k] = extra[k];
    return m;
  };
  K.glow = function (THREE, hex, k) { return new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k || 2.4), toneMapped: false }); };
  K.additive = function (THREE, tex, color, opacity) {
    return new THREE.MeshBasicMaterial({ map: tex, color: color || 0xffffff, transparent: true, opacity: opacity == null ? 1 : opacity, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide });
  };

  /* ---------- set pieces ---------- */
  /* neon tube along a 2D path ([x,y] list) in local XY plane; group.userData.set(k) sets brightness */
  K.neon = function (THREE, path, color, radius, closed, o) {
    o = o || {}; var g = new THREE.Group(), col = new THREE.Color(color);
    var pts = path.map(function (p) { return new THREE.Vector3(p[0], p[1], 0); });
    var curve = new THREE.CatmullRomCurve3(pts, !!closed, 'centripetal');
    var core = K.glow(THREE, 0xffffff, 1); var tube = new THREE.Mesh(new THREE.TubeGeometry(curve, o.seg || 180, radius || .035, 8, !!closed), core); g.add(tube);
    var halo = new THREE.MeshBasicMaterial({ color: col.clone(), transparent: true, opacity: .5, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    var sheath = new THREE.Mesh(new THREE.TubeGeometry(curve, o.seg || 180, (radius || .035) * 2.4, 8, !!closed), halo); g.add(sheath);
    var bb = new THREE.Box3().setFromPoints(pts), sz = new THREE.Vector3(); bb.getSize(sz);
    var wash = new THREE.Mesh(new THREE.PlaneGeometry(sz.x * 2.2 + 1, sz.y * 2.2 + 1), K.additive(THREE, K.radialTexture(THREE, 'rgba(255,255,255,.55)', 'rgba(0,0,0,0)', 'rgba(255,255,255,.18)'), col.clone(), .55));
    wash.position.set((bb.min.x + bb.max.x) / 2, (bb.min.y + bb.max.y) / 2, -.03); wash.renderOrder = -1; g.add(wash);
    g.userData.set = function (k) {
      core.color.copy(col).lerp(new THREE.Color(1, 1, 1), .18).multiplyScalar(2.2 * k);
      halo.color.copy(col).multiplyScalar(1.4 * k); wash.material.opacity = .3 * Math.min(1.4, k);
    };
    g.userData.set(1); g.userData.color = col; return g;
  };
  /* fairy lights on sagging wire; update(t) twinkles; setOn(bool) */
  K.fairyLights = function (THREE, points, n, color, sag, quality) {
    var g = new THREE.Group(), cp = [];
    for (var i = 0; i < points.length - 1; i++) { var a = points[i], b = points[i + 1]; for (var k = 0; k < 14; k++) { var u = k / 14; var p = a.clone().lerp(b, u); p.y -= Math.sin(u * Math.PI) * (sag == null ? .3 : sag); cp.push(p); } }
    cp.push(points[points.length - 1].clone());
    var curve = new THREE.CatmullRomCurve3(cp);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 160, .007, 4, false), new THREE.MeshBasicMaterial({ color: 0x2a1c18 })));
    var geo = new THREE.SphereGeometry(.04, 10, 8), halo = K.radialTexture(THREE, 'rgba(255,214,150,.95)', 'rgba(255,170,80,0)', 'rgba(255,190,110,.35)');
    var bulbs = [], base = new THREE.Color(color || 0xffc982), on = 1, target = 1;
    var hmat = K.additive(THREE, halo, base, .6);
    for (var j = 0; j < n; j++) {
      var pp = curve.getPointAt((j + .5) / n), m = new THREE.MeshBasicMaterial({ color: base.clone().multiplyScalar(3), toneMapped: false });
      var bm = new THREE.Mesh(geo, m); bm.position.copy(pp); bm.position.y -= .05; g.add(bm);
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, color: base, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .6, toneMapped: false }));
      sp.scale.setScalar(quality === 'low' ? .3 : .38); sp.position.copy(bm.position); g.add(sp); bulbs.push({ m: m, s: sp, ph: Math.random() * 6.28 });
    }
    g.userData.update = function (t, dt) {
      on = K.damp(on, target, 8, dt || .016);
      for (var i = 0; i < bulbs.length; i++) { var b = bulbs[i], k = (.78 + .22 * Math.sin(t * 2.1 + b.ph)) * on; b.m.color.copy(base).multiplyScalar(.15 + 3 * k); b.s.material.opacity = .62 * k; }
    };
    g.userData.setOn = function (v) { target = v ? 1 : 0; };
    hmat.dispose(); return g;
  };
  /* potted plant (lathe pot + bent leaves) */
  K.plant = function (THREE, o) {
    o = o || {}; var g = new THREE.Group(), rnd = K.rand(o.seed || 3);
    var potCol = o.pot || 0xf0b8a8, h = o.potH || .45, r = o.potR || .22;
    var prof = [new THREE.Vector2(0, 0), new THREE.Vector2(r * .78, 0), new THREE.Vector2(r, h * .9), new THREE.Vector2(r * 1.08, h), new THREE.Vector2(r * .95, h), new THREE.Vector2(0, h * .92)];
    var pot = new THREE.Mesh(new THREE.LatheGeometry(prof, 24), K.std(THREE, potCol, .45)); pot.castShadow = true; g.add(pot);
    var leafMat = o.leafMat || K.std(THREE, o.leaf || 0x4f8a4a, .55, 0, { side: THREE.DoubleSide });
    var n = o.leaves || 12, L = o.leafLen || .6;
    var lg = K.leafGeometry(THREE, L, L * (o.leafW || .32), .5);
    for (var i = 0; i < n; i++) {
      var stem = new THREE.Group(); stem.position.y = h * .9;
      var leaf = new THREE.Mesh(lg, leafMat); leaf.castShadow = !o.noShadow;
      var tilt = .25 + rnd() * (o.spread || .9);
      leaf.rotation.x = -Math.PI / 2 + tilt + .6; stem.rotation.y = i / n * Math.PI * 2 + rnd() * .5; stem.rotation.x = tilt * .9;
      leaf.scale.setScalar(.7 + rnd() * .5); stem.add(leaf); g.add(stem);
    }
    g.userData.leafMat = leafMat; return g;
  };
  /* hanging vine plant: pot on 3 strings + drooping vines */
  K.hangingPlant = function (THREE, ropeLen, o) {
    o = o || {}; var g = new THREE.Group(), rnd = K.rand(o.seed || 11);
    var ropeMat = new THREE.MeshBasicMaterial({ color: 0x6b4a3a });
    for (var i = 0; i < 3; i++) { var a = i / 3 * Math.PI * 2, rope = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, ropeLen, 4), ropeMat); rope.position.set(Math.cos(a) * .1, -ropeLen / 2, Math.sin(a) * .1); rope.rotation.z = Math.cos(a) * .1; rope.rotation.x = -Math.sin(a) * .1; g.add(rope); }
    var potG = new THREE.Group(); potG.position.y = -ropeLen; g.add(potG);
    var prof = [new THREE.Vector2(0, -.18), new THREE.Vector2(.14, -.16), new THREE.Vector2(.2, 0), new THREE.Vector2(.21, .02), new THREE.Vector2(0, .0)];
    potG.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 20), K.std(THREE, o.pot || 0xf3d3c3, .4)));
    var leafMat = K.std(THREE, o.leaf || 0x4c8f4f, .5, 0, { side: THREE.DoubleSide }), lg = K.leafGeometry(THREE, .14, .09, .2, 4);
    var vines = o.vines || 9;
    for (var v = 0; v < vines; v++) {
      var ang = v / vines * Math.PI * 2 + rnd(), len = .5 + rnd() * .9, cnt = Math.round(len * 14);
      for (var k = 0; k < cnt; k++) {
        var t = k / cnt, lf = new THREE.Mesh(lg, leafMat), rr = .18 + t * .12;
        lf.position.set(Math.cos(ang) * rr + (rnd() - .5) * .05, .02 - t * len, Math.sin(ang) * rr + (rnd() - .5) * .05);
        lf.rotation.set(Math.PI * (.6 + rnd() * .5), ang + rnd() * 2, rnd() * 2); potG.add(lf);
      }
    }
    for (var u = 0; u < 10; u++) { var lf2 = new THREE.Mesh(lg, leafMat); lf2.position.set((rnd() - .5) * .3, .02, (rnd() - .5) * .3); lf2.rotation.set(-rnd() * 1.2, rnd() * 6, 0); lf2.scale.setScalar(1.6); potG.add(lf2); }
    g.userData.phase = rnd() * 6; return g;
  };
  /* painted sunset sky + palms backdrop (MeshBasic, unlit) */
  K.sunsetBackdrop = function (THREE, w, h, o) {
    o = o || {}; var sunX = o.sunX == null ? .42 : o.sunX, sunY = o.sunY == null ? .62 : o.sunY, rnd = K.rand(o.seed || 5);
    var tex = K.canvasTexture(THREE, 2048, 1024, function (x, W, H) {
      var g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#3a1f5c'); g.addColorStop(.28, '#8a3f84'); g.addColorStop(.48, '#e8668a'); g.addColorStop(.6, '#ffa86a'); g.addColorStop(.67, '#ffd08a'); g.addColorStop(.7, '#ffb070'); g.addColorStop(.78, '#a84a6a'); g.addColorStop(1, '#3a1a3a');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      var sx = sunX * W, sy = sunY * H, sg = x.createRadialGradient(sx, sy, 0, sx, sy, H * .6);
      sg.addColorStop(0, 'rgba(255,250,225,1)'); sg.addColorStop(.06, 'rgba(255,236,180,.95)'); sg.addColorStop(.2, 'rgba(255,190,120,.45)'); sg.addColorStop(1, 'rgba(255,140,100,0)');
      x.fillStyle = sg; x.fillRect(0, 0, W, H);
      x.fillStyle = 'rgba(255,248,230,1)'; x.beginPath(); x.arc(sx, sy, H * .045, 0, 7); x.fill();
      for (var c = 0; c < 9; c++) { var cy = H * (.2 + rnd() * .35), cx = rnd() * W; x.fillStyle = 'rgba(255,' + (150 + rnd() * 60 | 0) + ',' + (150 + rnd() * 50 | 0) + ',' + (.18 + rnd() * .2) + ')'; for (var b = 0; b < 6; b++) { x.beginPath(); x.ellipse(cx + b * 60 - 150, cy + rnd() * 10, 140 + rnd() * 120, 14 + rnd() * 10, 0, 0, 7); x.fill(); } }
      var hy = H * .72; var sea = x.createLinearGradient(0, hy, 0, H); sea.addColorStop(0, '#d9708a'); sea.addColorStop(.2, '#7a3a68'); sea.addColorStop(1, '#2a1230'); x.fillStyle = sea; x.fillRect(0, hy, W, H - hy);
      x.fillStyle = 'rgba(255,220,170,.55)'; for (var k = 0; k < 40; k++) { x.fillRect(sx - 120 + rnd() * 240 - k * 2, hy + 6 + k * 6, 40 + rnd() * 120 - k, 2); }
      x.fillStyle = '#3a1838'; x.beginPath(); x.moveTo(0, hy + 30); for (var i = 0; i <= 20; i++) x.lineTo(i / 20 * W, hy + 18 + Math.sin(i * 1.7) * 10 + rnd() * 16); x.lineTo(W, H); x.lineTo(0, H); x.fill();
      function palm(px, py, hgt, lean, col) {
        x.strokeStyle = col; x.fillStyle = col; x.lineCap = 'round';
        var tx = px + lean * hgt, ty = py - hgt; x.lineWidth = hgt * .045; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + lean * hgt * .2, py - hgt * .6, tx, ty); x.stroke();
        for (var f = 0; f < 9; f++) {
          var a = -Math.PI / 2 + (f - 4) * .42 + (rnd() - .5) * .2, L = hgt * (.42 + rnd() * .14);
          var ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * .6 + L * .35;
          x.lineWidth = hgt * .012; x.beginPath(); x.moveTo(tx, ty); x.quadraticCurveTo(tx + Math.cos(a) * L * .5, ty + Math.sin(a) * L * .6 - L * .12, ex, ey); x.stroke();
          for (var q = 1; q < 12; q++) { var u = q / 12, bx = tx + (ex - tx) * u, by = ty + (ey - ty) * u - Math.sin(u * Math.PI) * L * .12, ll = L * .16 * (1 - u * .6); x.lineWidth = hgt * .008; x.beginPath(); x.moveTo(bx, by); x.lineTo(bx + Math.cos(a + 1.9) * ll, by + Math.sin(a + 1.9) * ll + ll * .5); x.moveTo(bx, by); x.lineTo(bx + Math.cos(a - 1.9) * ll, by + Math.sin(a - 1.9) * ll + ll * .5); x.stroke(); }
        }
      }
      (o.palms || [[.12, .95, .55, .12], [.24, .9, .38, -.08], [.7, .96, .62, -.1], [.86, .92, .44, .1], [.55, .86, .26, .06]]).forEach(function (p, i) { palm(p[0] * W, p[1] * H, p[2] * H, p[3], i % 2 ? '#2e1432' : '#24102a'); });
      var hz = x.createLinearGradient(0, hy - 120, 0, hy + 60); hz.addColorStop(0, 'rgba(255,190,140,0)'); hz.addColorStop(.6, 'rgba(255,190,140,.28)'); hz.addColorStop(1, 'rgba(255,190,140,0)'); x.fillStyle = hz; x.fillRect(0, hy - 120, W, 180);
    }, { aniso: 4 });
    var m = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: new THREE.Color(1, 1, 1).multiplyScalar(o.bright || 1.12), fog: false });
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    var sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.radialTexture(THREE, 'rgba(255,245,215,1)', 'rgba(255,150,80,0)', 'rgba(255,200,130,.5)'), color: new THREE.Color(2.2, 1.8, 1.2), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false }));
    sun.position.set((sunX - .5) * w, (.5 - sunY) * h, .05); sun.scale.setScalar(h * .32); mesh.add(sun);
    mesh.userData.sun = sun; return mesh;
  };
  /* volumetric-looking light shaft: from a window quad (4 pts) along dir to the floor */
  K.lightShaft = function (THREE, quad, dir, color, strength) {
    var far = quad.map(function (p) { var t = p.y / Math.max(.05, -dir.y); return p.clone().addScaledVector(dir, t * .98); });
    var P = [], C = [], c0 = new THREE.Color(color).multiplyScalar(strength || .1), c1 = new THREE.Color(0, 0, 0);
    function push(v, c) { P.push(v.x, v.y, v.z); C.push(c.r, c.g, c.b); }
    for (var i = 0; i < 4; i++) { var j = (i + 1) % 4; push(quad[i], c0); push(quad[j], c0); push(far[j], c1); push(quad[i], c0); push(far[j], c1); push(far[i], c1); }
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    var m = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false, fog: false });
    var mesh = new THREE.Mesh(g, m); mesh.renderOrder = 5; return mesh;
  };
  /* floating dust motes inside a box */
  K.dustMotes = function (THREE, box, n, color) {
    var geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), seed = [];
    for (var i = 0; i < n; i++) { pos[i * 3] = box.min.x + Math.random() * (box.max.x - box.min.x); pos[i * 3 + 1] = box.min.y + Math.random() * (box.max.y - box.min.y); pos[i * 3 + 2] = box.min.z + Math.random() * (box.max.z - box.min.z); seed.push(Math.random() * 6.28); }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var m = new THREE.PointsMaterial({ size: .045, map: K.radialTexture(THREE, 'rgba(255,240,210,1)', 'rgba(255,200,140,0)'), color: color || 0xffd8a8, transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    var pts = new THREE.Points(geo, m);
    pts.userData.update = function (t, dt) { for (var i = 0; i < n; i++) { var s = seed[i]; pos[i * 3] += Math.sin(t * .3 + s) * dt * .05; pos[i * 3 + 1] += Math.cos(t * .23 + s * 2) * dt * .04 + dt * .01; if (pos[i * 3 + 1] > box.max.y) pos[i * 3 + 1] = box.min.y; } geo.attributes.position.needsUpdate = true; m.opacity = .55 + .2 * Math.sin(t * .7); };
    return pts;
  };
  /* framed picture on wall */
  K.frame = function (THREE, w, h, draw, frameCol) {
    var g = new THREE.Group();
    var fr = new THREE.Mesh(K.roundedBox(THREE, w, h, .06, .02, 2), K.std(THREE, frameCol || 0xf5e2c8, .45)); g.add(fr);
    var art = new THREE.Mesh(new THREE.PlaneGeometry(w * .84, h * .84), new THREE.MeshStandardMaterial({ map: K.canvasTexture(THREE, 256, Math.round(256 * h / w), draw), roughness: .7 }));
    art.position.z = .032; g.add(art); return g;
  };

  /* ---------- environment ---------- */
  K.envMap = function (THREE, renderer, o) {
    o = o || {}; var s = new THREE.Scene();
    var tex = K.canvasTexture(THREE, 512, 256, function (x) {
      var g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, o.top || '#3a1e4a'); g.addColorStop(.42, '#a05a86'); g.addColorStop(.5, '#ffa86c'); g.addColorStop(.56, '#ffdc98'); g.addColorStop(.64, '#8a4a62'); g.addColorStop(1, '#2a1630');
      x.fillStyle = g; x.fillRect(0, 0, 512, 256); x.fillStyle = '#fff1d8'; x.fillRect(60, 80, 70, 70); x.fillStyle = '#ff7ab0'; x.fillRect(330, 90, 80, 14); x.fillStyle = '#ffe0b0'; x.fillRect(190, 40, 130, 16);
    });
    s.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide })));
    var pm = new THREE.PMREMGenerator(renderer), rt = pm.fromScene(s, .04); pm.dispose(); tex.dispose();
    return rt.texture;
  };

  /* ---------- post FX: bloom + vignette + grain + warm grade ---------- */
  var FinalShader = {
    uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uVignette: { value: .38 }, uGrain: { value: .045 }, uRes: { value: new (root.THREE ? root.THREE.Vector2 : Object)(1, 1) } },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: [
      'uniform sampler2D tDiffuse;uniform float uTime,uVignette,uGrain;uniform vec2 uRes;varying vec2 vUv;',
      'vec3 toSRGB(vec3 c){return mix(c*12.92,1.055*pow(c,vec3(1.0/2.4))-0.055,step(0.0031308,c));}',
      'float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}',
      'void main(){vec4 c=texture2D(tDiffuse,vUv);vec3 col=clamp(c.rgb,0.0,1.0);',
      ' float l=dot(col,vec3(.2126,.7152,.0722));col=mix(col,col*vec3(1.04,.98,1.03),.6);col+=vec3(.025,.0,.03)*(1.0-l);',  // warm highlights, plum shadows
      ' col=toSRGB(col);vec2 d=vUv-.5;d.x*=uRes.x/uRes.y*.75+.25;float v=smoothstep(.95,.18,length(d));col*=mix(1.0-uVignette,1.0,v);col=mix(col,col*vec3(.78,.62,.86),(1.0-v)*.35);',
      ' float n=h(vUv*uRes+fract(uTime*7.3)*91.0)-.5;col+=n*uGrain*(1.0-l*.5);gl_FragColor=vec4(col,1.0);}'
    ].join('\n')
  };
  K.createPostFX = function (THREE, renderer, scene, camera, o) {
    o = o || {}; var q = o.quality || 'high', api = { quality: q, enabled: true };
    var hasFX = !!(THREE.EffectComposer && THREE.RenderPass && THREE.UnrealBloomPass && THREE.ShaderPass);
    var size = new THREE.Vector2(); renderer.getSize(size);
    if (!hasFX) { console.warn('[GhaliaSceneKit] fx addons missing — rendering without bloom'); }
    else {
      var gl2 = renderer.capabilities.isWebGL2, hf = gl2 && (renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float'));
      var rto = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, type: hf ? THREE.HalfFloatType : THREE.UnsignedByteType };
      var rt = (gl2 && q === 'high' && THREE.WebGLMultisampleRenderTarget) ? new THREE.WebGLMultisampleRenderTarget(size.x, size.y, rto) : new THREE.WebGLRenderTarget(size.x, size.y, rto);
      var comp = new THREE.EffectComposer(renderer, rt); comp.setPixelRatio(renderer.getPixelRatio()); comp.setSize(size.x, size.y);
      api.renderPass = new THREE.RenderPass(scene, camera); comp.addPass(api.renderPass);
      var bres = q === 'low' ? new THREE.Vector2(size.x / 2, size.y / 2) : size.clone();
      api.bloom = new THREE.UnrealBloomPass(bres, o.bloom == null ? (q === 'low' ? .7 : .8) : o.bloom, o.radius == null ? .6 : o.radius, o.threshold == null ? .82 : o.threshold);
      comp.addPass(api.bloom);
      var fs = { uniforms: THREE.UniformsUtils.clone(FinalShader.uniforms), vertexShader: FinalShader.vertexShader, fragmentShader: FinalShader.fragmentShader };
      fs.uniforms.uRes.value = new THREE.Vector2(size.x * renderer.getPixelRatio(), size.y * renderer.getPixelRatio());
      api.final = new THREE.ShaderPass(fs); api.final.uniforms.uVignette.value = o.vignette == null ? .4 : o.vignette; api.final.uniforms.uGrain.value = o.grain == null ? .05 : o.grain;
      comp.addPass(api.final); api.composer = comp;
    }
    var t = 0;
    api.render = function (dt) {
      t += dt || .016;
      if (api.composer && api.enabled) { api.renderPass.scene = scene; api.renderPass.camera = camera; api.final.uniforms.uTime.value = t; api.composer.render(dt); }
      else renderer.render(scene, camera);
    };
    api.setSize = function (w, h) { if (!api.composer) return; api.composer.setPixelRatio(renderer.getPixelRatio()); api.composer.setSize(w, h); api.final.uniforms.uRes.value.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio()); if (q === 'low') api.bloom.setSize(w / 2, h / 2); };
    api.dispose = function () { if (!api.composer) return; api.composer.renderTarget1.dispose(); api.composer.renderTarget2.dispose(); if (api.bloom.dispose) api.bloom.dispose(); };
    return api;
  };

  /* ---------- effects: 3D star burst + coin rain ---------- */
  K.starBurst = function (THREE, parent, quality) {
    var N = quality === 'low' ? 90 : 180, geo = new THREE.BufferGeometry(), pos = new Float32Array(N * 3), col = new Float32Array(N * 3), vel = [], life = new Float32Array(N);
    for (var i = 0; i < N; i++) { vel.push(new THREE.Vector3()); life[i] = 0; pos[i * 3 + 1] = -999; }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    var tex = K.canvasTexture(THREE, 64, 64, function (x) { var g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); x.fillStyle = '#fff'; x.beginPath(); for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 9 : 28; x.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); } x.fill(); }, { srgb: false });
    var m = new THREE.PointsMaterial({ size: .26, map: tex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    var pts = new THREE.Points(geo, m); pts.frustumCulled = false; pts.renderOrder = 10; parent.add(pts);
    var cols = [[2.6, 2.1, .6], [2.6, .8, 1.5], [.7, 2.3, 2.4], [1.6, 1.0, 2.6], [2.4, 2.4, 2.2]], next = 0;
    return {
      object: pts,
      fire: function (p, n) { n = Math.min(N, n || 60); for (var k = 0; k < n; k++) { var i = next; next = (next + 1) % N; pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z; var th = Math.random() * 6.283, ph = Math.acos(Math.random() * 2 - 1), s = 1.4 + Math.random() * 2.6; vel[i].set(Math.sin(ph) * Math.cos(th) * s, Math.abs(Math.cos(ph)) * s + 1.2, Math.sin(ph) * Math.sin(th) * s); var c = cols[k % 5]; col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2]; life[i] = 1.6 + Math.random() * .6; } geo.attributes.color.needsUpdate = true; },
      update: function (dt) { for (var i = 0; i < N; i++) { if (life[i] <= 0) continue; life[i] -= dt; var v = vel[i]; v.y -= 3.2 * dt; v.multiplyScalar(1 - 1.2 * dt); pos[i * 3] += v.x * dt; pos[i * 3 + 1] += v.y * dt; pos[i * 3 + 2] += v.z * dt; var f = Math.max(0, Math.min(1, life[i] / .6)); col[i * 3] *= f < 1 ? .96 : 1; col[i * 3 + 1] *= f < 1 ? .96 : 1; col[i * 3 + 2] *= f < 1 ? .96 : 1; if (life[i] <= 0) pos[i * 3 + 1] = -999; } geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true; },
      dispose: function () { parent.remove(pts); geo.dispose(); m.dispose(); tex.dispose(); }
    };
  };
  K.coinRain = function (THREE, parent, quality) {
    var N = quality === 'low' ? 30 : 60;
    var geo = new THREE.CylinderGeometry(.11, .11, .025, 24); geo.rotateX(Math.PI / 2);
    var face = K.canvasTexture(THREE, 128, 128, function (x) { var g = x.createRadialGradient(54, 50, 6, 64, 64, 64); g.addColorStop(0, '#fff3b0'); g.addColorStop(.6, '#f7c843'); g.addColorStop(1, '#c98a12'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); x.strokeStyle = '#b87810'; x.lineWidth = 7; x.beginPath(); x.arc(64, 64, 50, 0, 7); x.stroke(); x.fillStyle = '#b87810'; x.beginPath(); var p = K.starPath(28, .45); x.moveTo(64 + p[0][0], 64 - p[0][1]); for (var i = 1; i < p.length; i++) x.lineTo(64 + p[i][0], 64 - p[i][1]); x.fill(); });
    var mat = new THREE.MeshStandardMaterial({ map: face, color: 0xffffff, metalness: .85, roughness: .25, emissive: 0x8a5a00, emissiveIntensity: .35, envMapIntensity: 1.4 });
    var mesh = new THREE.InstancedMesh(geo, mat, N); mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.frustumCulled = false; mesh.castShadow = quality !== 'low'; parent.add(mesh);
    var C = [], dummy = new THREE.Object3D(), floorY = 0;
    for (var i = 0; i < N; i++) { C.push({ p: new THREE.Vector3(0, -99, 0), v: new THREE.Vector3(), r: new THREE.Euler(), w: new THREE.Vector3(), life: 0 }); dummy.position.set(0, -99, 0); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); }
    var next = 0;
    return {
      object: mesh,
      fire: function (center, n, spread) { n = Math.min(N, n || 30); spread = spread || 2.2; floorY = center.floorY || 0; for (var k = 0; k < n; k++) { var c = C[next]; next = (next + 1) % N; c.p.set(center.x + (Math.random() - .5) * spread * 2, (center.y || 4) + Math.random() * 2.5, center.z + (Math.random() - .5) * spread); c.v.set((Math.random() - .5) * .6, -1 - Math.random() * 1.5, (Math.random() - .5) * .6); c.r.set(Math.random() * 6, Math.random() * 6, 0); c.w.set(4 + Math.random() * 6, 2 + Math.random() * 4, 0); c.life = 3.2 + Math.random(); c.bounced = 0; } },
      update: function (dt) {
        for (var i = 0; i < N; i++) { var c = C[i]; if (c.life <= 0) continue; c.life -= dt; c.v.y -= 9.8 * dt; c.p.addScaledVector(c.v, dt);
          if (c.p.y < floorY + .02) { c.p.y = floorY + .02; if (c.bounced < 2) { c.v.y = Math.abs(c.v.y) * .35; c.bounced++; c.w.multiplyScalar(.5); } else { c.v.set(0, 0, 0); c.w.multiplyScalar(.9); c.r.x = K.damp(c.r.x, Math.PI / 2, 6, dt); } }
          c.r.x += c.w.x * dt; c.r.y += c.w.y * dt; var s = Math.min(1, c.life / .5);
          dummy.position.copy(c.p); dummy.rotation.copy(c.r); dummy.scale.setScalar(s); if (c.life <= 0) dummy.position.y = -99; dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); }
        mesh.instanceMatrix.needsUpdate = true;
      },
      dispose: function () { parent.remove(mesh); geo.dispose(); mat.dispose(); face.dispose(); }
    };
  };

  /* ---------- interaction helpers ---------- */
  K.pick = function (raycaster, interactables) {
    var objs = interactables.map(function (e) { return e.object; });
    var hits = raycaster.intersectObjects(objs, true);
    for (var h = 0; h < hits.length; h++) { var o = hits[h].object; while (o) { for (var i = 0; i < interactables.length; i++) if (interactables[i].object === o) return { entry: interactables[i], point: hits[h].point, hit: hits[h] }; o = o.parent; } }
    return null;
  };
  K.emitter = function () {
    var L = {};
    return { on: function (t, f) { (L[t] = L[t] || []).push(f); return function () { L[t] = (L[t] || []).filter(function (x) { return x !== f; }); }; },
      emit: function (t, d) { (L[t] || []).concat(L['*'] || []).forEach(function (f) { try { f(d, t); } catch (e) { console.error(e); } }); } };
  };
  K.disposeObject = function (obj) {
    var seen = new Set();
    obj.traverse(function (o) {
      if (o.geometry && !seen.has(o.geometry)) { seen.add(o.geometry); o.geometry.dispose(); }
      var ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      ms.forEach(function (m) { if (seen.has(m)) return; seen.add(m); for (var k in m) { var v = m[k]; if (v && v.isTexture && !seen.has(v)) { seen.add(v); v.dispose(); } } m.dispose(); });
      if (o.isLight && o.shadow && o.shadow.map) o.shadow.map.dispose();
    });
  };
  K.loadFonts = function (base) {
    if (!root.FontFace || !document.fonts) return Promise.resolve();
    base = base || '';
    var list = [['GhaliaLetters', 'cairo-latin-900-normal.woff2', '900'], ['GhaliaArabic', 'lalezar-arabic-400-normal.woff2', '400']];
    return Promise.all(list.map(function (f) { var ff = new FontFace(f[0], 'url(' + base + f[1] + ')', { weight: f[2] }); return ff.load().then(function (x) { document.fonts.add(x); }).catch(function () {}); }));
  };


  /* =====================================================================================================
     2.5D ILLUSTRATED STAGE: painted plate on a depth-displaced mesh (MiDaS depth) + shader-driven regions.
     cfg (per variant): { plate, depth (data URIs or urls), horizon, k, floor:{far:[uL,uR,v], near:[uL,uR,v]},
                          regions:[{id,type:'sway'|'squash'|'glow'|'tint', rect:[u0,v0,u1,v1], ...}] }   (u,v: 0..1, v from top)
     Region params: sway {amp,freq,phase,feather}; squash {feather}; glow {gain,thresh,twinkle,lights,feather}; tint {color,gain}
     ===================================================================================================== */
  var MAXR = 16;
  var STAGE_VS = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
  var STAGE_FS = [
    '#define NR ' + MAXR,
    'uniform sampler2D map;uniform float uTime,uLights,uAspect,uExposure;uniform vec4 uRect[NR];uniform vec4 uP[NR];uniform vec4 uC[NR];uniform vec4 uX[NR];varying vec2 vUv;',
    'float softR(vec2 p,vec4 r,float f){vec2 a=smoothstep(r.xy,r.xy+f,p)*(1.0-smoothstep(r.zw-f,r.zw,p));return a.x*a.y;}',
    'float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'void main(){vec2 uv=vUv;',
    ' for(int i=0;i<NR;i++){vec4 r=uRect[i];vec4 P=uP[i];if(P.x<0.5)continue;',
    '  if(P.x<1.5){float f=uX[i].x;float m=softR(vUv,r,f);if(m>0.0){float t=clamp((r.w-vUv.y)/(r.w-r.y),0.0,1.0);if(uX[i].w>0.5)t=1.0-t;uv.x+=P.y*sin(uTime*P.z+t*3.0+P.w+vUv.x*4.0)*pow(t,1.4)*m*(r.z-r.x);}}',
    '  else if(P.x<2.5){float m=softR(vUv,r,uX[i].x);if(m>0.0){vec2 b=vec2((r.x+r.z)*.5,r.y);vec2 sc=vec2(1.0+P.y*.12,1.0-P.y*.18);vec2 l=(vUv-b)/sc+b;uv=mix(uv,l,m);}}',
    ' }',
    ' vec3 c=texture2D(map,uv).rgb;vec3 lin=pow(c,vec3(2.2))*uExposure;float lum=dot(c,vec3(.3,.59,.11));',
    ' for(int i=0;i<NR;i++){vec4 r=uRect[i];vec4 P=uP[i];if(P.x<2.5)continue;float m=softR(vUv,r,uX[i].x);if(m<=0.0)continue;',
    '  if(P.x<3.5){float mk=smoothstep(P.z,P.z+.18,lum)*m;float k=P.y;if(P.w>0.0){vec2 cell=floor(vUv*vec2(uAspect,1.0)*P.w);float h=h21(cell);k*=.6+.55*(.5+.5*sin(uTime*(1.4+h*2.6)+h*40.0));}',
    '   k=mix(k,k*uX[i].z,uX[i].y*(1.0-uLights));lin*=1.0+mk*(k-1.0);}',
    '  else {vec2 ce=vec2((r.x+r.z)*.5,(r.y+r.w)*.5),hs=vec2(r.z-r.x,r.w-r.y)*.5;vec2 d=(vUv-ce)/hs;float g=exp(-2.5*dot(d,d));lin+=uC[i].rgb*g*P.y;}',
    ' }',
    ' gl_FragColor=linearToOutputTexel(vec4(lin,1.0));}'
  ].join('\n');

  K.loadImage = function (src) { return new Promise(function (res, rej) { var im = new Image(); im.onload = function () { res(im); }; im.onerror = function (e) { rej(new Error('image load failed')); }; im.src = src; }); };

  /* createStage(THREE, parent, variants, opts) -> stage api (async ready). variants: { '16x9': cfg, '9x16': cfg } */
  K.createStage = function (THREE, parent, variants, opts) {
    opts = opts || {};
    var D0 = 20, HP = 10, DZ = opts.depthScale || 2.6, OVER = opts.overscan || .05;
    var group = new THREE.Group(); group.name = 'GhaliaStage'; parent.add(group);
    var st = { group: group, D0: D0, HP: HP, variant: null, cfg: null, ready: false, regions: {}, time: 0, lights: 1, lightsTarget: 1, listeners: [] };
    var uniforms = { map: { value: null }, uTime: { value: 0 }, uLights: { value: 1 }, uAspect: { value: 16 / 9 }, uExposure: { value: opts.exposure || 1 },
      uRect: { value: [] }, uP: { value: [] }, uC: { value: [] }, uX: { value: [] } };
    for (var i = 0; i < MAXR; i++) { uniforms.uRect.value.push(new THREE.Vector4()); uniforms.uP.value.push(new THREE.Vector4()); uniforms.uC.value.push(new THREE.Vector4()); uniforms.uX.value.push(new THREE.Vector4(.02, 0, 1, 0)); }
    var mat = new THREE.ShaderMaterial({ uniforms: uniforms, vertexShader: STAGE_VS, fragmentShader: STAGE_FS, depthWrite: true });
    st.material = mat; var mesh = null, depthData = null, dW = 0, dH = 0, cache = {};
    function depthAt(u, v) { if (!depthData) return 0; var x = Math.max(0, Math.min(dW - 1.001, u * (dW - 1))), y = Math.max(0, Math.min(dH - 1.001, v * (dH - 1))); var x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0; function g(a, b) { return depthData[(b * dW + a) * 4] / 255; } return (g(x0, y0) * (1 - fx) + g(x0 + 1, y0) * fx) * (1 - fy) + (g(x0, y0 + 1) * (1 - fx) + g(x0 + 1, y0 + 1) * fx) * fy; }
    st.depthAt = depthAt;
    /* plate (u,v) -> world point on the displaced surface (projectively compensated: identical image from base camera) */
    st.uvToWorld = function (u, v, lift, out) { out = out || new THREE.Vector3(); var W = HP * st.aspect, z = depthAt(u, v) * DZ + (lift || 0), s = (D0 - z) / D0; return out.set((u - .5) * W * s, (.5 - v) * HP * s, z); };
    st.worldScaleAt = function (u, v, lift) { return (D0 - (depthAt(u, v) * DZ + (lift || 0))) / D0; };
    function load(key) {
      if (cache[key]) return cache[key];
      var cfg = variants[key];
      cache[key] = Promise.all([K.loadImage(cfg.plate), K.loadImage(cfg.depth)]).then(function (ims) {
        var tex = new THREE.Texture(ims[0]); tex.needsUpdate = true; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.anisotropy = 4;
        var c = document.createElement('canvas'); c.width = ims[1].width; c.height = ims[1].height; var x = c.getContext('2d'); x.drawImage(ims[1], 0, 0);
        return { tex: tex, depth: x.getImageData(0, 0, c.width, c.height).data, dW: c.width, dH: c.height, aspect: ims[0].width / ims[0].height };
      });
      return cache[key];
    }
    function applyRegions(cfg) {
      st.regions = {}; var list = cfg.regions || [];
      for (var i = 0; i < MAXR; i++) {
        var r = list[i]; var R = uniforms.uRect.value[i], P = uniforms.uP.value[i], C = uniforms.uC.value[i], X = uniforms.uX.value[i];
        if (!r) { P.set(0, 0, 0, 0); continue; }
        R.set(r.rect[0], 1 - r.rect[3], r.rect[2], 1 - r.rect[1]);
        var type = { sway: 1, squash: 2, glow: 3, tint: 4 }[r.type];
        var reg = { cfg: r, i: i, type: r.type, amp: r.amp || 0, base: r.type === 'glow' ? (r.gain || 1.4) : (r.gain || 0), pulse: 0, impulse: 0, spring: { x: 0, v: 0 } };
        X.set(r.feather || .015, r.lights ? 1 : 0, r.off == null ? .25 : r.off, r.anchor === 'bottom' ? 1 : 0);
        if (type === 1) P.set(1, r.amp || .004, r.freq || 1.2, r.phase || 0);
        else if (type === 2) P.set(2, 0, 0, 0);
        else if (type === 3) P.set(3, reg.base, r.thresh == null ? .62 : r.thresh, r.twinkle || 0);
        else { var col = new THREE.Color(r.color || 0xffb050); C.set(col.r, col.g, col.b, 0); P.set(4, r.gain || .3, 0, 0); }
        st.regions[r.id || ('r' + i)] = reg;
      }
    }
    st.setVariant = function (key) {
      if (st.variant === key) return st.readyP; st.variant = key; var cfg = variants[key];
      st.readyP = load(key).then(function (a) {
        if (st.variant !== key) return st;
        st.cfg = cfg; st.aspect = a.aspect; depthData = a.depth; dW = a.dW; dH = a.dH; uniforms.map.value = a.tex; uniforms.uAspect.value = a.aspect;
        if (mesh) { group.remove(mesh); mesh.geometry.dispose(); }
        var W = HP * a.aspect, sx = a.aspect >= 1 ? 160 : 90, sy = a.aspect >= 1 ? 90 : 160, g = new THREE.PlaneGeometry(W, HP, sx, sy), p = g.attributes.position, uv = g.attributes.uv;
        for (var i = 0; i < p.count; i++) { var u = uv.getX(i), v = 1 - uv.getY(i), z = depthAt(u, v) * DZ, s = (D0 - z) / D0; p.setXYZ(i, p.getX(i) * s, p.getY(i) * s, z); }
        p.needsUpdate = true; g.computeBoundingSphere(); g.computeBoundingBox();
        mesh = new THREE.Mesh(g, mat); mesh.name = 'plate'; mesh.renderOrder = 0; group.add(mesh); st.plate = mesh;
        applyRegions(cfg); st.ready = true; st.listeners.forEach(function (f) { f(st, key); });
        return st;
      });
      return st.readyP;
    };
    st.onVariant = function (f) { st.listeners.push(f); };
    st.pickVariant = function (w, h) { return (w / h) < 1 && variants['9x16'] ? '9x16' : '16x9'; };
    /* camera: fixed distance D0, fov chosen so the plate covers the viewport (cover fit + overscan) */
    st.fitCamera = function (camera, w, h) {
      var A = w / h, visH = Math.min(HP, HP * (st.aspect || 16 / 9) / A) * (1 - OVER);
      camera.fov = 2 * Math.atan(visH / 2 / D0) * 180 / Math.PI; camera.aspect = A; camera.near = .5; camera.far = 80; camera.updateProjectionMatrix();
      st.visH = visH; return camera;
    };
    var cam = { x: 0, y: 0, tx: 0, ty: 0 };
    /* parallax: nx, ny in -1..1 (pointer / gyro); amplitude in world units; slow dolly breathing */
    st.updateCamera = function (camera, dt, nx, ny, o) {
      o = o || {}; var amp = o.amp == null ? 1.1 : o.amp, maxX = HP * (st.aspect || 1.7) * OVER * .5 * 4, t = st.time;
      cam.tx = (nx || 0) * amp + Math.sin(t * .13) * amp * .25; cam.ty = (ny || 0) * amp * .5 + Math.sin(t * .1 + 1) * amp * .12;
      cam.x = K.damp(cam.x, Math.max(-maxX, Math.min(maxX, cam.tx)), 3, dt); cam.y = K.damp(cam.y, cam.ty, 3, dt);
      var dolly = o.dolly == null ? .35 : o.dolly;
      camera.position.set(cam.x, cam.y, D0 - dolly * (.5 + .5 * Math.sin(t * .08)));
      camera.lookAt(cam.x * .25, cam.y * .25, 0);
    };
    /* floor mapping: floor coords fx -1..1 (left..right), fz 0..1 (far..near) <-> plate uv */
    st.floorToUV = function (fx, fz) { var f = st.cfg.floor, v = f.far[2] + (f.near[2] - f.far[2]) * fz, uL = f.far[0] + (f.near[0] - f.far[0]) * fz, uR = f.far[1] + (f.near[1] - f.far[1]) * fz; return [uL + (uR - uL) * (fx * .5 + .5), v]; };
    st.uvToFloor = function (u, v) { var f = st.cfg.floor, fz = (v - f.far[2]) / (f.near[2] - f.far[2]), uL = f.far[0] + (f.near[0] - f.far[0]) * fz, uR = f.far[1] + (f.near[1] - f.far[1]) * fz; return { x: ((u - uL) / (uR - uL)) * 2 - 1, z: fz }; };
    /* actor transform for a billboard standing at floor coords: feet position (world), height (world), renderOrder */
    st.actorAt = function (fx, fz, out) {
      var uv = st.floorToUV(fx, fz), c = st.cfg, pos = st.uvToWorld(uv[0], uv[1], .06, out);
      var hUV = Math.max(.02, c.k * (uv[1] - c.horizon)), s = st.worldScaleAt(uv[0], uv[1], .06);
      return { position: pos, height: hUV * HP * s, uv: uv, renderOrder: 10 + Math.round(fz * 100), speedScale: hUV / (c.k * (c.floor.near[2] - c.horizon)) };
    };
    st.uvFromHit = function (hit) { return hit && hit.uv ? [hit.uv.x, 1 - hit.uv.y] : null; };
    /* invisible tap target over a plate rect */
    st.hitPlane = function (rect, lift) {
      var u = (rect[0] + rect[2]) / 2, v = (rect[1] + rect[3]) / 2, p = st.uvToWorld(u, v, lift == null ? .2 : lift), s = st.worldScaleAt(u, v, .2), W = HP * st.aspect;
      var m = new THREE.Mesh(new THREE.PlaneGeometry((rect[2] - rect[0]) * W * s, (rect[3] - rect[1]) * HP * s), new THREE.MeshBasicMaterial({ visible: false }));
      m.position.copy(p); return m;
    };
    st.update = function (dt) {
      st.time += dt; uniforms.uTime.value = st.time; st.lights = K.damp(st.lights, st.lightsTarget, 5, dt); uniforms.uLights.value = st.lights;
      for (var id in st.regions) {
        var r = st.regions[id], P = uniforms.uP.value[r.i];
        if (r.type === 'sway') { r.impulse = Math.max(0, r.impulse - dt * (r.cfg.decay || .8)); P.y = r.amp * (1 + r.impulse * (r.cfg.boost || 6)); }
        else if (r.type === 'squash') { K.spring(r.spring, 0, 160, 7, dt); P.y = Math.max(-1.2, Math.min(1.2, r.spring.x)); }
        else if (r.type === 'glow') { r.pulse = Math.max(0, r.pulse - dt); var k = r.base; if (r.cfg.breathe) k *= 1 + r.cfg.breathe * Math.sin(st.time * (r.cfg.breatheFreq || 2.4)); if (r.flicker > 0) { r.flicker -= dt; k = (Math.sin(r.flicker * 47) + Math.sin(r.flicker * 23 + 1) > .3) ? r.base * 1.5 : .35; } else if (r.pulse > 0) k *= 1 + r.pulse * (r.cfg.pulseGain || 1.2); P.y = k; }
        else if (r.type === 'tint') { r.pulse = Math.max(0, r.pulse - dt); var g = r.cfg.gain || .3; if (r.cfg.breathe) g *= 1 + r.cfg.breathe * Math.sin(st.time * (r.cfg.breatheFreq || 2.6)); P.y = g + r.pulse * (r.cfg.pulseGain || .6); }
      }
    };
    st.kick = function (id, how) { var r = st.regions[id]; if (!r) return; if (r.type === 'sway') r.impulse = 1; else if (r.type === 'squash') r.spring.v += (how || 1) * -14; else if (how === 'flicker') r.flicker = 1.0; else r.pulse = 1; };
    st.setLights = function (on) { st.lightsTarget = on ? 1 : 0; };
    st.dispose = function () { parent.remove(group); if (mesh) mesh.geometry.dispose(); mat.dispose(); Object.keys(cache).forEach(function (k) { cache[k].then(function (a) { a.tex.dispose(); }); }); };
    return st;
  };
  /* soft additive sun shaft quad between two plate points (world), drawn in front of the plate */
  K.shaftQuad = function (THREE, a, b, widthA, widthB, color, opacity) {
    var dir = new THREE.Vector3().subVectors(b, a), n = new THREE.Vector3(-dir.y, dir.x, 0).normalize();
    var P = [], UV = [];
    [[a, widthA, 0], [b, widthB, 1]].forEach(function (q) { var c = q[0], w = q[1] / 2; P.push(c.x - n.x * w, c.y - n.y * w, c.z, c.x + n.x * w, c.y + n.y * w, c.z); UV.push(0, q[2], 1, q[2]); });
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex([0, 2, 1, 1, 2, 3]);
    var tex = K.canvasTexture(THREE, 128, 256, function (x, w, h) { var gx = x.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, 'rgba(255,255,255,0)'); gx.addColorStop(.5, 'rgba(255,255,255,1)'); gx.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gx; x.fillRect(0, 0, w, h); x.globalCompositeOperation = 'destination-in'; var gy = x.createLinearGradient(0, 0, 0, h); gy.addColorStop(0, 'rgba(0,0,0,.9)'); gy.addColorStop(.6, 'rgba(0,0,0,.35)'); gy.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gy; x.fillRect(0, 0, w, h); }, { srgb: false });
    var m = new THREE.MeshBasicMaterial({ map: tex, color: color || 0xffb070, transparent: true, opacity: opacity == null ? .12 : opacity, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide });
    var mesh = new THREE.Mesh(g, m); mesh.renderOrder = 50; mesh.userData.base = m.opacity; return mesh;
  };
  /* generic floating particles (dust / sparkles) in a world box */
  K.motes = function (THREE, box, n, color, size, rise) {
    var geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), seed = [];
    for (var i = 0; i < n; i++) { pos[i * 3] = box.min.x + Math.random() * (box.max.x - box.min.x); pos[i * 3 + 1] = box.min.y + Math.random() * (box.max.y - box.min.y); pos[i * 3 + 2] = box.min.z + Math.random() * (box.max.z - box.min.z); seed.push(Math.random() * 6.28); }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var m = new THREE.PointsMaterial({ size: size || .06, map: K.radialTexture(THREE, 'rgba(255,245,220,1)', 'rgba(255,200,140,0)'), color: color || 0xffd8a8, transparent: true, opacity: .8, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, toneMapped: false });
    var pts = new THREE.Points(geo, m); pts.renderOrder = 60; pts.frustumCulled = false;
    pts.userData.update = function (t, dt) { for (var i = 0; i < n; i++) { var s = seed[i]; pos[i * 3] += Math.sin(t * .3 + s) * dt * .12; pos[i * 3 + 1] += (Math.cos(t * .23 + s * 2) * .08 + (rise || .03)) * dt * 1.5; if (pos[i * 3 + 1] > box.max.y) pos[i * 3 + 1] = box.min.y; } geo.attributes.position.needsUpdate = true; m.opacity = .6 + .25 * Math.sin(t * .7); };
    return pts;
  };
  /* additive glow sprite */
  K.glowSprite = function (THREE, color, scale, opacity) {
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.radialTexture(THREE, 'rgba(255,255,255,1)', 'rgba(255,255,255,0)', 'rgba(255,255,255,.3)'), color: new THREE.Color(color || 0xffc070), transparent: true, opacity: opacity == null ? .6 : opacity, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    s.scale.setScalar(scale || 1); s.renderOrder = 55; return s;
  };


  /* =====================================================================================================
     illustratedScene: shared builder used by house-scene.js / class-scene.js (same API as the 3D modules).
     def = { name, art:{'16x9':{plate,depth},'9x16':{...}}, variants:{key:{horizon,k,floor,regions,hits,shafts,motes,spawn}},
             handlers:{hitName:function(ctx){...}}, extras:function(ctx){ return {update(dt), dispose()} } }
     ===================================================================================================== */
  K.illustratedScene = function (THREE, scene, opts, def) {
    opts = opts || {};
    var Q = opts.quality && opts.quality !== 'auto' ? opts.quality : K.detectQuality(), LOW = Q === 'low';
    var em = K.emitter(), emit = function (t, d) { if (opts.onEvent) try { opts.onEvent(t, d || {}); } catch (e) { console.error(e); } em.emit(t, d || {}); };
    var root = new THREE.Group(); root.name = 'Ghalia_' + def.name; (opts.parent || scene).add(root);
    var variants = {}; Object.keys(def.variants).forEach(function (k) { var v = def.variants[k], a = def.art[k]; if (!a) return; var c = {}; for (var x in v) c[x] = v[x]; c.plate = a.plate; c.depth = a.depth; variants[k] = c; });
    var stage = K.createStage(THREE, root, variants, { depthScale: opts.depthScale, exposure: opts.exposure });
    var saved = { bg: scene.background, fog: scene.fog, tm: opts.renderer ? opts.renderer.toneMapping : null };
    if (opts.atmosphere !== false) { scene.background = new THREE.Color(def.bg || 0x1d0f22); scene.fog = null; }
    if (opts.renderer) opts.renderer.toneMapping = THREE.NoToneMapping; // painted art is already graded
    var interactables = [], dyn = new THREE.Group(); root.add(dyn);
    var fxG = new THREE.Group(); fxG.scale.setScalar(3); fxG.renderOrder = 70; root.add(fxG);
    var bursts = K.starBurst(THREE, fxG, Q), coins = K.coinRain(THREE, fxG, Q);
    bursts.object.material.depthTest = false; bursts.object.material.size = .32; coins.object.renderOrder = 70;
    var timers = [], extra = null, updaters = [];
    var api = { root: root, stage: stage, quality: Q, interactables: interactables, bounds: { minX: -1, maxX: 1, minZ: 0, maxZ: 1 }, obstacles: [], on: em.on, emit: emit,
      kind: '2.5d', ready: null, floor: null };
    var ctx = { THREE: THREE, K: K, stage: stage, api: api, emit: emit, dyn: dyn, LOW: LOW, Q: Q, updaters: updaters,
      later: function (sec, f) { timers.push({ at: performance.now() + sec * 1000, f: f }); }, uv: function (u, v, lift) { return stage.uvToWorld(u, v, lift); } };
    function buildVariant(st, key) {
      // clear previous dynamic content
      while (dyn.children.length) { var c = dyn.children.pop(); K.disposeObject(c); }
      interactables.length = 0; updaters.length = 0; if (extra && extra.dispose) extra.dispose(); extra = null;
      var cfg = st.cfg; api.floor = st.plate; api.variant = key;
      (cfg.hits || []).forEach(function (h) {
        var m = st.hitPlane(h.rect, h.lift); m.name = 'hit:' + h.name; m.renderOrder = 1; dyn.add(m);
        var spotUV = h.spot ? h.spot : null;
        var entry = { object: m, name: h.name, rect: h.rect, spot: spotUV ? { x: spotUV[0], z: spotUV[1] } : null,
          onTap: function (p) { emit('tap', { name: h.name }); var f = def.handlers[h.name]; if (f) f(ctx, h, p); } };
        interactables.push(entry);
      });
      (cfg.shafts || []).forEach(function (sh) { var a = st.uvToWorld(sh.from[0], sh.from[1], .4), b = st.uvToWorld(sh.to[0], sh.to[1], .4); var q = K.shaftQuad(THREE, a, b, sh.w0, sh.w1, sh.color || 0xffb070, (sh.opacity || .14) * (LOW ? .8 : 1)); q.userData.ph = Math.random() * 6; dyn.add(q); updaters.push(function (dt, t) { q.material.opacity = q.userData.base * (.75 + .25 * Math.sin(t * .6 + q.userData.ph)) * (.5 + .5 * st.lights); }); });
      (cfg.motes || []).forEach(function (mo) { var a = st.uvToWorld(mo.rect[0], mo.rect[1], mo.lift || .5), b = st.uvToWorld(mo.rect[2], mo.rect[3], (mo.lift || .5) + (mo.depth || 1.5)); var box = new THREE.Box3(a.clone().min(b), a.clone().max(b)); var pts = K.motes(THREE, box, Math.round((mo.n || 80) * (LOW ? .5 : 1)), mo.color, mo.size || .07, mo.rise); dyn.add(pts); updaters.push(function (dt, t) { pts.userData.update(t, dt); }); });
      api.spawn = { x: (cfg.spawn || [0, .5])[0], z: (cfg.spawn || [0, .5])[1], rotationY: 0, position: st.actorAt((cfg.spawn || [0, .5])[0], (cfg.spawn || [0, .5])[1]).position };
      api.obstacles = cfg.obstacles || [];
      if (def.extras) extra = def.extras(ctx, cfg, key);
      emit('variant', { variant: key });
    }
    stage.onVariant(buildVariant);
    api.ready = stage.setVariant(opts.variant || stage.pickVariant(opts.width || innerWidth, opts.height || innerHeight)).then(function () { return api; });
    /* camera helpers */
    api.setView = function (camera, w, h) { var key = opts.variant || stage.pickVariant(w, h); var p = stage.setVariant(key); return p.then(function () { stage.fitCamera(camera, w, h); return api; }); };
    api.updateCamera = function (camera, dt, nx, ny, o) { if (stage.ready) stage.updateCamera(camera, dt, nx, ny, o); };
    api.camera = { note: 'use api.setView(camera,w,h) + api.updateCamera(camera,dt,nx,ny) each frame' };
    /* floor / actors */
    api.actorAt = function (x, z, out) { return stage.actorAt(x, z, out); };
    api.floorFromHit = function (hit) { var uv = stage.uvFromHit(hit); return uv ? stage.uvToFloor(uv[0], uv[1]) : null; };
    api.clampToWalkable = function (v) { v.x = Math.max(-1, Math.min(1, v.x)); v.z = Math.max(0, Math.min(1, v.z));
      (api.obstacles || []).forEach(function (o) { if (v.x > o.minX && v.x < o.maxX && v.z > o.minZ && v.z < o.maxZ) { var d = [v.x - o.minX, o.maxX - v.x, v.z - o.minZ, o.maxZ - v.z], m = Math.min.apply(null, d); if (m === d[0]) v.x = o.minX; else if (m === d[1]) v.x = o.maxX; else if (m === d[2]) v.z = o.minZ; else v.z = o.maxZ; } }); return v; };
    /* effects (positions: world, or plate uv via {u,v}) */
    function toFx(p) { var w = (p && p.u != null) ? stage.uvToWorld(p.u, p.v, .8) : (p || new THREE.Vector3(0, 0, 2)); return w.clone().multiplyScalar(1 / 3); }
    api.starBurst = function (p, n) { if (!stage.ready) return; bursts.fire(toFx(p || def.burstAt && { u: def.burstAt[0], v: def.burstAt[1] }), n || 80); };
    api.coinRain = function (p, n) { if (!stage.ready) return; var c = toFx(p || { u: .5, v: .02 }); c.y = Math.max(c.y, stage.HP * .45 / 3); var fl = stage.uvToWorld(.5, .9, .3); c.floorY = fl.y / 3; coins.fire(c, n || 34, 2.6); };
    api.effects = { starBurst: api.starBurst, coinRain: api.coinRain };
    api.setLights = function (on) { stage.setLights(on); emit('lights', { on: !!on }); };
    api.tap = function (name) { for (var i = 0; i < interactables.length; i++) if (interactables[i].name === name) { interactables[i].onTap(); return true; } return false; };
    api.update = function (dt) {
      dt = Math.min(dt || .016, .1); stage.update(dt); var t = stage.time;
      var nowMs = performance.now(); for (var i = timers.length - 1; i >= 0; i--) { if (nowMs >= timers[i].at) { var f = timers[i].f; timers.splice(i, 1); f(); } }
      for (var j = 0; j < updaters.length; j++) updaters[j](dt, t);
      if (extra && extra.update) extra.update(dt, t);
      bursts.update(dt); coins.update(dt);
    };
    api.dispose = function () {
      if (extra && extra.dispose) extra.dispose(); bursts.dispose(); coins.dispose(); stage.dispose(); K.disposeObject(root); (opts.parent || scene).remove(root);
      if (opts.atmosphere !== false) { scene.background = saved.bg; scene.fog = saved.fog; }
      if (opts.renderer && saved.tm != null) opts.renderer.toneMapping = saved.tm;
      interactables.length = 0; updaters.length = 0; timers.length = 0;
    };
    ctx.bursts = bursts; ctx.coins = coins;
    return api;
  };

  root.GhaliaSceneKit = K;
  if (typeof module !== 'undefined' && module.exports) module.exports = K;
})(typeof window !== 'undefined' ? window : globalThis);
