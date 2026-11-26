/* GhaliaPoolScene — «عالم المسبح» 2.5D illustrated water park (painted plate + MiDaS depth + shader life).
   Same contract as shop-scene.js. Load: scene-kit.js → pool-art.js → pool-scene.js
   Events: 'slide' {id:'spiral'|'drop'|'rainbow'} · 'flamingo' · 'ball' · 'water' · 'tap' {name} · 'variant'
   cfg.slides[id] = { top:[u,v] (start of the ride), exit:[u,v] (where the slide meets the water), spot:[x,z] (deck spot below it) } */
(function (root) {
  'use strict';
  var R = function (id, type, rect, o) { var r = { id: id, type: type, rect: rect }; for (var k in o) r[k] = o[k]; return r; };
  var V = {
    '16x9': {
      horizon: .55, k: .9,
      floor: { far: [.03, .97, .915], near: [0, 1, .995] }, spawn: [0, .5],
      regions: [
        R('water', 'glow', [.02, .67, .98, .92], { gain: 1.55, thresh: .55, twinkle: 34, feather: .03 }),
        R('lights', 'glow', [.08, .12, .92, .34], { gain: 1.9, thresh: .72, twinkle: 22, lights: true, off: .5, feather: .02 }),
        R('spiralTint', 'tint', [.13, .12, .38, .68], { color: 0xff6ac8, gain: .001, pulseGain: .7 }),
        R('dropTint', 'tint', [.44, .15, .62, .68], { color: 0xffc23a, gain: .001, pulseGain: .7 }),
        R('rainbowTint', 'tint', [.61, .25, .89, .7], { color: 0x6ad8ff, gain: .001, pulseGain: .7 }),
        R('flamingo', 'squash', [.295, .66, .41, .82], { feather: .008 }),
        R('ball', 'squash', [.725, .71, .79, .82], { feather: .006 }),
        R('palmL', 'sway', [0, .06, .13, .5], { amp: .02, freq: .8, anchor: 'bottom', feather: .02 }),
        R('palmR', 'sway', [.87, .08, 1, .5], { amp: .02, freq: .7, phase: 1.7, anchor: 'bottom', feather: .02 }),
        R('palmC', 'sway', [.41, .35, .5, .5], { amp: .015, freq: .9, phase: .6, anchor: 'bottom', feather: .015 }),
        R('flagL', 'sway', [.29, .07, .34, .12], { amp: .05, freq: 3.2, feather: .006 }),
        R('flagR', 'sway', [.58, .09, .63, .14], { amp: .05, freq: 3.0, phase: 1, feather: .006 })
      ],
      hits: [
        { name: 'slide:spiral', rect: [.13, .1, .39, .69], spot: [-.55, .25] },
        { name: 'slide:drop', rect: [.44, .13, .61, .69], spot: [.05, .25] },
        { name: 'slide:rainbow', rect: [.61, .24, .9, .71], spot: [.55, .25] },
        { name: 'flamingo', rect: [.295, .66, .41, .82] }, { name: 'ball', rect: [.725, .71, .79, .82] },
        { name: 'water', rect: [.02, .68, .98, .9] }
      ],
      slides: { spiral: { top: [.29, .17], exit: [.25, .7] }, drop: { top: [.58, .2], exit: [.49, .72] }, rainbow: { top: [.63, .3], exit: [.7, .74] } },
      motes: [{ rect: [.05, .62, .95, .88], n: 60, lift: .3, depth: .8, rise: .15, color: 0xdffcff, size: .06 }]
    },
    '9x16': {
      horizon: .52, k: .67,
      floor: { far: [0, 1, .79], near: [0, 1, .975] }, spawn: [0, .5],
      regions: [
        R('water', 'glow', [0, .6, 1, .77], { gain: 1.55, thresh: .55, twinkle: 30, feather: .02 }),
        R('lights', 'glow', [.08, .27, .95, .38], { gain: 1.9, thresh: .72, twinkle: 20, lights: true, off: .5, feather: .015 }),
        R('spiralTint', 'tint', [.13, .31, .42, .6], { color: 0xff6ac8, gain: .001, pulseGain: .7 }),
        R('dropTint', 'tint', [.46, .31, .62, .6], { color: 0xffc23a, gain: .001, pulseGain: .7 }),
        R('rainbowTint', 'tint', [.6, .34, .98, .6], { color: 0x6ad8ff, gain: .001, pulseGain: .7 }),
        R('flamingo', 'squash', [.11, .6, .28, .68], { feather: .006 }),
        R('ball', 'squash', [.05, .7, .23, .79], { feather: .006 }),
        R('palmL', 'sway', [0, .26, .16, .5], { amp: .02, freq: .8, anchor: 'bottom', feather: .015 }),
        R('palmR', 'sway', [.86, .29, 1, .5], { amp: .02, freq: .7, phase: 1.7, anchor: 'bottom', feather: .015 }),
        R('flag', 'sway', [.49, .22, .57, .25], { amp: .05, freq: 3.2, feather: .005 })
      ],
      hits: [
        { name: 'slide:spiral', rect: [.12, .3, .43, .61], spot: [-.6, .2] },
        { name: 'slide:drop', rect: [.45, .3, .6, .61], spot: [0, .2] },
        { name: 'slide:rainbow', rect: [.6, .33, .99, .61], spot: [.6, .2] },
        { name: 'flamingo', rect: [.11, .6, .28, .68] }, { name: 'ball', rect: [.05, .7, .23, .79] },
        { name: 'water', rect: [0, .61, 1, .76] }
      ],
      slides: { spiral: { top: [.25, .33], exit: [.35, .6] }, drop: { top: [.53, .33], exit: [.6, .61] }, rainbow: { top: [.8, .4], exit: [.79, .61] } },
      motes: [{ rect: [0, .58, 1, .76], n: 50, lift: .3, depth: .8, rise: .15, color: 0xdffcff, size: .06 }]
    }
  };
  function slideHandler(id) {
    return function (c) { if (c.busy) return; c.busy = true; c.stage.kick(id + 'Tint'); var s = c.stage.cfg.slides[id]; c.api.starBurst({ u: s.top[0], v: s.top[1] }, 60);
      c.later(.35, function () { c.busy = false; c.emit('slide', { id: id }); }); };
  }
  var handlers = {
    'slide:spiral': slideHandler('spiral'), 'slide:drop': slideHandler('drop'), 'slide:rainbow': slideHandler('rainbow'),
    flamingo: function (c) { c.stage.kick('flamingo'); c.emit('flamingo', {}); },
    ball: function (c) { c.stage.kick('ball'); c.emit('ball', {}); },
    water: function (c, h, p) { c.stage.kick('water'); c.emit('water', { point: p }); }
  };
  function build(THREE, scene, opts) {
    var K = root.GhaliaSceneKit; if (!K || !K.illustratedScene) throw new Error('GhaliaPoolScene needs scene-kit.js');
    var art = (opts && opts.art) || (root.GhaliaArt && root.GhaliaArt.pool); if (!art) throw new Error('GhaliaPoolScene needs pool-art.js');
    return K.illustratedScene(THREE, scene, opts, { name: 'pool', art: art, variants: V, handlers: handlers, bg: 0xf7b49a, burstAt: [.5, .5] });
  }
  var mod = { build: build, name: 'pool', variants: V };
  root.GhaliaPoolScene = mod;
  if (typeof module !== 'undefined' && module.exports) module.exports = mod;
})(typeof window !== 'undefined' ? window : globalThis);
