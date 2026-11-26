/* مغامرات غالية مع خالتها — offline, no network */
(function(){
'use strict';
var W=1280,H=720;
function $(s){return document.querySelector(s);}
var stage=$('#stage'),scene=$('#scene'),toolbar=$('#toolbar'),carousel=$('#carousel'),fx=$('#fx'),dragl=$('#dragl'),bubble=$('#bubble'),btext=$('#btext');
var scale=1,GY=0;
var rot=false;
function fit(){var w=innerWidth,h=innerHeight;rot=h>w*1.05;
  var ps=rot&&(stage.dataset.screen||'start')==='start';stage.classList.toggle('pstart',ps);
  if(ps){rot=false;scale=Math.min(w/720,h/1280);stage.style.transform='translate(-50%,-50%) scale('+scale+')';return;}
  if(rot){scale=Math.min(h/W,w/H);stage.style.transform='translate(-50%,-50%) rotate(90deg) scale('+scale+')';}
  else{scale=Math.min(w/W,h/H);stage.style.transform='translate(-50%,-50%) scale('+scale+')';}}
function c2s(cx,cy){var r=stage.getBoundingClientRect();var dx=(cx-(r.left+r.width/2))/scale,dy=(cy-(r.top+r.height/2))/scale;return rot?{x:W/2+dy,y:H/2-dx}:{x:W/2+dx,y:H/2+dy};}
addEventListener('resize',fit);addEventListener('orientationchange',function(){setTimeout(fit,200);});fit();
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function rnd(a,b){return a+Math.random()*(b-a);}
function pick(a){return a[Math.floor(Math.random()*a.length)];}

/* ---------- no scroll / zoom ---------- */
document.addEventListener('touchmove',function(e){e.preventDefault();},{passive:false});
['gesturestart','gesturechange','contextmenu','dblclick','selectstart'].forEach(function(t){document.addEventListener(t,function(e){e.preventDefault();});});

/* ---------- audio (WebAudio only) ---------- */
var AC=null,master=null,musicGain=null,musicOn=true,voiceOn=true,musTimer=null,musT=0,musI=0;
function audio(){
  if(!AC){try{var C=window.AudioContext||window.webkitAudioContext;if(!C)return;AC=new C();master=AC.createGain();master.gain.value=.8;master.connect(AC.destination);musicGain=AC.createGain();musicGain.gain.value=.05;musicGain.connect(master);}catch(e){AC=null;return;}}
  if(AC.state==='suspended'){try{AC.resume();}catch(e){}}
  if(musicOn&&!musTimer)startMusic();
}
function tone(f,d,type,v,t0,dest,slide){
  if(!AC)return;var t=AC.currentTime+(t0||0);var o=AC.createOscillator(),g=AC.createGain();
  o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+d);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v||.2,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(g);g.connect(dest||master);o.start(t);o.stop(t+d+.05);
}
var nbuf=null;
function noise(d,freq,v){
  if(!AC)return;if(!nbuf){nbuf=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);var a=nbuf.getChannelData(0);for(var i=0;i<a.length;i++)a[i]=Math.random()*2-1;}
  var s=AC.createBufferSource();s.buffer=nbuf;var f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=freq;f.Q.value=1.2;
  var g=AC.createGain(),t=AC.currentTime;g.gain.setValueAtTime(v||.2,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+d+.05);
}
var sfx={
  pop:function(){tone(420,.14,'sine',.3,0,null,1100);},
  pick:function(){tone(700,.08,'sine',.12,0,null,900);},
  sparkle:function(){[1568,2093,2637,3136,2637].forEach(function(f,i){tone(f,.3,'triangle',.07,i*.06);});},
  dig:function(){noise(.3,500,.35);tone(160,.15,'sine',.15);},
  water:function(){noise(.12,2600,.06);},
  ding:function(){tone(1318,.8,'sine',.2);tone(1976,.9,'sine',.1,.12);},
  tada:function(){[523,659,784,1046,1318].forEach(function(f,i){tone(f,.35,'triangle',.14,i*.1);});},
  boing:function(){tone(260,.25,'sine',.25,0,null,520);},
  oops:function(){tone(330,.18,'triangle',.15,0,null,220);},
  whoosh:function(){noise(.35,900,.12);},
  meow:function(){tone(700,.35,'sawtooth',.06,0,null,500);tone(900,.25,'sine',.08,.05,null,600);},
  clap:function(){for(var i=0;i<4;i++){(function(i){setTimeout(function(){noise(.06,1800,.35);},i*110);})(i);}},
  knock:function(){tone(180,.08,'square',.12);tone(170,.08,'square',.12,.15);},
  step:function(){noise(.05,400,.1);},
  munch:function(){noise(.08,1200,.2);setTimeout(function(){noise(.08,1000,.2);},120);},
  ring:function(){for(var i=0;i<6;i++)tone(i%2?1760:1568,.08,'square',.06,i*.09);},
  star:function(){tone(988,.12,'triangle',.15);tone(1319,.2,'triangle',.15,.08);},
  win:function(){[523,659,784,1046,784,1046,1318].forEach(function(f,i){tone(f,.3,'triangle',.14,i*.12);});},
  bump:function(){tone(120,.2,'sine',.3,0,null,60);},
  night:function(){[1046,880,784,659].forEach(function(f,i){tone(f,.6,'sine',.08,i*.18);});}
};
var MEL=[[72,1],[76,1],[79,1],[76,1],[77,1],[81,1],[79,2],[76,1],[79,1],[84,1],[81,1],[79,1],[76,1],[72,2],[74,1],[77,1],[81,1],[77,1],[76,1],[79,1],[84,2],[79,1],[77,1],[76,1],[74,1],[72,4]];
var BASS=[48,53,55,48,45,53,55,48];
function mtof(m){return 440*Math.pow(2,(m-69)/12);}
function startMusic(){if(!AC||musTimer)return;musT=AC.currentTime+.15;musI=0;var beatN=0;
  musTimer=setInterval(function(){var bt=.36;while(musT<AC.currentTime+.6){var n=MEL[musI%MEL.length];var off=musT-AC.currentTime;
    tone(mtof(n[0]),n[1]*bt*.95,'triangle',.5,off,musicGain);
    if(beatN%2===0)tone(mtof(BASS[(beatN/4|0)%BASS.length]),bt*1.9,'sine',.45,off,musicGain);
    beatN+=n[1];musT+=n[1]*bt;musI++;}},120);}
