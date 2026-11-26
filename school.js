/* School story: 4 chapters */
(function(){
'use strict';
var A=GAME.api,ROOMS=GAME.ROOMS,sfx=A.sfx,say=A.say,burst=A.burst,CH=A.CH;
function R(){return A.getR();}
function U(){return A.ui;}
function div(c,h,css,p){return A.ui.div(c,h,css,p);}
function tap(el,fn){A.ui.onTap(el,fn);}
function later(fn,ms){return A.later(fn,ms);}
var CHAP=['sch1','sch2','sch3','sch4'];
function nextBtn(next,label){var b=div('nextbtn',(label||'التالي')+' ▶');b.animate([{transform:'scale(0)'},{transform:'scale(1.1)'},{transform:'scale(1)'}],{duration:400});tap(b,function(){sfx.sparkle();b.remove();if(typeof next==='function')next();else A.openRoom(next);});return b;}
function bar(label){var b=div('sbar','<span>'+label+'</span><div><i></i></div>');return {el:b,set:function(v){b.querySelector('i').style.width=Math.max(0,Math.min(100,v*100))+'%';},remove:function(){b.remove();}};}
function holdBtn(label,ms,done,onHold){var b=div('holdbtn','<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="none" stroke="#fff6" stroke-width="10"/><circle class="pr" cx="50" cy="50" r="44" fill="none" stroke="#ffd34d" stroke-width="10" stroke-dasharray="276.5" stroke-dashoffset="276.5" transform="rotate(-90 50 50)"/></svg><b>'+label+'</b>');
  var t=0,hold=false,iv=null,pr=b.querySelector('.pr'),fin=false;
  b.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();A.ui&&0;hold=true;b.classList.add('on');try{b.setPointerCapture(e.pointerId);}catch(_){}
    if(!iv)iv=setInterval(function(){if(fin)return;if(hold){t+=50;if(onHold)onHold(t);}else t=Math.max(0,t-25);pr.setAttribute('stroke-dashoffset',276.5*(1-Math.min(1,t/ms)));if(t>=ms){fin=true;clearInterval(iv);b.remove();done();}},50);R().timers.push(iv);});
  function up(){hold=false;b.classList.remove('on');}b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);return b;}
function bigEl(html,cls,x,y,w,h,z){return A.el(html,cls,x,y,w,h,z);}
function chapDone(r,stars,next,msg){A.confetti();sfx.win();A.ui.addCoins(stars*5,640,300);
  var o=A.ui.overlay('<h3>'+msg+'</h3><div class="stars">'+A.ui.starsHTML(stars)+'</div><p class="cn">🪙 +'+(stars*5)+'</p>',[{t:'التالي ▶',cls:'nx',fn:function(){A.openRoom(next);}},{t:'القائمة 🏠',cls:'alt',fn:function(){A.goMenu();}}]);}
var BASE={tools:[],noCarousel:true,noWalk:true,noWander:true};
function def(o){var d={};for(var k in BASE)d[k]=BASE[k];for(var k2 in o)d[k2]=o[k2];return d;}

/* ---------- art ---------- */
var S={};
S.clock='<svg viewBox="0 0 100 110"><path d="M16 18 l14 10 M84 18 l-14 10" stroke="#ff5fa2" stroke-width="8" stroke-linecap="round"/><circle cx="22" cy="18" r="14" fill="#ffd34d"/><circle cx="78" cy="18" r="14" fill="#ffd34d"/><circle cx="50" cy="60" r="40" fill="#ff7eb6"/><circle cx="50" cy="60" r="32" fill="#fff"/><path d="M50 60 V38 M50 60 L66 68" stroke="#333" stroke-width="5" stroke-linecap="round"/><path d="M22 96 l-8 12 M78 96 l8 12" stroke="#ff5fa2" stroke-width="7" stroke-linecap="round"/></svg>';
S.brush='<svg viewBox="0 0 220 60"><rect x="60" y="22" width="160" height="18" rx="9" fill="#7ed6ff"/><rect x="0" y="18" width="70" height="26" rx="8" fill="#fff" stroke="#b9dfff" stroke-width="3"/><g fill="#bfe6ff"><rect x="6" y="2" width="8" height="18" rx="3"/><rect x="18" y="2" width="8" height="18" rx="3"/><rect x="30" y="2" width="8" height="18" rx="3"/><rect x="42" y="2" width="8" height="18" rx="3"/><rect x="54" y="2" width="8" height="18" rx="3"/></g><rect x="4" y="0" width="60" height="8" rx="4" fill="#ff9cc8"/></svg>';
S.shirt='<svg viewBox="0 0 120 120"><path d="M30 14 L48 8 Q60 20 72 8 L90 14 L114 40 L98 54 L90 46 V112 H30 V46 L22 54 L6 40Z" fill="#a9c8f0" stroke="#6f93c8" stroke-width="3"/><path d="M48 8 L60 26 L72 8" fill="#cfe0f7" stroke="#6f93c8" stroke-width="3"/><circle cx="60" cy="40" r="3" fill="#3a5a9a"/><circle cx="60" cy="54" r="3" fill="#3a5a9a"/></svg>';
S.pinafore='<svg viewBox="0 0 120 120"><path d="M34 6 H48 V30 Q60 38 72 30 V6 H86 V40 Q92 70 102 114 H18 Q28 70 34 40Z" fill="#1f2d5c"/><rect x="34" y="64" width="20" height="20" rx="3" fill="none" stroke="#3a4a80" stroke-width="3"/><rect x="66" y="64" width="20" height="20" rx="3" fill="none" stroke="#3a4a80" stroke-width="3"/></svg>';
S.hanger='<svg viewBox="0 0 120 40"><path d="M60 4 a8 8 0 1 1 8 8 v6 l48 18 H4 l48 -18" stroke="#c0a0b0" stroke-width="5" fill="none" stroke-linejoin="round"/></svg>';
var FOOD={egg:'<svg viewBox="0 0 100 100"><ellipse cx="50" cy="56" rx="40" ry="32" fill="#fff" stroke="#eee" stroke-width="3"/><circle cx="50" cy="54" r="16" fill="#ffb300"/><circle cx="44" cy="48" r="5" fill="#fff6c2"/></svg>',
 toast:'<svg viewBox="0 0 100 100"><path d="M18 40 Q14 14 50 14 Q86 14 82 40 V88 H18Z" fill="#e8a85a"/><path d="M26 42 Q24 24 50 24 Q76 24 74 42 V80 H26Z" fill="#ffdca0"/></svg>',
 cheese:'<svg viewBox="0 0 100 100"><path d="M10 70 L80 30 L90 70Z" fill="#ffd34d"/><path d="M10 70 H90 V84 H10Z" fill="#f0b400"/><circle cx="50" cy="60" r="6" fill="#f0b400"/><circle cx="72" cy="52" r="4" fill="#f0b400"/></svg>',
 dates:'<svg viewBox="0 0 100 100"><ellipse cx="34" cy="54" rx="14" ry="22" fill="#7a3a1a"/><ellipse cx="62" cy="50" rx="14" ry="22" fill="#8d4a22"/><ellipse cx="48" cy="70" rx="14" ry="20" fill="#6b3014"/><ellipse cx="58" cy="42" rx="4" ry="8" fill="#b06a3a" opacity=".7"/></svg>',
 milk:'<svg viewBox="0 0 100 100"><path d="M26 16 H74 L68 92 H32Z" fill="#e8f6ff" stroke="#9fd6f5" stroke-width="4"/><path d="M29 34 H71 L68 90 H32Z" fill="#fff"/></svg>',
 banana:'<svg viewBox="0 0 100 100"><path d="M14 30 Q30 86 88 70 Q86 62 78 62 Q40 66 26 26Z" fill="#ffd34d" stroke="#e0a400" stroke-width="3"/><path d="M14 30 l-4 -10 l10 4z" fill="#8d5524"/></svg>'};
