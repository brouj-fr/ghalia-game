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
