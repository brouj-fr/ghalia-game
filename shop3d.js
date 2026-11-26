/* متجر غالية v2 — WebGL boutique: the rack, try-on lineup, coins brief. Offline; three r128 + vendored passes. */
(function(){
'use strict';
var T=THREE,CAT=GSHOP.CAT,SLOT=GSHOP.SLOT,N=CAT.length;
function $(s){return document.querySelector(s);}
function $$(s){return Array.prototype.slice.call(document.querySelectorAll(s));}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function lerp(a,b,t){return a+(b-a)*t;}
function easeIO(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
var AR=['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];function arn(n){return String(n).replace(/\d/g,function(d){return AR[+d];});}
var sfx=V2.sfx;
/* ---------- state (same localStorage keys as the 2D game) ---------- */
function lsGet(k,d){try{var v=localStorage.getItem(k);return v==null?d:v;}catch(e){return d;}}
function lsSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}
function lsJSON(k,d){try{var v=JSON.parse(lsGet(k,'null'));return v==null?d:v;}catch(e){return d;}}
var coins=+lsGet('ghalia_coins','0')||0;
var owned=lsJSON('ghalia_owned',[]);if(!Array.isArray(owned))owned=[];
var swSel=lsJSON('ghalia_acc_sw',{}),hueMap=lsJSON('ghalia_acc_hue',{});
function has(id){return owned.indexOf(id)>=0;}
var look=lsJSON('ghalia_look',[]);if(!Array.isArray(look))look=[];look=look.filter(has);
function saveCoins(){lsSet('ghalia_coins',String(coins));}
addEventListener('storage',function(e){if(e.key==='ghalia_coins'){coins=+e.newValue||0;counter.set(coins);counter2.set(coins);}});
var counter=new V2.RollCounter($('#coins'),coins,4),counter2=new V2.RollCounter($('#coins2'),coins,4);
function setCoins(v){coins=v;saveCoins();counter.set(v);counter2.set(v);}
function refreshOwnedUI(bump){var n=owned.length;$('#stash b').textContent=arn(n);var st='';for(var i=0;i<N;i++)st+='<span class="'+(i<n?'on':'')+'">★</span>';$('#stars').innerHTML=st;
  if(bump){var s=$('#stash');s.classList.remove('bump');void s.offsetWidth;s.classList.add('bump');}}
refreshOwnedUI();
/* ---------- renderer & quality tier ---------- */
var forcedFx=/fx=/.test(location.search);var tier=V2.tier(),coarse=matchMedia('(pointer: coarse)').matches;
var canvas=$('#gl'),renderer;
try{renderer=new T.WebGLRenderer({canvas:canvas,antialias:true,powerPreference:'high-performance'});}
catch(e){location.replace('index.html#room=shop&classic=1');return;}
renderer.setClearColor(0x160a28,1);
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;renderer.outputEncoding=T.sRGBEncoding;
renderer.shadowMap.type=T.PCFSoftShadowMap;
var W=innerWidth,H=innerHeight;
function dprFor(t){var d=window.devicePixelRatio||1;return Math.min(d,t==='high'?1.75:t==='mid'?1.5:1.15);}
var camera=new T.PerspectiveCamera(36,W/H,.1,80);
var clock=new T.Clock();
/* environment for glossy reflections: warm sunset + pink/cyan neon panels */
function makeEnv(){var s=new T.Scene();var c=document.createElement('canvas');c.width=512;c.height=256;var x=c.getContext('2d');
  var g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,'#1d0d38');g.addColorStop(.38,'#6e2a6a');g.addColorStop(.5,'#ff8a5c');g.addColorStop(.56,'#ffd27e');g.addColorStop(.62,'#7a3a52');g.addColorStop(1,'#1a0b2a');x.fillStyle=g;x.fillRect(0,0,512,256);
  x.fillStyle='#ffffff';x.fillRect(220,40,90,34);x.fillStyle='#fff3e0';x.fillRect(60,70,50,26);
  x.fillStyle='#ff477e';x.fillRect(330,92,120,14);x.fillStyle='#00f0ff';x.fillRect(10,96,80,12);x.fillStyle='#f9c846';x.fillRect(150,104,40,10);
  var t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;s.add(new T.Mesh(new T.SphereGeometry(10,48,24),new T.MeshBasicMaterial({map:t,side:T.BackSide})));
  var pm=new T.PMREMGenerator(renderer);var rt=pm.fromScene(s,.03);pm.dispose();return rt.texture;}
var ENV=makeEnv();
var texLoader=new T.TextureLoader();
function loadTex(url){return new Promise(function(res){texLoader.load(url,function(t){t.encoding=T.sRGBEncoding;t.anisotropy=4;res(t);},undefined,function(){res(null);});});}
function radialTex(inner,outer,size){var c=document.createElement('canvas');c.width=c.height=size||128;var x=c.getContext('2d'),r=c.width/2,g=x.createRadialGradient(r,r,0,r,r,r);g.addColorStop(0,inner);g.addColorStop(1,outer);x.fillStyle=g;x.fillRect(0,0,c.width,c.width);var t=new T.CanvasTexture(c);return t;}
var blobTex=radialTex('rgba(10,0,20,.75)','rgba(10,0,20,0)');

/* =================== SHOP SCENE =================== */
var shop=new T.Scene();shop.environment=ENV;shop.fog=new T.Fog(0x2a1238,16,40);
var RAILY=2.6,SP=1.32,RAILHALF=(N-1)/2*SP+.75;
var hemi=new T.HemisphereLight(0xffc7a0,0x2a1240,.42);shop.add(hemi);
var key=new T.SpotLight(0xffd6b0,1.45,30,.6,.65,1.2);key.position.set(-3.5,7.5,6.5);key.target.position.set(0,1.4,0);shop.add(key,key.target);
var rimP=new T.PointLight(0xff477e,1.7,14,1.6);rimP.position.set(4.5,3.2,-1.6);shop.add(rimP);
var rimC=new T.PointLight(0x00f0ff,1.1,14,1.6);rimC.position.set(-4.8,2.6,-1.6);shop.add(rimC);
var fill=new T.DirectionalLight(0xfff0f6,.28);fill.position.set(0,2,9);shop.add(fill);
var focusLight=new T.SpotLight(0xffffff,0,8,.35,.8,1.5);focusLight.position.set(1.5,4,5);shop.add(focusLight,focusLight.target);
/* floor: polished warm wood */
function woodTex(){var c=document.createElement('canvas');c.width=1024;c.height=1024;var x=c.getContext('2d');x.fillStyle='#8a4a3a';x.fillRect(0,0,1024,1024);
  for(var r=0;r<8;r++){for(var k=0;k<3;k++){var y=r*128,off=(r%2)*170+k*341;var hue=14+Math.random()*10,l=30+Math.random()*10;x.fillStyle='hsl('+hue+',45%,'+l+'%)';x.fillRect(off,y+2,339,124);
      x.globalAlpha=.18;for(var s=0;s<14;s++){x.strokeStyle=Math.random()<.5?'#2a0f12':'#d08a6a';x.lineWidth=1+Math.random()*2;x.beginPath();var yy=y+8+Math.random()*112;x.moveTo(off,yy);x.bezierCurveTo(off+110,yy+(Math.random()*8-4),off+220,yy+(Math.random()*8-4),off+339,yy);x.stroke();}x.globalAlpha=1;}
    x.fillStyle='#2a0f14';x.fillRect(0,y,1024,3);}
  var t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(6,3);t.anisotropy=8;return t;}
var floor=new T.Mesh(new T.PlaneGeometry(44,22),new T.MeshStandardMaterial({map:woodTex(),color:0xffb08a,roughness:.3,metalness:0,envMapIntensity:.8}));
floor.rotation.x=-Math.PI/2;floor.position.set(0,0,7.8);floor.receiveShadow=true;shop.add(floor);
/* sunset glow pooled on the floor (from the window) */
var pool=new T.Mesh(new T.PlaneGeometry(9,5),new T.MeshBasicMaterial({map:radialTex('rgba(255,170,90,.55)','rgba(255,120,80,0)'),transparent:true,depthWrite:false,blending:T.AdditiveBlending}));
pool.rotation.x=-Math.PI/2;pool.position.set(-4.5,.012,0);shop.add(pool);
/* back wall (painted plate) */
var wall=new T.Mesh(new T.PlaneGeometry(17.78,10),new T.MeshBasicMaterial({color:new T.Color(.68,.6,.68),toneMapped:false}));wall.position.set(0,3.95,-3.2);shop.add(wall);
/* mood shading over the painted wall: dusky top + edges, like the reference */
(function(){var c=document.createElement('canvas');c.width=256;c.height=256;var x=c.getContext('2d');var g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,'rgba(22,10,40,.85)');g.addColorStop(.32,'rgba(35,21,60,.15)');g.addColorStop(.7,'rgba(35,21,60,0)');g.addColorStop(1,'rgba(35,21,60,.35)');x.fillStyle=g;x.fillRect(0,0,256,256);
  var h=x.createLinearGradient(0,0,256,0);h.addColorStop(0,'rgba(22,10,40,.35)');h.addColorStop(.25,'rgba(22,10,40,0)');h.addColorStop(.75,'rgba(22,10,40,0)');h.addColorStop(1,'rgba(22,10,40,.55)');x.fillStyle=h;x.fillRect(0,0,256,256);
  var t=new T.CanvasTexture(c);var m=new T.Mesh(new T.PlaneGeometry(17.78,10),new T.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,toneMapped:false}));m.position.set(0,3.95,-3.18);shop.add(m);})();