var ITEMS={pencil:A.SV&&0,book:A.SV.book};
var SCH={pencil:'<svg viewBox="0 0 100 100"><g transform="rotate(-40 50 50)"><rect x="40" y="6" width="20" height="66" fill="#ffd34d"/><rect x="40" y="6" width="20" height="10" fill="#ff7eb6"/><path d="M40 72 L50 96 L60 72Z" fill="#f3d2b0"/><path d="M46 88 L50 96 L54 88Z" fill="#333"/></g></svg>',
 book:A.SV.book,
 eraser:'<svg viewBox="0 0 100 100"><g transform="rotate(-20 50 50)"><rect x="14" y="34" width="72" height="34" rx="8" fill="#ff9cc8"/><rect x="14" y="34" width="30" height="34" rx="8" fill="#7ed6ff"/></g></svg>',
 lunch:'<svg viewBox="0 0 100 100"><rect x="10" y="34" width="80" height="54" rx="12" fill="#7be07b"/><rect x="10" y="34" width="80" height="16" rx="8" fill="#4cc45a"/><path d="M36 34 Q50 14 64 34" stroke="#2fa84f" stroke-width="6" fill="none"/><path d="M50 78 C38 70 36 62 42 60 C46 58 50 62 50 64 C50 62 54 58 58 60 C64 62 62 70 50 78Z" fill="#fff"/></svg>',
 bottle:'<svg viewBox="0 0 100 100"><rect x="40" y="4" width="20" height="14" rx="4" fill="#ff5fa2"/><rect x="30" y="18" width="40" height="76" rx="14" fill="#7ed6ff"/><rect x="30" y="44" width="40" height="22" fill="#fff" opacity=".6"/></svg>'};
var TOYS={ball:'<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#ff5fa2"/><path d="M10 50 Q50 20 90 50 M10 50 Q50 80 90 50" stroke="#fff" stroke-width="7" fill="none"/></svg>',
 teddy:A.SV.teddy,
 car:'<svg viewBox="0 0 100 100"><path d="M10 66 V50 L28 30 H66 L82 50 H92 V66Z" fill="#ff9a3c"/><rect x="34" y="36" width="28" height="14" fill="#bfe8ff"/><circle cx="30" cy="70" r="11" fill="#333"/><circle cx="74" cy="70" r="11" fill="#333"/></svg>',
 kite:'<svg viewBox="0 0 100 100"><path d="M50 4 L86 44 L50 84 L14 44Z" fill="#b388ff"/><path d="M50 4 V84 M14 44 H86" stroke="#fff" stroke-width="3"/><path d="M50 84 q10 8 0 14" stroke="#ff5fa2" stroke-width="3" fill="none"/></svg>'};

/* ================= CHAPTER 1: morning ================= */
function bust(x,y,w){var h=w*535/434;var b=bigEl('<img src="img/ghalia_bust.png" alt="" style="width:100%;height:100%"><div class="pjtop"></div>','',x,y,w,h,10);b.style.pointerEvents='none';b._w=w;b._h=h;return b;}
ROOMS.sch1=def({name:'صباح المدرسة',color:'linear-gradient(135deg,#fff3c4,#ffb36b)',charH:280,bg:'',
 icon:'<svg viewBox="0 0 100 100"><circle cx="50" cy="56" r="34" fill="#ff7eb6"/><circle cx="50" cy="56" r="27" fill="#fff"/><path d="M50 56 V38 M50 56 L62 62" stroke="#333" stroke-width="5" stroke-linecap="round"/><circle cx="24" cy="22" r="12" fill="#ffd34d"/><circle cx="76" cy="22" r="12" fill="#ffd34d"/></svg>',
 intro:'',init:function(r){CH.ghalia.outfit='pj';stepWake(r);}});
function clearScene(){var s=A.scene();var keep=[];s.innerHTML='';for(var w in R().chars)delete R().chars[w];}
function setBg(html){var s=A.scene();s.insertAdjacentHTML('afterbegin',html);}
function swap(fn){A.iris(function(){if(R().dead)return;clearScene();fn(R());});}
function stepWake(r){setBg(ROOMS.bedroom.bg);var art=A.ART2;bigEl(art.BED_B,'',450,330,460,330,5);bigEl(art.BED_F,'',440,520,480,150,12);
  var g=A.putChar('ghalia',680,655);var z=document.createElement('div');z.className='zzz';z.innerHTML='<i>z</i><i>z</i><i>Z</i>';g.appendChild(z);
  var dim=div('dimmer','');var clk=bigEl(S.clock,'clockr',990,420,110,120,20);
  var iv=setInterval(function(){sfx.ring();},1100);r.timers.push(iv);sfx.ring();
  say('ترررن! المنبه يرن ⏰ اضغطي على المنبه عشان غالية تصحى');
  var woke=false;function wake(){if(woke)return;woke=true;clearInterval(iv);clk.classList.remove('clockr');sfx.sparkle();burst(1045,480,16);dim.style.opacity='0';z.remove();
    var el=R().chars.ghalia;LIFE.walkTo(el,330,690,function(){A.hop(el,2);});say('صباح الخير يا غالية! ☀️ يلا نغسل أسنانج');later(function(){swap(stepTeeth);},2200);}
  tap(clk,wake);tap(g,wake);}
