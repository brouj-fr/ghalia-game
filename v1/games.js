/* UI helpers + mini-games */
(function(){
'use strict';
var A=GAME.api,ROOMS=GAME.ROOMS,sfx=A.sfx,say=A.say,burst=A.burst;
function R(){return A.getR();}
function scene(){return A.scene();}
function div(cls,html,css,parent){var d=document.createElement('div');d.className=cls;if(html)d.innerHTML=html;if(css)d.style.cssText=css;(parent||scene()).appendChild(d);return d;}
function onTap(el,fn){el.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();fn(e);});}
function loop(fn){var r=R(),last=performance.now();function f(t){if(r.dead||r.paused&&r.paused())return requestAnimationFrame(f);var dt=Math.min(50,t-last)/1000;last=t;if(fn(dt,t)!==false)requestAnimationFrame(f);}requestAnimationFrame(f);}
function best(key,val,lower){var k='ghalia_best_'+key,b=null;try{b=localStorage.getItem(k);}catch(e){}b=b==null?null:+b;
  if(val!=null&&(b==null||(lower?val<b:val>b))){try{localStorage.setItem(k,String(val));}catch(e){}return {best:val,isNew:true};}return {best:b,isNew:false};}
var COINS=0;try{COINS=+(localStorage.getItem('ghalia_coins')||0);}catch(e){}
function addCoins(n,x,y){COINS+=n;try{localStorage.setItem('ghalia_coins',String(COINS));}catch(e){}var c=document.getElementById('coins');if(c){c.querySelector('b').textContent=COINS;c.animate([{transform:'scale(1)'},{transform:'scale(1.3)'},{transform:'scale(1)'}],{duration:400});}
  if(x!=null&&window.LIFE)LIFE.floatText(x,y,'+'+n+' 🪙');sfx.star();}
function starsHTML(n){var s='';for(var i=0;i<3;i++)s+='<i class="'+(i<n?'on':'')+'">★</i>';return s;}
function hud(){var h=div('hud','<span class="hs">⭐ <b>0</b></span><span class="ht">⏱ <b>30</b></span><span class="hb">🏆 <b>-</b></span>');return {el:h,set:function(s,t,b){if(s!=null)h.querySelector('.hs b').textContent=s;if(t!=null)h.querySelector('.ht b').textContent=t;if(b!=null)h.querySelector('.hb b').textContent=b;},hideTime:function(){h.querySelector('.ht').style.display='none';}};}
function overlay(html,buttons){var o=div('ovl','<div class="ovbox">'+html+'<div class="ovbtns"></div></div>');var bx=o.querySelector('.ovbtns');
  buttons.forEach(function(b){var e=document.createElement('button');e.className='gbtn'+(b.cls?' '+b.cls:'');e.innerHTML=b.t;bx.appendChild(e);A.tapBtn(e,function(){o.remove();b.fn();});});
  o.querySelector('.ovbox').animate([{transform:'scale(.5)',opacity:0},{transform:'scale(1.08)',opacity:1},{transform:'scale(1)'}],{duration:420,easing:'ease-out'});return o;}
function countdown(done){var n=3;var d=div('cdown','3');sfx.pick();var iv=setInterval(function(){n--;if(n<=0){clearInterval(iv);d.textContent='يلا!';sfx.star();setTimeout(function(){d.remove();done();},450);}else{d.textContent=String(n);sfx.pick();}
  d.animate([{transform:'translate(-50%,-50%) scale(1.6)',opacity:0},{transform:'translate(-50%,-50%) scale(1)',opacity:1}],{duration:300});},700);R().timers.push(iv);}
function endScreen(key,score,stars,opts){opts=opts||{};var b=best(key,score,opts.lower);sfx.win();A.confetti();
  addCoins(stars*5);
  overlay('<h3>'+(opts.title||'خلصنا! 🎉')+'</h3><div class="stars">'+starsHTML(stars)+'</div><p class="sc">'+(opts.label||'النقاط')+': <b>'+score+'</b></p><p class="bs">'+(b.isNew?'🏆 أحسن نتيجة جديدة!':'🏆 أحسن نتيجة: '+(b.best==null?'-':b.best))+'</p><p class="cn">🪙 +'+(stars*5)+'</p>',
    [{t:'مرة ثانية 🔁',fn:function(){A.openRoom(R().id);}},{t:'القائمة 🏠',cls:'alt',fn:function(){A.goMenu();}}].concat(opts.next?[{t:'التالي ▶',cls:'nx',fn:opts.next}]:[]));}
