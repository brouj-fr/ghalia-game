/* غرفة الألعاب — illustrated toy room. Ghalia (sprite atlas, Three.js r128 billboard) walks to each toy and
   reacts with body + face; every toy has its own animation and Web Audio sound. Classic script, offline,
   touch-first. Self-contained: registers GAME.ROOMS.toys and lazy-loads three + the Ghalia sprite on first open. */
(function(){
'use strict';
if(!window.GAME||!GAME.api)return;
var A=GAME.api,ROOMS=GAME.ROOMS,ORDER=GAME.ORDER;
(function(){var l=document.createElement('link');l.rel='stylesheet';l.href='toyroom.css';document.head.appendChild(l);})();

/* ---------- English speech lines (on-screen text stays Arabic, speech is English only) ---------- */
var LINES={
 intro:['أهلاً بغرفة الألعاب! اضغطي على أي لعبة وغالية تروح تلعب فيها 🧸','Welcome to the toy room! Tap any toy and Ghalia will go and play with it!'],
 teddy:['دبدوب يحبج! حضنة كبيرة 🧸💗','Teddy loves you! A big hug!'],
 horse:['يلا يا حصاني! تك تك تك 🐴','Giddy up, horsey!'],
 xylo:['موسيقى حلوة! 🎶','Beautiful music!'],
 drum:['بوم بوم! طبل قوي 🥁','Boom, boom! What a big drum!'],
 jack:['بخخخ! طلع المهرج 🤡','Pop! Out comes the clown!'],
 build:['نبني برج عالي! 🧱','Let us build a tall tower!'],
 crash:['طاااح البرج! هههه 😆','Crash! The tower fell down!'],
 puz:['ركبي البزل! اضغطي على القطع 🧩','Let us fix the puzzle! Tap the pieces.'],
 puzok:['برافو! البزل كامل 🌈','Bravo! The puzzle is finished!'],
 pit:['يا سلام! كور بكل مكان 🎈','Wheee! Balls everywhere!'],
 train:['تشو تشو! القطار ماشي 🚂','Choo choo! Here comes the train!'],
 top:['شوفي الدوامة تلف وتلف! 🌀','Look, the spinning top goes round and round!'],
 bub:['فقاعات! فقعيها 🫧','Bubbles! Pop them!'],
 cook:['نطبخ شوربة لذيذة! 🍲','Let us cook yummy soup!'],
 cooked:['الأكل جاهز! يمي 😋','Dinner is ready! Yummy!'],
 house:['بيت العرايس! اسحبي العرايس داخل البيت 🏠','The dollhouse! Drag the dolls inside.'],
 doll:['العروسة دخلت البيت! 💕','The doll is home!'],
 uni:['اليونيكورن السحري! 🦄✨','The magic unicorn!'],
 ball:['شوتي الكورة! ⚽','Kick the ball!'],
 draw:['يلا نرسم! اختاري لون 🖍️','Let us draw! Pick a colour.'],
 drawn:['رسمة تجنن! 🎨','What a beautiful drawing!'],
 me:['هههه! أحب غرفة الألعاب 💗','Hee hee! I love my toy room!'],
 name:['غرفة الألعاب','Toy room']
};
function norm(s){return String(s).replace(/[^\u0621-\u064A\u0660-\u0669A-Za-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();}
function regVoice(){if(!window.VOICE_EN||!VOICE_EN.dict)return;for(var k in LINES)VOICE_EN.dict[norm(LINES[k][0])]=LINES[k][1];}
regVoice();
var lastSayT=0;
function line(k,force){var n=Date.now();if(!force&&n-lastSayT<2200)return;lastSayT=n;A.say(LINES[k][0]);}

/* ---------- Web Audio toy synth ---------- */
var AC=null,OUT=null,NB=null;
function ac(){if(!AC){try{var C=window.AudioContext||window.webkitAudioContext;AC=new C();OUT=AC.createGain();OUT.gain.value=.75;OUT.connect(AC.destination);}catch(e){AC=null;}}
  if(AC&&AC.state==='suspended'){try{AC.resume();}catch(e){}}return AC;}
function tn(f,d,type,v,t0,slide,att){if(!ac())return;var t=AC.currentTime+(t0||0),o=AC.createOscillator(),g=AC.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);
  if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+d);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v||.2,t+(att||.008));g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(g);g.connect(OUT);o.start(t);o.stop(t+d+.05);return o;}
function nz(d,freq,v,t0,type,q){if(!ac())return;if(!NB){NB=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);var a=NB.getChannelData(0);for(var i=0;i<a.length;i++)a[i]=Math.random()*2-1;}
  var t=AC.currentTime+(t0||0),s=AC.createBufferSource();s.buffer=NB;var f=AC.createBiquadFilter();f.type=type||'bandpass';f.frequency.value=freq;f.Q.value=q||1.1;
  var g=AC.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v||.2,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(f);f.connect(g);g.connect(OUT);s.start(t);s.stop(t+d+.05);}