function stopMusic(){if(musTimer){clearInterval(musTimer);musTimer=null;}}

/* ---------- speech ---------- */
var arVoice=null;
function pickVoice(){} /* v2: Arabic voice removed — speech is English-only via voice-en.js */

var lastSay='';
function say(t){
  lastSay=t;btext.textContent=t;bubble.classList.remove('show');void bubble.offsetWidth;bubble.classList.add('show');
  if(voiceOn&&window.VOICE_EN){VOICE_EN.speak(t);}
}

/* ---------- effects ---------- */
var STAR='<svg viewBox="0 0 20 20"><path d="M10 0 L12.6 7.4 L20 10 L12.6 12.6 L10 20 L7.4 12.6 L0 10 L7.4 7.4Z" fill="currentColor"/></svg>';
function burst(x,y,n,colors){n=n||12;colors=colors||['#ffd34d','#ff7eb6','#ffffff','#b388ff','#7ed6ff'];
  for(var i=0;i<n;i++){(function(i){var s=document.createElement('div');s.className='spk';s.innerHTML=STAR;s.style.color=colors[i%colors.length];var sz=rnd(14,32);
    s.style.width=s.style.height=sz+'px';s.style.left=(x-sz/2)+'px';s.style.top=(y-sz/2)+'px';fx.appendChild(s);
    var a=rnd(0,Math.PI*2),d=rnd(40,120);
    var an=s.animate([{transform:'translate(0,0) scale(.2) rotate(0deg)',opacity:1},{transform:'translate('+Math.cos(a)*d+'px,'+Math.sin(a)*d+'px) scale(1) rotate(160deg)',opacity:1,offset:.6},{transform:'translate('+Math.cos(a)*d*1.2+'px,'+(Math.sin(a)*d*1.2+24)+'px) scale(.3) rotate(260deg)',opacity:0}],{duration:rnd(800,1300),easing:'ease-out'});
    an.onfinish=function(){s.remove();};})(i);}}
function confetti(){for(var i=0;i<70;i++){(function(i){var c=document.createElement('div');c.className='conf';c.style.background=['#ff5fa2','#ffd34d','#7ed6ff','#b388ff','#7be07b'][i%5];c.style.left=rnd(0,W)+'px';c.style.top='-30px';fx.appendChild(c);
  var an=c.animate([{transform:'translate(0,0) rotate(0deg)'},{transform:'translate('+rnd(-150,150)+'px,'+(H+60)+'px) rotate('+rnd(200,900)+'deg)'}],{duration:rnd(2000,3400),delay:rnd(0,700),easing:'cubic-bezier(.3,.6,.6,1)',fill:'backwards'});an.onfinish=function(){c.remove();};})(i);}}
function hop(el,n){if(!el)return;el.animate([{transform:'translateY(0)'},{transform:'translateY(-46px)'},{transform:'translateY(0)'}],{duration:480,iterations:n||1,easing:'ease-in-out'});}
function wiggle(el){el.animate([{transform:'rotate(0)'},{transform:'rotate(-10deg)'},{transform:'rotate(10deg)'},{transform:'rotate(0)'}],{duration:400});}

/* ---------- coordinates & drag ---------- */
function toStage(e){return c2s(e.clientX,e.clientY);}
function hp(p){return {x:p.x,y:p.y-GY};}
function centerOf(el){var r=el.getBoundingClientRect();return c2s(r.left+r.width/2,r.top+r.height/2);}
function drag(el,o){
  el.addEventListener('pointerdown',function(e){
    if(e.button>0)return;e.preventDefault();e.stopPropagation();audio();
    GY=(e.pointerType==='touch'||e.pointerType==='pen')?40:0;
    var p0=toStage(e);var ctx=o.start(p0,e);if(ctx===false||ctx==null)return;ctx.moved=false;ctx.p=p0;
    try{el.setPointerCapture(e.pointerId);}catch(_){}
    function mv(ev){if(ev.pointerId!==e.pointerId)return;ev.preventDefault();var p=toStage(ev);ctx.p=p;if(Math.abs(p.x-p0.x)+Math.abs(p.y-p0.y)>10)ctx.moved=true;if(o.move)o.move(ctx,p);}
    function up(ev){if(ev.pointerId!==e.pointerId)return;el.removeEventListener('pointermove',mv);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);
      if(o.end)o.end(ctx,toStage(ev),!ctx.moved);}
    el.addEventListener('pointermove',mv);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
  });
}
function mkGhost(html,w,h){var g=document.createElement('div');g.className='ghost';g.innerHTML=html;g.style.width=w+'px';g.style.height=h+'px';g._w=w;g._h=h;dragl.appendChild(g);return g;}
function placeG(g,p){g.style.left=(p.x-g._w/2)+'px';g.style.top=(p.y-g._h/2-GY)+'px';}
function flyBack(g,to){var c=centerOf(to);var x=c.x-g._w/2,y=c.y-g._h/2;var an=g.animate([{left:g.style.left,top:g.style.top,opacity:1},{left:x+'px',top:y+'px',opacity:.3}],{duration:300,easing:'ease-in'});an.onfinish=function(){g.remove();};}
function shrink(g){var an=g.animate([{transform:'scale(1)',opacity:1},{transform:'scale(.1)',opacity:0}],{duration:280,easing:'ease-in'});an.onfinish=function(){g.remove();};}