function startScreen(title,desc,fn,extra){overlay('<h3>'+title+'</h3><p>'+desc+'</p>'+(extra||''),[{t:'ابدئي ▶',fn:fn}]);}
A.ui={div:div,onTap:onTap,loop:loop,best:best,hud:hud,overlay:overlay,countdown:countdown,endScreen:endScreen,startScreen:startScreen,starsHTML:starsHTML,addCoins:addCoins,coins:function(){return COINS;}};

/* coins pill (global) */
(function(){var c=document.createElement('div');c.id='coins';c.innerHTML='🪙 <b>'+COINS+'</b>';document.getElementById('topbar').appendChild(c);})();

var GBG=function(c1,c2){return '<svg class="bg" viewBox="0 0 1280 720"><defs><radialGradient id="gg'+c1.slice(1)+'" cx=".5" cy=".3" r=".9"><stop offset="0" stop-color="'+c1+'"/><stop offset="1" stop-color="'+c2+'"/></radialGradient></defs><rect width="1280" height="720" fill="url(#gg'+c1.slice(1)+')"/>'+
  (function(){var s='';for(var i=0;i<26;i++){s+='<circle cx="'+((i*197)%1280)+'" cy="'+((i*131)%720)+'" r="'+(3+i%4)+'" fill="#fff" opacity=".35"/>';}return s;})()+'</svg>';};
var BASE={tools:[],noCarousel:true,noWalk:true,noWander:true,charH:240};
function def(o){var d={};for(var k in BASE)d[k]=BASE[k];for(var k2 in o)d[k2]=o[k2];return d;}

/* ---------- MEMORY ---------- */
var ICONS={g:'<img src="img/ghalia_face.png" alt="">',k:'<img src="img/khala_face.png" alt="">',
 pencil:'<svg viewBox="0 0 100 100"><g transform="rotate(-40 50 50)"><rect x="40" y="10" width="20" height="62" fill="#ffd34d"/><rect x="40" y="10" width="20" height="10" fill="#ff7eb6"/><path d="M40 72 L50 94 L60 72Z" fill="#f3d2b0"/><path d="M46 86 L50 94 L54 86Z" fill="#333"/></g></svg>',
 book:A.SV.book,apple:'<svg viewBox="0 0 100 100"><path d="M50 30 C20 14 6 50 22 76 C32 92 44 88 50 84 C56 88 68 92 78 76 C94 50 80 14 50 30Z" fill="#ff3b5c"/><path d="M50 30 Q52 14 62 8" stroke="#8d5524" stroke-width="5" fill="none"/><path d="M54 20 Q70 10 76 22 Q62 28 54 20Z" fill="#4cc45a"/></svg>',
 star:'<svg viewBox="0 0 100 100"><path d="M50 6 L61 37 L94 38 L68 58 L77 90 L50 71 L23 90 L32 58 L6 38 L39 37Z" fill="#ffd34d" stroke="#f0a800" stroke-width="4"/></svg>',
 heart:'<svg viewBox="0 0 100 100"><path d="M50 88 C14 64 8 38 22 26 C34 16 46 24 50 34 C54 24 66 16 78 26 C92 38 86 64 50 88Z" fill="#ff5fa2"/></svg>',
 flower:'<svg viewBox="0 0 100 100">'+A.fl5(50,50,20,'#c9a4ff','#ffd34d')+'</svg>'};
