/* Ghalia shop v2 — stylised 3D accessory models (procedural, no external assets). Requires THREE r128. */
(function(){
'use strict';
var T=THREE;
function glossy(c,o){o=o||{};return new T.MeshPhysicalMaterial(Object.assign({color:c,roughness:.3,metalness:0,clearcoat:1,clearcoatRoughness:.08,envMapIntensity:.85},o));}
function metal(c,r){return new T.MeshStandardMaterial({color:c,metalness:1,roughness:r==null?.22:r,envMapIntensity:1.5});}
function gem(c){return new T.MeshPhysicalMaterial({color:c,roughness:.02,metalness:.1,clearcoat:1,clearcoatRoughness:0,flatShading:true,envMapIntensity:2.6,emissive:new T.Color(c).multiplyScalar(.18)});}
function heartShape(s){var h=new T.Shape();s=s||1;
  h.moveTo(0,-.95*s);h.bezierCurveTo(-.25*s,-.72*s,-1.02*s,-.25*s,-1.02*s,.28*s);h.bezierCurveTo(-1.02*s,.82*s,-.35*s,1.02*s,0,.58*s);
  h.bezierCurveTo(.35*s,1.02*s,1.02*s,.82*s,1.02*s,.28*s);h.bezierCurveTo(1.02*s,-.25*s,.25*s,-.72*s,0,-.95*s);return h;}
function starPts(r,ri,n,rot){var p=[];n=n||5;rot=rot||0;for(var i=0;i<n*2;i++){var a=Math.PI/2+rot+i*Math.PI/n,rr=i%2?ri:r;p.push(new T.Vector2(Math.cos(a)*rr,Math.sin(a)*rr));}return p;}
function ext(shape,o){var g=new T.ExtrudeGeometry(shape,Object.assign({depth:.2,bevelEnabled:true,bevelThickness:.08,bevelSize:.06,bevelSegments:5,curveSegments:28},o||{}));g.center();return g;}
function mesh(g,m,cs){var x=new T.Mesh(g,m);x.castShadow=cs!==false;x.receiveShadow=true;return x;}
function flower(petal,center,r){var g=new T.Group();var pg=new T.SphereGeometry(1,20,14);
  for(var i=0;i<5;i++){var a=i/5*Math.PI*2,p=mesh(pg,petal);p.scale.set(r*.62,r*.42,r*.26);p.position.set(Math.cos(a)*r*.62,Math.sin(a)*r*.62,0);p.rotation.z=a;g.add(p);}
  var c=mesh(new T.SphereGeometry(r*.36,20,14),center);c.position.z=r*.14;g.add(c);return g;}
function normalize(g,size){var b=new T.Box3().setFromObject(g),s=new T.Vector3(),c=new T.Vector3();b.getSize(s);b.getCenter(c);
  var k=(size||1)/Math.max(s.x,s.y);var w=new T.Group();g.position.sub(c);w.add(g);w.scale.setScalar(k);w.userData=g.userData;return w;}

var B={};
/* 1 heart hair clip */
B.heartclip=function(){var g=new T.Group(),pink=glossy(0xff3d8b);
  var h=mesh(ext(heartShape(.5),{depth:.12,bevelThickness:.1,bevelSize:.08,bevelSegments:8}),pink);g.add(h);
  var rim=metal(0xffd27a,.18);var gems=new T.Group();var shp=heartShape(.5).getSpacedPoints(22);
  shp.forEach(function(p,i){if(i%2)return;var s=mesh(new T.IcosahedronGeometry(.032,0),gem(0xffffff));s.position.set(p.x*.82,p.y*.82-.02,.17);gems.add(s);});g.add(gems);
  var bar=mesh(new T.CylinderGeometry(.045,.045,1.05,16),rim);bar.rotation.z=Math.PI/2;bar.position.set(0,.05,-.16);g.add(bar);
  var tip=mesh(new T.SphereGeometry(.05,16,12),rim);tip.position.set(.52,.05,-.16);g.add(tip);
  g.userData.tint=[pink];return g;};
/* 2 star sunglasses */
B.starsun=function(){var g=new T.Group(),frame=glossy(0x8a2be2,{roughness:.25}),lensM=new T.MeshPhysicalMaterial({color:0xffd34d,emissive:0x8a5a00,emissiveIntensity:.5,roughness:.05,metalness:0,clearcoat:1,transparent:true,opacity:.85,envMapIntensity:1.5,side:T.DoubleSide});
  [-1,1].forEach(function(sd){var outer=new T.Shape(starPts(.36,.17));var inner=new T.Path(starPts(.27,.12).reverse());outer.holes.push(inner);
    var f=mesh(ext(outer,{depth:.06,bevelThickness:.03,bevelSize:.025,bevelSegments:4}),frame);f.position.x=sd*.42;g.add(f);
    var l=mesh(new T.ShapeGeometry(new T.Shape(starPts(.28,.13)),8),lensM,false);l.position.set(sd*.42,0,0);g.add(l);
    var arm=mesh(new T.BoxGeometry(.035,.05,.75),frame);arm.position.set(sd*.74,.1,-.36);arm.rotation.y=sd*-.08;g.add(arm);
    var tipm=mesh(new T.SphereGeometry(.04,12,10),frame);tipm.position.set(sd*.77,.06,-.73);g.add(tipm);});
  var br=new T.QuadraticBezierCurve3(new T.Vector3(-.13,.12,0),new T.Vector3(0,.24,.03),new T.Vector3(.13,.12,0));
  g.add(mesh(new T.TubeGeometry(br,20,.03,10,false),frame));
  g.userData.tint=[frame];return g;};
/* 3 golden bow */
B.bowGold=function(){var g=new T.Group(),gold=glossy(0xf0a818,{metalness:.7,roughness:.26,clearcoat:.8});
  function loop(sd){var s=new T.Shape();s.moveTo(0,0);s.bezierCurveTo(sd*.25,.45,sd*.9,.55,sd*.95,.18);s.bezierCurveTo(sd*1.0,-.15,sd*.75,-.45,sd*.62,-.42);s.bezierCurveTo(sd*.4,-.38,sd*.2,-.12,0,0);return s;}
  [-1,1].forEach(function(sd){var m=mesh(ext(loop(sd),{depth:.16,bevelThickness:.09,bevelSize:.07,bevelSegments:8}),gold);m.position.x=sd*.46;m.rotation.y=sd*-.25;g.add(m);
    var t=new T.Shape();t.moveTo(0,0);t.lineTo(sd*.18,-.62);t.lineTo(sd*.1,-.55);t.lineTo(sd*.02,-.66);t.lineTo(-sd*.06,-.04);
    var tail=mesh(ext(t,{depth:.05,bevelThickness:.03,bevelSize:.02}),gold);tail.position.set(sd*.12,-.32,.02);tail.rotation.z=sd*.15;g.add(tail);});
  var knot=mesh(new T.SphereGeometry(.2,24,18),gold);knot.scale.set(1,1.15,.8);knot.position.z=.06;g.add(knot);
  var pearl=mesh(new T.SphereGeometry(.07,20,14),glossy(0xffffff,{roughness:.15}));pearl.position.set(0,0,.22);g.add(pearl);
  g.userData.tint=[gold];return g;};
/* 4 flower crown */
B.fcrown=function(){var g=new T.Group(),vine=glossy(0x4cc45a,{roughness:.45,clearcoat:.4});
  var tor=mesh(new T.TorusGeometry(.62,.035,12,64),vine);tor.rotation.x=Math.PI/2-.35;g.add(tor);
  var cols=[0xff7eb6,0xffffff,0xc9a4ff,0xffffff,0xff7eb6,0xc9a4ff,0xffffff];var petals=[];var yel=glossy(0xffd34d);
  var rx=Math.PI/2-.35,AX=new T.Vector3(1,0,0);
  for(var i=0;i<7;i++){var a=Math.PI*(.12+.76*i/6);var pm=glossy(cols[i],{roughness:.4,clearcoat:.5});petals.push(pm);
    var f=flower(pm,yel,i%2?.14:.18);var p=new T.Vector3(Math.cos(a)*.62,Math.sin(a)*.62,0).applyAxisAngle(AX,rx);
    f.position.copy(p);f.lookAt(p.clone().multiplyScalar(2));g.add(f);
    var lf=mesh(new T.SphereGeometry(1,12,8),vine);lf.scale.set(.1,.04,.04);var a2=a+.11;lf.position.copy(new T.Vector3(Math.cos(a2)*.64,Math.sin(a2)*.64,0).applyAxisAngle(AX,rx));lf.lookAt(lf.position.clone().multiplyScalar(2));g.add(lf);}
  g.userData.tint=petals.filter(function(p){return p.color.getHex()!==0xffffff;});return g;};
/* 5 handbag */
B.purse=function(){var g=new T.Group(),pink=glossy(0xff5fa2),deep=glossy(0xd81b72,{roughness:.35}),gold=metal(0xffcf6b,.2);
  var w=1,h=.72,r=.2,s=new T.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2-.06,h/2-r);s.quadraticCurveTo(w/2-.06,h/2,w/2-.06-r,h/2);s.lineTo(-w/2+.06+r,h/2);s.quadraticCurveTo(-w/2+.06,h/2,-w/2+.06,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
  var body=mesh(ext(s,{depth:.26,bevelThickness:.1,bevelSize:.08,bevelSegments:8}),pink);g.add(body);
  var fl=new T.Shape();fl.moveTo(-.44,0);fl.lineTo(.44,0);fl.quadraticCurveTo(.44,-.3,0,-.38);fl.quadraticCurveTo(-.44,-.3,-.44,0);
  var flap=mesh(ext(fl,{depth:.03,bevelThickness:.03,bevelSize:.03}),deep);flap.position.set(0,.17,.24);g.add(flap);
  var cl=flower(glossy(0xffffff,{roughness:.25}),glossy(0xffd34d),.12);cl.position.set(0,-.02,.3);g.add(cl);
  var hd=mesh(new T.TorusGeometry(.3,.04,14,40,Math.PI),gold);hd.position.y=.4;g.add(hd);
  [-.3,.3].forEach(function(x){var ring=mesh(new T.TorusGeometry(.05,.018,10,20),gold);ring.position.set(x,.42,0);g.add(ring);});
  g.userData.tint=[pink,deep];return g;};
/* 6 heart balloon (string added by rack/lineup) */
B.balloon=function(){var g=new T.Group(),red=glossy(0xff3d8b,{roughness:.18,clearcoatRoughness:.02});
  var b=mesh(ext(heartShape(.42),{depth:.05,bevelThickness:.3,bevelSize:.22,bevelSegments:12,curveSegments:36}),red);g.add(b);
  var k=mesh(new T.ConeGeometry(.06,.1,14),red);k.position.y=-.62;g.add(k);
  var hl=mesh(new T.SphereGeometry(.07,12,10),new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.55}),false);hl.scale.set(1,1.6,.3);hl.position.set(-.28,.22,.36);hl.rotation.z=.5;g.add(hl);
  g.userData.tint=[red];return g;};