function stepTeeth(r){setBg(ROOMS.bath.bg);var b=bust(380,110,470);var mouth={x:380+470*.493,y:110+b._h*.669};
  var br=bigEl(S.brush,'',mouth.x+30,mouth.y-30,220,60,12);br.style.pointerEvents='none';var pb=bar('🪥 الأسنان');
  say('فرشي أسنانج! حركي إصبعج يمين ويسار على الفم 🪥');var n=0,lastX=null,dir=0,done=false,need=10;
  var pad=div('swipe','','left:260px;top:'+(mouth.y-140)+'px;width:700px;height:280px');
  var hand=div('handhint','👆','left:'+(mouth.x-20)+'px;top:'+(mouth.y+60)+'px');
  pad.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();lastX=A.toStage(e).x;hand.remove();try{pad.setPointerCapture(e.pointerId);}catch(_){}});
  pad.addEventListener('pointermove',function(e){if(lastX==null||done)return;var x=A.toStage(e).x;br.style.left=(A.clamp(x,mouth.x-120,mouth.x+120)-20)+'px';var d=x-lastX;if(Math.abs(d)<14)return;var nd=d>0?1:-1;lastX=x;
    if(nd!==dir){dir=nd;n++;pb.set(n/need);sfx.water();for(var i=0;i<3;i++)LIFE.bubbleUp(mouth.x+A.rnd(-50,50),mouth.y+A.rnd(-10,20));
      if(n>=need){done=true;sfx.ding();burst(mouth.x,mouth.y,20,['#ffffff','#bfe6ff','#fff6a8']);LIFE.floatText(mouth.x,mouth.y-60,'✨😁✨');say('أسنانج تلمع! ✨ الحين نغسل الوجه');pb.remove();br.remove();pad.remove();later(function(){stepWash(R(),b);},1400);}}});
  pad.addEventListener('pointerup',function(){lastX=null;});}
function stepWash(r,b){var face={x:380+470*.5,y:110+b._h*.52};say('اضغطي مطولاً على زر المي عشان نغسل الوجه 💧');var pb=bar('💧 الوجه');
  var hb=holdBtn('💧',2200,function(){pb.remove();sfx.sparkle();b.querySelector('img').style.filter='brightness(1.08) saturate(1.1)';for(var i=0;i<4;i++)later(function(){burst(A.rnd(face.x-120,face.x+120),A.rnd(face.y-120,face.y+120),10);},i*150);
    say('وجهج نظيف ويلمع! 🌟 يلا نلبس المريول');later(function(){swap(stepUniform);},1600);},function(t){pb.set(t/2200);if(t%100===0){for(var i=0;i<2;i++){var d=document.createElement('div');d.className='drop';d.style.left=(face.x+A.rnd(-110,110))+'px';d.style.top=(face.y-150)+'px';A.fx.appendChild(d);(function(d){d.animate([{transform:'translateY(0)'},{transform:'translateY(260px)',opacity:.2}],{duration:600}).onfinish=function(){d.remove();};})(d);}sfx.water();}});
  hb.style.left='1000px';hb.style.top='470px';}
function stepUniform(r){setBg(ROOMS.wardrobe.bg);r.charH=400;var g=A.putChar('ghalia',1000,690);
  say('البسي مريول المدرسة! اضغطي على القميص الأزرق 👕');var got=0;
  var items=[['shirt',300,170],['pinafore',560,170]];items.forEach(function(it,i){var hg=bigEl(S.hanger,'',it[1],it[2]-20,140,46,6);var e=bigEl(S[it[0]],'tapme sway',it[1]+5,it[2]+14,130,130,7);
    tap(e,function(){if((i===0&&got!==0)||(i===1&&got!==1)){sfx.oops();say(got===0?'القميص أول 👕':'لبستيه! 😄');return;}got++;sfx.whoosh();var c=A.centerOf(e);
      e.animate([{left:e.style.left,top:e.style.top,transform:'scale(1)'},{left:(g._x-65)+'px',top:(g._y-g._h*.65)+'px',transform:'scale(.4)',opacity:0}],{duration:500,fill:'forwards'});
      later(function(){burst(g._x,g._y-g._h*.5,16);sfx.sparkle();if(got===1){say('حلو! الحين المريول الكحلي 👗');}else{delete CH.ghalia.outfit;A.renderAcc('ghalia');A.hop(g,2);say('صرتي جاهزة للمدرسة! 🏫 الحين نضفر الشعر');later(function(){stepBraid(R(),g);},1500);}},480);});});}
function stepBraid(r,g){var n=0,need=6;var pb=bar('🎀 الضفيرة');say('ضفري شعرج! اضغطي على الضفيرة '+need+' مرات 🎀');
  var spot=div('tapspot','','left:'+(g._x-g._w/2+g._w*.62)+'px;top:'+(g._y-g._h+g._h*.2)+'px;width:'+(g._w*.4)+'px;height:'+(g._h*.3)+'px');
  tap(spot,function(){if(n>=need)return;n++;pb.set(n/need);sfx.whoosh();var y=g._y-g._h+g._h*(.22+n*.04),x=g._x-g._w/2+g._w*(.76+(n%2?-.05:.05));burst(x,y,6,['#ffffff','#ff9cc8','#fff6a8']);LIFE.floatText(x,y,'✨');
    if(n>=need){pb.remove();spot.remove();var tie=document.createElement('div');tie.className='lay';tie.style.cssText='left:69%;top:44%;width:20%;height:4%';tie.innerHTML='<svg viewBox="0 0 100 60"><path d="M50 30 C30 0 4 4 7 30 C4 56 30 60 50 30Z" fill="#ff5fa2"/><path d="M50 30 C70 0 96 4 93 30 C96 56 70 60 50 30Z" fill="#ff5fa2"/><circle cx="50" cy="30" r="11" fill="#d81b74"/></svg>';g.appendChild(tie);
      sfx.sparkle();A.hop(g);say('ضفيرة تجنن! 🎀 يلا نفطر مع خالتج');later(function(){swap(stepBreakfast);},1600);}});}
