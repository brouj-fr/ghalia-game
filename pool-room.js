/* «عالم المسبح» menu entry: registers GAME.ROOMS.pool (opens pool3d.html) with its illustrated thumbnail. Self-contained. */
(function(){
'use strict';
var A=GAME.api,ROOMS=GAME.ROOMS,ORDER=GAME.ORDER;
ROOMS.pool={name:'عالم المسبح',color:'url(img/thumbs/pool.jpg) center/cover',icon:'',bg:'<svg class="bg" viewBox="0 0 1280 720"><rect width="1280" height="720" fill="#bdeffd"/></svg>',tools:[],noCarousel:true,noWalk:true,noWander:true,
 init:function(){A.sfx.pop();setTimeout(function(){var go=function(){location.href='pool3d.html';};(window.V2&&V2.wipe)?V2.wipe(go,'عالم المسبح'):go();},150);}};
ORDER.push('pool');
function deco(){var cs=document.querySelectorAll('#inner .card[data-room="pool"]');for(var i=0;i<cs.length;i++){var c=cs[i];if(c._v2p)continue;c._v2p=1;c.classList.add('v2card');var bg=c.querySelector('.cbg');if(bg)bg.style.background='url(img/thumbs/pool.jpg) center/cover';}}
var m=document.getElementById('menu');if(m){deco();new MutationObserver(deco).observe(m,{childList:true,subtree:true});}
})();
