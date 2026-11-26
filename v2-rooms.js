/* v2 dressing room: sunset boutique backdrop + living lights + tappable wardrobe / mirror / neon heart,
   and a "camera flash + sparkle" moment each time an item is put on. Classic script, offline. */
(function(){
'use strict';
var A=GAME.api,ROOMS=GAME.ROOMS,sfx=A.sfx,say=A.say,burst=A.burst;if(!ROOMS||!ROOMS.dress)return;
window.V2DRESS=true;
var BULBS=[[1140,140],[1137,170],[1134,203],[1134,238],[1136,272],[1141,305],[1150,135],[1175,123]];
var FAIRY=[[240,18],[300,26],[344,28],[394,24],[444,18],[656,16],[716,26],[775,32],[831,30],[893,24],[988,26],[1031,30],[1073,30],[1116,26],[1162,22],[1225,16]];
var html='<div class="v2room v2dress"><img class="v2bgimg" src="img/dress-room.jpg" alt="">'+
 '<div class="v2beam"></div>'+
 FAIRY.map(function(p,i){return '<i class="v2fl" style="left:'+p[0]+'px;top:'+p[1]+'px;animation-delay:'+(i*.23%2).toFixed(2)+'s"></i>';}).join('')+
 BULBS.map(function(p,i){return '<i class="v2bulb" style="left:'+p[0]+'px;top:'+p[1]+'px;animation-delay:'+(i*.17).toFixed(2)+'s"></i>';}).join('')+
 '<div class="v2heart" data-hit="heart"></div>'+
 '<div class="v2hit" data-hit="wardrobe" style="left:10px;top:30px;width:300px;height:560px"></div>'+
 '<div class="v2hit" data-hit="mirror" style="left:1110px;top:110px;width:40px;height:300px"></div>'+
 '<div class="v2hit" data-hit="window" style="left:360px;top:50px;width:230px;height:420px"></div>'+
 '<div class="v2flash"></div></div>';
ROOMS.dress.bg=html;
ROOMS.dress.intro='أهلاً في غرفة الملابس! اسحبي أي غرض على غالية ✨';
/* sparkle + flash whenever something is worn */
var drop0=ROOMS.dress.drop;
ROOMS.dress.drop=function(id,p){var ok=drop0.apply(this,arguments);if(ok===true){try{flash();burst(p.x,p.y,18,['#f9c846','#ff8fc0','#ffffff','#00f0ff']);if(window.V2&&V2.sfx)V2.sfx.sparkle();}catch(e){}}return ok;};
function flash(){var f=document.querySelector('.v2dress .v2flash');if(!f)return;f.classList.remove('go');void f.offsetWidth;f.classList.add('go');}
/* tappable set pieces */
document.addEventListener('pointerdown',function(e){var t=e.target.closest&&e.target.closest('.v2dress [data-hit]');if(!t)return;var k=t.dataset.hit,room=t.closest('.v2dress');
  if(k==='wardrobe'){room.classList.remove('sway');void room.offsetWidth;room.classList.add('sway');sfx.pop&&sfx.pop();say('شوفي الفساتين الحلوة! 👗');burst(160,260,12,['#ff8fc0','#c9a0ff','#8fd8ff','#ffe066']);}
  else if(k==='mirror'){room.classList.remove('mir');void room.offsetWidth;room.classList.add('mir');flash();if(window.V2&&V2.sfx)V2.sfx.chime();say('المراية تقول: ما شاء الله! ✨');}
  else if(k==='heart'){t.classList.remove('pulse');void t.offsetWidth;t.classList.add('pulse');if(window.V2&&V2.sfx)V2.sfx.sparkle();say('قلب وردي مضيء 💖');}
  else if(k==='window'){room.classList.remove('sun');void room.offsetWidth;room.classList.add('sun');sfx.pop&&sfx.pop();say('شوفي الغروب! 🌅');}
},true);
})();
/* ---- v2 hero: 2.5D parallax title screen over the illustrated dream-house key art ---- */
(function(){
var st=document.getElementById('start');if(!st)return;
var bg=document.createElement('div');bg.className='v2hero-bg';st.insertBefore(bg,st.firstChild);
var sun=document.createElement('div');sun.className='v2hero-sun';st.insertBefore(sun,bg.nextSibling);
var sp=document.createElement('div');sp.className='v2hero-sparks';for(var i=0;i<26;i++){var s=document.createElement('i');s.style.cssText='left:'+(Math.random()*100)+'%;top:'+(20+Math.random()*75)+'%;animation-delay:'+(Math.random()*6).toFixed(2)+'s;animation-duration:'+(5+Math.random()*5).toFixed(2)+'s;transform:scale('+(.5+Math.random()).toFixed(2)+')';sp.appendChild(s);}st.appendChild(sp);
st.classList.add('v2hero');
var chars=st.querySelector('.startChars'),box=st.querySelector('.startBox');var tx=0,ty=0,cx=0,cy=0,t0=performance.now();
function setT(x,y){tx=x;ty=y;}
st.addEventListener('pointermove',function(e){var r=st.getBoundingClientRect();setT((e.clientX-r.left)/r.width-.5,(e.clientY-r.top)/r.height-.5);});
addEventListener('deviceorientation',function(e){if(e.gamma==null)return;setT(Math.max(-.5,Math.min(.5,e.gamma/40)),Math.max(-.5,Math.min(.5,(e.beta-40)/40)));});
(function loop(now){if(!st.isConnected)return;requestAnimationFrame(loop);if(getComputedStyle(st).display==='none')return;
  var t=(now-t0)/1000,ax=tx+Math.sin(t*.25)*.12,ay=ty+Math.cos(t*.2)*.06;cx+=(ax-cx)*.06;cy+=(ay-cy)*.06;
  bg.style.transform='translate3d('+(-cx*22)+'px,'+(-cy*12)+'px,0) scale(1.06)';sun.style.transform='translate3d('+(-cx*26)+'px,'+(-cy*14)+'px,0)';
  if(chars)chars.style.transform='translate3d('+(cx*26)+'px,'+(cy*10)+'px,0)';if(box)box.style.transform='translate3d('+(cx*10)+'px,'+(cy*6)+'px,0)';sp.style.transform='translate3d('+(cx*40)+'px,'+(cy*20)+'px,0)';})(t0);
})();