var MKEYS=['g','k','pencil','book','apple','star','heart','flower'];
ROOMS.memory=def({name:'الذاكرة',color:'linear-gradient(135deg,#ffe3f1,#c77dff)',bg:GBG('#f3e9ff','#c9a4ff'),
 icon:'<svg viewBox="0 0 100 100"><rect x="10" y="16" width="36" height="48" rx="8" fill="#ff7eb6" transform="rotate(-10 28 40)"/><rect x="54" y="20" width="36" height="48" rx="8" fill="#fff" stroke="#c77dff" stroke-width="4" transform="rotate(8 72 44)"/><path d="M72 36 C64 30 60 40 72 50 C84 40 80 30 72 36Z" fill="#ff5fa2"/><text x="28" y="48" font-size="26" text-anchor="middle" fill="#fff" font-weight="900">?</text></svg>',
 intro:'لعبة الذاكرة! لاقي الصور المتشابهة 🃏',
 init:function(r){var ui=A.ui;
  ui.overlay('<h3>لعبة الذاكرة 🃏</h3><p>اختاري الحجم</p>',[{t:'سهل (3)',fn:function(){go(3);}},{t:'وسط (6)',fn:function(){go(6);}},{t:'صعب (8)',fn:function(){go(8);}}]);
  function go(n){var cols=n===3?3:n===6?4:4,rows=n*2/cols;var cw=Math.min(170,(1000-(cols-1)*18)/cols),ch=Math.min(cw*1.25,(520-(rows-1)*18)/rows);cw=ch/1.25;
   var keys=MKEYS.slice(0,n);var deck=keys.concat(keys).sort(function(){return Math.random()-.5;});var h=ui.hud();h.hideTime();h.set(0,null,(ui.best('mem'+n).best)||'-');
   var gw=cols*cw+(cols-1)*18,gh=rows*ch+(rows-1)*18,x0=(1150-gw)/2+10,y0=110+(530-gh)/2;var open=[],moves=0,found=0,lock=false;
   deck.forEach(function(k,i){var c=div('mcard','<div class="mi"><div class="mf front">'+ICONS[k]+'</div><div class="mf back">?</div></div>','left:'+(x0+(i%cols)*(cw+18))+'px;top:'+(y0+Math.floor(i/cols)*(ch+18))+'px;width:'+cw+'px;height:'+ch+'px');c._k=k;
     c.animate([{transform:'scale(0)'},{transform:'scale(1)'}],{duration:300,delay:i*40,fill:'backwards'});
     onTap(c,function(){if(lock||c.classList.contains('up')||c.classList.contains('done'))return;c.classList.add('up');sfx.pick();open.push(c);
       if(open.length===2){moves++;h.set(moves);lock=true;var a=open[0],b=open[1];
         if(a._k===b._k){setTimeout(function(){a.classList.add('done');b.classList.add('done');sfx.sparkle();var p=A.centerOf(b);burst(p.x,p.y,14);found++;open=[];lock=false;
           if(found===n){var st=moves<=n*1.5?3:moves<=n*2.2?2:1;setTimeout(function(){ui.endScreen('mem'+n,moves,st,{lower:true,label:'المحاولات'});},600);}},350);}
         else{setTimeout(function(){a.classList.remove('up');b.classList.remove('up');sfx.oops();open=[];lock=false;},850);}}});});
   say('اقلبي بطاقتين ولاقي الأزواج 🃏');}}
});

/* ---------- CATCH ---------- */
var BASKET='<svg viewBox="0 0 160 100"><path d="M10 30 H150 L134 96 H26Z" fill="#d99a66"/><g stroke="#b87a46" stroke-width="5"><path d="M20 50 H140 M24 70 H136"/><path d="M50 30 L56 96 M80 30 V96 M110 30 L104 96"/></g><rect x="4" y="22" width="152" height="14" rx="7" fill="#ff7eb6"/></svg>';
ROOMS.catch=def({name:'التقطي النجوم',color:'linear-gradient(135deg,#fff3c4,#ff9a3c)',bg:GBG('#bfe8ff','#6a8cff'),
 icon:'<svg viewBox="0 0 100 100"><path d="M10 60 H90 L80 92 H20Z" fill="#d99a66"/><path d="M50 6 L57 26 L78 27 L61 39 L67 60 L50 47 L33 60 L39 39 L22 27 L43 26Z" fill="#ffd34d"/></svg>',
 intro:'التقطي النجوم والقلوب بالسلة! 🧺',
 init:function(r){var ui=A.ui;ui.startScreen('التقطي النجوم 🧺','حركي السلة بإصبعج (أو ميلي الجهاز) والتقطي النجوم والقلوب. عندج 30 ثانية!',function(){
   if(window.DeviceOrientationEvent&&typeof DeviceOrientationEvent.requestPermission==='function'){try{DeviceOrientationEvent.requestPermission().catch(function(){});}catch(e){}}
   ui.countdown(play);});
  function play(){var h=ui.hud();var bst=ui.best('catch').best;h.set(0,30,bst==null?'-':bst);var bk=div('basket',BASKET,'left:560px;top:600px;width:160px;height:100px');var bx=640,tx=640,score=0,T=30,items=[],spawnT=0;
   var sc=scene();function mv(e){tx=A.toStage(e).x;}sc.addEventListener('pointermove',mv);sc.addEventListener('pointerdown',mv);
   var tilt=null;function ori(e){if(e.gamma!=null)tilt=e.gamma;}window.addEventListener('deviceorientation',ori);
   ui.loop(function(dt){T-=dt;h.set(null,Math.max(0,Math.ceil(T)));if(tilt!=null&&Math.abs(tilt)>3)tx=A.clamp(bx+tilt*14*dt*10,90,1060);
     bx+= (tx-bx)*Math.min(1,dt*12);bx=A.clamp(bx,90,1060);bk.style.left=(bx-80)+'px';
     spawnT-=dt;if(spawnT<=0){spawnT=A.rnd(.35,.7);var k=Math.random();var t=k<.12?'gold':k<.45?'heart':'star';var e=div('fall '+t,t==='heart'?ICONS.heart:ICONS.star,'left:0;top:0');var it={el:e,x:A.rnd(80,1080),y:-60,v:A.rnd(170,280)+(30-T)*5,t:t};items.push(it);}
     for(var i=items.length-1;i>=0;i--){var it=items[i];it.y+=it.v*dt;it.el.style.transform='translate('+(it.x-30)+'px,'+(it.y-30)+'px)';
       if(it.y>590&&it.y<650&&Math.abs(it.x-bx)<85){var pts=it.t==='gold'?5:it.t==='heart'?2:1;score+=pts;h.set(score);sfx.star();burst(it.x,600,8);if(window.LIFE)LIFE.floatText(it.x,560,'+'+pts);it.el.remove();items.splice(i,1);bk.animate([{transform:'scale(1)'},{transform:'scale(1.12,.9)'},{transform:'scale(1)'}],{duration:200});continue;}
       if(it.y>760){it.el.remove();items.splice(i,1);}}
     if(T<=0){sc.removeEventListener('pointermove',mv);sc.removeEventListener('pointerdown',mv);window.removeEventListener('deviceorientation',ori);items.forEach(function(i){i.el.remove();});
       ui.endScreen('catch',score,score>=45?3:score>=28?2:1);return false;}});}}
});

