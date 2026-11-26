/* Salon, dress-up, kitchen, bedroom */
(function(){
'use strict';
var A=GAME.api,ROOMS=GAME.ROOMS,ORDER=GAME.ORDER,TOOLS=A.TOOLS,ACC=A.ACC,SV=A.SV,CH=A.CH;
var say=A.say,sfx=A.sfx,burst=A.burst;
function R(){return A.getR();}
function el(html,cls,x,y,w,h,z){var d=document.createElement('div');d.className='prop '+(cls||'');d.style.left=x+'px';d.style.top=y+'px';d.style.width=w+'px';d.style.height=h+'px';if(z!=null)d.style.zIndex=z;d.innerHTML=html;A.scene().appendChild(d);return d;}
function inRect(p,x1,y1,x2,y2){return p.x>x1&&p.x<x2&&p.y>y1&&p.y<y2;}
A.el=el;A.inRect=inRect;

/* ---------- accessory art ---------- */
function bow(c,d){return '<svg viewBox="0 0 100 60"><path d="M50 30 C30 0 4 4 7 30 C4 56 30 60 50 30Z" fill="'+c+'"/><path d="M50 30 C70 0 96 4 93 30 C96 56 70 60 50 30Z" fill="'+c+'"/><path d="M20 22 Q30 28 40 26" stroke="#fff" stroke-width="4" fill="none" opacity=".6"/><circle cx="50" cy="30" r="11" fill="'+d+'"/></svg>';}
var STARP='M50 4 L61 36 L95 37 L68 57 L78 90 L50 70 L22 90 L32 57 L5 37 L39 36Z';
var ART={
 bowPink:bow('#ff5fa2','#d81b74'),bowBlue:bow('#6ec6ff','#2f93d6'),
 clip:'<svg viewBox="0 0 100 100"><path d="'+STARP+'" fill="#ffd34d" stroke="#f0a800" stroke-width="5" stroke-linejoin="round"/><circle cx="50" cy="52" r="9" fill="#fff6c2"/></svg>',
 headband:'<svg viewBox="0 0 100 50"><path d="M7 47 C7 1 93 1 93 47" fill="none" stroke="#ff5fa2" stroke-width="9" stroke-linecap="round"/><path d="M7 47 C7 1 93 1 93 47" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="1 9" stroke-linecap="round"/><g>'+A.fl5(72,13,5,'#fff','#ffd34d')+'</g></svg>',
 crown:'<svg viewBox="0 0 100 70"><path d="M6 64 L3 14 L27 36 L50 4 L73 36 L97 14 L94 64Z" fill="#ffd34d" stroke="#e0a400" stroke-width="3" stroke-linejoin="round"/><rect x="6" y="54" width="88" height="10" fill="#ffbf1f"/><circle cx="50" cy="40" r="7" fill="#ff5fa2"/><circle cx="25" cy="46" r="5" fill="#7ed6ff"/><circle cx="75" cy="46" r="5" fill="#b388ff"/><circle cx="3" cy="14" r="4" fill="#fff3b0"/><circle cx="50" cy="4" r="4" fill="#fff3b0"/><circle cx="97" cy="14" r="4" fill="#fff3b0"/></svg>',
 hat:'<svg viewBox="0 0 120 60"><ellipse cx="60" cy="49" rx="58" ry="10" fill="#f9b8d6"/><path d="M28 49 C28 8 92 8 92 49Z" fill="#ffd0e5"/><rect x="29" y="37" width="62" height="9" fill="#ff5fa2"/>'+A.fl5(84,36,5,'#fff','#ffd34d')+'</svg>',
 glasses:'<svg viewBox="0 0 100 40"><g fill="rgba(255,120,180,.35)" stroke="#ff3d8b" stroke-width="4"><path d="M25 37 C6 25 2 13 10 7 C17 2 24 6 25 12 C26 6 33 2 40 7 C48 13 44 25 25 37Z"/><path d="M75 37 C56 25 52 13 60 7 C67 2 74 6 75 12 C76 6 83 2 90 7 C98 13 94 25 75 37Z"/></g><path d="M42 14 Q50 8 58 14" stroke="#ff3d8b" stroke-width="4" fill="none"/><circle cx="18" cy="14" r="3" fill="#fff"/><circle cx="68" cy="14" r="3" fill="#fff"/></svg>',
 necklace:(function(){var s='<svg viewBox="0 0 100 50">';for(var i=0;i<=12;i++){var t=i/12,x=12+76*t,y=4+28*Math.sin(Math.PI*t);s+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="4.2" fill="#fff" stroke="#e8cfe0" stroke-width="1.5"/>';}return s+'<path d="M50 48 C38 40 38 32 44 31 C47 30 50 33 50 35 C50 33 53 30 56 31 C62 32 62 40 50 48Z" fill="#ff5fa2"/></svg>';})(),
 capeB:'<svg viewBox="0 0 100 90"><path d="M32 2 L68 2 Q80 40 98 84 Q50 93 2 84 Q20 40 32 2Z" fill="#c77dff"/><path d="M36 4 L64 4 Q74 40 88 80 Q50 86 12 80 Q26 40 36 4Z" fill="#b05cf0" opacity=".55"/><g fill="#fff6a8"><path d="M14 70 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"/><path d="M86 66 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"/></g></svg>',
 capeF:'<svg viewBox="0 0 100 90"><circle cx="50" cy="5" r="4.5" fill="#ffd34d" stroke="#e0a400" stroke-width="1.5"/><path d="M46 6 l-8 8 M54 6 l8 8" stroke="#ff5fa2" stroke-width="3" stroke-linecap="round"/></svg>',
 packB:'<svg viewBox="0 0 100 105"><rect x="3" y="8" width="94" height="94" rx="24" fill="#ff8fc0"/><rect x="3" y="60" width="94" height="40" rx="16" fill="#ff6fae"/></svg>',
 packF:'<svg viewBox="0 0 100 105"><path d="M26 0 Q21 40 26 80" stroke="#ff3d8b" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M74 0 Q79 40 74 80" stroke="#ff3d8b" stroke-width="10" fill="none" stroke-linecap="round"/></svg>',
 wand:'<svg viewBox="0 0 40 96"><path d="M20 94 V34" stroke="#ff9fd0" stroke-width="5" stroke-linecap="round"/><path d="M20 2 L25 15 L38 16 L28 24 L31 37 L20 30 L9 37 L12 24 L2 16 L15 15Z" fill="#ffd34d" stroke="#f0a800" stroke-width="2"/></svg>'
};
ART.pack='<svg viewBox="0 0 100 105"><rect x="12" y="14" width="76" height="86" rx="22" fill="#ff8fc0"/><rect x="22" y="56" width="56" height="34" rx="12" fill="#ff6fae"/><path d="M36 16 Q50 -4 64 16" stroke="#ff3d8b" stroke-width="7" fill="none"/>'+A.fl5(50,72,7,'#fff','#ffd34d')+'</svg>';
ART.cape='<svg viewBox="0 0 100 90"><path d="M32 2 L68 2 Q80 40 98 84 Q50 93 2 84 Q20 40 32 2Z" fill="#c77dff"/><circle cx="50" cy="6" r="6" fill="#ffd34d"/></svg>';
var ACCDEF={
 bowPink:{slot:'bowR',w:40,r:.6,al:'center',front:ART.bowPink,name:'فيونكة',tip:'فيونكة وردية 🎀'},
 bowBlue:{slot:'bowR',w:40,r:.6,al:'center',front:ART.bowBlue,name:'فيونكة زرقا',tip:'فيونكة زرقا 💙'},
 clip:{slot:'clipL',w:26,r:1,al:'center',front:ART.clip,name:'بكلة',tip:'بكلة نجمة ⭐'},
 headband:{slot:'top',w:80,r:.5,al:'bottom',dy:5,front:ART.headband,name:'طوق',tip:'طوق حلو 🌼'},
 crown:{slot:'top',w:60,r:.7,al:'bottom',dy:1,front:ART.crown,name:'تاج',tip:'تاج الأميرة 👑'},
 hat:{slot:'top',w:128,r:.5,al:'bottom',dy:4,front:ART.hat,name:'قبعة',tip:'قبعة الشمس 👒'},
 glasses:{slot:'eyes',w:66,r:.4,al:'center',front:ART.glasses,name:'نظارة',tip:'نظارة قلوب 💗'},
 necklace:{slot:'neck',w:46,r:.5,al:'top',front:ART.necklace,name:'عقد',tip:'عقد لولو 🤍'},
 cape:{slot:'cape',w:150,r:.9,al:'top',back:ART.capeB,front:ART.capeF,icon:ART.cape,name:'رداء',tip:'رداء الأميرة 💜'},
 backpack:{slot:'back',w:92,r:1.05,al:'top',back:ART.packB,front:ART.packF,icon:ART.pack,name:'شنطة',tip:'شنطة المدرسة 🎒'},
 wand:{slot:'hand',w:32,r:2.4,al:'bottom',dy:8,front:ART.wand,name:'عصا',tip:'عصا سحرية ✨'}
};
for(var k in ACCDEF){ACC[k]=ACCDEF[k];TOOLS[k]={name:ACCDEF[k].name,svg:ACCDEF[k].icon||ACCDEF[k].front,tip:ACCDEF[k].tip};}
A.ACCDEF=ACCDEF;
SV.brush='<svg viewBox="0 0 100 100"><g transform="rotate(-40 50 50)"><rect x="42" y="44" width="16" height="52" rx="8" fill="#ff5fa2"/><rect x="26" y="4" width="48" height="46" rx="20" fill="#ffd0e5" stroke="#ff5fa2" stroke-width="4"/><g stroke="#a0136a" stroke-width="3" stroke-linecap="round"><path d="M36 14 v26 M44 12 v30 M52 12 v30 M60 12 v30 M66 16 v22"/></g></g></svg>';
TOOLS.brush={name:'المشط',svg:SV.brush,tip:'مرري المشط على شعر غالية ✨'};

function praise(){return A.pick(['تجننين يا غالية! 💗','الله! صرتي أميرة 👑','واو! حلو عليج ✨','ماشاءالله، يهبل! 😍']);}

/* ================= SALON ================= */
var SBG='<svg class="bg" viewBox="0 0 1280 720"><defs><pattern id="sst" width="64" height="10" patternUnits="userSpaceOnUse"><rect width="32" height="10" fill="#ffd0e6"/></pattern><pattern id="sfl" width="80" height="80" patternUnits="userSpaceOnUse"><rect width="80" height="80" fill="#fff"/><rect width="40" height="40" fill="#ffc2dc"/><rect x="40" y="40" width="40" height="40" fill="#ffc2dc"/></pattern><radialGradient id="smg" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#e4f6ff"/><stop offset="1" stop-color="#b9e2fb"/></radialGradient></defs>'+
'<rect width="1280" height="720" fill="#ffe0ef"/><rect width="1280" height="560" fill="url(#sst)"/><rect y="560" width="1280" height="160" fill="url(#sfl)"/><rect y="550" width="1280" height="16" fill="#f7a8cc"/>'+
'<ellipse cx="560" cy="250" rx="160" ry="180" fill="#ffd34d" stroke="#e0a400" stroke-width="6"/><ellipse cx="560" cy="250" rx="136" ry="156" fill="url(#smg)"/><path d="M480 170 L530 120 M470 210 L560 120" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".7"/>'+
(function(){var s='';for(var i=0;i<14;i++){var a=i/14*Math.PI*2;s+='<circle cx="'+(560+Math.cos(a)*160).toFixed(0)+'" cy="'+(250+Math.sin(a)*180).toFixed(0)+'" r="9" fill="#fffbe0" stroke="#f0c040" stroke-width="2"/>';}return s;})()+
'<rect x="850" y="250" width="270" height="16" rx="6" fill="#d48aa8"/><rect x="870" y="190" width="30" height="60" rx="8" fill="#b388ff"/><rect x="915" y="170" width="26" height="80" rx="8" fill="#7ed6ff"/><circle cx="975" cy="225" r="26" fill="#ffd34d"/><rect x="1015" y="200" width="34" height="50" rx="10" fill="#ff7eb6"/><path d="M1080 250 l-16 -40 h32z" fill="#7be07b"/>'+
'<rect x="850" y="380" width="270" height="16" rx="6" fill="#d48aa8"/><rect x="880" y="330" width="60" height="50" rx="14" fill="#fff" stroke="#ff9cc8" stroke-width="4"/><rect x="960" y="320" width="40" height="60" rx="10" fill="#ffb3d1"/><rect x="1020" y="335" width="70" height="45" rx="12" fill="#c9a4ff"/>'+
'<g fill="#ff9cc8"><path d="M140 140 C120 125 120 108 132 106 C138 105 140 110 140 112 C140 110 142 105 148 106 C160 108 160 125 140 140Z"/><path d="M220 260 C200 245 200 228 212 226 C218 225 220 230 220 232 C220 230 222 225 228 226 C240 228 240 245 220 260Z"/></g>'+
'</svg>';
var CHAIR_B='<svg viewBox="0 0 200 200"><rect x="22" y="0" width="156" height="170" rx="50" fill="#ff6fae"/><rect x="36" y="14" width="128" height="140" rx="40" fill="#ff8fc0"/><g fill="#ff5fa2"><circle cx="70" cy="60" r="6"/><circle cx="130" cy="60" r="6"/><circle cx="100" cy="95" r="6"/><circle cx="70" cy="125" r="6"/><circle cx="130" cy="125" r="6"/></g></svg>';
var CHAIR_F='<svg viewBox="0 0 240 180"><rect x="10" y="0" width="220" height="76" rx="30" fill="#ff4f9a"/><rect x="22" y="8" width="196" height="20" rx="10" fill="#ff8fc0" opacity=".7"/><rect x="0" y="-14" width="34" height="80" rx="16" fill="#e0457f"/><rect x="206" y="-14" width="34" height="80" rx="16" fill="#e0457f"/><rect x="108" y="76" width="24" height="70" fill="#c9c9d6"/><ellipse cx="120" cy="156" rx="80" ry="16" fill="#b0b0c0"/></svg>';
function mirrorSparkle(){for(var i=0;i<3;i++)(function(i){A.later(function(){burst(A.rnd(460,660),A.rnd(120,330),8,['#ffffff','#fff6a8','#bfe6ff']);},i*180);})(i);}
ROOMS.salon={name:'الصالون',color:'linear-gradient(135deg,#ffd0e6,#ff8fc0)',charH:300,
 icon:'<svg viewBox="0 0 100 100"><ellipse cx="50" cy="44" rx="30" ry="36" fill="#ffd34d"/><ellipse cx="50" cy="44" rx="24" ry="30" fill="#dff6ff"/><path d="M36 30 l12 -12" stroke="#fff" stroke-width="5" stroke-linecap="round"/>'+ART.bowPink.replace('<svg viewBox="0 0 100 60">','<g transform="translate(30 70) scale(.4)">').replace('</svg>','</g>')+'</svg>',
 bg:SBG,tools:['brush','bowPink','bowBlue','clip','headband','crown'],
 spawn:{ghalia:[250,690,1],khala:[960,700]},
 intro:'هلا بغالية بالصالون! اسحبيها على الكرسي الوردي 💺',
 init:function(r){r.seat=null;r.back=el(CHAIR_B,'',470,380,180,180,5);r.front=el(CHAIR_F,'',440,545,240,180,12);},
 charDrop:function(who,x,y){var r=R();
   if(Math.abs(x-560)<170&&y>400){if(r.seat&&r.seat!==who){A.putChar(r.seat,who==='ghalia'?900:250,700);}r.seat=who;A.putChar(who,560,615);sfx.pop();burst(560,400,10);
     say(who==='ghalia'?'تفضلي يا غالية! الحين اختاري زينة لشعرج 🎀':'خالتج قعدت! زيّني شعرها 😄');return true;}
   if(r.seat===who)r.seat=null;return false;},
 drop:function(id,p){var r=R();var t=A.charAt(p);if(!t)return false;
   if(r.seat!==t){say(t==='ghalia'?'قعدي غالية على الكرسي أول 💺':'حطي خالتج على الكرسي أول 😄');return false;}
   if(id==='brush'){r.chars[t].classList.add('shine');sfx.sparkle();var h=A.headOf(t);burst(h.x,h.y,16);mirrorSparkle();say('واو! شعرج صار يلمع ✨');return 'back';}
   A.wear(t,id);mirrorSparkle();say(praise());return true;},
 tick:function(id,c){if(id!=='brush')return;var r=R();var t=A.charAt(c.hp);if(t&&r.seat===t){c.n=(c.n||0)+1;if(c.n%3===0){burst(c.hp.x,c.hp.y,4);sfx.water();}}},
 onReset:function(){CH.ghalia.acc={};CH.khala.acc={};}
};

/* ================= DRESS-UP (accessories) ================= */
var DBG='<svg class="bg" viewBox="0 0 1280 720"><defs><pattern id="ddt" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="15" cy="15" r="4" fill="#e3d1ff"/><circle cx="45" cy="45" r="4" fill="#ffd6ea"/></pattern><linearGradient id="dfl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6d7b8"/><stop offset="1" stop-color="#e9bf98"/></linearGradient></defs>'+
'<rect width="1280" height="720" fill="#f3e9ff"/><rect width="1280" height="570" fill="url(#ddt)"/><rect y="560" width="1280" height="160" fill="url(#dfl)"/>'+
'<rect x="60" y="120" width="320" height="450" rx="20" fill="#fff0f8" stroke="#ff9cc8" stroke-width="8"/><rect x="80" y="140" width="280" height="300" rx="12" fill="#f8d9ec"/><rect x="88" y="170" width="264" height="8" rx="4" fill="#c0a0b0"/>'+
'<g><path d="M110 178 h40 l14 90 l-8 120 h-52 l-8 -120z" fill="#ff8fc0"/><path d="M180 178 h40 l12 100 l-6 110 h-52 l-6 -110z" fill="#b388ff"/><path d="M250 178 h40 l12 100 l-6 110 h-52 l-6 -110z" fill="#7ed6ff"/></g>'+
'<rect x="80" y="456" width="280" height="44" rx="10" fill="#ffd0e5"/><rect x="80" y="508" width="280" height="44" rx="10" fill="#ffd0e5"/><circle cx="220" cy="478" r="6" fill="#ff5fa2"/><circle cx="220" cy="530" r="6" fill="#ff5fa2"/>'+
(function(){var s='<path d="M420 60 Q800 140 1150 60" stroke="#c9a4ff" stroke-width="3" fill="none"/>';var c=['#ff5fa2','#ffd34d','#7ed6ff','#7be07b','#b388ff'];for(var i=0;i<14;i++){var t=i/13,x=420+730*t,y=60+80*4*t*(1-t)*.75+6;s+='<circle cx="'+x.toFixed(0)+'" cy="'+y.toFixed(0)+'" r="10" fill="'+c[i%5]+'"/>';}return s;})()+
'<ellipse cx="640" cy="660" rx="190" ry="44" fill="#ff7eb6"/><ellipse cx="640" cy="648" rx="180" ry="38" fill="#ffc2dc"/><ellipse cx="640" cy="648" rx="140" ry="26" fill="#ffd6ea"/>'+
'<rect x="900" y="200" width="200" height="330" rx="100" fill="#ffd34d"/><rect x="915" y="215" width="170" height="300" rx="85" fill="#e9f7ff"/><path d="M950 280 l40 -40 M950 330 l80 -80" stroke="#fff" stroke-width="10" stroke-linecap="round"/>'+
'</svg>';
ROOMS.dress={name:'غرفة الملابس',color:'linear-gradient(135deg,#e7d6ff,#b388ff)',charH:400,
 icon:'<svg viewBox="0 0 100 100"><path d="M50 10 a8 8 0 1 1 8 8 v6 l34 22 h-84 l34 -22" stroke="#a66bff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M34 50 h32 l12 44 h-56z" fill="#ff8fc0"/>'+ART.hat.replace('<svg viewBox="0 0 120 60">','<g transform="translate(52 6) scale(.38)">').replace('</svg>','</g>')+'</svg>',
 bg:DBG,tools:['hat','glasses','backpack','cape','necklace','wand'],
 spawn:{ghalia:[640,650,1],khala:[880,700]},
 intro:'يلا نلبس غالية! اسحبي القبعة أو النظارة عليها 👒',
 drop:function(id,p){var t=A.charAt(p,40);if(!t){return false;}A.wear(t,id);say(ACC[id].tip+' '+praise());return true;},
 onReset:function(){CH.ghalia.acc={};CH.khala.acc={};}
};

/* ================= KITCHEN ================= */
var K={};
K.flour='<svg viewBox="0 0 100 100"><path d="M22 24 Q50 14 78 24 L84 92 H16Z" fill="#fff8ec" stroke="#e0c9a0" stroke-width="3"/><path d="M22 24 Q36 8 50 18 Q64 8 78 24" fill="#fff8ec" stroke="#e0c9a0" stroke-width="3"/><path d="M50 78 V44 M50 50 l-9 -7 M50 58 l-9 -7 M50 66 l-9 -7 M50 50 l9 -7 M50 58 l9 -7 M50 66 l9 -7" stroke="#e0a400" stroke-width="4" stroke-linecap="round" fill="none"/></svg>';
K.eggs='<svg viewBox="0 0 100 100"><path d="M10 64 h80 l-8 26 h-64z" fill="#ffd0a0"/><ellipse cx="32" cy="50" rx="17" ry="22" fill="#fff6e8" stroke="#e8d2b0" stroke-width="3"/><ellipse cx="68" cy="50" rx="17" ry="22" fill="#fff6e8" stroke="#e8d2b0" stroke-width="3"/><ellipse cx="50" cy="44" rx="17" ry="22" fill="#fffaf2" stroke="#e8d2b0" stroke-width="3"/></svg>';
K.milk='<svg viewBox="0 0 100 100"><path d="M28 30 L50 12 L72 30 V94 H28Z" fill="#fff" stroke="#7ec8ff" stroke-width="4"/><path d="M28 30 H72" stroke="#7ec8ff" stroke-width="4"/><path d="M50 50 C40 64 42 76 50 76 C58 76 60 64 50 50Z" fill="#7ec8ff"/></svg>';
K.sugar='<svg viewBox="0 0 100 100"><rect x="22" y="28" width="56" height="64" rx="14" fill="#e9f7ff" stroke="#9fd6f5" stroke-width="4"/><rect x="18" y="16" width="64" height="16" rx="6" fill="#ff7eb6"/><g fill="#fff" stroke="#cfe6f5" stroke-width="2"><rect x="32" y="56" width="14" height="14" rx="2"/><rect x="52" y="60" width="14" height="14" rx="2"/><rect x="42" y="72" width="14" height="14" rx="2"/></g><path d="M28 40 v30" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>';
K.whisk='<svg viewBox="0 0 100 100"><g transform="rotate(-30 50 50)"><rect x="44" y="58" width="12" height="40" rx="6" fill="#ff5fa2"/><g fill="none" stroke="#9aa4ad" stroke-width="3.5"><path d="M50 60 C24 40 34 2 50 2 C66 2 76 40 50 60"/><path d="M50 60 C34 40 40 6 50 6 C60 6 66 40 50 60"/><path d="M50 60 V4"/></g></g></svg>';
K.berry='<svg viewBox="0 0 100 100"><path d="M50 94 C18 74 14 40 30 30 C40 24 46 30 50 30 C54 30 60 24 70 30 C86 40 82 74 50 94Z" fill="#ff3b5c"/><path d="M50 32 L36 18 L48 22 L50 8 L52 22 L64 18Z" fill="#3aa845"/><g fill="#ffe28a"><circle cx="38" cy="48" r="2.5"/><circle cx="56" cy="44" r="2.5"/><circle cx="46" cy="62" r="2.5"/><circle cx="64" cy="60" r="2.5"/><circle cx="52" cy="76" r="2.5"/></g></svg>';
TOOLS.flour={name:'طحين',svg:K.flour,tip:'الطحين 🌾'};TOOLS.eggs={name:'بيض',svg:K.eggs,tip:'البيض 🥚'};TOOLS.milk={name:'حليب',svg:K.milk,tip:'الحليب 🥛'};
TOOLS.sugar={name:'شكر',svg:K.sugar,tip:'الشكر 🍬'};TOOLS.whisk={name:'خفاقة',svg:K.whisk,tip:'الخفاقة عشان نخلط 🥣'};TOOLS.berry={name:'فراولة',svg:K.berry,tip:'فراولة للكيكة 🍓'};
var ICOL={flour:'#ffffff',eggs:'#ffd34d',milk:'#eaf6ff',sugar:'#ffe0ef'};
function bowlSVG(r){var s='<svg viewBox="0 0 200 110"><ellipse cx="100" cy="30" rx="92" ry="16" fill="#a9dcff"/><ellipse cx="100" cy="32" rx="82" ry="11" fill="#e8f6ff"/>';
  if(r.mixed)s+='<ellipse cx="100" cy="33" rx="76" ry="9" fill="#ffe0a3"/><path d="M70 32 q15 -6 30 0 t30 0" stroke="#f3c56b" stroke-width="3" fill="none"/>';
  else{var i=0;r.ing.forEach(function(k){s+='<ellipse cx="'+(60+i*26)+'" cy="'+(33-i%2*2)+'" rx="22" ry="7" fill="'+ICOL[k]+'" stroke="#0001"/>';if(k==='eggs')s+='<circle cx="'+(60+i*26)+'" cy="32" r="5" fill="#ffb300"/>';i++;});}
  return s+'<path d="M8 32 Q100 46 192 32 Q182 104 100 106 Q18 104 8 32Z" fill="#5cb8f5"/><path d="M30 50 Q40 80 70 92" stroke="#fff" stroke-width="6" fill="none" opacity=".5" stroke-linecap="round"/><ellipse cx="100" cy="106" rx="40" ry="5" fill="#2f93d6"/></svg>';}
var OVEN='<svg viewBox="0 0 220 400"><rect x="0" y="20" width="220" height="380" rx="24" fill="#ffffff" stroke="#ff9cc8" stroke-width="6"/><rect x="0" y="0" width="220" height="40" rx="12" fill="#ff7eb6"/><g fill="#555"><ellipse cx="60" cy="18" rx="32" ry="8"/><ellipse cx="160" cy="18" rx="32" ry="8"/></g><g fill="#ff5fa2"><circle cx="40" cy="76" r="12"/><circle cx="80" cy="76" r="12"/><circle cx="140" cy="76" r="12"/><circle cx="180" cy="76" r="12"/></g><rect x="24" y="110" width="172" height="20" rx="10" fill="#d9d9e3"/><rect x="24" y="146" width="172" height="190" rx="22" fill="#ff9cc8"/><rect class="win" x="40" y="162" width="140" height="158" rx="16" fill="#3a3550"/><path d="M58 180 l30 -10" stroke="#fff" stroke-width="6" opacity=".3" stroke-linecap="round"/><rect x="24" y="352" width="172" height="30" rx="10" fill="#ffd0e5"/></svg>';
var CAKE='<svg viewBox="0 0 200 190"><ellipse cx="100" cy="176" rx="90" ry="12" fill="#e8f6ff" stroke="#9fd6f5" stroke-width="3"/><rect x="92" y="160" width="16" height="16" fill="#9fd6f5"/><rect x="18" y="96" width="164" height="66" rx="16" fill="#ffb3d1"/><path d="M18 108 q14 18 27 0 q14 18 27 0 q14 18 27 0 q14 18 27 0 q14 18 27 0 q14 18 27 0 V96 H18Z" fill="#fff"/><rect x="46" y="48" width="108" height="54" rx="14" fill="#ff8fc0"/><path d="M46 58 q12 14 22 0 q12 14 22 0 q12 14 22 0 q12 14 22 0 q11 14 20 0 V48 H46Z" fill="#fff"/>'+
 '<g><rect x="66" y="18" width="8" height="32" rx="3" fill="#7ed6ff"/><rect x="96" y="12" width="8" height="38" rx="3" fill="#ffd34d"/><rect x="126" y="18" width="8" height="32" rx="3" fill="#b388ff"/></g><g fill="#ff9a3c"><path class="flame" d="M70 18 c-6 -6 0 -14 0 -16 c0 2 6 10 0 16z"/><path class="flame" d="M100 12 c-6 -6 0 -14 0 -16 c0 2 6 10 0 16z"/><path class="flame" d="M130 18 c-6 -6 0 -14 0 -16 c0 2 6 10 0 16z"/></g></svg>';
var KBG='<svg class="bg" viewBox="0 0 1280 720"><defs><pattern id="ktl" width="50" height="50" patternUnits="userSpaceOnUse"><rect width="50" height="50" fill="#fff6e3"/><rect width="48" height="48" x="1" y="1" rx="6" fill="#fffaf0"/><circle cx="25" cy="25" r="4" fill="#ffd0e5"/></pattern></defs>'+
'<rect width="1280" height="720" fill="url(#ktl)"/><rect x="620" y="70" width="260" height="200" rx="16" fill="#bfe8ff" stroke="#fff" stroke-width="12"/><path d="M750 70 V270 M620 170 H880" stroke="#fff" stroke-width="8"/><path d="M600 60 q40 120 0 230 h50 q-20 -110 0 -230z M900 60 q-40 120 0 230 h-50 q20 -110 0 -230z" fill="#ff9cc8"/>'+
'<rect x="960" y="150" width="180" height="14" rx="6" fill="#d9a77a"/><rect x="975" y="100" width="40" height="50" rx="10" fill="#ffd34d"/><rect x="1025" y="90" width="44" height="60" rx="10" fill="#7be07b"/><rect x="1080" y="105" width="40" height="45" rx="10" fill="#ff7eb6"/>'+
'<rect x="50" y="150" width="180" height="14" rx="6" fill="#d9a77a"/><circle cx="90" cy="125" r="25" fill="#ff7eb6"/><rect x="130" y="100" width="40" height="50" rx="10" fill="#b388ff"/><rect x="180" y="110" width="36" height="40" rx="10" fill="#7ed6ff"/>'+
'<rect y="462" width="1280" height="30" fill="#f4c99a"/><rect y="488" width="1280" height="232" fill="#ffc2dc"/><g fill="none" stroke="#ff9cc8" stroke-width="6"><rect x="530" y="510" width="200" height="180" rx="16"/><rect x="750" y="510" width="200" height="180" rx="16"/><rect x="970" y="510" width="200" height="180" rx="16"/></g><g fill="#fff"><rect x="610" y="530" width="40" height="10" rx="5"/><rect x="830" y="530" width="40" height="10" rx="5"/><rect x="1050" y="530" width="40" height="10" rx="5"/></g></svg>';
ROOMS.kitchen={name:'المطبخ',color:'linear-gradient(135deg,#fff1c7,#ffb36b)',charH:300,
 icon:CAKE.replace('viewBox="0 0 200 190"','viewBox="-10 -20 220 220"'),
 bg:KBG,tools:['flour','eggs','milk','sugar','whisk','berry'],
 spawn:{ghalia:[900,712,1],khala:[1060,712]},
 intro:'يلا نسوي كيكة! حطي الطحين والبيض والحليب والشكر بالصحن 🥣',
 init:function(r){r.ing=[];r.mixed=false;r.baking=false;r.cake=false;r.berries=0;
   r.oven=el(OVEN+'<div class="pbar"><i></i></div>','',280,300,220,400,6);r.oven.id='oven';
   r.bowl=el(bowlSVG(r),'',580,370,200,110,7);r.bowl.id='bowl';
   A.drag(r.bowl,{start:function(p){if(!r.mixed||r.baking||r.cake){A.wiggle(r.bowl);return false;}var g=A.mkGhost(bowlSVG(r),200,110);A.placeG(g,p);r.bowl.style.visibility='hidden';sfx.pick();return {g:g};},
     move:function(c,p){A.placeG(c.g,p);},
     end:function(c,p){var q=A.hp(p);c.g.remove();if(inRect(q,260,260,520,720)){r.bowl.style.display='none';bake(r);}else{r.bowl.style.visibility='';sfx.oops();say('اسحبي الصحن للفرن 🔥');}}});
   A.hintTool('flour');},
 drop:function(id,p){var r=R();var onBowl=inRect(p,560,300,800,500);
   if(ICOL[id]){if(r.cake){say('الكيكة جاهزة! حطي فراولة عليها 🍓');return false;}if(r.mixed||r.baking){say('اسحبي الصحن للفرن 🔥');return false;}if(!onBowl)return false;
     if(r.ing.indexOf(id)>=0){say('حطيناه قبل 😄 جربي شي ثاني');return false;}
     r.ing.push(id);r.bowl.innerHTML=bowlSVG(r);sfx.pop();burst(680,390,10,[ICOL[id],'#ffd34d','#ff7eb6']);A.wiggle(r.bowl);
     var left=4-r.ing.length;if(left===0){say('الحين خذي الخفاقة وخفقي الخليط 🥣');A.hintTool('whisk');}else{say('حلو! باقي '+left+' 😊');var nx=['flour','eggs','milk','sugar'].filter(function(k){return r.ing.indexOf(k)<0;})[0];A.hintTool(nx);}return true;}
   if(id==='whisk'){if(!onBowl)return false;if(r.cake||r.baking||r.mixed){return 'back';}if(r.ing.length<4){say('نحتاج طحين وبيض وحليب وشكر أول 🥚');return false;}
     r.bowl.classList.add('stir');sfx.water();A.later(function(){sfx.water();},300);A.later(function(){sfx.water();},600);
     A.later(function(){r.bowl.classList.remove('stir');r.mixed=true;r.bowl.innerHTML=bowlSVG(r);r.bowl.classList.add('ready');sfx.sparkle();burst(680,390,12);say('ممتاز! اسحبي الصحن للفرن 🔥');A.hintTool(null);},1300);return 'back';}
   if(id==='berry'){if(!r.cake){say('نسوي الكيكة أول 🎂');return false;}if(!inRect(p,560,240,800,500))return false;
     var top=r.berries<4,bx=A.clamp(p.x,top?620:600,top?740:760),by=top?r.cakeEl._y+48:r.cakeEl._y+96;
     var b=el(K.berry,'',bx-16,by-26,32,32,9);b.animate([{transform:'scale(0) translateY(-40px)'},{transform:'scale(1.2)'},{transform:'scale(1)'}],{duration:350});r.berries++;sfx.pop();burst(bx,by,6);
     if(r.berries===3)say('يمّي! تبين فراولة أكثر؟ 😋');if(r.berries===8)say('أحلى كيكة بالدنيا! 🎂💗');return true;}
   return false;}
};
function bake(r){r.baking=true;var o=r.oven;o.classList.add('on');var bar=o.querySelector('.pbar i');bar.style.transition='width 3s linear';void bar.offsetWidth;bar.style.width='100%';sfx.pop();say('ننطر شوي... الكيكة بالفرن ⏳');
  A.later(function(){o.classList.remove('on');r.baking=false;r.cake=true;sfx.ding();
    var c=el(CAKE,'',580,300,200,190,8);c._y=300;r.cakeEl=c;c.animate([{transform:'scale(0)'},{transform:'scale(1.15)'},{transform:'scale(1)'}],{duration:600,easing:'ease-out'});
    A.confetti();A.later(function(){sfx.tada();},300);burst(680,380,24);
    if(!r.chars.khala)A.putChar('khala',1060,712,true);if(!r.chars.ghalia)A.putChar('ghalia',900,712,true);
    A.hop(r.chars.ghalia,4);A.hop(r.chars.khala,4);
    say('ياااي! الكيكة جاهزة! شاطرة يا غالية 🎉 حطي فراولة عليها 🍓');A.hintTool('berry');},3000);}

/* ================= BEDROOM ================= */
var BBG='<svg class="bg" viewBox="0 0 1280 720"><defs><pattern id="bst" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M20 12 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#d9ccff"/><circle cx="60" cy="56" r="3" fill="#ffd6ea"/></pattern></defs>'+
'<rect width="1280" height="720" fill="#ebe2ff"/><rect width="1280" height="580" fill="url(#bst)"/><rect y="580" width="1280" height="140" fill="#d7bff0"/><rect y="574" width="1280" height="12" fill="#c9a4ff"/>'+
'<rect x="120" y="90" width="260" height="240" rx="20" fill="#bfe8ff" stroke="#fff" stroke-width="12"/><path d="M250 90 V330 M120 210 H380" stroke="#fff" stroke-width="8"/><circle cx="190" cy="150" r="22" fill="#ffe14d"/><path d="M100 80 q40 130 0 270 h55 q-25 -135 0 -270z M400 80 q-40 130 0 270 h-55 q25 -135 0 -270z" fill="#ff9cc8"/><rect x="90" y="70" width="320" height="14" rx="7" fill="#c77dff"/>'+
'<ellipse cx="660" cy="670" rx="300" ry="38" fill="#ffc2dc"/><ellipse cx="660" cy="670" rx="240" ry="26" fill="#ffd6ea"/>'+
'<rect x="950" y="520" width="160" height="160" rx="16" fill="#ffd0e5" stroke="#ff9cc8" stroke-width="5"/><rect x="965" y="570" width="130" height="10" rx="5" fill="#ff9cc8"/><circle cx="1030" cy="625" r="7" fill="#ff5fa2"/>'+
'<g transform="translate(560 120)"><rect width="140" height="110" rx="10" fill="#fff" stroke="#ffd34d" stroke-width="8"/><path d="M70 85 C40 65 34 44 46 38 C56 33 66 40 70 46 C74 40 84 33 94 38 C106 44 100 65 70 85Z" fill="#ff7eb6"/></g>'+
'</svg>';
var BED_B='<svg viewBox="0 0 460 330"><path d="M20 230 V90 Q20 0 230 0 Q440 0 440 90 V230Z" fill="#ff9cc8"/><path d="M50 220 V100 Q50 30 230 30 Q410 30 410 100 V220Z" fill="#ffb3d1"/><circle cx="230" cy="80" r="22" fill="#ff7eb6"/><rect x="0" y="200" width="460" height="96" rx="20" fill="#fff"/><rect x="10" y="290" width="26" height="40" rx="6" fill="#e0457f"/><rect x="424" y="290" width="26" height="40" rx="6" fill="#e0457f"/><ellipse cx="230" cy="190" rx="120" ry="34" fill="#fff" stroke="#f0d0e0" stroke-width="4"/></svg>';
var BED_F='<svg viewBox="0 0 480 150"><path d="M10 26 Q240 -6 470 26 V120 Q240 150 10 120Z" fill="#b388ff"/><path d="M10 26 Q240 -6 470 26 V46 Q240 16 10 46Z" fill="#fff"/><g fill="#d9c4ff"><path d="M90 90 C70 76 66 62 74 58 C80 55 87 60 90 64 C93 60 100 55 106 58 C114 62 110 76 90 90Z"/><path d="M240 100 C220 86 216 72 224 68 C230 65 237 70 240 74 C243 70 250 65 256 68 C264 72 260 86 240 100Z"/><path d="M390 90 C370 76 366 62 374 58 C380 55 387 60 390 64 C393 60 400 55 406 58 C414 62 410 76 390 90Z"/></g></svg>';
var LAMP='<div class="glow"></div><svg viewBox="0 0 110 170"><path class="shade" d="M18 70 L32 8 H78 L92 70Z" fill="#ffd34d" stroke="#f0a800" stroke-width="4" stroke-linejoin="round"/><rect x="50" y="70" width="10" height="70" fill="#c77dff"/><ellipse cx="55" cy="150" rx="36" ry="12" fill="#c77dff"/><circle cx="74" cy="100" r="6" fill="#ff5fa2"/></svg>';
SV.teddy='<svg viewBox="0 0 100 100"><circle cx="26" cy="22" r="13" fill="#c98a56"/><circle cx="74" cy="22" r="13" fill="#c98a56"/><circle cx="50" cy="40" r="28" fill="#d99a66"/><ellipse cx="50" cy="80" rx="30" ry="22" fill="#d99a66"/><ellipse cx="50" cy="50" rx="11" ry="8" fill="#f3d2b0"/><circle cx="40" cy="36" r="4" fill="#3a2a20"/><circle cx="60" cy="36" r="4" fill="#3a2a20"/><circle cx="50" cy="47" r="4" fill="#3a2a20"/><path d="M42 66 l8 6 8 -6 -8 -6z" fill="#ff5fa2"/></svg>';
SV.book='<svg viewBox="0 0 100 100"><path d="M10 20 Q30 12 50 22 V90 Q30 80 10 88Z" fill="#c77dff"/><path d="M90 20 Q70 12 50 22 V90 Q70 80 90 88Z" fill="#b05cf0"/><path d="M70 40 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#ffd34d"/><path d="M18 34 Q30 30 42 36 M18 46 Q30 42 42 48" stroke="#fff" stroke-width="3" opacity=".6" fill="none"/></svg>';
TOOLS.teddy={name:'دبدوب',svg:SV.teddy,tip:'الدبدوب ينام مع غالية 🧸'};TOOLS.book={name:'قصة',svg:SV.book,tip:'قصة قبل النوم 📖'};
var STORY=['كان يا ما كان، بنت حلوة اسمها غالية تحب الورد والكيك 🌷','وكل يوم تلعب مع خالتها وتضحك وايد 💗','وفي الليل تنام وهي تحلم بالنجوم ✨'];
function sleepCheck(r){var g=r.chars.ghalia;if(!g)return;var z=g.querySelector('.zzz');if(r.night&&r.inBed){if(!z){z=document.createElement('div');z.className='zzz';z.innerHTML='<i>z</i><i>z</i><i>Z</i>';g.appendChild(z);}}else if(z)z.remove();}
function toggleLamp(r){r.night=!r.night;r.lamp.classList.toggle('off',r.night);r.nightEl.classList.toggle('on',r.night);
  if(r.night){sfx.night();if(r.inBed)say('تصبحين على خير يا غالية، أحلام سعيدة يا قلبي 🌙✨');else say('صار ليل! حطي غالية بالسرير 🛏️');}
  else{sfx.sparkle();burst(1030,420,12);say('صباح الخير يا غالية! ☀️');}sleepCheck(r);}
ROOMS.bedroom={name:'غرفة النوم',color:'linear-gradient(135deg,#d9ccff,#8f7bff)',charH:280,
 icon:'<svg viewBox="0 0 100 100"><path d="M60 14 a30 30 0 1 0 26 44 a24 24 0 1 1 -26 -44z" fill="#ffd34d"/><path d="M22 20 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#fff6a8"/><rect x="10" y="66" width="80" height="20" rx="8" fill="#ff9cc8"/><rect x="10" y="56" width="26" height="14" rx="6" fill="#fff"/></svg>',
 bg:BBG,tools:['teddy','book'],
 spawn:{ghalia:[320,690,1],khala:[400,700]},
 intro:'وقت النوم! اسحبي غالية على السرير 🛏️',
 init:function(r){r.inBed=false;r.night=false;
   el(BED_B,'',450,330,460,330,5);r.blanket=el(BED_F,'',440,520,480,150,12);
   var n=document.createElement('div');n.id='night';var s='<div class="st" style="left:215px;top:120px;width:70px;height:70px"><svg viewBox="0 0 100 100"><path d="M60 10 a40 40 0 1 0 30 60 a32 32 0 1 1 -30 -60z" fill="#fff6a8"/></svg></div>';
   for(var i=0;i<34;i++){var sz=A.rnd(12,30);s+='<div class="st" style="left:'+A.rnd(20,1130).toFixed(0)+'px;top:'+A.rnd(10,470).toFixed(0)+'px;width:'+sz+'px;height:'+sz+'px;animation-delay:'+(-A.rnd(0,2)).toFixed(2)+'s">'+A.STAR+'</div>';}
   n.innerHTML=s;A.scene().appendChild(n);r.nightEl=n;
   r.lamp=el(LAMP,'',975,360,110,170,31);r.lamp.id='lamp';
   r.lamp.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();toggleLamp(r);});},
 charDrop:function(who,x,y){var r=R();var on=x>450&&x<910&&y>420;
   if(who==='ghalia'){if(on){r.inBed=true;A.putChar('ghalia',680,655);sfx.pop();burst(680,420,10);say(r.night?'تصبحين على خير يا غالية، أحلام سعيدة يا قلبي 🌙✨':'حلو! الحين طفي اللمبة 💡');sleepCheck(r);return true;}
     r.inBed=false;A.putChar('ghalia',x,y);sleepCheck(r);return true;}
   if(who==='khala'&&on){A.putChar('khala',400,700);say('خالتج جت تقرا لج قصة 📖');return true;}return false;},
 drop:function(id,p){var r=R();var onBed=p.x>440&&p.x<920&&p.y>340&&p.y<680;
   if(id==='teddy'){if(!onBed)return false;if(r.teddy)r.teddy.remove();r.teddy=el(SV.teddy,'',770,470,80,80,13);sfx.pop();burst(810,500,8);say('الدبدوب بينام وياج 🧸');return true;}
   if(id==='book'){if(!onBed&&!A.charAt(p))return false;r.story=r.story==null?0:(r.story+1)%STORY.length;say(STORY[r.story]);sfx.sparkle();burst(p.x,p.y,8);return 'back';}
   return false;}
};

A.ART2={BED_B:BED_B,BED_F:BED_F,CAKE:CAKE,K:K};
ORDER.push('salon','dress','kitchen','bedroom');
})();
