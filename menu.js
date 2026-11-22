/* Glossy menu: category tabs + horizontal card strip */
(function(){
'use strict';
var A=GAME.api,ROOMS=GAME.ROOMS,ORDER=GAME.ORDER;
var CATS=[
 {id:'feat',name:'المميز ⭐',rooms:['garden','salon','kitchen','makeup','nails','bath']},
 {id:'home',name:'بيت الأحلام 🏠',rooms:['garden','kitchen','bedroom','bath','wardrobe','dress']},
 {id:'beauty',name:'الجمال 💄',rooms:['salon','makeup','nails','masks','dress','wardrobe']},
 {id:'all',name:'الكل 💗',rooms:ORDER}
];
var menu=document.getElementById('menu');
menu.innerHTML='<div class="mhead"></div><div id="tabs"></div><div id="strip"><div id="inner"></div></div><button class="arr al" id="arrL">&#10094;</button><button class="arr ar" id="arrR">&#10095;</button>'+
 '<div id="mchars"><div class="mc" data-w="ghalia"><img src="img/ghalia_face.png" alt=""><b>غالية</b></div><div class="mc" data-w="khala"><img src="img/khala_face.png" alt=""><b>خالتج</b></div></div>';
var tabs=document.getElementById('tabs'),strip=document.getElementById('strip'),inner=document.getElementById('inner');
var off=0,maxOff=0,cur='feat';
function setOff(v,anim){off=Math.max(0,Math.min(maxOff,v));inner.style.transition=anim?'transform .35s ease-out':'none';inner.style.transform='translateX('+off+'px)';}
function fill(cat){cur=cat;var c=CATS.filter(function(x){return x.id===cat;})[0];inner.innerHTML='';
  c.rooms.forEach(function(id,i){var d=ROOMS[id];if(!d)return;var e=document.createElement('div');e.className='card';e.dataset.room=id;
    e.innerHTML='<div class="cbg" style="background:'+d.color+'"></div><div class="ic">'+d.icon+'</div><div class="shine"></div><b>'+d.name+'</b><i class="cs">✦</i>';inner.appendChild(e);
    e.animate([{transform:'scale(.6)',opacity:0},{transform:'scale(1.05)',opacity:1},{transform:'scale(1)'}],{duration:420,delay:i*60,easing:'ease-out',fill:'backwards'});});
  var t=tabs.children;for(var k=0;k<t.length;k++)t[k].classList.toggle('on',t[k].dataset.c===cat);
  requestAnimationFrame(function(){maxOff=Math.max(0,inner.scrollWidth-strip.clientWidth);setOff(0);});}
CATS.forEach(function(c){var b=document.createElement('button');b.className='tab';b.dataset.c=c.id;b.textContent=c.name;tabs.appendChild(b);
  b.addEventListener('click',function(){A.sfx.pop();fill(c.id);});});
var drag=null;
strip.addEventListener('pointerdown',function(e){e.preventDefault();drag={x:e.clientX,o:off,moved:false,id:e.pointerId};try{strip.setPointerCapture(e.pointerId);}catch(_){}});
strip.addEventListener('pointermove',function(e){if(!drag||e.pointerId!==drag.id)return;var dx=(e.clientX-drag.x)/(A.getScale?A.getScale():1);if(Math.abs(dx)>10)drag.moved=true;if(drag.moved)setOff(drag.o+dx);});
function up(e){if(!drag||e.pointerId!==drag.id)return;var d=drag;drag=null;if(d.moved)return;
  try{strip.releasePointerCapture(e.pointerId);}catch(_){}
  var t=document.elementFromPoint(e.clientX,e.clientY);var card=t&&t.closest&&t.closest('.card');
  if(card){A.sfx.sparkle();card.animate([{transform:'scale(1)'},{transform:'scale(.92)'},{transform:'scale(1.04)'}],{duration:220});setTimeout(function(){A.openRoom(card.dataset.room);},200);}}
strip.addEventListener('pointerup',up);strip.addEventListener('pointercancel',function(){drag=null;});
document.getElementById('arrL').addEventListener('click',function(){A.sfx.pick();setOff(off+330,true);});
document.getElementById('arrR').addEventListener('click',function(){A.sfx.pick();setOff(off-330,true);});
var mc=document.querySelectorAll('#mchars .mc');for(var i=0;i<mc.length;i++)(function(m){m.addEventListener('click',function(){A.sfx.boing();m.animate([{transform:'translateY(0)'},{transform:'translateY(-24px)'},{transform:'translateY(0)'}],{duration:400});
  A.say(m.dataset.w==='ghalia'?'أنا غالية! يلا نلعب 💗':'أنا خالتج! وين نروح؟ 😊');});})(mc[i]);
A.buildMenu=function(){fill('feat');};
})();