/* ---------- BALLOONS ---------- */
var BCOL=['#ff5fa2','#ffd34d','#7ed6ff','#b388ff','#7be07b','#ff9a3c'];
function balloon(c){return '<svg viewBox="0 0 80 130"><path d="M40 92 Q36 110 44 128" stroke="#999" stroke-width="2" fill="none"/><ellipse cx="40" cy="44" rx="34" ry="42" fill="'+c+'"/><path d="M34 86 L46 86 L40 94Z" fill="'+c+'"/><ellipse cx="28" cy="28" rx="7" ry="12" fill="#fff" opacity=".55"/></svg>';}
ROOMS.balloons=def({name:'فقعي البالونات',color:'linear-gradient(135deg,#d6f1ff,#ff7eb6)',bg:GBG('#e4f6ff','#8fd8ff'),
 icon:'<svg viewBox="0 0 100 100"><g transform="translate(6 4) scale(.55)">'+balloon('#ff5fa2').replace(/<\/?svg[^>]*>/g,'')+'</g><g transform="translate(46 14) scale(.55)">'+balloon('#7ed6ff').replace(/<\/?svg[^>]*>/g,'')+'</g></svg>',
 intro:'فقعي البالونات بسرعة! 🎈',
 init:function(r){var ui=A.ui;ui.startScreen('فقعي البالونات 🎈','اضغطي على البالونات قبل لا تطير! البالونة الملونة بقوس قزح فيها 5 نقاط. 30 ثانية!',function(){ui.countdown(play);});
  function play(){var h=ui.hud();var bst=ui.best('balloons').best;h.set(0,30,bst==null?'-':bst);var score=0,T=30,items=[],sp=0;
   ui.loop(function(dt){T-=dt;h.set(null,Math.max(0,Math.ceil(T)));sp-=dt;if(sp<=0){sp=A.rnd(.3,.6);var rb=Math.random()<.08;var e=div('bal'+(rb?' rb':''),balloon(rb?'url(#rbw)':A.pick(BCOL)),'left:0;top:0');if(rb)e.querySelector('svg').insertAdjacentHTML('afterbegin','<defs><linearGradient id="rbw"><stop offset="0" stop-color="#ff5fa2"/><stop offset=".33" stop-color="#ffd34d"/><stop offset=".66" stop-color="#7be07b"/><stop offset="1" stop-color="#7ed6ff"/></linearGradient></defs>');
      var it={el:e,x:A.rnd(80,1080),y:760,v:A.rnd(110,190)+(30-T)*4,ph:A.rnd(0,6),rb:rb};items.push(it);
      onTap(e,function(){if(it.pop)return;it.pop=true;var pts=it.rb?5:1;score+=pts;h.set(score);sfx.pop();burst(it.x,it.y+40,12,it.rb?null:[getComputedStyle(e).color,'#fff','#ffd34d']);if(window.LIFE)LIFE.floatText(it.x,it.y,'+'+pts);
        e.animate([{transform:e.style.transform+' scale(1)'},{transform:e.style.transform+' scale(1.4)',opacity:0}],{duration:160}).onfinish=function(){e.remove();};});}
     for(var i=items.length-1;i>=0;i--){var it=items[i];if(it.pop){items.splice(i,1);continue;}it.y-=it.v*dt;it.ph+=dt*2;it.el.style.transform='translate('+(it.x-40+Math.sin(it.ph)*18)+'px,'+(it.y)+'px)';if(it.y<-140){it.el.remove();items.splice(i,1);}}
     if(T<=0){items.forEach(function(i){i.el.remove();});ui.endScreen('balloons',score,score>=35?3:score>=22?2:1);return false;}});}}
});

