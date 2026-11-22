/* Coins shop: buy accessories with coins earned in games & school */
(function(){
'use strict';
var A=GAME.api,ROOMS=GAME.ROOMS,sfx=A.sfx,say=A.say,ACC=A.ACC,TOOLS=A.TOOLS;
var fl=A.fl5;
var S={};
S.heartclip='<svg viewBox="0 0 100 100"><path d="M50 90 C12 64 6 36 22 24 C34 14 46 22 50 32 C54 22 66 14 78 24 C94 36 88 64 50 90Z" fill="#ff3d8b" stroke="#fff" stroke-width="5"/><circle cx="36" cy="40" r="7" fill="#fff" opacity=".7"/></svg>';
S.starsun='<svg viewBox="0 0 140 56"><path d="M0 22 H140" stroke="#7a2a8a" stroke-width="5"/>'+star(34,28,26,'#ffd34d')+star(106,28,26,'#ffd34d')+'<path d="M58 24 Q70 14 82 24" stroke="#7a2a8a" stroke-width="5" fill="none"/></svg>';
S.bowGold='<svg viewBox="0 0 100 70"><path d="M50 35 L8 8 Q0 35 8 62Z" fill="#ffc93c" stroke="#e09a00" stroke-width="4"/><path d="M50 35 L92 8 Q100 35 92 62Z" fill="#ffc93c" stroke="#e09a00" stroke-width="4"/><circle cx="50" cy="35" r="11" fill="#ffe27a" stroke="#e09a00" stroke-width="4"/></svg>';
S.fcrown='<svg viewBox="0 0 140 50"><path d="M8 40 Q70 10 132 40" stroke="#4cc45a" stroke-width="6" fill="none"/>'+fl(16,36,10,'#ff7eb6','#ffd34d')+fl(42,24,11,'#fff','#ffd34d')+fl(70,18,12,'#c9a4ff','#ffd34d')+fl(98,24,11,'#fff','#ffd34d')+fl(124,36,10,'#ff7eb6','#ffd34d')+'</svg>';
S.purse='<svg viewBox="0 0 100 100"><path d="M30 40 Q50 4 70 40" stroke="#c2185b" stroke-width="7" fill="none"/><rect x="12" y="38" width="76" height="56" rx="16" fill="#ff5fa2" stroke="#c2185b" stroke-width="4"/>'+fl(50,66,11,'#fff','#ffd34d')+'</svg>';
S.balloon='<svg viewBox="0 0 60 150"><path d="M30 64 Q22 100 32 150" stroke="#888" stroke-width="3" fill="none"/><path d="M30 66 C6 50 0 26 12 14 C20 6 28 10 30 18 C32 10 40 6 48 14 C60 26 54 50 30 66Z" fill="#ff3d8b"/><circle cx="20" cy="24" r="5" fill="#fff" opacity=".7"/></svg>';
S.wings='<svg viewBox="0 0 200 130"><path d="M100 50 C70 -10 4 0 10 50 C14 80 60 76 100 60Z" fill="#c9a4ff" stroke="#fff" stroke-width="5" opacity=".92"/><path d="M100 50 C130 -10 196 0 190 50 C186 80 140 76 100 60Z" fill="#c9a4ff" stroke="#fff" stroke-width="5" opacity=".92"/><path d="M100 62 C70 70 30 100 46 124 C62 136 90 110 100 70Z" fill="#ff9cc8" stroke="#fff" stroke-width="5" opacity=".92"/><path d="M100 62 C130 70 170 100 154 124 C138 136 110 110 100 70Z" fill="#ff9cc8" stroke="#fff" stroke-width="5" opacity=".92"/><circle cx="46" cy="40" r="9" fill="#fff" opacity=".6"/><circle cx="154" cy="40" r="9" fill="#fff" opacity=".6"/></svg>';
S.tiara='<svg viewBox="0 0 120 60"><path d="M8 54 L20 22 L38 40 L60 4 L82 40 L100 22 L112 54Z" fill="#e8f4ff" stroke="#9ec9ff" stroke-width="4"/><circle cx="60" cy="30" r="9" fill="#7ed6ff" stroke="#fff" stroke-width="3"/><circle cx="30" cy="44" r="5" fill="#ff7eb6"/><circle cx="90" cy="44" r="5" fill="#ff7eb6"/></svg>';
function star(cx,cy,r,c){var p='';for(var i=0;i<10;i++){var a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;p+=(i?'L':'M')+(cx+rr*Math.cos(a)).toFixed(1)+' '+(cy+rr*Math.sin(a)).toFixed(1);}return '<path d="'+p+'Z" fill="'+c+'" stroke="#7a2a8a" stroke-width="3"/>';}
var ITEMS=[
 {id:'heartclip',price:10,name:'بكلة قلب',slot:'clipL',w:30,r:1,al:'center',front:S.heartclip,tip:'بكلة قلب 💗'},
 {id:'starsun',price:15,name:'نظارة نجوم',slot:'eyes',w:70,r:.4,al:'center',front:S.starsun,tip:'نظارة النجوم 🌟'},
 {id:'bowGold',price:20,name:'فيونكة ذهبية',slot:'bowR',w:42,r:.7,al:'center',front:S.bowGold,tip:'فيونكة ذهبية ✨'},
 {id:'fcrown',price:25,name:'تاج ورد',slot:'top',w:86,r:.36,al:'bottom',dy:4,front:S.fcrown,tip:'تاج الورد 🌸'},
 {id:'purse',price:30,name:'شنطة يد',slot:'hand',w:40,r:1,al:'top',dy:-4,front:S.purse,tip:'شنطة يد حلوة 👛'},
 {id:'balloon',price:35,name:'بالون',slot:'hand',w:30,r:2.5,al:'bottom',dy:10,front:S.balloon,tip:'بالون قلب 🎈'},
 {id:'wings',price:50,name:'جناح فراشة',slot:'cape',w:200,r:.65,al:'top',dy:-12,back:S.wings,icon:S.wings,tip:'جناح الفراشة 🦋'},
 {id:'tiara',price:60,name:'تاج الماس',slot:'top',w:64,r:.5,al:'bottom',dy:2,front:S.tiara,tip:'تاج الماس 💎'}
];
ITEMS.forEach(function(it){ACC[it.id]=it;TOOLS[it.id]={name:it.name,svg:it.icon||it.front,tip:it.tip};});
var owned=[];try{owned=JSON.parse(localStorage.getItem('ghalia_owned')||'[]');}catch(e){owned=[];}
function save(){try{localStorage.setItem('ghalia_owned',JSON.stringify(owned));}catch(e){}}
function has(id){return owned.indexOf(id)>=0;}
/* bought items show up in the dress-up room toolbar */
var dressBase=ROOMS.dress.tools.slice();
Object.defineProperty(ROOMS.dress,'tools',{get:function(){return dressBase.concat(ITEMS.filter(function(i){return has(i.id);}).map(function(i){return i.id;}));},configurable:true});

var BG='<svg class="bg" viewBox="0 0 1280 720"><defs><linearGradient id="shg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe6f3"/><stop offset="1" stop-color="#ffc2e0"/></linearGradient></defs><rect width="1280" height="720" fill="url(#shg)"/>'+
 (function(){var s='';for(var i=0;i<16;i++){s+='<path d="M'+(i*80)+' 0 h40 l-20 46z" fill="'+(i%2?'#ff5fa2':'#fff')+'"/>';}return s;})()+
 '<rect x="0" y="600" width="1280" height="120" fill="#f7a8cf"/><rect x="0" y="600" width="1280" height="10" fill="#ff7eb6"/>'+
 '<rect x="930" y="120" width="300" height="380" rx="150" fill="#fff" opacity=".55"/><rect x="950" y="140" width="260" height="340" rx="130" fill="#e9f7ff" opacity=".7"/></svg>';
ROOMS.shop={name:'المحل',color:'linear-gradient(135deg,#fff1a8,#ffb3d9)',bg:BG,tools:[],noCarousel:true,noWalk:true,noWander:true,charH:380,
 icon:'<svg viewBox="0 0 100 100"><path d="M10 40 L18 14 H82 L90 40Z" fill="#ff5fa2"/><path d="M10 40 Q20 52 30 40 Q40 52 50 40 Q60 52 70 40 Q80 52 90 40" fill="#fff" stroke="#ff5fa2" stroke-width="3"/><rect x="16" y="46" width="68" height="44" rx="6" fill="#fff" stroke="#ff5fa2" stroke-width="4"/><circle cx="50" cy="68" r="14" fill="#ffd34d" stroke="#e0a400" stroke-width="4"/><text x="50" y="75" font-size="18" text-anchor="middle" fill="#a06800" font-weight="900">$</text></svg>',
 spawn:{ghalia:[1080,690,1]},
 intro:'أهلاً بالمحل! 🛍️ اشتري أغراض حلوة بالعملات 🪙',
 init:function(r){var sc=A.scene();
  var grid=document.createElement('div');grid.className='shopgrid';sc.appendChild(grid);
  var hint=document.createElement('div');hint.className='shopnote';hint.textContent='🪙 اجمعي عملات من الألعاب والمدرسة';sc.appendChild(hint);
  var go=document.createElement('div');go.className='gbtn shopgo';go.textContent='جربيها بغرفة الملابس 👗';sc.appendChild(go);
  go.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();sfx.pop();A.openRoom('dress');});
  function draw(){grid.innerHTML='';ITEMS.forEach(function(it){var c=document.createElement('div');var own=has(it.id),can=A.ui.coins()>=it.price;
    c.className='scard'+(own?' own':can?' can':' lock');c.dataset.id=it.id;
    c.innerHTML='<div class="sico">'+(it.icon||it.front)+'</div><div class="snm">'+it.name+'</div><div class="spr">'+(own?'✔ عندج':'🪙 '+it.price)+'</div>';
    c.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();tapItem(it,c);});grid.appendChild(c);});}
  function tapItem(it,c){
    if(has(it.id)){A.wear('ghalia',it.id);sfx.sparkle();say(it.tip+' تجنن عليج!');return;}
    var need=it.price-A.ui.coins();
    if(need>0){sfx.oops();c.animate([{transform:'translateX(0)'},{transform:'translateX(-10px)'},{transform:'translateX(10px)'},{transform:'translateX(0)'}],{duration:300});say('باقي '+need+' 🪙 — العبي ألعاب وجمعي عملات! 🎮');return;}
    A.ui.addCoins(-it.price);owned.push(it.id);save();sfx.tada();A.confetti();A.wear('ghalia',it.id);
    say('مبروك! '+it.tip+' صار عندج 🎉 تلاقينه بغرفة الملابس');draw();}
  draw();
 }
};
GAME.ORDER.push('shop');
})();
/* 3D classroom (separate page class3d.html) */
(function(){var A=GAME.api,ROOMS=GAME.ROOMS;
ROOMS.class3d={name:'الصف ثلاثي الأبعاد',color:'linear-gradient(135deg,#d9f1ff,#c9a4ff)',bg:'<svg class="bg" viewBox="0 0 1280 720"><rect width="1280" height="720" fill="#e9dcff"/></svg>',tools:[],noCarousel:true,noWalk:true,noWander:true,
 icon:'<svg viewBox="0 0 100 100"><path d="M50 8 L92 30 L50 52 L8 30Z" fill="#ff9ec4"/><path d="M8 30 V72 L50 94 V52Z" fill="#c77dff"/><path d="M92 30 V72 L50 94 V52Z" fill="#9b5de5"/><text x="50" y="38" font-size="20" font-weight="900" text-anchor="middle" fill="#fff">3D</text></svg>',
 init:function(){A.sfx.pop();setTimeout(function(){location.href='class3d.html';},200);}};
GAME.ORDER.push('class3d');A.go3d=function(){location.href='class3d.html';};
if(location.hash==='#menu'){setTimeout(function(){try{A.goMenu();}catch(e){}},50);}
})();