function mt(m){return 440*Math.pow(2,(m-69)/12);}
var S={
 xylo:function(f,t0){tn(f,1.1,'sine',.32,t0);tn(f*3.98,.18,'sine',.06,t0);tn(f*2.76,.35,'triangle',.04,t0);},
 drum:function(){tn(120,.45,'sine',.7,0,48);nz(.18,160,.5);nz(.05,2400,.12);},
 giggle:function(){for(var i=0;i<6;i++){var b=820+Math.random()*180-i*25;tn(b,.1,'triangle',.16,i*.11,b*1.25);tn(b*2,.08,'sine',.04,i*.11);}},
 boing:function(t0){var o=tn(170,.6,'sine',.4,t0,720);tn(340,.5,'triangle',.08,t0,1100);},
 pop:function(){tn(520,.07,'sine',.28,0,1300);nz(.04,3200,.15);},
 clack:function(t0){tn(620+Math.random()*120,.05,'square',.07,t0);nz(.05,2200,.22,t0);},
 crash:function(){for(var i=0;i<9;i++)S.clack(i*.06+Math.random()*.03);nz(.4,700,.25);},
 ding:function(t0){tn(1568,1.2,'sine',.25,t0);tn(2349,1,'sine',.1,(t0||0)+.02);},
 bell:function(){tn(659,.6,'sine',.28);tn(523,.9,'sine',.28,.45);},
 chime:function(){[1047,1319,1568,2093,2637].forEach(function(f,i){tn(f,.6,'sine',.12,i*.07);});},
 tada:function(){[523,659,784,1046,1318].forEach(function(f,i){tn(f,.4,'triangle',.15,i*.1);});},
 clip:function(n){for(var i=0;i<n;i++){tn(i%2?760:980,.05,'square',.07,i*.3);nz(.04,1800,.15,i*.3);}},
 neigh:function(){tn(700,.5,'sawtooth',.05,0,1100);tn(1100,.4,'sawtooth',.04,.25,600);},
 whirr:function(d){if(!ac())return;var t=AC.currentTime,o=AC.createOscillator(),l=AC.createOscillator(),lg=AC.createGain(),g=AC.createGain(),f=AC.createBiquadFilter();
   o.type='sawtooth';o.frequency.setValueAtTime(140,t);o.frequency.linearRampToValueAtTime(260,t+.4);o.frequency.linearRampToValueAtTime(110,t+d);
   l.frequency.value=18;lg.gain.value=30;l.connect(lg);lg.connect(o.frequency);f.type='lowpass';f.frequency.value=900;
   g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.09,t+.15);g.gain.setValueAtTime(.09,t+d-.6);g.gain.exponentialRampToValueAtTime(.0001,t+d);
   o.connect(f);f.connect(g);g.connect(OUT);o.start(t);l.start(t);o.stop(t+d+.05);l.stop(t+d+.05);},
 choo:function(d){tn(880,.7,'square',.045,0);tn(1109,.7,'square',.04,0);tn(880,.5,'square',.04,.8);tn(1109,.5,'square',.035,.8);
   for(var t=0;t<d;t+=.27)nz(.13,500+Math.random()*200,.22,t);},
 bubble:function(){for(var i=0;i<5;i++)tn(300+Math.random()*500,.08,'sine',.08,i*.07,900+Math.random()*600);},
 boil:function(d){for(var t=0;t<d;t+=.09+Math.random()*.08)tn(220+Math.random()*300,.05,'sine',.05,t,600);},
 musicbox:function(){var N=[[72,1],[72,.5],[74,.5],[74,1],[76,.5],[79,.5],[76,1],[72,1]],t=0;N.forEach(function(n){tn(mt(n[0]+12),.5,'triangle',.12,t);tn(mt(n[0]),.6,'sine',.07,t);t+=n[1]*.24;});return t;},
 snap:function(){tn(900,.05,'square',.08);tn(1400,.08,'sine',.12,.04);},
 magic:function(){for(var i=0;i<8;i++)tn(1200+i*180,.3,'sine',.07,i*.05);},
 honk:function(){tn(392,.18,'square',.06);tn(392,.25,'square',.06,.24);},
 scribble:function(){nz(.07,3000+Math.random()*1500,.05,0,'bandpass',.7);}
};

/* ---------- layout (stage px, 1280x720) ---------- */
var BACK=[
 {id:'dollhouse',img:'dollhouse',x:125,base:600,h:250,spot:[180,648]},
 {id:'horse',img:'horse',x:345,base:602,h:180,spot:[398,648]},
 {id:'easel',img:'easel',x:530,base:590,h:215,spot:[565,646]},
 {id:'crayons',img:'crayons',x:618,base:608,h:62,spot:[600,648]},
 {id:'kitchen',img:'kitchen',x:730,base:592,h:200,spot:[690,648]},
 {id:'unicorn',img:'unicorn',x:880,base:600,h:100,spot:[912,648]},
 {id:'teddy',img:'teddy',x:1195,base:614,h:165,spot:[1140,652]}
];
var FRONT=[
 {id:'xylo',img:'xylo',x:245,base:712,h:132,spot:[300,654]},
 {id:'jack',img:'jackbox',x:440,base:714,h:120,spot:[484,654]},
 {id:'puzzle',img:'puzzle',x:735,base:714,h:95,spot:[772,654]},
 {id:'drum',img:'drum',x:858,base:714,h:100,spot:[900,654]},
 {id:'top',img:'top',x:962,base:704,h:82,spot:[1000,652]},
 {id:'pit',img:'ballpit',x:1100,base:716,h:175,spot:[1080,640]},
 {id:'ball',img:'ball',x:1238,base:712,h:64,spot:[1196,654]}
];
var RATIO={dollhouse:385/390,horse:381/366,easel:323/372,crayons:247/248,kitchen:1,unicorn:164/195,teddy:342/392,xylo:330/213,jackbox:240/310,jack:263/301,
 puzzle:219/200,drum:239/266,top:211/284,ballpit:239/186,ball:156/148,engine:335/267,wagons:537/232,wand:180/252,soap:100/183,doll1:108/194,doll2:127/187,baby:113/162};
var BAND={y0:634,y1:692,x0:40,x1:1240};

var st=null; /* per-visit state */
function img(n){return '<img src="img/toys/'+n+'.webp" alt="" draggable="false">';}
function mkToy(t,layer){var w=t.h*RATIO[t.img],d=document.createElement('div');d.className='toy t-'+t.id;d.dataset.toy=t.id;
  d.style.cssText='left:'+(t.x-w/2).toFixed(1)+'px;top:'+(t.base-t.h)+'px;width:'+w.toFixed(1)+'px;height:'+t.h+'px';d.innerHTML=img(t.img);layer.appendChild(d);t.el=d;t.w=w;return d;}
function anim(el,kf,o){try{return el.animate(kf,o);}catch(e){return {onfinish:null,cancel:function(){}};}}
function later(fn,ms){return A.later(fn,ms);}
function rnd(a,b){return a+Math.random()*(b-a);}
function fxAt(cls,x,y,html){var e=document.createElement('div');e.className=cls;e.style.left=x+'px';e.style.top=y+'px';if(html)e.innerHTML=html;st.fx.appendChild(e);return e;}
function floatUp(cls,x,y,html,dur){var e=fxAt(cls,x,y,html);var a=anim(e,[{transform:'translate(-50%,-50%) scale(.3)',opacity:0},{transform:'translate(-50%,-90%) scale(1.1)',opacity:1,offset:.2},{transform:'translate('+rnd(-60,60)+'%,-'+rnd(260,420)+'%) scale(.9)',opacity:0}],{duration:dur||1400,easing:'ease-out'});a.onfinish=function(){e.remove();};}
function squash(el,s){anim(el,[{transform:'scale(1,1)'},{transform:'scale('+(1+s)+','+(1-s)+')'},{transform:'scale('+(1-s*.6)+','+(1+s*.6)+')'},{transform:'scale(1,1)'}],{duration:420,easing:'ease-out'});}
function topOf(t){return {x:t.x,y:t.base-t.h};}

/* ---------- Ghalia: three.js sprite (falls back to the painted PNG) ---------- */
var GL=null; /* {renderer,scene,cam,G,canvas} reused between visits */
function loadScripts(list,cb){var i=0;(function next(){if(i>=list.length){cb(true);return;}var src=list[i++];
  var s=document.createElement('script');s.src=src;s.onload=next;s.onerror=function(){cb(false);};document.head.appendChild(s);})();}
