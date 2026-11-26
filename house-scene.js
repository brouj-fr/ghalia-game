/* GhaliaHouseScene — «بيت أحلام غالية» 2.5D illustrated bedroom (painted plate + MiDaS depth parallax + shader animation).
   Load: lib/three.min.js → lib/fx/* → scene-kit.js → house-art.js → house-scene.js
   build(THREE, scene, opts) -> api (see README.md). Events: 'dressing-room' · 'look' · 'lights' {on} · 'tap' {name} · 'variant'   */
(function (root) {
  'use strict';
  var R = function (id, type, rect, o) { var r = { id: id, type: type, rect: rect }; for (var k in o) r[k] = o[k]; return r; };
  var V = {
    '16x9': {
      horizon: .42, k: 1.49,
      floor: { far: [.27, .88, .745], near: [.2, 1.0, .975] }, spawn: [0, .55],
      obstacles: [{ minX: -1, maxX: -.78, minZ: 0, maxZ: 1 }],
      regions: [
        R('canopy', 'sway', [.535, .085, .72, .70], { amp: .012, freq: 1.1, feather: .03 }),
        R('curtainL', 'sway', [.13, 0, .235, .58], { amp: .02, freq: .9, feather: .025 }),
        R('curtainR', 'sway', [.395, 0, .47, .58], { amp: .02, freq: .8, phase: 2, feather: .025 }),
        R('dresses', 'sway', [.85, .255, .955, .575], { amp: .006, freq: 1.6, feather: .02, boost: 9 }),
        R('plant', 'sway', [.935, .34, 1.0, .66], { amp: .02, freq: 1.0, anchor: 'bottom', feather: .02 }),
        R('fairy', 'glow', [.43, 0, 1.0, .175], { gain: 1.9, thresh: .6, twinkle: 26, lights: true, off: .4, feather: .02 }),
        R('fairyL', 'glow', [0, .2, .16, .45], { gain: 1.5, thresh: .66, twinkle: 30, lights: true, off: .4 }),
        R('heart', 'glow', [.74, .17, .81, .30], { gain: 1.6, thresh: .42, breathe: .14, lights: true, off: .4 }),
        R('bulbs', 'glow', [.745, .31, .832, .535], { gain: 1.7, thresh: .7, lights: true, off: .45 }),
        R('sun', 'glow', [.17, .30, .27, .52], { gain: 1.2, thresh: .78, breathe: .05 }),
        R('wardrobeGlow', 'tint', [.83, .10, .995, .70], { color: 0xffc9a0, gain: 0, pulseGain: .35 }),
        R('mirrorGlow', 'tint', [.74, .28, .84, .56], { color: 0xffe0b0, gain: 0, pulseGain: .5 }),
        R('unicorn', 'squash', [.893, .58, .978, .765], { feather: .008 }),
        R('teddy', 'squash', [.79, .60, .862, .73], { feather: .006 })
      ],
      hits: [
        { name: 'wardrobe', rect: [.83, .1, .995, .70], spot: [.8, .05] }, { name: 'mirror', rect: [.74, .30, .84, .56], spot: [.45, .02] },
        { name: 'neon-heart', rect: [.74, .16, .815, .30] }, { name: 'lights', rect: [.43, 0, 1, .16] },
        { name: 'bed', rect: [.41, .08, .72, .73], spot: [0, .02] }, { name: 'window', rect: [.165, .05, .42, .56] },
        { name: 'unicorn', rect: [.893, .6, .978, .765], spot: [.85, .2] }, { name: 'teddy', rect: [.79, .62, .862, .73], spot: [.65, .05] }
      ],
      shafts: [{ from: [.21, .40], to: [.40, .95], w0: 1.6, w1: 4.2, opacity: .16 }, { from: [.30, .30], to: [.62, .92], w0: 1.0, w1: 3.0, opacity: .09 }],
      motes: [{ rect: [.17, .25, .55, .9], n: 110, lift: .6, depth: 1.8 }],
      heartAt: [.775, .235], burstAt: [.5, .6]
    },
    '9x16': {
      horizon: .42, k: 1.35,
      floor: { far: [.22, .95, .535], near: [0, 1, .80] }, spawn: [0, .3],
      regions: [
        R('canopy', 'sway', [.45, .205, .70, .49], { amp: .012, freq: 1.1, feather: .03 }),
        R('curtainL', 'sway', [0, .17, .055, .43], { amp: .02, freq: .9, feather: .015 }),
        R('curtainR', 'sway', [.27, .19, .365, .43], { amp: .02, freq: .8, phase: 2, feather: .02 }),
        R('dresses', 'sway', [.87, .31, 1.0, .45], { amp: .006, freq: 1.6, feather: .015, boost: 9 }),
        R('fairy', 'glow', [.28, .19, 1.0, .27], { gain: 1.9, thresh: .6, twinkle: 30, lights: true, off: .4, feather: .015 }),
        R('heart', 'glow', [.735, .265, .815, .33], { gain: 1.6, thresh: .42, breathe: .14, lights: true, off: .4 }),
        R('bulbs', 'glow', [.74, .33, .84, .43], { gain: 1.7, thresh: .7, lights: true, off: .45 }),
        R('sun', 'glow', [0, .33, .06, .42], { gain: 1.35, thresh: .78, breathe: .05 }),
        R('wardrobeGlow', 'tint', [.84, .23, 1, .50], { color: 0xffc9a0, gain: 0, pulseGain: .35 }),
        R('mirrorGlow', 'tint', [.73, .32, .85, .45], { color: 0xffe0b0, gain: 0, pulseGain: .5 }),
        R('unicorn', 'squash', [.94, .45, 1, .53], { feather: .005 }),
        R('teddy', 'squash', [.81, .455, .88, .515], { feather: .005 })
      ],
      hits: [
        { name: 'wardrobe', rect: [.84, .23, 1, .50], spot: [.85, .05] }, { name: 'mirror', rect: [.73, .32, .85, .45], spot: [.5, .02] },
        { name: 'neon-heart', rect: [.73, .26, .82, .33] }, { name: 'lights', rect: [.28, .18, 1, .26] },
        { name: 'bed', rect: [.28, .21, .70, .52], spot: [-.1, .02] }, { name: 'window', rect: [0, .2, .29, .44] },
        { name: 'unicorn', rect: [.94, .45, 1, .53], spot: [.9, .1] }, { name: 'teddy', rect: [.80, .45, .88, .52], spot: [.7, .05] }
      ],
      shafts: [{ from: [.03, .37], to: [.35, .72], w0: 1.4, w1: 3.6, opacity: .15 }],
      motes: [{ rect: [0, .25, .45, .75], n: 90, lift: .6, depth: 1.8 }],
      heartAt: [.775, .30], burstAt: [.5, .55]
    }
  };
  var handlers = {
    wardrobe: function (c) { c.stage.kick('dresses'); c.stage.kick('wardrobeGlow'); c.api.starBurst({ u: c.stage.cfg.hits[0].rect[0] + .07, v: .35 }, 40); c.later(.7, function () { c.emit('dressing-room', { from: 'wardrobe' }); }); },
    mirror: function (c) { c.stage.kick('bulbs', 'flicker'); c.stage.kick('mirrorGlow'); c.later(.9, function () { c.emit('look', { from: 'vanity' }); }); },
    'neon-heart': function (c) { c.stage.kick('heart'); var h = c.stage.cfg.heartAt; c.api.starBurst({ u: h[0], v: h[1] }, 30); },
    lights: function (c) { c.api.setLights(c.stage.lightsTarget < .5); },
    bed: function (c) { c.stage.kick('canopy'); },
    window: function (c) { c.stage.kick('curtainL'); c.stage.kick('curtainR'); },
    unicorn: function (c) { c.stage.kick('unicorn'); }, teddy: function (c) { c.stage.kick('teddy'); }
  };
  function extras(c, cfg) {
    var T = c.THREE, h = cfg.heartAt, hp = c.stage.uvToWorld(h[0], h[1], .3);
    var halo = c.K.glowSprite(T, 0xff4fa3, 2.6, .35); halo.position.copy(hp); c.dyn.add(halo);
    return { update: function (dt, t) { var r = c.stage.regions.heart; halo.material.opacity = (.25 + .08 * Math.sin(t * 2.4) + (r ? r.pulse * .5 : 0)) * (.3 + .7 * c.stage.lights); } };
  }
  function build(THREE, scene, opts) {
    var K = root.GhaliaSceneKit; if (!K || !K.illustratedScene) throw new Error('GhaliaHouseScene needs scene-kit.js');
    var art = (opts && opts.art) || (root.GhaliaArt && root.GhaliaArt.house); if (!art) throw new Error('GhaliaHouseScene needs house-art.js (or opts.art)');
    return K.illustratedScene(THREE, scene, opts, { name: 'house', art: art, variants: V, handlers: handlers, extras: extras, bg: 0x1d0f22, burstAt: [.5, .6] });
  }
  var mod = { build: build, name: 'house', variants: V };
  root.GhaliaHouseScene = mod;
  if (typeof module !== 'undefined' && module.exports) module.exports = mod;
})(typeof window !== 'undefined' ? window : globalThis);