/* ---------- WHACK FLOWERS ---------- */
var POT='<svg viewBox="0 0 160 110"><ellipse cx="80" cy="22" rx="74" ry="18" fill="#5a3515"/><path d="M8 22 H152 L134 106 H26Z" fill="#e07a4a"/><rect x="2" y="14" width="156" height="20" rx="10" fill="#f0905a"/></svg>';
var BEE='<svg viewBox="0 0 100 80"><ellipse cx="50" cy="48" rx="34" ry="26" fill="#ffd34d"/><g fill="#333"><rect x="38" y="24" width="9" height="48"/><rect x="56" y="24" width="9" height="48"/></g><ellipse cx="40" cy="16" rx="16" ry="12" fill="#e4f6ff" opacity=".9"/><ellipse cx="64" cy="16" rx="16" ry="12" fill="#e4f6ff" opacity=".9"/><circle cx="24" cy="44" r="5" fill="#333"/></svg>';
ROOMS.whack=def({name:'اضربي الورد',color:'linear-gradient(135deg,#d8f5c8,#4cc45a)',bg:GBG('#d8f5c8','#6bd466'),
 icon:'<svg viewBox="0 0 100 100"><path d="M14 60 H86 L76 94 H24Z" fill="#e07a4a"/><path d="M50 60 V36" stroke="#3aa845" stroke-width="5"/>'+A.fl5(50,30,10,'#ff5fa2','#ffd34d')+'</svg>',
 intro:'الورد يطلع من القواري! اضغطي عليه بسرعة 🌸',
 init:function(r){var ui=A.ui;ui.startScreen('اضربي الورد 🌸','اضغطي على الوردة أول ما تطلع. لا تضغطين على النحلة 🐝! 30 ثانية',function(){ui.countdown(play);});
  function play(){var h=ui.hud();var bst=ui.best('whack').best;h.set(0,30,bst==null?'-':bst);var score=0,T=30,holes=[],sp=.6;
   for(var i=0;i<9;i++){var x=250+(i%3)*270,y=170+Math.floor(i/3)*165;var hole=div('hole','<div class="pop"></div>'+POT,'left:'+(x-80)+'px;top:'+y+'px');holes.push({el:hole,pop:hole.querySelector('.pop'),up:false,x:x,y:y});}
   holes.forEach(function(hl){onTap(hl.el,function(){if(!hl.up)return;hl.up=false;hl.pop.classList.remove('up');if(hl.bee){sfx.oops();say('ززز! هذي نحلة 🐝');return;}score++;h.set(score);sfx.pop();burst(hl.x,hl.y,10);if(window.LIFE)LIFE.floatText(hl.x,hl.y-20,'+1');});});
   ui.loop(function(dt){T-=dt;h.set(null,Math.max(0,Math.ceil(T)));sp-=dt;if(sp<=0){sp=A.rnd(.45,.85)-Math.min(.25,(30-T)*.01);var free=holes.filter(function(x){return !x.up;});if(free.length){var hl=A.pick(free);hl.up=true;hl.bee=Math.random()<.18;
       hl.pop.innerHTML=hl.bee?BEE:'<svg viewBox="0 0 100 120"><path d="M50 120 V50" stroke="#3aa845" stroke-width="8"/>'+A.fl5(50,40,20,A.pick(['#ff5fa2','#b388ff','#ffd34d','#ff7a3c']),'#fff3a8')+'<circle cx="43" cy="36" r="3" fill="#333"/><circle cx="57" cy="36" r="3" fill="#333"/><path d="M44 46 q6 5 12 0" stroke="#333" stroke-width="2" fill="none"/></svg>';hl.pop.classList.add('up');
       (function(hl){setTimeout(function(){if(hl.up){hl.up=false;hl.pop.classList.remove('up');}},A.rnd(800,1300));})(hl);}}
     if(T<=0){ui.endScreen('whack',score,score>=24?3:score>=15?2:1);return false;}});}}
});
})();