function stepBreakfast(r){setBg(ROOMS.kitchen.bg);r.charH=300;var g=A.putChar('ghalia',420,712);var k=A.putChar('khala',860,712);
  bigEl('<svg viewBox="0 0 520 120"><rect x="0" y="0" width="520" height="30" rx="14" fill="#ffb3d1"/><rect x="30" y="30" width="20" height="90" fill="#e0457f"/><rect x="470" y="30" width="20" height="90" fill="#e0457f"/><rect x="0" y="0" width="520" height="12" rx="6" fill="#fff" opacity=".5"/></svg>','',380,560,520,120,14);
  var pb=bar('😋 شبعت؟');var full=0;say('وقت الريوق! اضغطي على الأكل عشان غالية تاكل 🍳');
  Object.keys(FOOD).forEach(function(f,i){var e=bigEl(FOOD[f],'tapme food',410+i*78,500,72,72,15);e.animate([{transform:'translateY(0)'},{transform:'translateY(-6px)'},{transform:'translateY(0)'}],{duration:1400,delay:i*200,iterations:Infinity});
    tap(e,function(){if(e._eaten)return;e._eaten=true;var hx=g._x,hy=g._y-g._h*.78;e.animate([{left:e.style.left,top:e.style.top,transform:'scale(1)'},{left:(hx-36)+'px',top:(hy-36)+'px',transform:'scale(.2)'}],{duration:450,easing:'ease-in',fill:'forwards'}).onfinish=function(){e.remove();};
      later(function(){sfx.munch();LIFE.floatText(hx,hy-30,'😋');full+=1/6;pb.set(full);A.hop(g);
        if(full>.98){pb.remove();sfx.win();LIFE.cheer();say('شبعت الحمدلله! 😋 يلا نجهز الشنطة');chapDoneMini(R(),'sch2');}else say(A.pick(['يمّي! 😋','لذيذ! كلي بعد 🍞','صحة وعافية 💪']));},460);});});}
function chapDoneMini(r,next){A.ui.addCoins(5,640,300);later(function(){nextBtn(next);},700);}

/* ================= CHAPTER 2: pack the bag ================= */
var BAG='<svg viewBox="0 0 220 180"><rect x="10" y="40" width="200" height="136" rx="40" fill="#ff8fc0"/><path d="M10 80 Q110 30 210 80 V70 Q110 10 10 70Z" fill="#ff6fae"/><rect x="50" y="110" width="120" height="54" rx="18" fill="#ff6fae"/><path d="M70 40 Q110 -10 150 40" stroke="#d81b74" stroke-width="10" fill="none"/>'+A.fl5(110,136,10,'#fff','#ffd34d')+'</svg>';
ROOMS.sch2=def({name:'جهّزي الشنطة',color:'linear-gradient(135deg,#ffe3f1,#ff8fc0)',bg:'',
 icon:'<svg viewBox="0 0 100 100"><rect x="14" y="26" width="72" height="66" rx="20" fill="#ff8fc0"/><path d="M34 26 Q50 4 66 26" stroke="#d81b74" stroke-width="6" fill="none"/><rect x="30" y="56" width="40" height="26" rx="8" fill="#ff6fae"/></svg>',
 intro:'',init:function(r){setBg(ROOMS.bedroom.bg);var ui=U();
  ui.startScreen('جهّزي الشنطة 🎒','اضغطي على أغراض المدرسة (قلم، كتاب، مساحة، صندوق الأكل، مطارة المي) عشان تدخل الشنطة. الألعاب خليها بالبيت!',function(){ui.countdown(play);});
  function play(){var bag=bigEl(BAG,'',530,520,220,180,12);var got=0,need=10,miss=0,items=[],sp=0;var h=ui.hud();h.hideTime();h.set('0/'+need,null,'-');var hb=h.el.querySelector('.hb');hb.innerHTML='❌ <b>0</b>';
   say('يلا! اضغطي على أغراض المدرسة 📚');
   ui.loop(function(dt){sp-=dt;if(sp<=0&&got<need){sp=A.rnd(.6,1.0);var school=Math.random()<.65;var key=A.pick(Object.keys(school?SCH:TOYS));var e=div('fall2',(school?SCH:TOYS)[key],'');var it={el:e,x:A.rnd(120,1060),y:-80,v:A.rnd(110,170),r:A.rnd(-40,40),school:school,key:key};items.push(it);
      tap(e,function(){if(it.done)return;if(!it.school){miss++;hb.querySelector('b').textContent=miss;sfx.oops();e.animate([{transform:e.style.transform+' rotate(0)'},{transform:e.style.transform+' rotate(20deg)'},{transform:e.style.transform+' rotate(-20deg)'}],{duration:300});say('هذي لعبة! خليها بالبيت 😄');return;}
        it.done=true;got++;h.set(got+'/'+need);sfx.star();LIFE.floatText(it.x,it.y,'✔');e.animate([{transform:'translate('+(it.x-45)+'px,'+(it.y-45)+'px) scale(1)'},{transform:'translate(595px,560px) scale(.3)'}],{duration:450,easing:'ease-in',fill:'forwards'}).onfinish=function(){e.remove();bag.animate([{transform:'scale(1)'},{transform:'scale(1.1,.92)'},{transform:'scale(1)'}],{duration:250});burst(640,580,8);};
        if(got>=need){items.forEach(function(i){if(!i.done)i.el.remove();});var st=miss<=1?3:miss<=3?2:1;later(function(){chapDone(R(),st,'sch3','الشنطة جاهزة! 🎒');},700);}});}
     for(var i=items.length-1;i>=0;i--){var it=items[i];if(it.done){items.splice(i,1);continue;}it.y+=it.v*dt;it.r+=dt*30;it.el.style.transform='translate('+(it.x-45)+'px,'+(it.y-45)+'px) rotate('+it.r+'deg)';if(it.y>780){it.el.remove();items.splice(i,1);}}
     if(got>=need)return false;});}}});