/* ---------- SVG art ---------- */
function fl5(cx,cy,r,c,cc){var s='';for(var i=0;i<5;i++){var a=i*Math.PI*2/5-Math.PI/2;s+='<circle cx="'+(cx+Math.cos(a)*r).toFixed(1)+'" cy="'+(cy+Math.sin(a)*r).toFixed(1)+'" r="'+(r*.85).toFixed(1)+'" fill="'+c+'"/>';}return s+'<circle cx="'+cx+'" cy="'+cy+'" r="'+(r*.7).toFixed(1)+'" fill="'+(cc||'#ffd34d')+'"/>';}
var SV={};
SV.trowel='<svg viewBox="0 0 100 100"><g transform="rotate(-35 50 50)"><rect x="43" y="4" width="14" height="36" rx="7" fill="#d9813f"/><rect x="45" y="38" width="10" height="12" fill="#8d99a3"/><path d="M50 46 C28 50 26 76 50 98 C74 76 72 50 50 46Z" fill="#c3cdd4" stroke="#7b8790" stroke-width="3"/><path d="M50 54 V88" stroke="#fff" stroke-width="3" opacity=".6"/></g></svg>';
function seedSV(c,f,cc){return '<svg viewBox="0 0 100 100"><path d="M20 22 L80 22 L86 94 L14 94Z" fill="'+c+'" stroke="#0002" stroke-width="3"/><path d="M20 24 L24 10 L32 18 L40 8 L50 18 L60 8 L68 18 L76 10 L80 24Z" fill="'+c+'"/><circle cx="50" cy="58" r="23" fill="#fff"/>'+fl5(50,58,9,f,cc)+'</svg>';}
SV.seedR=seedSV('#ffd0dc','#ff4d6d');SV.seedY=seedSV('#fff1b8','#ffc107','#8d5524');SV.seedP=seedSV('#e7d6ff','#a66bff');
SV.can='<svg viewBox="0 0 100 100"><path d="M10 34 L38 56" stroke="#2f93d6" stroke-width="9" stroke-linecap="round"/><ellipse cx="9" cy="32" rx="9" ry="6" fill="#2f93d6" transform="rotate(-35 9 32)"/><rect x="34" y="40" width="50" height="48" rx="12" fill="#5cc0f5"/><path d="M84 50 C100 50 100 78 84 78" fill="none" stroke="#2f93d6" stroke-width="7"/><rect x="40" y="32" width="38" height="11" rx="5" fill="#2f93d6"/><circle cx="59" cy="64" r="9" fill="#fff" opacity=".65"/></svg>';
SV.fert='<svg viewBox="0 0 100 100"><path d="M18 18 L82 18 L88 94 L12 94Z" fill="#7be07b" stroke="#3a9d3a" stroke-width="3"/><rect x="18" y="12" width="64" height="12" rx="4" fill="#3a9d3a"/><path d="M50 82 C30 74 32 50 50 40 C68 50 70 74 50 82Z" fill="#2e8b3a"/><path d="M50 82 V46" stroke="#bff0bf" stroke-width="3"/>'+'<g fill="#ffd34d"><path d="M26 34 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z"/><path d="M74 56 l2.4 5.6 5.6 2.4 -5.6 2.4 -2.4 5.6 -2.4 -5.6 -5.6 -2.4 5.6 -2.4z"/></g></svg>';
SV.tulip='<svg viewBox="0 0 100 170"><path d="M50 170 Q46 120 50 62" stroke="#3aa845" stroke-width="7" fill="none"/><path d="M48 140 C20 132 14 104 18 92 C36 100 46 116 48 140Z" fill="#4cc45a"/><path d="M52 124 C80 116 86 92 82 80 C64 88 54 104 52 124Z" fill="#4cc45a"/><path d="M24 30 C24 70 76 70 76 30 L66 42 L58 16 L50 36 L42 16 L34 42Z" fill="#ff4d6d"/><path d="M42 20 L50 36 L58 20 C56 50 44 50 42 20Z" fill="#ff7a93"/></svg>';
SV.sunflower=(function(){var s='<svg viewBox="0 0 100 170"><path d="M50 170 Q54 120 50 70" stroke="#3aa845" stroke-width="8" fill="none"/><path d="M50 140 C22 134 16 110 20 100 C38 106 48 120 50 140Z" fill="#4cc45a"/><path d="M51 118 C80 112 84 92 80 82 C64 88 54 100 51 118Z" fill="#4cc45a"/>';for(var i=0;i<14;i++){s+='<ellipse cx="50" cy="16" rx="8" ry="20" fill="'+(i%2?'#ffc107':'#ffd54f')+'" transform="rotate('+(i*360/14)+' 50 44)"/>';}return s+'<circle cx="50" cy="44" r="17" fill="#8d5524"/><circle cx="45" cy="40" r="3" fill="#a96f3d"/><circle cx="55" cy="47" r="3" fill="#a96f3d"/><circle cx="50" cy="52" r="2.5" fill="#a96f3d"/></svg>';})();
SV.daisy=(function(){var s='<svg viewBox="0 0 100 170"><path d="M50 170 Q44 120 50 64" stroke="#3aa845" stroke-width="7" fill="none"/><path d="M48 138 C20 130 16 106 20 94 C38 100 46 116 48 138Z" fill="#4cc45a"/>';for(var i=0;i<10;i++){s+='<ellipse cx="50" cy="22" rx="9" ry="19" fill="'+(i%2?'#b388ff':'#c9a4ff')+'" transform="rotate('+(i*36)+' 50 44)"/>';}return s+'<circle cx="50" cy="44" r="12" fill="#ffd34d"/><circle cx="46" cy="40" r="4" fill="#fff3a8"/></svg>';})();
SV.bfly='<svg viewBox="0 0 44 36"><g class="w"><path d="M22 18 C10 0 0 6 4 16 C0 26 12 34 22 18Z" fill="#ff7eb6"/><path d="M22 18 C34 0 44 6 40 16 C44 26 32 34 22 18Z" fill="#ffb3d1"/></g><ellipse cx="22" cy="18" rx="2.5" ry="9" fill="#5d3a6b"/></svg>';
SV.home='<svg viewBox="0 0 60 60"><path d="M6 30 L30 8 L54 30" fill="none" stroke="#ff3d8b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 28 V52 H46 V28" fill="#ffb3d1" stroke="#ff3d8b" stroke-width="5" stroke-linejoin="round"/><rect x="25" y="36" width="10" height="16" rx="3" fill="#ff3d8b"/></svg>';
SV.reset='<svg viewBox="0 0 60 60"><path d="M48 30 A18 18 0 1 1 40 15" fill="none" stroke="#ff3d8b" stroke-width="7" stroke-linecap="round"/><path d="M34 4 L46 14 L32 22Z" fill="#ff3d8b"/></svg>';
SV.music='<svg viewBox="0 0 60 60"><path d="M22 44 V12 L48 6 V38" fill="none" stroke="#b05cf0" stroke-width="6" stroke-linejoin="round"/><ellipse cx="16" cy="45" rx="9" ry="7" fill="#b05cf0"/><ellipse cx="42" cy="39" rx="9" ry="7" fill="#b05cf0"/></svg>';
SV.voice='<svg viewBox="0 0 60 60"><path d="M8 22 H20 L34 10 V50 L20 38 H8Z" fill="#b05cf0"/><path d="M42 20 Q50 30 42 40 M47 13 Q60 30 47 47" fill="none" stroke="#b05cf0" stroke-width="5" stroke-linecap="round"/></svg>';
$('#bHome').innerHTML=SV.home;$('#bReset').innerHTML=SV.reset;$('#bMusic').innerHTML=SV.music;$('#bVoice').innerHTML=SV.voice;

