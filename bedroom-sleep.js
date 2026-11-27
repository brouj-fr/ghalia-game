/* Bedroom sleep: Ghalia and Khala walk to the bed, hop up, and slide under the
   room's own quilt, heads on the pillows. On-screen text is Arabic; anything
   SPOKEN is English via VOICE_EN. Classic script, offline. */
(function(){
'use strict';
if(!window.GAME||!GAME.ROOMS||!GAME.ROOMS.bedroom)return;
var A=GAME.api,ROOMS=GAME.ROOMS;

var LINES={
  intro:'وقت النوم! اضغطي نوم عشان غالية تنام تحت اللحاف مع دبدوبها 🌙',
  go:'يلا ننام يا غالية',
  night:'تصبحين على خير يا غالية!',
  dreams:'أحلام سعيدة!',
  khala:'خالتج بتنام جنبيج 💗',
  morning:'صباح الخير يا غالية!',
  teddy:'الدبدوب بينام وياج 🧸'
};
(function addDict(){
  if(!window.VOICE_EN||!VOICE_EN.dict)return;
  var D=VOICE_EN.dict, add={
    'وقت النوم اضغطي نوم عشان غالية تنام تحت اللحاف مع دبدوبها':'Bedtime! Tap Sleep so Ghalia can snuggle under the blanket with her teddy.',
    'يلا ننام يا غالية':'Let\'s go to sleep, Ghalia.',
    'تصبحين على خير يا غالية':'Good night, Ghalia!',
    'أحلام سعيدة':'Sweet dreams!',
    'خالتج بتنام جنبيج':'Auntie is sleeping next to you.',
    'صباح الخير يا غالية':'Good morning, Ghalia!',
    'الدبدوب بينام وياج':'Teddy will sleep with you.'
  };
  for(var k in add)if(!D[k])D[k]=add[k];
})();
ROOMS.bedroom.intro=LINES.intro;

/* Final positions (scene px) of the lying sprites on the painted bed. */
var POS={
  ghalia:{x:676,y:242,w:296,h:211, start:{x:586,y:327}},
  khala:{x:567,y:195,w:245,h:209, start:{x:487,y:280}}
};
var WALK={ghalia:[560,685], khala:[500,675]};
var STARS=[[250,90],[310,70],[390,110],[460,80],[280,150],[430,160],[360,55],[500,130],[220,180]];
var LULL=[[64,1],[67,1],[67,2],[64,1],[67,1],[67,2],[64,1],[67,1],[72,1],[71,1],[69,3],[65,1],[69,1],[69,2],[64,1],[67,1],[67,2],[64,1],[62,1],[64,1],[62,1],[60,4]];

var lull={C:null,g:null,timer:null,t:0,i:0};
function musicAllowed(){var b=document.getElementById('bMusic');if(b&&b.classList.contains('off'))return false;try{if(window.V2&&V2.isMusic&&!V2.isMusic())return false;}catch(e){}return true;}
function mtof(m){return 440*Math.pow(2,(m-69)/12);}
function stopLullaby(){if(lull.timer){clearInterval(lull.timer);lull.timer=null;}if(lull.g&&lull.C){try{var t=lull.C.currentTime;lull.g.gain.cancelScheduledValues(t);lull.g.gain.setTargetAtTime(.0001,t,.08);}catch(e){}}}
function startLullaby(){
  stopLullaby();if(!musicAllowed())return;
  try{
    var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    if(!lull.C){lull.C=new AC();lull.g=lull.C.createGain();lull.g.gain.value=.0001;var lp=lull.C.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1600;lull.g.connect(lp);lp.connect(lull.C.destination);}
    if(lull.C.state==='suspended')lull.C.resume();
    var t0=lull.C.currentTime;lull.g.gain.setValueAtTime(.0001,t0);lull.g.gain.exponentialRampToValueAtTime(.07,t0+.4);
    lull.t=t0+.15;lull.i=0;
    function tone(f,d,v,when){var o=lull.C.createOscillator(),g=lull.C.createGain();o.type='sine';o.frequency.setValueAtTime(f,when);
      g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(v,when+.03);g.gain.exponentialRampToValueAtTime(.0001,when+d);
      o.connect(g);g.connect(lull.g);o.start(when);o.stop(when+d+.04);}
    lull.timer=setInterval(function(){
      if(!lull.C)return;var bt=.42;while(lull.t<lull.C.currentTime+.6){var n=LULL[lull.i%LULL.length],off=lull.t;
        tone(mtof(n[0]),n[1]*bt*.92,.55,off);tone(mtof(n[0]+12),n[1]*bt*.7,.18,off);
        lull.t+=n[1]*bt;lull.i++;}
    },120);
  }catch(e){}
}

function el(html,cls){var d=document.createElement('div');if(cls)d.className=cls;if(html)d.innerHTML=html;return d;}
function later(r,fn,ms){var t=setTimeout(function(){if(!r||r.dead)return;fn();},ms);if(r&&r.timers)r.timers.push(t);return t;}
function say(t){A.say(t);}

function hideStand(r,who){
  var c=r.chars[who];if(!c)return;
  try{if(c.getAnimations)c.getAnimations().forEach(function(a){a.cancel();});}catch(e){}
  c._walkId=0;c.classList.add('sl-tucked');c.style.opacity='0';c.style.visibility='hidden';c.style.pointerEvents='none';
  var img=c.querySelector('img');if(img){img.style.animation='none';}
}
function showStand(r,who){
  var c=r.chars[who];if(!c)return;
  c.classList.remove('sl-tucked');c.style.opacity='';c.style.visibility='';c.style.pointerEvents='';c.style.transform='';c.style.scale='';
}

function walkTo(r,who,x,y,done){
  var c=r.chars[who];
  if(!c){A.putChar(who,x,y);if(done)done();return;}
  if(window.LIFE&&LIFE.walkTo)LIFE.walkTo(c,x,y,done);
  else{A.putChar(who,x,y);if(done)done();}
}

function hopUp(el,done){
  if(!el||!el.animate){if(done)done();return;}
  try{if(el.getAnimations)el.getAnimations().forEach(function(a){a.cancel();});}catch(e){}
  el.style.zIndex='16';
  var an=el.animate([
    {transform:'translateY(0) scale(1,1)', offset:0},
    {transform:'translateY(-18px) scale(1.06,.92)', offset:.18},
    {transform:'translate(28px,-96px) scale(.95,1.06)', offset:.55},
    {transform:'translate(36px,-70px) scale(1,1)', offset:1}
  ],{duration:480,easing:'cubic-bezier(.2,.8,.25,1)',fill:'forwards'});
  an.onfinish=function(){if(done)done();};
}

function placeSleeper(node,x,y){node.style.left=x+'px';node.style.top=y+'px';}

function slideSleeper(node,from,to,ms,done){
  placeSleeper(node,from.x,from.y);
  node.classList.add('on');
  if(!node.animate){placeSleeper(node,to.x,to.y);if(done)done();return;}
  var an=node.animate([
    {left:from.x+'px', top:from.y+'px'},
    {left:to.x+'px', top:to.y+'px'}
  ],{duration:ms||780,easing:'cubic-bezier(.25,.8,.2,1)',fill:'forwards'});
  an.onfinish=function(){placeSleeper(node,to.x,to.y);if(done)done();};
}

function syncParallax(){
  var lock=document.getElementById('sl-lock');
  var par=document.querySelector('#scene .v2par');
  if(!lock||!par)return;
  lock.style.transform=par.style.transform||getComputedStyle(par).transform||'';
}
function startParallax(r){
  if(window.__slPar)return;
  window.__slPar=function loop(){
    window.__slParId=requestAnimationFrame(loop);
    var cur=A.getR();
    if(!cur||cur.id!=='bedroom'||cur.dead)return;
    syncParallax();
  };
  window.__slPar();
}

function mkLock(){
  var lock=el('','');lock.id='sl-lock';
  var g=el('','sl-sleeper sl-ghalia');g.style.width=POS.ghalia.w+'px';g.style.height=POS.ghalia.h+'px';
  g.innerHTML='<img src="img/sleep/ghalia-sleeper.webp" alt="" draggable="false">';
  placeSleeper(g,POS.ghalia.x,POS.ghalia.y);
  var k=el('','sl-sleeper sl-khala');k.style.width=POS.khala.w+'px';k.style.height=POS.khala.h+'px';
  k.innerHTML='<img src="img/sleep/khala-sleeper.webp" alt="" draggable="false">';
  placeSleeper(k,POS.khala.x,POS.khala.y);
  var q=el('','sl-quilt');q.innerHTML='<img src="img/sleep/quilt.webp" alt="" draggable="false">';
  var hit=el('','sl-bedhit');
  var z1=el('<i>z</i><i>z</i><i>Z</i>','sl-zzz');z1.style.left='890px';z1.style.top='220px';
  var z2=el('<i>z</i><i>z</i><i>Z</i>','sl-zzz');z2.style.left='700px';z2.style.top='170px';
  lock.appendChild(g);lock.appendChild(k);lock.appendChild(q);lock.appendChild(hit);lock.appendChild(z1);lock.appendChild(z2);
  return {lock:lock,g:g,k:k,quilt:q,hit:hit,z1:z1,z2:z2};
}

function mkNight(){
  var n=el('','sl-night');
  n.innerHTML='<div class="sl-dim"></div><div class="sl-moonbeam"></div>';
  STARS.forEach(function(p,i){var s=document.createElement('i');s.className='sl-stari';
    s.style.cssText='left:'+p[0]+'px;top:'+p[1]+'px;animation-delay:'+(i*.27)+'s;width:'+(8+(i%3)*3)+'px;height:'+(8+(i%3)*3)+'px';
    n.appendChild(s);});
  return n;
}
function mkDock(){
  var d=el('','sl-dock');d.setAttribute('role','toolbar');d.setAttribute('aria-label','النوم');
  d.innerHTML='<button type="button" class="sl-btn sl-sleep" data-act="sleep"><i>🌙</i><span>نوم</span></button>'+
    '<button type="button" class="sl-btn sl-khala" data-act="khala"><i>💗</i><span>خالة تنام بعد</span></button>'+
    '<button type="button" class="sl-btn sl-wake" data-act="wake" hidden><i>☀️</i><span>صباح الخير</span></button>';
  return d;
}

function setNight(r,on){
  r.slNight=!!on;if(r.slNightEl)r.slNightEl.classList.toggle('on',on);
  if(r.lamp)r.lamp.classList.toggle('off',on);
  if(r.nightEl)r.nightEl.classList.toggle('on',false);
  r.night=!!on;
  var sc=A.scene();if(sc)sc.classList.toggle('sl-asleep',!!(on||r.slSleeping));
}
function updateDock(r){
  if(!r.slDock)return;
  var sleep=r.slDock.querySelector('.sl-sleep');
  var kh=r.slDock.querySelector('.sl-khala');
  var wake=r.slDock.querySelector('.sl-wake');
  if(sleep)sleep.hidden=!!r.slSleeping;
  if(kh)kh.hidden=!!r.slKhala;
  if(wake)wake.hidden=!r.slSleeping;
}

function lightsOut(r){
  setNight(r,true);
  if(A.sfx&&A.sfx.night)A.sfx.night();
  startLullaby();
  var sc=A.scene();if(sc)sc.classList.add('sl-asleep');
  if(r.blanket)r.blanket.style.visibility='hidden';
  if(r.teddy)r.teddy.style.visibility='hidden';
  if(r.slLock)r.slLock.classList.add('hot');
}
function lightsUp(r){
  setNight(r,false);
  stopLullaby();
  if(A.sfx&&A.sfx.sparkle)A.sfx.sparkle();
  var sc=A.scene();if(sc)sc.classList.remove('sl-asleep');
  if(r.teddy)r.teddy.style.visibility='';
  if(r.slLock)r.slLock.classList.remove('hot');
  if(r.slG){r.slG.classList.remove('on','breath');try{if(r.slG.getAnimations)r.slG.getAnimations().forEach(function(a){a.cancel();});}catch(e){}}
  if(r.slK){r.slK.classList.remove('on','breath');try{if(r.slK.getAnimations)r.slK.getAnimations().forEach(function(a){a.cancel();});}catch(e){}}
  if(r.slQuilt)r.slQuilt.classList.remove('up');
  if(r.slZ1)r.slZ1.classList.remove('on');
  if(r.slZ2)r.slZ2.classList.remove('on');
}

function tuckGhalia(r,opts,done){
  var P=POS.ghalia;
  if(opts&&opts.instant){
    hideStand(r,'ghalia');
    placeSleeper(r.slG,P.x,P.y);r.slG.classList.add('on','breath');
    if(r.slQuilt)r.slQuilt.classList.add('up');
    if(r.slZ1)r.slZ1.classList.add('on');
    if(done)done();return;
  }
  hopUp(r.chars.ghalia,function(){
    if(r.dead)return;
    hideStand(r,'ghalia');
    if(r.slQuilt)r.slQuilt.classList.add('up');
    slideSleeper(r.slG,P.start,P,780,function(){
      if(r.dead)return;
      r.slG.classList.add('breath');
      if(r.slZ1)r.slZ1.classList.add('on');
      if(done)done();
    });
  });
}

function tuckKhala(r,opts,done){
  var P=POS.khala;
  if(opts&&opts.instant){
    hideStand(r,'khala');
    placeSleeper(r.slK,P.x,P.y);r.slK.classList.add('on','breath');
    if(r.slQuilt)r.slQuilt.classList.add('up');
    if(r.slZ2)r.slZ2.classList.add('on');
    if(done)done();return;
  }
  hopUp(r.chars.khala,function(){
    if(r.dead)return;
    hideStand(r,'khala');
    if(r.slQuilt)r.slQuilt.classList.add('up');
    slideSleeper(r.slK,P.start,P,780,function(){
      if(r.dead)return;
      r.slK.classList.add('breath');
      if(r.slZ2)r.slZ2.classList.add('on');
      if(done)done();
    });
  });
}

function goToSleep(r,opts){
  opts=opts||{};
  if(!r||r.dead||r.slBusy)return;
  if(r.slSleeping){if(opts.khala&&!r.slKhala)khalaJoin(r,opts);return;}
  r.slBusy=true;r.def.noWalk=true;r.def.noWander=true;
  say(LINES.go);
  if(!r.chars.ghalia)A.putChar('ghalia',320,690);
  var after=function(){
    if(r.dead)return;
    tuckGhalia(r,opts,function(){
      if(r.dead)return;
      lightsOut(r);
      r.slSleeping=true;r.inBed=true;r.slBusy=false;
      updateDock(r);
      later(r,function(){say(LINES.night);},200);
      later(r,function(){say(LINES.dreams);},2600);
      if(opts.khala)later(r,function(){khalaJoin(r,opts);},900);
    });
  };
  if(opts.instant)after();
  else walkTo(r,'ghalia',WALK.ghalia[0],WALK.ghalia[1],after);
}

function khalaJoin(r,opts){
  opts=opts||{};
  if(!r||r.dead||r.slKhala||r.slBusy)return;
  if(!r.slSleeping){goToSleep(r,{khala:true,instant:opts.instant});return;}
  r.slBusy=true;
  if(!r.chars.khala)A.putChar('khala',400,700);
  var after=function(){
    if(r.dead)return;
    tuckKhala(r,opts,function(){
      if(r.dead)return;
      r.slKhala=true;r.slBusy=false;
      updateDock(r);
      say(LINES.khala);
    });
  };
  if(opts.instant)after();
  else walkTo(r,'khala',WALK.khala[0],WALK.khala[1],after);
}

function wakeUp(r){
  if(!r||r.dead||!r.slSleeping||r.slBusy)return;
  r.slBusy=true;
  lightsUp(r);
  showStand(r,'ghalia');showStand(r,'khala');
  r.slSleeping=false;r.slKhala=false;r.inBed=false;
  r.def.noWalk=false;r.def.noWander=false;
  A.putChar('ghalia',470,690,true);
  if(r.chars.khala)A.putChar('khala',300,700,true);
  r.slBusy=false;
  updateDock(r);
  say(LINES.morning);
  if(window.LIFE&&LIFE.heartBurst)LIFE.heartBurst(640,360);
  if(A.burst)A.burst(640,360,14,['#ffd34d','#fff','#ff9cc8']);
}

function bindDock(r){
  r.slDock.addEventListener('pointerdown',function(e){e.stopPropagation();});
  r.slDock.addEventListener('click',function(e){
    var b=e.target.closest('.sl-btn');if(!b||b.disabled)return;
    e.preventDefault();e.stopPropagation();
    try{if(A.sfx&&A.sfx.pick)A.sfx.pick();}catch(x){}
    var act=b.getAttribute('data-act');
    if(act==='sleep')goToSleep(r,{});
    else if(act==='khala')khalaJoin(r,{});
    else if(act==='wake')wakeUp(r);
  });
  if(r.slHit)r.slHit.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();if(r.slSleeping)wakeUp(r);});
}