/* neon sign «متجر غالية» */
var signMat=new T.MeshBasicMaterial({transparent:true,toneMapped:false,depthWrite:false,color:new T.Color(1,1,1)});
var sign=new T.Mesh(new T.PlaneGeometry(5.6,1.75),signMat);sign.position.set(.9,3.75,-3.12);shop.add(sign);
var signGlow=new T.Mesh(new T.PlaneGeometry(9,4),new T.MeshBasicMaterial({map:radialTex('rgba(255,71,126,.55)','rgba(255,71,126,0)'),transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));
signGlow.position.set(.9,3.7,-3.15);shop.add(signGlow);
function drawSign(){var c=document.createElement('canvas');c.width=2048;c.height=640;var x=c.getContext('2d');x.textAlign='center';x.textBaseline='middle';x.direction='rtl';
  var txt='متجر غالية';x.font='700 330px "Aref Ruqaa", "Lalezar", serif';
  x.save();x.translate(14,22);x.fillStyle='rgba(60,10,40,.35)';x.filter='blur(10px)';x.fillText(txt,1024,330);x.restore();
  x.lineJoin='round';x.lineCap='round';
  x.shadowColor='#ff1f6a';x.shadowBlur=70;x.strokeStyle='rgba(255,40,110,.85)';x.lineWidth=30;x.strokeText(txt,1024,320);
  x.shadowBlur=30;x.strokeStyle='#ff2f78';x.lineWidth=18;x.strokeText(txt,1024,320);
  x.shadowBlur=10;x.shadowColor='#ff9cc0';x.strokeStyle='#ff8fb6';x.lineWidth=9;x.strokeText(txt,1024,320);
  x.shadowBlur=0;x.strokeStyle='#fff0f6';x.lineWidth=3.5;x.strokeText(txt,1024,320);
  /* little neon heart */
  x.save();x.translate(1810,180);x.scale(2.2,2.2);x.beginPath();x.moveTo(0,22);x.bezierCurveTo(-30,0,-22,-24,0,-10);x.bezierCurveTo(22,-24,30,0,0,22);x.shadowColor='#00f0ff';x.shadowBlur=24;x.strokeStyle='#7ff8ff';x.lineWidth=6;x.stroke();x.restore();
  var t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.anisotropy=4;signMat.map=t;signMat.needsUpdate=true;}
/* rail (white metal garment rail, like the reference) */
var railMat=new T.MeshStandardMaterial({color:0xf6eef4,metalness:.65,roughness:.22,envMapIntensity:1.3});
function pipe(len,r){var m=new T.Mesh(new T.CylinderGeometry(r||.045,r||.045,len,20),railMat);m.castShadow=true;m.receiveShadow=true;return m;}
var rail=new T.Group();shop.add(rail);
var top=pipe(RAILHALF*2+.1);top.rotation.z=Math.PI/2;top.position.y=RAILY;rail.add(top);
[-1,1].forEach(function(sd){var up=pipe(RAILY-.12);up.position.set(sd*RAILHALF,RAILY/2+.06,0);rail.add(up);
  var j=new T.Mesh(new T.SphereGeometry(.07,16,12),railMat);j.position.set(sd*RAILHALF,RAILY,0);rail.add(j);
  var ft=pipe(1.25,.04);ft.rotation.x=Math.PI/2;ft.position.set(sd*RAILHALF,.12,0);rail.add(ft);
  [-1,1].forEach(function(z){var w=new T.Mesh(new T.SphereGeometry(.07,14,10),new T.MeshStandardMaterial({color:0x221030,roughness:.4}));w.position.set(sd*RAILHALF,.07,z*.6);w.castShadow=true;rail.add(w);});});
/* items on the rail */
var items=[];
function Spring(v,k,c){this.x=v;this.v=0;this.t=v;this.k=k||190;this.c=c||15;}
Spring.prototype.step=function(dt){var a=-this.k*(this.x-this.t)-this.c*this.v;this.v+=a*dt;this.x+=this.v*dt;};
var hookMat=new T.MeshStandardMaterial({color:0xd9b46a,metalness:1,roughness:.25});
var ribbonMat=new T.MeshStandardMaterial({color:0xff7eb6,roughness:.5});
function railX(i){return ((N-1)/2-i)*SP;} /* RTL: first item on the right */
function applyTint(it,k){var c=CAT[it.i],m=it.model.userData.tint||[];var base=new T.Color(c.sw[0]),tgt=new T.Color(c.sw[k]);var hb={},ht={};base.getHSL(hb);tgt.getHSL(ht);
  m.forEach(function(mat){if(mat.userData.setHue){mat.userData.setHue(hueDeg(it.i,k));return;}if(!mat.userData.base)mat.userData.base=mat.color.clone();var b=mat.userData.base;
    if(mat.map){mat.color.copy(tgt);}else if(k===0){mat.color.copy(b);}else{var hs={};b.getHSL(hs);mat.color.setHSL((hs.h+(ht.h-hb.h)+1)%1,clamp(hs.s*(ht.s/Math.max(hb.s,.05)),0,1)*(hs.s<.05?0:1)||hs.s,hs.l);}});
  it.sw=k;}
function hueDeg(i,k){var c=CAT[i],a={},b={};new T.Color(c.sw[0]).getHSL(a);new T.Color(c.sw[k]).getHSL(b);return Math.round(((b.h-a.h)*360+360)%360);}
CAT.forEach(function(c,i){var holder=new T.Group(),spin=new T.Group();holder.add(spin);
  var model=GSHOP.build(c.id);var box=new T.Box3().setFromObject(model),sz=new T.Vector3();box.getSize(sz);
  var isB=c.id==='balloon',size=1.18*(c.id==='wings'?1.08:c.id==='tiara'||c.id==='fcrown'?.95:c.id==='heartclip'?.66:c.id==='starsun'?.82:.84);
  model.scale.multiplyScalar(size);var hh=sz.y*size/2;
  var cy=isB?.95:-.34-hh;model.position.y=cy;spin.add(model);
  model.traverse(function(o){if(o.isMesh){o.castShadow=true;}});
  /* hook + ribbon (or balloon string) */
  if(isB){var str=new T.CatmullRomCurve3([new T.Vector3(0,cy-.52,0),new T.Vector3(.05,cy-.7,0),new T.Vector3(-.04,.3,0),new T.Vector3(0,.04,0)]);
    spin.add(new T.Mesh(new T.TubeGeometry(str,30,.008,6,false),new T.MeshStandardMaterial({color:0xf3e6ff,roughness:.6})));
    var knot=new T.Mesh(new T.TorusGeometry(.05,.012,8,20),ribbonMat);knot.rotation.x=Math.PI/2;spin.add(knot);}
  else{var hk=new T.Mesh(new T.TorusGeometry(.085,.013,8,28,Math.PI*1.35),hookMat);hk.rotation.z=-.3;hk.position.y=.02;spin.add(hk);
    var st=new T.Mesh(new T.CylinderGeometry(.012,.012,.12,8),hookMat);st.position.y=-.1;spin.add(st);
    var rb=new T.Mesh(new T.CylinderGeometry(.006,.006,Math.max(.05,-cy-hh-.16),6),ribbonMat);rb.position.y=-.16-(Math.max(.05,-cy-hh-.16))/2;spin.add(rb);}
  var hit=new T.Mesh(new T.BoxGeometry(Math.max(.75,sz.x*size)+.1,sz.y*size+.3,.7),new T.MeshBasicMaterial({visible:false}));hit.position.y=cy;hit.userData.i=i;spin.add(hit);
  var blob=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:blobTex,transparent:true,depthWrite:false,opacity:.75}));blob.rotation.x=-Math.PI/2;blob.scale.set(.9,.55,1);shop.add(blob);
  holder.position.set(railX(i),RAILY,0);shop.add(holder);
  var idle=-.55+((i%3)-1)*.12;
  var it={i:i,c:c,holder:holder,spin:spin,model:model,hit:hit,blob:blob,cy:cy,hh:hh,idle:idle,sw:0,
    px:new Spring(0),pz:new Spring(0),py:new Spring(0),ps:new Spring(1),ry:new Spring(idle,150,13),phase:Math.random()*6,spinExtra:0,tween:null};
  items.push(it);applyTint(it,clamp(+swSel[c.id]||0,0,2));});
