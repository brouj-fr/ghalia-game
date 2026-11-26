/* v2 "sunset lookdev" for the 3D pages (world3d / class3d): ACES tone mapping, warm env reflections, bloom,
   plus reusable set-dressing helpers (fairy lights, neon tubes, sun shafts, star bursts, coin rain). three r128, offline. */
(function(){
'use strict';
var T=THREE;
var L=window.V2LOOK={};
function tier(){return window.V2&&V2.tier?V2.tier():'mid';}
L.envMap=function(renderer){var s=new T.Scene();var c=document.createElement('canvas');c.width=512;c.height=256;var x=c.getContext('2d');
  var g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,'#2a1240');g.addColorStop(.4,'#9a4a7a');g.addColorStop(.5,'#ff9a5c');g.addColorStop(.56,'#ffd98a');g.addColorStop(.64,'#8a4a5a');g.addColorStop(1,'#2a1430');x.fillStyle=g;x.fillRect(0,0,512,256);
  x.fillStyle='#fff3dc';x.fillRect(40,70,70,60);x.fillStyle='#ff6fa0';x.fillRect(330,96,90,12);x.fillStyle='#ffe2a8';x.fillRect(200,30,120,20);
  var t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;s.add(new T.Mesh(new T.SphereGeometry(10,32,16),new T.MeshBasicMaterial({map:t,side:T.BackSide})));
  var pm=new T.PMREMGenerator(renderer);var rt=pm.fromScene(s,.04);pm.dispose();return rt.texture;};
var OutShader={uniforms:{tDiffuse:{value:null}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform sampler2D tDiffuse;varying vec2 vUv;vec3 toSRGB(vec3 c){return mix(c*12.92,1.055*pow(c,vec3(1.0/2.4))-0.055,step(0.0031308,c));}void main(){vec4 c=texture2D(tDiffuse,vUv);vec2 d=vUv-.5;float v=smoothstep(.85,.25,length(d*vec2(1.0,1.15)));gl_FragColor=vec4(toSRGB(clamp(c.rgb,0.0,1.0))*mix(.72,1.0,v),1.0);}'};
/* setup(renderer,scene,camera,{bloom:strength,threshold}) → {render(), resize()} ; auto quality */
L.setup=function(renderer,scene,camera,o){o=o||{};var tr=tier();
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=o.exposure||1.0;renderer.outputEncoding=T.sRGBEncoding;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,tr==='high'?1.75:tr==='mid'?1.5:1.15));
  if(!scene.environment)scene.environment=L.envMap(renderer);
  var api={composer:null,tier:tr,scene:scene,camera:camera};
  function build(){api.composer=null;if(tr==='low'||!T.EffectComposer||!T.UnrealBloomPass)return;var W=innerWidth,H=innerHeight;
    var gl2=renderer.capabilities.isWebGL2,hf=gl2&&(renderer.extensions.has('EXT_color_buffer_float')||renderer.extensions.has('EXT_color_buffer_half_float'));
    var opts={minFilter:T.LinearFilter,magFilter:T.LinearFilter,format:T.RGBAFormat,type:hf?T.HalfFloatType:T.UnsignedByteType};
    var rt=(gl2&&tr==='high'&&T.WebGLMultisampleRenderTarget)?new T.WebGLMultisampleRenderTarget(W,H,opts):new T.WebGLRenderTarget(W,H,opts);
    var c=new T.EffectComposer(renderer,rt);c.setPixelRatio(renderer.getPixelRatio());c.setSize(W,H);api.rp=new T.RenderPass(scene,camera);c.addPass(api.rp);
    c.addPass(new T.UnrealBloomPass(new T.Vector2(W,H),o.bloom||(tr==='high'?.65:.5),.55,o.threshold||.86));c.addPass(new T.ShaderPass(OutShader));api.composer=c;}
  build();
  api.render=function(){if(api.composer){api.rp.scene=api.scene;api.composer.render();}else renderer.render(api.scene,camera);
    /* adaptive: drop to direct rendering if the device is struggling */
    var now=performance.now();if(!api._t){api._t=now;api._n=0;}api._n++;if(now-api._t>3000){var fps=api._n*1000/(now-api._t);api._t=now;api._n=0;if(fps<32&&!/fx=/.test(location.search)){api._slow=(api._slow||0)+1;if(api._slow>=2&&tr!=='low'){tr=tr==='high'?'mid':'low';api.tier=tr;renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,tr==='mid'?1.4:1));build();api._slow=0;}}else api._slow=0;}};
  api.resize=function(){if(api.composer)api.composer.setSize(innerWidth,innerHeight);};addEventListener('resize',api.resize);
  window.__fx3d=api;return api;};
