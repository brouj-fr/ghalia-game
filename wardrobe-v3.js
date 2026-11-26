/* Wardrobe v3: a big illustrated wardrobe Ghalia really wears (45 outfits in 7 categories).
   2D rooms: swaps Ghalia's painted image (img/outfits/<id>.webp, cheer pose on put-on) and keeps blink lids on her eyes.
   3D pages read the same choice from localStorage 'ghalia.outfit' (ghalia-sprite.js setOutfit).  Classic script, offline. */
(function(){
'use strict';
var M=window.GHALIA_OUTFITS;if(!M||!window.GAME||!GAME.api)return;
var A=GAME.api,ROOMS=GAME.ROOMS,CH=A.CH,sfx=A.sfx,say=A.say,burst=A.burst;
var LS='ghalia.outfit',BY={};M.list.forEach(function(o){BY[o.id]=o;});
function R(){return A.getR();}
function stored(){try{var v=localStorage.getItem(LS);return v&&BY[v]?v:null;}catch(e){return null;}}
function store(id){try{if(id)localStorage.setItem(LS,id);else localStorage.removeItem(LS);}catch(e){}}
function cur(){var o=CH.ghalia.outfit;if(o==='pj')return 'pj-stars';return o&&BY[o]?o:null;}
/* the school story's SVG pyjama overlay is replaced by the painted star pyjamas */
if(A.OUTFITS)A.OUTFITS.pj='';
if(!CH.ghalia.outfit){var s0=stored();if(s0)CH.ghalia.outfit=s0;}

/* English voice for the put-on lines (on-screen text stays Arabic, speech is English only) */
var NICE=[['تجننين','You look amazing!'],['يهبل عليج','It looks so pretty on you!'],['صرتي حلوة','So lovely!']];
if(window.VOICE_EN&&VOICE_EN.dict){var norm=function(s){return String(s).replace(/[^\u0621-\u064A\u0660-\u0669A-Za-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();};
  M.list.forEach(function(o){NICE.forEach(function(n){VOICE_EN.dict[norm(o.ar+' '+n[0])]=o.en+'! '+n[1];});});
  VOICE_EN.dict[norm('رجعنا للمريول')]='Back to the school uniform!';
  VOICE_EN.dict[norm('اختاري لبس غالية')]="Choose Ghalia's outfit!";
  VOICE_EN.dict[norm('خزانة غالية الكبيرة اختاري أي لبس')]="Ghalia's big wardrobe! Pick any outfit!";}

/* ---- 2D Ghalia image ---- */
var css=document.createElement('style');css.textContent=
'.char>img.v3of{left:-34.16%;top:-10%;width:168.3%;height:110%;right:auto;bottom:auto}'+
'.char.v3nolids .lids{display:none}'+
'.v3wr{position:absolute;left:26px;top:92px;width:660px;height:520px;z-index:40;border-radius:30px;padding:14px 16px;'+
 'background:linear-gradient(160deg,rgba(255,255,255,.34),rgba(255,214,236,.18));border:2px solid rgba(255,255,255,.7);'+
 'box-shadow:0 18px 40px rgba(120,20,80,.28),inset 0 1px 0 rgba(255,255,255,.8);backdrop-filter:blur(14px) saturate(1.3);-webkit-backdrop-filter:blur(14px) saturate(1.3)}'+
'.v3tabs{display:flex;gap:6px;justify-content:space-between;margin-bottom:12px}'+
'.v3tab{flex:1;height:50px;border-radius:18px;display:flex;align-items:center;justify-content:center;font:800 17px/1 "Segoe UI",Tahoma,sans-serif;color:#8a1257;'+
 'background:rgba(255,255,255,.55);border:2px solid rgba(255,255,255,.8);cursor:pointer;transition:transform .15s,background .2s}'+
'.v3tab.on{background:linear-gradient(135deg,#ff7ec0,#d63384);color:#fff;transform:translateY(-2px);box-shadow:0 6px 14px rgba(214,51,132,.45)}'+
'.v3grid{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:206px;gap:10px}'+
'.v3tile{position:relative;border-radius:22px;overflow:hidden;cursor:pointer;background:radial-gradient(circle at 50% 35%,#fff 0,#ffe6f3 55%,#ffc8e3 100%);'+
 'border:3px solid rgba(255,255,255,.9);box-shadow:0 6px 14px rgba(140,20,90,.18);transition:transform .18s}'+
'.v3tile img{position:absolute;left:50%;bottom:30px;height:170px;transform:translateX(-50%);filter:drop-shadow(0 4px 4px rgba(90,10,60,.25))}'+
'.v3tile b{position:absolute;left:0;right:0;bottom:6px;text-align:center;font:800 15px/1.1 "Segoe UI",Tahoma,sans-serif;color:#7a0f4d}'+
'.v3tile.on{border-color:#ff4fa3;box-shadow:0 0 0 4px rgba(255,79,163,.35),0 10px 22px rgba(214,51,132,.4);transform:translateY(-3px)}'+
'.v3tile.on:after{content:"✓";position:absolute;top:8px;right:10px;width:30px;height:30px;border-radius:50%;background:#ff4fa3;color:#fff;font:900 18px/30px sans-serif;text-align:center}'+
'.v3tile:active{transform:scale(.95)}'+
'.v3grid.many{grid-auto-rows:134px;gap:8px}.v3grid.many .v3tile img{height:100px;bottom:24px}.v3grid.many .v3tile b{font-size:13px;bottom:4px}'+
'.v3uni{position:absolute;right:16px;bottom:-62px;height:48px;padding:0 20px;border-radius:24px;display:flex;align-items:center;gap:8px;font:800 17px "Segoe UI",Tahoma,sans-serif;color:#fff;'+
 'background:linear-gradient(135deg,#3b4c8c,#1f2d5c);border:2px solid #fff;box-shadow:0 6px 14px rgba(20,30,80,.35);cursor:pointer}'+
'.v3ring{position:absolute;z-index:45;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;border:4px solid #fff;pointer-events:none;box-shadow:0 0 18px #ff9cd6,inset 0 0 12px #ffd6ef}'+
'.v3glow{position:absolute;z-index:9;width:380px;height:120px;margin-left:-190px;border-radius:50%;pointer-events:none;background:radial-gradient(closest-side,rgba(255,240,170,.85),rgba(255,160,220,.35) 60%,transparent)}';
document.head.appendChild(css);

function lids(el,o){var L=el._lids;if(!L)return;el.classList.toggle('v3nolids',!!o&&!o.eyes);if(!L.children.length)return;
  var e=o&&o.eyes?[[o.eyes[0],o.eyes[1]],[o.eyes[2],o.eyes[3]]]:[[38.4,17.2],[63,17.7]],w=13,h=2.3;
  for(var i=0;i<2;i++){var s=L.children[i];if(!s)continue;s.style.left=(e[i][0]-w/2)+'%';s.style.top=(e[i][1]-h/2)+'%';}}
function paint(el,pose){if(!el)return;var img=el.querySelector('img');if(!img)return;var id=cur(),o=id&&BY[id];
  if(o){var src='img/outfits/'+id+(pose?'-'+pose:'')+'.webp';if(img.getAttribute('src')!==src)img.setAttribute('src',src);img.classList.add('v3of');}
  else{if(img.getAttribute('src')!=='img/ghalia.png')img.setAttribute('src','img/ghalia.png');img.classList.remove('v3of');}
  lids(el,o);}
/* hook: every time a Ghalia element is created (LIFE.onChar) or re-dressed (renderAcc) */
if(window.LIFE&&LIFE.onChar){var oc=LIFE.onChar;LIFE.onChar=function(el,who){oc.apply(this,arguments);if(who==='ghalia')paint(el);};}
var ra=A.renderAcc;A.renderAcc=function(who){ra.apply(this,arguments);if(who==='ghalia'){var r=R();if(r&&r.chars.ghalia)paint(r.chars.ghalia);}};

/* public: change outfit everywhere (2D now, 3D pages on next load / live via GhaliaSprite) */
function wearOutfit(id,opt){opt=opt||{};id=id&&BY[id]?id:null;
  if(id)CH.ghalia.outfit=id;else delete CH.ghalia.outfit;store(id);
  if(window.GhaliaSprite&&GhaliaSprite.setOutfit)try{GhaliaSprite.setOutfit(id,{twirl:true});}catch(e){}
  var r=R(),el=r&&r.chars&&r.chars.ghalia;if(!el)return;
  if(opt.twirl===false){paint(el);return;}
  twirl(el,id);}
window.GHALIA_WARDROBE={wear:wearOutfit,current:cur,list:M.list,cats:M.cats};

function twirl(el,id){var img=el.querySelector('img');if(!img)return;
  if(id){var pre=new Image();pre.src='img/outfits/'+id+'.webp';var pre2=new Image();pre2.src='img/outfits/'+id+'-cheer.webp';}
  var x=el._x,y=el._y,h=el._h;sfx.whoosh&&sfx.whoosh();
  var g=document.createElement('div');g.className='v3glow';g.style.left=x+'px';g.style.top=(y-60)+'px';A.scene().appendChild(g);
  g.animate([{opacity:0,transform:'scale(.4)'},{opacity:1,transform:'scale(1.1)',offset:.4},{opacity:0,transform:'scale(1.4)'}],{duration:1300,easing:'ease-out'}).onfinish=function(){g.remove();};
  var a=img.animate([{transform:'perspective(900px) rotateY(0deg) scale(1)'},{transform:'perspective(900px) rotateY(90deg) scale(1.06,.96)'}],{duration:260,easing:'ease-in'});
  a.onfinish=function(){paint(el,'cheer');
    var b=img.animate([{transform:'perspective(900px) rotateY(-90deg) scale(1.06,.96)'},{transform:'perspective(900px) rotateY(20deg) scale(1.08)',offset:.6},{transform:'perspective(900px) rotateY(0deg) scale(1)'}],{duration:520,easing:'ease-out'});
    sfx.sparkle();burst(x,y-h*.55,26,['#fff6a8','#ff8fc0','#ffffff','#c9a4ff','#7ee8ff']);
    for(var k=0;k<3;k++)(function(k){setTimeout(function(){ring(x,y-h*.5,k);},k*140);})(k);
    el.animate([{transform:'translateY(0)'},{transform:'translateY(-34px)',offset:.45},{transform:'translateY(0)'}],{duration:620,easing:'cubic-bezier(.3,1.6,.5,1)'});
    setTimeout(function(){paint(el);},1250);};}
function ring(x,y,k){var d=document.createElement('div');d.className='v3ring';d.style.left=x+'px';d.style.top=y+'px';A.scene().appendChild(d);
  d.animate([{transform:'scale(1)',opacity:1},{transform:'scale('+(26+k*8)+')',opacity:0}],{duration:900,easing:'ease-out'}).onfinish=function(){d.remove();};}

/* ---- the wardrobe room: category tabs + illustrated outfit tiles ---- */
var W=ROOMS.wardrobe;if(!W)return;
var curCat=null;
W.tools=[];W.charH=430;W.spawn={ghalia:[1010,690,1],khala:[90,712]};
W.intro='خزانة غالية الكبيرة اختاري أي لبس 👗✨';
W.onReset=function(){wearOutfit(null,{twirl:false});};
W.drop=function(){return false;};
var wi=W.init;W.init=function(r){if(wi)wi.apply(this,arguments);
  var id=cur();curCat=curCat||(id?BY[id].cat:'party');build(r);};
function build(r){var sc=A.scene(),old=sc.querySelector('.v3wr');if(old)old.remove();
  var p=document.createElement('div');p.className='v3wr';
  var tabs='<div class="v3tabs">'+M.cats.map(function(c){return '<div class="v3tab'+(c.id===curCat?' on':'')+'" data-cat="'+c.id+'">'+c.ar+'</div>';}).join('')+'</div>';
  var inCat=M.list.filter(function(o){return o.cat===curCat;}).length;
  var tiles='<div class="v3grid'+(inCat>8?' many':'')+'">'+M.list.filter(function(o){return o.cat===curCat;}).map(function(o){
    return '<div class="v3tile'+(cur()===o.id?' on':'')+'" data-of="'+o.id+'"><img src="img/outfits/thumbs/'+o.id+'.webp" alt="" loading="lazy"><b>'+o.ar+'</b></div>';}).join('')+'</div>';
  p.innerHTML=tabs+tiles+'<div class="v3uni" data-of="">🏫 المريول</div>';sc.appendChild(p);
  /* taps on the panel must not make Ghalia walk behind it (life.js tap-to-walk on the scene) */
  p.addEventListener('pointerdown',function(e){e.stopPropagation();});p.addEventListener('pointerup',function(e){e.stopPropagation();});
  [].forEach.call(p.querySelectorAll('.v3tab'),function(t){A.tapBtn(t,function(){if(curCat===t.dataset.cat)return;curCat=t.dataset.cat;sfx.pop&&sfx.pop();build(r);});});
  [].forEach.call(p.querySelectorAll('[data-of]'),function(t){A.tapBtn(t,function(){var id=t.dataset.of||null;if(id===cur())return;
    wearOutfit(id);[].forEach.call(p.querySelectorAll('.v3tile'),function(x){x.classList.toggle('on',x.dataset.of===id);});
    if(id){say(BY[id].ar+' '+A.pick(NICE)[0]+' ✨');}else say('رجعنا للمريول 🏫');});});
  p.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'none'}],{duration:260,easing:'ease-out'});}
})();
