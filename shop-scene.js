/* GhaliaShopScene — «متجر المدرسة» 2.5D illustrated school stationery shop (painted plate + MiDaS depth + shader life).
   Same contract as class-scene.js. Load: scene-kit.js → shop-art.js → shop-scene.js
   Events: 'open-shop' (glowing counter) · 'star' · 'candy' · 'shelf' · 'tap' {name} · 'variant'                          */
(function (root) {
  'use strict';
  var R = function (id, type, rect, o) { var r = { id: id, type: type, rect: rect }; for (var k in o) r[k] = o[k]; return r; };
  var V = {
    '16x9': {
      horizon: .5, k: 1.66,
      floor: { far: [.16, .86, .80], near: [.04, .96, .99] }, spawn: [0, .45],
      regions: [
        R('star', 'glow', [.515, .07, .605, .21], { gain: 1.8, thresh: .5, breathe: .22, breatheFreq: 2.2 }),
        R('fairy', 'glow', [.28, 0, .88, .1], { gain: 1.9, thresh: .6, twinkle: 24, lights: true, off: .4, feather: .02 }),
        R('counterTint', 'tint', [.335, .53, .725, .79], { color: 0xffa848, gain: .06, breathe: .6, breatheFreq: 2.4, pulseGain: .5 }),
        R('jar', 'squash', [.57, .38, .63, .55], { feather: .006 }),
        R('hangL', 'sway', [.21, .05, .29, .3], { amp: .03, freq: .9, feather: .015 }),
        R('hangR', 'sway', [.84, .08, .92, .3], { amp: .03, freq: .8, phase: 1.5, feather: .015 }),
        R('plantL', 'sway', [.12, .29, .27, .72], { amp: .015, freq: .7, anchor: 'bottom', feather: .02 }),
        R('plantR', 'sway', [.85, .32, .96, .72], { amp: .015, freq: .75, anchor: 'bottom', phase: 2, feather: .02 }),
        R('window', 'glow', [0, 0, .17, .56], { gain: 1.18, thresh: .8 })
      ],
      hits: [
        { name: 'counter', rect: [.335, .53, .725, .79], spot: [0, .05] }, { name: 'star-sign', rect: [.51, .06, .61, .22] },
        { name: 'jar', rect: [.565, .37, .635, .56], spot: [.15, .05] }, { name: 'shelf', rect: [.28, .14, .85, .52] },
        { name: 'plant', rect: [.21, .05, .29, .3], id: 'hangL' }, { name: 'plant', rect: [.84, .08, .92, .3], id: 'hangR' },
        { name: 'plant', rect: [.12, .29, .27, .72], id: 'plantL' }, { name: 'plant', rect: [.85, .32, .96, .72], id: 'plantR' }
      ],
      star: [.56, .14], counter: [.53, .62],
      shafts: [{ from: [.07, .2], to: [.42, .95], w0: 1.6, w1: 5.0, opacity: .14 }, { from: [.12, .4], to: [.55, .98], w0: 1.0, w1: 3.2, opacity: .08 }],
      motes: [{ rect: [.05, .15, .5, .85], n: 90, lift: .6, depth: 1.8 }, { rect: [.36, .45, .7, .62], n: 30, lift: .5, depth: .4, rise: .25, color: 0xffd27a, size: .09 }]
    },
    '9x16': {
      horizon: .44, k: 1.4,
      floor: { far: [.18, .84, .61], near: [0, 1, .86] }, spawn: [0, .3],
      regions: [
        R('star', 'glow', [.5, .23, .61, .285], { gain: 1.8, thresh: .5, breathe: .22, breatheFreq: 2.2 }),
        R('fairy', 'glow', [.17, .18, .95, .245], { gain: 1.9, thresh: .6, twinkle: 26, lights: true, off: .4, feather: .015 }),
        R('counterTint', 'tint', [.285, .49, .79, .605], { color: 0xffa848, gain: .06, breathe: .6, breatheFreq: 2.4, pulseGain: .5 }),
        R('jar', 'squash', [.62, .43, .72, .5], { feather: .005 }),
        R('plantL', 'sway', [0, .38, .1, .46], { amp: .015, freq: .7, anchor: 'bottom', feather: .01 }),
        R('window', 'glow', [0, .17, .13, .42], { gain: 1.18, thresh: .8 })
      ],
      hits: [
        { name: 'counter', rect: [.285, .49, .79, .605], spot: [0, .03] }, { name: 'star-sign', rect: [.5, .23, .61, .29] },
        { name: 'jar', rect: [.62, .43, .72, .5], spot: [.2, .03] }, { name: 'shelf', rect: [.2, .27, .9, .49] }
      ],
      star: [.555, .255], counter: [.53, .53],
      shafts: [{ from: [.04, .26], to: [.42, .66], w0: 1.4, w1: 4.0, opacity: .14 }],
      motes: [{ rect: [0, .2, .45, .7], n: 70, lift: .6, depth: 1.8 }, { rect: [.3, .45, .78, .55], n: 24, lift: .5, depth: .4, rise: .25, color: 0xffd27a, size: .09 }]
    }
  };
  var handlers = {
    counter: function (c) { if (c.busy) return; c.busy = true; c.stage.kick('counterTint'); var d = c.stage.cfg.counter; c.api.starBurst({ u: d[0], v: d[1] }, 70); c.later(.45, function () { c.busy = false; c.emit('open-shop', {}); }); },
    'star-sign': function (c) { c.stage.kick('star'); var s = c.stage.cfg.star; c.api.starBurst({ u: s[0], v: s[1] }, 50); c.emit('star', {}); },
    jar: function (c) { c.stage.kick('jar'); c.emit('candy', {}); },
    shelf: function (c) { c.emit('shelf', {}); },
    plant: function (c, h) { c.stage.kick(h.id); }
  };
  function build(THREE, scene, opts) {
    var K = root.GhaliaSceneKit; if (!K || !K.illustratedScene) throw new Error('GhaliaShopScene needs scene-kit.js');
    var art = (opts && opts.art) || (root.GhaliaArt && root.GhaliaArt.shop); if (!art) throw new Error('GhaliaShopScene needs shop-art.js');
    return K.illustratedScene(THREE, scene, opts, { name: 'shop', art: art, variants: V, handlers: handlers, bg: 0x2a1626, burstAt: [.5, .6] });
  }
  var mod = { build: build, name: 'shop', variants: V };
  root.GhaliaShopScene = mod;
  if (typeof module !== 'undefined' && module.exports) module.exports = mod;
})(typeof window !== 'undefined' ? window : globalThis);