L.radialTex=function(inner,outer){var c=document.createElement('canvas');c.width=c.height=128;var x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,inner);g.addColorStop(1,outer);x.fillStyle=g;x.fillRect(0,0,128,128);return new T.CanvasTexture(c);};
/* glowing bulbs hung on a sagging wire between points */
L.fairyLights=function(points,n,color){var g=new T.Group();var curvePts=[];for(var i=0;i<points.length-1;i++){var a=points[i],b=points[i+1];for(var k=0;k<=12;k++){var u=k/12;var p=a.clone().lerp(b,u);p.y-=Math.sin(u*Math.PI)*(points.length>3?.2:.35);curvePts.push(p);}}
  var curve=new T.CatmullRomCurve3(curvePts);g.add(new T.Mesh(new T.TubeGeometry(curve,120,.008,4,false),new T.MeshBasicMaterial({color:0x3a2a20})));
  var bulbs=[];var geo=new T.SphereGeometry(.045,10,8);var glowTex=L.radialTex('rgba(255,210,140,.9)','rgba(255,180,90,0)');
  for(var j=0;j<n;j++){var p2=curve.getPointAt((j+.5)/n);var m=new T.MeshBasicMaterial({color:new T.Color(color||0xffd28a).multiplyScalar(2.4),toneMapped:false});var b=new T.Mesh(geo,m);b.position.copy(p2);b.position.y-=.05;g.add(b);
    var sp=new T.Sprite(new T.SpriteMaterial({map:glowTex,transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:.55}));sp.scale.setScalar(.35);sp.position.copy(b.position);g.add(sp);bulbs.push({m:m,s:sp,ph:Math.random()*6});}
  g.userData.update=function(t,chase){bulbs.forEach(function(b,i){var k=.75+.25*Math.sin(t*2.3+b.ph)+(chase?Math.max(0,Math.sin(t*10-i*.6))*.9:0);b.m.color.setRGB(2.4*k,1.9*k,1.1*k);b.s.material.opacity=.45*k;});};return g;};