function ensureGL(cb){if(GL){cb(GL);return;}
  var need=[];if(!window.THREE)need.push('lib/three.min.js');if(!window.GHALIA_ATLAS)need.push('ghalia-sprite-atlas.js');if(!window.createGhalia)need.push('ghalia-sprite.js');
  loadScripts(need,function(ok){if(!ok||!window.THREE||!window.createGhalia){cb(null);return;}
    try{var T=THREE,canvas=document.createElement('canvas');canvas.className='trgl';
      var r=new T.WebGLRenderer({canvas:canvas,alpha:true,antialias:true,premultipliedAlpha:true});r.outputEncoding=T.sRGBEncoding;r.setClearColor(0,0);
      var sc=new T.Scene(),cam=new T.OrthographicCamera(-640,640,360,-360,-5000,5000);
      var G=createGhalia(T,{sleepAfter:30});sc.add(G.group);
      GL={T:T,renderer:r,scene:sc,cam:cam,G:G,canvas:canvas};cb(GL);}catch(e){console.warn('[toyroom] webgl off',e);cb(null);}});}
var TILT=14*Math.PI/180;
function gH(y){return 236+(y-634)*.62;}
function startGhalia(){var g={x:640,y:668,tx:640,ty:668,cb:null,yaw:0,face:0,busy:0};st.g=g;
  st.shadow=document.createElement('div');st.shadow.className='trshadow';st.gLayer.appendChild(st.shadow);
  var hit=document.createElement('div');hit.className='trghit';st.gLayer.appendChild(hit);st.ghit=hit;
  hit.addEventListener('pointerdown',function(e){e.stopPropagation();ac();tapGhalia();});
  ensureGL(function(gl){if(!st||st.dead)return;
    if(!gl){var im=document.createElement('div');im.className='gfall';im.innerHTML='<img src="img/ghalia.png" alt="" draggable="false">';st.gLayer.appendChild(im);st.fall=im;}
    else{st.gLayer.appendChild(gl.canvas);gl.G.setExpression('happy',{duration:2});gl.G.react('wave');}
    st.last=performance.now();requestAnimationFrame(frame);});}
function walkTo(x,y,cb){var g=st.g;g.tx=A.clamp(x,BAND.x0,BAND.x1);g.ty=A.clamp(y,BAND.y0,BAND.y1);g.cb=cb||null;}
function G(){return GL&&st&&!st.fall?GL.G:null;}
function expr(n,d){var g=G();if(g)g.setExpression(n,{duration:d||2.2});}
function react(n){var g=G();if(g)g.react(n);else if(st.fall)A.hop(st.fall,n==='jump'?2:1);}
function frame(now){if(!st||st.dead||!st.root.isConnected){st&&(st.dead=true);return;}
  requestAnimationFrame(frame);var dt=Math.min(.05,(now-st.last)/1000);st.last=now;var g=st.g;
  var dx=g.tx-g.x,dy=g.ty-g.y,dist=Math.hypot(dx,dy),sp=270*(gH(g.y)/260),moving=dist>2;
  if(moving){var step=Math.min(dist,sp*dt);g.x+=dx/dist*step;g.y+=dy/dist*step;var want=Math.atan2(dx,dy*1.4);g.yaw=lerpAng(g.yaw,want,1-Math.exp(-14*dt));
    if(dist-step<=2){g.x=g.tx;g.y=g.ty;var cb=g.cb;g.cb=null;if(cb)cb();}}
  else{g.yaw=lerpAng(g.yaw,g.face,1-Math.exp(-8*dt));}
  var h=gH(g.y);
  st.shadow.style.left=g.x+'px';st.shadow.style.top=g.y+'px';st.shadow.style.width=(h*.42)+'px';st.shadow.style.marginLeft=(-h*.21)+'px';
  st.ghit.style.cssText='left:'+(g.x-h*.2)+'px;top:'+(g.y-h)+'px;width:'+(h*.4)+'px;height:'+h+'px';
  if(st.fall){st.fall.style.cssText='left:'+(g.x-h*.19)+'px;top:'+(g.y-h)+'px;width:'+(h*.38)+'px;height:'+h+'px;transform:scaleX('+(dx<-2?-1:1)+')';return;}
  var gl=GL,s=h/1.62,T=gl.T,c=gl.cam;gl.G.group.position.set(g.x,-g.y,0);gl.G.group.scale.setScalar(s);gl.G.group.rotation.y=g.yaw;
  c.position.set(g.x,-g.y+Math.sin(TILT)*1000,Math.cos(TILT)*1000);c.up.set(0,1,0);c.lookAt(g.x,-g.y,0);
  var sx=g.x,syTop=g.y/Math.cos(TILT);c.left=-sx;c.right=1280-sx;c.top=g.y;c.bottom=g.y-720;c.updateProjectionMatrix();
  gl.G.update(dt,{camera:c,speed:moving?sp/s:0});
  var pr=Math.min(2,Math.max(1,(window.devicePixelRatio||1)*A.getScale()));if(gl._pr!==pr){gl._pr=pr;gl.renderer.setPixelRatio(pr);gl.renderer.setSize(1280,720,false);}
  gl.renderer.render(gl.scene,c);}
function lerpAng(a,b,t){var d=b-a;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return a+d*t;}
function goPlay(t,fn){var sp=t.spot;st.g.face=(t.x<sp[0]?-.55:.55);var g=G();if(g&&GL)g.lookAt(new GL.T.Vector3(t.x,-(t.base-t.h*.5),0));
  var near=Math.hypot(st.g.x-sp[0],st.g.y-sp[1])<26;if(near){fn();return;}walkTo(sp[0],sp[1],fn);}
function tapGhalia(){var k=A.pick(['jump','spin','cheer','wave']);react(k);expr('happy');S.giggle();line('me',true);var g=st.g;A.burst(g.x,g.y-gH(g.y)*.8,10);}

/* ---------- toys ---------- */
var PLAY={};
/* teddy: hug, squish, giggle, hearts */
PLAY.teddy=function(t){goPlay(t,function(){react('cheer');expr('happy',2.5);squash(t.el,.14);S.giggle();line('teddy');
  for(var i=0;i<6;i++)(function(i){later(function(){floatUp('heart',t.x+rnd(-50,50),t.base-t.h*.6,'',1600);},i*120);})(i);});};
