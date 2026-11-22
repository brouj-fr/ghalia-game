/* LIFE: idle animation, blinking, tap-to-walk, reactions, aunt wandering, ambient props */
(function(){
'use strict';
var A=GAME.api,sfx=A.sfx,say=A.say,burst=A.burst;
var stage=document.getElementById('stage'),scene=document.getElementById('scene'),fx=A.fx;
var LIFE=window.LIFE={};
['makeup','masks','nails'].forEach(function(id){if(GAME.ROOMS[id])GAME.ROOMS[id].noWalk=true;});
var EYES={ghalia:{l:[38.4,17.2],r:[63,17.7],w:13,h:2.3,c:'#e2a47c'},khala:{l:[36.5,19.2],r:[61.5,19.2],w:14,h:2.2,c:'#eeb08a'}};
var LINES={ghalia:['هههه! 😄','أنا غالية! 💗','يا سلام! ✨','أحب خالتي! 💕','يلا نلعب! 🎈','واو! 🤩'],khala:['هلا بغالية! 💗','أحبج يا غالية 💕','شاطرة! 👏','يا حلوج! 😍','يلا يا بطلة! ⭐']};
function R(){return A.getR();}
function heartBurst(x,y){burst(x,y,10,['#ff5fa2','#ff7eb6','#ffd6ea','#ffffff']);
  for(var i=0;i<4;i++){var h=document.createElement('div');h.className='hrt';h.textContent='♥';h.style.left=(x+A.rnd(-30,30))+'px';h.style.top=y+'px';fx.appendChild(h);
    (function(h){var an=h.animate([{transform:'translateY(0) scale(.5)',opacity:1},{transform:'translate('+A.rnd(-30,30)+'px,-110px) scale(1.3)',opacity:0}],{duration:A.rnd(900,1400),easing:'ease-out'});an.onfinish=function(){h.remove();};})(h);}}
LIFE.heartBurst=heartBurst;
function floatText(x,y,t,cls){var d=document.createElement('div');d.className='ftxt '+(cls||'');d.textContent=t;d.style.left=x+'px';d.style.top=y+'px';fx.appendChild(d);
  var an=d.animate([{transform:'translate(-50%,0) scale(.6)',opacity:0},{transform:'translate(-50%,-30px) scale(1.15)',opacity:1,offset:.3},{transform:'translate(-50%,-80px) scale(1)',opacity:0}],{duration:1300,easing:'ease-out'});an.onfinish=function(){d.remove();};}
LIFE.floatText=floatText;

/* ---- character life ---- */
LIFE.onChar=function(el,who){
  var img=el.querySelector('img');img.classList.add('idle');img.style.animationDelay=(-A.rnd(0,3)).toFixed(2)+'s';
  var e=EYES[who];if(!e)return;
  var L=document.createElement('div');L.className='lids';
  [e.l,e.r].forEach(function(p){var s=document.createElement('i');s.style.cssText='left:'+(p[0]-e.w/2)+'%;top:'+(p[1]-e.h/2)+'%;width:'+e.w+'%;height:'+e.h+'%;background:'+e.c;L.appendChild(s);});
  el.appendChild(L);el._lids=L;
};
function blink(el){var l=el&&el._lids;if(!l||!l.isConnected)return;var k=l.children;for(var i=0;i<k.length;i++)k[i].animate([{transform:'scaleY(0)',opacity:1},{transform:'scaleY(1)',opacity:1,offset:.5},{transform:'scaleY(0)',opacity:1}],{duration:190,easing:'ease-in-out'});}
function tilt(el){if(!el||el._walkId||el.classList.contains('lift'))return;var d=A.pick([-3,3]);el.animate([{transform:'rotate(0)'},{transform:'rotate('+d+'deg)'},{transform:'rotate(0)'}],{duration:1600,easing:'ease-in-out'});}
LIFE.react=function(el,who,quiet){var kind=A.pick(['jump','spin','wave']);var x=el._x,y=el._y-el._h;
  if(kind==='jump'){el.animate([{transform:'translateY(0) scale(1,1)'},{transform:'translateY(6px) scale(1.08,.9)',offset:.15},{transform:'translateY(-70px) scale(.95,1.06)',offset:.5},{transform:'translateY(4px) scale(1.06,.94)',offset:.85},{transform:'translateY(0) scale(1,1)'}],{duration:650,easing:'ease-out'});sfx.boing();}
  else if(kind==='spin'){el.animate([{transform:'rotateY(0)'},{transform:'rotateY(360deg)'}],{duration:600,easing:'ease-in-out'});sfx.whoosh();}
  else{el.animate([{transform:'rotate(0)'},{transform:'rotate(-6deg)'},{transform:'rotate(6deg)'},{transform:'rotate(-6deg)'},{transform:'rotate(0)'}],{duration:800});floatText(x+el._w*.45,y+el._h*.3,'👋');sfx.pop();}
  heartBurst(x,y+el._h*.2);if(!quiet)say(A.pick(LINES[who]));};
LIFE.cheer=function(){var r=R();if(!r||r.dead)return;var k=r.chars.khala,g=r.chars.ghalia;
  if(k&&!k._walkId){k.animate([{transform:'translateY(0)'},{transform:'translateY(-30px)'},{transform:'translateY(0)'}],{duration:420,iterations:2});floatText(k._x,k._y-k._h*.95,'👏');}
  if(g&&!g._walkId){A.hop(g);}sfx.clap();};
LIFE.shake=function(){var room=document.getElementById('room');room.animate([{transform:'translate(0,0)'},{transform:'translate(-10px,4px)'},{transform:'translate(9px,-5px)'},{transform:'translate(-7px,3px)'},{transform:'translate(5px,-2px)'},{transform:'translate(0,0)'}],{duration:420});};

/* wrap success sounds -> aunt reacts; big wins shake */
var lastCheer=0;
['sparkle'].forEach(function(n){var o=sfx[n];sfx[n]=function(){o.apply(sfx,arguments);var t=Date.now();if(t-lastCheer>2500){lastCheer=t;setTimeout(LIFE.cheer,250);}};});
['tada','win'].forEach(function(n){var o=sfx[n];sfx[n]=function(){o.apply(sfx,arguments);LIFE.shake();setTimeout(LIFE.cheer,150);};});
var oc=A.confetti;A.confetti=function(){oc();LIFE.shake();};

/* ---- walking ---- */
var wid=0;
function walkTo(el,x,y,done){var r=R();if(!el)return;var s=A.charSize(el.dataset.who);var fl=r.def.floor||[560,712];
  x=A.clamp(x,s.w/2+6,1146-s.w/2);y=A.clamp(y,Math.max(fl[0],Math.min(s.h+10,712)),fl[1]);
  var id=++wid;el._walkId=id;var img=el.querySelector('img');el.style.scale=(x<el._x)?'-1 1':'1 1';
  var bob=el.animate([{translate:'0 0'},{translate:'0 -10px'},{translate:'0 0'}],{duration:300,iterations:Infinity});
  var last=performance.now(),acc=0,sp=330;
  function step(t){if(el._walkId!==id||r.dead){bob.cancel();el.style.scale='';return;}var dt=Math.min(50,t-last)/1000;last=t;var dx=x-el._x,dy=y-el._y,d=Math.hypot(dx,dy);
    if(d<6){A.setPos(el,x,y);bob.cancel();el._walkId=0;setTimeout(function(){if(!el._walkId)el.style.scale='';},200);if(done)done();return;}
    var m=Math.min(d,sp*dt);A.setPos(el,el._x+dx/d*m,el._y+dy/d*m);acc+=m;if(acc>70){acc=0;sfx.step();dust(el._x,el._y);}
    requestAnimationFrame(step);}
  requestAnimationFrame(step);}
LIFE.walkTo=walkTo;
function dust(x,y){for(var i=0;i<3;i++){var d=document.createElement('div');d.className='dust';d.style.left=(x+A.rnd(-20,20))+'px';d.style.top=(y-8)+'px';fx.appendChild(d);
  (function(d){var an=d.animate([{transform:'scale(.4)',opacity:.7},{transform:'translate('+A.rnd(-20,20)+'px,-14px) scale(1.4)',opacity:0}],{duration:520});an.onfinish=function(){d.remove();};})(d);}}
var tapStart=null;
scene.addEventListener('pointerdown',function(e){var r=R();if(!r||r.def.noWalk)return;tapStart={p:A.toStage(e),id:e.pointerId};});
scene.addEventListener('pointerup',function(e){var r=R();if(!tapStart||tapStart.id!==e.pointerId||!r)return;var p=A.toStage(e),s=tapStart.p;tapStart=null;
  if(Math.abs(p.x-s.x)+Math.abs(p.y-s.y)>14)return;var g=r.chars.ghalia;if(!g||g.classList.contains('lift'))return;
  var tx=p.x,ty=p.y+40;ring(p.x,p.y);
  walkTo(g,tx,ty,function(){if(r.def.charDrop&&!r.dead){r.def.charDrop('ghalia',g._x,g._y);}});});
function ring(x,y){var d=document.createElement('div');d.className='tapring';d.style.left=x+'px';d.style.top=y+'px';fx.appendChild(d);var an=d.animate([{transform:'translate(-50%,-50%) scale(.2)',opacity:1},{transform:'translate(-50%,-50%) scale(1.4)',opacity:0}],{duration:500});an.onfinish=function(){d.remove();};}

/* ---- ambient props ---- */
function prop(html,cls,x,y,w,h,z,onTap){var d=document.createElement('div');d.className='prop amb '+(cls||'');d.style.cssText='left:'+x+'px;top:'+y+'px;width:'+w+'px;height:'+h+'px;z-index:'+(z||9);d.innerHTML=html;scene.appendChild(d);
  if(onTap){d.classList.add('tapme');d.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();onTap(d,e);});}return d;}