/* 7 butterfly wings (flap) */
function wingTex(){var c=document.createElement('canvas');c.width=c.height=256;var x=c.getContext('2d');var gr=x.createRadialGradient(128,128,10,128,128,150);
  gr.addColorStop(0,'#ffffff');gr.addColorStop(.25,'#f3c9ff');gr.addColorStop(.6,'#c9a4ff');gr.addColorStop(1,'#ff8fc8');x.fillStyle=gr;x.fillRect(0,0,256,256);
  x.strokeStyle='rgba(122,42,138,.45)';x.lineWidth=3;for(var i=0;i<7;i++){x.beginPath();x.moveTo(128,128);var a=i/7*Math.PI*2;x.quadraticCurveTo(128+Math.cos(a+.3)*60,128+Math.sin(a+.3)*60,128+Math.cos(a)*140,128+Math.sin(a)*140);x.stroke();}
  x.fillStyle='rgba(255,255,255,.85)';for(var j=0;j<26;j++){x.beginPath();x.arc(Math.random()*256,Math.random()*256,2+Math.random()*5,0,7);x.fill();}
  var t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.repeat.set(.5,.5);t.offset.set(.5,.5);return t;}
B.wings=function(){var g=new T.Group(),tex=wingTex(),wm=new T.MeshPhysicalMaterial({map:tex,color:0xffffff,roughness:.25,clearcoat:1,transparent:true,opacity:.93,side:T.DoubleSide,emissive:0x5a2a7a,emissiveIntensity:.25,envMapIntensity:1.4});
  var halves=[];[-1,1].forEach(function(sd){var half=new T.Group();
    var up=new T.Shape();up.moveTo(0,0);up.bezierCurveTo(sd*.15,.75,sd*.95,1,sd*1,.5);up.bezierCurveTo(sd*1.02,.15,sd*.6,-.05,0,0);
    var lo=new T.Shape();lo.moveTo(0,-.02);lo.bezierCurveTo(sd*.55,-.05,sd*.8,-.5,sd*.55,-.72);lo.bezierCurveTo(sd*.35,-.88,sd*.08,-.45,0,-.02);
    [up,lo].forEach(function(s){var geo=new T.ExtrudeGeometry(s,{depth:.015,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:2,curveSegments:30});half.add(mesh(geo,wm));});
    half.userData.sd=sd;g.add(half);halves.push(half);});
  var body=mesh(T.CapsuleGeometry?new T.CapsuleGeometry(.05,.5,6,12):new T.CylinderGeometry(.05,.05,.6,12),glossy(0x7a2a8a));body.position.y=-.05;g.add(body);
  g.userData.tint=[wm];g.userData.update=function(t){halves.forEach(function(h){h.rotation.y=h.userData.sd*(-.25-.25*Math.sin(t*3.2));});};return g;};
