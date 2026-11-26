/* Wardrobe v3 inside the 3D world's closet modal: the colour swatches become the full illustrated wardrobe.
   Picking an outfit dresses every live sprite Ghalia (GhaliaSprite.setOutfit -> twirl) and is remembered for all pages. */
(function(){
'use strict';
var M=window.GHALIA_OUTFITS;if(!M||typeof document==='undefined')return;
var BY={};M.list.forEach(function(o){BY[o.id]=o;});
var curCat=null;
function cur(){try{var v=localStorage.getItem('ghalia.outfit');return v&&BY[v]?v:null;}catch(e){return null;}}
var css=document.createElement('style');css.textContent=
'.v3c-tabs{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;padding:2px 2px 8px}.v3c-tabs::-webkit-scrollbar{display:none}'+
'.v3c-tab{flex:0 0 auto;padding:7px 11px;border-radius:16px;font-weight:800;font-size:14px;color:#fff;background:rgba(255,255,255,.14);border:1.5px solid rgba(255,255,255,.35);cursor:pointer}'+
'.v3c-tab.on{background:linear-gradient(135deg,#ff7ec0,#d63384);border-color:#fff;box-shadow:0 4px 12px rgba(214,51,132,.5)}'+
'.v3c-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}'+
'@media (max-width:520px){.v3c-grid{grid-template-columns:repeat(4,1fr);gap:6px}}'+
'.v3c-tile{position:relative;aspect-ratio:3/4;border-radius:16px;overflow:hidden;cursor:pointer;border:2px solid rgba(255,255,255,.5);'+
 'background:radial-gradient(circle at 50% 35%,rgba(255,255,255,.95),rgba(255,214,236,.85) 60%,rgba(255,170,210,.8));padding:0}'+
'.v3c-tile img{position:absolute;left:50%;bottom:18%;height:78%;transform:translateX(-50%);pointer-events:none}'+
'.v3c-tile b{position:absolute;left:2px;right:2px;bottom:4px;font-size:11px;line-height:1.1;color:#7a0f4d;text-align:center}'+
'.v3c-tile.on{border-color:#ff4fa3;box-shadow:0 0 0 3px rgba(255,79,163,.5)}'+
'.v3c-uni{margin-top:8px;padding:8px 14px;border-radius:14px;border:1.5px solid #fff;background:linear-gradient(135deg,#3b4c8c,#1f2d5c);color:#fff;font-weight:800;cursor:pointer}';
document.head.appendChild(css);
function render(dg){
  var id=cur();curCat=curCat||(id?BY[id].cat:'party');
  dg.className='v3c';dg.dataset.v3='1';
  var h='<div class="v3c-tabs">'+M.cats.map(function(c){return '<button class="v3c-tab'+(c.id===curCat?' on':'')+'" data-cat="'+c.id+'">'+c.ar+'</button>';}).join('')+'</div>';
  h+='<div class="v3c-grid">'+M.list.filter(function(o){return o.cat===curCat;}).map(function(o){return '<button class="v3c-tile'+(o.id===id?' on':'')+'" data-of="'+o.id+'"><img src="img/outfits/thumbs/'+o.id+'.webp" alt="" loading="lazy"><b>'+o.ar+'</b></button>';}).join('')+'</div>';
  h+='<button class="v3c-uni" data-of="">🏫 المريول</button>';
  dg.innerHTML=h;
  var lbl=dg.previousElementSibling;if(lbl&&lbl.tagName==='P')lbl.textContent='اختاري لبس غالية 👗 (تلبسه بكل مكان):';
}
function pick(id,ev){id=id||null;
  try{if(window.GhaliaSprite&&GhaliaSprite.setOutfit)GhaliaSprite.setOutfit(id,{twirl:true});else localStorage.setItem('ghalia.outfit',id||'');}catch(e){}
  try{if(window.SFX&&SFX.tap)SFX.tap();}catch(e){}
  try{if(typeof window.spawnSparkles==='function'&&ev)spawnSparkles(ev.clientX,ev.clientY,8);}catch(e){}
  try{if(window.VOICE_EN&&VOICE_EN.speak&&id)VOICE_EN.speak(BY[id].ar+' تجننين');}catch(e){}
}
function hook(){var dg=document.getElementById('dress-grid');if(!dg)return;
  dg.addEventListener('click',function(e){var t=e.target.closest('[data-cat],[data-of]');if(!t)return;e.stopPropagation();
    if(t.dataset.cat){curCat=t.dataset.cat;render(dg);return;}
    pick(t.dataset.of,e);var id=t.dataset.of||null;[].forEach.call(dg.querySelectorAll('.v3c-tile'),function(x){x.classList.toggle('on',x.dataset.of===id);});},true);
  // the page rebuilds the grid (colour swatches) every time the closet opens: swap them for the wardrobe
  new MutationObserver(function(){if(dg.querySelector('.swatch'))render(dg);}).observe(dg,{childList:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook);else hook();
})();
