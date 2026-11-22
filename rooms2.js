/* Bathroom, wardrobe, makeup, masks, nails */
(function(){
'use strict';
var A=GAME.api,ROOMS=GAME.ROOMS,ORDER=GAME.ORDER,TOOLS=A.TOOLS,ACC=A.ACC,SV=A.SV,CH=A.CH,OUT=A.OUTFITS;
var say=A.say,sfx=A.sfx,burst=A.burst,el=A.el,inRect=A.inRect;
function R(){return A.getR();}
function lay(who,html,x,y,w,h,cls){var c=R().chars[who];if(!c)return null;var d=document.createElement('div');d.className='lay '+(cls||'');d.style.left=x+'%';d.style.top=y+'%';d.style.width=w+'%';d.style.height=h+'%';d.innerHTML=html;c.appendChild(d);return d;}
function popIn(e){e.animate([{transform:'scale(0)'},{transform:'scale(1.2)'},{transform:'scale(1)'}],{duration:380,easing:'ease-out'});}
var bubbleSVG=(function(){var s='<svg viewBox="0 0 100 60">';var pts=[[20,40,16],[40,30,20],[62,34,18],[80,42,14],[50,46,14],[30,20,10],[70,18,12]];pts.forEach(function(p){s+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+p[2]+'" fill="#fff" stroke="#cfe8ff" stroke-width="2"/><circle cx="'+(p[0]-p[2]/3)+'" cy="'+(p[1]-p[2]/3)+'" r="'+(p[2]/4)+'" fill="#e6f4ff"/>';});return s+'</svg>';})();
function floatBubble(x,y){var b=document.createElement('div');b.className='spk';var sz=A.rnd(14,34);b.style.cssText='left:'+x+'px;top:'+y+'px;width:'+sz+'px;height:'+sz+'px;border-radius:50%;border:2px solid #bfe6ff;background:radial-gradient(circle at 30% 30%,#ffffffee,#bfe6ff44 60%,#ff9cc833)';A.fx.appendChild(b);
  var an=b.animate([{transform:'translate(0,0)',opacity:.9},{transform:'translate('+A.rnd(-40,40)+'px,-'+A.rnd(120,260)+'px)',opacity:0}],{duration:A.rnd(1800,3000),easing:'ease-out'});an.onfinish=function(){b.remove();};}

/* ================= BATHROOM ================= */
SV.soap='<svg viewBox="0 0 100 100"><rect x="14" y="40" width="72" height="44" rx="20" fill="#ffb3d1"/><rect x="22" y="46" width="56" height="14" rx="7" fill="#fff" opacity=".5"/>'+'<circle cx="30" cy="30" r="10" fill="#fff" stroke="#bfe6ff" stroke-width="3"/><circle cx="52" cy="22" r="13" fill="#fff" stroke="#bfe6ff" stroke-width="3"/><circle cx="72" cy="32" r="8" fill="#fff" stroke="#bfe6ff" stroke-width="3"/></svg>';
SV.shampoo='<svg viewBox="0 0 100 100"><rect x="40" y="6" width="20" height="16" rx="4" fill="#ff5fa2"/><path d="M30 24 h40 q10 0 10 12 v50 q0 10 -10 10 h-40 q-10 0 -10 -10 v-50 q0 -12 10 -12z" fill="#b388ff"/><rect x="30" y="44" width="40" height="30" rx="8" fill="#fff"/>'+A.fl5(50,59,6,'#ff7eb6','#ffd34d')+'</svg>';
SV.duck='<svg viewBox="0 0 100 100"><ellipse cx="50" cy="70" rx="38" ry="22" fill="#ffd34d"/><circle cx="62" cy="38" r="20" fill="#ffd34d"/><path d="M80 40 l16 4 -16 6z" fill="#ff9a3c"/><circle cx="68" cy="34" r="4" fill="#333"/><path d="M24 64 q14 -10 30 0" stroke="#f0b400" stroke-width="5" fill="none"/></svg>';
SV.towel='<svg viewBox="0 0 100 100"><rect x="14" y="18" width="72" height="70" rx="12" fill="#7ed6ff"/><rect x="14" y="70" width="72" height="8" fill="#fff"/><rect x="14" y="26" width="72" height="8" fill="#fff"/><path d="M14 30 q-8 30 4 58" stroke="#5cb8f5" stroke-width="6" fill="none"/></svg>';
SV.dryer='<svg viewBox="0 0 100 100"><rect x="44" y="50" width="18" height="44" rx="8" fill="#ff5fa2"/><path d="M14 22 h46 a26 26 0 0 1 0 52 h-46 z" fill="#ff8fc0"/><circle cx="60" cy="48" r="16" fill="#ffd0e5"/><circle cx="60" cy="48" r="7" fill="#ff5fa2"/><rect x="2" y="28" width="16" height="40" rx="6" fill="#e0457f"/></svg>';
TOOLS.soap={name:'صابون',svg:SV.soap,tip:'صابون فقاقيع 🫧'};TOOLS.shampoo={name:'شامبو',svg:SV.shampoo,tip:'شامبو للشعر 🧴'};TOOLS.duck={name:'بطوطة',svg:SV.duck,tip:'البطة تسبح بالبانيو 🐤'};
TOOLS.towel={name:'منشفة',svg:SV.towel,tip:'المنشفة عشان ننشف 🧺'};TOOLS.dryer={name:'سشوار',svg:SV.dryer,tip:'امسكي السشوار فوق الشعر شوي 💨'};
var TOWELHAT='<svg viewBox="0 0 100 60"><path d="M6 56 C2 10 98 10 94 56 Z" fill="#7ed6ff"/><path d="M20 30 q30 -24 60 0" stroke="#fff" stroke-width="6" fill="none"/><path d="M80 14 q18 -4 14 18 q-8 -12 -14 -18z" fill="#5cb8f5"/></svg>';
var HBG='<svg class="bg" viewBox="0 0 1280 720"><defs><pattern id="htl" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="#e4f6ff"/><rect x="2" y="2" width="56" height="56" rx="8" fill="#f3fbff"/></pattern><pattern id="hfl" width="70" height="70" patternUnits="userSpaceOnUse"><rect width="70" height="70" fill="#ffd6ea"/><rect width="35" height="35" fill="#fff"/><rect x="35" y="35" width="35" height="35" fill="#fff"/></pattern></defs>'+
'<rect width="1280" height="720" fill="url(#htl)"/><rect y="580" width="1280" height="140" fill="url(#hfl)"/><rect y="572" width="1280" height="12" fill="#9fd6f5"/>'+
'<rect x="280" y="90" width="220" height="510" rx="20" fill="#d4f0ff" stroke="#9fd6f5" stroke-width="6" opacity=".9"/><path d="M380 70 V110 h40" stroke="#b0b8c4" stroke-width="10" fill="none" stroke-linecap="round"/><ellipse cx="430" cy="118" rx="36" ry="12" fill="#c0c8d4"/>'+
'<path d="M270 80 h20 q-10 260 0 520 h-20z" fill="#ff9cc8"/><rect x="260" y="70" width="260" height="12" rx="6" fill="#c0c8d4"/>'+
'<rect x="980" y="140" width="150" height="190" rx="70" fill="#ffd34d"/><rect x="992" y="152" width="126" height="166" rx="60" fill="#e9f7ff"/><rect x="960" y="380" width="180" height="20" rx="8" fill="#fff" stroke="#9fd6f5" stroke-width="4"/><rect x="1020" y="400" width="60" height="170" rx="10" fill="#fff" stroke="#9fd6f5" stroke-width="4"/>'+
'<g transform="translate(160 200)"><rect width="60" height="120" rx="10" fill="#fff" stroke="#ff9cc8" stroke-width="4"/><rect x="10" y="20" width="40" height="80" rx="8" fill="#ffb3d1"/></g>'+
'</svg>';
var TUB_B='<svg viewBox="0 0 420 200"><rect x="370" y="0" width="16" height="80" rx="6" fill="#c0c8d4"/><path d="M386 10 h-30" stroke="#c0c8d4" stroke-width="12" stroke-linecap="round"/><ellipse cx="210" cy="140" rx="200" ry="40" fill="#bfe6ff"/></svg>';
var TUB_F='<svg viewBox="0 0 440 180"><path d="M0 20 H440 V60 Q440 150 330 160 H110 Q0 150 0 60Z" fill="#fff" stroke="#ff9cc8" stroke-width="6"/><rect x="0" y="10" width="440" height="22" rx="11" fill="#ff9cc8"/><path d="M40 60 Q60 120 120 140" stroke="#ffe3f1" stroke-width="10" fill="none" stroke-linecap="round"/><rect x="60" y="150" width="30" height="30" rx="8" fill="#ffd34d"/><rect x="350" y="150" width="30" height="30" rx="8" fill="#ffd34d"/></svg>';
var FOAM=(function(){var s='<svg viewBox="0 0 440 70">';for(var i=0;i<16;i++){var x=20+i*27,r=14+(i*7%9);s+='<circle cx="'+x+'" cy="'+(40-(i%3)*6)+'" r="'+r+'" fill="#fff" stroke="#d6eeff" stroke-width="2"/>';}return s+'</svg>';})();
function headFoam(who,on){var r=R(),c=r.chars[who];if(!c)return;var f=c.querySelector('.foamh');if(on&&!f){f=lay(who,bubbleSVG,8,-4,84,16,'foamh');popIn(f);}else if(!on&&f)f.remove();}
function towelHat(who,on){var r=R(),c=r.chars[who];if(!c)return;var f=c.querySelector('.towh');if(on&&!f){f=lay(who,TOWELHAT,6,-3,88,17,'towh');popIn(f);}else if(!on&&f)f.remove();}
ROOMS.bath={name:'الحمام',color:'linear-gradient(135deg,#d4f0ff,#6ec6ff)',charH:290,
 icon:'<svg viewBox="0 0 100 100"><path d="M8 50 H92 V60 Q92 86 70 86 H30 Q8 86 8 60Z" fill="#fff" stroke="#ff9cc8" stroke-width="4"/>'+'<g fill="#fff" stroke="#9fd6f5" stroke-width="2"><circle cx="26" cy="44" r="10"/><circle cx="44" cy="38" r="13"/><circle cx="64" cy="42" r="11"/><circle cx="80" cy="46" r="8"/></g><path d="M82 50 V16 h-14" stroke="#c0c8d4" stroke-width="5" fill="none"/></svg>',
 bg:HBG,tools:['soap','shampoo','duck','towel','dryer'],
 spawn:{ghalia:[170,700,1],khala:[1060,712]},
 intro:'وقت الشاور! اسحبي غالية للدش أو للبانيو 🛁',
 init:function(r){r.place=null;r.wet=false;r.foam=false;r.towel=false;r.dry=0;
   r.tubB=el(TUB_B,'',540,380,420,200,5);r.tubF=el(TUB_F,'',530,480,440,180,12);r.foamEl=el(FOAM,'',530,452,440,70,13);r.foamEl.style.opacity='0';r.foamEl.style.transition='opacity .6s';
   r.timers.push(setInterval(function(){if(r.place==='shower'){for(var i=0;i<4;i++){var d=document.createElement('div');d.className='drop';var x=A.rnd(395,465);d.style.left=x+'px';d.style.top='125px';A.fx.appendChild(d);(function(d){var an=d.animate([{transform:'translateY(0)',opacity:.9},{transform:'translateY('+A.rnd(250,420)+'px)',opacity:.2}],{duration:700,easing:'ease-in'});an.onfinish=function(){d.remove();};})(d);}if(Math.random()<.3)sfx.water();}
     if(r.place==='tub'&&Math.random()<.5)floatBubble(A.rnd(560,940),A.rnd(440,480));},140));},
 charDrop:function(who,x,y){var r=R();
   if(who!=='ghalia'){if(inRect({x:x,y:y},260,0,980,720)&&(Math.abs(x-390)<120||(x>530&&x<970))){say('هذا لغالية 😄 خالتج تساعدها');A.putChar(who,1060,712);return true;}return false;}
   if(Math.abs(x-390)<120&&y>300){r.place='shower';r.wet=true;r.foamEl.style.opacity='0';A.putChar('ghalia',430,600);sfx.water();say('شاور! المي حلوة 🚿 حطي الشامبو أو الصابون');return true;}
   if(x>530&&x<970&&y>380){r.place='tub';r.wet=true;A.putChar('ghalia',750,610);r.foamEl.style.opacity='1';sfx.pop();burst(750,470,12,['#fff','#bfe6ff','#ff9cc8']);say('البانيو كله فقاقيع! 🫧 حطي البطوطة');return true;}
   r.place=null;r.foamEl.style.opacity='0';return false;},
 drop:function(id,p){var r=R();var t=A.charAt(p);
   if(id==='duck'){if(!inRect(p,530,380,980,620))return false;if(!r.duck){r.duck=el(SV.duck,'',A.clamp(p.x,580,880)-35,430,70,70,14);r.duck.animate([{transform:'translateY(0)'},{transform:'translateY(-8px) rotate(-6deg)'},{transform:'translateY(0)'}],{duration:1400,iterations:Infinity});}sfx.pop();say('كواك كواك! 🐤');return true;}
   if(t!=='ghalia')return false;
   if(id==='soap'||id==='shampoo'){if(!r.place){say('حطي غالية بالدش أو البانيو أول 🛁');return false;}r.foam=true;towelHat('ghalia',false);headFoam('ghalia',true);sfx.sparkle();for(var i=0;i<8;i++)floatBubble(p.x+A.rnd(-40,40),p.y);say('فقاقيع فقاقيع! 🫧 بعدين المنشفة');A.hintTool('towel');return true;}
   if(id==='towel'){headFoam('ghalia',false);r.foam=false;r.wet=false;towelHat('ghalia',true);r.towel=true;sfx.pop();burst(p.x,p.y,10);say('نظيفة وحلوة! 💙 الحين السشوار');A.hintTool('dryer');return true;}
   if(id==='dryer')return 'back';return false;},
 tick:function(id,c){if(id!=='dryer')return;var r=R();if(A.charAt(c.hp)!=='ghalia')return;c.n=(c.n||0)+1;if(c.n%2===0){sfx.water();burst(c.hp.x-40,c.hp.y,3,['#ffffff','#bfe6ff']);}
   if(r.towel||r.foam){r.dry++;if(r.dry>=14){r.dry=0;r.towel=false;towelHat('ghalia',false);headFoam('ghalia',false);r.chars.ghalia.classList.add('shine');sfx.sparkle();var h=A.headOf('ghalia');burst(h.x,h.y,18);say('شعرج صار ناشف ويلمع ✨ تجننين!');A.hintTool(null);}}}
};

/* ================= WARDROBE (outfits, shoes, bags) ================= */
function outfit(main,acc,patt){
  var s='<svg viewBox="0 0 202 600">';
  s+='<path d="M47 183 Q22 186 10 205 L2 352 L37 354 L52 244 Z" fill="'+main+'"/><path d="M155 183 Q180 186 192 205 L200 352 L165 354 L150 244 Z" fill="'+main+'"/>';
  s+='<path d="M68 168 Q101 186 134 168 L156 183 L150 244 L148 292 Q168 400 188 504 Q101 522 14 504 Q34 400 54 292 L52 244 L46 183 Z" fill="'+main+'"/>';
  s+='<rect x="1" y="338" width="37" height="16" rx="6" fill="'+acc+'"/><rect x="164" y="338" width="37" height="16" rx="6" fill="'+acc+'"/>';
  s+='<path d="M53 286 Q101 298 149 286 L149 302 Q101 314 53 302Z" fill="'+acc+'"/><path d="M14 504 Q101 522 188 504 L190 492 Q101 510 12 492Z" fill="'+acc+'"/>';
  s+='<path d="M72 170 Q86 196 101 182 Q116 196 130 170 Q101 186 72 170Z" fill="#fff" opacity=".95"/>';
  s+='<path d="M70 200 Q60 260 66 286" stroke="#fff" stroke-width="5" opacity=".25" fill="none"/>';
  if(patt==='dots'){for(var i=0;i<16;i++){s+='<circle cx="'+(40+(i*37)%124)+'" cy="'+(330+Math.floor(i/4)*42+(i%2)*10)+'" r="5" fill="#fff" opacity=".7"/>';}}
  if(patt==='flowers'){for(var j=0;j<8;j++){s+=A.fl5(44+(j*41)%118,342+Math.floor(j/3)*52,5,'#fff',acc);}}
  if(patt==='stars'){for(var k=0;k<10;k++){var x=40+(k*31)%124,y=330+Math.floor(k/3)*46;s+='<path d="M'+x+' '+(y-8)+' l2.5 6 6 2 -6 2 -2.5 6 -2.5 -6 -6 -2 6 -2z" fill="'+acc+'"/>';}}
  if(patt==='hearts'){for(var h=0;h<8;h++){var hx=46+(h*39)%112,hy=340+Math.floor(h/3)*50;s+='<path d="M'+hx+' '+(hy+8)+' c-10 -7 -11 -14 -6 -16 c3 -1 5 1 6 3 c1 -2 3 -4 6 -3 c5 2 4 9 -6 16z" fill="'+acc+'"/>';}}
  return s+'</svg>';}
OUT.dPink=outfit('#ff8fc0','#ffffff','stars');OUT.dLav=outfit('#c9a4ff','#ffd34d','flowers');OUT.dBlue=outfit('#7ec8ff','#ffd34d','dots');OUT.dMint=outfit('#8fe3c0','#ff7eb6','hearts');
function dressIcon(id){return OUT[id].replace('viewBox="0 0 202 600"','viewBox="-40 150 282 380"');}
TOOLS.dPink={name:'فستان وردي',svg:dressIcon('dPink'),tip:'فستان وردي طويل 💗'};TOOLS.dLav={name:'فستان ورد',svg:dressIcon('dLav'),tip:'فستان بنفسجي بالورد 🌼'};
TOOLS.dBlue={name:'دراعة',svg:dressIcon('dBlue'),tip:'دراعة زرقا 💙'};TOOLS.dMint={name:'فستان قلوب',svg:dressIcon('dMint'),tip:'فستان أخضر بالقلوب 💚'};
var SHOES='<svg viewBox="0 0 202 76"><g fill="#ff5fa2" stroke="#d81b74" stroke-width="3"><path d="M22 30 Q22 12 52 12 Q84 12 86 40 L86 62 Q54 72 20 62Z"/><path d="M116 40 Q118 12 150 12 Q180 12 182 30 L184 62 Q150 72 116 62Z"/></g><rect x="18" y="58" width="70" height="10" rx="5" fill="#fff"/><rect x="114" y="58" width="72" height="10" rx="5" fill="#fff"/><g fill="#fff6a8"><circle cx="54" cy="34" r="7"/><circle cx="148" cy="34" r="7"/></g></svg>';
var BAG='<svg viewBox="0 0 70 80"><path d="M20 30 Q20 4 35 4 Q50 4 50 30" stroke="#d81b74" stroke-width="5" fill="none"/><path d="M6 30 H64 L58 76 H12Z" fill="#ff7eb6"/><path d="M35 66 C18 54 16 42 24 39 C29 37 34 41 35 44 C36 41 41 37 46 39 C54 42 52 54 35 66Z" fill="#fff"/></svg>';
ACC.shoes={slot:'feet',w:100,r:76/202,al:'bottom',dy:0,front:SHOES,name:'جوتي',tip:'جوتي يلمع 👟'};
ACC.bag={slot:'bag',w:34,r:80/70,al:'top',front:BAG,name:'جنطة',tip:'جنطة قلب 👜'};
A.SLOTS.ghalia.feet={x:50,y:100.5};A.SLOTS.ghalia.bag={x:12,y:57};A.SLOTS.khala.feet={x:50,y:100.5};A.SLOTS.khala.bag={x:10,y:56};
TOOLS.shoes={name:'جوتي',svg:SHOES.replace('viewBox="0 0 202 76"','viewBox="0 -60 202 196"'),tip:ACC.shoes.tip};TOOLS.bag={name:'جنطة',svg:BAG,tip:ACC.bag.tip};
SV.uniform='<svg viewBox="0 0 100 100"><path d="M30 14 h40 l10 14 -6 66 h-48 l-6 -66z" fill="#1f2d5c"/><path d="M38 14 Q50 26 62 14" fill="#a9c8f0"/><rect x="34" y="56" width="12" height="12" rx="2" fill="none" stroke="#3a4a80" stroke-width="2"/><rect x="54" y="56" width="12" height="12" rx="2" fill="none" stroke="#3a4a80" stroke-width="2"/></svg>';
TOOLS.uniform={name:'المريول',svg:SV.uniform,tip:'مريول المدرسة 🏫'};
var WBG='<svg class="bg" viewBox="0 0 1280 720"><defs><linearGradient id="wwl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe3f1"/><stop offset="1" stop-color="#ffc2dc"/></linearGradient></defs><rect width="1280" height="720" fill="url(#wwl)"/><rect y="580" width="1280" height="140" fill="#f3d1b0"/>'+
'<rect x="140" y="80" width="840" height="500" rx="26" fill="#fff" stroke="#ff9cc8" stroke-width="10"/><rect x="160" y="100" width="380" height="460" rx="14" fill="#fdeaf4"/><rect x="580" y="100" width="380" height="460" rx="14" fill="#fdeaf4"/><rect x="170" y="140" width="360" height="8" rx="4" fill="#c0a0b0"/><rect x="590" y="140" width="360" height="8" rx="4" fill="#c0a0b0"/>'+
(function(){var s='',c=['#ff8fc0','#c9a4ff','#7ec8ff','#8fe3c0','#ffd34d','#ffb3d1'];for(var i=0;i<6;i++){var x=185+i*58;s+='<path d="M'+(x+20)+' 148 v8 M'+x+' 160 h40 l6 40 l8 150 h-68 l8 -150z" fill="'+c[i]+'" stroke="#0001"/>';}for(var j=0;j<3;j++){var y=380+j*0;}s+='<rect x="590" y="420" width="360" height="10" rx="5" fill="#e0c0d0"/><rect x="590" y="300" width="360" height="10" rx="5" fill="#e0c0d0"/>';
 for(var k=0;k<4;k++){s+='<path d="M'+(620+k*85)+' 410 q0 -24 30 -24 q24 0 26 24z" fill="'+c[k]+'"/>';s+='<path d="M'+(615+k*85)+' 292 h44 l-4 -40 h-36z" fill="'+c[(k+2)%6]+'"/><path d="M'+(625+k*85)+' 254 q12 -20 24 0" stroke="'+c[(k+2)%6]+'" stroke-width="4" fill="none"/>';}
 s+='<rect x="590" y="460" width="360" height="90" rx="12" fill="#ffd0e5"/><circle cx="770" cy="505" r="8" fill="#ff5fa2"/>';return s;})()+
'<ellipse cx="1040" cy="670" rx="120" ry="30" fill="#ff9cc8"/></svg>';
ROOMS.wardrobe={name:'الخزانة',color:'linear-gradient(135deg,#ffe3f1,#ff6fae)',charH:390,
 icon:'<svg viewBox="0 0 100 100"><rect x="10" y="8" width="80" height="86" rx="10" fill="#fff" stroke="#ff5fa2" stroke-width="5"/><path d="M50 8 V94" stroke="#ff5fa2" stroke-width="4"/>'+'<path d="M22 24 h18 l4 50 h-26z" fill="#c9a4ff"/><path d="M60 24 h18 l4 50 h-26z" fill="#ff8fc0"/><circle cx="45" cy="56" r="3" fill="#ff5fa2"/><circle cx="55" cy="56" r="3" fill="#ff5fa2"/></svg>',
 bg:WBG,tools:['dPink','dLav','dBlue','dMint','shoes','bag','uniform'],
 spawn:{ghalia:[1040,680,1],khala:[90,712]},
 intro:'افتحي الخزانة! اختاري فستان طويل حق غالية 👗',
 canWear:function(t){return t==='ghalia';},
 drop:function(id,p){var t=A.charAt(p,40);if(!t)return false;if(t!=='ghalia'){say('هذي ملابس غالية 😄 خالتج عندها ملابسها');return false;}
   if(OUT[id]||id==='uniform'){if(id==='uniform')delete CH.ghalia.outfit;else CH.ghalia.outfit=id;A.renderAcc('ghalia');var c=R().chars.ghalia;var o=c.querySelector('.outfit');if(o)popIn(o);sfx.sparkle();burst(c._x,c._y-c._h*.5,18);A.hop(c);say(TOOLS[id].tip+' '+A.pick(['تجننين! 😍','صرتي أميرة 👑','يهبل عليج ✨']));return true;}
   A.wear('ghalia',id);say(TOOLS[id].tip);return true;},
 onReset:function(){delete CH.ghalia.outfit;delete CH.ghalia.acc.shoes;delete CH.ghalia.acc.feet;delete CH.ghalia.acc.bag;}
};
/* tool bar holds 7 here: slightly smaller tiles */

/* ================= close-up helpers (makeup & masks) ================= */
var BUST={x:340,y:150,w:434*1.05,h:535*1.05};
var FACE={eyeL:[36.9,47.1],eyeR:[63.8,48.8],cheekL:[29.3,60.4],cheekR:[71,60.4],mouth:[49.3,66.9],fore:[49.3,31.4]};
function bustEl(r){var b=el('<img src="img/ghalia_bust.png" alt="" draggable="false" style="width:100%;height:100%">','',BUST.x,BUST.y,BUST.w,BUST.h,10);b.style.pointerEvents='none';
  var L=document.createElement('div');L.style.cssText='position:absolute;inset:0';b.appendChild(L);r.bust=b;r.bl=L;return b;}
function toBust(p){return {x:(p.x-BUST.x)/BUST.w*100,y:(p.y-BUST.y)/BUST.h*100};}
function onFace(p){var q=toBust(p);return q.x>18&&q.x<84&&q.y>22&&q.y<82;}
function bpos(px,py){return {x:BUST.x+BUST.w*px/100,y:BUST.y+BUST.h*py/100};}
function bl(r,html,cx,cy,w,h,cls){var d=document.createElement('div');d.className='lay '+(cls||'');d.style.left=(cx-w/2)+'%';d.style.top=(cy-h/2)+'%';d.style.width=w+'%';d.style.height=h+'%';d.innerHTML=html;r.bl.appendChild(d);popIn(d);return d;}
function nearest(q,keys){var best=null,bd=1e9;keys.forEach(function(k){var d=Math.hypot(q.x-FACE[k][0],q.y-FACE[k][1]);if(d<bd){bd=d;best=k;}});return best;}
function vanity(color){return '<svg class="bg" viewBox="0 0 1280 720"><defs><radialGradient id="vg'+color.slice(1)+'" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="'+color+'"/></radialGradient></defs><rect width="1280" height="720" fill="url(#vg'+color.slice(1)+')"/>'+
 '<rect x="290" y="110" width="560" height="600" rx="60" fill="#ffd34d" stroke="#e0a400" stroke-width="6"/><rect x="310" y="130" width="520" height="580" rx="48" fill="#eaf7ff"/>'+
 (function(){var s='';for(var i=0;i<6;i++){s+='<circle cx="300" cy="'+(170+i*90)+'" r="13" fill="#fffbe0" stroke="#f0c040" stroke-width="3"/><circle cx="840" cy="'+(170+i*90)+'" r="13" fill="#fffbe0" stroke="#f0c040" stroke-width="3"/>';}return s;})()+
 '<path d="M360 200 l60 -60 M360 260 l110 -110" stroke="#fff" stroke-width="14" stroke-linecap="round" opacity=".8"/>'+
 '<rect x="0" y="640" width="1280" height="80" fill="#ff9cc8"/><rect x="0" y="630" width="1280" height="16" fill="#ffb3d1"/>'+
 '<g transform="translate(70 520)"><rect width="50" height="110" rx="10" fill="#c9a4ff"/><rect x="60" y="30" width="60" height="80" rx="14" fill="#7ed6ff"/><circle cx="160" cy="80" r="30" fill="#ffd34d"/></g>'+
 '<g transform="translate(900 540)"><rect width="70" height="90" rx="14" fill="#ffb3d1"/><rect x="85" y="20" width="40" height="70" rx="10" fill="#b388ff"/><rect x="140" y="40" width="80" height="50" rx="20" fill="#fff" stroke="#ff9cc8" stroke-width="4"/></g></svg>';}

/* ================= MAKEUP (kid play) ================= */
SV.blush='<svg viewBox="0 0 100 100"><circle cx="50" cy="54" r="40" fill="#ffd34d"/><circle cx="50" cy="54" r="32" fill="#ff9cb8"/><circle cx="40" cy="44" r="8" fill="#fff" opacity=".5"/><rect x="58" y="6" width="10" height="44" rx="5" fill="#e0457f" transform="rotate(30 63 28)"/></svg>';
SV.gloss='<svg viewBox="0 0 100 100"><rect x="38" y="6" width="24" height="34" rx="8" fill="#ff5fa2"/><rect x="34" y="38" width="32" height="56" rx="10" fill="#ffd0e5" stroke="#ff5fa2" stroke-width="4"/><rect x="40" y="50" width="20" height="34" rx="6" fill="#ff7eb6"/><circle cx="46" cy="58" r="3" fill="#fff"/></svg>';
SV.glit='<svg viewBox="0 0 100 100"><path d="M50 6 L58 38 L92 42 L64 60 L72 94 L50 72 L28 94 L36 60 L8 42 L42 38Z" fill="#ffd34d" stroke="#f0a800" stroke-width="4"/><circle cx="80" cy="16" r="5" fill="#b388ff"/><circle cx="18" cy="20" r="4" fill="#ff7eb6"/></svg>';
SV.heartp='<svg viewBox="0 0 100 100"><path d="M50 88 C14 64 8 38 22 26 C34 16 46 24 50 34 C54 24 66 16 78 26 C92 38 86 64 50 88Z" fill="#ff5fa2"/><path d="M30 36 q6 -8 14 -4" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/></svg>';
SV.flwr='<svg viewBox="0 0 100 100">'+A.fl5(50,50,20,'#c9a4ff','#ffd34d')+'</svg>';
SV.wipe='<svg viewBox="0 0 100 100"><circle cx="50" cy="52" r="38" fill="#fff" stroke="#e0e0f0" stroke-width="4"/><circle cx="50" cy="52" r="24" fill="none" stroke="#f0f0f8" stroke-width="4"/><path d="M80 14 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#7ed6ff"/></svg>';
TOOLS.blush={name:'خدود',svg:SV.blush,tip:'لون وردي للخدود 🌸'};TOOLS.gloss={name:'ملمع',svg:SV.gloss,tip:'ملمع شفايف لعب 💋'};TOOLS.glit={name:'نجوم',svg:SV.glit,tip:'ستيكر نجمة ⭐'};
TOOLS.heartp={name:'قلب',svg:SV.heartp,tip:'رسمة قلب على الخد 💗'};TOOLS.flwr={name:'وردة',svg:SV.flwr,tip:'ستيكر وردة 🌼'};TOOLS.wipe={name:'قطنة',svg:SV.wipe,tip:'القطنة تمسح كل شي 🤍'};
var BLUSH='<svg viewBox="0 0 100 60"><defs><radialGradient id="blg"><stop offset="0" stop-color="#ff6f9f" stop-opacity=".55"/><stop offset="1" stop-color="#ff6f9f" stop-opacity="0"/></radialGradient></defs><ellipse cx="50" cy="30" rx="50" ry="30" fill="url(#blg)"/></svg>';
var GLOSS='<svg viewBox="0 0 100 40"><path d="M4 14 Q50 -4 96 14 Q72 40 50 40 Q28 40 4 14Z" fill="#ff4f8b" opacity=".38"/><ellipse cx="38" cy="26" rx="10" ry="3" fill="#fff" opacity=".8"/><ellipse cx="64" cy="26" rx="6" ry="2" fill="#fff" opacity=".7"/></svg>';
ROOMS.makeup={name:'المكياج',color:'linear-gradient(135deg,#ffd6ea,#ff5fa2)',charH:280,
 icon:'<svg viewBox="0 0 100 100"><rect x="18" y="10" width="64" height="78" rx="30" fill="#ffd34d"/><rect x="26" y="18" width="48" height="62" rx="24" fill="#eaf7ff"/>'+'<path d="M50 70 C36 60 34 50 40 47 C44 45 48 48 50 51 C52 48 56 45 60 47 C66 50 64 60 50 70Z" fill="#ff5fa2"/><rect x="72" y="60" width="14" height="32" rx="5" fill="#ff7eb6"/></svg>',
 bg:vanity('#ffb3d1'),tools:['blush','gloss','glit','heartp','flwr','wipe'],spawn:{ghalia:[1060,700],khala:[150,712]},
 intro:'وقت الزينة! حطي لون وردي على خدود غالية 🌸',
 init:function(r){bustEl(r);r.blushOn=false;r.glossOn=false;},
 drop:function(id,p){var r=R();if(!onFace(p)){return false;}var q=toBust(p);
   if(id==='blush'){if(!r.blushOn){r.blushOn=true;bl(r,BLUSH,FACE.cheekL[0],FACE.cheekL[1],20,10,'mk');bl(r,BLUSH,FACE.cheekR[0],FACE.cheekR[1],20,10,'mk');}sfx.sparkle();var c1=bpos(FACE.cheekL[0],FACE.cheekL[1]),c2=bpos(FACE.cheekR[0],FACE.cheekR[1]);burst(c1.x,c1.y,6);burst(c2.x,c2.y,6);say('خدودج صارت وردية 🌸 الحين الملمع 💋');A.hintTool('gloss');return true;}
   if(id==='gloss'){if(!r.glossOn){r.glossOn=true;bl(r,GLOSS,FACE.mouth[0],FACE.mouth[1]+.3,25,7,'mk');}sfx.sparkle();var m=bpos(FACE.mouth[0],FACE.mouth[1]);burst(m.x,m.y,8);say('يلمع! ✨ حطي نجوم أو قلوب');A.hintTool(null);return true;}
   if(id==='glit'||id==='flwr'){var sz=id==='glit'?8:9;if(Math.hypot(q.x-FACE.eyeL[0],q.y-FACE.eyeL[1])<8||Math.hypot(q.x-FACE.eyeR[0],q.y-FACE.eyeR[1])<8)q.y+=9;bl(r,SV[id],q.x,q.y,sz,sz*434/535,'mk');sfx.pop();burst(p.x,p.y,6);say(A.pick(['حلو! ⭐','تلمعين مثل النجمة ✨','يهبل! 🌼']));return true;}
   if(id==='heartp'){var k=nearest(q,['cheekL','cheekR','fore']);var pt=FACE[k];bl(r,SV.heartp,pt[0]+(k==='fore'?0:(k==='cheekL'?-2:2)),pt[1]+(k==='fore'?-1:-3),9,9*434/535,'mk');sfx.pop();var c=bpos(pt[0],pt[1]);burst(c.x,c.y,8);say('قلب حلو مثل قلبج 💗');return true;}
   if(id==='wipe'){var a=r.bl.querySelectorAll('.mk');for(var i=0;i<a.length;i++)a[i].remove();r.blushOn=r.glossOn=false;sfx.sparkle();burst(p.x,p.y,12,['#ffffff','#bfe6ff']);say('نظيف! 🤍 نبدا من جديد؟');return 'back';}
   return false;}
};

/* ================= FACE MASKS ================= */
function maskSVG(c1,c2){return '<svg viewBox="0 0 434 535"><path fill-rule="evenodd" fill="'+c1+'" d="M222 186 C300 186 346 232 344 300 C342 372 296 412 222 414 C148 412 102 372 100 300 C98 232 144 186 222 186Z M128 252 a32 22 0 1 0 64 0 a32 22 0 1 0 -64 0Z M245 261 a32 22 0 1 0 64 0 a32 22 0 1 0 -64 0Z M172 358 a42 17 0 1 0 84 0 a42 17 0 1 0 -84 0Z"/>'+
 '<g fill="'+c2+'" opacity=".6"><circle cx="160" cy="210" r="6"/><circle cx="290" cy="300" r="7"/><circle cx="140" cy="320" r="5"/><circle cx="250" cy="215" r="5"/><circle cx="210" cy="300" r="6"/><circle cx="300" cy="370" r="5"/><circle cx="170" cy="395" r="5"/></g></svg>';}
SV.maskG='<svg viewBox="0 0 100 100"><rect x="14" y="40" width="72" height="50" rx="16" fill="#fff" stroke="#7be07b" stroke-width="4"/><ellipse cx="50" cy="40" rx="36" ry="12" fill="#8fe38f"/><rect x="18" y="22" width="64" height="16" rx="8" fill="#3a9d3a"/><path d="M40 70 q10 -20 20 0 q-10 10 -20 0z" fill="#7be07b"/></svg>';
SV.maskP=SV.maskG.replace(/#7be07b/g,'#ff7eb6').replace('#8fe38f','#ffb3d1').replace('#3a9d3a','#e0457f');
SV.cucumber='<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="#3a9d3a"/><circle cx="50" cy="50" r="36" fill="#c8f2b8"/><g fill="#eaffdf"><ellipse cx="50" cy="30" rx="4" ry="7"/><ellipse cx="50" cy="70" rx="4" ry="7"/><ellipse cx="30" cy="50" rx="7" ry="4"/><ellipse cx="70" cy="50" rx="7" ry="4"/><ellipse cx="36" cy="36" rx="4" ry="6" transform="rotate(-45 36 36)"/><ellipse cx="64" cy="64" rx="4" ry="6" transform="rotate(-45 64 64)"/><ellipse cx="64" cy="36" rx="4" ry="6" transform="rotate(45 64 36)"/><ellipse cx="36" cy="64" rx="4" ry="6" transform="rotate(45 36 64)"/></g></svg>';
SV.sponge='<svg viewBox="0 0 100 100"><rect x="14" y="30" width="72" height="50" rx="18" fill="#ffd34d"/><g fill="#f0b400"><circle cx="32" cy="48" r="5"/><circle cx="56" cy="44" r="4"/><circle cx="70" cy="62" r="5"/><circle cx="42" cy="66" r="4"/></g><g fill="#7ed6ff"><path d="M30 12 c-6 8 0 14 0 14 c0 0 6 -6 0 -14z"/><path d="M60 6 c-6 8 0 14 0 14 c0 0 6 -6 0 -14z"/></g></svg>';
SV.mist='<svg viewBox="0 0 100 100"><rect x="30" y="36" width="40" height="58" rx="12" fill="#c9a4ff"/><rect x="40" y="18" width="20" height="20" rx="4" fill="#ff7eb6"/><rect x="20" y="22" width="22" height="8" rx="4" fill="#ff7eb6"/>'+A.fl5(50,64,6,'#fff','#ffd34d')+'<g fill="#bfe6ff"><circle cx="10" cy="18" r="3"/><circle cx="6" cy="30" r="2.5"/><circle cx="14" cy="8" r="2"/></g></svg>';
TOOLS.maskG={name:'ماسك أخضر',svg:SV.maskG,tip:'ماسك أخضر بارد 💚'};TOOLS.maskP={name:'ماسك وردي',svg:SV.maskP,tip:'ماسك وردي ناعم 💗'};TOOLS.cucumber={name:'خيار',svg:SV.cucumber,tip:'شرايح خيار للعيون 🥒'};
TOOLS.sponge={name:'إسفنجة',svg:SV.sponge,tip:'امسكي الإسفنجة على الوجه عشان تغسلين الماسك 💧'};TOOLS.mist={name:'بخاخ',svg:SV.mist,tip:'بخاخ ورد منعش 🌹'};
var SPA=vanity('#a8ecd0').replace('#ff9cc8"/><rect x="0" y="630"','#8fe3c0"/><rect x="0" y="630"');
ROOMS.masks={name:'الماسكات',color:'linear-gradient(135deg,#d6f7e8,#5fd3a0)',charH:280,
 icon:'<svg viewBox="0 0 100 100"><ellipse cx="50" cy="52" rx="34" ry="40" fill="#8fe38f"/><circle cx="36" cy="44" r="11" fill="#c8f2b8" stroke="#3a9d3a" stroke-width="3"/><circle cx="64" cy="44" r="11" fill="#c8f2b8" stroke="#3a9d3a" stroke-width="3"/><path d="M38 70 q12 10 24 0" stroke="#e0457f" stroke-width="5" fill="none" stroke-linecap="round"/></svg>',
 bg:SPA,tools:['maskG','maskP','cucumber','sponge','mist'],spawn:{ghalia:[1060,700],khala:[150,712]},
 intro:'سبا غالية! اسحبي الماسك على وجهها 💚',
 init:function(r){bustEl(r);r.mask=null;r.cuc=[];},
 drop:function(id,p){var r=R();if(!onFace(p))return false;var q=toBust(p);
   if(id==='maskG'||id==='maskP'){if(r.mask)r.mask.remove();var m=document.createElement('div');m.className='lay mk';m.style.cssText='left:0;top:0;width:100%;height:100%;opacity:.92';m.innerHTML=id==='maskG'?maskSVG('#8fe38f','#4fb84f'):maskSVG('#ffb3d1','#ff5fa2');
     r.bl.insertBefore(m,r.bl.firstChild);m.animate([{clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0 0 0 0)'}],{duration:700,easing:'ease-out'});r.mask=m;r.maskA=.92;sfx.water();A.later(function(){sfx.sparkle();},500);burst(p.x,p.y,10,['#8fe38f','#ffffff','#ffb3d1']);say('بارد وحلو! 😌 الحين حطي الخيار على عيونها 🥒');A.hintTool('cucumber');return true;}
   if(id==='cucumber'){var k=nearest(q,['eyeL','eyeR']);if(r.cuc.indexOf(k)>=0)k=k==='eyeL'?'eyeR':'eyeL';if(r.cuc.indexOf(k)>=0){say('العيون عليها خيار 😄');return false;}
     r.cuc.push(k);var d=bl(r,SV.cucumber,FACE[k][0],FACE[k][1],17,17*434/535,'mk cuc');sfx.pop();say(r.cuc.length===2?'استرخي يا غالية... 😌 بعدين اغسلي بالإسفنجة 💧':'وحدة ثانية للعين الثانية 🥒');if(r.cuc.length===2)A.hintTool('sponge');return true;}
   if(id==='mist'){sfx.water();for(var i=0;i<3;i++)A.later(function(){burst(A.rnd(BUST.x+120,BUST.x+330),A.rnd(BUST.y+120,BUST.y+400),6,['#bfe6ff','#ffffff','#ffd6ea']);},i*150);say('منعش! 🌹');return 'back';}
   if(id==='sponge')return 'back';return false;},
 tick:function(id,c){if(id!=='sponge')return;var r=R();if(!onFace(c.hp))return;c.n=(c.n||0)+1;if(c.n%2===0){sfx.water();burst(c.hp.x,c.hp.y,3,['#bfe6ff','#ffffff']);}
   if(r.cuc.length&&c.n%6===0){var cs=r.bl.querySelectorAll('.cuc');if(cs.length){cs[0].remove();r.cuc.shift();}}
   if(r.mask){r.maskA-=.07;r.mask.style.opacity=Math.max(0,r.maskA);if(r.maskA<=0){r.mask.remove();r.mask=null;var cs2=r.bl.querySelectorAll('.cuc');for(var i=0;i<cs2.length;i++)cs2[i].remove();r.cuc=[];
     r.bust.firstChild.style.filter='brightness(1.07) saturate(1.08)';sfx.sparkle();A.later(function(){sfx.tada();},200);for(var j=0;j<4;j++)A.later(function(){burst(A.rnd(BUST.x+100,BUST.x+350),A.rnd(BUST.y+100,BUST.y+420),10);},j*160);say('واو! وجهج يلمع وصافي ✨ ماشاءالله!');A.hintTool(null);}}}
};

/* ================= NAILS ================= */
var NAILS=[{x:258,y:376,w:46,h:58,r:-28},{x:336,y:232,w:50,h:62,r:-8},{x:420,y:200,w:52,h:64,r:0},{x:504,y:224,w:50,h:62,r:8},{x:576,y:290,w:44,h:54,r:18}]; /* in hand svg coords (viewBox 0 0 760 620) */
var HAND={x:250,y:90,s:.92};
function handSVG(){var sk='#e9b48a',sd='#d79c72';
  return '<svg viewBox="0 0 760 620"><g fill="'+sk+'" stroke="'+sd+'" stroke-width="5">'+
  '<path d="M200 600 Q190 470 250 420 L300 360 Q330 330 350 380 L340 460 Z"/>'+
  '<rect x="300" y="210" width="76" height="300" rx="38"/><rect x="384" y="176" width="80" height="330" rx="40"/><rect x="468" y="200" width="78" height="310" rx="39"/><rect x="548" y="266" width="68" height="250" rx="34" transform="rotate(14 582 390)"/>'+
  '<path d="M236 330 Q250 300 286 340 L330 420 Q340 450 300 470 Q270 470 250 430Z" transform="rotate(-6 280 400)"/>'+
  '<path d="M240 470 Q250 380 330 400 L600 410 Q640 430 620 540 Q600 610 470 620 L230 620Z"/></g>'+
  '<path d="M330 470 q120 30 250 0" stroke="'+sd+'" stroke-width="4" fill="none" opacity=".5"/></svg>';}
function nailLayer(){var s='<svg viewBox="0 0 760 620" style="position:absolute;inset:0">';NAILS.forEach(function(n,i){s+='<g transform="rotate('+n.r+' '+n.x+' '+n.y+')"><rect class="nail" data-i="'+i+'" x="'+(n.x-n.w/2)+'" y="'+(n.y-n.h/2)+'" width="'+n.w+'" height="'+n.h+'" rx="'+(n.w/2)+'" fill="#ffe8de" stroke="#e8b8a0" stroke-width="3"/><rect class="shn" x="'+(n.x-n.w/4)+'" y="'+(n.y-n.h/2+8)+'" width="'+(n.w/6)+'" height="'+(n.h/2.4)+'" rx="4" fill="#fff" opacity="0"/><g class="stk" data-i="'+i+'"></g></g>';});return s+'</svg>';}
var POL={polPink:'#ff4f9a',polPurple:'#a66bff',polMint:'#3fd3a0',polGold:'#ffc21a'};
function bottle(c){return '<svg viewBox="0 0 100 100"><rect x="38" y="4" width="24" height="36" rx="6" fill="#333"/><path d="M26 40 h48 q8 0 8 10 v34 q0 10 -10 10 h-44 q-10 0 -10 -10 v-34 q0 -10 8 -10z" fill="'+c+'"/><rect x="32" y="48" width="10" height="34" rx="5" fill="#fff" opacity=".5"/></svg>';}
TOOLS.polPink={name:'وردي',svg:bottle(POL.polPink),tip:'اضغطي اللون وبعدين اضغطي الظفر 💅'};TOOLS.polPurple={name:'بنفسجي',svg:bottle(POL.polPurple),tip:'بنفسجي 💜'};TOOLS.polMint={name:'نعناعي',svg:bottle(POL.polMint),tip:'أخضر نعناعي 💚'};TOOLS.polGold={name:'ذهبي',svg:bottle(POL.polGold),tip:'ذهبي يلمع ✨'};
SV.nstk='<svg viewBox="0 0 100 100"><path d="M50 88 C14 64 8 38 22 26 C34 16 46 24 50 34 C54 24 66 16 78 26 C92 38 86 64 50 88Z" fill="#fff" stroke="#ff5fa2" stroke-width="6"/></svg>';
TOOLS.nstk={name:'ستيكر',svg:SV.nstk,tip:'ستيكر قلب على الظفر 🤍'};TOOLS.ndry={name:'مجفف',svg:SV.dryer,tip:'امسكي المجفف فوق الأظافر 💨'};
var NBG='<svg class="bg" viewBox="0 0 1280 720"><defs><radialGradient id="nbg" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#fff5fa"/><stop offset="1" stop-color="#ffb3d1"/></radialGradient></defs><rect width="1280" height="720" fill="url(#nbg)"/><rect y="560" width="1280" height="160" fill="#ff9cc8"/><rect y="548" width="1280" height="18" fill="#ffd0e5"/>'+
 '<ellipse cx="600" cy="600" rx="360" ry="60" fill="#fff" opacity=".6"/><g transform="translate(60 140)"><rect width="160" height="14" rx="6" fill="#d48aa8"/>'+[0,1,2,3].map(function(i){return '<g transform="translate('+(10+i*38)+' -56)">'+bottle(['#ff4f9a','#a66bff','#3fd3a0','#ffc21a'][i]).replace('<svg viewBox="0 0 100 100">','<svg viewBox="0 0 100 100" width="36" height="56" x="0" y="0">')+'</g>';}).join('')+'</g>'+
 '<g fill="#fff" opacity=".7"><path d="M1000 120 l6 14 14 6 -14 6 -6 14 -6 -14 -14 -6 14 -6z"/><path d="M120 420 l5 11 11 5 -11 5 -5 11 -5 -11 -11 -5 11 -5z"/></g></svg>';
function paintNail(r,i,col){var n=r.hand.querySelector('.nail[data-i="'+i+'"]');n.setAttribute('fill',col);n.setAttribute('stroke','#0002');r.painted[i]=col;r.dried=false;var s=r.hand.querySelectorAll('.shn');s[i].setAttribute('opacity','.35');
  var c=nailPos(i);burst(c.x,c.y,6,[col,'#ffffff']);sfx.pop();}
function nailPos(i){var n=NAILS[i];return {x:HAND.x+n.x*HAND.s,y:HAND.y+n.y*HAND.s};}
function nailAt(p){var best=-1,bd=70;for(var i=0;i<5;i++){var c=nailPos(i);var d=Math.hypot(p.x-c.x,p.y-c.y);if(d<bd){bd=d;best=i;}}return best;}
function onHand(p){return inRect(p,HAND.x+180*HAND.s,HAND.y+160*HAND.s,HAND.x+660*HAND.s,HAND.y+620*HAND.s);}
ROOMS.nails={name:'الأظافر',color:'linear-gradient(135deg,#ffe0ef,#e0457f)',charH:280,
 icon:'<svg viewBox="0 0 100 100"><g fill="#e9b48a"><rect x="22" y="30" width="14" height="50" rx="7"/><rect x="38" y="20" width="14" height="60" rx="7"/><rect x="54" y="24" width="14" height="56" rx="7"/><rect x="70" y="34" width="12" height="46" rx="6"/><rect x="20" y="60" width="64" height="34" rx="14"/></g><g fill="#ff4f9a"><rect x="24" y="32" width="10" height="12" rx="5"/><rect x="40" y="22" width="10" height="12" rx="5"/><rect x="56" y="26" width="10" height="12" rx="5" fill="#a66bff"/><rect x="71" y="36" width="9" height="11" rx="4.5" fill="#ffc21a"/></g></svg>',
 bg:NBG,tools:['polPink','polPurple','polMint','polGold','nstk','ndry'],spawn:{ghalia:[1060,700],khala:[150,712]},
 intro:'صالون الأظافر! اسحبي اللون على الظفر، أو اضغطي اللون وبعدين الظفر 💅',
 init:function(r){r.painted=[null,null,null,null,null];r.sel=null;r.dried=false;
   r.hand=el(handSVG()+nailLayer(),'',HAND.x,HAND.y,760*HAND.s,620*HAND.s,8);
   r.hand.addEventListener('pointerdown',function(e){e.preventDefault();var p=A.toStage(e);var i=nailAt(p);if(i<0)return;if(!r.sel){say('اختاري لون أول من الألوان 💅');A.hintTool('polPink');return;}paintNail(r,i,POL[r.sel]);checkNails(r);});
   var tb=document.querySelectorAll('#toolbar .tool');for(var k=0;k<tb.length;k++)(function(b){if(POL[b.dataset.id])b.addEventListener('pointerup',function(){if(r.sel!==b.dataset.id){r.sel=b.dataset.id;for(var j=0;j<tb.length;j++)tb[j].classList.toggle('hint',tb[j]===b);}});})(tb[k]);},
 drop:function(id,p){var r=R();
   if(POL[id]){r.sel=id;var i=nailAt(p);if(i>=0){paintNail(r,i,POL[id]);checkNails(r);return true;}if(onHand(p)){for(var j=0;j<5;j++)paintNail(r,j,POL[id]);checkNails(r);return true;}return false;}
   if(id==='nstk'){var n=nailAt(p);if(n<0)return false;var g=r.hand.querySelector('.stk[data-i="'+n+'"]');var N=NAILS[n];g.innerHTML='<path transform="translate('+(N.x-12)+' '+(N.y-10)+') scale(.24)" d="M50 88 C14 64 8 38 22 26 C34 16 46 24 50 34 C54 24 66 16 78 26 C92 38 86 64 50 88Z" fill="#fff" stroke="#ff5fa2" stroke-width="8"/>';sfx.pop();var c=nailPos(n);burst(c.x,c.y,8);say('ستيكر حلو! 🤍');return true;}
   if(id==='ndry')return 'back';return false;},
 tick:function(id,c){if(id!=='ndry')return;var r=R();if(!onHand(c.hp)&&nailAt(c.hp)<0)return;c.n=(c.n||0)+1;if(c.n%2===0){sfx.water();burst(c.hp.x-40,c.hp.y+20,3,['#ffffff','#ffd6ea']);}
   if(!r.dried&&r.painted.some(function(x){return x;})&&c.n>=14){r.dried=true;var s=r.hand.querySelectorAll('.shn');for(var i=0;i<5;i++)if(r.painted[i])s[i].setAttribute('opacity','.9');sfx.sparkle();A.later(function(){sfx.tada();},250);for(var k=0;k<5;k++){if(r.painted[k]){var q=nailPos(k);burst(q.x,q.y,8);}}say('جفت أظافرج وتلمع! 💅✨ تجننين');A.hintTool(null);}}
};
function checkNails(r){var n=r.painted.filter(function(x){return x;}).length;if(n===5){say('كل الأظافر ملونة! 💅 حطي ستيكر أو جففيها بالمجفف 💨');A.hintTool('ndry');}else say(A.pick(['حلو اللون! 💖','يلا الظفر الثاني 💅','واو! 😍']));}

ORDER.push('bath','wardrobe','makeup','masks','nails');
})();