/* 8 diamond tiara (bent) */
B.tiara=function(){var g=new T.Group(),silver=metal(0xffffff,.16);
  var s=new T.Shape();s.moveTo(-.9,0);s.lineTo(-.8,.3);s.lineTo(-.55,.18);s.lineTo(-.42,.52);s.lineTo(-.22,.3);s.lineTo(0,.8);s.lineTo(.22,.3);s.lineTo(.42,.52);s.lineTo(.55,.18);s.lineTo(.8,.3);s.lineTo(.9,0);s.quadraticCurveTo(0,-.12,-.9,0);
  var geo=ext(s,{depth:.05,bevelThickness:.03,bevelSize:.025,bevelSegments:3,curveSegments:24});
  var R=1.1,p=geo.attributes.position;for(var i=0;i<p.count;i++){var x=p.getX(i),z=p.getZ(i),a=x/R;p.setXYZ(i,Math.sin(a)*(R+z),p.getY(i),Math.cos(a)*(R+z)-R);}geo.computeVertexNormals();
  g.add(mesh(geo,silver));
  function place(m,x,y,dz){var a=x/R;m.position.set(Math.sin(a)*(R+.06+(dz||0)),y,Math.cos(a)*(R+.06+(dz||0))-R);m.rotation.y=a;g.add(m);return m;}
  var cyan=gem(0x7ee8ff),pinkG=gem(0xff7eb6),white=gem(0xffffff);
  place(mesh(new T.OctahedronGeometry(.13,0),cyan),0,.38).scale.set(1,1.25,.6);
  [-.42,.42].forEach(function(x){place(mesh(new T.OctahedronGeometry(.07,0),pinkG),x,.36).scale.set(1,1.2,.6);});
  [0].forEach(function(x){place(mesh(new T.OctahedronGeometry(.06,0),white),x,.78);});
  for(var k=-6;k<=6;k++){place(mesh(new T.IcosahedronGeometry(.028,0),white),k*.13,.06+.01*Math.abs(k)*-.2);}
  g.userData.tint=[cyan,pinkG];return g;};

