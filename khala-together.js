/* Khala in the illustrated house (world3d.html bedroom) + affectionate moments with Ghalia:
   hug (لمة), tickles (دغدغة), cheek pinch (قرصة خدود) and hide-and-seek (غميضة).
   Hooks V2ILL.create for GhaliaHouseScene only; needs khala-sprite-atlas.js + khala-sprite.js loaded first.
   On-screen text is Arabic; anything SPOKEN is English (speechSynthesis, English voices only). Offline, no network. */
(function () {
  'use strict';
  if (!window.V2ILL || !window.KhalaSprite || !window.KHALA_ATLAS) return;
  var KS = window.KhalaSprite;
  /* ---------------- audio: English voice + giggles ---------------- */
  function soundOn() { try { return !(window.V2 && V2.isSound) || V2.isSound(); } catch (e) { return true; } }
  var voice = null;
  function score(v) { var n = v.name || '', l = (v.lang || '').replace('_', '-'); if (!/^en(-|$)/i.test(l)) return -1; var s = 0;
    if (/en-US/i.test(l)) s += 30; else if (/en-GB/i.test(l)) s += 26; else s += 12;
    if (/natural|neural|online|premium|enhanced/i.test(n)) s += 40; if (/google/i.test(n)) s += 25;
    if (/samantha|ava|allison|susan|serena|karen|moira|tessa|kate|aria|jenny|zira|libby|sonia|emma|olivia/i.test(n)) s += 15;
    if (/novelty|bells|bubbles|bad news|good news|whisper|zarvox|trinoids|cellos|organ|boing|albert|jester|superstar|wobble|hysterical|pipe|bahh|deranged/i.test(n)) s -= 100; return s; }
  function pickVoice() { try { if (window.VOICE_EN && VOICE_EN.voice && VOICE_EN.voice()) return (voice = VOICE_EN.voice());
    var vs = speechSynthesis.getVoices(), best = null, bs = 0; for (var i = 0; i < vs.length; i++) { var s = score(vs[i]); if (s > bs) { bs = s; best = vs[i]; } } voice = best; } catch (e) { voice = null; } return voice; }
  if ('speechSynthesis' in window) { pickVoice(); try { speechSynthesis.addEventListener('voiceschanged', pickVoice); } catch (e) {} }
  var SLOW = { k: 1, paused: false, hold: null };   // test hooks: stretch scripted delays / freeze at a phase
  function pt(f, ms) { setTimeout(function c() { if (SLOW.paused) return setTimeout(c, 100); f(); }, ms); }
  function speak(en, who) {            // resolves when the line is done (or after an estimate when silent)
    return new Promise(function (res) {
      var done = false, fin = function () { if (!done) { done = true; res(); } }, est = (500 + en.split(/\s+/).length * 360) * SLOW.k;
      pt(fin, est + 1400);
      if (!soundOn() || !('speechSynthesis' in window) || !(voice || pickVoice())) { pt(fin, est); return; }
      try { var u = new SpeechSynthesisUtterance(en); u.voice = voice; u.lang = voice.lang; u.rate = who === 'g' ? 1.02 : .94; u.pitch = who === 'g' ? 1.6 : 1.12; u.volume = 1;
        u.onend = fin; u.onerror = fin; speechSynthesis.speak(u); } catch (e) { setTimeout(fin, est); }
    });
  }
  var AC = null;
  function ac() { try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) { AC = null; } return AC; }
  function giggle(pitch, n) {
    if (!soundOn()) return; var C = ac(); if (!C) return; var t = C.currentTime + .02; n = n || 5; pitch = pitch || 1;
    for (var i = 0; i < n; i++) {
      var o = C.createOscillator(), g = C.createGain(), f = pitch * (560 + Math.random() * 90) * (1 - i * .035), t0 = t + i * (.105 + Math.random() * .02);
      o.type = 'triangle'; o.frequency.setValueAtTime(f * 1.3, t0); o.frequency.exponentialRampToValueAtTime(f * .82, t0 + .085);
      g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(.13, t0 + .012); g.gain.exponentialRampToValueAtTime(.0008, t0 + .095);
      o.connect(g); g.connect(C.destination); o.start(t0); o.stop(t0 + .11);
    }
  }
  function sfx(name) { try { if (window.V2 && V2.sfx && V2.sfx[name] && soundOn()) V2.sfx[name](); } catch (e) {} }
  /* ---------------- DOM: styles, bar, bubbles, particles ---------------- */
  var css = '' +
    '#kh-bar{position:fixed;left:50%;bottom:calc(22px + env(safe-area-inset-bottom));transform:translate(-50%,30px) scale(.9);opacity:0;pointer-events:none;z-index:60;display:flex;gap:10px;padding:8px 10px;border-radius:26px;background:rgba(255,240,248,.28);border:1.5px solid rgba(255,255,255,.55);backdrop-filter:blur(14px) saturate(1.3);-webkit-backdrop-filter:blur(14px) saturate(1.3);box-shadow:0 10px 30px rgba(120,20,70,.28);transition:opacity .25s,transform .35s cubic-bezier(.3,1.6,.5,1)}' +
    '#kh-bar.on{opacity:1;transform:translate(-50%,0) scale(1);pointer-events:auto}' +
    '#kh-bar button{all:unset;cursor:pointer;width:68px;display:flex;flex-direction:column;align-items:center;gap:2px;font:800 12px/1.1 Cairo,Tajawal,system-ui,sans-serif;color:#fff;text-shadow:0 1px 3px rgba(90,0,50,.6)}' +
    '#kh-bar button i{font-style:normal;width:52px;height:52px;border-radius:50%;display:grid;place-items:center;font-size:27px;background:linear-gradient(160deg,#ff8fc4,#e94a9a);border:3px solid #fff;box-shadow:0 5px 14px rgba(160,20,90,.45),inset 0 2px 0 rgba(255,255,255,.5);transition:transform .15s}' +
    '#kh-bar button:active i{transform:scale(.88)}#kh-bar button:hover i{transform:translateY(-3px) rotate(-6deg)}' +
    '@media (max-width:640px){#kh-bar{bottom:calc(108px + env(safe-area-inset-bottom));gap:4px;padding:6px 6px}#kh-bar button{width:64px;font-size:11px}#kh-bar button i{width:48px;height:48px;font-size:24px}}' +
    '#kh-fx{position:fixed;inset:0;pointer-events:none;z-index:58;overflow:hidden}' +
    '.kh-cine:before,.kh-cine:after{content:"";position:fixed;left:0;right:0;height:0;background:#1a0614;z-index:57;transition:height .5s cubic-bezier(.6,0,.2,1)}.kh-cine:before{top:0}.kh-cine:after{bottom:0}' +
    'body.kh-cine-on .kh-cine:before,body.kh-cine-on .kh-cine:after{height:7.5vh}' +
    '.kh-glow{position:fixed;inset:0;pointer-events:none;z-index:56;opacity:0;transition:opacity .6s;background:radial-gradient(ellipse at 50% 55%,rgba(255,150,200,.0) 35%,rgba(255,90,170,.28) 100%)}body.kh-cine-on .kh-glow{opacity:1}' +
    'body.kh-cine-on .joystick-zone{opacity:.25;pointer-events:none}' +
    '.kh-b{position:absolute;transform:translate(-50%,-100%);min-width:70px;max-width:230px;padding:8px 13px 9px;border-radius:18px;background:#fff;color:#5a1240;text-align:center;font:800 15px/1.25 Cairo,Tajawal,system-ui,sans-serif;box-shadow:0 8px 22px rgba(120,10,70,.3);animation:khPop .35s cubic-bezier(.3,1.7,.5,1)}' +
    '.kh-b small{display:block;font:700 11.5px/1.2 Nunito,system-ui,sans-serif;color:#c2337f;direction:ltr;margin-top:2px}' +
    '.kh-b:after{content:"";position:absolute;left:50%;bottom:-9px;margin-left:-9px;border:9px solid transparent;border-top-color:#fff;border-bottom:0}' +
    '.kh-b.g{background:#fff3fa}.kh-b.out{transition:opacity .3s,transform .3s;opacity:0;transform:translate(-50%,-120%)}' +
    '@keyframes khPop{0%{transform:translate(-50%,-80%) scale(.4);opacity:0}100%{transform:translate(-50%,-100%) scale(1);opacity:1}}' +
    '.kh-p{position:absolute;font-size:26px;line-height:1;will-change:transform,opacity;animation:khUp var(--d,1.7s) ease-out forwards;text-shadow:0 2px 8px rgba(255,80,160,.5)}' +
    '@keyframes khUp{0%{transform:translate(-50%,0) scale(.3) rotate(0);opacity:0}15%{opacity:1;transform:translate(calc(-50% + var(--x0,0px)),-12px) scale(1.15)}100%{transform:translate(calc(-50% + var(--x,0px)),var(--y,-150px)) scale(.8) rotate(var(--r,20deg));opacity:0}}' +
    '.kh-t{position:absolute;font:900 20px/1 Nunito,Cairo,system-ui,sans-serif;color:#fff;-webkit-text-stroke:1.2px #e2408f;paint-order:stroke;text-shadow:0 3px 0 #e2408f,0 5px 12px rgba(160,20,90,.5);animation:khUp 1.3s ease-out forwards;direction:ltr;white-space:nowrap}' +
    '#kh-count{position:fixed;right:max(16px,3vw);top:84px;z-index:61;pointer-events:none;text-align:center;font:900 15px/1.2 Cairo,system-ui,sans-serif;color:#fff;text-shadow:0 2px 6px rgba(120,0,60,.6);opacity:0;transition:opacity .3s}' +
    '#kh-count.on{opacity:1}#kh-count b{display:block;margin:0 auto 6px;width:96px;height:96px;border-radius:50%;background:linear-gradient(160deg,#ffd0e6,#ff69b0);border:4px solid #fff;box-shadow:0 8px 24px rgba(170,20,100,.45);font:900 50px/88px Nunito,system-ui,sans-serif;color:#fff;-webkit-text-stroke:1.5px #c0156e;paint-order:stroke}' +
    '#kh-count b.pop{animation:khNum .45s cubic-bezier(.3,1.8,.5,1)}@keyframes khNum{0%{transform:scale(.3) rotate(-20deg)}100%{transform:scale(1)}}' +
    '#kh-count b.txt{width:auto;height:auto;padding:12px 18px;border-radius:24px;font:900 22px/1.15 Nunito,system-ui,sans-serif;direction:ltr}' +
    '.kh-spot{position:fixed;z-index:59;transform:translate(-50%,-50%);all:unset;position:fixed;cursor:pointer;width:62px;height:62px;margin:-31px 0 0 -31px;border-radius:50%;display:grid;place-items:center;font-size:26px;background:rgba(255,255,255,.3);border:3px solid #fff;box-shadow:0 0 0 0 rgba(255,105,180,.7),0 6px 18px rgba(120,10,70,.35);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);animation:khRing 1.4s infinite}' +
    '.kh-spot span{position:absolute;top:100%;margin-top:3px;white-space:nowrap;font:800 12px/1 Cairo,system-ui,sans-serif;color:#fff;text-shadow:0 1px 4px rgba(90,0,50,.8)}' +
    '.kh-spot.hot{background:rgba(255,120,190,.55)}.kh-spot.no{opacity:.35;pointer-events:none;animation:none}' +
    '@keyframes khRing{0%{box-shadow:0 0 0 0 rgba(255,105,180,.75),0 6px 18px rgba(120,10,70,.35)}100%{box-shadow:0 0 0 18px rgba(255,105,180,0),0 6px 18px rgba(120,10,70,.35)}}' +
    '#kh-pick{position:fixed;inset:0;z-index:62;display:none;place-items:center;background:rgba(40,5,30,.35)}#kh-pick.on{display:grid}' +
    '#kh-pick .card{width:min(340px,88vw);padding:20px 18px 18px;border-radius:28px;text-align:center;background:rgba(255,236,246,.88);border:2px solid #fff;box-shadow:0 20px 50px rgba(110,10,70,.4);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);font:800 16px/1.3 Cairo,system-ui,sans-serif;color:#6a1650;animation:khPop2 .4s cubic-bezier(.3,1.6,.5,1)}' +
    '@keyframes khPop2{0%{transform:scale(.6);opacity:0}100%{transform:scale(1);opacity:1}}' +
    '#kh-pick h3{margin:0 0 4px;font:900 24px/1.2 Cairo,system-ui,sans-serif;color:#d62c86}#kh-pick p{margin:0 0 14px;font-weight:700;font-size:14px}' +
    '#kh-pick button{all:unset;cursor:pointer;display:block;margin:8px 0;padding:13px 10px;border-radius:18px;background:linear-gradient(160deg,#ff8fc4,#e94a9a);color:#fff;font:900 17px/1.2 Cairo,system-ui,sans-serif;box-shadow:0 6px 16px rgba(170,20,100,.35);border:2.5px solid #fff}' +
    '#kh-pick button.x{background:none;color:#a4407a;box-shadow:none;border:0;font-size:14px;padding:6px}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  function el(tag, attrs, html) { var e = document.createElement(tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }
  var fx = el('div', { id: 'kh-fx' }), cine = el('div', { 'class': 'kh-cine' }), glow = el('div', { 'class': 'kh-glow' });
  var bar = el('div', { id: 'kh-bar', role: 'toolbar', 'aria-label': 'خالتج' },
    '<button data-act="hug"><i>🤗</i>لمّة</button><button data-act="tickle"><i>🤭</i>دغدغة</button>' +
    '<button data-act="pinch"><i>🥰</i>قرصة خدود</button><button data-act="hide"><i>🙈</i>غميضة</button>');
  var counter = el('div', { id: 'kh-count' }, '<b>1</b><span></span>');
  var pick = el('div', { id: 'kh-pick' }, '<div class="card"><h3>غميضة 🙈</h3><p>خالتج بتعد لين عشرة… مين يتخبى؟</p>' +
    '<button data-m="hide">🫣 أنا أخبي غالية</button><button data-m="seek">🔍 غالية تتخبى وأنا أدورها</button><button class="x" data-m="x">رجوع</button></div>');
  function mount() { [glow, cine, fx, bar, counter, pick].forEach(function (e) { if (!e.parentNode) document.body.appendChild(e); }); }
  if (document.body) mount(); else addEventListener('DOMContentLoaded', mount);
  var LINES = {
    hi: ['هلا والله بغالية! 💗', 'Hi, Ghalia! Come here, sweetie!'],
    hugK: ['تعالي يا حبيبتي! لمّة كبيرة 🤗', 'Come here, my sweetheart! Big hug!'],
    hugG: ['أحبج يا خالتي! 💕', 'I love you, Auntie!'],
    hugK2: ['وأنا أحبج أكثر يا غالية 💗', 'I love you more, Ghalia!'],
    tickK: ['دغدغة دغدغة! 🤭', 'Tickle, tickle, tickle!'],
    tickG: ['هههه! دوري الحين! 😆', 'Hee hee! My turn! Tickle, tickle!'],
    tickK2: ['هههه! خلاص خلاص، فزتي! 😂', 'Ha ha ha! Okay, okay, you win!'],
    pinchK: ['منو عنده أحلى خدود؟ إنتي! 🥰', 'Who has the cutest cheeks? You do!'],
    pinchG: ['هيهي… شكراً خالتي ☺️', 'Hee hee... thank you, Auntie!'],
    hideStart: ['يلا نلعب غميضة! بعد لين عشرة 🙈', "Let's play hide and seek! I'll count to ten."],
    ready: ['جاهزين أو لا، أنا جاية! 👀', 'Ready or not, here I come!'],
    notHere: ['لا… مو هني! 🤔', 'Hmm... not here!'],
    found: ['لقيتج! 🎉', 'Found you!'],
    foundG: ['هههه لقيتيني! 😆', 'You found me!'],
    gone: ['غالية راحت تتخبى… لا تطالعين! 🤫', ''],
    where: ['وين غالية؟ اضغطي المكان اللي تحسين إنها فيه 🔍', ''],
    pickSpot: ['اختاري مكان تتخبى فيه غالية! 🫣', '']
  };
  var NUM = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
  var SPOTS = { bed: ['ورا السرير', 'Is she behind the bed?', 'canopy', '🛏️'], wardrobe: ['جنب الكبت', 'Maybe by the wardrobe?', 'dresses', '👗'],
    teddy: ['ورا الدبدوب', 'Behind the teddy bear?', 'teddy', '🧸'], unicorn: ['جنب اليونيكورن', 'Next to the unicorn?', 'unicorn', '🦄'],
    mirror: ['تحت التسريحة', 'Under the dressing table?', 'bulbs', '🪞'] };

  /* ---------------- attach to the illustrated house ---------------- */
  var create0 = V2ILL.create;
  V2ILL.create = function (o) {
    var api = create0.apply(this, arguments);
    if (o && o.Module && o.Module === window.GhaliaHouseScene) { try { attach(api, o); } catch (e) { console.warn('[khala] not attached', e); } }
    return api;
  };
  function attach(api, o) {
    var T = THREE, world = api.world, scene = api.scene, camera = api.camera, rig = o.rig, g = rig.root, gp = api.pos;
    var K = KS.create(T, { x: -.5, z: .6 }); scene.add(K.group); K.setVisible(false);
    var M = KS.holder(T, 1.5), m1 = KS.card(T), m2 = KS.card(T); m2.mesh.position.z = .003; M.pivot.add(m1.mesh); M.pivot.add(m2.mesh); M.group.visible = false; scene.add(M.group);
    var H = KS.holder(T, .7), hc = KS.card(T).set('g_hide'); H.pivot.add(hc.mesh); H.group.visible = false; scene.add(H.group);
    var busy = false, token = 0, anim = null, animT = 0, mid = { x: 0, z: 0 }, hidePos = null, hideAnim = null, bubbles = [], near = false, lastHi = -1e9, wanderT = 6, clock = 0;
    var ray = new T.Raycaster(), ndc = new T.Vector2(), tmp = new T.Vector3();
    var ZMAX = .66;   // keep Khala (and the moments) in the mid-ground so she fits the frame
    var KH = { api: api, K: K, busy: function () { return busy; }, near: function () { return near; }, play: play, slow: SLOW, phase: '' };
    window.__khala = KH;
    function ph(p) { KH.phase = p; if (SLOW.hold && SLOW.hold.indexOf(p) >= 0) SLOW.paused = true; }
    world.ready.then(function () {
      K.pos.x = world.spawn.x - .42; K.pos.z = Math.min(ZMAX, world.spawn.z + .05); world.clampToWalkable(K.pos); K.setVisible(true);
    });
    world.on && world.on('variant', function () { world.clampToWalkable(K.pos); });
    /* ---- helpers ---- */
    function headWorld(x, z, k, out) { var a = world.actorAt(x, z); out = out || new T.Vector3(); out.copy(a.position); out.y += a.height * k; return out; }
    function toScreen(v) { tmp.copy(v).project(camera); return { x: (tmp.x + 1) / 2 * innerWidth, y: (1 - tmp.y) / 2 * innerHeight, ok: tmp.z < 1 }; }
    function whoPos(who) { return who === 'k' ? headWorld(K.pos.x, K.pos.z, 1.3) : who === 'g' ? headWorld(gp.x, gp.z, 1.08) : who === 'm' ? headWorld(mid.x, mid.z, 1.22) : who; }
    function bubble(key, who, ms) {
      var L = LINES[key] || key; var b = el('div', { 'class': 'kh-b' + (who === 'g' ? ' g' : '') }, L[0] + (L[1] ? '<small>' + L[1] + '</small>' : ''));
      fx.appendChild(b); var item = { el: b, who: who, until: clock + (ms || 2600) * SLOW.k / 1000 }; bubbles.forEach(function (x) { if (x.who === who) x.until = Math.min(x.until, clock); }); bubbles.push(item); placeBubble(item); return item;
    }
    function placeBubble(it) { var s = toScreen(typeof it.who === 'string' ? whoPos(it.who) : it.who); it.el.style.left = Math.max(70, Math.min(innerWidth - 70, s.x)) + 'px'; it.el.style.top = Math.max(96, s.y - 8) + 'px'; }
    function line(key, who, ms) { var L = LINES[key]; bubble(key, who, ms || Math.max(2200, 900 + (L[1] || '').length * 70)); return L[1] ? speak(L[1], who === 'g' ? 'g' : 'k') : wait(1200); }
    function particles(at, n, set, spread) {
      var s = toScreen(typeof at === 'string' ? whoPos(at) : at); set = set || ['💗', '💕', '💖', '✨', '💞'];
      for (var i = 0; i < n; i++) (function (i) { setTimeout(function () {
        var p = el('span', { 'class': 'kh-p' }, set[Math.floor(Math.random() * set.length)]), sp = spread || 70;
        p.style.left = (s.x + (Math.random() - .5) * sp) + 'px'; p.style.top = (s.y + (Math.random() - .3) * sp * .6) + 'px';
        p.style.setProperty('--x', ((Math.random() - .5) * 120) + 'px'); p.style.setProperty('--y', (-110 - Math.random() * 110) + 'px');
        p.style.setProperty('--r', ((Math.random() - .5) * 70) + 'deg'); p.style.setProperty('--d', (1.3 + Math.random() * .8) + 's'); p.style.fontSize = (18 + Math.random() * 16) + 'px';
        fx.appendChild(p); setTimeout(function () { p.remove(); }, 2300); }, i * 70); })(i);
    }
    function word(at, txt) { var s = toScreen(typeof at === 'string' ? whoPos(at) : at), p = el('span', { 'class': 'kh-t' }, txt);
      p.style.left = (s.x + (Math.random() - .5) * 80) + 'px'; p.style.top = (s.y - Math.random() * 30) + 'px'; p.style.setProperty('--x', ((Math.random() - .5) * 60) + 'px'); p.style.setProperty('--y', '-90px'); p.style.setProperty('--r', ((Math.random() - .5) * 30) + 'deg');
      fx.appendChild(p); setTimeout(function () { p.remove(); }, 1400); }
    function burst(at, n) { try { world.starBurst(typeof at === 'string' ? whoPos(at) : at, n || 26); } catch (e) {} }
    function wait(ms) { var my = token; return new Promise(function (res, rej) { setTimeout(function c() { if (my !== token) return rej('abort'); if (SLOW.paused) return setTimeout(c, 100); res(); }, ms * SLOW.k); }); }
    function guard(my) { if (my !== token) throw 'abort'; }
    function walkG(x, z, ms) { var my = token; return new Promise(function (res) { var p = { x: x, z: z }; world.clampToWalkable(p); var t = setTimeout(res, ms || 5000); api.walkTo(p.x, p.z, function () { clearTimeout(t); res(); }); }).then(function () { guard(my); }); }
    function walkK(x, z, ms) { var my = token; return new Promise(function (res) { var t = setTimeout(res, ms || 6000); K.walkTo(x, z, world, function () { clearTimeout(t); res(); }); }).then(function () { guard(my); }); }
    function cinema(on) { document.body.classList.toggle('kh-cine-on', !!on); }
    function showBar(on) { bar.classList.toggle('on', !!on); }
    function lookAtK() { try { rig.lookAt(headWorld(K.pos.x, K.pos.z, 1.15)); } catch (e) {} }
    /* pair card: frame, whether the art has Khala on the left */
    function showPair(frame, artKhalaLeft) {
      var khalaLeft = K.pos.x < gp.x; m1.set(frame, artKhalaLeft !== khalaLeft); m1.opacity(1); m2.opacity(0);
      mid.x = (K.pos.x + gp.x) / 2; mid.z = (K.pos.z + gp.z) / 2; M.group.visible = true; K.setVisible(false); g.visible = false; animT = 0;
      burst('m', 22); sfx('sparkle');
    }
    function crossPair(frame, artKhalaLeft) { var khalaLeft = K.pos.x < gp.x; m2.set(m1.frame, m1.flip); m2.opacity(1); m1.set(frame, artKhalaLeft !== khalaLeft); xfade = 1; }
    var xfade = 0;
    function endPair() { M.group.visible = false; K.setVisible(true); g.visible = true; anim = null; burst('m', 18); }
    /* ---- moments ---- */
    async function approach() {
      if (K.pos.z > ZMAX + .02) await walkK(K.pos.x, ZMAX, 4000);
      var side = gp.x >= K.pos.x ? 1 : -1, tx = K.pos.x + side * .3, tz = K.pos.z;
      var p = { x: tx, z: tz }; world.clampToWalkable(p); if (Math.abs(p.x - K.pos.x) < .2) { side = -side; p.x = K.pos.x + side * .3; p.z = tz; world.clampToWalkable(p); }
      await walkG(p.x, p.z, 4500); K.face(gp.x < K.pos.x); lookAtK();
    }
    var FLOW = {
      hug: async function (my) {
        K.setPose('k_arms'); K.bounce(.7); var l = line('hugK', 'k'); rig.expr('happy', 3);
        await approach(); await wait(250); rig.react('jump'); await wait(450);
        showPair('p_hug', true); ph('hug');
        anim = function (t) { var s = Math.sin(t * 3.1); m1.squash(1 + .03 * s * s, 1 - .022 * s * s); m1.mesh.rotation.z = Math.sin(t * 1.5) * .035; m1.mesh.position.y = 0; };
        var hearts = setInterval(function () { particles('m', 3); }, 380);
        try { await l; await wait(200); await line('hugG', 'g'); particles('m', 10, ['💖', '💗', '💞']); await line('hugK2', 'k'); await wait(600); } finally { clearInterval(hearts); }
        endPair(); ph('hug_end'); K.setPose('k_happy', 2.2); K.bounce(); rig.expr('happy', 3); rig.react('cheer'); particles('m', 14); sfx('chime');
      },
      tickle: async function (my) {
        K.setPose('k_happy'); var l = line('tickK', 'k'); rig.expr('surprised', 1.2);
        await approach(); await wait(200);
        showPair('p_tickle_a', false); giggle(1.35, 7); ph('tickle_a');
        anim = function (t) { m1.mesh.rotation.z = Math.sin(t * 24) * .03; m1.mesh.position.y = Math.abs(Math.sin(t * 17)) * .035; m1.squash(1 + Math.sin(t * 17) * .015, 1 - Math.sin(t * 17) * .02); };
        var gig = setInterval(function () { word('m', ['hee hee!', 'hehe!', 'hihihi!', 'ha ha!'][Math.floor(Math.random() * 4)]); particles('m', 2, ['😆', '✨', '💗']); }, 420);
        try {
          await l; giggle(1.4, 6); await wait(900);
          crossPair('p_tickle_b', false); giggle(1.05, 6); ph('tickle_b'); await line('tickG', 'g'); giggle(1.0, 8);
          await line('tickK2', 'k'); giggle(1.35, 6); await wait(500);
        } finally { clearInterval(gig); }
        endPair(); ph('tickle_end'); K.setPose('k_laugh', 2.2); rig.expr('happy', 3); rig.react('jump'); particles('m', 12, ['😂', '💗', '✨', '💕']); giggle(1.3, 5);
      },
      pinch: async function (my) {
        K.setPose('k_happy'); rig.expr('happy', 2);
        await approach(); await wait(150);
        showPair('p_pinch_a', true); ph('pinch_a'); var l = line('pinchK', 'k');
        anim = function (t) { m1.mesh.rotation.z = Math.sin(t * 8.5) * .018; m1.squash(1 + Math.abs(Math.sin(t * 8.5)) * .018, 1); m1.mesh.position.y = 0; };
        var bl = setInterval(function () { particles('g', 2, ['💗', '🌸', '✨']); }, 450);
        try {
          await l; await wait(300); crossPair('p_pinch_b', true); giggle(1.5, 5); ph('pinch_b'); particles('m', 10, ['☺️', '💗', '💕', '🌸']);
          anim = function (t) { m1.mesh.rotation.z = Math.sin(t * 2.6) * .03; m1.mesh.position.y = Math.abs(Math.sin(t * 2.6)) * .02; m1.squash(1, 1 + Math.sin(t * 5.2) * .01); };
          await line('pinchG', 'g'); await wait(700);
        } finally { clearInterval(bl); }
        endPair(); ph('pinch_end'); K.setPose('k_happy', 2); rig.expr('happy', 3.5); rig.react('wave'); particles('g', 10, ['💗', '☺️', '💕']); sfx('chime');
      },
      hide: async function (my, mode) {
        var spots = hideSpots(); if (!spots.length) return;
        var l = line('hideStart', 'k'); K.setPose('k_happy'); rig.expr('happy', 2);
        var cp = { x: -.62, z: .55 }; world.clampToWalkable(cp);
        await walkK(cp.x, cp.z, 5000); await l;
        var chosen = null;
        if (mode === 'seek') {                      // Ghalia sneaks off; the player helps Khala find her
          chosen = spots[Math.floor(Math.random() * spots.length)];
          bubble('gone', 'g', 1800); giggle(1.5, 4); burst('g', 16); await wait(500);
          g.visible = false; gp.x = Math.max(-.7, Math.min(.7, chosen.spot.x)); gp.z = chosen.spot.z; world.clampToWalkable(gp);
        } else {
          bubble('pickSpot', 'k', 3200); showSpots(spots, function (s) { if (chosen) return; chosen = s; clearSpots(); rig.expr('happy', 3); walkG(s.spot.x, s.spot.z, 6000).then(function () { hideAt(); }, function () {}); });
        }
        K.setPose('k_cover'); counter.classList.add('on'); ph('count');
        for (var i = 0; i < 10; i++) {
          var b = counter.querySelector('b'); b.className = ''; b.textContent = String(i + 1); void b.offsetWidth; b.className = 'pop';
          counter.querySelector('span').textContent = mode === 'seek' ? 'خالتج تعد… 🙈' : (chosen ? 'غالية تتخبى… 🤫' : 'اختاري مكان بسرعة! 🫣');
          sfx('tick'); speak(NUM[i] + (i === 9 ? '!' : '...'), 'k'); await wait(900);
        }
        counter.querySelector('b').className = 'txt'; counter.querySelector('b').textContent = 'Ready or not…';
        if (!chosen) { chosen = spots[Math.floor(Math.random() * spots.length)]; clearSpots(); await walkG(chosen.spot.x, chosen.spot.z, 6000); hideAt(); }
        else if (mode !== 'seek' && !hidePos) { await waitUntil(function () { return !!hidePos; }, 6000); if (!hidePos) hideAt(); }
        ph('ready'); await line('ready', 'k'); counter.classList.remove('on'); K.setPose('k_search'); ph('search');
        if (mode === 'seek') {
          var misses = 0; bubble('where', 'k', 3200);
          while (true) {
            var tapped = await new Promise(function (res) { showSpots(spots, res); });
            clearSpots(); guard(my);
            await walkK(tapped.spot.x + (tapped.spot.x > K.pos.x ? -.12 : .12), tapped.spot.z, 6000); K.setPose('k_search'); speak(SPOTS[tapped.name][1], 'k'); await wait(900);
            if (tapped === chosen) break;
            kick(tapped); bubble('notHere', 'k', 1700); speak(LINES.notHere[1], 'k'); tapped.no = true; misses++;
            if (misses >= 2) { chosen.hot = true; giggle(1.5, 5); word(spotWorld(chosen), 'hehe!'); particles(spotWorld(chosen), 4, ['🤭', '✨']); }
            await wait(1100);
          }
          hidePos = { x: gp.x, z: gp.z }; await found();
        } else {
          var wrong = spots.filter(function (s) { return s !== chosen; }).sort(function () { return Math.random() - .5; }).slice(0, 2);
          for (var w = 0; w < wrong.length; w++) {
            await walkK(wrong[w].spot.x + .1, wrong[w].spot.z, 6000); K.setPose('k_search'); bubble(SPOTS[wrong[w].name][1] ? [SPOTS[wrong[w].name][0] + '؟ 🤔', SPOTS[wrong[w].name][1]] : 'notHere', 'k', 1800);
            await speak(SPOTS[wrong[w].name][1], 'k'); kick(wrong[w]); await wait(300); bubble('notHere', 'k', 1600); await speak(LINES.notHere[1], 'k');
            if (hideAnim) { hideAnim.peek = 1.4; giggle(1.55, 4); word(hidePos ? headWorld(hidePos.x, hidePos.z, .7) : 'g', 'hehe!'); }
            await wait(400);
          }
          await walkK(chosen.spot.x + (chosen.spot.x > K.pos.x ? -.14 : .14), chosen.spot.z, 6000); await found();
        }
      }
    };
    var _bubble = bubble; bubble = function (key, who, ms) { return Array.isArray(key) ? (LINES.__t = key, _bubble('__t', who, ms)) : _bubble(key, who, ms); };
    function waitUntil(f, ms) { var my = token; return new Promise(function (res) { var t0 = Date.now(); (function loop() { if (my !== token || f() || Date.now() - t0 > ms) return res(); setTimeout(loop, 100); })(); }); }
    function kick(s) { try { world.stage.kick(SPOTS[s.name][2]); } catch (e) {} burst(spotWorld(s), 10); }
    function hideAt() { ph('hidden'); gp.x = Math.max(-.7, Math.min(.7, gp.x)); hidePos = { x: gp.x, z: gp.z }; g.visible = false; H.group.visible = true; hideAnim = { t: 0, peek: 0, jump: 0, laugh: 0 }; hc.set('g_hide'); giggle(1.6, 3); word(headWorld(gp.x, gp.z, .7), 'shh…'); }
    async function found() {
      K.setPose('k_happy'); K.bounce(); var l = line('found', 'k');
      if (!hidePos) hidePos = { x: gp.x, z: gp.z }; H.group.visible = true; g.visible = false; hideAnim = hideAnim || { t: 0 }; hideAnim.jump = 1; hc.set('g_found'); ph('found');
      burst(headWorld(hidePos.x, hidePos.z, .8), 30); sfx('chime'); await l; await line('foundG', 'g'); giggle(1.45, 7);
      hideAnim.laugh = 1; hc.set('g_laugh'); ph('laugh'); K.setPose('k_laugh', 2.4); particles(headWorld(hidePos.x, hidePos.z, .9), 14, ['😆', '💗', '🎉', '✨']); word(headWorld(hidePos.x, hidePos.z, .9), 'ha ha!');
      await wait(1900);
      H.group.visible = false; hideAnim = null; gp.x = hidePos.x; gp.z = hidePos.z; hidePos = null; g.visible = true; rig.expr('happy', 3); rig.react('cheer'); particles('g', 8);
    }
    function hideSpots() {
      var V = window.GhaliaHouseScene.variants[world.variant] || {}, hits = V.hits || [], out = [];
      (world.interactables || []).forEach(function (e) { if (!SPOTS[e.name] || !e.spot) return; var h = hits.filter(function (x) { return x.name === e.name; })[0]; if (!h) return;
        out.push({ name: e.name, spot: { x: e.spot.x, z: e.spot.z }, rect: h.rect }); });
      return out;
    }
    function spotWorld(s) { var r = s.rect; return world.stage.uvToWorld((r[0] + r[2]) / 2, Math.min(r[3] - .03, (r[1] + r[3]) / 2 + .08), .25); }
    var spotEls = [];
    function showSpots(spots, cb) {
      clearSpots();
      spots.forEach(function (s) { if (s.no) return; var b = el('button', { 'class': 'kh-spot' + (s.hot ? ' hot' : ''), 'aria-label': SPOTS[s.name][0] }, SPOTS[s.name][3] + '<span>' + SPOTS[s.name][0] + '</span>');
        b.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); ac(); sfx('pop'); cb(s); }); document.body.appendChild(b); spotEls.push({ el: b, s: s }); });
      placeSpots();
    }
    function placeSpots() { spotEls.forEach(function (o) { var p = toScreen(spotWorld(o.s)); o.el.style.left = Math.max(36, Math.min(innerWidth - 36, p.x)) + 'px'; o.el.style.top = Math.max(110, Math.min(innerHeight - 150, p.y)) + 'px'; }); }
    function clearSpots() { spotEls.forEach(function (o) { o.el.remove(); }); spotEls = []; }
    async function play(kind, mode) {
      if (busy || !api.active || !api.ready) return false;
      bubbles.forEach(function (b) { b.el.remove(); }); bubbles = []; busy = true; var my = ++token; ph(kind + ':start'); showBar(false); cinema(true); ac();
      try { await FLOW[kind](my, mode); }
      catch (e) { if (e !== 'abort') console.warn('[khala] moment', e); }
      finally { if (my === token) cleanup(); }
      return true;
    }
    function cleanup() {
      busy = false; anim = null; xfade = 0; M.group.visible = false; H.group.visible = false; K.setVisible(true); g.visible = true;
      if (hidePos) { gp.x = hidePos.x; gp.z = hidePos.z; } hidePos = null; hideAnim = null; clearSpots(); counter.classList.remove('on'); cinema(false); K.setPose('k_idle');
      try { rig.lookAt(null); } catch (e) {}
    }
    function abort() { if (!busy) return; token++; try { speechSynthesis.cancel(); } catch (e) {} cleanup(); bubbles.forEach(function (b) { b.el.remove(); }); bubbles = []; }
    KH.abort = abort;
    /* ---- input ---- */
    bar.addEventListener('pointerdown', function (e) { var b = e.target.closest('button'); if (!b) return; e.preventDefault(); e.stopPropagation(); ac(); sfx('click');
      if (b.dataset.act === 'hide') { pick.classList.add('on'); showBar(false); return; } play(b.dataset.act); });
    pick.addEventListener('pointerdown', function (e) { var b = e.target.closest('button'); e.stopPropagation(); if (!b) { if (e.target === pick) pick.classList.remove('on'); return; } e.preventDefault(); ac(); sfx('click'); pick.classList.remove('on');
      if (b.dataset.m !== 'x') play('hide', b.dataset.m); });
    var kb = document.getElementById('khala-btn');
    if (kb) kb.addEventListener('click', function () { if (!api.active || !api.ready || busy) return; ac();
      var p = { x: gp.x + (gp.x > K.pos.x ? -.3 : .3), z: Math.min(ZMAX, gp.z) }; world.clampToWalkable(p); K.walkTo(p.x, p.z, world, function () { K.setPose('k_happy', 1.6); K.bounce(); particles('k', 5); });
      if (clock - lastHi > 4) { lastHi = clock; line('hi', 'k'); } });
    var tap0 = api.tap;
    api.tap = function (cx, cy) {
      if (busy) return true;
      if (api.ready && K.group.visible) {
        ndc.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
        if (ray.intersectObject(K.group, true).length) {
          K.setPose('k_happy', 1.6); K.bounce(); particles('k', 5); sfx('pop');
          if (!near) { var side = gp.x >= K.pos.x ? 1 : -1; api.walkTo(K.pos.x + side * .3, K.pos.z); }
          if (clock - lastHi > 8) { lastHi = clock; line('hi', 'k'); }
          return true;
        }
      }
      return tap0.apply(api, arguments);
    };
    var frame0 = api.frame;
    api.frame = function (dt, jx, jy, blocked) { if (busy) { jx = 0; jy = 0; } return frame0.call(api, dt, jx, jy, blocked); };
    var leave0 = api.leave, enter0 = api.enter;
    api.leave = function () { abort(); showBar(false); pick.classList.remove('on'); return leave0.apply(api, arguments); };
    api.enter = function () { var r = enter0.apply(api, arguments); return r; };
    /* ---- per-frame (runs inside world.update, before Ghalia is placed and the frame is rendered) ---- */
    var wu = world.update;
    world.update = function (dt) {
      var r = wu.apply(world, arguments);
      try { tick(Math.min(.05, dt || 0)); } catch (e) { if (!tick.warned) { tick.warned = 1; console.warn('[khala] tick', e); } }
      return r;
    };
    function tick(dt) {
      if (!SLOW.paused) clock += dt; if (!api.ready) return;
      K.update(dt, world, camera);
      if (M.group.visible) {
        animT += dt; M.place(world.actorAt(mid.x, mid.z), camera);
        if (anim) anim(animT);
        if (xfade > 0) { xfade = Math.max(0, xfade - dt / .28); m2.opacity(xfade); m2.mesh.rotation.z = m1.mesh.rotation.z; m2.mesh.position.y = m1.mesh.position.y; m2.squash(m1.sx, m1.sy); } else m2.opacity(0);
        var pop = Math.min(1, animT / .32), e = 1 + 2.2 * Math.pow(pop - 1, 3) + 1.2 * Math.pow(pop - 1, 2);  // ease-out-back
        M.group.scale.multiplyScalar(.85 + .15 * e);
      }
      if (H.group.visible && hidePos && hideAnim) {
        hideAnim.t += dt; H.place(world.actorAt(hidePos.x, hidePos.z), camera);
        var y = 0, rz = 0, sx = 1, sy = 1;
        if (hideAnim.jump > 0) { hideAnim.jump = Math.max(0, hideAnim.jump - dt * 1.6); var j = Math.sin((1 - hideAnim.jump) * Math.PI); y = j * .45; sy = 1 + j * .06; }
        else if (hideAnim.laugh) { y = Math.abs(Math.sin(hideAnim.t * 12)) * .03; rz = Math.sin(hideAnim.t * 12) * .03; }
        else { if (hideAnim.peek > 0) { hideAnim.peek -= dt; hc.set('g_peek'); } else hc.set(Math.sin(hideAnim.t * .9) > .6 ? 'g_peek' : 'g_hide'); rz = Math.sin(hideAnim.t * 5) * .02; sy = 1 + Math.sin(hideAnim.t * 3) * .015; }
        hc.mesh.position.y = y; hc.mesh.rotation.z = rz; hc.squash(sx, sy);
      }
      // proximity, idle life
      var d = Math.hypot((gp.x - K.pos.x) * 1.6, gp.z - K.pos.z), nowNear = api.active && !busy && d < .56 && g.visible;
      if (nowNear !== near) { near = nowNear; showBar(near && !pick.classList.contains('on')); if (near) { K.setPose('k_happy', 1.4); K.face(gp.x < K.pos.x); lookAtK(); } else { try { rig.lookAt(null); } catch (e) {} } }
      if (!busy) {
        wanderT -= dt;
        if (wanderT <= 0 && !K.walking()) {
          wanderT = 7 + Math.random() * 6;
          if (!near) {
            var p = Math.random() < .65 ? { x: gp.x + (gp.x > 0 ? -.24 : .24), z: gp.z + (Math.random() - .5) * .1 } : { x: Math.random() * 1.4 - .7, z: .3 + Math.random() * .36 };
            p.z = Math.min(p.z, ZMAX); world.clampToWalkable(p); K.walkTo(p.x, p.z, world);
          } else if (Math.random() < .5) { K.setPose(Math.random() < .5 ? 'k_happy' : 'k_laugh', 1.2); }
        }
      }
      for (var i = bubbles.length - 1; i >= 0; i--) { var b = bubbles[i]; if (clock > b.until) { if (!b.dying) { b.dying = 1; b.el.classList.add('out'); (function (x) { setTimeout(function () { x.el.remove(); }, 320); })(b); } if (clock > b.until + .4) bubbles.splice(i, 1); } else placeBubble(b); }
      if (spotEls.length) placeSpots();
    }
  }
})();
