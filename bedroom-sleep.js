/* Bedroom sleep feature: Ghalia walks to bed, tucks under the quilt with her teddy,
   night falls with moonlight, a soft lullaby, floating Zzz. Khala can lie beside her.
   On-screen text is Arabic; anything SPOKEN is English via VOICE_EN. Classic script, offline. */
(function(){
'use strict';
if(!window.GAME||!GAME.ROOMS||!GAME.ROOMS.bedroom)return;
var A=GAME.api,ROOMS=GAME.ROOMS;

/* ---- English voice lines (Arabic stays on screen) ---- */
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

function el(html,cls,x,y,w,h,z){var d=document.createElement('div');if(cls)d.className=cls;if(x!=null)d.style.left=x+'px';if(y!=null)d.style.top=y+'px';
  if(w!=null)d.style.width=w+'px';if(h!=null)d.style.height=h+'px';if(z!=null)d.style.zIndex=z;if(html)d.innerHTML=html;return d;}
function later(r,fn,ms){var t=setTimeout(function(){if(!r||r.dead)return;fn();},ms);if(r&&r.timers)r.timers.push(t);return t;}
function say(t){A.say(t);}

function mkOverlay(src, extra){var d=el('','sl-overlay '+(extra||''),0,0,1280,720,13);
  var img=document.createElement('img');img.src=src;img.alt='';img.draggable=false;d.appendChild(img);return d;}
function mkNight(){var n=el('','sl-night',0,0,1280,720,12);
  n.innerHTML='<div class="sl-dim"></div><div class="sl-moonbeam"></div>';
  STARS.forEach(function(p,i){var s=document.createElement('i');s.className='sl-stari';
    s.style.cssText='left:'+p[0]+'px;top:'+p[1]+'px;animation-delay:'+(i*.27)+'s;width:'+(8+(i%3)*3)+'px;height:'+(8+(i%3)*3)+'px';
    n.appendChild(s);});
  return n;}
function mkZzz(x,y){var z=el('<i>z</i><i>z</i><i>Z</i>','sl-zzz',x,y,40,40,16);return z;}
function mkDock(){var d=el('','sl-dock');d.setAttribute('role','toolbar');d.setAttribute('aria-label','النوم');
  d.innerHTML='<button type="button" class="sl-btn sl-sleep" data-act="sleep"><i>🌙</i><span>نوم</span></button>'+
    '<button type="button" class="sl-btn sl-khala" data-act="khala"><i>💗</i><span>خالة تنام بعد</span></button>'+
    '<button type="button" class="sl-btn sl-wake" data-act="wake" hidden><i>☀️</i><span>صباح الخير</span></button>';
  return d;}

function setNight(r,on){
  r.slNight=!!on;if(r.slNightEl)r.slNightEl.classList.toggle('on',on);
  if(r.lamp)r.lamp.classList.toggle('off',on);
  if(r.nightEl)r.nightEl.classList.toggle('on',false); /* use our cinematic night, not the flat overlay */
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

function hideStanders(r,who){
  var list=who? [who] : ['ghalia','khala'];
  list.forEach(function(w){var c=r.chars[w];if(!c)return;c.classList.add('sl-tucked');c._walkId=0;});
}
function showStanders(r){
  ['ghalia','khala'].forEach(function(w){var c=r.chars[w];if(c)c.classList.remove('sl-tucked');});
}

function placeWakeChars(r){
  A.putChar('ghalia',470,690,true);
  if(r.chars.khala||r.slKhala)A.putChar('khala',300,700,true);
}

function walk(r,who,x,y,done){
  var c=r.chars[who];
  if(!c){A.putChar(who,x,y);if(done)done();return;}
  if(window.LIFE&&LIFE.walkTo)LIFE.walkTo(c,x,y,done);
  else{A.putChar(who,x,y);if(done)done();}
}

function showGhaliaBed(r){
  if(!r.slGhaliaOv){r.slGhaliaOv=mkOverlay('img/sleep/ghalia.webp');A.scene().appendChild(r.slGhaliaOv);
    r.slGhaliaOv.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();if(r.slSleeping)wakeUp(r);});}
  r.slGhaliaOv.classList.remove('together','fade','breath');r.slGhaliaOv.classList.add('on');
  if(r.slTogetherOv)r.slTogetherOv.classList.remove('on','breath','fade');
  later(r,function(){if(r.slSleeping&&r.slGhaliaOv)r.slGhaliaOv.classList.add('breath');},900);
  if(r.slZ1){r.slZ1.style.left='900px';r.slZ1.style.top='230px';r.slZ1.classList.add('on');}
  if(r.slZ2)r.slZ2.classList.remove('on');
}
function showTogetherBed(r){
  if(!r.slTogetherOv){r.slTogetherOv=mkOverlay('img/sleep/together.webp','together');A.scene().appendChild(r.slTogetherOv);
    r.slTogetherOv.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();if(r.slSleeping)wakeUp(r);});}
  r.slTogetherOv.classList.add('on','fade');
  if(r.slGhaliaOv)r.slGhaliaOv.classList.remove('on','breath');
  later(r,function(){if(r.slSleeping&&r.slTogetherOv)r.slTogetherOv.classList.add('breath');},700);
  if(r.slZ1){r.slZ1.style.left='910px';r.slZ1.style.top='240px';r.slZ1.classList.add('on');}
  if(r.slZ2){r.slZ2.style.left='560px';r.slZ2.style.top='210px';r.slZ2.classList.add('on');}
}