/* ---------- characters ---------- */
var CHI={ghalia:{src:'img/ghalia.png',ratio:202/600,name:'غالية',face:'img/ghalia_face.png'},khala:{src:'img/khala.png',ratio:195/600,name:'خالتج',face:'img/khala_face.png'}};
var CH={ghalia:{acc:{}},khala:{acc:{}}};
var SLOTS={
  ghalia:{top:{x:50,y:8},bowR:{x:77,y:9},clipL:{x:24,y:11},eyes:{x:50,y:18.5},neck:{x:50,y:27},cape:{x:50,y:27},back:{x:50,y:29},hand:{x:92,y:66}},
  khala:{top:{x:51,y:12},bowR:{x:77,y:15},clipL:{x:25,y:16},eyes:{x:51,y:20},neck:{x:51,y:30},cape:{x:51,y:29},back:{x:51,y:31},hand:{x:91,y:63}}
};
var ACC={};
var R=null; /* current room state */
function charSize(who){var h=R.charH*(who==='khala'?1.42:1);return {h:h,w:h*CHI[who].ratio};}
function setPos(el,x,y){el.style.left=(x-el._w/2)+'px';el.style.top=(y-el._h)+'px';el._x=x;el._y=y;}
function putChar(who,x,y,anim){
  var el=R.chars[who],s=charSize(who);
  if(!el){el=document.createElement('div');el.className='char';el.dataset.who=who;el.innerHTML='<img src="'+CHI[who].src+'" alt="" draggable="false">';
    el.style.width=s.w+'px';el.style.height=s.h+'px';el._w=s.w;el._h=s.h;scene.appendChild(el);R.chars[who]=el;charDrag(el,who);renderAcc(who);if(window.LIFE)LIFE.onChar(el,who);}
  x=clamp(x,s.w/2+6,1146-s.w/2);y=clamp(y,Math.min(s.h+10,712),712);setPos(el,x,y);
  if(anim){hop(el);burst(x,y-s.h*.6,8);}
  return el;
}
function charAt(p,pad){pad=pad||25;for(var who in R.chars){var el=R.chars[who];if(p.x>el._x-el._w/2-pad&&p.x<el._x+el._w/2+pad&&p.y>el._y-el._h-pad&&p.y<el._y+pad)return who;}return null;}
function headOf(who){var el=R.chars[who];return {x:el._x,y:el._y-el._h*.9};}
var GIGGLE={ghalia:['هههه! 😄','أنا غالية! 💗','يا سلام! ✨'],khala:['هلا بغالية! 💗','أحبج يا غالية 💕','يلا نلعب! 😊']};
function charDrag(el,who){drag(el,{
  start:function(p){el._walkId=0;el.classList.add('lift');sfx.pick();return {dx:p.x-el._x,dy:p.y-el._y};},
  move:function(c,p){setPos(el,p.x-c.dx,p.y-c.dy);},
  end:function(c,p,tap){el.classList.remove('lift');
    if(tap){if(window.LIFE)LIFE.react(el,who);else{hop(el);sfx.boing();say(pick(GIGGLE[who]));}return;}
    var x=p.x-c.dx,y=p.y-c.dy;if(!(R.def.charDrop&&R.def.charDrop(who,x,y)))putChar(who,x,y);sfx.pop();}
});}
function accHTML(A){return (A.back?'<div class="bk">'+A.back+'</div>':'')+(A.front?'<div class="fr">'+A.front+'</div>':'');}
var OUTFITS={};
function renderAcc(who){var el=R&&R.chars[who];if(!el)return;var old=el.querySelectorAll('.acc,.outfit,.braid');for(var i=0;i<old.length;i++)old[i].remove();
  var of=CH[who].outfit;if(of&&OUTFITS[of]){var o=document.createElement('div');o.className='outfit';o.innerHTML=OUTFITS[of];el.appendChild(o);
    if(who==='ghalia'){var br=document.createElement('img');br.className='braid';br.src='img/ghalia_braid.png';br.alt='';el.appendChild(br);}}
  for(var slot in CH[who].acc){el.appendChild(accEl(who,CH[who].acc[slot]));}}
