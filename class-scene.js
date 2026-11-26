/* GhaliaClassScene — «صف غالية» 2.5D illustrated classroom (painted plate + depth parallax + shader animation + floating board letters).
   Load: lib/three.min.js → lib/fx/* → scene-kit.js → class-art.js → class-scene.js   (optional: GhaliaSceneKit.loadFonts('fonts/') first)
   Events: 'start-class-game' (glowing desk) · 'board' · 'letter' {char} · 'star' · 'tap' {name} · 'variant'                      */
(function (root) {
  'use strict';
  var R = function (id, type, rect, o) { var r = { id: id, type: type, rect: rect }; for (var k in o) r[k] = o[k]; return r; };
  var V = {
    '16x9': {
      horizon: .5, k: 1.66,
      floor: { far: [.30, .80, .80], near: [.18, .88, .99] }, spawn: [.25, .2],
      regions: [
        R('star', 'glow', [.515, .07, .60, .20], { gain: 1.7, thresh: .5, breathe: .22, breatheFreq: 2.2 }),
        R('deskGlow', 'glow', [.39, .55, .63, .66], { gain: 1.2, thresh: .62, breathe: .25, breatheFreq: 2.6 }),
        R('deskTint', 'tint', [.38, .47, .66, .72], { color: 0xffa848, gain: .08, breathe: .6, breatheFreq: 2.6, pulseGain: .5 }),
        R('hangL', 'sway', [.21, .09, .29, .30], { amp: .03, freq: .9, feather: .015 }),
        R('hangR', 'sway', [.83, .11, .91, .335], { amp: .03, freq: .8, phase: 1.5, feather: .015 }),
        R('plantL', 'sway', [.145, .19, .27, .55], { amp: .015, freq: .7, anchor: 'bottom', feather: .02 }),
        R('plantR', 'sway', [.845, .28, .97, .55], { amp: .015, freq: .75, anchor: 'bottom', phase: 2, feather: .02 }),
        R('frontL', 'sway', [0, .66, .11, 1], { amp: .02, freq: .6, anchor: 'bottom', feather: .015 }),
        R('frontR', 'sway', [.9, .66, 1, 1], { amp: .02, freq: .65, anchor: 'bottom', phase: 1, feather: .015 }),
        R('window', 'glow', [0, 0, .15, .62], { gain: 1.18, thresh: .8 })
      ],
      hits: [
        { name: 'ghalia-desk', rect: [.39, .54, .63, .84], spot: [.2, .05] }, { name: 'board', rect: [.37, .21, .74, .54], spot: [0, 0] },
        { name: 'star-sign', rect: [.51, .06, .61, .21], spot: [0, 0] }, { name: 'plant', rect: [.21, .09, .29, .30], id: 'hangL' },
        { name: 'plant', rect: [.83, .11, .91, .335], id: 'hangR' }, { name: 'plant', rect: [.145, .19, .27, .55], id: 'plantL' }, { name: 'plant', rect: [.845, .28, .97, .55], id: 'plantR' }
      ],
      board: [.385, .23, .725, .515], desk: [.51, .60], star: [.558, .135],
      shafts: [{ from: [.07, .18], to: [.42, .92], w0: 1.6, w1: 5.0, opacity: .14 }, { from: [.12, .38], to: [.55, .98], w0: 1.0, w1: 3.2, opacity: .08 }],
      motes: [{ rect: [.05, .15, .5, .85], n: 100, lift: .6, depth: 1.8 }, { rect: [.42, .4, .62, .6], n: 40, lift: .5, depth: .4, rise: .25, color: 0xffd27a, size: .09 }]
    },
    '9x16': {
      horizon: .44, k: 1.4,
      floor: { far: [.25, .80, .56], near: [0, 1, .86] }, spawn: [.25, .2],
      regions: [
        R('star', 'glow', [.51, .255, .595, .305], { gain: 1.7, thresh: .5, breathe: .22, breatheFreq: 2.2 }),
        R('deskGlow', 'glow', [.39, .435, .62, .47], { gain: 1.2, thresh: .62, breathe: .25, breatheFreq: 2.6 }),
        R('deskTint', 'tint', [.37, .41, .64, .52], { color: 0xffa848, gain: .08, breathe: .6, breatheFreq: 2.6, pulseGain: .5 }),
        R('hangL', 'sway', [.205, .26, .285, .345], { amp: .03, freq: .9, feather: .01 }),
        R('hangR', 'sway', [.83, .27, .92, .36], { amp: .03, freq: .8, phase: 1.5, feather: .01 }),
        R('plantL', 'sway', [.14, .34, .26, .43], { amp: .015, freq: .7, anchor: 'bottom', feather: .01 }),
        R('plantR', 'sway', [.84, .33, .97, .44], { amp: .015, freq: .75, anchor: 'bottom', phase: 2, feather: .01 }),
        R('frontL', 'sway', [0, .48, .09, .60], { amp: .02, freq: .6, anchor: 'bottom', feather: .01 }),
        R('frontR', 'sway', [.92, .48, 1, .60], { amp: .02, freq: .65, anchor: 'bottom', phase: 1, feather: .01 }),
        R('window', 'glow', [0, .17, .15, .46], { gain: 1.18, thresh: .8 })
      ],
      hits: [
        { name: 'ghalia-desk', rect: [.38, .43, .63, .54], spot: [.25, .02] }, { name: 'board', rect: [.36, .305, .745, .425], spot: [0, 0] },
        { name: 'star-sign', rect: [.50, .25, .61, .31], spot: [0, 0] }, { name: 'plant', rect: [.205, .26, .285, .345], id: 'hangL' },
        { name: 'plant', rect: [.83, .27, .92, .36], id: 'hangR' }
      ],
      board: [.37, .312, .735, .418], desk: [.505, .45], star: [.552, .28],
      shafts: [{ from: [.05, .26], to: [.42, .66], w0: 1.4, w1: 4.0, opacity: .14 }],
      motes: [{ rect: [0, .2, .45, .7], n: 80, lift: .6, depth: 1.8 }, { rect: [.42, .38, .6, .46], n: 30, lift: .5, depth: .4, rise: .25, color: 0xffd27a, size: .09 }]
    }
  };
  var handlers = {
    'ghalia-desk': function (c) { if (c.busyDesk) return; c.busyDesk = true; c.stage.kick('deskTint'); c.stage.kick('deskGlow'); var d = c.stage.cfg.desk; c.api.starBurst({ u: d[0], v: d[1] }, 90); c.later(.45, function () { c.busyDesk = false; c.emit('start-class-game', { desk: 'ghalia' }); }); },
    board: function (c) { if (c.letters) c.letters.dance(); c.emit('board', {}); },
    'star-sign': function (c) { c.stage.kick('star'); var s = c.stage.cfg.star; c.api.starBurst({ u: s[0], v: s[1] }, 60); c.emit('star', {}); },
    plant: function (c, h) { c.stage.kick(h.id); }
  };
  var LCOL = ['#ff6fae', '#a66bff', '#36cfc4', '#ffa53b', '#ffd84a', '#ff7bd5', '#6fa8ff', '#ff8a5c', '#9be15d', '#c78bff'];
  var SLOTS = [[.12, .25], [.42, .18], [.82, .22], [.24, .66], [.55, .72], [.40, .45], [.70, .52], [.08, .78], [.9, .75], [.62, .2]];
  function letterTex(K, T, ch, col, flat) {
    return K.canvasTexture(T, 256, 256, function (x, w) {
      var ar = /[\u0600-\u06FF]/.test(ch); x.font = ar ? '200px GhaliaArabic, Tajawal, sans-serif' : '900 200px GhaliaLetters, "Arial Black", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; var yy = ar ? 150 : 138;
      x.lineJoin = 'round'; x.lineWidth = 12;
      if (flat) { x.fillStyle = x.strokeStyle = '#fff'; x.strokeText(ch, w / 2, yy); x.fillText(ch, w / 2, yy); return; }
      var g = x.createLinearGradient(0, 40, 0, 220); g.addColorStop(0, '#ffffff'); g.addColorStop(.2, col); g.addColorStop(1, col); x.fillStyle = g; x.strokeStyle = col; x.strokeText(ch, w / 2, yy); x.fillText(ch, w / 2, yy);
      x.globalCompositeOperation = 'source-atop'; var hl = x.createLinearGradient(0, 40, 0, 150); hl.addColorStop(0, 'rgba(255,255,255,.6)'); hl.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = hl; x.fillRect(0, 0, w, 150);
    });
  }
  function starTex(K, T, col) { return K.canvasTexture(T, 128, 128, function (x, w) { var p = K.starPath(54, .5); x.fillStyle = col; x.beginPath(); p.forEach(function (q, i) { i ? x.lineTo(64 + q[0], 64 - q[1]) : x.moveTo(64 + q[0], 64 - q[1]); }); x.closePath(); x.lineJoin = 'round'; x.lineWidth = 10; x.strokeStyle = col; x.stroke(); x.fill(); }); }
  function extras(c, cfg) {
    var T = c.THREE, K = c.K, st = c.stage, b = cfg.board, chars = c.api.letters || ['F', 'B', 'D', 'W', 'S', 'A', 'C', 'أ', 'ب', 'ت'];
    var g = new T.Group(); c.dyn.add(g); var items = [];
    var bc = st.uvToWorld((b[0] + b[2]) / 2, (b[1] + b[3]) / 2, .35), tl = st.uvToWorld(b[0], b[1], .35), br = st.uvToWorld(b[2], b[3], .35);
    var bw = br.x - tl.x, bh = tl.y - br.y, size = bh * .27;
    chars.forEach(function (ch, i) {
      var col = LCOL[i % LCOL.length], cc = new T.Color(col), s = SLOTS[i % SLOTS.length], lg = new T.Group();
      lg.position.set(tl.x + s[0] * bw, tl.y - s[1] * bh, bc.z + .05 * (i % 3)); g.add(lg);
      var sz = size * (.85 + (i % 3) * .12), plane = new T.PlaneGeometry(sz, sz), flat = letterTex(K, T, ch, col, true), n = c.LOW ? 3 : 6;
      for (var k = n; k >= 1; k--) { var m = new T.Mesh(plane, new T.MeshBasicMaterial({ map: flat, color: cc.clone().multiplyScalar(.38 + .05 * (n - k)), transparent: true, depthTest: true, depthWrite: false })); m.position.set(k * .006 * sz, -k * .01 * sz, -k * .01); m.renderOrder = 3; lg.add(m); }
      var front = new T.Mesh(plane, new T.MeshBasicMaterial({ map: letterTex(K, T, ch, col, false), transparent: true, depthTest: true, depthWrite: false, color: new T.Color(1.15, 1.15, 1.15), toneMapped: false })); front.renderOrder = 4; lg.add(front);
      var halo = new T.Mesh(new T.PlaneGeometry(sz * 1.9, sz * 1.9), K.additive(T, K.radialTexture(T, 'rgba(255,255,255,.45)', 'rgba(0,0,0,0)'), cc.clone(), .3)); halo.material.depthTest = true; halo.renderOrder = 2; lg.add(halo);
      var hit = new T.Mesh(new T.PlaneGeometry(sz, sz), new T.MeshBasicMaterial({ visible: false })); lg.add(hit);
      lg.rotation.z = (i % 2 ? 1 : -1) * (.08 + (i % 4) * .04);
      var L = { g: lg, base: lg.position.clone(), rz: lg.rotation.z, ph: i * 1.37, spin: -1, ch: ch }; items.push(L);
      c.api.interactables.push({ object: lg, name: 'letter:' + ch, spot: { x: 0, z: 0 }, onTap: function () { L.spin = 0; c.emit('tap', { name: 'letter:' + ch }); c.emit('letter', { char: ch }); } });
    });
    [[.3, .1, '#ffd84a'], [.95, .45, '#ff8fbf'], [.02, .45, '#ffb34a'], [.75, .88, '#ffffff'], [.5, .92, '#ffe27a'], [.18, .95, '#b48cff']].forEach(function (d, i) {
      var m = new T.Mesh(new T.PlaneGeometry(size * .45, size * .45), new T.MeshBasicMaterial({ map: starTex(K, T, d[2]), transparent: true, depthTest: true, depthWrite: false, color: new T.Color(1.3, 1.3, 1.3), toneMapped: false }));
      m.position.set(tl.x + d[0] * bw, tl.y - d[1] * bh, bc.z + .02); m.renderOrder = 4; g.add(m); items.push({ star: m, by: m.position.y, ph: i * 2.1 });
    });
    var dance = 0;
    c.letters = { dance: function () { dance = 1.6; } };
    return {
      update: function (dt, t) {
        dance = Math.max(0, dance - dt);
        items.forEach(function (L, i) {
          if (L.star) { L.star.position.y = L.by + Math.sin(t * 2 + L.ph) * size * .08; L.star.rotation.z = Math.sin(t * 1.4 + L.ph) * .4; return; }
          var bob = Math.sin(t * 1.6 + L.ph) * size * .12, sway = Math.sin(t * 1.1 + L.ph) * size * .08, d = dance > 0 ? Math.sin((1.6 - dance) * 10 + i) * size * .22 * Math.min(1, dance) : 0;
          L.g.position.set(L.base.x + sway, L.base.y + bob + Math.abs(d), L.base.z);
          var spinA = 0; if (L.spin >= 0) { L.spin += dt; spinA = K.easeOutBack(Math.min(1, L.spin / .7)) * Math.PI * 2; if (L.spin > .9) L.spin = -1; }
          L.g.rotation.set(0, Math.sin(t * .7 + L.ph) * .35 + spinA, L.rz + Math.sin(t * 1.3 + L.ph) * .06 + d * .8);
          L.g.scale.setScalar(1 + (L.spin >= 0 ? Math.sin(Math.min(1, L.spin / .9) * Math.PI) * .3 : 0));
        });
      }
    };
  }
  function build(THREE, scene, opts) {
    var K = root.GhaliaSceneKit; if (!K || !K.illustratedScene) throw new Error('GhaliaClassScene needs scene-kit.js');
    var art = (opts && opts.art) || (root.GhaliaArt && root.GhaliaArt['class']); if (!art) throw new Error('GhaliaClassScene needs class-art.js (or opts.art)');
    var api = K.illustratedScene(THREE, scene, opts, { name: 'class', art: art, variants: V, handlers: handlers, extras: extras, bg: 0x2a1626, burstAt: [.5, .6] });
    if (opts && opts.letters) api.letters = opts.letters;
    api.desk = 'ghalia-desk';
    return api;
  }
  var mod = { build: build, name: 'class', variants: V };
  root.GhaliaClassScene = mod;
  if (typeof module !== 'undefined' && module.exports) module.exports = mod;
})(typeof window !== 'undefined' ? window : globalThis);