/* emissive neon tube following a 2D path (array of [x,y]) */
L.neon=function(path,color,r,closed){var pts=path.map(function(p){return new T.Vector3(p[0],p[1],0);});var c=new T.CatmullRomCurve3(pts,!!closed);var col=new T.Color(color);
  var m=new T.MeshBasicMaterial({color:col.clone().multiplyScalar(2.6),toneMapped:false});var tube=new T.Mesh(new T.TubeGeometry(c,160,r||.035,8,!!closed),m);
  var g=new T.Group();g.add(tube);var glow=new T.Mesh(new T.PlaneGeometry(3,3),new T.MeshBasicMaterial({map:L.radialTex('rgba('+Math.round(col.r*255)+','+Math.round(col.g*255)+','+Math.round(col.b*255)+',.45)','rgba(0,0,0,0)'),transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));glow.position.z=-.02;g.add(glow);
  g.userData.mat=m;g.userData.base=col;g.userData.glow=glow;return g;};
L.heartPath=function(s){var p=[];for(var i=0;i<=64;i++){var t=i/64*Math.PI*2;p.push([s*16*Math.pow(Math.sin(t),3)/16,s*(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/16]);}return p;};
L.starPath=function(r){var p=[];for(var i=0;i<=10;i++){var a=Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;p.push([Math.cos(a)*rr,Math.sin(a)*rr]);}return p;};
/* additive light shafts from a window */
L.sunShafts=function(w,h,color){var c=document.createElement('canvas');c.width=64;c.height=256;var x=c.getContext('2d');var g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,'rgba(255,200,130,.55)');g.addColorStop(1,'rgba(255,160,90,0)');x.fillStyle=g;x.fillRect(0,0,64,256);
  var t=new T.CanvasTexture(c);var grp=new T.Group();for(var i=0;i<4;i++){var m=new T.Mesh(new T.PlaneGeometry(w*(.25+Math.random()*.2),h),new T.MeshBasicMaterial({map:t,color:color||0xffffff,transparent:true,opacity:.35,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,toneMapped:false}));m.position.x=(i-1.5)*w*.28;grp.add(m);}
  grp.userData.update=function(tt){grp.children.forEach(function(m,i){m.material.opacity=.1+.05*Math.sin(tt*.7+i*1.7);});};return grp;};
/* 3D star burst particles */
L.burst=function(scene){var N=140,geo=new T.BufferGeometry(),pos=new Float32Array(N*3),col=new Float32Array(N*3),vel=[];geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('color',new T.BufferAttribute(col,3));
  var c=document.createElement('canvas');c.width=c.height=64;var x=c.getContext('2d');x.fillStyle='#fff';x.beginPath();for(var i=0;i<10;i++){var a=-Math.PI/2+i*Math.PI/5,r=i%2?11:30;x.lineTo(32+Math.cos(a)*r,32+Math.sin(a)*r);}x.fill();
  var m=new T.PointsMaterial({size:.22,map:new T.CanvasTexture(c),vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,opacity:0});var pts=new T.Points(geo,m);pts.frustumCulled=false;scene.add(pts);var t=-1;
  var cols=[[2.4,2,.5],[2.4,.7,1.3],[.6,2.2,2.4],[2.2,2.2,2.2]];
  return {fire:function(v){for(var i=0;i<N;i++){pos[i*3]=v.x;pos[i*3+1]=v.y;pos[i*3+2]=v.z;var th=Math.random()*6.283,ph=Math.acos(Math.random()*2-1),s=1.5+Math.random()*2.5;vel[i]=new T.Vector3(Math.sin(ph)*Math.cos(th)*s,Math.abs(Math.cos(ph))*s+1,Math.sin(ph)*Math.sin(th)*s);var cc=cols[i%4];col[i*3]=cc[0];col[i*3+1]=cc[1];col[i*3+2]=cc[2];}geo.attributes.position.needsUpdate=true;geo.attributes.color.needsUpdate=true;t=0;},
    update:function(dt){if(t<0)return;t+=dt;for(var i=0;i<N;i++){var v=vel[i];v.y-=3.5*dt;v.multiplyScalar(1-dt);pos[i*3]+=v.x*dt;pos[i*3+1]+=v.y*dt;pos[i*3+2]+=v.z*dt;}geo.attributes.position.needsUpdate=true;m.opacity=Math.max(0,Math.min(1,1.8-t));if(t>2)t=-1;}};};
/* HTML coin rain over everything (works above modals) */
L.coinRain=function(n){n=n||26;for(var i=0;i<n;i++){(function(i){var e=document.createElement('div');e.textContent='🪙';e.style.cssText='position:fixed;z-index:9600;pointer-events:none;top:-60px;left:'+(Math.random()*100)+'vw;font-size:'+(22+Math.random()*22)+'px;filter:drop-shadow(0 0 8px rgba(249,200,70,.9))';document.body.appendChild(e);
  var dur=1400+Math.random()*1200,rot=(Math.random()*720-360);var a=e.animate([{transform:'translateY(0) rotate(0)'},{transform:'translateY('+(innerHeight+120)+'px) rotate('+rot+'deg)'}],{duration:dur,delay:i*45,easing:'cubic-bezier(.4,.1,.7,1)',fill:'both'});a.onfinish=function(){e.remove();};})(i);}};
/* chunky "3D" letter sprite (canvas shaded) */
L.letterSprite=function(ch,color){var c=document.createElement('canvas');c.width=c.height=256;var x=c.getContext('2d');x.textAlign='center';x.textBaseline='middle';x.font='900 190px "Lalezar","Cairo",sans-serif';
  for(var d=14;d>0;d-=2){x.fillStyle='rgba(0,0,0,'+(.05)+')';x.fillText(ch,128+d*.6,138+d);}var dark=new T.Color(color).multiplyScalar(.6).getStyle();for(var k=10;k>0;k--){x.fillStyle=dark;x.fillText(ch,128+k*.4,128+k);}
  var g=x.createLinearGradient(0,40,0,220);g.addColorStop(0,new T.Color(color).lerp(new T.Color(0xffffff),.45).getStyle());g.addColorStop(1,color);x.fillStyle=g;x.fillText(ch,128,128);
  x.globalAlpha=.6;x.fillStyle='#fff';x.font='900 190px "Lalezar","Cairo",sans-serif';x.save();x.beginPath();x.rect(0,0,256,92);x.clip();x.globalCompositeOperation='source-atop';x.fillRect(0,0,256,92);x.restore();
  var t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;var s=new T.Sprite(new T.SpriteMaterial({map:t,transparent:true}));return s;};
})();
/* HTML star burst at a screen point (above modals) */
(function(){var L=window.V2LOOK;L.starBurstAt=function(x,y,n){n=n||14;var em=['⭐','🌟','✨','💫'];for(var i=0;i<n;i++){var e=document.createElement('div');e.textContent=em[i%4];e.style.cssText='position:fixed;z-index:9601;pointer-events:none;left:'+x+'px;top:'+y+'px;font-size:'+(18+Math.random()*22)+'px;margin:-16px 0 0 -16px;filter:drop-shadow(0 0 10px rgba(255,220,120,.95))';document.body.appendChild(e);
  var a=i/n*Math.PI*2+Math.random()*.3,r=90+Math.random()*110;var an=e.animate([{transform:'translate(0,0) scale(.2)',opacity:1},{transform:'translate('+Math.cos(a)*r*.6+'px,'+Math.sin(a)*r*.6+'px) scale(1.25)',opacity:1,offset:.45},{transform:'translate('+Math.cos(a)*r+'px,'+(Math.sin(a)*r+40)+'px) scale(.6) rotate(140deg)',opacity:0}],{duration:1100,easing:'cubic-bezier(.2,.8,.3,1)',fill:'both'});an.onfinish=(function(el){return function(){el.remove();};})(e);}
  var ring=document.createElement('div');ring.style.cssText='position:fixed;z-index:9600;pointer-events:none;left:'+x+'px;top:'+y+'px;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;border:4px solid #ffd166;box-shadow:0 0 30px #ffb347,inset 0 0 20px #ffd166';document.body.appendChild(ring);
  ring.animate([{transform:'scale(.3)',opacity:1},{transform:'scale(14)',opacity:0}],{duration:800,easing:'cubic-bezier(.1,.7,.3,1)',fill:'both'}).onfinish=function(){ring.remove();};};})();