function accEl(who,id){var A=ACC[id],s=SLOTS[who][A.slot];var wP=A.w,hP=A.r*wP*CHI[who].ratio;
  var top=A.al==='bottom'?s.y-hP:A.al==='center'?s.y-hP/2:s.y;top+=(A.dy||0);
  var d=document.createElement('div');d.className='acc';d.style.left=(s.x-wP/2+(A.dx||0))+'%';d.style.top=top+'%';d.style.width=wP+'%';d.style.height=hP+'%';
  var hu=window.GAME&&GAME.hue&&GAME.hue[id];if(hu)d.style.filter='hue-rotate('+hu+'deg)';
  d.innerHTML=accHTML(A);accDrag(d,who,id);return d;}
function accDrag(d,who,id){drag(d,{
  start:function(p){var g=mkGhost(accHTML(ACC[id]),d.offsetWidth,d.offsetHeight);d.style.visibility='hidden';placeG(g,p);sfx.pick();return {g:g};},
  move:function(c,p){placeG(c.g,p);},
  end:function(c,p,tap){c.g.remove();
    if(tap){d.style.visibility='';var h=centerOf(d);burst(h.x,h.y,6);sfx.sparkle();return;}
    delete CH[who].acc[ACC[id].slot];var t=charAt(hp(p));
    if(t&&(!R.def.canWear||R.def.canWear(t,id)))wear(t,id);else{sfx.pop();burst(p.x,p.y-GY,6);renderAcc(who);}}
});}
function wear(who,id){CH[who].acc[ACC[id].slot]=id;renderAcc(who);var el=R.chars[who];
  var a=el.querySelectorAll('.acc .bk,.acc .fr');for(var i=0;i<a.length;i++){a[i].animate([{transform:'scale(.3)'},{transform:'scale(1.15)'},{transform:'scale(1)'}],{duration:380,easing:'ease-out'});}
  var s=SLOTS[who][ACC[id].slot];burst(el._x-el._w/2+el._w*s.x/100,el._y-el._h+el._h*s.y/100,12);sfx.sparkle();}

/* ---------- screens ---------- */
function show(scr){stage.dataset.screen=scr;fit();}
var ROOMS={},ORDER=[];
window.GAME={ROOMS:ROOMS,ORDER:ORDER,SV:SV,ACC:ACC,CH:CH,api:null};
var CATS=[];

function openRoom(id){iris(function(){openRoomNow(id);});}
var irisEl=null,irisBusy=false;
function iris(fn){if(window.V2&&V2.wipe&&!irisBusy){irisBusy=true;sfx.whoosh();V2.wipe(function(){try{fn();}finally{irisBusy=false;}},'',{silent:true});return;}
  if(!irisEl){irisEl=document.createElement('div');irisEl.id='iris';stage.appendChild(irisEl);}
  if(irisBusy||!irisEl.animate){fn();return;}irisBusy=true;sfx.whoosh();
  var a=irisEl.animate([{width:'1600px',height:'1600px'},{width:'0px',height:'0px'}],{duration:320,easing:'ease-in',fill:'forwards'});
  a.onfinish=function(){try{fn();}catch(e){irisBusy=false;throw e;}var b=irisEl.animate([{width:'0px',height:'0px'},{width:'1600px',height:'1600px'}],{duration:380,easing:'ease-out',fill:'forwards'});b.onfinish=function(){irisBusy=false;};};}
function openRoomNow(id){if(id!=='sch1'&&CH.ghalia.outfit==='pj')CH.ghalia.outfit=null;
  if(R){R.dead=true;}
  if(R&&R.timers)R.timers.forEach(function(t){clearTimeout(t);clearInterval(t);});
  var def=ROOMS[id];show('room');scene.innerHTML=def.bg;toolbar.innerHTML='';fx.innerHTML='';dragl.innerHTML='';
  R={id:id,def:def,chars:{},charH:def.charH||300,timers:[]};toolbar.classList.toggle('many',def.tools.length>6);stage.dataset.room=id;stage.classList.toggle('nocar',!!def.noCarousel);stage.classList.toggle('notools',!def.tools.length);
  def.tools.forEach(function(tid){var t=TOOLS[tid];var b=document.createElement('div');b.className='tool';b.dataset.id=tid;b.innerHTML=t.svg+'<span>'+t.name+'</span>';toolbar.appendChild(b);toolDrag(b,tid);});
  if(def.init)def.init(R);
  for(var who in (def.spawn||{})){if(def.spawn[who][2])putChar(who,def.spawn[who][0],def.spawn[who][1]);}
  if(def.intro)say(def.intro);
  if(window.LIFE)LIFE.onRoom(R);
}
function later(fn,ms){var t=setTimeout(fn,ms);R.timers.push(t);return t;}
function hintTool(id){var b=toolbar.querySelectorAll('.tool');for(var i=0;i<b.length;i++)b[i].classList.toggle('hint',b[i].dataset.id===id);}
var TOOLS={};
function toolDrag(btn,id){drag(btn,{
  start:function(p){var t=TOOLS[id];var g=mkGhost(t.ghost||t.svg,t.gw||110,t.gh||110);placeG(g,p);sfx.pick();var c={g:g,id:id,hp:hp(p)};
    if(R.def.tick){c.iv=setInterval(function(){R.def.tick(id,c);},100);}return c;},
  move:function(c,p){placeG(c.g,p);c.hp=hp(p);if(R.def.hover)R.def.hover(id,c.hp,c);},
  end:function(c,p,tap){if(c.iv)clearInterval(c.iv);c.g.classList.remove('pour');
    if(tap){c.g.remove();wiggle(btn);sfx.boing();if(TOOLS[id].tip)say(TOOLS[id].tip);return;}
    var res=R.def.drop(id,hp(p),c);if(res===true)shrink(c.g);else{if(res===false)sfx.oops();flyBack(c.g,btn);}}
});}