var hits=items.map(function(it){return it.hit;});
/* buy burst particles */
var starTex=(function(){var c=document.createElement('canvas');c.width=c.height=64;var x=c.getContext('2d');var g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.8)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);
  x.fillStyle='#fff';x.beginPath();for(var i=0;i<8;i++){var a=i*Math.PI/4,r=i%2?5:30;x.lineTo(32+Math.cos(a)*r,32+Math.sin(a)*r);}x.fill();return new T.CanvasTexture(c);})();
var PN=160,pGeo=new T.BufferGeometry(),pPos=new Float32Array(PN*3),pCol=new Float32Array(PN*3),pVel=[];
pGeo.setAttribute('position',new T.BufferAttribute(pPos,3));pGeo.setAttribute('color',new T.BufferAttribute(pCol,3));
var pMat=new T.PointsMaterial({size:.16,map:starTex,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,opacity:0});
var parts=new T.Points(pGeo,pMat);parts.frustumCulled=false;shop.add(parts);var pT=-1;
function burstAt(v){var cols=[new T.Color(2.2,.6,1.1),new T.Color(2.2,1.6,.5),new T.Color(.6,2,2.2),new T.Color(2,2,2)];
  for(var i=0;i<PN;i++){pPos[i*3]=v.x;pPos[i*3+1]=v.y;pPos[i*3+2]=v.z;var th=Math.random()*Math.PI*2,ph=Math.acos(Math.random()*2-1),s=1.2+Math.random()*2.6;
    pVel[i]=new T.Vector3(Math.sin(ph)*Math.cos(th)*s,Math.cos(ph)*s*.8+1.2,Math.sin(ph)*Math.sin(th)*s*.6);var cc=cols[i%4];pCol[i*3]=cc.r;pCol[i*3+1]=cc.g;pCol[i*3+2]=cc.b;}
  pGeo.attributes.position.needsUpdate=true;pGeo.attributes.color.needsUpdate=true;pT=0;}