function setup(r){
  stopLullaby();
  r.slSleeping=false;r.slKhala=false;r.slBusy=false;
  r.def.noWalk=false;r.def.noWander=false;
  if(r.blanket)r.blanket.style.visibility='hidden';
  var sc=A.scene();
  var layers=mkLock();
  r.slLock=layers.lock;r.slG=layers.g;r.slK=layers.k;r.slQuilt=layers.quilt;r.slHit=layers.hit;r.slZ1=layers.z1;r.slZ2=layers.z2;
  /* sit inside the painted plate so we can share its parallax transform */
  var plate=sc.querySelector('.v2p')||sc;
  plate.appendChild(r.slLock);
  r.slNightEl=mkNight();sc.appendChild(r.slNightEl);
  r.slDock=mkDock();sc.appendChild(r.slDock);
  bindDock(r);
  updateDock(r);
  startParallax(r);
  syncParallax();
  if(!window.__slWatch){window.__slWatch=setInterval(function(){var cur=A.getR();if(!cur||cur.id!=='bedroom'||cur.dead||!cur.slSleeping)stopLullaby();},1000);}
}

var _init=ROOMS.bedroom.init;
ROOMS.bedroom.init=function(r){
  _init.apply(this,arguments);
  setup(r);
};

var _drop=ROOMS.bedroom.charDrop;
ROOMS.bedroom.charDrop=function(who,x,y){
  var r=A.getR();
  if(!r||r.id!=='bedroom')return _drop.apply(this,arguments);
  if(r.slBusy)return true;
  if(r.slSleeping){
    if(who==='khala'&&!r.slKhala){khalaJoin(r,{});return true;}
    return true;
  }
  var on=x>450&&x<1000&&y>400;
  if(who==='ghalia'&&on){goToSleep(r,{});return true;}
  if(who==='khala'&&on){goToSleep(r,{khala:true});return true;}
  return _drop.apply(this,arguments);
};

var _tool=ROOMS.bedroom.drop;
ROOMS.bedroom.drop=function(id,p){
  var r=A.getR();
  if(r&&r.slSleeping&&id==='teddy'){say(LINES.teddy);if(A.sfx&&A.sfx.pop)A.sfx.pop();return true;}
  return _tool.apply(this,arguments);
};

window.__sleep={
  go:function(o){var r=A.getR();if(r&&r.id==='bedroom')goToSleep(r,o||{});},
  khala:function(o){var r=A.getR();if(r&&r.id==='bedroom')khalaJoin(r,o||{});},
  wake:function(o){var r=A.getR();if(r&&r.id==='bedroom')wakeUp(r);},
  state:function(){var r=A.getR();return r?{id:r.id,sleeping:!!r.slSleeping,khala:!!r.slKhala,busy:!!r.slBusy}:null;}
};
})();
