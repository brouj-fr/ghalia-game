/* v2 illustrated rooms (part 2): painted Pixar-style plates for the 2D rooms, with living light layers
   (twinkling fairy lights / bulbs, warm light beams, floating motes) and a gentle pointer/gyro parallax.
   Room logic is untouched; only backdrops and a few art-aligned positions change. Classic script, offline. */
(function(){
'use strict';
var A=GAME.api,ROOMS=GAME.ROOMS,say=A.say,burst=A.burst,sfx=A.sfx;
function lights(pts,cls){return pts.map(function(p,i){return '<i class="'+(cls||'v2tw')+'" style="left:'+p[0]+'px;top:'+p[1]+'px;animation-delay:'+((i*.37)%2.4).toFixed(2)+'s'+(p[2]?';width:'+p[2]+'px;height:'+p[2]+'px;margin:-'+p[2]/2+'px 0 0 -'+p[2]/2+'px':'')+'"></i>';}).join('');}
function motes(n,box){var s='';for(var i=0;i<n;i++){s+='<i class="v2mote" style="left:'+(box[0]+Math.random()*box[2]).toFixed(0)+'px;top:'+(box[1]+Math.random()*box[3]).toFixed(0)+'px;animation-delay:-'+(Math.random()*9).toFixed(2)+'s;animation-duration:'+(7+Math.random()*6).toFixed(1)+'s"></i>';}return s;}
function plate(id,img,o){o=o||{};return '<div class="v2room v2p v2-'+id+'"><img class="v2bgimg v2par" src="img/'+img+'" alt="">'+
  (o.beam?'<div class="v2beam2" style="'+o.beam+'"></div>':'')+(o.glow||'')+(o.lights?lights(o.lights):'')+(o.bulbs?lights(o.bulbs,'v2tw v2bl'):'')+
  (o.motes?motes(o.motes,o.moteBox||[0,0,1280,720]):'')+(o.extra||'')+'</div>';}
window.V2PLATE=plate;
var FAIRY_TOP=function(y0,x0,x1,n,sag){var p=[];for(var i=0;i<n;i++){var t=i/(n-1);p.push([x0+(x1-x0)*t,y0+Math.sin(t*Math.PI)*sag]);}return p;};

/* ---- makeup: illustrated vanity + close-up Ghalia ---- */
if(ROOMS.makeup){ROOMS.makeup.bg=plate('makeup','bg-makeup.jpg',{
  bulbs:[[640,48,64],[530,82,60],[750,82,60],[465,160,60],[815,160,60],[440,250,60],[840,250,60],[440,340,60],[848,340,60],[460,425,60],[818,425,60],[540,500,60],[740,500,60]],
  lights:FAIRY_TOP(110,10,340,7,-30).concat(FAIRY_TOP(25,880,1270,7,70)),
  glow:'<i class="v2neon" style="left:1062px;top:240px"></i>',motes:16});}
/* ---- nails: illustrated salon desk ---- */
if(ROOMS.nails){ROOMS.nails.bg=plate('nails','bg-nails.jpg',{
  beam:'left:180px;top:140px;width:520px;height:560px',
  bulbs:[[928,128,46],[972,136,46],[1004,170,46],[1012,226,46],[1006,282,46],[866,154,46],[860,206,46],[862,268,46]],
  lights:[[746,10],[785,45],[815,85],[880,30],[938,45],[1014,40],[1084,18],[742,128],[740,196],[745,270]],
  glow:'<i class="v2neon" style="left:1170px;top:78px;width:150px;height:130px"></i>',motes:14});}
/* ---- garden: painted dream-house garden at golden hour ---- */
if(ROOMS.garden){ROOMS.garden.bg=plate('garden','bg-garden.jpg',{motes:22,moteBox:[0,180,1280,460],
  glow:'<i class="v2sunset" style="left:640px;top:150px"></i>',extra:'<div class="v2leaves"></div>'});
  var gi=ROOMS.garden.init;ROOMS.garden.init=function(Rr){gi.apply(this,arguments);
    var X=[373,566,760,953];(Rr.beds||[]).forEach(function(b,i){b.x=X[i];b.y=556;b.el.style.left=(b.x-95)+'px';b.el.style.top=(b.y-48)+'px';});};}
/* ---- wardrobe (changing clothes): illustrated walk-in closet ---- */
if(ROOMS.wardrobe){ROOMS.wardrobe.bg=plate('wardrobe','bg-wardrobe.jpg',{
  beam:'left:560px;top:40px;width:560px;height:620px',
  bulbs:[[1084,175,40],[1102,205,40],[1112,238,40],[1120,275,40],[1122,312,40],[1122,350,40],[1122,392,40],[1122,438,40],[1122,480,40],[1122,522,40],[1080,240,40],[1074,290,40],[1072,345,40],[1072,400,40],[1072,455,40],[1072,510,40],[1140,150,40],[1170,140,40],[1206,150,40],[1230,190,40]],
  lights:FAIRY_TOP(70,440,700,8,-20).concat(FAIRY_TOP(15,1100,1260,5,30)),motes:18});}
/* ---- bedroom (2D): illustrated princess bedroom at dusk ---- */
if(ROOMS.bedroom){ROOMS.bedroom.bg=plate('bedroom','bg-bedroom2d.jpg',{
  lights:FAIRY_TOP(40,660,1240,13,40).concat([[290,80],[300,160],[296,240],[300,320],[586,40],[600,120],[594,200],[598,290]]),
  glow:'<i class="v2lampglow" style="left:1100px;top:340px"></i><i class="v2moon" style="left:488px;top:146px"></i>',motes:10});
  var bi=ROOMS.bedroom.init;ROOMS.bedroom.init=function(r){bi.apply(this,arguments);
    var sc=A.scene(),props=sc.querySelectorAll('.prop');
    // hide the flat SVG bed + lamp, keep their behaviour: the painted bed is in the plate,
    // the blanket is a crop of the painted duvet so Ghalia gets tucked in.
    for(var i=0;i<props.length;i++){var p=props[i];if(p===r.blanket||p===r.lamp)continue;if(p.innerHTML.indexOf('<svg')===0&&parseInt(p.style.left)===450&&parseInt(p.style.top)===330)p.style.visibility='hidden';}
    if(r.blanket){r.blanket.innerHTML='<div class="v2duvet"></div>';r.blanket.style.left='398px';r.blanket.style.top='540px';r.blanket.style.width='520px';r.blanket.style.height='120px';}
    setTimeout(function(){var q=A.scene().querySelectorAll('.prop.tv,.prop.curt');for(var k=0;k<q.length;k++)q[k].remove();},60);
    if(r.lamp){r.lamp.innerHTML='<div class="v2lamphit"></div>';r.lamp.style.left='1050px';r.lamp.style.top='300px';r.lamp.style.width='100px';r.lamp.style.height='130px';}
  };}

/* ===== Section 2: beauty & home rooms ===== */
function spr(src,w,h,y0,y1){/* background-cropped slice of a prop sprite: rows y0..y1 (0..1) */
  return '<div class="v2spr" style="background-image:url(img/'+src+');background-size:'+w+'px '+h+'px;background-position:0 -'+(h*y0).toFixed(1)+'px"></div>';}
/* salon: painted salon + illustrated velvet chair (back + seat-front layers so she sits in it) */
if(ROOMS.salon){ROOMS.salon.bg=plate('salon','bg-salon.jpg',{
  bulbs:[[640,50,54],[580,60,54],[700,60,54],[545,100,54],[735,100,54],[520,160,54],[760,160,54],[512,222,54],[768,222,54],[520,290,54],[760,290,54],[545,350,54],[735,350,54],[590,385,54],[690,385,54],[640,395,54]],
  lights:FAIRY_TOP(10,0,470,10,30).concat(FAIRY_TOP(10,850,1280,9,30)),motes:14,
  glow:'<i class="v2water" style="left:1196px;top:362px"></i>'});
  var si=ROOMS.salon.init;ROOMS.salon.init=function(r){si.apply(this,arguments);
    var W=262,H=372,L=429,T=353,f=.56;
    r.back.style.cssText+=';left:'+L+'px;top:'+T+'px;width:'+W+'px;height:'+H+'px';r.back.innerHTML=spr('salon-chair.png',W,H,0,1)+'<i class="v2shine"></i>';
    r.front.style.cssText+=';left:'+L+'px;top:'+(T+H*f).toFixed(0)+'px;width:'+W+'px;height:'+(H*(1-f)).toFixed(0)+'px';r.front.innerHTML=spr('salon-chair.png',W,H,f,1);
    setTimeout(function(){var t=A.scene().querySelector('.prop.tank');if(t){t.style.left='1108px';t.style.top='288px';t.style.width='172px';t.style.height='146px';t.classList.add('v2ghost');}},60);};}
/* masks: painted spa (close-up bust is shared with makeup) */
if(ROOMS.masks){ROOMS.masks.bg=plate('masks','bg-spa.jpg',{
  lights:FAIRY_TOP(10,0,330,7,40).concat(FAIRY_TOP(20,760,1280,9,30)),
  glow:'<i class="v2sunset" style="left:640px;top:220px;width:520px;height:520px;margin:-260px 0 0 -260px"></i><i class="v2steam" style="left:300px;top:200px"></i><i class="v2steam" style="left:840px;top:260px;animation-delay:-3s"></i>',
  bulbs:[[104,523,60],[1189,560,60],[1218,568,50],[1170,393,46]],motes:16});}
/* kitchen: painted kitchen + illustrated oven */
if(ROOMS.kitchen){ROOMS.kitchen.bg=plate('kitchen','bg-kitchen.jpg',{
  beam:'left:470px;top:20px;width:520px;height:640px',glow:'<i class="v2sunset" style="left:700px;top:180px;width:520px;height:420px;margin:-210px 0 0 -260px"></i>',motes:16});
  var ki=ROOMS.kitchen.init;ROOMS.kitchen.init=function(r){ki.apply(this,arguments);var o=r.oven;if(!o)return;
    var sv=o.querySelector('svg');if(sv)sv.outerHTML='<img class="v2oven" src="img/oven.png" alt="" draggable="false"><i class="v2ovenglow"></i>';
    o.style.left='292px';o.style.top='258px';o.style.width='236px';o.style.height='352px';};}
/* bath: painted bathroom + illustrated clawfoot tub (back + front layers, foam on top) */
if(ROOMS.bath){ROOMS.bath.bg=plate('bath','bg-bath.jpg',{
  beam:'left:150px;top:40px;width:560px;height:620px',
  bulbs:[[1146,74,40],[1180,72,40],[1212,92,40],[1238,124,40],[1250,168,40],[1238,214,40],[1212,250,40],[1182,268,40],[1146,262,40],[1124,228,40],[1118,180,40],[1126,120,40]],motes:14,
  glow:'<i class="v2sunset" style="left:240px;top:150px;width:420px;height:360px;margin:-180px 0 0 -210px"></i>'});
  var hi=ROOMS.bath.init;ROOMS.bath.init=function(r){hi.apply(this,arguments);
    var W=480,H=237,L=510,T=418,f=.47;
    r.tubB.style.cssText+=';left:'+L+'px;top:'+T+'px;width:'+W+'px;height:'+H+'px';r.tubB.innerHTML=spr('tub.png',W,H,0,1);
    r.tubF.style.cssText+=';left:'+L+'px;top:'+(T+H*f).toFixed(0)+'px;width:'+W+'px;height:'+(H*(1-f)).toFixed(0)+'px';r.tubF.innerHTML=spr('tub.png',W,H,f,1);
    r.foamEl.style.left='540px';r.foamEl.style.top='470px';r.foamEl.style.width='420px';};}


/* ===== Section 3: school story (morning, bag, road, class) ===== */
function swapBg(html){var sc=A.scene(),b=sc.querySelector(':scope > svg.bg');if(b){b.insertAdjacentHTML('beforebegin',html);b.remove();}}
function hideFlatBed(){var q=A.scene().querySelectorAll('.prop');for(var i=0;i<q.length;i++){var p=q[i],l=parseInt(p.style.left),t=parseInt(p.style.top);
  if(l===450&&t===330)p.style.visibility='hidden';
  if(l===440&&t===520&&!p.querySelector('.v2duvet')){p.innerHTML='<div class="v2duvet"></div>';p.style.left='398px';p.style.top='540px';p.style.width='520px';p.style.height='120px';}}}
['sch1','sch2'].forEach(function(id){var R0=ROOMS[id];if(!R0)return;var oi=R0.init;R0.init=function(r){oi.apply(this,arguments);setTimeout(hideFlatBed,30);};});
if(ROOMS.sch1){var mo=new MutationObserver(function(){if(document.querySelector('#scene .v2-bedroom'))hideFlatBed();});mo.observe(A.scene(),{childList:true});}
if(ROOMS.sch3){var s3=ROOMS.sch3.init;ROOMS.sch3.init=function(r){s3.apply(this,arguments);
  swapBg(plate('road','bg-road.jpg',{glow:'<i class="v2sunset" style="left:80px;top:300px;width:600px;height:360px;margin:-180px 0 0 -300px"></i>',motes:10,moteBox:[0,60,1280,300]}));
  var far=A.scene().querySelector('.par.far');if(far)far.style.display='none';};}
if(ROOMS.sch4){var s4=ROOMS.sch4.init;ROOMS.sch4.init=function(r){s4.apply(this,arguments);var sc=A.scene();
  swapBg(plate('sch4','bg-sch4.jpg',{beam:'left:820px;top:0;width:460px;height:640px',glow:'<i class="v2neon v2gold" style="left:640px;top:72px;width:160px;height:150px"></i>',motes:16}));
  var b=sc.querySelector('.sboard');if(b)b.classList.add('v2board');
  var t=sc.querySelector('.teacher');if(t){t.innerHTML='<img src="img/teacher.png" alt="" draggable="false" class="v2fig">';t.style.top='232px';t.style.height='376px';t.style.width='146px';}
  var ks=sc.querySelectorAll('.kid');for(var i=0;i<ks.length;i++){var k=ks[i];var w=[60,80,58,72][i%4];k.innerHTML='<img src="img/kid'+(i%4)+'.png" alt="" draggable="false" class="v2fig">';
    var cx=parseInt(k.style.left)+50;k.style.width=w+'px';k.style.left=(cx-w/2)+'px';k.style.height='192px';k.style.top=(parseInt(k.style.top)-30)+'px';}
  var ps=sc.querySelectorAll('.prop');for(var j=0;j<ps.length;j++){var p=ps[j];if(p.classList.contains('kid')||p.classList.contains('teacher'))continue;var w2=parseInt(p.style.width),h2=parseInt(p.style.height);
    if((w2===180&&h2===90)||(w2===220&&h2===110)){p.innerHTML='<img src="img/desk.png" alt="" draggable="false" class="v2fig">';p.style.height=Math.round(w2*297/500)+'px';p.style.top=(parseInt(p.style.top)-Math.round(w2*297/500-h2)+10)+'px';}}};}


/* ===== Section 4: mini-games + menu ===== */
function gamePlate(id,img,o){var R0=ROOMS[id];if(!R0)return;R0.bg=plate(id,img,o||{});}
gamePlate('memory','bg-memory.jpg',{lights:FAIRY_TOP(22,590,1230,12,30),glow:'<i class="v2neon" style="left:1000px;top:112px;width:120px;height:110px"></i>',motes:12});
gamePlate('catch','bg-catch.jpg',{glow:'<i class="v2sunset" style="left:260px;top:470px;width:520px;height:340px;margin:-170px 0 0 -260px"></i>',motes:22,moteBox:[0,380,1280,340]});
gamePlate('balloons','bg-balloons.jpg',{motes:8});
gamePlate('whack','bg-whack.jpg',{beam:'left:0;top:0;width:520px;height:620px',motes:14});
/* swap flat SVG game props for illustrated sprites as they appear */
(function(){var sc=A.scene();if(!sc)return;new MutationObserver(function(ms){ms.forEach(function(m){for(var i=0;i<m.addedNodes.length;i++){var n=m.addedNodes[i];if(n.nodeType!==1)continue;
  if(n.classList.contains('basket')&&!n._v2){n._v2=1;n.innerHTML='<img src="img/basket.png" alt="" draggable="false" class="v2fig" style="height:150%;margin-top:-50%">';}
  else if(n.classList.contains('hole')&&!n._v2){n._v2=1;var pot=n.querySelector(':scope>svg');if(pot)pot.outerHTML='<img src="img/pot.png" alt="" draggable="false" class="v2pot">';}}});}).observe(sc,{childList:true});})();
/* menu cards get illustrated thumbnails */
(function(){var TH=['makeup','nails','garden','wardrobe','bedroom','salon','masks','kitchen','bath','sch1','sch2','sch3','sch4','memory','catch','balloons','whack','shop','dress','world3d','class3d'];
 function deco(){var cs=document.querySelectorAll('#inner .card');for(var i=0;i<cs.length;i++){var c=cs[i];if(c._v2)continue;var id=c.dataset.room;if(TH.indexOf(id)<0)continue;c._v2=1;c.classList.add('v2card');
   var bg=c.querySelector('.cbg');if(bg)bg.style.background='url(img/thumbs/'+id+'.jpg) center/cover';}}
 var cards=document.getElementById('menu');if(cards){deco();new MutationObserver(deco).observe(cards,{childList:true,subtree:true});}})();

/* ---- gentle parallax for every painted plate ---- */
var tx=0,ty=0,cx=0,cy=0;
addEventListener('pointermove',function(e){tx=e.clientX/innerWidth-.5;ty=e.clientY/innerHeight-.5;});
addEventListener('deviceorientation',function(e){if(e.gamma==null)return;tx=Math.max(-.5,Math.min(.5,e.gamma/40));ty=Math.max(-.5,Math.min(.5,(e.beta-40)/40));});
var t0=performance.now();
(function loop(now){requestAnimationFrame(loop);var p=document.querySelector('#scene .v2p');if(!p)return;var t=(now-t0)/1000;
  var ax=tx+Math.sin(t*.21)*.15,ay=ty+Math.cos(t*.17)*.08;cx+=(ax-cx)*.05;cy+=(ay-cy)*.05;
  var im=p.querySelector('.v2par');if(im)im.style.transform='translate3d('+(-cx*18).toFixed(2)+'px,'+(-cy*10).toFixed(2)+'px,0) scale(1.04)';
  var fl=p.querySelectorAll('.v2tw,.v2neon,.v2beam2,.v2moon,.v2lampglow,.v2sunset');for(var i=0;i<fl.length;i++)fl[i].style.translate=(-cx*18).toFixed(2)+'px '+(-cy*10).toFixed(2)+'px';})(t0);
})();