LIFE.prop=prop;
var CAT='<svg viewBox="0 0 120 80"><path d="M100 40 Q118 20 112 6" stroke="#f2a65a" stroke-width="8" fill="none" stroke-linecap="round" class="tail"/><ellipse cx="62" cy="50" rx="40" ry="22" fill="#f2a65a"/><circle cx="26" cy="34" r="20" fill="#f2a65a"/><path d="M10 24 L12 4 L26 18Z M30 16 L42 2 L44 22Z" fill="#f2a65a"/><path d="M14 20 L15 9 L23 17Z" fill="#ffc2dc"/><circle cx="20" cy="34" r="3" fill="#333"/><circle cx="32" cy="34" r="3" fill="#333"/><path d="M24 40 q2 3 4 0" stroke="#333" stroke-width="2" fill="none"/><g stroke="#e08a3a" stroke-width="5"><path d="M56 32 v10 M70 30 v10 M84 34 v8"/></g><g fill="#f2a65a"><rect x="34" y="62" width="10" height="16" rx="5"/><rect x="50" y="64" width="10" height="14" rx="5"/><rect x="76" y="64" width="10" height="14" rx="5"/><rect x="90" y="62" width="10" height="16" rx="5"/></g></svg>';
function cat(r,y){var c=prop(CAT,'cat',A.rnd(200,900),y||640,110,74,15,function(d){sfx.meow();heartBurst(d._x+55,y-10);d.animate([{transform:'translateY(0)'},{transform:'translateY(-50px)'},{transform:'translateY(0)'}],{duration:500});say(A.pick(['مياو! 🐱','بسبوسة تحبج يا غالية 🐱💗','مياااو! 😺']));});
  c._x=parseFloat(c.style.left);
  function wander(){if(r.dead||!c.isConnected)return;var nx=A.rnd(120,980);c.style.scale=nx<c._x?'1 1':'-1 1';var dur=Math.abs(nx-c._x)*9;
    c.animate([{left:c._x+'px'},{left:nx+'px'}],{duration:dur,easing:'ease-in-out',fill:'forwards'});var b=c.animate([{translate:'0 0'},{translate:'0 -4px'},{translate:'0 0'}],{duration:260,iterations:Math.ceil(dur/260)});
    c._x=nx;r.timers.push(setTimeout(wander,dur+A.rnd(1500,4000)));}
  r.timers.push(setTimeout(wander,1200));return c;}