var CAT=[
 {id:'heartclip',price:10,name:'بكلة قلب',tip:'بكلة قلب 💗',desc:'بكلة لمّاعة فيها فصوص صغار تلمع مع الضو.',sw:['#ff3d8b','#b388ff','#2ec4d6']},
 {id:'starsun',price:15,name:'نظارة نجوم',tip:'نظارة النجوم 🌟',desc:'نظارة نجوم صفرا للصيف والبحر.',sw:['#ff4f8f','#8a2be2','#00b8c4']},
 {id:'bowGold',price:20,name:'فيونكة ذهبية',tip:'فيونكة ذهبية ✨',desc:'فيونكة ذهبية كبيرة ووسطها لؤلؤة.',sw:['#ffc93c','#ff7eb6','#c9a4ff']},
 {id:'fcrown',price:25,name:'تاج ورد',tip:'تاج الورد 🌸',desc:'تاج من ورد الربيع لأحلى أميرة.',sw:['#ff7eb6','#ffb340','#7ec8ff']},
 {id:'purse',price:30,name:'شنطة يد',tip:'شنطة يد حلوة 👛',desc:'شنطة وردية بقفل وردة ويدّة ذهبية.',sw:['#ff5fa2','#a06bff','#2bc4a8']},
 {id:'balloon',price:35,name:'بالون',tip:'بالون قلب 🎈',desc:'بالون قلب يطير ويلمع.',sw:['#ff3d8b','#ffb340','#5aa9ff']},
 {id:'wings',price:50,name:'جناح فراشة',tip:'جناح الفراشة 🦋',desc:'جناح فراشة يرفرف! شوفي ظهره.',sw:['#e6a8f0','#ff8fc8','#8fd8ff']},
 {id:'tiara',price:60,name:'تاج الماس',tip:'تاج الماس 💎',desc:'أغلى قطعة بالمحل — تاج الملكات.',sw:['#ff4fa8','#5ad1ff','#b37bff']}
];
/* slot geometry copied from the 2D game (game.js SLOTS.ghalia + shop.js ITEMS) so 3D try-on lines up with the dressing room */
var SLOT={heartclip:{slot:'clipL',x:24,y:11,w:30,r:0.79,al:'center'},starsun:{slot:'eyes',x:56,y:18.5,w:62,r:0.47,al:'center'},bowGold:{slot:'bowR',x:77,y:9,w:42,r:1.17,al:'center'},
 fcrown:{slot:'top',x:50,y:8,w:86,r:0.65,al:'bottom',dy:4},purse:{slot:'hand',x:92,y:66,w:40,r:0.96,al:'top',dy:-4},balloon:{slot:'hand',x:92,y:66,w:30,r:1.48,al:'bottom',dy:10},
 wings:{slot:'cape',x:50,y:27,w:150,r:0.9,al:'top',dy:-12,back:true},tiara:{slot:'top',x:50,y:8,w:64,r:0.71,al:'bottom',dy:2}};