/* rocking horse */
PLAY.horse=function(t){goPlay(t,function(){react('cheer');expr('happy',3);line('horse');S.clip(10);S.neigh();
  anim(t.el,[{transform:'rotate(0)'},{transform:'rotate(-11deg)'},{transform:'rotate(10deg)'},{transform:'rotate(-9deg)'},{transform:'rotate(8deg)'},{transform:'rotate(-6deg)'},{transform:'rotate(5deg)'},{transform:'rotate(-3deg)'},{transform:'rotate(0)'}],{duration:3000,easing:'ease-in-out'});});};
/* xylophone: 7 tappable bars, each a note */
var XB=[[.222,.5],[.315,.47],[.414,.42],[.51,.37],[.606,.34],[.698,.31],[.786,.26]],XN=[72,74,76,77,79,81,84],XC=['#ff5a5a','#ff9a3c','#ffd23c','#7fdcf0','#4f8dff','#a874ff','#ffffff'];
function xyloInit(t){XB.forEach(function(b,i){var e=document.createElement('div');e.className='xbar';e.dataset.bar=i;e.style.cssText='left:'+((b[0]-.055)*100)+'%;top:'+((b[1]-.3)*100)+'%;width:11%;height:60%';t.el.appendChild(e);});}
function xyloHit(t,i){var e=t.el.querySelectorAll('.xbar')[i];S.xylo(mt(XN[i]));if(e){e.classList.add('hit');setTimeout(function(){e.classList.remove('hit');},160);}
  var bx=t.x-t.w/2+t.w*XB[i][0],by=t.base-t.h+t.h*XB[i][1];var n=fxAt('note',bx,by,A.pick(['♪','♫','♩']));n.style.color=XC[i];
  var a=anim(n,[{transform:'translate(-50%,-50%) scale(.5)',opacity:1},{transform:'translate(-50%,-260%) scale(1.2) rotate('+rnd(-25,25)+'deg)',opacity:0}],{duration:1100,easing:'ease-out'});a.onfinish=function(){n.remove();};}
PLAY.xylo=function(t,e){var bar=e&&e.target&&e.target.dataset&&e.target.dataset.bar;
  if(bar!=null){xyloHit(t,+bar);goPlay(t,function(){react('nod');expr('happy');line('xylo');});return;}
  goPlay(t,function(){react('nod');expr('happy',3);line('xylo');var SONG=[0,0,4,4,5,5,4,3,3,2,2,1,1,0];SONG.forEach(function(k,i){later(function(){xyloHit(t,k);},i*300+(i===6?150:0));});});};
/* drum */
PLAY.drum=function(t){S.drum();squash(t.el,.12);var r=fxAt('ring',t.x,t.base-t.h*.8);r.style.cssText+=';width:40px;height:16px;margin:-8px 0 0 -20px';
  var a=anim(r,[{transform:'scale(1)',opacity:1},{transform:'scale(4)',opacity:0}],{duration:600,easing:'ease-out'});a.onfinish=function(){r.remove();};
  goPlay(t,function(){react('nod');expr('happy');line('drum');});};
/* jack-in-the-box: music box tune, then POP */
function jackInit(t){var j=document.createElement('div');j.className='tpart jackup';var jw=t.h*.9*RATIO.jack;j.style.cssText='position:absolute;left:'+((t.w-jw)/2+4)+'px;top:'+(t.h*.12)+'px;width:'+jw+'px;height:'+(t.h*.9)+'px;z-index:-1;transform:translateY(40px)';
  j.innerHTML=img('jack');t.el.appendChild(j);t.jack=j;t.up=false;}
PLAY.jack=function(t){if(t.busy)return;goPlay(t,function(){if(t.busy)return;t.busy=1;
  if(t.up){anim(t.jack,[{transform:'translateY(-'+(t.h*.78)+'px)'},{transform:'translateY(40px)'}],{duration:450,easing:'ease-in',fill:'forwards'});S.boing();t.up=false;later(function(){t.busy=0;},500);return;}
  expr('thinking',2);var d=S.musicbox()||2;anim(t.el,[{transform:'rotate(0)'},{transform:'rotate(-2deg)'},{transform:'rotate(2deg)'},{transform:'rotate(0)'}],{duration:300,iterations:Math.ceil(d/0.3)});
  later(function(){t.up=true;t.busy=0;S.boing();S.pop();var u=-(t.h*.78);anim(t.jack,[{transform:'translateY(40px)'},{transform:'translateY('+(u-30)+'px) scaleY(1.15)'},{transform:'translateY('+(u+12)+'px) scaleY(.9)'},{transform:'translateY('+(u-6)+'px)'},{transform:'translateY('+u+'px)'}],{duration:700,easing:'ease-out',fill:'forwards'});
    react('jump');expr('surprised',1.2);later(function(){expr('happy',2);S.giggle();},1300);line('jack',true);A.burst(t.x,t.base-t.h-60,14);},d*1000);});};
/* blocks: tap to stack, 7th tap knocks it down */
var TOWER={x:590,base:714,bh:46};
function blocksInit(layer){st.blocks=[];for(var i=0;i<6;i++){var e=document.createElement('div');e.className='toy t-blocks nosh';e.dataset.toy='blocks';var w=TOWER.bh*.94;
  e.style.cssText='width:'+w+'px;height:'+TOWER.bh+'px;left:0;top:0';e.innerHTML=img('block'+i);layer.appendChild(e);var b={el:e,w:w};st.blocks.push(b);}
  scatterBlocks(false);st.stack=0;}
function placeBlock(b,x,base,rot){b.x=x;b.base=base;b.el.style.left=(x-b.w/2)+'px';b.el.style.top=(base-TOWER.bh)+'px';b.el.style.transform='rotate('+(rot||0)+'deg)';b.el.style.zIndex=Math.round(base);}
function scatterBlocks(animate){var P=[[540,712,-8],[588,716,6],[636,710,-4],[560,690,12],[612,694,-10],[658,716,4]];
  st.blocks.forEach(function(b,i){var p=P[i];if(animate){var fx=b.x,fb=b.base;placeBlock(b,p[0]+rnd(-12,12),p[1],p[2]+rnd(-20,20));
    var dxx=fx-b.x,dyy=fb-b.base;anim(b.el,[{transform:'translate('+dxx+'px,'+dyy+'px) rotate(0)'},{transform:'translate('+dxx*.5+'px,'+(dyy*.5-90)+'px) rotate('+rnd(-200,200)+'deg)',offset:.45},{transform:'translate(0,0) rotate('+(p[2])+'deg)'}],{duration:rnd(650,900),easing:'ease-in'});}
    else placeBlock(b,p[0],p[1],p[2]);});}