/* ================= CHAPTER 3: road to school ================= */
var CAR='<svg viewBox="0 0 300 150"><path d="M14 110 V80 Q14 64 34 60 L80 56 L112 18 Q120 10 134 10 H210 Q226 10 236 22 L264 58 Q290 62 292 84 V110Z" fill="#ff5fa2"/><path d="M122 24 H170 V58 H96Z" fill="#bfe8ff"/><path d="M180 24 H214 Q222 24 228 32 L248 58 H180Z" fill="#bfe8ff"/><rect x="14" y="96" width="278" height="14" fill="#e0187a"/><circle cx="74" cy="114" r="26" fill="#333"/><circle cx="74" cy="114" r="11" fill="#ccc"/><circle cx="234" cy="114" r="26" fill="#333"/><circle cx="234" cy="114" r="11" fill="#ccc"/><rect x="280" y="70" width="12" height="12" rx="4" fill="#ffd34d"/></svg>';
var CONE='<svg viewBox="0 0 60 70"><path d="M30 2 L50 62 H10Z" fill="#ff7a1a"/><path d="M22 26 H38 L41 36 H19Z M16 44 H44 L47 54 H13Z" fill="#fff"/><rect x="2" y="60" width="56" height="10" rx="4" fill="#ff7a1a"/></svg>';
var LIGHT='<svg viewBox="0 0 70 260"><rect x="30" y="100" width="10" height="160" fill="#666"/><rect x="8" y="0" width="54" height="130" rx="14" fill="#333"/><circle class="lr" cx="35" cy="24" r="16" fill="#552222"/><circle class="ly" cx="35" cy="64" r="16" fill="#555522"/><circle class="lg" cx="35" cy="104" r="16" fill="#225522"/></svg>';
var GATE='<svg viewBox="0 0 420 330"><rect x="0" y="60" width="420" height="270" fill="#ffe0a3"/><rect x="0" y="40" width="420" height="40" fill="#ff9a3c"/><rect x="140" y="140" width="140" height="190" rx="10" fill="#7ec8ff"/><path d="M210 140 V330" stroke="#fff" stroke-width="6"/><g fill="#bfe8ff" stroke="#fff" stroke-width="6"><rect x="30" y="110" width="80" height="70"/><rect x="310" y="110" width="80" height="70"/></g><rect x="110" y="0" width="200" height="56" rx="14" fill="#fff" stroke="#ff9a3c" stroke-width="6"/><text x="210" y="40" text-anchor="middle" font-size="30" font-weight="900" fill="#d81b74">المدرسة</text></svg>';
ROOMS.sch3=def({name:'الطريق للمدرسة',color:'linear-gradient(135deg,#d6f1ff,#6ec6ff)',bg:'',
 icon:'<svg viewBox="0 0 100 100"><rect x="0" y="70" width="100" height="30" fill="#777"/><path d="M0 85 h100" stroke="#fff" stroke-width="3" stroke-dasharray="10 8"/><g transform="translate(8 34) scale(.28)">'+CAR.replace(/<\/?svg[^>]*>/g,'')+'</g></svg>',
 intro:'',init:function(r){var ui=U();
  setBg('<svg class="bg" viewBox="0 0 1280 720"><defs><linearGradient id="rsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd8ff"/><stop offset="1" stop-color="#e3f7ff"/></linearGradient></defs><rect width="1280" height="720" fill="url(#rsky)"/><circle cx="1050" cy="90" r="50" fill="#ffe14d"/><rect y="380" width="1280" height="340" fill="#6b6b78"/><rect y="372" width="1280" height="14" fill="#c9c9d6"/><rect y="706" width="1280" height="14" fill="#c9c9d6"/></svg>');
  var far=div('par far','','');var near=div('par lanes','','');var objs=[];
  ui.startScreen('الطريق للمدرسة 🚗','خالتج توصل غالية! اضغطي فوق أو تحت الطريق عشان تغيرين المسار. اجمعي القلوب ❤️ وابعدي عن الأقماع 🔶. وعند الإشارة الحمرا 🔴 اضغطي مطولاً على زر الوقوف!',function(){ui.countdown(play);});
  function play(){var lanes=[470,570,670],lane=1;var car=div('car',CAR+'<img class="fk" src="img/khala_face.png" alt=""><img class="fg" src="img/ghalia_face.png" alt="">','left:150px;top:'+(lanes[lane]-140)+'px');
   var hearts=0,reds=0,ok=0,dist=0,total=5200,speed=0,maxV=300,braking=false,spT=1,lightT=6,gateShown=false,arrived=false;
   var h=ui.hud();h.hideTime();h.set(0,null,'-');h.el.querySelector('.hs').innerHTML='❤️ <b>0</b>';h.el.querySelector('.hb').innerHTML='🏫 <b>0%</b>';
   var brake=div('brake','<b>🛑</b><span>وقوف</span>','');brake.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();braking=true;brake.classList.add('on');try{brake.setPointerCapture(e.pointerId);}catch(_){}});
   function bu(){braking=false;brake.classList.remove('on');}brake.addEventListener('pointerup',bu);brake.addEventListener('pointercancel',bu);
   var sc=A.scene();var sy=null;function pd(e){if(e.target.closest('.brake,.ovl'))return;sy=A.toStage(e).y;}function pu(e){if(sy==null)return;var y=A.toStage(e).y,dy=y-sy;sy=null;var nl=lane;if(Math.abs(dy)>30)nl=lane+(dy>0?1:-1);else nl=y<lanes[lane]-70?lane-1:lane+1;nl=A.clamp(nl,0,2);if(nl!==lane){lane=nl;sfx.whoosh();car.animate([{transform:'rotate(0)'},{transform:'rotate('+(dy<0||y<lanes[1]?-4:4)+'deg)'},{transform:'rotate(0)'}],{duration:300});}}
   sc.addEventListener('pointerdown',pd);sc.addEventListener('pointerup',pu);
   say('يلا نمشي! 🚗 اجمعي القلوب');var cy=lanes[lane]-140,bob=0;
   ui.loop(function(dt){if(arrived)return false;var target=braking?0:maxV;speed+=(target-speed)*Math.min(1,dt*(braking?6:2));
     var mv=speed*dt;dist+=mv;cy+=((lanes[lane]-140)-cy)*Math.min(1,dt*10);bob+=dt*speed/30;car.style.top=(cy+Math.sin(bob)*2)+'px';
     far.style.backgroundPositionX=(-dist*.3)+'px';near.style.backgroundPositionX=(-dist)+'px';h.el.querySelector('.hb b').textContent=Math.min(100,Math.round(dist/total*100))+'%';
     spT-=mv/300;if(spT<=0&&dist<total-600){spT=A.rnd(1.2,2.4);var isH=Math.random()<.6;var e=div('robj',isH?'<svg viewBox="0 0 100 100"><path d="M50 88 C14 64 8 38 22 26 C34 16 46 24 50 34 C54 24 66 16 78 26 C92 38 86 64 50 88Z" fill="#ff3d6e"/></svg>':CONE,'');var L=Math.floor(Math.random()*3);objs.push({el:e,x:1320,lane:L,t:isH?'h':'c'});}
     lightT-=mv/300;if(lightT<=0&&dist<total-900){lightT=A.rnd(9,12);var e2=div('robj light',LIGHT,'');e2.querySelector('.lg').setAttribute('fill','#3dff6e');objs.push({el:e2,x:1320,t:'l',state:'g',stopT:0});}
     for(var i=objs.length-1;i>=0;i--){var o=objs[i];o.x-=mv;
       if(o.t==='l'){o.el.style.transform='translate('+o.x+'px,140px)';if(o.state==='g'&&o.x<900){o.state='r';reds++;var s=o.el.querySelector('svg');s.querySelector('.lg').setAttribute('fill','#225522');s.querySelector('.lr').setAttribute('fill','#ff3b3b');sfx.ring();say('الإشارة حمرا! 🔴 اضغطي مطولاً على وقوف');brake.classList.add('hint');}
         if(o.state==='r'&&speed<15&&o.x<760){o.stopT+=dt;if(o.stopT>1.2){o.state='go';ok++;var s2=o.el.querySelector('svg');s2.querySelector('.lr').setAttribute('fill','#552222');s2.querySelector('.lg').setAttribute('fill','#3dff6e');brake.classList.remove('hint');sfx.sparkle();say('أخضر! 💚 شاطرة، وقفنا عند الأحمر. يلا نمشي');}}
         if(o.state==='r'&&o.x<240){o.state='x';brake.classList.remove('hint');sfx.oops();say('لازم نوقف عند الإشارة الحمرا 🚦 المرة الياية!');LIFE.shake();}
       }else{var oy=lanes[o.lane]-(o.t==='h'?95:80);o.el.style.transform='translate('+o.x+'px,'+oy+'px)';
         if(!o.hit&&o.lane===lane&&o.x<420&&o.x>160){o.hit=true;if(o.t==='h'){hearts++;h.set(hearts);sfx.star();burst(o.x+40,oy+40,10,['#ff3d6e','#fff']);o.el.remove();}else{sfx.bump();car.animate([{transform:'translateX(0)'},{transform:'translateX(-14px) rotate(-3deg)'},{transform:'translateX(0)'}],{duration:350});say('أوه! انتبهي من القمع 🔶');}}}
       if(o.x<-200){o.el.remove();objs.splice(i,1);}}
     if(dist>=total-900&&!gateShown){gateShown=true;var gt=div('robj gate',GATE,'');objs.push({el:gt,x:1350,t:'gate'});gt.style.transform='translate(1350px,60px)';}
     objs.forEach(function(o){if(o.t==='gate'){o.el.style.transform='translate('+o.x+'px,60px)';if(o.x<420&&!arrived){arrived=true;}}});
     if(arrived){sc.removeEventListener('pointerdown',pd);sc.removeEventListener('pointerup',pu);brake.remove();arrive();return false;}});
   function arrive(){speed=0;sfx.ding();say('وصلنا المدرسة! 🏫 اضغطي على غالية عشان تقول مع السلامة 👋');r.charH=260;var g=A.putChar('ghalia',600,700,true);
     var waved=false;var hand=div('handhint','👆','left:575px;top:600px');
     tap(g,function(){if(waved)return;waved=true;hand.remove();LIFE.floatText(g._x+40,g._y-g._h,'👋');LIFE.floatText(260,car.offsetTop+10,'👋');LIFE.heartBurst(g._x,g._y-g._h*.8);sfx.pop();say('مع السلامة يا غالية! أحبج 💗 — باي باي خالتي! 👋');
       later(function(){LIFE.walkTo(g,780,690,function(){});},900);var st=(ok===reds&&hearts>=8)?3:(ok===reds?2:1);later(function(){chapDone(R(),st,'sch4','وصلنا بالسلامة! 🚗');},2200);});}
  }}});