/* =================== LOOK (try-on) SCENE =================== */
var lookS=new T.Scene();lookS.environment=ENV;
var lbg=new T.Mesh(new T.PlaneGeometry(26.7,15),new T.MeshBasicMaterial({color:0xffffff,toneMapped:false}));lbg.position.set(0,4.2,-9);lookS.add(lbg);
lookS.add(new T.HemisphereLight(0xc7a0ff,0x160a28,.7));
var lk=new T.SpotLight(0xffe6f2,1.8,20,.5,.6,1.2);lk.position.set(0,6,5);lk.target.position.set(0,1.2,0);lookS.add(lk,lk.target);
var lp1=new T.PointLight(0xff477e,2.2,8,1.5);lp1.position.set(2.2,2,-.8);lookS.add(lp1);
var lp2=new T.PointLight(0x00f0ff,1.8,8,1.5);lp2.position.set(-2.2,2,-.8);lookS.add(lp2);
var lfl=new T.Mesh(new T.CircleGeometry(9,64),new T.MeshStandardMaterial({color:0x1a0d2e,roughness:.12,metalness:.4,transparent:true,opacity:.82,envMapIntensity:1.4}));lfl.rotation.x=-Math.PI/2;lfl.receiveShadow=true;lookS.add(lfl);
var ped=new T.Mesh(new T.CylinderGeometry(.95,1.02,.14,64),new T.MeshPhysicalMaterial({color:0x2a1648,roughness:.25,metalness:.2,clearcoat:1}));ped.position.y=.07;ped.receiveShadow=true;lookS.add(ped);
var ring1=new T.Mesh(new T.TorusGeometry(.99,.018,8,96),new T.MeshBasicMaterial({color:new T.Color(3,.7,1.4),toneMapped:false}));ring1.rotation.x=Math.PI/2;ring1.position.y=.14;lookS.add(ring1);
var ring2=new T.Mesh(new T.TorusGeometry(.72,.01,8,96),new T.MeshBasicMaterial({color:new T.Color(.5,2.6,3),toneMapped:false}));ring2.rotation.x=Math.PI/2;ring2.position.y=.145;lookS.add(ring2);
var GH=2.3,GW=GH*202/600;
var ghalia=new T.Group();ghalia.position.y=.14;lookS.add(ghalia);
var gMat=new T.MeshBasicMaterial({transparent:true,alphaTest:.4,toneMapped:false,color:new T.Color(1,1,1)});
var gPlane=new T.Mesh(new T.PlaneGeometry(GW,GH),gMat);gPlane.position.y=GH/2;ghalia.add(gPlane);
var gBraid=new T.Mesh(new T.PlaneGeometry(GW,GH),new T.MeshBasicMaterial({transparent:true,alphaTest:.4,toneMapped:false,visible:false}));gBraid.position.set(0,GH/2,.001);
var halo1=new T.Mesh(new T.PlaneGeometry(2.2,3.4),new T.MeshBasicMaterial({map:radialTex('rgba(255,71,126,.55)','rgba(255,71,126,0)'),transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));halo1.position.set(.35,1.3,-.25);ghalia.add(halo1);
var halo2=halo1.clone();halo2.material=halo1.material.clone();halo2.material.map=radialTex('rgba(0,240,255,.45)','rgba(0,240,255,0)');halo2.position.set(-.35,1.3,-.3);ghalia.add(halo2);
var gShadow=new T.Mesh(new T.PlaneGeometry(1.1,.45),new T.MeshBasicMaterial({map:blobTex,transparent:true,depthWrite:false,opacity:.9}));gShadow.rotation.x=-Math.PI/2;gShadow.position.y=.146;lookS.add(gShadow);
var worn={};/* id -> object3d */
function slotBox(id){var s=SLOT[id];var wP=s.w,hP=s.r*wP*(202/600);var topP=s.al==='bottom'?s.y-hP:s.al==='center'?s.y-hP/2:s.y;topP+=(s.dy||0);
  return {cx:(s.x/100-.5)*GW,cy:GH*(1-(topP+hP/2)/100),w:wP/100*GW,h:hP/100*GH};}
function wearModel(id){if(worn[id])return;var it=items[CAT.findIndex(function(c){return c.id===id;})];var m=GSHOP.build(id);
  m.traverse(function(o){if(o.isMesh)o.castShadow=true;});applyTint({i:it.i,model:m,sw:0},it.sw);
  var b=slotBox(id),bb=new T.Box3().setFromObject(m),sz=new T.Vector3();bb.getSize(sz);var k=Math.min(b.w/sz.x,b.h/sz.y)*(id==='fcrown'||id==='tiara'?1.1:1);m.scale.multiplyScalar(k);
  m.position.set(b.cx,b.cy,SLOT[id].back?-.12:.07);
  if(id==='fcrown')m.rotation.x=.15;
  var g=new T.Group();g.add(m);
  if(id==='balloon'){var hand=SLOT[id];var hx=(hand.x/100-.5)*GW,hy=GH*(1-hand.y/100);var bot=b.cy-b.h/2;
    var crv=new T.CatmullRomCurve3([new T.Vector3(b.cx,bot+.02,.07),new T.Vector3(b.cx+.03,(bot+hy)/2,.07),new T.Vector3(hx,hy,.07)]);g.add(new T.Mesh(new T.TubeGeometry(crv,16,.005,5,false),new T.MeshStandardMaterial({color:0xf3e6ff})));}
  g.userData.id=id;g.userData.m=m;g.userData.c=new T.Vector3(b.cx,b.cy,.1);ghalia.add(g);worn[id]=g;
  m.scale.multiplyScalar(.01);g.userData.pop=0;}
function unwearModel(id){var g=worn[id];if(!g)return;ghalia.remove(g);delete worn[id];}
function syncWorn(){Object.keys(worn).forEach(function(id){if(look.indexOf(id)<0)unwearModel(id);});look.forEach(wearModel);renderPanel();renderHots();}

/* =================== POST FX =================== */
var composer=null,renderPass,bloom,bokeh,outPass;
var OutShader={uniforms:{tDiffuse:{value:null}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform sampler2D tDiffuse;varying vec2 vUv;vec3 toSRGB(vec3 c){return mix(c*12.92,1.055*pow(c,vec3(1.0/2.4))-0.055,step(0.0031308,c));}void main(){vec4 c=texture2D(tDiffuse,vUv);gl_FragColor=vec4(toSRGB(clamp(c.rgb,0.0,1.0)),1.0);}'};
function buildFX(){if(composer){composer.dispose&&composer.dispose();composer=null;}
  if(tier==='low')return;
  var gl2=renderer.capabilities.isWebGL2,hf=gl2&&(renderer.extensions.has('EXT_color_buffer_float')||renderer.extensions.has('EXT_color_buffer_half_float'));
  var opts={minFilter:T.LinearFilter,magFilter:T.LinearFilter,format:T.RGBAFormat,type:hf?T.HalfFloatType:T.UnsignedByteType};
  var rt=(gl2&&tier==='high'&&T.WebGLMultisampleRenderTarget)?new T.WebGLMultisampleRenderTarget(W,H,opts):new T.WebGLRenderTarget(W,H,opts);
  composer=new T.EffectComposer(renderer,rt);composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(W,H);
  renderPass=new T.RenderPass(curScene(),camera);composer.addPass(renderPass);
  if(tier==='high'){bokeh=new T.BokehPass(curScene(),camera,{focus:6,aperture:.0035,maxblur:.012,width:W,height:H});bokeh.enabled=false;composer.addPass(bokeh);}else bokeh=null;
  bloom=new T.UnrealBloomPass(new T.Vector2(W,H),tier==='high'?.75:.6,.5,.88);composer.addPass(bloom);
  outPass=new T.ShaderPass(OutShader);composer.addPass(outPass);}
function applyTier(){renderer.setPixelRatio(dprFor(tier));renderer.setSize(W,H,false);renderer.shadowMap.enabled=tier!=='low';key.castShadow=lk.castShadow=tier!=='low';
  var ms=tier==='high'?2048:1024;[key,lk].forEach(function(l){l.shadow.mapSize.set(ms,ms);l.shadow.bias=-.0004;l.shadow.normalBias=.02;if(l.shadow.map){l.shadow.map.dispose();l.shadow.map=null;}});
  shop.traverse(function(o){if(o.material)o.material.needsUpdate=true;});lookS.traverse(function(o){if(o.material)o.material.needsUpdate=true;});
  buildFX();document.body.dataset.fx=tier;window.__fx=tier;}

/* =================== CAMERA RIG =================== */
var cam={pos:new T.Vector3(0,2.9,16),look:new T.Vector3(.9,3,-3),tp:new T.Vector3(),tl:new T.Vector3(),rate:3,fov:36,tfov:36};
var mouse={x:0,y:0,sx:0,sy:0};
var sec='hero',focusI=-1,hoverI=-1,pan={x:0,t:0,max:0};
function portrait(){return W/H<.85;}
function rackFrame(){var asp=W/H,p=portrait();var fov=p?44:34;var hv=Math.tan(fov*Math.PI/360);
  var needW=p?3.3:Math.min(7.2,RAILHALF*2+.9),needH=p?3.6:2.7;var d=Math.max((needW/2)/(hv*asp),(needH/2)/hv);d=Math.min(d,p?9.5:14);
  var visW=2*d*hv*asp;pan.max=Math.max(0,RAILHALF+.35-visW/2);
  return {fov:fov,d:d,y:p?1.6:1.8,ly:p?1.45:1.62};}
function setCamTargets(){var f;
  if(sec==='hero'){var p=portrait();cam.tfov=p?50:38;cam.tp.set(p?.9:-.6,p?3.0:2.7,p?11.5:10.5);cam.tl.set(p?.9:-.2,p?3.1:2.7,-3);cam.rate=1.4;}
  else if(sec==='rack'||sec==='coins'){f=rackFrame();cam.tfov=f.fov;
    if(focusI>=0){var it=items[focusI],wp=itemCenter(it);var p2=portrait();var dist=p2?4.6:3.8;
      cam.tp.set(wp.x+(p2?0:-.6),wp.y+(p2?-.6:.1),wp.z+dist);cam.tl.set(wp.x+(p2?0:-.6),wp.y+(p2?-.85:0),wp.z);cam.tfov=p2?44:34;cam.rate=4;}
    else{cam.tp.set(pan.x,f.y,f.d);cam.tl.set(pan.x,f.ly,0);cam.rate=sec==='coins'?2:4;if(sec==='coins'){cam.tp.y+=1.2;cam.tp.z+=2;}}}
  else if(sec==='look'){var p3=portrait();cam.tfov=p3?40:30;cam.tp.set(p3?0:-.65,p3?1.7:1.45,p3?8.1:4.0);cam.tl.set(p3?0:-.65,p3?.72:1.32,0);cam.rate=2.6;}}
function itemCenter(it){var v=new T.Vector3(0,it.cy,0);it.spin.localToWorld(v);return v;}
function curScene(){return sec==='look'?lookS:shop;}

/* =================== SECTIONS =================== */
var LABEL={hero:'غالية',rack:'الرف',look:'جربي اللوك',coins:'العملات'};
function go(s,opts){opts=opts||{};if(s===sec&&!opts.force)return;var from=sec;
  V2.wipe(function(){sec=s;document.body.dataset.sec=s;$$('#tabs button').forEach(function(b){b.classList.toggle('on',b.dataset.go===s);});
    if(s!=='rack'&&focusI>=0)unfocus(true);setHover(-1);
    if(renderPass){renderPass.scene=curScene();if(bokeh)bokeh.scene=curScene();}
    if(s==='look'){syncWorn();cam.pos.set(0,2.4,10.5);cam.look.set(0,1.6,0);sfx.whooshIn();}
    if(s==='rack'&&from==='hero'){cam.pos.set(-.4,2.4,11);rackFrame();pan.x=pan.max;}
    if(s==='rack'&&opts.focus!=null){setTimeout(function(){focus(opts.focus);},450);}
    setCamTargets();try{history.replaceState(null,'','#'+s);}catch(e){}},from==='hero'||s==='look'?LABEL[s]:'');}
$$('[data-go]').forEach(function(b){b.addEventListener('click',function(e){e.preventDefault();V2.audioUnlock();sfx.click();go(b.dataset.go);});});
$('#enter').addEventListener('click',function(){V2.audioUnlock();sfx.click();go('rack');});
$('#first').addEventListener('click',function(){sfx.click();var i=0;for(var k=0;k<N;k++){if(!has(CAT[k].id)){i=k;break;}}focus(i);});
$('#snd').addEventListener('click',function(){var on=!V2.isSound();V2.setSound(on);V2.music(on);V2.audioUnlock();$('#snd').textContent=on?'🔊':'🔇';if(on)sfx.click();});
$('#snd').textContent=V2.isSound()?'🔊':'🔇';
$('#home').addEventListener('click',function(e){e.preventDefault();sfx.click();var h=this.href;V2.wipe(function(){location.href=h;},'البيت');});
$$('.ccard').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();sfx.click();var h=a.href;V2.wipe(function(){location.href=h;},'يلا!');});});