var BT={id:'blocks',x:590,base:714,h:60,spot:[650,652]};
PLAY.blocks=function(){if(st.blockBusy)return;
  if(st.stack>=6){st.blockBusy=1;goPlay(BT,function(){react('jump');expr('surprised',1);later(function(){S.crash();scatterBlocks(true);st.stack=0;line('crash',true);later(function(){S.giggle();expr('happy',2.5);react('cheer');st.blockBusy=0;},900);},250);});return;}
  var b=st.blocks[st.stack],k=st.stack;st.stack++;st.blockBusy=1;var fx=b.x,fb=b.base;placeBlock(b,TOWER.x+rnd(-3,3),TOWER.base-k*(TOWER.bh-6),rnd(-3,3));
  var dxx=fx-b.x,dyy=fb-b.base;anim(b.el,[{transform:'translate('+dxx+'px,'+dyy+'px)'},{transform:'translate('+dxx*.5+'px,'+(Math.min(dyy,0)-110)+'px) rotate(180deg)',offset:.55},{transform:'translate(0,-8px) scale(1.1,.9)',offset:.85},{transform:'translate(0,0)'}],{duration:520,easing:'ease-in-out'});
  later(function(){S.clack();st.blockBusy=0;if(st.stack===6){S.tada();A.burst(TOWER.x,TOWER.base-6*40-20,14);}},500);
  goPlay(BT,function(){react(st.stack===6?'cheer':'nod');expr('happy');if(k===0)line('build');});};
/* puzzle: scatters into 4 pieces, tap each to snap back */
function puzzleScatter(t){var L=t.x-t.w/2,T0=t.base-t.h,pw=t.w/2,ph=t.h/2;t.el.style.visibility='hidden';t.pieces=[];
  var slots=document.createElement('div');slots.className='slot';slots.style.cssText='left:'+L+'px;top:'+T0+'px;width:'+t.w+'px;height:'+t.h+'px';st.front.appendChild(slots);t.slots=slots;
  var DEST=[[t.x-150,720],[t.x-95,640],[t.x+95,650],[t.x+150,712]];
  for(var i=0;i<4;i++){var cx=i%2,cy=i>>1,p=document.createElement('div');p.className='piece';p.dataset.piece=i;
    p.style.cssText='left:'+(L+cx*pw)+'px;top:'+(T0+cy*ph)+'px;width:'+pw+'px;height:'+ph+'px;background-image:url(img/toys/puzzle.webp);background-size:'+(t.w)+'px '+(t.h)+'px;background-position:-'+(cx*pw)+'px -'+(cy*ph)+'px;z-index:800';
    st.front.appendChild(p);var d=DEST[i],tx=d[0]-pw/2-(L+cx*pw),ty=d[1]-ph-(T0+cy*ph),r=rnd(-30,30);
    p._home='translate(0,0) rotate(0)';p._away='translate('+tx+'px,'+ty+'px) rotate('+r+'deg)';
    anim(p,[{transform:p._home},{transform:'translate('+tx*.5+'px,'+(ty*.5-80)+'px) rotate('+r*2+'deg)'},{transform:p._away}],{duration:600,easing:'ease-out',fill:'forwards'});
    (function(p){p.addEventListener('pointerdown',function(e){e.stopPropagation();ac();if(p._in)return;p._in=1;S.snap();
      anim(p,[{transform:p._away},{transform:p._home}],{duration:420,easing:'cubic-bezier(.3,1.4,.6,1)',fill:'forwards'});
      if(t.pieces.every(function(q){return q._in;}))later(function(){t.pieces.forEach(function(q){q.remove();});t.slots.remove();t.el.style.visibility='';t.broken=false;
        S.tada();A.burst(t.x,t.base-t.h/2,20);squash(t.el,.1);react('cheer');expr('happy',3);line('puzok',true);},450);
      else{react('nod');expr('happy',1.2);}});})(p);t.pieces.push(p);}
  t.broken=true;}
PLAY.puzzle=function(t){if(t.broken)return;goPlay(t,function(){if(t.broken)return;S.clack();S.clack(.08);puzzleScatter(t);expr('thinking',3);line('puz',true);});};
/* ball pit: balls fly everywhere */
var PB=['#ff7eb6','#ffd34d','#6fc3ff','#b388ff','#ffffff','#ff9a5a'];
PLAY.pit=function(t){goPlay(t,function(){react('jump');expr('surprised',.8);later(function(){expr('happy',2.5);S.giggle();},800);line('pit');
  for(var i=0;i<16;i++)(function(i){later(function(){var x0=t.x+rnd(-60,60),y0=t.base-t.h*.62,b=fxAt('pball',x0,y0);var s=rnd(18,28);b.style.cssText+=';width:'+s+'px;height:'+s+'px;margin:-'+s/2+'px 0 0 -'+s/2+'px;background:'+PB[i%PB.length];
    var dx=rnd(-190,190),up=rnd(120,230),land=rnd(-30,10);S.boing(0);
    var a=anim(b,[{transform:'translate(0,0)'},{transform:'translate('+dx*.5+'px,-'+up+'px)',easing:'ease-in'},{transform:'translate('+dx+'px,'+land+'px)',easing:'ease-out'},{transform:'translate('+dx*1.08+'px,'+(land-25)+'px)',easing:'ease-in'},{transform:'translate('+dx*1.12+'px,'+land+'px)',opacity:1},{transform:'translate('+dx*1.12+'px,'+land+'px)',opacity:0}],{duration:1900,easing:'ease-out'});a.onfinish=function(){b.remove();};},i*45);})(i);
  squash(t.el,.08);});};
/* train: choo choo around the room */
function trainInit(layer){var e=document.createElement('div');e.className='toy t-train nosh';e.dataset.toy='train';var eh=74,ew=eh*RATIO.engine,wh=64,ww=wh*RATIO.wagons;
  e.style.cssText='left:935px;top:'+(628-eh)+'px;width:'+(ew+ww-8)+'px;height:'+eh+'px;transform-origin:50% 100%';
  e.innerHTML='<div class="tpart" style="position:absolute;left:'+(ew-8)+'px;top:'+(eh-wh)+'px;width:'+ww+'px;height:'+wh+'px">'+img('wagons')+'</div><div class="tpart" style="position:absolute;left:0;top:0;width:'+ew+'px;height:'+eh+'px">'+img('engine')+'</div>';
  layer.appendChild(e);return {id:'train',el:e,x:1050,base:628,h:74,w:ew+ww,spot:[1050,664]};}