/* ================= CHAPTER 4: classroom ================= */
var TEACHER='<svg viewBox="0 0 160 380"><path d="M40 120 Q80 100 120 120 L140 370 H20Z" fill="#7e57c2"/><path d="M40 130 L18 250 L34 254 L56 150Z M120 130 L142 250 L126 254 L104 150Z" fill="#7e57c2"/><circle cx="26" cy="256" r="10" fill="#e9b48a"/><circle cx="134" cy="256" r="10" fill="#e9b48a"/>'+
 '<path d="M30 70 Q30 10 80 10 Q130 10 130 70 Q132 120 80 132 Q28 120 30 70Z" fill="#f48fb1"/><ellipse cx="80" cy="72" rx="34" ry="40" fill="#e9b48a"/><circle cx="67" cy="68" r="5" fill="#3a2216"/><circle cx="93" cy="68" r="5" fill="#3a2216"/><path d="M68 90 Q80 100 92 90" stroke="#c2185b" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="60" cy="84" r="6" fill="#ff9cb8" opacity=".6"/><circle cx="100" cy="84" r="6" fill="#ff9cb8" opacity=".6"/><rect x="66" y="150" width="28" height="20" rx="4" fill="#fff"/></svg>';
function kid(c,h,skin){return '<svg viewBox="0 0 100 150"><path d="M20 150 V96 Q20 80 50 80 Q80 80 80 96 V150Z" fill="'+c+'"/><circle cx="50" cy="50" r="30" fill="'+(skin||'#e9b48a')+'"/><path d="'+h+'" fill="#3a2216"/><circle cx="40" cy="52" r="4" fill="#333"/><circle cx="60" cy="52" r="4" fill="#333"/><path d="M42 64 Q50 70 58 64" stroke="#c2185b" stroke-width="3" fill="none"/></svg>';}
var KIDS=[kid('#a9c8f0','M20 44 Q22 16 50 16 Q80 16 80 44 Q70 30 50 30 Q30 30 20 44Z'),kid('#ffb3d1','M18 54 Q14 14 50 14 Q86 14 82 54 Q76 28 50 28 Q24 28 18 54Z','#d99a66'),kid('#a9c8f0','M22 40 Q26 18 50 18 Q74 18 78 40 Q66 26 50 28 Q34 26 22 40Z','#f3d2b0'),kid('#c9a4ff','M18 60 Q12 12 50 12 Q88 12 82 60 Q78 26 50 26 Q22 26 18 60Z')];
var DESK='<svg viewBox="0 0 220 110"><rect x="0" y="0" width="220" height="22" rx="8" fill="#d9a77a"/><rect x="14" y="22" width="192" height="70" fill="#c48a55"/><rect x="20" y="92" width="14" height="18" fill="#8d5a32"/><rect x="186" y="92" width="14" height="18" fill="#8d5a32"/></svg>';
var PICS={egg:FOOD.egg,ear:'<svg viewBox="0 0 100 100"><path d="M60 12 C30 12 22 40 30 56 C36 68 32 80 44 88 C58 96 70 80 64 70 C74 60 84 44 78 28 C74 18 68 12 60 12Z" fill="#e9b48a" stroke="#c98a5a" stroke-width="4"/><path d="M58 30 C44 30 44 50 54 54" stroke="#c98a5a" stroke-width="5" fill="none"/></svg>',
 eye:'<svg viewBox="0 0 100 100"><path d="M6 50 Q50 10 94 50 Q50 90 6 50Z" fill="#fff" stroke="#333" stroke-width="4"/><circle cx="50" cy="50" r="18" fill="#7a4a22"/><circle cx="50" cy="50" r="8" fill="#222"/><circle cx="44" cy="44" r="4" fill="#fff"/></svg>',
 apple:'<svg viewBox="0 0 100 100"><path d="M50 30 C20 14 6 50 22 76 C32 92 44 88 50 84 C56 88 68 92 78 76 C94 50 80 14 50 30Z" fill="#ff3b5c"/><path d="M50 30 Q52 14 62 8" stroke="#8d5524" stroke-width="5" fill="none"/><path d="M54 20 Q70 10 76 22 Q62 28 54 20Z" fill="#4cc45a"/></svg>',
 ball:TOYS.ball,cat:'<svg viewBox="0 0 100 100"><circle cx="50" cy="56" r="32" fill="#f2a65a"/><path d="M22 40 L24 8 L44 28Z M78 40 L76 8 L56 28Z" fill="#f2a65a"/><circle cx="40" cy="54" r="5" fill="#333"/><circle cx="60" cy="54" r="5" fill="#333"/><path d="M44 68 q6 6 12 0" stroke="#333" stroke-width="3" fill="none"/></svg>',
 sun:'<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="24" fill="#ffd34d"/><g stroke="#ffb300" stroke-width="7" stroke-linecap="round"><path d="M50 6v12M50 82v12M6 50h12M82 50h12M19 19l8 8M73 73l8 8M19 81l8-8M73 27l8-8"/></g></svg>',
 book:A.SV.book,fish:'<svg viewBox="0 0 100 100"><path d="M10 50 Q40 14 74 50 Q40 86 10 50Z" fill="#ff7a3c"/><path d="M74 50 L94 30 V70Z" fill="#ff7a3c"/><circle cx="30" cy="46" r="5" fill="#333"/></svg>'};