/* =================== RACK INTERACTION =================== */
var tagEl=$('#tag');
function setHover(i){if(i===hoverI)return;hoverI=i;
  items.forEach(function(it,j){if(focusI>=0)return;
    if(i<0){it.px.t=0;it.pz.t=0;it.py.t=0;it.ps.t=1;it.ry.t=it.idle;}
    else if(j===i){it.px.t=0;it.pz.t=1.25;it.py.t=.08;it.ps.t=1.16;it.ry.t=0;}
    else{var d=j-i,sx=Math.sign(railX(j)-railX(i));var push=.42/Math.pow(Math.abs(d),1.1);it.px.t=sx*push;it.pz.t=-.14;it.py.t=0;it.ps.t=.97;it.ry.t=it.idle+sx*.15;}});
  if(i>=0){sfx.pop();setTimeout(sfx.swish,40);var c=CAT[i];tagEl.querySelector('.n').textContent=c.name;tagEl.querySelector('.p').textContent=has(c.id)?'✔ عندج':'🪙 '+arn(c.price);tagEl.classList.toggle('own',has(c.id));tagEl.classList.add('on');}
  else tagEl.classList.remove('on');}
function focus(i){if(sec!=='rack'){go('rack',{focus:i});return;}
  if(focusI===i)return;var prev=focusI;focusI=i;hoverI=-2;tagEl.classList.remove('on');
  items.forEach(function(it,j){if(j===i){it.px.t=0;it.pz.t=1.1;it.py.t=.06;it.ps.t=1.15;it.ry.t=0;}else{var sx=Math.sign(railX(j)-railX(i));it.px.t=sx*.55;it.pz.t=-.45;it.py.t=0;it.ps.t=.92;it.ry.t=it.idle;}});
  if(Math.abs(railX(i)-pan.x)>.01&&portrait()){pan.x=clamp(railX(i),-pan.max,pan.max);}
  $('#rack').classList.add('focus');fillCard(i);sfx.whoosh();if(bokeh)bokeh.enabled=true;setCamTargets();}
function unfocus(silent){if(focusI<0)return;var i=focusI;focusI=-1;hoverI=-2;$('#rack').classList.remove('focus');if(bokeh)bokeh.enabled=false;
  var it=items[i];it.spinExtra=((it.spinExtra%(Math.PI*2))+Math.PI*2)%(Math.PI*2);if(it.spinExtra>Math.PI)it.spinExtra-=Math.PI*2;tweenSpin(it,0,.6);
  setHover(-1);if(!silent)sfx.whooshIn();setCamTargets();}