PLAY.train=function(t){if(t.busy)return;t.busy=1;S.choo(5.5);line('train',true);
  goPlay(t,function(){react('cheer');expr('happy',4);});
  var puff=setInterval(function(){if(!st||st.dead){clearInterval(puff);return;}var r=t.el.getBoundingClientRect(),s=A.toStage({clientX:r.left+r.width*0.12,clientY:r.top});
    if(s.x<-60||s.x>1340)return;var p=fxAt('steam',s.x,s.y);var a=anim(p,[{transform:'translate(-50%,-50%) scale(.5)',opacity:.9},{transform:'translate(-10%,-260%) scale(2.4)',opacity:0}],{duration:1300,easing:'ease-out'});a.onfinish=function(){p.remove();};},160);
  st.timers.push(puff);
  var bob=[{transform:'translate(0,0)'}];
  var a=anim(t.el,[{transform:'translateX(0)'},{transform:'translateX(-1250px)',offset:.55},{transform:'translateX(-1250px)',offset:.551},{transform:'translateX(420px)',offset:.552},{transform:'translateX(0)'}],{duration:6200,easing:'linear'});
  var wob=t.el.querySelectorAll('.tpart');for(var i=0;i<wob.length;i++)anim(wob[i],[{transform:'translateY(0)'},{transform:'translateY(-3px)'},{transform:'translateY(0)'}],{duration:260,iterations:22});
  a.onfinish=function(){clearInterval(puff);t.busy=0;S.ding();};
  later(function(){clearInterval(puff);t.busy=0;},6600);};
/* spinning top */
PLAY.top=function(t){if(t.busy)return;t.busy=1;goPlay(t,function(){react('spin');expr('happy',3);});line('top',true);S.whirr(3.2);
  var im=t.el.querySelector('img');anim(im,[{transform:'scaleX(1) skewX(0)',filter:'hue-rotate(0deg)'},{transform:'scaleX(.82) skewX(4deg)',filter:'hue-rotate(90deg)'},{transform:'scaleX(1) skewX(0)',filter:'hue-rotate(180deg)'}],{duration:110,iterations:24});
  var path=[];for(var i=0;i<=24;i++){var a=i/24*Math.PI*4;path.push({transform:'translate('+(Math.sin(a)*70).toFixed(1)+'px,'+(Math.sin(a*2)*-10).toFixed(1)+'px) rotate('+(Math.sin(a*3)*(4+i*.3)).toFixed(1)+'deg)'});}
  anim(t.el,path,{duration:2700,easing:'linear'}).onfinish=function(){anim(t.el,[{transform:'rotate(0)'},{transform:'rotate(14deg)'},{transform:'rotate(-18deg)'},{transform:'rotate(62deg)',offset:.75},{transform:'rotate(55deg)',offset:.85},{transform:'rotate(62deg)'}],{duration:900,easing:'ease-in'}).onfinish=function(){
    S.clack();later(function(){anim(t.el,[{transform:'rotate(62deg)'},{transform:'rotate(0)'}],{duration:400,easing:'ease-out'});t.busy=0;},700);};};};
/* bubbles */
function bubblesInit(layer){var e=document.createElement('div');e.className='toy t-bub';e.dataset.toy='bub';var wh=105,ww=wh*RATIO.wand,sh=70,sw=sh*RATIO.soap;
  e.style.cssText='left:12px;top:'+(712-wh)+'px;width:'+(ww+sw)+'px;height:'+wh+'px';
  e.innerHTML='<div class="tpart wand" style="position:absolute;left:0;top:0;width:'+ww+'px;height:'+wh+'px;transform-origin:50% 90%">'+img('wand')+'</div><div class="tpart" style="position:absolute;left:'+(ww-6)+'px;top:'+(wh-sh)+'px;width:'+sw+'px;height:'+sh+'px">'+img('soap')+'</div>';
  layer.appendChild(e);return {id:'bub',el:e,x:60,base:712,h:105,w:ww+sw,spot:[130,652]};}
function blowBubble(x,y){var s=rnd(30,64),b=fxAt('bbl',x,y);b.style.cssText+=';width:'+s+'px;height:'+s+'px;margin:-'+s/2+'px 0 0 -'+s/2+'px';
  var dx=rnd(40,520),up=rnd(330,560),dur=rnd(4200,6500);var a=anim(b,[{transform:'translate(0,0) scale(.2)'},{transform:'translate('+dx*.3+'px,-'+up*.3+'px) scale(1)',offset:.2},{transform:'translate('+(dx*.6+30)+'px,-'+up*.65+'px) scale(1.04)',offset:.6},{transform:'translate('+dx+'px,-'+up+'px) scale(1)'}],{duration:dur,easing:'ease-out'});
  a.onfinish=function(){b.remove();};b.addEventListener('pointerdown',function(e){e.stopPropagation();ac();var r=b.getBoundingClientRect(),p=A.toStage({clientX:r.left+r.width/2,clientY:r.top+r.height/2});
    a.cancel();b.remove();S.pop();A.burst(p.x,p.y,6,['#bfefff','#ffffff','#ffc0e6']);});}
PLAY.bub=function(t){var w=t.el.querySelector('.wand');anim(w,[{transform:'rotate(0)'},{transform:'rotate(18deg)'},{transform:'rotate(-10deg)'},{transform:'rotate(0)'}],{duration:900});S.bubble();
  for(var i=0;i<10;i++)(function(i){later(function(){blowBubble(t.el.offsetLeft+28+rnd(-6,6),t.base-t.h+22);},i*90);})(i);
  goPlay(t,function(){react('wave');expr('happy',3);line('bub');});};
/* kitchen: hob glows, pot bubbles, ding */
function kitchenInit(t){var h=document.createElement('div');h.className='hob';h.style.cssText='left:'+(t.w*.28)+'px;top:'+(t.h*.26)+'px;width:'+(t.w*.62)+'px;height:'+(t.h*.12)+'px';t.el.appendChild(h);t.hob=h;}
PLAY.kitchen=function(t){if(t.busy)return;t.busy=1;goPlay(t,function(){expr('thinking',2.5);react('nod');line('cook');t.hob.classList.add('on');S.boil(2.6);
  var px=t.x-t.w/2+t.w*.68,py=t.base-t.h+t.h*.08;var iv=setInterval(function(){var p=fxAt('steam',px+rnd(-14,14),py);var a=anim(p,[{transform:'translate(-50%,-50%) scale(.5)',opacity:.85},{transform:'translate(-50%,-320%) scale(2)',opacity:0}],{duration:1500,easing:'ease-out'});a.onfinish=function(){p.remove();};},150);st.timers.push(iv);
  anim(t.el,[{transform:'translateX(0)'},{transform:'translateX(-1.5px)'},{transform:'translateX(1.5px)'},{transform:'translateX(0)'}],{duration:180,iterations:14});
  later(function(){clearInterval(iv);t.hob.classList.remove('on');S.ding();react('cheer');expr('happy',3);line('cooked',true);A.burst(px,py,12,['#ffd34d','#ff7eb6','#ffffff']);t.busy=0;},2800);});};