var ROUNDS=[['E','egg',['ball','cat']],['E','ear',['sun','apple']],['E','eye',['fish','book']],['A','apple',['egg','sun']],['B','ball',['cat','eye']],['C','cat',['apple','fish']]];
var ESHAPE=[[0,0],[0,100],[0,200],[90,0],[0,0],[0,100],[70,100],[0,100],[0,200],[90,200]]; /* polyline-ish for E (spine + arms) */
function ePath(){var P=[];var segs=[[[0,0],[0,200]],[[0,0],[90,0]],[[0,100],[70,100]],[[0,200],[90,200]]];segs.forEach(function(s){for(var t=0;t<=1.0001;t+=.1)P.push([s[0][0]+(s[1][0]-s[0][0])*t,s[0][1]+(s[1][1]-s[0][1])*t]);});return P;}
ROOMS.sch4=def({name:'الصف',color:'linear-gradient(135deg,#d8f5c8,#7ec8ff)',charH:280,bg:'',
 icon:'<svg viewBox="0 0 100 100"><rect x="8" y="10" width="84" height="54" rx="8" fill="#2f6f5a" stroke="#c48a55" stroke-width="6"/><text x="50" y="50" font-size="30" text-anchor="middle" fill="#fff" font-weight="900">E</text><rect x="20" y="72" width="60" height="12" rx="4" fill="#d9a77a"/></svg>',
 intro:'',init:function(r){var b3=div('gbtn','الصف 3D 🏫','position:absolute;left:16px;top:370px;z-index:40;font-size:20px;padding:8px 14px');b3.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();location.href='class3d.html';});
  setBg('<svg class="bg" viewBox="0 0 1280 720"><rect width="1280" height="720" fill="#fff6e3"/><rect width="1280" height="500" fill="#e4f6ff"/><rect y="492" width="1280" height="16" fill="#c9a4ff"/><rect y="508" width="1280" height="212" fill="#f3d1b0"/>'+
   '<g transform="translate(60 90)"><rect width="150" height="110" rx="10" fill="#fff" stroke="#ffd34d" stroke-width="6"/><text x="75" y="70" font-size="44" text-anchor="middle" fill="#ff5fa2" font-weight="900">A B C</text></g>'+
   '<g transform="translate(60 230)"><rect width="150" height="110" rx="10" fill="#fff" stroke="#7ed6ff" stroke-width="6"/><text x="75" y="72" font-size="46" text-anchor="middle" fill="#2f93d6" font-weight="900">1 2 3</text></g>'+
   '<rect x="1000" y="60" width="140" height="160" rx="14" fill="#bfe8ff" stroke="#fff" stroke-width="10"/></svg>');
  var board=div('sboard','<div class="bin"></div>','');var bin=board.querySelector('.bin');
  var t=A.el(TEACHER,'teacher',985,250,150,356,8);var kids=[];
  [[330,560],[520,575],[880,560],[1060,575]].forEach(function(p,i){var k=A.el(KIDS[i],'kid',p[0]-50,p[1]-120,100,150,9);kids.push(k);A.el(DESK,'',p[0]-90,p[1]+10,180,90,11);});
  var g=A.putChar('ghalia',720,700);A.el(DESK,'',610,580,220,110,12);
  r.starsGot=0;
  function clap(){sfx.clap();kids.forEach(function(k,i){setTimeout(function(){k.animate([{transform:'translateY(0)'},{transform:'translateY(-24px)'},{transform:'translateY(0)'}],{duration:380});var c=A.centerOf(k);LIFE.floatText(c.x,c.y-80,'👏');},i*90);});}
  function star(){r.starsGot++;sfx.star();var s=document.createElement('div');s.className='lay stk';var i=r.starsGot-1;s.style.cssText='left:'+(30+(i%4)*10)+'%;top:'+(36+Math.floor(i/4)*6)+'%;width:14%;height:5%';s.innerHTML=A.ui&&'<svg viewBox="0 0 100 100"><path d="M50 6 L61 37 L94 38 L68 58 L77 90 L50 71 L23 90 L32 58 L6 38 L39 37Z" fill="#ffd34d" stroke="#f0a800" stroke-width="5"/></svg>';g.appendChild(s);s.animate([{transform:'scale(3)',opacity:0},{transform:'scale(1)',opacity:1}],{duration:400});burst(g._x,g._y-g._h*.6,12);clap();}
  function teacherSay(txt){say('👩‍🏫 '+txt);t.animate([{transform:'rotate(0)'},{transform:'rotate(-3deg)'},{transform:'rotate(3deg)'},{transform:'rotate(0)'}],{duration:500});}
  function raise(then,q){teacherSay(q+' ارفعي يدج ✋ (اضغطي مطولاً)');var hb=holdBtn('✋',900,function(){var hd=document.createElement('div');hd.className='lay';hd.style.cssText='left:80%;top:-14%;width:30%;height:14%;font-size:44px';hd.textContent='✋';g.appendChild(hd);A.hop(g);sfx.pop();
     later(function(){hd.remove();then();},700);});hb.style.left='1150px';hb.style.top='560px';hb.style.zIndex=40;}
  var ri=0;function letters(){if(ri>=ROUNDS.length){bin.innerHTML='';return raise(trace,'الحين نكتب حرف E! منو يبي يكتب؟');}
    var rd=ROUNDS[ri];var opts=[rd[1]].concat(rd[2]).sort(function(){return Math.random()-.5;});
    bin.innerHTML='<div class="blt">'+rd[0]+'</div><div class="bq">'+rd[0]+' is for ...?</div><div class="bpics"></div>';var bp=bin.querySelector('.bpics');
    teacherSay('اضغطي الصورة اللي تبدا بحرف '+rd[0]+' 🔤');
    opts.forEach(function(o){var c=document.createElement('div');c.className='bpic';c.innerHTML=PICS[o]+'<span>'+o+'</span>';bp.appendChild(c);
      tap(c,function(){if(c._done)return;if(o===rd[1]){c._done=true;c.classList.add('ok');star();teacherSay(rd[0]+' is for '+o+'! ممتاز يا غالية 🌟');ri++;later(letters,1300);}else{sfx.oops();c.animate([{transform:'translateX(0)'},{transform:'translateX(-10px)'},{transform:'translateX(10px)'},{transform:'translateX(0)'}],{duration:300});teacherSay('حاولي مرة ثانية 💪');}});});}
  function trace(){var P=ePath();var ox=520,oy=120;bin.innerHTML='<svg class="tr" viewBox="0 0 1280 720" style="position:absolute;left:-304px;top:-64px;width:1280px;height:720px;pointer-events:none"><path d="M'+ox+' '+oy+' V'+(oy+200)+' M'+ox+' '+oy+' H'+(ox+90)+' M'+ox+' '+(oy+100)+' H'+(ox+70)+' M'+ox+' '+(oy+200)+' H'+(ox+90)+'" stroke="#ffffff55" stroke-width="34" stroke-linecap="round" fill="none"/><path d="M'+ox+' '+oy+' V'+(oy+200)+' M'+ox+' '+oy+' H'+(ox+90)+' M'+ox+' '+(oy+100)+' H'+(ox+70)+' M'+ox+' '+(oy+200)+' H'+(ox+90)+'" stroke="#fff" stroke-width="5" stroke-dasharray="4 14" stroke-linecap="round" fill="none"/><polyline class="ink" points="" stroke="#ffd34d" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';
    teacherSay('اكتبي حرف E بإصبعج على النقاط ✍️');var hit=P.map(function(){return false;});var ink=bin.querySelector('.ink'),pts='',drawing=false,fin=false;
    var pad=div('swipe','','left:300px;top:60px;width:560px;height:330px;z-index:30');
    pad.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();drawing=true;try{pad.setPointerCapture(e.pointerId);}catch(_){}});
    pad.addEventListener('pointermove',function(e){if(!drawing||fin)return;var p=A.toStage(e);pts+=p.x.toFixed(0)+','+p.y.toFixed(0)+' ';ink.setAttribute('points',pts);
      P.forEach(function(q,i){if(!hit[i]&&Math.hypot(p.x-(ox+q[0]),p.y-(oy+q[1]))<42)hit[i]=true;});var c=hit.filter(Boolean).length/hit.length;
      if(c>=.8){fin=true;pad.remove();star();sfx.sparkle();teacherSay('واو! كتبتي حرف E حلو 🌟');later(function(){raise(shapes,'آخر سؤال: الألوان والأشكال!');},1400);}});
    pad.addEventListener('pointerup',function(){drawing=false;});}
  function shapes(){bin.innerHTML='<div class="shp"></div>';var sh=bin.querySelector('.shp');teacherSay('اسحبي كل شكل لمكانه 🔴🟦🔺');
    var SH={circle:'<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="COL"/></svg>',square:'<svg viewBox="0 0 100 100"><rect x="12" y="12" width="76" height="76" rx="6" fill="COL"/></svg>',tri:'<svg viewBox="0 0 100 100"><path d="M50 8 L94 90 H6Z" fill="COL"/></svg>'};
    var COL={circle:'#ff4d6d',square:'#3d8bff',tri:'#ffc21a'};var keys=['circle','square','tri'];var outs=keys.slice().sort(function(){return Math.random()-.5;});var matched=0;
    var slots={};outs.forEach(function(k,i){var o=div('sslot',SH[k].replace('COL','none" stroke="'+COL[k]+'" stroke-width="6" stroke-dasharray="10 6'),'left:'+(640+i*70)+'px;top:150px');slots[k]=o;});
    keys.forEach(function(k,i){var s=div('sshape',SH[k].replace('COL',COL[k]),'left:'+(350+i*90)+'px;top:'+(150+ (i%2)*110)+'px');var home={x:350+i*90,y:150+(i%2)*110};
      A.drag(s,{start:function(p){if(s._done)return false;s.style.zIndex=50;sfx.pick();return {dx:p.x-parseFloat(s.style.left),dy:p.y-parseFloat(s.style.top)};},move:function(c,p){s.style.left=(p.x-c.dx)+'px';s.style.top=(p.y-c.dy)+'px';},
        end:function(c,p){var tg=slots[k];var tx=parseFloat(tg.style.left),ty=parseFloat(tg.style.top);if(Math.hypot(p.x-(tx+35),p.y-(ty+35))<70){s._done=true;s.style.left=tx+'px';s.style.top=ty+'px';matched++;star();
          if(matched===3){teacherSay('ممتاز! خلصتي كل الأسئلة 🌟');later(cert,1500);}}else{sfx.oops();s.style.left=home.x+'px';s.style.top=home.y+'px';teacherSay('هذا مو مكانه، جربي ثاني 🙂');}}});});}
  function cert(){document.querySelectorAll('.sshape,.sslot').forEach(function(e){e.remove();});A.confetti();sfx.win();var d=new Date();var ds=d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear();A.ui.addCoins(15,640,300);
    var o=A.ui.overlay('<div class="cert"><div class="ctitle">⭐ نجمة الصف ⭐</div><img src="img/ghalia.png" alt=""><p>شهادة تقدير للبطلة <b>غالية</b></p><p>جمعتي <b>'+r.starsGot+'</b> نجمة اليوم!</p><p class="cd">'+ds+'</p></div>',[{t:'القائمة 🏠',cls:'alt',fn:function(){A.goMenu();}},{t:'من البداية 🔁',fn:function(){A.openRoom('sch1');}},{t:'الصف 3D 🏫',fn:function(){location.href='class3d.html';}}]);o.classList.add('certo');if(window.V2&&V2.certify)V2.certify(o.querySelector('.cert'),{date:false});}
  teacherSay('صباح الخير يا شطار! 🌞');later(function(){raise(letters,'منو يعرف الحروف؟');},1500);
 }});
})();