var BIRD='<svg viewBox="0 0 60 30"><path class="wg" d="M2 14 Q16 0 30 14 Q44 0 58 14" stroke="#5a5a7a" stroke-width="4" fill="none" stroke-linecap="round"/></svg>';
function birds(r,yr){for(var i=0;i<3;i++){var b=prop(BIRD,'bird',-80,A.rnd(yr[0],yr[1]),50,25,2);b.style.pointerEvents='none';b.animate([{left:'-80px'},{left:'1360px'}],{duration:A.rnd(9000,15000),delay:i*2500,iterations:Infinity});}}
function motes(r,n){for(var i=0;i<(n||10);i++){var m=document.createElement('div');m.className='mote';m.style.left=A.rnd(0,1150)+'px';m.style.top=A.rnd(100,700)+'px';m.style.animationDelay=(-A.rnd(0,6))+'s';m.style.animationDuration=A.rnd(5,9)+'s';scene.appendChild(m);}}
LIFE.cat=cat;LIFE.birds=birds;LIFE.motes=motes;
var TANK='<svg viewBox="0 0 220 130"><rect x="4" y="10" width="212" height="116" rx="16" fill="#bfe8ff" stroke="#fff" stroke-width="6" opacity=".95"/><rect x="4" y="100" width="212" height="26" rx="10" fill="#ffe0a3"/><path d="M40 100 q-6 -30 4 -50 M48 100 q8 -26 -2 -44 M170 100 q-8 -36 6 -56" stroke="#4cc45a" stroke-width="6" fill="none"/>'+
 '<g class="fish f1"><path d="M0 0 q14 -12 30 0 q-16 12 -30 0z M30 0 l12 -8 v16z" fill="#ff7a3c"/><circle cx="8" cy="-2" r="2" fill="#333"/></g><g class="fish f2"><path d="M0 0 q12 -10 26 0 q-14 10 -26 0z M26 0 l10 -7 v14z" fill="#ffd34d"/><circle cx="7" cy="-2" r="2" fill="#333"/></g><g class="fish f3"><path d="M0 0 q12 -10 24 0 q-12 10 -24 0z M24 0 l10 -7 v14z" fill="#ff5fa2"/><circle cx="7" cy="-2" r="2" fill="#333"/></g></svg>';