/* unicorn: magic hop */
PLAY.unicorn=function(t){goPlay(t,function(){react('jump');expr('surprised',.8);later(function(){expr('happy',2);},900);line('uni');});S.magic();S.neigh();
  anim(t.el,[{transform:'translateY(0)'},{transform:'translateY(-50px) rotate(-8deg)'},{transform:'translateY(0) scale(1.1,.9)'},{transform:'translateY(-22px)'},{transform:'translateY(0)'}],{duration:900,easing:'ease-out'});
  A.burst(t.x,t.base-t.h,16,['#ff9ad5','#ffe066','#9fe3ff','#c9a0ff','#ffffff']);};
/* ball: kick and bounce */
PLAY.ball=function(t){if(t.busy)return;t.busy=1;goPlay(t,function(){react('jump');expr('happy',2);line('ball');S.boing();
  var nx=t.x>900?A.clamp(t.x-rnd(380,560),300,1240):A.clamp(t.x+rnd(380,560),100,1238),dx=nx-t.x;
  var a=anim(t.el,[{transform:'translate(0,0) rotate(0)'},{transform:'translate('+dx*.35+'px,-170px) rotate('+dx*.6+'deg)',easing:'ease-in'},{transform:'translate('+dx*.7+'px,0) rotate('+dx*1.1+'deg)',easing:'ease-out'},{transform:'translate('+dx*.86+'px,-60px) rotate('+dx*1.4+'deg)',easing:'ease-in'},{transform:'translate('+dx+'px,0) rotate('+dx*1.6+'deg)'}],{duration:1300});
  later(function(){S.boing();},560);later(function(){S.boing();},1100);
  a.onfinish=function(){t.x=nx;t.el.style.left=(nx-t.w/2)+'px';t.spot=[A.clamp(nx-46,60,1200),654];t.busy=0;};});};
/* dollhouse + draggable dolls */
var DH_ROOMS=[[.28,.14,.66,.19],[.28,.39,.66,.19],[.28,.64,.66,.19]];
function houseInit(t){DH_ROOMS.forEach(function(r){var w=document.createElement('div');w.className='win';w.style.cssText='left:'+r[0]*100+'%;top:'+r[1]*100+'%;width:'+r[2]*100+'%;height:'+r[3]*100+'%';t.el.appendChild(w);});t.el.classList.add('dh');
  var D=[['doll1',72,62,656],['doll2',70,250,662],['baby',54,105,668]];st.dolls=[];
  D.forEach(function(d){var e=document.createElement('div');e.className='toy doll';e.dataset.toy='doll';var h=d[1],w=h*RATIO[d[0]];e.innerHTML=img(d[0]);
    var o={el:e,w:w,h:h,x:d[2],base:d[3]};e.style.cssText='width:'+w+'px;height:'+h+'px';placeDoll(o);st.front.appendChild(e);st.dolls.push(o);
    A.drag(e,{start:function(p){ac();S.snap();e.style.zIndex=900;return {dx:p.x-o.x,dy:p.y-o.base};},
      move:function(c,p){o.x=p.x-c.dx;o.base=p.y-c.dy;placeDoll(o,1);},
      end:function(c,p,tap){if(tap){squash(e,.15);S.giggle();A.burst(o.x,o.base-o.h,6);return;}
        var L=t.x-t.w/2,T0=t.base-t.h;var fl=DH_ROOMS.map(function(r){return T0+(r[1]+r[3])*t.h;});
        if(o.x>L+10&&o.x<L+t.w-10&&o.base>T0&&o.base<t.base+10){var k=0,best=1e9;fl.forEach(function(y,i){var dd=Math.abs(y-o.base);if(dd<best){best=dd;k=i;}});o.base=fl[k];o.x=A.clamp(o.x,L+t.w*.36,L+t.w*.86);placeDoll(o);
          t.el.classList.add('lit');S.chime();A.burst(o.x,o.base-o.h*.6,12);line('doll',true);react('cheer');expr('happy',2);}
        else{o.base=A.clamp(o.base,600,716);o.x=A.clamp(o.x,20,1260);placeDoll(o);S.snap();}}});});}
function placeDoll(o,drag){o.el.style.left=(o.x-o.w/2)+'px';o.el.style.top=(o.base-o.h)+'px';if(!drag)o.el.style.zIndex=Math.round(o.base);}
PLAY.dollhouse=function(t){t.el.classList.toggle('lit');S.bell();goPlay(t,function(){react('wave');expr('happy',2.5);line('house');
  st.dolls.forEach(function(d,i){later(function(){A.hop(d.el);},i*140);});});};
/* easel + crayons: drawing panel */
var CRC=['#ff4d6d','#ff9f1c','#ffd60a','#4cc96a','#3a86ff','#8338ec','#ff70c4','#6b3e26'];
function easelInit(t){var p=document.createElement('div');p.className='paper';p.style.cssText='left:23%;top:13%;width:64%;height:60%';t.el.appendChild(p);t.paper=p;}
PLAY.crayons=function(t){S.clack();squash(t.el,.1);PLAY.easel(st.toy.easel);};
PLAY.easel=function(t){goPlay(t,function(){react('nod');expr('thinking',2);line('draw',true);openDraw(t);});};
function openDraw(t){if(st.root.querySelector('.trdraw'))return;var o=document.createElement('div');o.className='trdraw';
  o.innerHTML='<div class="pad"><canvas width="996" height="726"></canvas></div><div class="side">'+CRC.map(function(c,i){return '<div class="cr'+(i===0?' on':'')+'" data-c="'+c+'" style="background:'+c+'"></div>';}).join('')+'<button class="cl">🗑</button><button class="ok">✓</button></div>';
  st.root.appendChild(o);var cv=o.querySelector('canvas'),cx=cv.getContext('2d'),col=CRC[0];cx.lineCap='round';cx.lineJoin='round';
  if(t.drawing){var im=new Image();im.onload=function(){cx.drawImage(im,0,0);};im.src=t.drawing;}
  o.addEventListener('pointerdown',function(e){e.stopPropagation();});
  o.querySelectorAll('.cr').forEach(function(c){c.addEventListener('pointerdown',function(){ac();col=c.dataset.c;S.snap();o.querySelectorAll('.cr').forEach(function(x){x.classList.toggle('on',x===c);});});});
  o.querySelector('.cl').addEventListener('click',function(){cx.clearRect(0,0,cv.width,cv.height);S.whirr(.5);});
  o.querySelector('.ok').addEventListener('click',function(){t.drawing=cv.toDataURL('image/png');t.paper.innerHTML='<img src="'+t.drawing+'" alt="">';o.remove();S.tada();A.burst(t.x,t.base-t.h*.6,16);react('cheer');expr('happy',3);line('drawn',true);});
  function cp(e){var r=cv.getBoundingClientRect(),p=A.toStage(e),q=A.toStage({clientX:r.left,clientY:r.top}),q2=A.toStage({clientX:r.right,clientY:r.bottom});
    var x0=Math.min(q.x,q2.x),y0=Math.min(q.y,q2.y);return {x:(p.x-x0)/664*cv.width,y:(p.y-y0)/484*cv.height};}
  var drawing=null,n=0;
  cv.addEventListener('pointerdown',function(e){e.preventDefault();ac();try{cv.setPointerCapture(e.pointerId);}catch(_){}drawing=cp(e);cx.fillStyle=col;cx.beginPath();cx.arc(drawing.x,drawing.y,9,0,7);cx.fill();});
  cv.addEventListener('pointermove',function(e){if(!drawing)return;var p=cp(e);cx.strokeStyle=col;cx.lineWidth=18;cx.globalAlpha=.92;cx.beginPath();cx.moveTo(drawing.x,drawing.y);cx.lineTo(p.x,p.y);cx.stroke();cx.globalAlpha=1;drawing=p;if(++n%4===0)S.scribble();});
  function up(){drawing=null;}cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);}