function fillCard(i){var c=CAT[i],own=has(c.id);$('#fnum').textContent=arn('0'+(i+1));$('#fname').textContent=c.name;$('#fdesc').textContent=c.desc;
  var pr=$('#fprice');pr.textContent=own?'✔ عندج':'🪙 '+arn(c.price);pr.classList.toggle('own',own);
  var b=$('#buy');b.textContent=own?'لبسيها غالية ✨':'اشتريها · 🪙 '+arn(c.price);b.dataset.mode=own?'wear':'buy';
  $('#wear').style.display=own?'none':'';
  var sw=$('#fsw');sw.innerHTML='';c.sw.forEach(function(col,k){var e=document.createElement('button');e.style.background=col;e.className=items[i].sw===k?'on':'';e.setAttribute('aria-label','لون '+(k+1));
    e.addEventListener('click',function(){applyTint(items[i],k);swSel[c.id]=k;hueMap[c.id]=hueDeg(i,k);lsSet('ghalia_acc_sw',JSON.stringify(swSel));lsSet('ghalia_acc_hue',JSON.stringify(hueMap));
      $$('#fsw button').forEach(function(x,n){x.className=n===k?'on':'';});sfx.sparkle();items[i].ps.v+=1.5;if(worn[c.id]){unwearModel(c.id);}});sw.appendChild(e);});}
function tweenSpin(it,to,dur){it.tween={from:it.spinExtra,to:to,t:0,d:dur||.6};}
$('#rotL').addEventListener('click',function(){if(focusI<0)return;var it=items[focusI];sfx.swish();tweenSpin(it,(it.tween?it.tween.to:it.spinExtra)-Math.PI,.6);});
$('#rotR').addEventListener('click',function(){if(focusI<0)return;var it=items[focusI];sfx.swish();tweenSpin(it,(it.tween?it.tween.to:it.spinExtra)+Math.PI,.6);});
$('#close').addEventListener('click',function(){sfx.click();unfocus();});
var toastT=0;function toast(html){var t=$('#toast');t.innerHTML=html;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('on');},3200);
  var b=t.querySelector('button');if(b)b.addEventListener('click',function(){t.classList.remove('on');sfx.click();go(b.dataset.to);});}
$('#buy').addEventListener('click',function(){if(focusI<0)return;var i=focusI,c=CAT[i],it=items[i];V2.audioUnlock();
  if(has(c.id)){sfx.click();if(look.indexOf(c.id)<0)addLook(c.id);go('look');return;}
  if(coins<c.price){sfx.nope();var card=$('#focus .card');card.classList.remove('shake');void card.offsetWidth;card.classList.add('shake');it.ps.v-=2;
    toast('باقي 🪙 '+arn(c.price-coins)+' — العبي ألعاب وجمّعي عملات! 🎮 <button data-to="coins">وين أجمع؟</button>');return;}
  setCoins(coins-c.price);owned.push(c.id);lsSet('ghalia_owned',JSON.stringify(owned));if(look.indexOf(c.id)<0)addLook(c.id);
  refreshOwnedUI(true);fillCard(i);celebrate(it,c);});
$('#wear').addEventListener('click',function(){if(focusI<0)return;var c=CAT[focusI];sfx.click();
  if(!has(c.id)){toast('اشتريها أول عشان تلبسها غالية 💗');return;}go('look');});
function celebrate(it,c){sfx.chime();setTimeout(sfx.sparkle,250);burstAt(itemCenter(it));tweenSpin(it,it.spinExtra+Math.PI*2,1.1);it.ps.v+=4;
  var b=$('#burst');b.querySelector('.amt').textContent='− '+c.price+' 🪙';b.querySelector('small').textContent=c.tip+' تلاقينها بغرفة الملابس';
  if(b.animate)b.animate([{opacity:0,transform:'scale(.6)',filter:'blur(12px)'},{opacity:1,transform:'scale(1.06)',filter:'blur(0)',offset:.18},{opacity:1,transform:'scale(1)',offset:.75},{opacity:0,transform:'scale(1.04)',filter:'blur(6px)'}],{duration:2300,easing:'ease-out'});}
function addLook(id){var s=SLOT[id].slot;look=look.filter(function(x){return SLOT[x].slot!==s;});look.push(id);lsSet('ghalia_look',JSON.stringify(look));}

/* pointer handling: hover (mouse), tap-lift / tap-focus (touch), drag = swipe rail or rotate focused item */
var ray=new T.Raycaster(),ndc=new T.Vector2(),down=null;
function pick(e){ndc.set(e.clientX/W*2-1,-(e.clientY/H)*2+1);ray.setFromCamera(ndc,camera);var h=ray.intersectObjects(hits,false);return h.length?h[0].object.userData.i:-1;}
canvas.addEventListener('pointerdown',function(e){V2.audioUnlock();down={x:e.clientX,y:e.clientY,t:performance.now(),px:pan.x,moved:false,id:e.pointerId,lx:e.clientX};try{canvas.setPointerCapture(e.pointerId);}catch(_){}});
canvas.addEventListener('pointermove',function(e){mouse.x=e.clientX/W*2-1;mouse.y=e.clientY/H*2-1;
  if(down&&e.pointerId===down.id){var dx=e.clientX-down.x;if(Math.abs(dx)>8||Math.abs(e.clientY-down.y)>8)down.moved=true;
    if(down.moved&&sec==='rack'){if(focusI>=0){var it=items[focusI];it.tween=null;it.spinExtra+=(e.clientX-down.lx)*.012;}
      else{var f=rackFrame();var visW=2*f.d*Math.tan(f.fov*Math.PI/360)*(W/H);pan.x=clamp(down.px-dx*visW/W*1.1,-pan.max-.4,pan.max+.4);if(e.pointerType!=='mouse')setHover(-1);setCamTargets();}}
    down.lx=e.clientX;return;}
  if(sec==='rack'&&focusI<0&&e.pointerType==='mouse'){var i=pick(e);setHover(i);canvas.style.cursor=i>=0?'pointer':'grab';}
  else if(sec==='look'&&e.pointerType==='mouse'){ghHover=pickGhalia(e);canvas.style.cursor=ghHover?'pointer':'default';}});
function up(e){if(!down||e.pointerId!==down.id)return;var d=down;down=null;pan.x=clamp(pan.x,-pan.max,pan.max);setCamTargets();if(d.moved)return;
  if(sec==='rack'){var i=pick(e);
    if(focusI>=0){if(i>=0&&i!==focusI)focus(i);else if(i<0)unfocus();return;}
    if(i<0){setHover(-1);return;}
    if(e.pointerType==='mouse'||hoverI===i)focus(i);else setHover(i);}
  else if(sec==='look'){if(pickGhalia(e))ghTap();}
  else if(sec==='hero'){}}
canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',function(){down=null;});
canvas.addEventListener('pointerleave',function(e){if(e.pointerType==='mouse'&&sec==='rack'&&focusI<0)setHover(-1);});
canvas.addEventListener('wheel',function(e){if(sec!=='rack'||focusI>=0)return;pan.x=clamp(pan.x+(e.deltaX||e.deltaY)*.006,-pan.max,pan.max);setCamTargets();},{passive:true});
addEventListener('keydown',function(e){if(sec!=='rack')return;
  if(e.key==='Escape'){unfocus();return;}
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){var dir=e.key==='ArrowLeft'?1:-1;/* RTL: left = next */
    if(focusI>=0){var it=items[focusI];tweenSpin(it,(it.tween?it.tween.to:it.spinExtra)+dir*Math.PI,.6);sfx.swish();}
    else{var n=clamp((hoverI<0?-1:hoverI)+dir,0,N-1);setHover(n);pan.x=clamp(railX(n),-pan.max,pan.max);setCamTargets();}}
  if(e.key==='Enter'&&hoverI>=0&&focusI<0)focus(hoverI);});