/* carousel */
['ghalia','khala'].forEach(function(who){var c=document.createElement('div');c.className='cc';c.innerHTML='<img src="'+CHI[who].face+'" alt=""><b>'+CHI[who].name+'</b>';carousel.appendChild(c);
  drag(c,{start:function(p){var s=charSize(who);var g=mkGhost('<img src="'+CHI[who].src+'" alt="">',s.w,s.h);placeG(g,p);sfx.pick();return {g:g,s:s};},
    move:function(c2,p){placeG(c2.g,p);},
    end:function(c2,p,tap){c2.g.remove();var x,y;
      if(tap){var sp=(R.def.spawn&&R.def.spawn[who])||[640,700];x=sp[0];y=sp[1];}else{var q=hp(p);x=q.x;y=q.y+c2.s.h/2;}
      if(!(R.def.charDrop&&R.def.charDrop(who,x,y)))putChar(who,x,y,true);else{var el=R.chars[who];hop(el);}
      sfx.pop();}});});

/* buttons */
function tapBtn(el,fn){el.addEventListener('click',function(e){e.preventDefault();audio();sfx.pick();fn();});}
tapBtn($('#bHome'),function(){goMenu();});
tapBtn($('#bReset'),function(){if(R.def.onReset)R.def.onReset();openRoom(R.id);sfx.sparkle();});
tapBtn($('#bMusic'),function(){musicOn=!musicOn;$('#bMusic').classList.toggle('off',!musicOn);if(musicOn)startMusic();else stopMusic();});
tapBtn($('#bVoice'),function(){voiceOn=!voiceOn;$('#bVoice').classList.toggle('off',!voiceOn);if(!voiceOn){try{speechSynthesis.cancel();}catch(e){}}else say(lastSay);});
function goMenu(){iris(goMenuNow);}
function goMenuNow(){if(R)R.dead=true;if(R&&R.timers)R.timers.forEach(function(t){clearTimeout(t);clearInterval(t);});fx.innerHTML='';show('menu');say('وين تبين نروح اليوم يا غالية؟ 🏠');}
tapBtn($('#play'),function(){if(stage.requestFullscreen&&matchMedia('(pointer:coarse)').matches){try{document.documentElement.requestFullscreen().catch(function(){});}catch(e){}}goMenu();});
(function(){var h=$('.hearts');for(var i=0;i<18;i++){var e=document.createElement('i');e.textContent=pick(['♥','✦','♥','★']);e.style.left=rnd(0,1280)+'px';e.style.fontSize=rnd(20,50)+'px';e.style.animationDuration=rnd(7,14)+'s';e.style.animationDelay=(-rnd(0,14))+'s';h.appendChild(e);}})();


function buildMenu(){var cards=$('#cards');cards.innerHTML='';ORDER.forEach(function(id){var d=ROOMS[id];var c=document.createElement('div');c.className='card';
  c.innerHTML='<div class="ic" style="background:'+d.color+'">'+d.icon+'</div><b>'+d.name+'</b>';cards.appendChild(c);
  tapBtn(c,function(){openRoom(id);});});}

/* ---------- shared API for rooms ---------- */
GAME.api={say:say,sfx:sfx,burst:burst,confetti:confetti,hop:hop,wiggle:wiggle,drag:drag,mkGhost:mkGhost,placeG:placeG,flyBack:flyBack,shrink:shrink,
  putChar:putChar,charAt:charAt,headOf:headOf,wear:wear,renderAcc:renderAcc,later:later,hintTool:hintTool,TOOLS:TOOLS,SV:SV,ACC:ACC,CH:CH,SLOTS:SLOTS,
  getR:function(){return R;},iris:iris,charSize:function(w){return charSize(w);},getScale:function(){return scale;},scene:function(){return scene;},hp:hp,centerOf:centerOf,rnd:rnd,pick:pick,clamp:clamp,fl5:fl5,buildMenu:buildMenu,openRoom:openRoom,
  fx:fx,STAR:STAR,OUTFITS:OUTFITS,CHI:CHI,show:show,tapBtn:tapBtn,setPos:setPos,toStage:toStage,goMenu:function(){goMenu();}};

