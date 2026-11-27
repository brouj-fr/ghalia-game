/* GhaliaPoolRide — first-person water-slide rides for «عالم المسبح» (Three.js r128, toon/illustrated look).
   const ride = GhaliaPoolRide.create(THREE, renderer, { quality, overlay: canvas2d, audio: PoolAudio, onEvent:(type,d)=>{} });
   ride.start('spiral'|'drop'|'rainbow'|'surf'|'river');  // per frame while ride.active: ride.update(dt); ride.render(dt);
   events: 'start' {id} · 'drop' · 'spin' · 'launch' · 'splash' {id} · 'done' {id} · 'mark' {id}
   input: ride.lean(-1..1) (drag) · ride.boost(true/false) (hold)                                                          */
(function (root) {
  'use strict';
  var TAU = Math.PI * 2;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function damp(a, b, r, dt) { return a + (b - a) * (1 - Math.exp(-r * dt)); }
  function smooth(e0, e1, x) { var t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }
  function hash(n) { var s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); }
  function vnoise(t) { var i = Math.floor(t), f = t - i, u = f * f * (3 - 2 * f); return (hash(i) * (1 - u) + hash(i + 1) * u) * 2 - 1; }

  /* ---------------- the three slides ---------------- */
  function spiralPts() {
    var p = [[-9, 31, 7], [-4, 30.8, 7]], turns = 3.6, R = 7.2;
    for (var i = 0; i <= 72; i++) { var a = i / 72, phi = Math.PI / 2 - a * turns * TAU; p.push([R * Math.cos(phi), 30.4 - 25.5 * Math.pow(a, 1.08), R * Math.sin(phi)]); }
    var e = p[p.length - 1]; p.push([e[0] - 5, e[1] - 1.6, e[2] + 1]); p.push([e[0] - 12, 2.1, e[2] + 1.5]); p.push([e[0] - 20, 1.1, e[2] + 1.5]);
    return p;
  }
  var SLIDES = {
    spiral: { name: 'Pink Twister', radius: 1.55, open: 1.95, mode: 0, colA: [1.0, .45, .74], colB: [.72, .42, .95], colC: [1.0, .93, .98], vmax: 21, gain: .78, pts: spiralPts },
    drop: { name: 'Sunny Drop', radius: 1.7, open: 1.75, mode: 1, colA: [1.0, .8, .2], colB: [1.0, .52, .2], colC: [1.0, .97, .85], vmax: 30, gain: .85, intro: 1.6,
      pts: function () { return [[0, 34, 6], [0, 34, 0], [0, 33.8, -5], [0, 33.1, -8], [0, 28, -11], [0, 17, -15.5], [0, 7.5, -20], [0, 3.2, -25.5], [0, 2.4, -32], [0, 4.6, -40], [0, 2.2, -48], [0, 1.4, -58], [0, 1.1, -66]]; } },
    rainbow: { name: 'Rainbow Tube', radius: 1.6, open: Math.PI, mode: 2, colA: [1, 1, 1], colB: [.95, .6, .9], colC: [1, 1, 1], vmax: 19, gain: .72, spin: [.38, .56],
      pts: function () { return [[0, 26.5, 6], [0, 26, 0], [0, 25.4, -6], [4, 24.2, -13], [11, 22.6, -15], [16, 20.6, -9], [15, 18.6, -1], [8, 16.8, 2], [0, 15.2, -2], [-5, 13.6, -9], [-4, 12, -17], [2, 10.6, -22], [10, 9.4, -22], [15, 8, -16], [13, 6.4, -9], [6, 4.8, -7], [0, 3.4, -12], [-2, 2.4, -20], [-2, 1.6, -28], [-2, 1.1, -35]]; } }
  };
  function rampY(z) { if (z >= 14) return .55; var t = z / 14; if (t < 0) t = 0; if (t > 1) t = 1; t = t * t * (3 - 2 * t); return 3.05 + (.55 - 3.05) * t; }
  function waveH(x, z, t) { return .22 * Math.sin(x * 1.2 + t * 2.2) + .15 * Math.sin(z * 1.5 - t * 3.0) + .09 * Math.sin(x * 2.1 + z * 1.2 + t * 2.5); }
  function sheetY(x, z, t) { return rampY(z) + waveH(x, z, t); }
  function surfPts() {
    var p = [];
    for (var i = 0; i <= 40; i++) { var u = i / 40, z = .8 + u * 16.5, x = Math.sin(u * Math.PI * 2) * 1.6; p.push([x, rampY(z) + .7, z]); }
    return p;
  }
  function riverPts() {
    var p = [];
    for (var i = 0; i <= 72; i++) { var u = i / 72, x = Math.sin(u * Math.PI * 2.35) * 18 + Math.sin(u * Math.PI * 5.1) * 5.2, z = 8 - u * 96, y = 2.35 - u * .55; p.push([x, y, z]); }
    return p;
  }
  var RIDES = {};
  (function () { var k; for (k in SLIDES) { SLIDES[k].kind = 'slide'; RIDES[k] = SLIDES[k]; }
    RIDES.surf = { kind: 'surf', name: "Surf's Up", vmax: 8, gain: .55, intro: 1.5, pts: surfPts };
    RIDES.river = { kind: 'river', name: 'Lazy River', radius: 2.75, open: 1.05, mode: 3, colA: [1, .85, .9], colB: [.72, .94, .9], colC: [1, .97, .92], vmax: 4.6, gain: .4, intro: 1.6, spin: [.42, .52], pts: riverPts };
  })();


  /* sample a curve at fixed arc spacing + build a frame (T, N≈up, R) per sample */
  function makeTrack(THREE, def, ds) {
    var curve = new THREE.CatmullRomCurve3(def.pts().map(function (a) { return new THREE.Vector3(a[0], a[1], a[2]); }), false, 'centripetal');
    var L = curve.getLength(), n = Math.max(8, Math.round(L / ds)), P = curve.getSpacedPoints(n), T = [], N = [], R = [], K = [], up = new THREE.Vector3(0, 1, 0);
    for (var i = 0; i <= n; i++) { var a = P[Math.max(0, i - 1)], b = P[Math.min(n, i + 1)]; T.push(b.clone().sub(a).normalize()); }
    for (i = 0; i <= n; i++) {
      var t = T[i], nn = up.clone().sub(t.clone().multiplyScalar(t.dot(up))); if (nn.lengthSq() < 1e-4) nn = N[i - 1].clone(); nn.normalize();
      N.push(nn); R.push(new THREE.Vector3().crossVectors(t, nn).normalize());
      var ta = T[Math.max(0, i - 1)], tb = T[Math.min(n, i + 1)]; K.push(tb.clone().sub(ta).multiplyScalar(1 / (2 * L / n)));
    }
    return { curve: curve, L: L, n: n, ds: L / n, P: P, T: T, N: N, R: R, K: K };
  }

  function tubeGeometry(THREE, tr, r, open, seg, closed) {
    var cols = seg + 1, pos = new Float32Array((tr.n + 1) * cols * 3), nor = new Float32Array(pos.length), uv = new Float32Array((tr.n + 1) * cols * 2), idx = [];
    for (var i = 0; i <= tr.n; i++) {
      var P = tr.P[i], N = tr.N[i], R = tr.R[i], d = i * tr.ds;
      for (var j = 0; j < cols; j++) {
        var th = -open + 2 * open * j / seg, c = Math.cos(th), s = Math.sin(th), dx = -N.x * c + R.x * s, dy = -N.y * c + R.y * s, dz = -N.z * c + R.z * s, k = (i * cols + j);
        pos[k * 3] = P.x + dx * r; pos[k * 3 + 1] = P.y + dy * r; pos[k * 3 + 2] = P.z + dz * r; nor[k * 3] = -dx; nor[k * 3 + 1] = -dy; nor[k * 3 + 2] = -dz; uv[k * 2] = j / seg; uv[k * 2 + 1] = d;
      }
    }
    for (i = 0; i < tr.n; i++) for (j = 0; j < seg; j++) { var a = i * cols + j, b = a + cols; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
    return g;
  }

  var COMMON_VS = 'varying vec2 vUv;varying vec3 vN;varying vec3 vW;void main(){vUv=uv;vN=normal;vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}';
  var TUBE_FS = [
    'uniform vec3 uA,uB,uC;uniform float uMode,uTime,uClosed;varying vec2 vUv;varying vec3 vN;varying vec3 vW;',
    'vec3 hsv(float h,float s,float v){vec3 k=clamp(abs(mod(h*6.0+vec3(0,4,2),6.0)-3.0)-1.0,0.0,1.0);return v*mix(vec3(1.0),k,s);}',
    'void main(){float a=vUv.x,d=vUv.y;vec3 col;float seg=5.0;vec3 ink=vec3(.36,.16,.36);float glow=0.0;',
    ' if(uMode<0.5){float band=step(.5,fract(d/6.0));col=mix(uA,uB,band);float e=abs(a-.5);col=mix(col,uC,smoothstep(.43,.445,e));}',
    ' else if(uMode<1.5){col=uA;float e=abs(a-.5);col=mix(col,uB,smoothstep(.27,.285,e)*(1.0-smoothstep(.33,.345,e)));col=mix(col,uC,smoothstep(.445,.455,e));',
    '  float ch=fract(d/3.0+abs(a-.5)*1.2);col=mix(col,uB*1.05,smoothstep(.0,.02,ch)*(1.0-smoothstep(.12,.14,ch))*(1.0-smoothstep(.18,.2,abs(a-.5))));seg=8.0;}',
    ' else if(uMode<2.5){seg=2.4;float b=floor(d/seg);col=hsv(fract(b*.1+.93),.58,1.0);float top=smoothstep(.36,.42,abs(a-.5));float win=step(fract(d/16.0),.32);glow=top*win;col=mix(col,vec3(1.0,.98,.9),glow);}',
    ' else {vec2 tl=vec2(floor(a*14.0),floor(d*.55));float h=fract(sin(dot(tl,vec2(17.1,91.7)))*43758.5);col=h<.25?vec3(.95,.45,.68):h<.5?vec3(.25,.78,.72):h<.75?vec3(.98,.72,.18):vec3(.45,.5,.95);vec2 f=fract(vec2(a*14.0,d*.55));float grt=smoothstep(.0,.1,f.x)*smoothstep(1.0,.9,f.x)*smoothstep(.0,.1,f.y)*smoothstep(1.0,.9,f.y);col=mix(vec3(.4,.22,.38),col,grt);col=mix(col,vec3(.12,.62,.88),1.0-smoothstep(.0,.3,abs(a-.5)));col=mix(col,vec3(.98,.93,.88),smoothstep(.40,.44,abs(a-.5)));seg=2.2;}',
    ' vec3 V=normalize(cameraPosition-vW);vec3 n=normalize(vN);bool inside=dot(n,V)>0.0;',
    ' vec3 L=normalize(vec3(.35,.85,.4));float ndl=dot(inside?n:-n,L);float sh=ndl>.25?1.0:(ndl>-.25?.84:.7);if(uClosed>.5)sh=max(sh,.8);',
    ' col*=sh;float f=fract(d/seg);col=mix(ink*1.3,col,smoothstep(.0,.025,f)*(1.0-smoothstep(.975,1.0,f))*.6+.4);',
    ' col+=vec3(.16)*(smoothstep(.01,.0,abs(abs(a-.5)-.2)));',
    ' if(uClosed<.5){float e=min(a,1.0-a);col=mix(ink,col,smoothstep(.0,.03,e));}',
    ' if(!inside)col=mix(uB,uA,.35)*.62+vec3(.05,0.,.08);',
    ' vec3 lin=pow(col,vec3(2.2))*(1.0+glow*1.6);gl_FragColor=linearToOutputTexel(vec4(lin,1.0));}'
  ].join('\n');
  var WATER_FS = [
    'uniform float uScroll,uTime;varying vec2 vUv;',
    'float h(float n){return fract(sin(n*91.7)*43758.5);}',
    'void main(){float a=vUv.x,d=vUv.y;float lane=floor(a*12.0);float s=fract(d*.22+h(lane)*5.0-uScroll*.22);float streak=smoothstep(.0,.02,s)*(1.0-smoothstep(.05+h(lane+3.0)*.06,.12,s))*step(.35,h(lane+7.0));',
    ' float ripple=.5+.5*sin(d*1.7-uScroll*1.9+sin(a*9.0+uTime*3.0)*1.2);vec3 col=mix(vec3(.2,.78,.95),vec3(.5,.92,1.0),ripple*.6);col=mix(col,vec3(.95,1.0,1.0),streak*.75);',
    ' float edge=smoothstep(.0,.18,a)*smoothstep(1.0,.82,a);float al=(.3+.45*streak)*edge;gl_FragColor=linearToOutputTexel(vec4(pow(col,vec3(2.2)),al));}'
  ].join('\n');
  var SKY_FS = [
    'varying vec2 vUv;varying vec3 vN;varying vec3 vW;uniform vec3 uSun;uniform float uDay;',
    'void main(){vec3 d=normalize(vW-cameraPosition);float y=d.y,day=uDay;',
    ' vec3 top=mix(vec3(.74,.62,.96),vec3(.42,.76,1.0),day),mid=mix(vec3(1.0,.7,.76),vec3(.78,.92,1.0),day),hor=mix(vec3(1.0,.86,.7),vec3(1.0,.95,.82),day),low=mix(vec3(.98,.78,.66),vec3(.7,.86,.62),day);',
    ' vec3 c=y>0.0?mix(mix(hor,mid,smoothstep(.0,.25,y)),top,smoothstep(.25,.8,y)):low;float s=max(dot(d,normalize(uSun)),0.0);c+=vec3(1.0,.9,.65)*(smoothstep(.985,.992,s)*(.6+.3*day)+pow(s,24.0)*.25);',
    ' gl_FragColor=linearToOutputTexel(vec4(pow(c,vec3(2.2)),1.0));}'
  ].join('\n');
  var GROUND_FS = [
    'uniform vec2 uPool;uniform float uPoolR,uTime;varying vec2 vUv;varying vec3 vN;varying vec3 vW;',
    'float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+1.0),f.x),f.y);}',
    'void main(){vec2 p=vW.xz;float dp=length(p-uPool);vec3 col;',
    ' float g=vn(p/14.0)+.5*vn(p/5.0);col=g>.95?vec3(.5,.78,.42):vec3(.62,.86,.5);',
    ' float deck=uPoolR+5.0;if(dp<deck){vec2 t=floor(p/1.6);col=mod(t.x+t.y,2.0)<1.0?vec3(1.0,.9,.8):vec3(1.0,.8,.76);}',
    ' if(dp<uPoolR){vec2 q=p*.55;float c=abs(sin(q.x+uTime*.9+sin(q.y*.8+uTime)*1.3)+sin(q.y*1.1-uTime*.7+sin(q.x*.6)*1.1));col=mix(vec3(.25,.78,.9),vec3(.45,.9,1.0),smoothstep(.5,.0,dp/uPoolR)*.4);col=mix(vec3(.9,1.0,1.0),col,smoothstep(.0,.16,c));}',
    ' if(abs(dp-uPoolR)<.35)col=vec3(.98,.98,1.0);if(abs(dp-deck)<.25)col*=.85;',
    ' float fog=smoothstep(60.0,260.0,length(p-cameraPosition.xz));col=mix(col,vec3(1.0,.84,.74),fog*.8);',
    ' gl_FragColor=linearToOutputTexel(vec4(pow(col,vec3(2.2)),1.0));}'
  ].join('\n');
  var OCEAN_VS = [
    'uniform float uTime;varying vec2 vUv;varying vec3 vN;varying vec3 vW;varying float vH;',
    'float rip(vec2 p,float t){return .22*sin(p.x*1.2+t*2.2)+.15*sin(p.y*1.5-t*3.0)+.09*sin(p.x*2.1+p.y*1.2+t*2.5);}',
    'float ramp(float z){float t=clamp(z/14.0,0.0,1.0);t=t*t*(3.0-2.0*t);return z>=14.0?0.55:mix(3.05,0.55,t);}',
    'void main(){vUv=uv;vec4 w0=modelMatrix*vec4(position,1.0);float h=ramp(w0.z)+rip(w0.xz,uTime);',
    ' vec4 w=vec4(w0.x,h,w0.z,1.0);vW=w.xyz;vH=h;',
    ' float e=.35;float hx=(ramp(w0.z)+rip(vec2(w0.x+e,w0.z),uTime))-(ramp(w0.z)+rip(vec2(w0.x-e,w0.z),uTime));',
    ' float hz=(ramp(w0.z+e)+rip(vec2(w0.x,w0.z+e),uTime))-(ramp(w0.z-e)+rip(vec2(w0.x,w0.z-e),uTime));',
    ' vN=normalize(vec3(-hx/(2.0*e),1.0,-hz/(2.0*e)));gl_Position=projectionMatrix*viewMatrix*w;}'
  ].join('\n');
  var OCEAN_FS = [
    'uniform float uTime;varying vec2 vUv;varying vec3 vN;varying vec3 vW;varying float vH;',
    'void main(){vec3 n=normalize(vN);vec3 L=normalize(vec3(.4,.95,.2));float ndl=dot(n,L);float sh=ndl>.4?1.0:(ndl>.08?.86:.74);',
    ' vec3 deep=vec3(.08,.55,.88),mid=vec3(.14,.70,.94),hi=vec3(.32,.84,.98);',
    ' float foam=.5+.5*sin(vW.x*1.2+uTime*2.2)*.35+.25*sin(vW.z*1.5-uTime*3.0);',
    ' vec3 col=mix(deep,mid,.45+.25*sin(vW.x*1.6+vW.z*1.1+uTime*2.0));col=mix(col,hi,clamp(n.y*.28,0.0,.45));col=mix(col,vec3(.85,.97,1.0),smoothstep(.75,.98,foam)*.18);col*=sh;',
    ' float spark=pow(max(dot(reflect(-L,n),normalize(cameraPosition-vW)),0.0),90.0);col+=vec3(.7,.92,1.0)*spark*.12;',
    ' col=clamp(col,vec3(.05,.35,.62),vec3(.42,.86,.98));',
    ' gl_FragColor=linearToOutputTexel(vec4(pow(col,vec3(2.2)),1.0));}'
  ].join('\n');

  function canvasTex(THREE, w, h, draw) { var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; }
  function cloudTex(THREE) {
    return canvasTex(THREE, 256, 128, function (x, w, h) {
      var blobs = [[70, 82, 34], [112, 62, 44], [160, 70, 38], [196, 86, 28], [128, 92, 34]];
      x.lineWidth = 6; x.strokeStyle = 'rgba(150,90,150,.55)'; blobs.forEach(function (b) { x.beginPath(); x.arc(b[0], b[1], b[2], 0, TAU); x.stroke(); });
      x.fillStyle = '#ffe9f2'; blobs.forEach(function (b) { x.beginPath(); x.arc(b[0], b[1] + 6, b[2], 0, TAU); x.fill(); });
      x.fillStyle = '#ffffff'; blobs.forEach(function (b) { x.beginPath(); x.arc(b[0] - 4, b[1] - 2, b[2] * .9, 0, TAU); x.fill(); });
    });
  }
  function palmTex(THREE) {
    return canvasTex(THREE, 256, 384, function (x, w, h) {
      x.lineCap = 'round'; x.lineJoin = 'round';
      x.strokeStyle = '#5b3049'; x.lineWidth = 26; x.beginPath(); x.moveTo(128, 380); x.quadraticCurveTo(110, 240, 136, 110); x.stroke();
      x.strokeStyle = '#b97a52'; x.lineWidth = 18; x.beginPath(); x.moveTo(128, 380); x.quadraticCurveTo(110, 240, 136, 110); x.stroke();
      for (var i = 0; i < 8; i++) { var a = -Math.PI / 2 + (i - 3.5) * .42, L = 100 + (i % 2) * 14; var ex = 136 + Math.cos(a) * L, ey = 110 + Math.sin(a) * L * .6 + 40;
        x.fillStyle = '#3f6a3a'; x.beginPath(); x.moveTo(136, 108); x.quadraticCurveTo((136 + ex) / 2, Math.min(110, ey) - 40, ex, ey); x.quadraticCurveTo((136 + ex) / 2, Math.min(110, ey) - 10, 136, 116); x.fill();
        x.fillStyle = i % 2 ? '#6fbf5a' : '#58a84c'; x.beginPath(); x.moveTo(136, 110); x.quadraticCurveTo((136 + ex) / 2, Math.min(110, ey) - 34, ex - 4, ey - 3); x.quadraticCurveTo((136 + ex) / 2, Math.min(110, ey) - 14, 136, 114); x.fill(); }
    });
  }
  function dotTex(THREE) { return canvasTex(THREE, 64, 64, function (x) { var g = x.createRadialGradient(32, 32, 0, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.55, 'rgba(220,250,255,.95)'); g.addColorStop(1, 'rgba(160,230,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(32, 32, 30, 0, TAU); x.fill(); }); }

  function create(THREE, renderer, opts) {
    opts = opts || {}; var K = root.GhaliaSceneKit, LOW = opts.quality === 'low', audio = opts.audio || null, ov = opts.overlay || null, ox = ov ? ov.getContext('2d') : null;
    var scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, .1, 900);
    var fx = K ? K.createPostFX(THREE, renderer, scene, camera, { quality: opts.quality, bloom: .32, radius: .45, threshold: .93, vignette: .5, grain: .04 }) : null;
    var tracks = {}, cur = null, built = null;
    var skyMat = new THREE.ShaderMaterial({ vertexShader: COMMON_VS, fragmentShader: SKY_FS, side: THREE.BackSide, depthWrite: false, uniforms: { uSun: { value: new THREE.Vector3(-.4, .35, -.8) }, uDay: { value: 0 } } });
    var sky = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), skyMat); sky.renderOrder = -10; scene.add(sky);
    var groundMat = new THREE.ShaderMaterial({ vertexShader: COMMON_VS, fragmentShader: GROUND_FS, uniforms: { uPool: { value: new THREE.Vector2() }, uPoolR: { value: 22 }, uTime: { value: 0 } } });
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), groundMat); ground.rotation.x = -Math.PI / 2; scene.add(ground);
    var hemi = new THREE.HemisphereLight(0xfff0f6, 0xc89a8a, 1.0); scene.add(hemi); var sun = new THREE.DirectionalLight(0xffffff, .8); sun.position.set(-20, 40, 30); scene.add(sun);
    var grad = new THREE.DataTexture(new Uint8Array([120, 170, 255]), 3, 1, THREE.LuminanceFormat); grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.needsUpdate = true;
    var postMat = new THREE.MeshToonMaterial({ color: 0xd9c6ee, gradientMap: grad }), inkMat = new THREE.MeshBasicMaterial({ color: 0x5b3049, side: THREE.BackSide });
    var postGeo = new THREE.CylinderGeometry(.32, .42, 1, 8); postGeo.translate(0, .5, 0);
    var decor = new THREE.Group(); scene.add(decor);
    var cTex = cloudTex(THREE), pTex = palmTex(THREE), dTex = dotTex(THREE);
    for (var i = 0; i < (LOW ? 16 : 26); i++) { var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cTex, depthWrite: false, fog: false })); var a = hash(i + 3) * TAU, rr = 160 + hash(i + 9) * 200; sp.position.set(Math.cos(a) * rr, 45 + hash(i + 1) * 70, Math.sin(a) * rr); sp.scale.set(70 + hash(i) * 50, 35 + hash(i) * 25, 1); scene.add(sp); }
    // spray particles (world space)
    var NP = LOW ? 70 : 140, sprayGeo = new THREE.BufferGeometry(), sprayPos = new Float32Array(NP * 3), sprayVel = new Float32Array(NP * 3), sprayLife = new Float32Array(NP);
    for (i = 0; i < NP; i++) sprayPos[i * 3 + 1] = -999; sprayGeo.setAttribute('position', new THREE.BufferAttribute(sprayPos, 3));
    var spray = new THREE.Points(sprayGeo, new THREE.PointsMaterial({ map: dTex, size: .16, transparent: true, depthWrite: false, opacity: .95, color: 0xffffff })); spray.frustumCulled = false; scene.add(spray);
    var loader = new THREE.TextureLoader(), actTex = {}, fpImg = {};
    function loadTex(name, ext) { var t = loader.load('img/pool/' + name + (ext || '.webp')); t.encoding = THREE.sRGBEncoding; return t; }
    ['fountain', 'khala-cheer', 'khala-laugh', 'khala-happy', 'khala-idle', 'khala-ring', 'tipping-bucket', 'ice-cream-kiosk', 'rainbow-arch', 'umbrella'].forEach(function (k) { actTex[k] = loadTex(k); });
    actTex.backdrop = loadTex('park-backdrop', '.jpg');
    [0, 1, 2, 3].forEach(function (i) { actTex['kids-surf-' + i] = loadTex('kids-surf-' + i); });
    [0, 1, 2].forEach(function (i) { actTex['kids-rings-' + i] = loadTex('kids-rings-' + i); });
    [0, 1].forEach(function (i) { actTex['kids-guns-' + i] = loadTex('kids-guns-' + i); });
    [['surf', 'img/pool/surf-fp.webp'], ['river', 'img/pool/river-fp.webp'], ['khala', 'img/pool/khala-ring.webp']].forEach(function (p) { var im = new Image(); im.onload = function () { fpImg[p[0]] = im; }; im.src = p[1]; });

    function clearDecor() {
      ground.visible = true; if (skyMat.uniforms.uDay) skyMat.uniforms.uDay.value = 0; if (skyMat.uniforms.uSun) skyMat.uniforms.uSun.value.set(-.4, .35, -.8); groundMat.uniforms.uPoolR.value = 22;
      while (decor.children.length) { var c = decor.children.pop(); if (c.geometry && c.geometry !== postGeo) c.geometry.dispose(); if (c.material && c.material !== postMat && c.material !== inkMat) c.material.dispose(); }
    }
    function sliceTrack(tr, s0, s1) {
      var i0 = Math.max(0, Math.floor(s0 / tr.ds)), i1 = Math.min(tr.n, Math.ceil(s1 / tr.ds)); if (i1 - i0 < 2) i1 = Math.min(tr.n, i0 + 3);
      return { P: tr.P.slice(i0, i1 + 1), T: tr.T.slice(i0, i1 + 1), N: tr.N.slice(i0, i1 + 1), R: tr.R.slice(i0, i1 + 1), K: tr.K.slice(i0, i1 + 1), n: i1 - i0, ds: tr.ds, L: (i1 - i0) * tr.ds };
    }
    function addPalms(origin, n, r0, r1, seed) {
      for (var k = 0; k < n; k++) { var ang = hash(k * 7 + seed) * TAU, rad = r0 + hash(k * 3 + seed + 2) * (r1 - r0), s = new THREE.Sprite(new THREE.SpriteMaterial({ map: pTex, transparent: true, depthWrite: false })); s.center.set(.5, 0); s.position.set(origin.x + Math.cos(ang) * rad, 0, origin.z + Math.sin(ang) * rad); var sc = 9 + hash(k + seed) * 7; s.scale.set(sc * .66, sc, 1); decor.add(s); }
    }
    function farFromTrack(x, z, tr, minD) {
      if (!tr) return true; var md = minD * minD;
      for (var i = 0; i <= tr.n; i += 2) { var dx = tr.P[i].x - x, dz = tr.P[i].z - z; if (dx * dx + dz * dz < md) return false; }
      return true;
    }
    function addPalmsAway(origin, n, r0, r1, seed, tr, minD) {
      var added = 0, k = 0;
      while (added < n && k < n * 6) {
        var ang = hash(k * 7 + seed) * TAU, rad = r0 + hash(k * 3 + seed + 2) * (r1 - r0);
        var x = origin.x + Math.cos(ang) * rad, z = origin.z + Math.sin(ang) * rad; k++;
        if (!farFromTrack(x, z, tr, minD || 10)) continue;
        var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: pTex, transparent: true, depthWrite: false }));
        s.center.set(.5, 0); s.position.set(x, 0, z); var sc = 9 + hash(k + seed) * 7; s.scale.set(sc * .66, sc, 1); decor.add(s); added++;
      }
    }
    function addSprite(tex, pos, w, h, bottom) {
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, alphaTest: .12 }));
      sp.center.set(.5, bottom ? 0 : .5); sp.position.copy(pos); sp.scale.set(w, h, 1); decor.add(sp); return sp;
    }

    function buildSlide(id) {
      var def = SLIDES[id]; clearDecor();
      var tr = tracks[id] || (tracks[id] = makeTrack(THREE, def, LOW ? .7 : .5));
      var seg = def.mode === 2 ? (LOW ? 20 : 30) : (LOW ? 14 : 22);
      var tube = new THREE.Mesh(tubeGeometry(THREE, tr, def.radius, def.open, seg, def.mode === 2), new THREE.ShaderMaterial({ vertexShader: COMMON_VS, fragmentShader: TUBE_FS, side: THREE.DoubleSide,
        uniforms: { uA: { value: new THREE.Vector3().fromArray(def.colA) }, uB: { value: new THREE.Vector3().fromArray(def.colB) }, uC: { value: new THREE.Vector3().fromArray(def.colC) }, uMode: { value: def.mode }, uTime: { value: 0 }, uClosed: { value: def.mode === 2 ? 1 : 0 } } }));
      tube.frustumCulled = false; decor.add(tube);
      var water = new THREE.Mesh(tubeGeometry(THREE, tr, def.radius * .975, .62, 10, false), new THREE.ShaderMaterial({ vertexShader: COMMON_VS, fragmentShader: WATER_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uScroll: { value: 0 }, uTime: { value: 0 } } }));
      water.frustumCulled = false; water.renderOrder = 2; decor.add(water);
      // posts + ink outline
      var step = Math.max(1, Math.round(7 / tr.ds));
      for (var k = step; k < tr.n - 2; k += step) { if (Math.abs(tr.T[k].y) > .45) continue; var P = tr.P[k], hgt = P.y - def.radius / Math.max(.5, tr.N[k].y) - .35; if (hgt < .6) continue;
        var m = new THREE.Mesh(postGeo, postMat); m.position.set(P.x, 0, P.z); m.scale.set(1, hgt, 1); decor.add(m);
        var o = new THREE.Mesh(postGeo, inkMat); o.position.copy(m.position); o.scale.set(1.25, hgt, 1.25); decor.add(o); }
      // start tower deck
      var P0 = tr.P[0], deck = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, .6, 20), new THREE.MeshToonMaterial({ color: id === 'drop' ? 0xffb43a : id === 'spiral' ? 0xff79c0 : 0x8fd8ff, gradientMap: grad }));
      deck.position.set(P0.x, P0.y - def.radius - .4, P0.z); decor.add(deck);
      // palms around
      var end = tr.P[tr.n], tEnd = tr.T[tr.n], pool = end.clone().add(tEnd.clone().setY(0).normalize().multiplyScalar(12)); groundMat.uniforms.uPool.value.set(pool.x, pool.z);
      for (k = 0; k < (LOW ? 18 : 34); k++) { var ang = hash(k * 7 + 1) * TAU, rad = 30 + hash(k * 3 + 2) * 120, s = new THREE.Sprite(new THREE.SpriteMaterial({ map: pTex })); s.center.set(.5, 0); s.position.set(pool.x + Math.cos(ang) * rad, 0, pool.z + Math.sin(ang) * rad); var sc = 9 + hash(k) * 7; s.scale.set(sc * .66, sc, 1); decor.add(s); }
      built = { id: id, def: def, tr: tr, tube: tube, water: water, pool: pool, kind: 'slide' };
    }

    function buildSurf() {
      var def = RIDES.surf; clearDecor(); ground.visible = true; skyMat.uniforms.uDay.value = 1;
      if (skyMat.uniforms.uSun) skyMat.uniforms.uSun.value.set(-.2, .7, .4);
      var tr = tracks.surf || (tracks.surf = makeTrack(THREE, def, LOW ? .7 : .5));
      groundMat.uniforms.uPool.value.set(0, 16); groundMat.uniforms.uPoolR.value = 7;
      var water = new THREE.Mesh(new THREE.PlaneGeometry(11, 22, LOW ? 40 : 70, LOW ? 70 : 110).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ vertexShader: OCEAN_VS, fragmentShader: OCEAN_FS, uniforms: { uTime: { value: 0 } } }));
      water.position.set(0, 0, 8); water.frustumCulled = false; decor.add(water);
      var floor = new THREE.Mesh(new THREE.PlaneGeometry(11, 22, 20, 30).rotateX(-Math.PI / 2), new THREE.MeshToonMaterial({ color: 0x2a9fdb, gradientMap: grad }));
      floor.position.set(0, 0, 8); floor.frustumCulled = false; decor.add(floor);
      (function () { var p = floor.geometry.attributes.position; for (var i = 0; i < p.count; i++) { var z = p.getZ(i) + 8; p.setY(i, rampY(z) - 0.22); } p.needsUpdate = true; floor.geometry.computeVertexNormals(); })();
      // tiled basin walls
      function wall(x, y, z, w, h, d, col) { var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshToonMaterial({ color: col, gradientMap: grad })); m.position.set(x, y, z); decor.add(m); return m; }
      wall(0, .2, 8, 12.4, .4, 22, 0x3db7e6); wall(-6.3, 1.15, 8, .5, 2.4, 22, 0xffd36a); wall(6.3, 1.15, 8, .5, 2.4, 22, 0x7ad7e8); wall(0, 1.15, -3.1, 13, 2.4, .5, 0xff9ad4); wall(0, .7, 19.2, 13, 1.5, .5, 0x5ec8e8);
      // colorful railings
      for (var side = -1; side <= 1; side += 2) for (var k = 0; k < 10; k++) { var z = k * 2.1 - 1; var post = new THREE.Mesh(postGeo, new THREE.MeshToonMaterial({ color: (k % 2 ? 0xff79c0 : 0x5ec8e8), gradientMap: grad })); post.position.set(side * 5.9, .6, z); post.scale.set(.55, 1.3, .55); decor.add(post); }
      // park backdrops — land and slides all around, never an ocean
      function backdrop(x, z, rotY, w, h) { var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: actTex.backdrop })); m.position.set(x, h * .42, z); m.rotation.y = rotY; decor.add(m); }
      backdrop(0, 26, Math.PI, 42, 18); backdrop(-22, 10, Math.PI * .55, 32, 16); backdrop(22, 10, -Math.PI * .55, 32, 16);
      // Khala cheers from the right deck (repositioned each frame so she stays in view)
      var khala = addSprite(actTex['khala-cheer'], new THREE.Vector3(6.4, 0, 6), 2.4, 4.5, true);
      // kids waiting in line along both decks + one little rider in a parallel lane
      addSprite(actTex['kids-surf-0'], new THREE.Vector3(-6.5, 0, 3.2), 1.7, 2.8, true);
      addSprite(actTex['kids-surf-2'], new THREE.Vector3(-6.6, 0, 8.5), 1.5, 2.6, true);
      addSprite(actTex['kids-surf-3'], new THREE.Vector3(-6.5, 0, 13.2), 1.6, 2.7, true);
      addSprite(actTex['kids-surf-0'], new THREE.Vector3(6.5, 0, 4.0), 1.5, 2.6, true);
      addSprite(actTex['kids-surf-2'], new THREE.Vector3(6.6, 0, 11.5), 1.5, 2.6, true);
      var riderKid = addSprite(actTex['kids-surf-1'], new THREE.Vector3(-2.5, sheetY(-2.5, 5, 0), 5), 1.9, 1.6, true);
      addSprite(actTex.umbrella, new THREE.Vector3(-9.5, 0, 3), 3.4, 3.6, true);
      addSprite(actTex.umbrella, new THREE.Vector3(10.2, 0, 12), 3.2, 3.4, true);
      addPalms(new THREE.Vector3(0, 0, 22), LOW ? 8 : 12, 10, 28, 3);
      addPalms(new THREE.Vector3(-16, 0, 8), 6, 4, 12, 17);
      addPalms(new THREE.Vector3(16, 0, 8), 6, 4, 12, 23);
      built = { id: 'surf', def: def, tr: tr, ocean: water, kind: 'surf', khala: khala, riderKid: riderKid, khalaMaps: [actTex['khala-cheer'], actTex['khala-laugh'], actTex['khala-happy']] };
    }

    function buildRiver() {
      var def = RIDES.river; clearDecor(); skyMat.uniforms.uDay.value = 1;
      if (skyMat.uniforms.uSun) skyMat.uniforms.uSun.value.set(-.2, .7, .4);
      var tr = tracks.river || (tracks.river = makeTrack(THREE, def, LOW ? .7 : .5));
      var seg = LOW ? 16 : 24;
      var tube = new THREE.Mesh(tubeGeometry(THREE, tr, def.radius, def.open, seg, false), new THREE.ShaderMaterial({ vertexShader: COMMON_VS, fragmentShader: TUBE_FS, side: THREE.DoubleSide, uniforms: { uA: { value: new THREE.Vector3().fromArray(def.colA) }, uB: { value: new THREE.Vector3().fromArray(def.colB) }, uC: { value: new THREE.Vector3().fromArray(def.colC) }, uMode: { value: 3 }, uTime: { value: 0 }, uClosed: { value: 0 } } }));
      tube.frustumCulled = false; decor.add(tube);
      var water = new THREE.Mesh(tubeGeometry(THREE, tr, def.radius * .97, .7, 10, false), new THREE.ShaderMaterial({ vertexShader: COMMON_VS, fragmentShader: WATER_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uScroll: { value: 0 }, uTime: { value: 0 } } }));
      water.frustumCulled = false; water.renderOrder = 2; decor.add(water);
      function at(s) { var o = F(); frameAt(tr, clamp(s, 0, tr.L), o); return o; }
      function bank(s, side, tex, w, h) { var f = at(s * tr.L); return addSprite(tex, f.P.clone().addScaledVector(f.R, side).setY(0), w, h, true); }
      // bright rainbow sun-arch you pass under (open, never a dark tunnel)
      var aF = at((def.spin[0] + def.spin[1]) * .5 * tr.L);
      var arch = new THREE.Mesh(new THREE.PlaneGeometry(13, 8.5), new THREE.MeshBasicMaterial({ map: actTex['rainbow-arch'], transparent: true, alphaTest: .12, side: THREE.DoubleSide, depthWrite: false }));
      arch.position.copy(aF.P).setY(3.6); arch.lookAt(aF.P.clone().add(aF.T)); decor.add(arch);
      // tipping bucket, fountain, kiosk, water-gun kids
      bank(.28, 7.2, actTex['tipping-bucket'], 5.5, 7.4);
      bank(.62, -6.6, actTex.fountain, 6.2, 7.6);
      bank(.78, 7.6, actTex['ice-cream-kiosk'], 6.4, 6.0);
      bank(.18, -6.8, actTex['kids-guns-0'], 2.2, 3.2);
      bank(.18, -8.2, actTex['kids-guns-1'], 2.0, 3.0);
      bank(.12, 7.0, actTex.umbrella, 3.6, 3.8);
      bank(.5, -7.4, actTex.umbrella, 3.4, 3.6);
      bank(.88, -7.2, actTex.umbrella, 3.5, 3.7);
      // kids floating in rings along the river
      var bobs = [];
      [[.14, 3.4, 0], [.34, -3.6, 1], [.48, 3.5, 2], [.66, -3.3, 0], [.84, 3.6, 1]].forEach(function (row) {
        var f = at(row[0] * tr.L), sp = addSprite(actTex['kids-rings-' + row[2]], f.P.clone().addScaledVector(f.R, row[1]).setY(f.P.y - 1.1), 1.9, 2.3, true);
        bobs.push({ spr: sp, y0: sp.position.y, ph: row[0] * 8 });
      });
      // a colorful slide tube passing overhead
      var oF = at(.56 * tr.L);
      var slide = new THREE.Mesh(new THREE.TorusGeometry(5.2, .55, 8, 20, Math.PI), new THREE.MeshToonMaterial({ color: 0xff8ac8, gradientMap: grad }));
      slide.position.copy(oF.P).setY(oF.P.y + 3.4); slide.rotation.set(0, Math.atan2(oF.T.x, oF.T.z), 0); decor.add(slide);
      var end = tr.P[tr.n], tEnd = tr.T[tr.n], pool = end.clone().add(tEnd.clone().setY(0).normalize().multiplyScalar(10)); pool.y = 0;
      groundMat.uniforms.uPool.value.set(pool.x, pool.z); groundMat.uniforms.uPoolR.value = 14;
      var start = tr.P[0];
      var dock = new THREE.Mesh(new THREE.BoxGeometry(6, .5, 5), new THREE.MeshToonMaterial({ color: 0xffc4d8, gradientMap: grad }));
      dock.position.set(start.x, start.y - def.radius - .15, start.z + 2.2); decor.add(dock);
      addPalmsAway(pool, LOW ? 14 : 22, 18, 70, 7, tr, 12);
      addPalmsAway(new THREE.Vector3(tr.P[Math.floor(tr.n / 3)].x, 0, tr.P[Math.floor(tr.n / 3)].z), LOW ? 8 : 12, 20, 44, 19, tr, 12);
      // park views around the river
      function backdrop(x, z, rotY, w, h) { var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: actTex.backdrop })); m.position.set(x, h * .4, z); m.rotation.y = rotY; decor.add(m); }
      var mid = tr.P[Math.floor(tr.n / 2)];
      backdrop(mid.x + 28, mid.z, -Math.PI * .55, 36, 16); backdrop(mid.x - 28, mid.z, Math.PI * .55, 36, 16); backdrop(pool.x, pool.z - 22, 0, 40, 17);
      built = { id: 'river', def: def, tr: tr, tube: tube, water: water, pool: pool, kind: 'river', bobs: bobs, marks: [{ at: .28, id: 'bucket' }, { at: .42, id: 'arch' }, { at: .62, id: 'fountain' }] };
    }


    function frameAt(tr, s, out) { var f = clamp(s / tr.ds, 0, tr.n - 1e-4), i = Math.floor(f), t = f - i; out.P.lerpVectors(tr.P[i], tr.P[i + 1], t); out.T.lerpVectors(tr.T[i], tr.T[i + 1], t).normalize(); out.N.lerpVectors(tr.N[i], tr.N[i + 1], t).normalize(); out.R.lerpVectors(tr.R[i], tr.R[i + 1], t).normalize(); out.K.lerpVectors(tr.K[i], tr.K[i + 1], t); return out; }
    function F() { return { P: new THREE.Vector3(), T: new THREE.Vector3(), N: new THREE.Vector3(), R: new THREE.Vector3(), K: new THREE.Vector3() }; }
    var fa = F(), fb = F(), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), eye = new THREE.Vector3(), look = new THREE.Vector3(), upv = new THREE.Vector3();
    var st = { active: false, phase: 'idle', t: 0, s: 0, v: 0, th: 0, thv: 0, spin: 0, lean: 0, boost: false, fovKick: 0, shake: 0, y0: 0, vel: new THREE.Vector3(), under: 0, lines: [], bub: [], dropFired: false, spinFired: false, ticks: 0, flash: 0 };
    var api = { scene: scene, camera: camera, slides: SLIDES, get active() { return st.active; }, get phase() { return st.phase; }, get speed() { return st.v; }, state: st };
    function emit(t, d) { if (opts.onEvent) try { opts.onEvent(t, d || {}); } catch (e) { console.error(e); } }

    api.start = function (id) {
      if (!RIDES[id]) id = 'spiral'; var kind = RIDES[id].kind || 'slide'; if (kind === 'surf') buildSurf(); else if (kind === 'river') buildRiver(); else buildSlide(id); cur = id;
      st.active = true; st.phase = 'intro'; st.t = 0; st.s = .5; st.v = 0; st.th = 0; st.thv = 0; st.spin = 0; st.lean = 0; st.fovKick = 0; st.under = 0; st.dropFired = false; st.spinFired = false; st.air = 0; st.ticks = 0; st.flash = kind === 'slide' ? 1 : .12; st.bub.length = 0; st.kind = kind; st.lat = 0; st.waveT = 2.4; st.hPrev = 0; st.fired = {}; st.roll = 0; if (fx && fx.bloom) { fx.bloom.strength = kind === 'slide' ? .32 : 0; fx.bloom.threshold = kind === 'slide' ? .93 : 1; }
      st.y0 = built.tr.P[0].y; for (var i = 0; i < NP; i++) { sprayLife[i] = 0; sprayPos[i * 3 + 1] = -999; }
      api.resize(innerWidth, innerHeight); if (audio) { audio.rushStart(); audio.rushLevel(kind === 'river' ? .08 : .12, 0); if (kind !== 'slide' && audio.parkStart) audio.parkStart(); else if (audio.parkStop) audio.parkStop(); }
      emit('start', { id: id }); return built.def;
    };
    api.lean = function (x) { st.lean = clamp(x, -1, 1); };
    api.boost = function (b) { if (b && !st.boost && audio && st.phase === 'ride') audio.wheee(); st.boost = !!b; };
    api.resize = function (w, h) { camera.aspect = w / h; camera.updateProjectionMatrix(); if (fx) fx.setSize(w, h); if (ov) { var dpr = Math.min(2, root.devicePixelRatio || 1); ov.width = w * dpr; ov.height = h * dpr; ov.style.width = w + 'px'; ov.style.height = h + 'px'; if (ox) ox.setTransform(dpr, 0, 0, dpr, 0, 0); } };
    api.skip = function () { if (st.active && st.phase !== 'under' && st.phase !== 'soft' && built) { st.s = built.tr.L - .1; st.phase = 'ride'; } };
    api.seek = function (q) { if (!built || !st.active) return; st.s = built.tr.L * clamp(q, 0, .98); st.phase = 'ride'; st.t = 0; st.flash = 0; };

    function spawnSpray(n, basePos, fwd, side, v) {
      for (var i = 0, made = 0; i < NP && made < n; i++) { if (sprayLife[i] > 0) continue; made++;
        var lat = (Math.random() * 2 - 1) * .9; sprayPos[i * 3] = basePos.x + side.x * lat + fwd.x * (2 + Math.random() * 5); sprayPos[i * 3 + 1] = basePos.y + side.y * lat + fwd.y * (2 + Math.random() * 5) + Math.random() * .3; sprayPos[i * 3 + 2] = basePos.z + side.z * lat + fwd.z * (2 + Math.random() * 5);
        sprayVel[i * 3] = side.x * lat * 3 + fwd.x * v * .55; sprayVel[i * 3 + 1] = 2 + Math.random() * 3 + fwd.y * v * .55; sprayVel[i * 3 + 2] = side.z * lat * 3 + fwd.z * v * .55; sprayLife[i] = .5 + Math.random() * .5; }
    }
    function updateSpray(dt) { for (var i = 0; i < NP; i++) { if (sprayLife[i] <= 0) continue; sprayLife[i] -= dt; sprayVel[i * 3 + 1] -= 9.8 * dt; sprayPos[i * 3] += sprayVel[i * 3] * dt; sprayPos[i * 3 + 1] += sprayVel[i * 3 + 1] * dt; sprayPos[i * 3 + 2] += sprayVel[i * 3 + 2] * dt; if (sprayLife[i] <= 0) sprayPos[i * 3 + 1] = -999; } sprayGeo.attributes.position.needsUpdate = true; }

    function placeCam(dt, baseFov, turn) {
      var shk = (.012 + .05 * clamp(st.v / 20, 0, 1.3)) * (st.phase === 'ride' ? 1 : .2) + st.fovKick * .05, tt = performance.now() / 1000;
      eye.x += vnoise(tt * 23) * shk; eye.y += vnoise(tt * 19 + 7) * shk; eye.z += vnoise(tt * 21 + 3) * shk;
      camera.position.copy(eye); camera.up.copy(upv); camera.lookAt(look);
      camera.fov = damp(camera.fov, baseFov + clamp(st.v, 0, 25) * .4 + st.fovKick * 18 + (st.boost ? 6 : 0), 6, dt); camera.updateProjectionMatrix();
      if (audio) audio.rushLevel(st.v / (st.kind === 'river' ? 8 : 20), turn || 0);
    }
    function goUnder(dt, baseFov) {
      if (st.phase === 'soft') {
        var u = st.t, dip = Math.sin(Math.min(1, u) * Math.PI) * .4;
        eye.y = (st.softY || eye.y) - dip; upv.set(0, 1, 0);
        camera.position.copy(eye); camera.up.copy(upv);
        camera.lookAt(look.copy(eye).add(tmp.set(st.vel.x || 0, -.2, st.vel.z || 1).normalize().multiplyScalar(5)));
        camera.fov = damp(camera.fov, baseFov + 4, 4, dt); camera.updateProjectionMatrix();
        if (st.t > 1.05) { st.active = false; st.phase = 'idle'; if (audio && audio.parkStop) audio.parkStop(); emit('done', { id: cur }); }
      } else if (st.phase === 'launch' || st.phase === 'wipe') {
        st.vel.y -= 9.8 * dt; eye.addScaledVector(st.vel, dt); st.roll = (st.roll || 0) + (st.kind === 'surf' ? 3.2 : 1.1) * dt;
        upv.set(Math.sin(st.roll) * .8, Math.cos(st.roll), 0).normalize();
        camera.position.copy(eye); camera.up.copy(upv); camera.lookAt(look.copy(eye).add(tmp.copy(st.vel).normalize().multiplyScalar(5)));
        camera.fov = damp(camera.fov, baseFov + (st.kind === 'surf' ? 22 : 10), 6, dt); camera.updateProjectionMatrix();
        var waterY = st.kind === 'surf' ? sheetY(eye.x, eye.z, st.waveT) : .25;
        if (eye.y < waterY + .15 || st.t > (st.kind === 'river' ? 1.1 : 1.4)) { st.phase = 'under'; st.t = 0; st.under = 0; if (audio) { audio.rushStop(); audio.splash(); } emit('splash', { id: cur }); spawnBubbles(); }
      } else if (st.phase === 'under') {
        st.under = st.t; st.vel.multiplyScalar(Math.exp(-4 * dt)); eye.addScaledVector(st.vel, dt); eye.y = Math.min(eye.y, (st.kind === 'surf' ? sheetY(eye.x, eye.z, st.waveT) : 0) - .6);
        camera.position.copy(eye); camera.up.set(0, 1, 0); camera.lookAt(look.copy(eye).add(tmp.set(st.vel.x, 0, st.vel.z).normalize().multiplyScalar(5)).setY(eye.y - 1.5)); camera.fov = damp(camera.fov, baseFov, 3, dt); camera.updateProjectionMatrix();
        if (st.t > .95) { st.active = false; st.phase = 'idle'; emit('done', { id: cur }); }
      }
    }
    function beginSoft(dt) {
      st.phase = 'soft'; st.t = 0; st.softY = eye.y; st.vel = st.vel || tmp.set(0, 0, 1);
      if (audio) { audio.rushStop(); audio.splash(); audio.giggle(6); if (audio.parkStop) { /* keep park bed a moment */ } }
      emit('splash', { id: cur }); spawnBubbles();
    }
    function updateSurf(dt, baseFov) {
      var b = built, def = b.def, tr = b.tr; st.waveT += dt; if (b.ocean) b.ocean.material.uniforms.uTime.value = st.waveT;
      if (b.khala && b.khalaMaps) { var km = b.khalaMaps[Math.floor(st.waveT / .7) % b.khalaMaps.length]; if (b.khala.material.map !== km) { b.khala.material.map = km; } }
      if (b.khala || b.riderKid) {
        frameAt(tr, Math.min(tr.L, st.s + 4.2), fa);
        if (b.khala) { b.khala.position.set(fa.P.x + fa.R.x * 5.7, 0, fa.P.z + fa.R.z * 5.7); }
        if (b.riderKid) { var rx = fa.P.x - fa.R.x * 2.5, rz = fa.P.z - fa.R.z * 2.5; b.riderKid.position.set(rx, sheetY(rx, rz, st.waveT) + .05, rz); }
      }
      var turn = 0;
      if (st.phase === 'intro') {
        st.v = damp(st.v, 3.2, 2, dt); st.s += st.v * dt * .5;
        if (st.t > (def.intro || 1.5)) { st.phase = 'ride'; st.t = 0; if (audio) { audio.whoosh(); audio.say('This is so fun!'); } }
      } else if (st.phase === 'ride') {
        frameAt(tr, st.s, fa);
        var px = fa.P.x + (st.lat || 0) * fa.R.x, pz = fa.P.z + (st.lat || 0) * fa.R.z, h = sheetY(px, pz, st.waveT);
        var vt = Math.min(def.vmax, 4.2 + Math.max(0, (fa.P.y - .8) * .6)) * (st.boost ? 1.12 : 1);
        st.v = damp(st.v, vt, 1.8, dt); st.s += st.v * dt;
        st.lat = damp(st.lat || 0, st.lean * 2.2, 3.2, dt); st.th = damp(st.th, st.lean * .35, 5, dt); turn = Math.abs(st.lean) * .4;
        st.fovKick = Math.max(0, st.fovKick - dt * 1.2);
        if (Math.random() < dt * .2 && audio) audio.giggle(1);
        if (Math.random() < dt * (LOW ? 14 : 24) * clamp(st.v / 8, .2, 1)) spawnSpray(2, tmp.set(px, h, pz), fa.T, fa.R, st.v);
        if (st.s >= tr.L - .12) { frameAt(tr, tr.L, fa); eye.set(fa.P.x, sheetY(fa.P.x, fa.P.z, st.waveT) + 1.05, fa.P.z); st.vel.copy(fa.T).multiplyScalar(Math.max(st.v, 3)); beginSoft(); }
      }
      if (st.phase === 'intro' || st.phase === 'ride') {
        frameAt(tr, st.s, fa); var px = fa.P.x + (st.lat || 0) * fa.R.x, pz = fa.P.z + (st.lat || 0) * fa.R.z, h = sheetY(px, pz, st.waveT);
        eye.set(px, h + 1.08, pz); upv.set(-Math.sin(st.th) * .4, 1, 0).normalize();
        frameAt(tr, Math.min(tr.L, st.s + 6), fb);
        look.set(fb.P.x + (st.lat || 0) * fb.R.x, sheetY(fb.P.x, fb.P.z, st.waveT) + .55, fb.P.z + (st.lat || 0) * fb.R.z);
        placeCam(dt, baseFov - 4, turn);
      } else goUnder(dt, baseFov);
    }
    function updateRiver(dt, baseFov) {
      var b = built, def = b.def, tr = b.tr, turn = 0; st.waveT += dt;
      if (b.tube) b.tube.material.uniforms.uTime.value += dt; if (b.water) { b.water.material.uniforms.uTime.value += dt; b.water.material.uniforms.uScroll.value += st.v * dt * .5; }
      groundMat.uniforms.uTime.value += dt;
      (b.bobs || []).forEach(function (o) { o.spr.position.y = o.y0 + Math.sin(st.waveT * 2.1 + o.ph) * .12; });
      var q = st.s / tr.L, inArch = def.spin && q > def.spin[0] && q < def.spin[1];
      if (st.phase === 'intro') {
        st.v = damp(st.v, 2.0, 1.6, dt); st.s += st.v * dt * .4;
        if (st.t > (def.intro || 1.6)) { st.phase = 'ride'; st.t = 0; if (audio) { audio.whoosh(); audio.say('Hi, Khala! So relaxing!'); } }
      } else if (st.phase === 'ride') {
        var vt = (3.0 + (st.boost ? 1.1 : 0)); st.v = damp(st.v, Math.min(def.vmax, vt), 1.2, dt); st.s += st.v * dt;
        st.spin = damp(st.spin, Math.sin(st.waveT * .7) * .12, 1.5, dt); st.th = damp(st.th, st.lean * .35, 3, dt); turn = Math.abs(st.lean) * .25;
        if (b.marks) b.marks.forEach(function (m) { if (!st.fired[m.id] && q >= m.at) { st.fired[m.id] = 1; emit('mark', { id: m.id }); frameAt(tr, st.s, fa); spawnSpray(10, fa.P, fa.T, fa.R, 5); if (audio) { if (m.id === 'bucket') { audio.splash(); audio.say('Here comes the water!'); audio.giggle(4); } else if (m.id === 'arch') { audio.giggle(3); } else { audio.bubbles(10); audio.giggle(3); } } } });
        if (Math.random() < dt * (LOW ? 8 : 14)) { frameAt(tr, st.s, fa); spawnSpray(1, fa.P, fa.T, fa.R, st.v + 1); }
        if (st.s >= tr.L - .12) { frameAt(tr, tr.L, fa); eye.copy(fa.P).addScaledVector(fa.N, -(def.radius - 1.15)); st.vel.copy(fa.T).multiplyScalar(Math.max(st.v, 2)); beginSoft(); }
      }
      if (st.phase === 'intro' || st.phase === 'ride') {
        frameAt(tr, st.s, fa);
        var bob = .1 * Math.sin(st.waveT * 2.15) + .04 * Math.sin(st.waveT * 3.4 + 1.2);
        var th = st.th + st.spin, c = Math.cos(th), s = Math.sin(th);
        var dir = tmp.set(0, 0, 0).addScaledVector(fa.N, -c).addScaledVector(fa.R, s);
        eye.copy(fa.P).addScaledVector(dir, def.radius - 1.2 + bob); upv.copy(dir).negate();
        frameAt(tr, Math.min(tr.L, st.s + 6.5), fb);
        var dir2 = tmp2.set(0, 0, 0).addScaledVector(fb.N, -c).addScaledVector(fb.R, s);
        look.copy(fb.P).addScaledVector(dir2, def.radius - 1.25);
        placeCam(dt, baseFov - 6, turn);
      } else goUnder(dt, baseFov);
    }

    api.update = function (dt) {
      if (!st.active) return; dt = Math.min(dt, .05); st.t += dt; st.flash = Math.max(0, st.flash - dt * 2.2); var b = built, def = b.def, tr = b.tr, baseFov = camera.aspect < 1 ? 80 : 66;
      if (st.kind === 'surf') { updateSurf(dt, baseFov); updateSpray(dt); sky.position.copy(camera.position); drawOverlay(dt); return; }
      if (st.kind === 'river') { updateRiver(dt, baseFov); updateSpray(dt); sky.position.copy(camera.position); drawOverlay(dt); return; }
      groundMat.uniforms.uTime.value += dt; b.tube.material.uniforms.uTime.value += dt; b.water.material.uniforms.uTime.value += dt;
      st.flash = Math.max(0, st.flash - dt * 2.2);
      var turn = 0;
      if (st.phase === 'intro') {
        var dur = def.intro || 1.0; st.v = damp(st.v, 1.2, 2, dt); st.s += st.v * dt * .35;
        if (cur === 'drop') { var n = Math.floor(st.t / .32); if (n > st.ticks) { st.ticks = n; if (audio) audio.tick(); } }
        if (st.t > dur) { st.phase = 'ride'; st.t = 0; if (audio) { audio.whoosh(); audio.say(cur === 'drop' ? "Here we go! Whoa!" : cur === 'spiral' ? "Wheee! Round and round!" : "Into the rainbow! Wheee!"); } }
      } else if (st.phase === 'ride') {
        frameAt(tr, st.s, fa); var drop = Math.max(0, st.y0 - fa.P.y), vt = Math.min(def.vmax, 5 + Math.sqrt(2 * 9.8 * drop) * def.gain) * (st.boost ? 1.18 : 1);
        st.v = damp(st.v, vt, cur === 'drop' ? 2.6 : 1.5, dt); st.s += st.v * dt;
        b.water.material.uniforms.uScroll.value += st.v * dt * .9;
        // rider angle from gravity + centrifugal
        var Kv = tmp.copy(fa.K).multiplyScalar(st.v * st.v), Fv = tmp2.set(0, -9.8, 0).sub(Kv);
        var fn = -Fv.dot(fa.N); st.air = damp(st.air || 0, clamp(-fn / 9.8, 0, 1), 8, dt); var thEq = Math.atan2(Fv.dot(fa.R), Math.max(3, fn)) + st.lean * .55;
        if (def.mode !== 2) thEq = clamp(thEq, -def.open + .55, def.open - .55); else thEq = clamp(thEq, -1.4, 1.4);
        var acc = -38 * (st.th - thEq) - 8 * st.thv; st.thv += acc * dt; st.th += st.thv * dt; turn = clamp(Math.abs(st.thv) * .35 + Math.abs(st.th) * .25, 0, 1);
        if (def.spin) { var q = st.s / tr.L, sp = smooth(def.spin[0], def.spin[1], q); st.spin = sp * TAU; if (!st.spinFired && q > def.spin[0]) { st.spinFired = true; emit('spin'); if (audio) { audio.whoosh(); audio.wheee(); } } }
        if (cur === 'drop' && !st.dropFired && fa.T.y < -.6) { st.dropFired = true; st.fovKick = 1; emit('drop'); if (audio) { audio.wheee(); } }
        if (cur === 'spiral' && Math.random() < dt * .4 && audio) audio.giggle(2);
        var slope = clamp(-fa.T.y, 0, 1); st.fovKick = Math.max(st.fovKick - dt * .7, cur === 'drop' ? slope * .9 : 0);
        if (Math.random() < dt * (LOW ? 20 : 40) * clamp(st.v / 15, 0, 1.4)) spawnSpray(2, fa.P, fa.T, fa.R, st.v);
        if (st.s >= tr.L - .05) { st.phase = 'launch'; st.t = 0; frameAt(tr, tr.L, fa); st.vel.copy(fa.T).multiplyScalar(Math.max(st.v, 9)); st.vel.y += 2.5; eye.copy(fa.P).addScaledVector(fa.N, -(def.radius - .8)); emit('launch'); if (audio) audio.whoosh(); }
      }
      if (st.phase === 'intro' || st.phase === 'ride') {
        frameAt(tr, st.s, fa); var th = st.th + st.spin, c = Math.cos(th), s = Math.sin(th);
        var dir = tmp.set(0, 0, 0).addScaledVector(fa.N, -c).addScaledVector(fa.R, s);
        eye.copy(fa.P).addScaledVector(dir, def.radius - 1.0 - (st.air || 0) * .45); upv.copy(dir).negate();
        var la = cur === 'drop' && st.phase === 'intro' ? 9 + st.t * 4 : Math.max(5, st.v * .42);
        frameAt(tr, Math.min(tr.L, st.s + la), fb); var dir2 = tmp2.set(0, 0, 0).addScaledVector(fb.N, -c).addScaledVector(fb.R, s);
        look.copy(fb.P).addScaledVector(dir2, def.radius - 1.1);
        if (st.s + la > tr.L) look.addScaledVector(fb.T, st.s + la - tr.L).y -= (st.s + la - tr.L) * .3;
        var shk = (.012 + .05 * clamp(st.v / 20, 0, 1.3)) * (st.phase === 'ride' ? 1 : .2) + st.fovKick * .05, tt = performance.now() / 1000;
        eye.x += vnoise(tt * 23) * shk; eye.y += vnoise(tt * 19 + 7) * shk; eye.z += vnoise(tt * 21 + 3) * shk;
        camera.position.copy(eye); camera.up.copy(upv); camera.lookAt(look);
        camera.fov = damp(camera.fov, baseFov + clamp(st.v, 0, 25) * .4 + st.fovKick * 18 + (st.boost ? 6 : 0), 6, dt); camera.updateProjectionMatrix();
        if (audio) audio.rushLevel(st.v / 20, turn);
      } else if (st.phase === 'launch') {
        st.vel.y -= 9.8 * dt; eye.addScaledVector(st.vel, dt); camera.position.copy(eye); camera.up.set(0, 1, 0); camera.lookAt(look.copy(eye).add(tmp.copy(st.vel).normalize().multiplyScalar(5)));
        camera.fov = damp(camera.fov, baseFov + 22, 6, dt); camera.updateProjectionMatrix();
        if (eye.y < .25 || st.t > 1.4) { st.phase = 'under'; st.t = 0; st.under = 0; if (audio) { audio.rushStop(); audio.splash(); } emit('splash', { id: cur }); spawnBubbles(); }
      } else if (st.phase === 'under') {
        st.under = st.t; st.vel.multiplyScalar(Math.exp(-4 * dt)); eye.addScaledVector(st.vel, dt); eye.y = Math.min(eye.y, -.6); camera.position.copy(eye); camera.up.set(0, 1, 0); camera.lookAt(look.copy(eye).add(tmp.set(st.vel.x, 0, st.vel.z).normalize().multiplyScalar(5)).setY(eye.y - 1.5)); camera.fov = damp(camera.fov, baseFov, 3, dt); camera.updateProjectionMatrix();
        if (st.t > .95) { st.active = false; st.phase = 'idle'; emit('done', { id: cur }); }
      }
      st.st = { speed: st.v };
      updateSpray(dt); sky.position.copy(camera.position);
      drawOverlay(dt);
    };
    function spawnBubbles() { st.bub.length = 0; for (var i = 0; i < (LOW ? 40 : 70); i++) st.bub.push({ x: Math.random(), y: .7 + Math.random() * .6, r: 3 + Math.random() * 14, v: .25 + Math.random() * .6, w: Math.random() * 6 }); }
    function drawOverlay(dt) {
      if (!ox) return; var W = ov.clientWidth || innerWidth, H = ov.clientHeight || innerHeight; ox.clearRect(0, 0, W, H);
      var sp = clamp((st.v - 6) / 16, 0, 1.2), cx = W / 2, cy = H * .5;
      var fp = fpImg[cur];
      if (fp && (st.phase === 'intro' || st.phase === 'ride' || st.phase === 'soft')) {
        var isRiver = cur === 'river', iw = isRiver ? W * 1.06 : Math.min(W * .6, H * .52 * fp.width / fp.height), ih = iw * fp.height / fp.width;
        var bob = Math.sin((st.waveT || st.t) * (isRiver ? 2.15 : 3.2)) * (isRiver ? 7 : 11);
        var falling = st.phase === 'soft' ? st.t * .35 : 0;
        ox.save(); ox.translate(W / 2 + st.lean * (isRiver ? 16 : 28), H - ih * (isRiver ? .72 : .82) + bob + falling * (isRiver ? 40 : 60));
        ox.rotate(st.th * .45 + st.lean * .1 + falling * .2 + (isRiver ? st.spin * .04 : 0));
        ox.globalAlpha = st.phase === 'soft' ? Math.max(0, 1 - st.t * .55) : 1;
        ox.drawImage(fp, -iw / 2, 0, iw, ih); ox.restore(); ox.globalAlpha = 1;
      }
      var kh = fpImg.khala;
      if (kh && cur === 'river' && (st.phase === 'intro' || st.phase === 'ride' || st.phase === 'soft')) {
        var kw = Math.min(W * .46, H * .62 * kh.width / kh.height), khh = kw * kh.height / kh.width;
        var kbob = Math.sin((st.waveT || st.t) * 2.15 + 1.1) * 9;
        var kfade = st.phase === 'soft' ? Math.max(0, 1 - st.t * .55) : 1;
        ox.save(); ox.translate(W * .78 + st.lean * 10, H - khh * .82 + kbob);
        ox.rotate(-.08 + st.lean * .06 + Math.sin((st.waveT || 0) * 1.7) * .05);
        ox.globalAlpha = kfade;
        ox.drawImage(kh, -kw / 2, 0, kw, khh); ox.restore(); ox.globalAlpha = 1;
      }
      if (st.phase === 'ride') {
        var n = Math.round((LOW ? 14 : 26) * sp); ox.lineCap = 'round';
        for (var i = 0; i < n; i++) { var a = Math.random() * TAU, r0 = Math.max(W, H) * (.36 + Math.random() * .25), r1 = r0 + Math.max(W, H) * (.1 + .22 * sp * Math.random());
          ox.strokeStyle = 'rgba(255,255,255,' + (.18 + .35 * Math.random() * sp).toFixed(3) + ')'; ox.lineWidth = 1 + Math.random() * 3; ox.beginPath(); ox.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ox.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ox.stroke(); }
        var g = ox.createRadialGradient(cx, cy, Math.min(W, H) * .3, cx, cy, Math.max(W, H) * .75); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(140,230,255,' + (.18 * sp).toFixed(3) + ')'); ox.fillStyle = g; ox.fillRect(0, 0, W, H);
      }
      if (st.flash > 0) { ox.fillStyle = 'rgba(255,255,255,' + (st.flash * .55).toFixed(3) + ')'; ox.fillRect(0, 0, W, H); }
      if (st.phase === 'soft') {
        var u = st.t, k = u < .1 ? u / .1 : 1 - smooth(.45, 1.0, u);
        ox.fillStyle = 'rgba(200,245,255,' + (0.5 * Math.max(0, 1 - u * 2.6)).toFixed(3) + ')'; ox.fillRect(0, 0, W, H);
        ox.globalAlpha = Math.max(0, .95 - u * .9);
        for (var q = 0; q < 26; q++) {
          var qa = q / 26 * TAU + hash(q + 5) * .4, qr = Math.max(W, H) * (.08 + hash(q + 2) * .1 + u * .7);
          var qx = W / 2 + Math.cos(qa) * qr, qy = H * .62 + Math.sin(qa) * qr * .55, qs = Math.min(W, H) * (.02 + .03 * hash(q));
          ox.fillStyle = 'rgba(255,255,255,' + (.9 * k).toFixed(3) + ')'; ox.strokeStyle = 'rgba(80,190,230,' + (.75 * k).toFixed(3) + ')'; ox.lineWidth = 2;
          ox.beginPath(); ox.ellipse(qx, qy, qs, qs * .7, qa, 0, TAU); ox.fill(); ox.stroke();
        }
        ox.globalAlpha = 1;
        st.bub.forEach(function (b) { b.y -= b.v * dt * 1.1; var bx = (b.x + Math.sin(u * 5 + b.w) * .01) * W, by = b.y * H; ox.strokeStyle = 'rgba(255,255,255,' + (.85 * k).toFixed(3) + ')'; ox.lineWidth = 2; ox.beginPath(); ox.arc(bx, by, b.r, 0, TAU); ox.stroke(); ox.fillStyle = 'rgba(255,255,255,' + (.5 * k).toFixed(3) + ')'; ox.beginPath(); ox.arc(bx - b.r * .35, by - b.r * .35, b.r * .25, 0, TAU); ox.fill(); });
      }
      if (st.phase === 'under') {
        var u = st.under, k = u < .08 ? u / .08 : 1 - smooth(.55, .95, u);
        ox.fillStyle = 'rgba(255,255,255,' + Math.max(0, .9 - u * 8).toFixed(3) + ')'; ox.fillRect(0, 0, W, H);
        var g2 = ox.createLinearGradient(0, 0, 0, H); g2.addColorStop(0, 'rgba(110,220,250,' + (.96 * k).toFixed(3) + ')'); g2.addColorStop(1, 'rgba(20,100,190,' + (.98 * k).toFixed(3) + ')'); ox.fillStyle = g2; ox.fillRect(0, 0, W, H);
        ox.globalAlpha = .25 * k; ox.strokeStyle = '#e8ffff'; ox.lineWidth = 10; for (var j = 0; j < 6; j++) { ox.beginPath(); for (var x = 0; x <= W; x += 24) { var y = H * (.08 + j * .045) + Math.sin(x * .02 + u * 6 + j) * 14; if (x === 0) ox.moveTo(x, y); else ox.lineTo(x, y); } ox.stroke(); } ox.globalAlpha = 1;
        if (u < .35) { var ck = 1 - u / .35; ox.fillStyle = 'rgba(255,255,255,' + (.95 * ck).toFixed(3) + ')'; ox.strokeStyle = 'rgba(60,140,210,' + (.8 * ck).toFixed(3) + ')'; ox.lineWidth = 3; for (var q = 0; q < 22; q++) { var qa = q / 22 * TAU + hash(q + 5) * .4, qr = Math.max(W, H) * (.18 + hash(q + 2) * .12 + u * 1.8), qx = W / 2 + Math.cos(qa) * qr, qy = H / 2 + Math.sin(qa) * qr * .8, qs = Math.min(W, H) * (.025 + .035 * hash(q)); ox.beginPath(); ox.ellipse(qx, qy, qs, qs * .7, qa, 0, TAU); ox.fill(); ox.stroke(); } }
        st.bub.forEach(function (b) { b.y -= b.v * dt * 1.4; var bx = (b.x + Math.sin(u * 5 + b.w) * .01) * W, by = b.y * H; ox.strokeStyle = 'rgba(255,255,255,' + (.85 * k).toFixed(3) + ')'; ox.lineWidth = 2; ox.beginPath(); ox.arc(bx, by, b.r, 0, TAU); ox.stroke(); ox.fillStyle = 'rgba(255,255,255,' + (.5 * k).toFixed(3) + ')'; ox.beginPath(); ox.arc(bx - b.r * .35, by - b.r * .35, b.r * .25, 0, TAU); ox.fill(); });
      }
    }
    api.clearOverlay = function () { if (ox) ox.clearRect(0, 0, ov.width, ov.height); };
    api.render = function (dt) { if (fx) fx.render(dt); else renderer.render(scene, camera); };
    api.dispose = function () { if (audio) { audio.rushStop(); if (audio.parkStop) audio.parkStop(); } if (fx) fx.dispose(); };
    return api;
  }
  var mod = { create: create, SLIDES: SLIDES, RIDES: RIDES };
  root.GhaliaPoolRide = mod;
  if (typeof module !== 'undefined' && module.exports) module.exports = mod;
})(typeof window !== 'undefined' ? window : globalThis);