/* ---- look interactions ---- */
var ghHover=false,ghHop=0;
function pickGhalia(e){ndc.set(e.clientX/W*2-1,-(e.clientY/H)*2+1);ray.setFromCamera(ndc,camera);return ray.intersectObject(gPlane,false).length>0;}
function ghTap(){ghHop=1;sfx.pop();setTimeout(sfx.sparkle,120);var v=new T.Vector3(0,GH*.7,0);ghalia.localToWorld(v);}
var plist=$('#plist'),thumbs={};
function renderPanel(){plist.innerHTML='';CAT.forEach(function(c,i){var li=document.createElement('li');var own=has(c.id),on=look.indexOf(c.id)>=0;li.className=(own?'':'lock ')+(on?'on':'');
  li.innerHTML='<img alt="" src="'+(thumbs[c.id]||'')+'"><div class="nm">'+c.name+'<small>'+(own?(on?'لابستها الحين':'عندج — جربيها'):'🪙 '+arn(c.price)+' · موجودة بالرف')+'</small></div><span class="tg">'+(own?(on?'✓ لابستها':'لبسي'):'شوفيها')+'</span>';
  li.addEventListener('click',function(){V2.audioUnlock();if(!own){sfx.click();go('rack',{focus:i});return;}
    if(on){look=look.filter(function(x){return x!==c.id;});sfx.swish();}else{addLook(c.id);sfx.sparkle();}lsSet('ghalia_look',JSON.stringify(look));syncWorn();});plist.appendChild(li);});
  $('#wearN').textContent=arn(look.length);}
var hotsEl=$('#hots'),tipEl=null;
function renderHots(){hotsEl.innerHTML='';tipEl=null;look.forEach(function(id){var b=document.createElement('button');b.className='hot';b.textContent='+';b.dataset.id=id;
  b.addEventListener('click',function(ev){ev.stopPropagation();sfx.click();if(tipEl)tipEl.remove();var c=CAT.filter(function(x){return x.id===id;})[0];
    tipEl=document.createElement('div');tipEl.className='tip';tipEl.dataset.id=id;tipEl.innerHTML='<span>'+c.tip+'</span><button>شيليها</button>';hotsEl.appendChild(tipEl);
    tipEl.querySelector('button').addEventListener('click',function(){look=look.filter(function(x){return x!==id;});lsSet('ghalia_look',JSON.stringify(look));sfx.swish();syncWorn();});});hotsEl.appendChild(b);});}
$('#save').addEventListener('click',function(){V2.audioUnlock();sfx.chime();lsSet('ghalia_look',JSON.stringify(look));
  var b=$('#burst');b.querySelector('b').textContent='لوك يجنن!';b.querySelector('.amt').textContent='';b.querySelector('small').textContent='يلا نروح غرفة الملابس 👗';
  if(b.animate)b.animate([{opacity:0,transform:'scale(.6)'},{opacity:1,transform:'scale(1.05)',offset:.25},{opacity:1,transform:'scale(1)',offset:.8},{opacity:0}],{duration:1500});
  setTimeout(function(){b.querySelector('b').textContent='صار عندج!';V2.wipe(function(){location.href='index.html#room=dress';},'غرفة الملابس');},1250);});

/* thumbnails: render each model once into a small sRGB target */
function makeThumbs(){if(GSHOP.ART&&!/[?&]procedural/.test(location.search)){CAT.forEach(function(c){thumbs[c.id]=GSHOP.img(c.id);});return;}var rt=new T.WebGLRenderTarget(160,160,{format:T.RGBAFormat});rt.texture.encoding=T.sRGBEncoding;var ts=new T.Scene();ts.environment=ENV;
  ts.add(new T.HemisphereLight(0xffffff,0x8a5a7a,.45));var dl=new T.DirectionalLight(0xffffff,.8);dl.position.set(2,3,4);ts.add(dl);var pl=new T.PointLight(0xff477e,1,6);pl.position.set(-2,1,1);ts.add(pl);
  var tc=new T.PerspectiveCamera(30,1,.1,20);tc.position.set(0,.15,3);tc.lookAt(0,0,0);var buf=new Uint8Array(160*160*4),cv=document.createElement('canvas');cv.width=cv.height=160;var cx=cv.getContext('2d'),id=cx.createImageData(160,160);
  var prevClear=renderer.getClearAlpha();renderer.setClearColor(0x000000,0);
  CAT.forEach(function(c,i){var m=GSHOP.build(c.id);applyTint({i:i,model:m,sw:0},items[i].sw);m.rotation.y=-.35;ts.add(m);if(m.children[0].userData.update)m.children[0].userData.update(.4);
    renderer.setRenderTarget(rt);renderer.clear();renderer.render(ts,tc);renderer.readRenderTargetPixels(rt,0,0,160,160,buf);
    for(var y=0;y<160;y++){id.data.set(buf.subarray((159-y)*640,(160-y)*640),y*640);}cx.putImageData(id,0,0);thumbs[c.id]=cv.toDataURL();ts.remove(m);});
  renderer.setRenderTarget(null);renderer.setClearColor(0x160a28,prevClear);rt.dispose();}