function lightsOut(r){
  setNight(r,true);
  if(A.sfx&&A.sfx.night)A.sfx.night();
  startLullaby();
  var sc=A.scene();if(sc)sc.classList.add('sl-asleep');
  if(r.blanket)r.blanket.style.visibility='hidden';
  if(r.teddy)r.teddy.style.visibility='hidden';
}

function lightsUp(r){
  setNight(r,false);
  stopLullaby();
  if(A.sfx&&A.sfx.sparkle)A.sfx.sparkle();
  var sc=A.scene();if(sc)sc.classList.remove('sl-asleep');
  if(r.teddy)r.teddy.style.visibility='';
  if(r.slZ1)r.slZ1.classList.remove('on');
  if(r.slZ2)r.slZ2.classList.remove('on');
  if(r.slGhaliaOv)r.slGhaliaOv.classList.remove('on','breath','fade');
  if(r.slTogetherOv)r.slTogetherOv.classList.remove('on','breath','fade');
}

function goToSleep(r,opts){
  opts=opts||{};
  if(!r||r.dead||r.slBusy)return;
  if(r.slSleeping){if(opts.khala&&!r.slKhala)khalaJoin(r,opts);return;}
  r.slBusy=true;r.def.noWalk=true;r.def.noWander=true;
  say(LINES.go);
  if(!r.chars.ghalia)A.putChar('ghalia',320,690);
  var afterWalk=function(){
    if(r.dead)return;
    hideStanders(r,'ghalia');
    showGhaliaBed(r);
    lightsOut(r);
    r.slSleeping=true;r.inBed=true;r.slBusy=false;
    updateDock(r);
    later(r,function(){say(LINES.night);},500);
    later(r,function(){say(LINES.dreams);},2800);
    if(opts.khala)later(r,function(){khalaJoin(r,opts);},1800);
  };
  if(opts.instant){afterWalk();}
  else walk(r,'ghalia',620,655,afterWalk);
}

function khalaJoin(r,opts){
  opts=opts||{};
  if(!r||r.dead||r.slKhala||r.slBusy)return;
  if(!r.slSleeping){goToSleep(r,{khala:true,instant:opts.instant});return;}
  r.slBusy=true;
  if(!r.chars.khala)A.putChar('khala',400,700);
  var after=function(){
    if(r.dead)return;
    hideStanders(r,'khala');
    showTogetherBed(r);
    r.slKhala=true;r.slBusy=false;
    updateDock(r);
    say(LINES.khala);
  };
  if(opts.instant){after();}
  else walk(r,'khala',560,660,after);
}

function wakeUp(r,opts){
  opts=opts||{};
  if(!r||r.dead||!r.slSleeping||r.slBusy)return;
  r.slBusy=true;
  lightsUp(r);
  showStanders(r);
  r.slSleeping=false;r.slKhala=false;r.inBed=false;
  r.def.noWalk=false;r.def.noWander=false;
  placeWakeChars(r);
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
    else if(act==='wake')wakeUp(r,{});
  });
}

function setup(r){
  stopLullaby();
  r.slSleeping=false;r.slKhala=false;r.slBusy=false;
  r.def.noWalk=false;r.def.noWander=false;
  var sc=A.scene();
  r.slNightEl=mkNight();sc.appendChild(r.slNightEl);
  r.slZ1=mkZzz(900,230);sc.appendChild(r.slZ1);
  r.slZ2=mkZzz(620,200);sc.appendChild(r.slZ2);
  r.slDock=mkDock();sc.appendChild(r.slDock);
  bindDock(r);
  updateDock(r);
  /* preload both overlays */
  r.slGhaliaOv=mkOverlay('img/sleep/ghalia.webp');sc.appendChild(r.slGhaliaOv);
  r.slTogetherOv=mkOverlay('img/sleep/together.webp','together');sc.appendChild(r.slTogetherOv);
  r.slGhaliaOv.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();if(r.slSleeping)wakeUp(r);});
  r.slTogetherOv.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();if(r.slSleeping)wakeUp(r);});
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
  go:function(o){var r=A.getR();if(r&&r.id==='bedroom')goToSleep(r,o||{instant:true});},
  khala:function(o){var r=A.getR();if(r&&r.id==='bedroom')khalaJoin(r,o||{instant:true});},
  wake:function(o){var r=A.getR();if(r&&r.id==='bedroom')wakeUp(r,o||{});},
  state:function(){var r=A.getR();return r?{id:r.id,sleeping:!!r.slSleeping,khala:!!r.slKhala,busy:!!r.slBusy}:null;}
};
})();