/* ================= GARDEN ================= */
TOOLS.trowel={name:'المجرفة',svg:SV.trowel,tip:'اسحبي المجرفة على التراب واحفري ⛏️'};
TOOLS.seedR={name:'توليب',svg:SV.seedR,tip:'بذور ورد التوليب الأحمر 🌷'};
TOOLS.seedY={name:'دوار الشمس',svg:SV.seedY,tip:'بذور دوار الشمس 🌻'};
TOOLS.seedP={name:'أقحوان',svg:SV.seedP,tip:'بذور الأقحوان البنفسجي 💜'};
TOOLS.can={name:'الرشاشة',svg:SV.can,tip:'امسكي الرشاشة فوق الحوض شوي 💧'};
TOOLS.fert={name:'السماد',svg:SV.fert,tip:'السماد يخلي الوردة تكبر بسرعة ✨'};
var FLOWERS={seedR:'tulip',seedY:'sunflower',seedP:'daisy'};
var GBG='<svg class="bg" viewBox="0 0 1280 720"><defs><linearGradient id="gsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd8ff"/><stop offset="1" stop-color="#e3f7ff"/></linearGradient><linearGradient id="ggr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ee07a"/><stop offset="1" stop-color="#56b856"/></linearGradient><pattern id="gpk" width="44" height="96" patternUnits="userSpaceOnUse"><path d="M10 96 V20 L21 6 L32 20 V96Z" fill="#fff" stroke="#f0d9e8" stroke-width="2"/></pattern></defs>'+
'<rect width="1280" height="720" fill="url(#gsky)"/><circle cx="940" cy="105" r="62" fill="#fff3a0" opacity=".6"/><circle cx="940" cy="105" r="48" fill="#ffe14d"/>'+
'<g fill="#fff" class="cloud"><circle cx="200" cy="95" r="30"/><circle cx="238" cy="80" r="40"/><circle cx="280" cy="98" r="28"/><rect x="200" y="95" width="80" height="30" rx="14"/></g>'+
'<g fill="#fff" class="cloud" style="animation-delay:-14s;animation-duration:40s"><circle cx="560" cy="150" r="24"/><circle cx="590" cy="135" r="32"/><circle cx="622" cy="152" r="22"/><rect x="560" y="150" width="62" height="24" rx="12"/></g>'+
'<path d="M0 360 Q200 270 430 345 T870 330 T1280 320 V720 H0Z" fill="#b8eea2"/>'+
'<rect x="0" y="318" width="1280" height="96" fill="url(#gpk)"/><rect x="0" y="342" width="1280" height="11" rx="5" fill="#fff"/><rect x="0" y="384" width="1280" height="11" rx="5" fill="#fff"/>'+
'<rect y="408" width="1280" height="312" fill="url(#ggr)"/>'+
'<rect x="58" y="210" width="34" height="210" rx="10" fill="#b07040"/><circle cx="75" cy="190" r="80" fill="#5ec95a"/><circle cx="30" cy="230" r="50" fill="#4fb84f"/><circle cx="125" cy="225" r="55" fill="#6bd466"/><circle cx="60" cy="170" r="10" fill="#ff6b8a"/><circle cx="110" cy="200" r="10" fill="#ff6b8a"/><circle cx="40" cy="240" r="10" fill="#ff6b8a"/>'+
'<g fill="#4fb84f"><circle cx="300" cy="412" r="34"/><circle cx="340" cy="404" r="40"/><circle cx="380" cy="414" r="30"/><circle cx="760" cy="410" r="34"/><circle cx="800" cy="402" r="40"/><circle cx="840" cy="412" r="30"/></g>'+
'<g fill="#ffd34d"><circle cx="330" cy="392" r="6"/><circle cx="360" cy="410" r="6"/><circle cx="790" cy="388" r="6"/><circle cx="825" cy="404" r="6"/></g>'+
'<path d="M640 720 Q600 600 660 470" stroke="#f3e2c4" stroke-width="0" fill="none"/>'+
'<g stroke="#3f9e3f" stroke-width="4" stroke-linecap="round" fill="none"><path d="M200 680 l-6 -18 M206 680 l0 -20 M212 680 l6 -18"/><path d="M700 690 l-6 -18 M706 690 l0 -20 M712 690 l6 -18"/><path d="M1000 670 l-6 -18 M1006 670 l0 -20 M1012 670 l6 -18"/><path d="M460 650 l-6 -18 M466 650 l0 -20 M472 650 l6 -18"/></g>'+
'</svg>';
function bedSVG(b){var s='<svg viewBox="0 0 190 90"><ellipse cx="95" cy="56" rx="92" ry="32" fill="#7a4a22"/><ellipse cx="95" cy="48" rx="86" ry="27" fill="'+(b.s>=3?'#7b4d27':'#a66e3c')+'"/>'+
  '<circle cx="40" cy="44" r="3" fill="#c48a55"/><circle cx="150" cy="52" r="3" fill="#c48a55"/><circle cx="120" cy="36" r="2.5" fill="#c48a55"/>';
  if(b.s>=1)s+='<ellipse cx="95" cy="48" rx="36" ry="13" fill="#4a2c12"/><path d="M128 40 q10 -16 22 0z" fill="#a66e3c"/>';
  if(b.s===2)s+='<ellipse cx="86" cy="47" rx="5" ry="3.5" fill="#f3d9a4"/><ellipse cx="99" cy="50" rx="5" ry="3.5" fill="#f3d9a4"/><ellipse cx="106" cy="45" rx="5" ry="3.5" fill="#f3d9a4"/>';
  if(b.s===3)s+='<ellipse cx="95" cy="48" rx="36" ry="13" fill="#3a2009"/><path d="M95 48 q-2 -16 0 -22 M95 32 q-12 -6 -14 2 q8 4 14 -2 M95 30 q12 -8 15 0 q-8 5 -15 0" stroke="#4cc45a" stroke-width="3" fill="#4cc45a"/><ellipse cx="70" cy="52" rx="10" ry="3" fill="#8fd3ff" opacity=".7"/>';
  if(b.s===4)s+='<ellipse cx="95" cy="48" rx="34" ry="11" fill="#5a3515"/>';
  return s+'</svg>';}