/* =================== LOOP =================== */
var tAcc=0,frames=0,slowStrikes=0,started=false,neonT=0,last=performance.now();
function frame(now){requestAnimationFrame(frame);if(document.hidden)return;var dt=Math.min(.05,(now-last)/1000);last=now;var t=clock.getElapsedTime();
  /* camera */
  mouse.sx=lerp(mouse.sx,mouse.x,1-Math.exp(-dt*3));mouse.sy=lerp(mouse.sy,mouse.y,1-Math.exp(-dt*3));
  var k=1-Math.exp(-dt*cam.rate);cam.pos.lerp(cam.tp,k);cam.look.lerp(cam.tl,k);cam.fov=lerp(cam.fov,cam.tfov,k);
  var par=sec==='hero'?.45:sec==='rack'&&focusI<0?.12:.05,dolly=sec==='hero'?Math.sin(t*.15)*.6:0;
  camera.position.set(cam.pos.x+mouse.sx*par,cam.pos.y-mouse.sy*par*.5,cam.pos.z+dolly);camera.lookAt(cam.look);if(Math.abs(camera.fov-cam.fov)>.01){camera.fov=cam.fov;camera.updateProjectionMatrix();}
  if(sec==='hero'){var ht=$('.heroTxt');if(ht)ht.style.translate=(-mouse.sx*12)+'px '+(-mouse.sy*8)+'px';}
  if(sec!=='look'){
    /* neon flicker-on then steady hum */
    neonT+=dt;var fl=neonT<1.6?((Math.sin(neonT*40)>.2||neonT>1.2)?1:.15)*(neonT<.5?.3:1):(.96+Math.sin(t*9)*.02+(Math.random()<.004?-.4:0));
    signMat.color.setScalar(1.35*fl);signGlow.material.opacity=.9*fl;
    items.forEach(function(it){['px','pz','py','ps','ry'].forEach(function(p){it[p].step(dt);});
      if(it.tween){it.tween.t+=dt;var u=Math.min(1,it.tween.t/it.tween.d);it.spinExtra=lerp(it.tween.from,it.tween.to,easeIO(u));if(u>=1)it.tween=null;}
      var sway=focusI===it.i?0:Math.sin(t*1.1+it.phase)*.025;var bob=it.c.id==='balloon'?Math.sin(t*1.6+it.phase)*.05:0;
      it.holder.position.set(railX(it.i)+it.px.x,RAILY+it.py.x+bob,it.pz.x);it.holder.rotation.z=sway;it.holder.scale.setScalar(it.ps.x);
      it.spin.rotation.y=it.ry.x+it.spinExtra+(focusI<0&&hoverI!==it.i?Math.sin(t*.7+it.phase)*.08:0);
      if(it.model.children[0].userData.update)it.model.children[0].userData.update(t+it.phase);
      it.blob.position.set(it.holder.position.x,.011,it.holder.position.z+.05);var hgt=RAILY+it.cy;it.blob.material.opacity=.55*clamp(1.6/hgt,.3,1)*(it.c.id==='balloon'?.4:1);});
    if(focusI>=0){var fc=itemCenter(items[focusI]);focusLight.intensity=lerp(focusLight.intensity,1.3,k);focusLight.target.position.copy(fc);focusLight.position.set(fc.x+1.4,fc.y+2.5,fc.z+3);
      if(bokeh){bokeh.uniforms.focus.value=camera.position.distanceTo(fc);}}
    else focusLight.intensity=lerp(focusLight.intensity,0,k);
    if(pT>=0){pT+=dt;for(var i=0;i<PN;i++){var v=pVel[i];v.y-=3.2*dt;v.multiplyScalar(1-dt*1.2);pPos[i*3]+=v.x*dt;pPos[i*3+1]+=v.y*dt;pPos[i*3+2]+=v.z*dt;}pGeo.attributes.position.needsUpdate=true;pMat.opacity=clamp(1.6-pT,0,1);pMat.size=.16*(1+pT*.3);if(pT>2)pT=-1;}
    /* price tag follows hovered item */
    if(hoverI>=0&&focusI<0){var v2=new T.Vector3(0,items[hoverI].c.id==='balloon'?items[hoverI].cy+.6:.15,0);items[hoverI].spin.localToWorld(v2);v2.project(camera);tagEl.style.left=((v2.x+1)/2*W)+'px';tagEl.style.top=((1-v2.y)/2*H-8)+'px';}
  } else {
    ghHop=Math.max(0,ghHop-dt*1.6);var hop=Math.sin(ghHop*Math.PI)*.25;ghalia.position.y=.14+hop+Math.sin(t*2)*.008;ghalia.rotation.y=ghHop>0?(1-ghHop)*Math.PI*2:Math.sin(t*.5)*.04;
    gMat.color.setScalar(lerp(gMat.color.r,ghHover?1.18:1,1-Math.exp(-dt*8)));halo1.material.opacity=.8+Math.sin(t*1.7)*.2;halo2.material.opacity=.8+Math.cos(t*1.3)*.2;
    gShadow.scale.setScalar(1-hop*.8);ring1.material.color.setRGB(3*(.85+Math.sin(t*3)*.15),.7,1.4);
    Object.keys(worn).forEach(function(id){var g=worn[id],m=g.userData.m;if(g.userData.pop<1){g.userData.pop=Math.min(1,g.userData.pop+dt*2.5);var u=g.userData.pop,s=1+Math.sin(u*Math.PI)*.25;var full=m.userData.full||(m.userData.full=m.scale.x*100);m.scale.setScalar(full*u*s);}
      if(m.children[0].userData.update)m.children[0].userData.update(t);if(id==='balloon')m.position.x+=(Math.sin(t*1.4)*.002);});
    /* hotspots */
    $$('.hot').forEach(function(b){var g=worn[b.dataset.id];if(!g)return;var v=g.userData.c.clone();ghalia.localToWorld(v);v.project(camera);b.style.left=((v.x+1)/2*W)+'px';b.style.top=((1-v.y)/2*H)+'px';
      if(tipEl&&tipEl.dataset.id===b.dataset.id){tipEl.style.left=b.style.left;tipEl.style.top=b.style.top;}});
  }
  if(composer){composer.render(dt);}else{renderer.render(curScene(),camera);}
  /* adaptive quality: step down if the device struggles */
  if(started&&!forcedFx){tAcc+=dt;frames++;if(tAcc>2.5){var fps=frames/tAcc;tAcc=0;frames=0;if(fps<38&&tier!=='low'){slowStrikes++;if(slowStrikes>=2){tier=tier==='high'?'mid':'low';slowStrikes=0;applyTier();}}else slowStrikes=0;}}
}
function resize(){W=innerWidth;H=innerHeight;camera.aspect=W/H;camera.updateProjectionMatrix();renderer.setSize(W,H,false);if(composer){composer.setSize(W,H);}setCamTargets();}
addEventListener('resize',resize);addEventListener('orientationchange',function(){setTimeout(resize,250);});

/* =================== BOOT =================== */
V2.grain(document.body,{opacity:tier==='low'?.05:.075});
var fontsReady=(document.fonts&&document.fonts.load)?Promise.all([document.fonts.load('700 80px "Aref Ruqaa"','متجر غالية'),document.fonts.load('400 40px "Lalezar"','الرف'),document.fonts.load('900 16px "Cairo"','عملات')]).catch(function(){}):Promise.resolve();
Promise.all([loadTex('img/boutique-wall.jpg'),loadTex('img/dress-room.jpg'),loadTex('img/ghalia.png'),fontsReady]).then(function(r){
  if(r[0]){wall.material.map=r[0];wall.material.needsUpdate=true;}if(r[1]){lbg.material.map=r[1];lbg.material.needsUpdate=true;}if(r[2]){r[2].anisotropy=8;gMat.map=r[2];gMat.needsUpdate=true;}
  drawSign();applyTier();makeThumbs();renderPanel();
  var h=(location.hash||'').replace('#','');sec='hero';if(LABEL[h]&&h!=='hero'){sec=h;document.body.dataset.sec=h;if(h==='look')syncWorn();}
  $$('#tabs button').forEach(function(b){b.classList.toggle('on',b.dataset.go===sec);});
  rackFrame();pan.x=pan.max;setCamTargets();if(sec!=='hero'){cam.pos.copy(cam.tp).add(new T.Vector3(0,.6,3));cam.look.copy(cam.tl);}
  if(renderPass){renderPass.scene=curScene();if(bokeh)bokeh.scene=curScene();}
  requestAnimationFrame(function(n){last=n;frame(n);document.body.classList.add('ready');setTimeout(function(){started=true;},1500);});
});
/* test hooks */
window.__shop={focus:function(i){focus(i);},go:go,state:function(){return {sec:sec,focusI:focusI,hoverI:hoverI,coins:coins,owned:owned.slice(),look:look.slice(),tier:tier,panMax:pan.max};},hover:function(i){setHover(i);},itemScreen:function(i){var v=itemCenter(items[i]).project(camera);return {x:(v.x+1)/2*W,y:(1-v.y)/2*H};}};
})();
