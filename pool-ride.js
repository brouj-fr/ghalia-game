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
  function surfPts() {
    var p = [];
    for (var i = 0; i <= 64; i++) { var u = i / 64; p.push([-52 + u * 205, 2.2, 22 + Math.sin(u * Math.PI * 4.2) * 8 + Math.sin(u * Math.PI * 1.6) * 3]); }
    return p;
  }
  function riverPts() {
    var p = [];
    for (var i = 0; i <= 72; i++) { var u = i / 72, x = Math.sin(u * Math.PI * 2.35) * 18 + Math.sin(u * Math.PI * 5.1) * 5.2, z = 8 - u * 96, y = 2.35 - u * 1.2; p.push([x, y, z]); }
    return p;
  }
  var RIDES = {};
  (function () { var k; for (k in SLIDES) { SLIDES[k].kind = 'slide'; RIDES[k] = SLIDES[k]; }
    RIDES.surf = { kind: 'surf', name: "Surf's Up", vmax: 18, gain: .8, intro: 1.45, pts: surfPts };
    RIDES.river = { kind: 'river', name: 'Lazy River', radius: 2.65, open: 1.22, mode: 3, colA: [1, .85, .9], colB: [.72, .94, .9], colC: [1, .97, .92], vmax: 5.6, gain: .45, intro: 1.7, spin: [.40, .58], pts: riverPts };
  })();
  function waveH(x, z, t) {
    return .55 * Math.sin(x * .22 + z * .28 - t * 2.4) + 1.55 * Math.sin(x * .10 + z * .16 - t * 1.5) + 3.6 * Math.pow(Math.max(0, Math.sin(z * .09 - t * 1.35 + .5)), 1.65) + .28 * Math.sin(x * .55 + z * .4 - t * 3.2);
  }


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
    'varying vec2 vUv;varying vec3 vN;varying vec3 vW;uniform vec3 uSun;',
    'void main(){vec3 d=normalize(vW-cameraPosition);float y=d.y;vec3 top=vec3(.74,.62,.96),mid=vec3(1.0,.7,.76),hor=vec3(1.0,.86,.7),low=vec3(.98,.78,.66);',
    ' vec3 c=y>0.0?mix(mix(hor,mid,smoothstep(.0,.25,y)),top,smoothstep(.25,.8,y)):low;float s=max(dot(d,normalize(uSun)),0.0);c+=vec3(1.0,.85,.6)*(smoothstep(.985,.992,s)*.6+pow(s,24.0)*.25);',
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
    'float wh(vec2 p,float t){return .55*sin(p.x*.22+p.y*.28-t*2.4)+1.55*sin(p.x*.10+p.y*.16-t*1.5)+3.6*pow(max(0.0,sin(p.y*.09-t*1.35+.5)),1.65)+.28*sin(p.x*.55+p.y*.4-t*3.2);}',
    'void main(){vUv=uv;vec3 p=position;float h=wh(p.xz,uTime);p.y=h;vH=h;',
    ' float e=.45;float hx=wh(p.xz+vec2(e,0.0),uTime)-wh(p.xz-vec2(e,0.0),uTime);float hz=wh(p.xz+vec2(0.0,e),uTime)-wh(p.xz-vec2(0.0,e),uTime);',
    ' vN=normalize(vec3(-hx/(2.0*e),1.0,-hz/(2.0*e)));vec4 w=modelMatrix*vec4(p,1.0);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}'
  ].join('\n');
  var OCEAN_FS = [
    'uniform float uTime;varying vec2 vUv;varying vec3 vN;varying vec3 vW;varying float vH;',
    'void main(){vec3 n=normalize(vN);vec3 L=normalize(vec3(.35,.9,.25));float ndl=dot(n,L);float sh=ndl>.45?1.0:(ndl>.1?.78:.58);',
    ' float steep=smoothstep(.92,.5,n.y);float foam=smoothstep(2.4,3.8,vH)*.85+steep*.55;',
    ' vec3 deep=vec3(.03,.25,.52),mid=vec3(.07,.5,.82),hi=vec3(.2,.78,.95);',
    ' vec3 col=mix(deep,mid,clamp((vH+1.0)/4.0,0.0,1.0));col=mix(col,hi,clamp((vH-1.2)/3.0,0.0,1.0));col*=sh;',
    ' col=mix(col,vec3(.93,.98,1.0),foam);',
    ' float ridge=smoothstep(.08,.0,abs(fract(vH*.55)-.5)*2.0-.72);col=mix(col,col*vec3(.55,.7,.85),ridge*(1.0-foam));',
    ' vec3 V=normalize(cameraPosition-vW);float fres=pow(1.0-max(dot(n,V),0.0),2.5);col=mix(col,vec3(.55,.8,.95),fres*.22);',
    ' float spark=pow(max(dot(reflect(-L,n),V),0.0),90.0);col+=vec3(1.0,.96,.88)*spark*.35;',
    ' float fog=smoothstep(110.0,280.0,length(vW.xz-cameraPosition.xz));col=mix(col,vec3(.98,.8,.7),fog*.55);',
    ' gl_FragColor=linearToOutputTexel(vec4(pow(clamp(col,0.0,1.0),vec3(2.2)),1.0));}'
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
    var skyMat = new THREE.ShaderMaterial({ vertexShader: COMMON_VS, fragmentShader: SKY_FS, side: THREE.BackSide, depthWrite: false, uniforms: { uSun: { value: new THREE.Vector3(-.4, .35, -.8) } } });
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
    ['waterfall', 'tunnel', 'fountain'].forEach(function (k) { actTex[k] = loader.load('img/pool/' + k + '.webp'); actTex[k].encoding = THREE.sRGBEncoding; });
    [['surf', 'img/pool/surf-fp.webp'], ['river', 'img/pool/river-fp.webp']].forEach(function (p) { var im = new Image(); im.onload = function () { fpImg[p[0]] = im; }; im.src = p[1]; });

    function clearDecor() {
      ground.visible = true; groundMat.uniforms.uPoolR.value = 22;
      while (decor.children.length) { var c = decor.children.pop(); if (c.geometry && c.geometry !== postGeo) c.geometry.dispose(); if (c.material && c.material !== postMat && c.material !== inkMat) c.material.dispose(); }
    }
    function sliceTrack(tr, s0, s1) {
      var i0 = Math.max(0, Math.floor(s0 / tr.ds)), i1 = Math.min(tr.n, Math.ceil(s1 / tr.ds)); if (i1 - i0 < 2) i1 = Math.min(tr.n, i0 + 3);
      return { P: tr.P.slice(i0, i1 + 1), T: tr.T.slice(i0, i1 + 1), N: tr.N.slice(i0, i1 + 1), R: tr.R.slice(i0, i1 + 1), K: tr.K.slice(i0, i1 + 1), n: i1 - i0, ds: tr.ds, L: (i1 - i0) * tr.ds };
    }
    function addPalms(origin, n, r0, r1, seed) {
      for (var k = 0; k < n; k++) { var ang = hash(k * 7 + seed) * TAU, rad = r0 + hash(k * 3 + seed + 2) * (r1 - r0), s = new THREE.Sprite(new THREE.SpriteMaterial({ map: pTex, transparent: true, depthWrite: false })); s.center.set(.5, 0); s.position.set(origin.x + Math.cos(ang) * rad, 0, origin.z + Math.sin(ang) * rad); var sc = 9 + hash(k + seed) * 7; s.scale.set(sc * .66, sc, 1); decor.add(s); }
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
      var def = RIDES.surf; clearDecor(); ground.visible = false;
      var tr = tracks.surf || (tracks.surf = makeTrack(THREE, def, LOW ? .8 : .55));
      var ocean = new THREE.Mesh(new THREE.PlaneGeometry(LOW ? 280 : 360, LOW ? 280 : 360, LOW ? 72 : 140, LOW ? 72 : 140).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ vertexShader: OCEAN_VS, fragmentShader: OCEAN_FS, uniforms: { uTime: { value: 0 } } }));
      ocean.frustumCulled = false; decor.add(ocean);
      var mid = tr.P[Math.floor(tr.n / 2)], start = tr.P[0];
      // sandy beach behind the takeoff
      var beach = new THREE.Mesh(new THREE.CylinderGeometry(38, 44, 1.2, 28), new THREE.MeshToonMaterial({ color: 0xf3d5a4, gradientMap: grad }));
      beach.position.set(start.x - 8, -.4, start.z - 36); decor.add(beach);
      addPalms(beach.position, LOW ? 14 : 22, 10, 40, 11);
      addPalms(new THREE.Vector3(mid.x, 0, mid.z + 36), LOW ? 12 : 20, 18, 55, 29);
      addPalms(new THREE.Vector3(tr.P[Math.floor(tr.n * .75)].x, 0, tr.P[Math.floor(tr.n * .75)].z + 40), LOW ? 8 : 14, 16, 48, 41);
      built = { id: 'surf', def: def, tr: tr, ocean: ocean, kind: 'surf' };
    }

    function buildRiver() {
      var def = RIDES.river; clearDecor();
      var tr = tracks.river || (tracks.river = makeTrack(THREE, def, LOW ? .7 : .5));
      var seg = LOW ? 16 : 24;
      var tube = new THREE.Mesh(tubeGeometry(THREE, tr, def.radius, def.open, seg, false), new THREE.ShaderMaterial({ vertexShader: COMMON_VS, fragmentShader: TUBE_FS, side: THREE.DoubleSide, uniforms: { uA: { value: new THREE.Vector3().fromArray(def.colA) }, uB: { value: new THREE.Vector3().fromArray(def.colB) }, uC: { value: new THREE.Vector3().fromArray(def.colC) }, uMode: { value: 3 }, uTime: { value: 0 }, uClosed: { value: 0 } } }));
      tube.frustumCulled = false; decor.add(tube);
      var water = new THREE.Mesh(tubeGeometry(THREE, tr, def.radius * .97, .7, 10, false), new THREE.ShaderMaterial({ vertexShader: COMMON_VS, fragmentShader: WATER_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uScroll: { value: 0 }, uTime: { value: 0 } } }));
      water.frustumCulled = false; water.renderOrder = 2; decor.add(water);
      var t0 = def.spin[0] * tr.L, t1 = def.spin[1] * tr.L, sub = sliceTrack(tr, t0, t1);
      var tun = new THREE.Mesh(tubeGeometry(THREE, sub, 3.15, Math.PI, LOW ? 18 : 28, true), new THREE.ShaderMaterial({ vertexShader: COMMON_VS, fragmentShader: TUBE_FS, side: THREE.DoubleSide, uniforms: { uA: { value: new THREE.Vector3(1, 1, 1) }, uB: { value: new THREE.Vector3(.95, .6, .9) }, uC: { value: new THREE.Vector3(1, 1, 1) }, uMode: { value: 2 }, uTime: { value: 0 }, uClosed: { value: 1 } } }));
      tun.frustumCulled = false; decor.add(tun);
      function at(s) { var o = F(); frameAt(tr, clamp(s, 0, tr.L), o); return o; }
      var wF = at(.22 * tr.L); addSprite(actTex.waterfall, wF.P.clone().addScaledVector(wF.R, 7.5).setY(0), 7.2, 14.4, true);
      var fF = at(.70 * tr.L); addSprite(actTex.fountain, fF.P.clone().addScaledVector(fF.R, -5.2).setY(0), 7.2, 8.8, true);
      var tEnter = at(Math.max(0, t0 - 6)); addSprite(actTex.tunnel, tEnter.P.clone().addScaledVector(tEnter.R, 6.2).setY(0), 6.8, 7.1, true);
      var tLeave = at(Math.min(tr.L, t1 + 5)); addSprite(actTex.tunnel, tLeave.P.clone().addScaledVector(tLeave.R, -6.2).setY(0), 6.8, 7.1, true);
      var end = tr.P[tr.n], tEnd = tr.T[tr.n], pool = end.clone().add(tEnd.clone().setY(0).normalize().multiplyScalar(10)); pool.y = 0;
      groundMat.uniforms.uPool.value.set(pool.x, pool.z); groundMat.uniforms.uPoolR.value = 16;
      var start = tr.P[0];
      var dock = new THREE.Mesh(new THREE.BoxGeometry(6, .5, 5), new THREE.MeshToonMaterial({ color: 0xffc4d8, gradientMap: grad }));
      dock.position.set(start.x, start.y - def.radius - .15, start.z + 2.2); decor.add(dock);
      addPalms(pool, LOW ? 20 : 36, 18, 90, 7);
      addPalms(new THREE.Vector3(tr.P[Math.floor(tr.n / 3)].x, 0, tr.P[Math.floor(tr.n / 3)].z), LOW ? 12 : 20, 14, 50, 19);
      built = { id: 'river', def: def, tr: tr, tube: tube, water: water, tun: tun, pool: pool, kind: 'river', marks: [{ at: .22, id: 'waterfall' }, { at: .40, id: 'tunnel' }, { at: .70, id: 'fountain' }] };
    }

    function frameAt(tr, s, out) { var f = clamp(s / tr.ds, 0, tr.n - 1e-4), i = Math.floor(f), t = f - i; out.P.lerpVectors(tr.P[i], tr.P[i + 1], t); out.T.lerpVectors(tr.T[i], tr.T[i + 1], t).normalize(); out.N.lerpVectors(tr.N[i], tr.N[i + 1], t).normalize(); out.R.lerpVectors(tr.R[i], tr.R[i + 1], t).normalize(); out.K.lerpVectors(tr.K[i], tr.K[i + 1], t); return out; }
    function F() { return { P: new THREE.Vector3(), T: new THREE.Vector3(), N: new THREE.Vector3(), R: new THREE.Vector3(), K: new THREE.Vector3() }; }
    var fa = F(), fb = F(), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), eye = new THREE.Vector3(), look = new THREE.Vector3(), upv = new THREE.Vector3();
    var st = { active: false, phase: 'idle', t: 0, s: 0, v: 0, th: 0, thv: 0, spin: 0, lean: 0, boost: false, fovKick: 0, shake: 0, y0: 0, vel: new THREE.Vector3(), under: 0, lines: [], bub: [], dropFired: false, spinFired: false, ticks: 0, flash: 0 };
    var api = { scene: scene, camera: camera, slides: SLIDES, get active() { return st.active; }, get phase() { return st.phase; }, get speed() { return st.v; }, state: st };
    function emit(t, d) { if (opts.onEvent) try { opts.onEvent(t, d || {}); } catch (e) { console.error(e); } }

    api.start = function (id) {
      if (!RIDES[id]) id = 'spiral'; var kind = RIDES[id].kind || 'slide'; if (kind === 'surf') buildSurf(); else if (kind === 'river') buildRiver(); else buildSlide(id); cur = id;
      st.active = true; st.phase = 'intro'; st.t = 0; st.s = .5; st.v = 0; st.th = 0; st.thv = 0; st.spin = 0; st.lean = 0; st.fovKick = 0; st.under = 0; st.dropFired = false; st.spinFired = false; st.air = 0; st.ticks = 0; st.flash = kind === 'slide' ? 1 : .25; st.bub.length = 0; st.kind = kind; st.lat = 0; st.waveT = 2.4; st.hPrev = 0; st.fired = {}; st.roll = 0; if (fx && fx.bloom) { fx.bloom.strength = kind === 'slide' ? .32 : .14; fx.bloom.threshold = kind === 'slide' ? .93 : .975; }
      st.y0 = built.tr.P[0].y; for (var i = 0; i < NP; i++) { sprayLife[i] = 0; sprayPos[i * 3 + 1] = -999; }
      api.resize(innerWidth, innerHeight); if (audio) { audio.rushStart(); audio.rushLevel(.1, 0); }
      emit('start', { id: id }); return built.def;
    };
    api.lean = function (x) { st.lean = clamp(x, -1, 1); };
    api.boost = function (b) { if (b && !st.boost && audio && st.phase === 'ride') audio.wheee(); st.boost = !!b; };
    api.resize = function (w, h) { camera.aspect = w / h; camera.updateProjectionMatrix(); if (fx) fx.setSize(w, h); if (ov) { var dpr = Math.min(2, root.devicePixelRatio || 1); ov.width = w * dpr; ov.height = h * dpr; ov.style.width = w + 'px'; ov.style.height = h + 'px'; if (ox) ox.setTransform(dpr, 0, 0, dpr, 0, 0); } };
    api.skip = function () { if (st.active && st.phase !== 'under' && built) { st.s = built.tr.L - .1; st.phase = 'ride'; } };
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
      if (st.phase === 'launch' || st.phase === 'wipe') {
        st.vel.y -= 9.8 * dt; eye.addScaledVector(st.vel, dt); st.roll = (st.roll || 0) + (st.kind === 'surf' ? 3.2 : 1.1) * dt;
        upv.set(Math.sin(st.roll) * .8, Math.cos(st.roll), 0).normalize();
        camera.position.copy(eye); camera.up.copy(upv); camera.lookAt(look.copy(eye).add(tmp.copy(st.vel).normalize().multiplyScalar(5)));
        camera.fov = damp(camera.fov, baseFov + (st.kind === 'surf' ? 22 : 10), 6, dt); camera.updateProjectionMatrix();
        var waterY = st.kind === 'surf' ? waveH(eye.x, eye.z, st.waveT) : .25;
        if (eye.y < waterY + .15 || st.t > (st.kind === 'river' ? 1.1 : 1.4)) { st.phase = 'under'; st.t = 0; st.under = 0; if (audio) { audio.rushStop(); if (st.kind === 'surf' && audio.crash) audio.crash(); else audio.splash(); } emit('splash', { id: cur }); spawnBubbles(); }
      } else if (st.phase === 'under') {
        st.under = st.t; st.vel.multiplyScalar(Math.exp(-4 * dt)); eye.addScaledVector(st.vel, dt); eye.y = Math.min(eye.y, (st.kind === 'surf' ? waveH(eye.x, eye.z, st.waveT) : 0) - .6);
        camera.position.copy(eye); camera.up.set(0, 1, 0); camera.lookAt(look.copy(eye).add(tmp.set(st.vel.x, 0, st.vel.z).normalize().multiplyScalar(5)).setY(eye.y - 1.5)); camera.fov = damp(camera.fov, baseFov, 3, dt); camera.updateProjectionMatrix();
        if (st.t > .95) { st.active = false; st.phase = 'idle'; emit('done', { id: cur }); }
      }
    }
    function updateSurf(dt, baseFov) {
      var b = built, def = b.def, tr = b.tr; st.waveT += dt; if (b.ocean) b.ocean.material.uniforms.uTime.value = st.waveT;
      var turn = 0, q = st.s / tr.L, fade = .38 + .62 * smooth(0, .12, q);
      if (st.phase === 'intro') {
        st.v = damp(st.v, 3.2, 2, dt); st.s += st.v * dt * .45;
        if (st.t > (def.intro || 1.45)) { st.phase = 'ride'; st.t = 0; if (audio) { audio.whoosh(); audio.say("Surf's up!"); } }
      } else if (st.phase === 'ride') {
        frameAt(tr, st.s, fa);
        var px = fa.P.x + (st.lat || 0) * fa.R.x, pz = fa.P.z + (st.lat || 0) * fa.R.z, h = waveH(px, pz, st.waveT) * fade;
        var e = .5, hx = (waveH(px + e, pz, st.waveT) - waveH(px - e, pz, st.waveT)) / (2 * e), hz = (waveH(px, pz + e, st.waveT) - waveH(px, pz - e, st.waveT)) / (2 * e);
        var dropRate = st.hPrev ? (st.hPrev - h) / Math.max(dt, .001) : 0; st.hPrev = h;
        var vt = Math.min(def.vmax, 8 + 7 * clamp(h / 2.6, 0, 1) + 6 * clamp(dropRate / 5, 0, 1)) * (st.boost ? 1.16 : 1);
        st.v = damp(st.v, vt, 1.7, dt); st.s += st.v * dt;
        st.lat = damp(st.lat || 0, st.lean * 4.2, 3.2, dt); st.th = damp(st.th, st.lean * .75, 5, dt); turn = Math.abs(st.lean);
        st.fovKick = Math.max(st.fovKick - dt * .7, clamp(dropRate / 6, 0, 1) * .9);
        if (dropRate > 3.2 && !st.dropFired) { st.dropFired = true; st.fovKick = 1; emit('drop'); if (audio) audio.wheee(); }
        if (st.dropFired && dropRate < 1) st.dropFired = false;
        if (Math.random() < dt * .28 && audio) audio.giggle(2);
        if (Math.random() < dt * (LOW ? 22 : 44) * clamp(st.v / 12, .3, 1.5)) spawnSpray(3, tmp.set(px, h, pz), fa.T, fa.R, st.v);
        if (st.s >= tr.L - .08) { st.phase = 'wipe'; st.t = 0; st.vel.copy(fa.T).multiplyScalar(Math.max(st.v, 8)); st.vel.y += 3.2; eye.set(px, h + 1.1, pz); emit('launch'); if (audio) audio.whoosh(); }
      }
      if (st.phase === 'intro' || st.phase === 'ride') {
        frameAt(tr, st.s, fa); var px = fa.P.x + (st.lat || 0) * fa.R.x, pz = fa.P.z + (st.lat || 0) * fa.R.z, h = waveH(px, pz, st.waveT) * fade;
        var e = .5, hx = (waveH(px + e, pz, st.waveT) - waveH(px - e, pz, st.waveT)) / (2 * e), hz = (waveH(px, pz + e, st.waveT) - waveH(px, pz - e, st.waveT)) / (2 * e);
        tmp.set(-hx, 1, -hz).normalize();
        eye.set(px, h + 1.15 + (st.air || 0) * .2, pz);
        upv.copy(tmp); if (Math.abs(st.th) > .01) { tmp2.copy(fa.T); upv.applyAxisAngle(tmp2, -st.th); }
        frameAt(tr, Math.min(tr.L, st.s + Math.max(6, st.v * .45)), fb);
        look.set(fb.P.x + (st.lat || 0) * fb.R.x, waveH(fb.P.x + (st.lat || 0) * fb.R.x, fb.P.z + (st.lat || 0) * fb.R.z, st.waveT) * fade + .15, fb.P.z + (st.lat || 0) * fb.R.z);
        placeCam(dt, baseFov, turn);
      } else goUnder(dt, baseFov);
    }
    function updateRiver(dt, baseFov) {
      var b = built, def = b.def, tr = b.tr, turn = 0; st.waveT += dt;
      if (b.tube) b.tube.material.uniforms.uTime.value += dt; if (b.water) { b.water.material.uniforms.uTime.value += dt; b.water.material.uniforms.uScroll.value += st.v * dt * .5; } if (b.tun) b.tun.material.uniforms.uTime.value += dt;
      groundMat.uniforms.uTime.value += dt;
      var q = st.s / tr.L, inTun = def.spin && q > def.spin[0] && q < def.spin[1];
      if (st.phase === 'intro') {
        st.v = damp(st.v, 2.2, 1.6, dt); st.s += st.v * dt * .4;
        if (st.t > (def.intro || 1.7)) { st.phase = 'ride'; st.t = 0; if (audio) { audio.whoosh(); audio.say('So relaxing!'); } }
      } else if (st.phase === 'ride') {
        var vt = (3.3 + (inTun ? .8 : 0) + (st.boost ? 1.6 : 0)); st.v = damp(st.v, Math.min(def.vmax, vt), 1.2, dt); st.s += st.v * dt;
        st.spin += (inTun ? 1.15 : .35) * dt; st.th = damp(st.th, st.lean * .55, 3, dt); turn = Math.abs(st.lean) * .4 + (inTun ? .5 : 0);
        if (b.marks) b.marks.forEach(function (m) { if (!st.fired[m.id] && q >= m.at) { st.fired[m.id] = 1; emit('mark', { id: m.id }); frameAt(tr, st.s, fa); spawnSpray(8, fa.P, fa.T, fa.R, 6); if (audio) { if (m.id === 'tunnel') { audio.whoosh(); audio.wheee(); } else if (m.id === 'waterfall') { audio.splash(); audio.say('Wheee!'); } else { audio.bubbles(10); audio.giggle(3); } } } });
        if (Math.random() < dt * (LOW ? 10 : 18)) { frameAt(tr, st.s, fa); spawnSpray(1, fa.P, fa.T, fa.R, st.v + 2); }
        if (inTun && Math.random() < dt * .2 && audio) audio.giggle(1);
        if (st.s >= tr.L - .08) { st.phase = 'launch'; st.t = 0; frameAt(tr, tr.L, fa); st.vel.copy(fa.T).multiplyScalar(Math.max(st.v, 4)); st.vel.y += 1.4; eye.copy(fa.P).addScaledVector(fa.N, -(def.radius - 1.1)); emit('launch'); if (audio) audio.whoosh(); }
      }
      if (st.phase === 'intro' || st.phase === 'ride') {
        frameAt(tr, st.s, fa);
        var bob = .11 * Math.sin(st.waveT * 2.15) + .05 * Math.sin(st.waveT * 3.7 + 1.2);
        var th = st.th + st.spin * .35, c = Math.cos(th), s = Math.sin(th);
        var dir = tmp.set(0, 0, 0).addScaledVector(fa.N, -c).addScaledVector(fa.R, s);
        eye.copy(fa.P).addScaledVector(dir, def.radius - 1.2 + bob); upv.copy(dir).negate();
        frameAt(tr, Math.min(tr.L, st.s + 6.5), fb);
        var dir2 = tmp2.set(0, 0, 0).addScaledVector(fb.N, -c).addScaledVector(fb.R, s);
        look.copy(fb.P).addScaledVector(dir2, def.radius - 1.25);
        placeCam(dt, baseFov - 6, turn);
      } else goUnder(dt, baseFov);
    }
    api.update = function (dt) {
      if (!st.active) return; dt = Math.min(dt, .05); st.t += dt; var b = built, def = b.def, tr = b.tr, baseFov = camera.aspect < 1 ? 80 : 66;
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
      if (fp && (st.phase === 'intro' || st.phase === 'ride' || st.phase === 'launch' || st.phase === 'wipe')) {
        var isRiver = cur === 'river', iw = isRiver ? W * 1.06 : Math.min(W * .6, H * .52 * fp.width / fp.height), ih = iw * fp.height / fp.width;
        var bob = Math.sin((st.waveT || st.t) * (isRiver ? 2.15 : 3.2)) * (isRiver ? 7 : 11);
        var falling = (st.phase === 'launch' || st.phase === 'wipe') ? st.t : 0;
        ox.save(); ox.translate(W / 2 + st.lean * (isRiver ? 16 : 28), H - ih * (isRiver ? .72 : .82) + bob + falling * (isRiver ? 140 : 240));
        ox.rotate(st.th * .45 + st.lean * .1 + falling * (isRiver ? .8 : 1.9) + (isRiver ? st.spin * .04 : 0));
        ox.globalAlpha = falling ? Math.max(0, 1 - falling * 1.35) : 1;
        ox.drawImage(fp, -iw / 2, 0, iw, ih); ox.restore(); ox.globalAlpha = 1;
      }
      if (st.phase === 'ride' || st.phase === 'launch' || st.phase === 'wipe') {
        // anime speed lines
        var n = Math.round((LOW ? 22 : 40) * sp); ox.lineCap = 'round';
        for (var i = 0; i < n; i++) { var a = Math.random() * TAU, r0 = Math.max(W, H) * (.32 + Math.random() * .25), r1 = r0 + Math.max(W, H) * (.12 + .3 * sp * Math.random());
          ox.strokeStyle = 'rgba(255,255,255,' + (.25 + .45 * Math.random() * sp).toFixed(3) + ')'; ox.lineWidth = 1 + Math.random() * 3.5; ox.beginPath(); ox.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ox.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ox.stroke(); }
        // soft speed vignette
        var g = ox.createRadialGradient(cx, cy, Math.min(W, H) * .3, cx, cy, Math.max(W, H) * .75); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(120,220,255,' + (.28 * sp).toFixed(3) + ')'); ox.fillStyle = g; ox.fillRect(0, 0, W, H);
      }
      if (st.flash > 0) { ox.fillStyle = 'rgba(255,255,255,' + (st.flash * .8).toFixed(3) + ')'; ox.fillRect(0, 0, W, H); }
      if (st.phase === 'under') {
        var u = st.under, k = u < .08 ? u / .08 : 1 - smooth(.55, .95, u);
        ox.fillStyle = 'rgba(255,255,255,' + Math.max(0, .9 - u * 8).toFixed(3) + ')'; ox.fillRect(0, 0, W, H);
        var g2 = ox.createLinearGradient(0, 0, 0, H); g2.addColorStop(0, 'rgba(110,220,250,' + (.96 * k).toFixed(3) + ')'); g2.addColorStop(1, 'rgba(20,100,190,' + (.98 * k).toFixed(3) + ')'); ox.fillStyle = g2; ox.fillRect(0, 0, W, H);
        // caustic light bands
        ox.globalAlpha = .25 * k; ox.strokeStyle = '#e8ffff'; ox.lineWidth = 10; for (var j = 0; j < 6; j++) { ox.beginPath(); for (var x = 0; x <= W; x += 24) { var y = H * (.08 + j * .045) + Math.sin(x * .02 + u * 6 + j) * 14; if (x === 0) ox.moveTo(x, y); else ox.lineTo(x, y); } ox.stroke(); } ox.globalAlpha = 1;
        if (u < .35) { var ck = 1 - u / .35; ox.fillStyle = 'rgba(255,255,255,' + (.95 * ck).toFixed(3) + ')'; ox.strokeStyle = 'rgba(60,140,210,' + (.8 * ck).toFixed(3) + ')'; ox.lineWidth = 3; for (var q = 0; q < 22; q++) { var qa = q / 22 * TAU + hash(q + 5) * .4, qr = Math.max(W, H) * (.18 + hash(q + 2) * .12 + u * 1.8), qx = W / 2 + Math.cos(qa) * qr, qy = H / 2 + Math.sin(qa) * qr * .8, qs = Math.min(W, H) * (.025 + .035 * hash(q)); ox.beginPath(); ox.ellipse(qx, qy, qs, qs * .7, qa, 0, TAU); ox.fill(); ox.stroke(); } }
        st.bub.forEach(function (b) { b.y -= b.v * dt * 1.4; var bx = (b.x + Math.sin(u * 5 + b.w) * .01) * W, by = b.y * H; ox.strokeStyle = 'rgba(255,255,255,' + (.85 * k).toFixed(3) + ')'; ox.lineWidth = 2; ox.beginPath(); ox.arc(bx, by, b.r, 0, TAU); ox.stroke(); ox.fillStyle = 'rgba(255,255,255,' + (.5 * k).toFixed(3) + ')'; ox.beginPath(); ox.arc(bx - b.r * .35, by - b.r * .35, b.r * .25, 0, TAU); ox.fill(); });
      }
    }
    api.clearOverlay = function () { if (ox) ox.clearRect(0, 0, ov.width, ov.height); };
    api.render = function (dt) { if (fx) fx.render(dt); else renderer.render(scene, camera); };
    api.dispose = function () { if (audio) audio.rushStop(); if (fx) fx.dispose(); };
    return api;
  }
  var mod = { create: create, SLIDES: SLIDES, RIDES: RIDES };
  root.GhaliaPoolRide = mod;
  if (typeof module !== 'undefined' && module.exports) module.exports = mod;
})(typeof window !== 'undefined' ? window : globalThis);