function drawBed(b){b.el.querySelector('.soil').innerHTML=bedSVG(b);}
function bedAt(p){var Rr=R;for(var i=0;i<Rr.beds.length;i++){var b=Rr.beds[i];if(Math.abs(p.x-b.x)<105&&p.y>b.y-120&&p.y<b.y+80)return b;}return null;}
function grow(b){b.s=4;drawBed(b);var f=document.createElement('div');f.className='fl';f.innerHTML=SV[b.type];b.el.appendChild(f);
  var an=f.animate([{transform:'scale(0.05)'},{transform:'scale(1.18)',offset:.7},{transform:'scale(1)'}],{duration:900,easing:'ease-out'});an.onfinish=function(){f.classList.add('sway');};
  sfx.sparkle();later(function(){sfx.pop();},300);burst(b.x,b.y-90,22);
  var bf=document.createElement('div');bf.className='bfly prop';bf.innerHTML=SV.bfly;bf.style.left=(b.x+30)+'px';bf.style.top=(b.y-190)+'px';bf.style.animationDelay=(-rnd(0,5))+'s';scene.appendChild(bf);
  var g=R.chars.ghalia;if(g)hop(g);
  var done=R.beds.every(function(x){return x.s===4;});
  if(done){later(function(){confetti();sfx.tada();for(var w in R.chars)hop(R.chars[w],3);say('ماشاءالله! حديقتنا صارت كلها ورد 🌸 شاطرة يا غالية!');},900);hintTool(null);}
  else{say(pick(['واو! وردة حلوة مثلج يا غالية 🌷','الله! شوفي شلون كبرت ✨','تجنن! يلا نزرع حوض ثاني 🌼']));hintTool('trowel');}}
ROOMS.garden={name:'الحديقة',color:'#c8f2b8',charH:300,
  icon:'<svg viewBox="0 0 100 100"><rect x="0" y="70" width="100" height="30" rx="8" fill="#6bd466"/>'+SV.tulip.replace('<svg viewBox="0 0 100 170">','<g transform="translate(8 8) scale(.42)">').replace('</svg>','</g>')+SV.sunflower.replace('<svg viewBox="0 0 100 170">','<g transform="translate(50 4) scale(.45)">').replace('</svg>','</g>')+'<ellipse cx="50" cy="84" rx="40" ry="10" fill="#a66e3c"/></svg>',
  bg:GBG,tools:['trowel','seedR','seedY','seedP','can','fert'],
  spawn:{ghalia:[185,600,1],khala:[1075,690]},
  intro:'يلا يا غالية! اسحبي المجرفة على التراب واحفري حفرة 🌱',
  init:function(Rr){Rr.beds=[];[390,590,790,990].forEach(function(x,i){var y=560+(i%2?18:0);var el=document.createElement('div');el.className='bed';el.style.left=(x-95)+'px';el.style.top=(y-48)+'px';el.innerHTML='<div class="soil"></div>';scene.appendChild(el);var b={x:x,y:y,s:0,el:el,w:0};drawBed(b);Rr.beds.push(b);});hintTool('trowel');},
  drop:function(id,p){var b=bedAt(p);if(!b)return false;
    if(id==='trowel'){if(b.s===0){b.s=1;drawBed(b);sfx.dig();burst(b.x,b.y-10,10,['#a66e3c','#7a4a22','#c48a55']);wiggle(b.el);say('حلو! الحين حطي البذور بالحفرة 🌰');hintTool('seedR');return 'back';}
      say(b.s===4?'هذا الحوض فيه وردة، جربي حوض ثاني 😊':'الحفرة جاهزة! حطي البذور 🌰');return false;}
    if(FLOWERS[id]){if(b.s===1){b.s=2;b.type=FLOWERS[id];drawBed(b);sfx.pop();burst(b.x,b.y-10,8);say('امسكي الرشاشة فوق البذور شوي عشان تشرب مي 💧');hintTool('can');return true;}
      say(b.s===0?'احفري حفرة أول بالمجرفة ⛏️':b.s===4?'هذا الحوض فيه وردة 🌷':'حطينا بذور هني! 😊');return false;}
    if(id==='fert'){if(b.s===3){grow(b);return true;}say(b.s===2?'اسقيها مي أول 💧':b.s===4?'الوردة كبرت خلاص 🌸':'نزرع البذور أول 🌰');return false;}
    if(id==='can'){if(b.s<2)say('ما فيه بذور هني بعد 🌰');return 'back';}
    return false;},
  tick:function(id,c){if(id!=='can')return;var b=bedAt(c.hp);c.g.classList.toggle('pour',!!b);if(!b)return;
    c.n=(c.n||0)+1;if(c.n%2===0)sfx.water();
    for(var k=0;k<2;k++){var d=document.createElement('div');d.className='drop';var x=c.hp.x-48+rnd(-10,10),y=c.hp.y-10;d.style.left=x+'px';d.style.top=y+'px';fx.appendChild(d);
      (function(d){var an=d.animate([{transform:'translate(0,0)',opacity:1},{transform:'translate('+rnd(-14,4)+'px,'+(b.y-y-4)+'px)',opacity:.4}],{duration:420,easing:'ease-in'});an.onfinish=function(){d.remove();};})(d);}
    if(b.s===2){b.w++;if(b.w>=12){b.s=3;drawBed(b);sfx.sparkle();burst(b.x,b.y-20,10,['#8fd3ff','#ffffff','#4fb3ff']);say('شربت مي! 💧 الحين حطي السماد وشوفي شصار ✨');hintTool('fert');}}}
};
ORDER.push('garden');
})();