var KETTLE='<svg viewBox="0 0 100 90"><path d="M20 80 Q16 34 50 30 Q84 34 80 80Z" fill="#ff7eb6"/><rect x="14" y="76" width="72" height="10" rx="5" fill="#e0457f"/><path d="M80 56 l18 -14" stroke="#ff7eb6" stroke-width="9" stroke-linecap="round"/><path d="M34 30 Q50 8 66 30" stroke="#e0457f" stroke-width="6" fill="none"/><circle cx="40" cy="54" r="7" fill="#fff" opacity=".5"/></svg>';
var TV='<svg viewBox="0 0 160 110"><rect x="4" y="4" width="152" height="92" rx="14" fill="#5a4a7a"/><rect class="scr" x="14" y="14" width="132" height="72" rx="8" fill="#2a2440"/><rect x="60" y="96" width="40" height="12" rx="4" fill="#5a4a7a"/></svg>';
function steam(x,y,n){for(var i=0;i<(n||1);i++){var s=document.createElement('div');s.className='steam';s.style.left=(x+A.rnd(-8,8))+'px';s.style.top=y+'px';fx.appendChild(s);
  (function(s){var an=s.animate([{transform:'translate(0,0) scale(.5)',opacity:.75},{transform:'translate('+A.rnd(-20,20)+'px,-90px) scale(1.8)',opacity:0}],{duration:A.rnd(1400,2200),easing:'ease-out'});an.onfinish=function(){s.remove();};})(s);}}