/* ---------- room ---------- */
function buildRoom(){var root=st.root;
  root.innerHTML='<img class="trplate" src="img/bg-toyroom.jpg" alt="" draggable="false"><div class="trglow"></div><div class="trtrack"></div><div class="trlay trback"></div><div class="trlay trg"></div><div class="trlay trfront"></div><div class="trfx"></div>';
  st.back=root.querySelector('.trback');st.gLayer=root.querySelector('.trg');st.front=root.querySelector('.trfront');st.fx=root.querySelector('.trfx');
  var FL=[[415,22],[468,48],[525,62],[585,66],[645,60],[703,50],[762,42],[818,40],[875,40],[930,36],[990,30],[1045,22],[1100,18],[1160,14],[1218,12],[1250,10]];
  root.querySelector('.trglow').innerHTML=FL.map(function(p,i){return '<i class="trfl" style="left:'+p[0]*1.25+'px;top:'+(p[1]*1.25+8)+'px;animation-delay:'+(i*.31%2.4).toFixed(2)+'s"></i>';}).join('')+
    Array.apply(null,{length:14}).map(function(){return '<i class="trmote" style="left:'+rnd(80,1200).toFixed(0)+'px;top:'+rnd(150,560).toFixed(0)+'px;animation-delay:-'+rnd(0,9).toFixed(1)+'s"></i>';}).join('');
  st.toy={};BACK.concat(FRONT).forEach(function(d){var t={};for(var k in d)t[k]=d[k];t.spot=d.spot.slice();mkToy(t,BACK.indexOf(d)>=0?st.back:st.front);t.el.style.zIndex=t.base;st.toy[t.id]=t;});
  xyloInit(st.toy.xylo);jackInit(st.toy.jack);kitchenInit(st.toy.kitchen);easelInit(st.toy.easel);
  st.toy.train=trainInit(st.back);st.toy.train.el.style.zIndex=628;st.toy.bub=bubblesInit(st.front);st.toy.bub.el.style.zIndex=712;
  blocksInit(st.front);houseInit(st.toy.dollhouse);
  root.addEventListener('pointerdown',function(e){ac();if(st.root.querySelector('.trdraw'))return;var el=e.target.closest&&e.target.closest('[data-toy]');
    if(el){var id=el.dataset.toy;if(id==='doll')return;var t=id==='blocks'?BT:st.toy[id];if(PLAY[id]){e.preventDefault();PLAY[id](t,e);}return;}
    var p=A.toStage(e);if(p.y>560){walkTo(p.x,p.y);st.g.face=0;S.snap();}else{react('wave');expr('happy',1.5);}});
  /* gentle parallax on the painted plate */
  var plate=root.querySelector('.trplate'),cx=0,cy=0,tx=0,ty=0;function pm(e){tx=e.clientX/innerWidth-.5;ty=e.clientY/innerHeight-.5;}
  addEventListener('pointermove',pm);var t0=performance.now();
  (function loop(now){if(!root.isConnected){removeEventListener('pointermove',pm);return;}requestAnimationFrame(loop);var t=(now-t0)/1000;cx+=(tx+Math.sin(t*.21)*.15-cx)*.05;cy+=(ty+Math.cos(t*.17)*.08-cy)*.05;
    plate.style.transform='translate3d('+(-cx*20).toFixed(2)+'px,'+(-cy*10).toFixed(2)+'px,0)';})(t0);
  /* idle hints: a random toy glows now and then */
  st.timers.push(setInterval(function(){var ids=Object.keys(st.toy),h=st.root.querySelector('.toy.hint');if(h)h.classList.remove('hint');var t=st.toy[A.pick(ids)];if(t&&t.el)t.el.classList.add('hint');},3800));
}
var ICON='<img src="img/thumbs/toys.jpg" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:18px" draggable="false">';
ROOMS.toys={name:'غرفة الألعاب',color:'url(img/thumbs/toys.jpg) center/cover',icon:'<img src="img/toys/teddy.webp" alt="" draggable="false" style="width:100%;height:100%;object-fit:contain">',bg:'<div class="troom"></div>',tools:[],noCarousel:true,noWalk:true,noWander:true,charH:280,
  intro:LINES.intro[0],
  init:function(R){if(st){st.dead=true;st.timers.forEach(function(x){clearInterval(x);});}regVoice();
    var root=A.scene().querySelector('.troom');st={root:root,timers:[],dead:false};    var tm=st.timers;R.toyState=st;buildRoom();startGhalia();
    /* game.js clears R.timers on room change: route our intervals through it as well */
    var push=st.timers.push.bind(st.timers);st.timers.push=function(x){R.timers.push(x);return push(x);};tm.forEach(function(x){R.timers.push(x);});}
};
ORDER.push('toys');
/* menu card: same illustrated-thumbnail treatment as the other v2 cards */
(function(){function deco(){var cs=document.querySelectorAll('#inner .card[data-room="toys"]');for(var i=0;i<cs.length;i++){var c=cs[i];if(c._v2t)continue;c._v2t=1;c.classList.add('v2card');var bg=c.querySelector('.cbg');if(bg)bg.style.background='url(img/thumbs/toys.jpg) center/cover';}}
 var m=document.getElementById('menu');if(m){deco();new MutationObserver(deco).observe(m,{childList:true,subtree:true});}})();
window.TOYROOM={lines:LINES,play:PLAY,state:function(){return st;},sfx:S};
})();
