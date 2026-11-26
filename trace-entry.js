/* Entry points for the dot-tracing letters page (trace.html):
   - index.html: registers ROOMS.trace (menu card), illustrated thumb, and returns to the menu's school tab on #trace-menu / #trace-school.
   - class3d.html: adds a ✍️ button in the top HUD. (The board tap is wired in class3d.html's onEvent.) */
(function(){
'use strict';
function go(from){var h='trace.html?from='+from;try{if(window.V2&&V2.wipe){V2.wipe(function(){location.href=h;},'✍️');return;}}catch(e){}location.href=h;}
window.GHALIA_TRACE={go:go};
if(window.GAME&&GAME.ROOMS){
  var A=GAME.api,ROOMS=GAME.ROOMS;
  ROOMS.trace={name:'أكتب الحروف ✍️',color:'linear-gradient(135deg,#d8f5c8,#ffd6ea)',bg:'<svg class="bg" viewBox="0 0 1280 720"><rect width="1280" height="720" fill="#2f5a3c"/></svg>',tools:[],noCarousel:true,noWalk:true,noWander:true,
    icon:'<svg viewBox="0 0 100 100"><rect x="8" y="12" width="84" height="62" rx="8" fill="#2f5a3c" stroke="#c98a4e" stroke-width="6"/><g fill="#fff"><circle cx="30" cy="30" r="3"/><circle cx="34" cy="40" r="3"/><circle cx="38" cy="50" r="3"/><circle cx="42" cy="60" r="3"/></g><text x="66" y="56" font-size="28" text-anchor="middle" fill="#ffe27a" font-weight="900">ب</text><rect x="22" y="80" width="56" height="10" rx="4" fill="#ff8fc0"/></svg>',
    init:function(){A.sfx&&A.sfx.pop&&A.sfx.pop();setTimeout(function(){go('menu');},200);}};
  GAME.ORDER.push('trace');
  function deco(){var cs=document.querySelectorAll('#inner .card[data-room="trace"]');for(var i=0;i<cs.length;i++){var c=cs[i];if(c._tr)continue;c._tr=1;c.classList.add('v2card');var bg=c.querySelector('.cbg');if(bg)bg.style.background='url(img/thumbs/trace.jpg) center/cover';}}
  addEventListener('DOMContentLoaded',function(){var m=document.getElementById('menu');if(m){deco();new MutationObserver(deco).observe(m,{childList:true,subtree:true});}
    if(/^#trace-(menu|school)$/.test(location.hash)){var school=location.hash==='#trace-school';try{history.replaceState(null,'',location.pathname+location.search);}catch(e){}
      setTimeout(function(){try{A.goMenu();setTimeout(function(){var t=document.querySelector('.tab[data-c="school"]');if(t)t.click();},500);}catch(e){}},50);}});
}else{
  /* class3d / world pages: a ✍️ pill next to the home button */
  addEventListener('DOMContentLoaded',function(){var h=document.getElementById('back-home');if(!h||document.getElementById('trace-btn'))return;
    var b=document.createElement('button');b.id='trace-btn';b.className='sound-btn';b.setAttribute('aria-label','أكتب الحروف');b.textContent='✍️';b.title='أكتب الحروف';b.style.pointerEvents='auto';
    b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();go('class3d');});h.parentNode.insertBefore(b,h.nextSibling);});
}
})();