LIFE.steam=steam;
function doors(x,y,w,h,color){var L=prop('<div class="door l" style="background:'+color+'"></div><div class="door r" style="background:'+color+'"></div>','doors',x,y,w,h,4,function(d){d.classList.toggle('open');sfx.knock();if(d.classList.contains('open')){burst(x+w/2,y+h/2,12);say('الخزانة انفتحت! ✨');}});return L;}
LIFE.onRoom=function(r){
  var id=r.id;var k=r.chars.khala;
  /* aunt wanders */
  r.timers.push(setInterval(function(){var kk=r.chars.khala;if(!kk||r.dead||r.def.noWander||kk._walkId||kk.classList.contains('lift'))return;
    if(Math.random()<.55){walkTo(kk,A.rnd(150,1050),kk._y,function(){if(Math.random()<.5)LIFE.react(kk,'khala',true);});}},6500));
  r.timers.push(setInterval(function(){for(var w in r.chars){var el=r.chars[w];if(Math.random()<.8)blink(el);if(Math.random()<.15)tilt(el);}},2600));
  if(id==='garden'){birds(r,[60,240]);
    prop('<svg viewBox="0 0 10 10"></svg>','',878,45,124,124,1,function(){var s=scene.querySelector('.bg circle:nth-of-type(2)');sfx.sparkle();burst(940,105,16,['#ffe14d','#fff3a0','#ffffff']);say('الشمس تقول صباح الخير يا غالية ☀️');});
    prop('<svg viewBox="0 0 10 10"></svg>','',0,110,170,180,3,function(){sfx.pop();for(var i=0;i<3;i++){(function(i){var a=document.createElement('div');a.className='apple';a.style.left=(40+i*40)+'px';a.style.top='190px';fx.appendChild(a);var an=a.animate([{transform:'translateY(0)'},{transform:'translateY('+(300+i*20)+'px)'}],{duration:700+i*120,easing:'cubic-bezier(.5,0,1,1)',fill:'forwards'});an.onfinish=function(){sfx.bump();setTimeout(function(){a.remove();},1500);};})(i);}say('طاحت تفاحات من الشجرة! 🍎');});}
  if(id==='salon'){var t=prop(TANK,'tank',870,420,220,130,6,function(d){d.classList.add('fast');sfx.water();for(var i=0;i<8;i++)(function(i){setTimeout(function(){bubbleUp(A.rnd(890,1070),520);},i*90);})(i);setTimeout(function(){d.classList.remove('fast');},1500);say('السمك يسبح بسرعة! 🐠');});
    r.timers.push(setInterval(function(){if(Math.random()<.5)bubbleUp(A.rnd(890,1070),520);},700));motes(r,8);}
  if(id==='kitchen'){var kt=prop(KETTLE,'',300,232,80,72,7,function(){sfx.ring();steam(370,230,10);LIFE.shake&&0;say('الجاي يغلي! ☕ انتبهي حار!');});
    r.timers.push(setInterval(function(){steam(372,236,1);},600));cat(r,640);}
  if(id==='bedroom'){cat(r,630);var tv=prop(TV,'tv',960,190,150,104,4,function(d){d.classList.toggle('on');sfx.pop();if(d.classList.contains('on')){say('كرتون! 📺 هههه');}});
    tv.querySelector('svg').insertAdjacentHTML('afterend','<div class="tvshow"><i>★</i><i>♥</i><i>✿</i></div>');
    prop('<svg viewBox="0 0 60 270"><path d="M0 0 h55 q-25 135 0 270 h-55z" fill="#ff9cc8"/></svg>','curt',100,80,56,270,3);prop('<svg viewBox="0 0 60 270"><path d="M60 0 h-55 q25 135 0 270 h55z" fill="#ff9cc8"/></svg>','curt r',344,80,56,270,3);}
  if(id==='bath'){r.timers.push(setInterval(function(){if(Math.random()<.4)bubbleUp(A.rnd(560,940),470);},500));
    prop('<svg viewBox="0 0 10 10"></svg>','',990,330,120,70,6,function(){sfx.water();for(var i=0;i<6;i++)(function(i){setTimeout(function(){var d=document.createElement('div');d.className='drop';d.style.left=(A.rnd(1040,1060))+'px';d.style.top='360px';fx.appendChild(d);var an=d.animate([{transform:'translateY(0)'},{transform:'translateY(30px)',opacity:.2}],{duration:300});an.onfinish=function(){d.remove();};},i*60);})(i);say('المي باردة! 💧');});}
  if(id==='dress'){doors(80,140,280,300,'linear-gradient(90deg,#ffd0e5,#ffb3d1)');cat(r,650);motes(r,8);}
  if(id==='wardrobe'){cat(r,650);motes(r,10);}
  if(id==='makeup'||id==='masks'||id==='nails'){motes(r,12);}
};
function bubbleUp(x,y){var b=document.createElement('div');b.className='bub';var s=A.rnd(8,20);b.style.cssText='left:'+x+'px;top:'+y+'px;width:'+s+'px;height:'+s+'px';fx.appendChild(b);var an=b.animate([{transform:'translateY(0)',opacity:.9},{transform:'translate('+A.rnd(-15,15)+'px,-'+A.rnd(60,110)+'px)',opacity:0}],{duration:A.rnd(1000,1800)});an.onfinish=function(){b.remove();};}
LIFE.bubbleUp=bubbleUp;
})();
