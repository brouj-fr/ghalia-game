/* PoolAudio — Web Audio sounds for the pool world (no files, works offline): water rush loop, whoosh, splash, bubbles,
   tick, synthesized "wheee" + giggles, and short ENGLISH spoken lines via speechSynthesis (English voices only, never Arabic). */
(function (root) {
  'use strict';
  var ctx = null, master = null, noiseBuf = null, rush = null, park = null, on = true, voice = null;
  try { on = localStorage.getItem('ghalia_pool_sound') !== '0'; } catch (e) {}
  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    var AC = root.AudioContext || root.webkitAudioContext; if (!AC) return null;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = on ? .9 : 0;
    var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; master.connect(comp); comp.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }
  function noiseSrc(loop) { var s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = !!loop; return s; }
  function env(g, t, a, peak, dec) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
  function tone(type, f0, f1, dur, vol, delay) {
    if (!ensure()) return; var t = ctx.currentTime + (delay || 0), o = ctx.createOscillator(), g = ctx.createGain(); o.type = type;
    o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur); env(g, t, .01, vol, dur); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .05);
  }
  function burst(dur, f0, f1, vol, type, delay) {
    if (!ensure()) return; var t = ctx.currentTime + (delay || 0), s = noiseSrc(), f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = type || 'bandpass'; f.Q.value = .9;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur); env(g, t, .02, vol, dur); s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + .05);
  }
  /* a child-like vowel: sawtooth through two formant filters */
  function vowel(t, f0, f1, dur, vol, F1, F2) {
    var o = ctx.createOscillator(), vib = ctx.createOscillator(), vg = ctx.createGain(), g = ctx.createGain(), a = ctx.createBiquadFilter(), b = ctx.createBiquadFilter(), mix = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    vib.frequency.value = 6.5; vg.gain.value = f0 * .025; vib.connect(vg); vg.connect(o.frequency);
    a.type = 'bandpass'; a.frequency.value = F1; a.Q.value = 6; b.type = 'bandpass'; b.frequency.value = F2; b.Q.value = 8;
    o.connect(a); o.connect(b); a.connect(mix); b.connect(mix); mix.gain.value = 1; mix.connect(g); g.connect(master);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .03); g.gain.setValueAtTime(vol, t + dur * .6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); vib.start(t); o.stop(t + dur + .05); vib.stop(t + dur + .05);
  }
  function pickVoice() {
    if (!('speechSynthesis' in root)) return null; var vs = speechSynthesis.getVoices() || [];
    var en = vs.filter(function (v) { return /^en[-_]/i.test(v.lang); }); if (!en.length) return null;
    var pref = en.filter(function (v) { return /female|samantha|karen|moira|tessa|zira|aria|jenny|google us english|serena|victoria/i.test(v.name); });
    return pref[0] || en[0];
  }
  if ('speechSynthesis' in root) { try { speechSynthesis.onvoiceschanged = function () { voice = pickVoice(); }; voice = pickVoice(); } catch (e) {} }
  var A = {
    unlock: function () { ensure(); },
    get on() { return on; },
    setOn: function (v) { on = !!v; try { localStorage.setItem('ghalia_pool_sound', on ? '1' : '0'); } catch (e) {} if (master) master.gain.value = on ? .9 : 0; if (!on && root.speechSynthesis) speechSynthesis.cancel(); if (!on && A.parkStop) A.parkStop(); },
    /* continuous water rush while riding: level 0..1 drives volume + brightness */
    rushStart: function () {
      if (!ensure() || rush) return; var t = ctx.currentTime;
      var s = noiseSrc(true), lp = ctx.createBiquadFilter(), bp = ctx.createBiquadFilter(), g1 = ctx.createGain(), g2 = ctx.createGain();
      lp.type = 'lowpass'; lp.frequency.value = 500; bp.type = 'bandpass'; bp.frequency.value = 1200; bp.Q.value = .7;
      s.connect(lp); lp.connect(g1); s.connect(bp); bp.connect(g2); g1.connect(master); g2.connect(master); g1.gain.value = 0; g2.gain.value = 0; s.start(t);
      rush = { s: s, lp: lp, bp: bp, g1: g1, g2: g2 };
    },
    rushLevel: function (k, turn) {
      if (!rush) return; var t = ctx.currentTime; k = Math.max(0, Math.min(1.3, k));
      rush.g1.gain.setTargetAtTime(.25 + .35 * k, t, .08); rush.g2.gain.setTargetAtTime(.05 + .22 * k + .25 * (turn || 0), t, .06);
      rush.lp.frequency.setTargetAtTime(380 + 900 * k, t, .1); rush.bp.frequency.setTargetAtTime(900 + 2600 * k + 1500 * (turn || 0), t, .08);
    },
    rushStop: function () { if (!rush) return; var r = rush, t = ctx.currentTime; rush = null; r.g1.gain.setTargetAtTime(0, t, .08); r.g2.gain.setTargetAtTime(0, t, .08); r.s.stop(t + .5); },
    whoosh: function () { burst(.55, 300, 3200, .35); },
    tick: function () { tone('square', 2200, 0, .03, .05); tone('sine', 900, 0, .05, .08); },
    pop: function () { tone('sine', 380, 980, .16, .25); },
    boing: function () { tone('triangle', 220, 660, .25, .25); },
    splash: function () {
      if (!ensure()) return;
      burst(1.1, 5000, 260, .9, 'lowpass'); burst(.5, 2600, 900, .5, 'bandpass', .02); tone('sine', 140, 38, .45, .9);
      for (var i = 0; i < 16; i++) tone('sine', 500 + Math.random() * 900, 1400 + Math.random() * 1400, .06 + Math.random() * .06, .07, .25 + Math.random() * .9);
    },
    crash: function () {
      if (!ensure()) return;
      burst(1.45, 4200, 160, 1.0, 'lowpass'); burst(.7, 1800, 320, .75, 'bandpass', .03); tone('sine', 90, 24, .7, 1.0);
      for (var i = 0; i < 20; i++) tone('sine', 400 + Math.random() * 1100, 1000 + Math.random() * 1600, .05 + Math.random() * .08, .08, .2 + Math.random() * 1.0);
    },
    bubbles: function (n) { for (var i = 0; i < (n || 10); i++) tone('sine', 400 + Math.random() * 600, 1200 + Math.random() * 1600, .05 + Math.random() * .05, .06, Math.random() * .7); },
    wheee: function () { if (!ensure()) return; var t = ctx.currentTime; vowel(t, 620, 1050, 1.25, .22, 420, 2700); },
    giggle: function (n) {
      if (!ensure()) return; var t = ctx.currentTime + .05; n = n || 6;
      for (var i = 0; i < n; i++) { var f = 560 - i * 22 + Math.random() * 30; vowel(t, f * 1.08, f * .92, .13, .2, 950, 1550); burst(.08, 2500, 1800, .05, 'bandpass', t - ctx.currentTime); t += .16 + Math.random() * .03; }
    },
    say: function (en) { if (!on || !('speechSynthesis' in root)) return; if (!voice) voice = pickVoice(); if (!voice) return; try { speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(en); u.voice = voice; u.lang = voice.lang; u.rate = 1.0; u.pitch = 1.45; speechSynthesis.speak(u); } catch (e) {} },
    /* cheerful water-park bed: quiet splashy water + soft major-key triangle arpeggio, occasional giggles */
    parkStart: function () {
      if (!ensure() || park) return; var t = ctx.currentTime;
      var s = noiseSrc(true), lp = ctx.createBiquadFilter(), g = ctx.createGain();
      lp.type = 'lowpass'; lp.frequency.value = 900; g.gain.value = 0.0001;
      s.connect(lp); lp.connect(g); g.connect(master); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(.055, t + .4); s.start(t);
      var osc = ctx.createOscillator(), og = ctx.createGain(), olp = ctx.createBiquadFilter();
      osc.type = 'triangle'; olp.type = 'lowpass'; olp.frequency.value = 1800; og.gain.value = 0.0001;
      osc.connect(olp); olp.connect(og); og.connect(master); og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(.042, t + .5); osc.frequency.setValueAtTime(523.25, t); osc.start(t);
      var notes = [523.25, 659.25, 783.99, 392.00, 493.88, 587.33, 440.00, 523.25, 659.25, 349.23, 440.00, 523.25], step = 0;
      var interval = setInterval(function () {
        if (!park || !ctx) return; var now = ctx.currentTime, f = notes[step % notes.length];
        try { osc.frequency.setTargetAtTime(f, now, .015); } catch (e) {}
        if (step % 8 === 0) tone('sine', f * 2, f * 2.05, .12, .035);
        step++;
      }, 280);
      var life = setInterval(function () {
        if (!park || !on) return;
        if (Math.random() < .5) A.giggle(2); else A.bubbles(4);
      }, 2800);
      park = { s: s, g: g, osc: osc, og: og, interval: interval, life: life };
    },
    parkStop: function () {
      if (!park) return; var p = park, t = ctx ? ctx.currentTime : 0; park = null;
      try { clearInterval(p.interval); clearInterval(p.life); } catch (e) {}
      if (!ctx) return;
      try { p.g.gain.setTargetAtTime(0, t, .12); p.og.gain.setTargetAtTime(0, t, .12); p.s.stop(t + .5); p.osc.stop(t + .5); } catch (e) {}
    }
  };
  root.PoolAudio = A;
})(typeof window !== 'undefined' ? window : globalThis);