/* ---- v2 illustrated items: Pixar-style painted PNGs (img/items/<id>.png) on hue-shiftable cards ---- */
var ART={heartclip:[512,405],starsun:[512,241],bowGold:[438,512],fcrown:[512,331],purse:[512,491],balloon:[346,512],wings:[512,463],tiara:[512,364]};
var TEX={},loader=new T.TextureLoader();
function tex(id){if(!TEX[id]){var t=loader.load('img/items/'+id+'.png');t.encoding=T.sRGBEncoding;t.anisotropy=8;TEX[id]=t;}return TEX[id];}
function hueMat(map,opts){opts=opts||{};var m=new T.MeshBasicMaterial({map:map,transparent:true,alphaTest:.04,side:T.DoubleSide,toneMapped:false,color:opts.color||0xffffff});
  m.userData.hue={value:0};m.userData.setHue=function(deg){m.userData.hue.value=deg*Math.PI/180;};
  m.onBeforeCompile=function(sh){sh.uniforms.uHue=m.userData.hue;sh.fragmentShader='uniform float uHue;\n'+sh.fragmentShader.replace('#include map_fragment',
    '#include map_fragment\n{vec3 c=diffuseColor.rgb;const mat3 toY=mat3(.299,.596,.211,.587,-.274,-.523,.114,-.322,.312);const mat3 toR=mat3(1.,1.,1.,.956,-.272,-1.106,.621,-.647,1.703);vec3 y=toY*c;float h=atan(y.z,y.y)+uHue;float ch=length(y.yz);y.y=ch*cos(h);y.z=ch*sin(h);diffuseColor.rgb=clamp(toR*y,0.,1.);}');};
  m.customProgramCacheKey=function(){return 'huecard';};return m;}
function spriteItem(id){var a=ART[id],w=a[0]/512,h=a[1]/512,g=new T.Group(),map=tex(id);
  var front=new T.Mesh(new T.PlaneGeometry(w,h),hueMat(map));g.add(front);
  /* faint painted "thickness" so turning the card reads as an object, plus a shaped shadow caster */
  var back=new T.Mesh(new T.PlaneGeometry(w,h),hueMat(map,{color:0xb89aa8}));back.position.z=-.018;g.add(back);
  var dm=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,map:map,alphaTest:.5});front.customDepthMaterial=dm;front.castShadow=true;
  g.userData.tint=[front.material,back.material];
  if(id==='wings'){g.userData.update=function(t){var k=1-.16*(.5+.5*Math.sin(t*5));front.scale.x=k;back.scale.x=k;};}
  else if(id==='balloon'){g.userData.update=function(t){g.rotation.z=Math.sin(t*1.3)*.06;};}
  else{g.userData.update=function(t){g.rotation.z=Math.sin(t*1.1+id.length)*.025;};}
  return g;}
window.GSHOP={build:function(id){if(ART[id]&&!/[?&]procedural/.test(location.search))return normalize(spriteItem(id),1);return normalize(B[id](),1);},CAT:CAT,SLOT:SLOT,ART:ART,img:function(id){return 'img/items/'+id+'.png';}};
})();
