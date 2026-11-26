/* Dot-tracing letters for Ghalia (Arabic 28 isolated letters RTL + English A-Z upper/lower).
   Guide = dotted chalk path + numbered start badge + arrows. Ink only appears while the finger stays on the path;
   strokes are checked in order. Success: Ghalia cheers, confetti, stars (localStorage), coins (ghalia_coins).
   Speech: English only (pre-recorded files in audio/trace). Arabic letters: sound effects + written name, never speech. */
(function(){
'use strict';
var T=window.TRACE_LETTERS,V2=window.V2||{};
var $=function(s){return document.querySelector(s);};
var NS='http://www.w3.org/2000/svg';
var KEY='ghalia_trace_v1',CKEY='ghalia_coins';
var params=new URLSearchParams(location.search),FROM=params.get('from')||'';
var TOL=8.5,OFF=13,AHEAD=14,START=11,DOTR=10;

/* ---------- storage ---------- */
function load(){try{return JSON.parse(localStorage.getItem(KEY))||{};}catch(e){return {};}}
var SAVE=load();['ar','up','lo'].forEach(function(k){SAVE[k]=SAVE[k]||{};});
function persist(){try{localStorage.setItem(KEY,JSON.stringify(SAVE));}catch(e){}}
function coins(){var c=0;try{c=parseInt(localStorage.getItem(CKEY)||'0',10);}catch(e){}return isNaN(c)?0:c;}
var roll=null;try{roll=new V2.RollCounter($('#tr-coins'),coins(),3);}catch(e){$('#tr-coins').textContent='🪙 '+coins();}
function addCoins(n){var c=coins()+n;try{localStorage.setItem(CKEY,String(c));}catch(e){}if(roll)roll.set(c);else $('#tr-coins').textContent='🪙 '+c;}

/* ---------- audio: WebAudio sfx + English voice files ---------- */
var AC=null,master=null,nb=null,sound=(V2.isSound?V2.isSound():true);
function ac(){if(!AC){try{var C=window.AudioContext||window.webkitAudioContext;AC=new C();master=AC.createGain();master.gain.value=.7;master.connect(AC.destination);}catch(e){return null;}}if(AC.state==='suspended')try{AC.resume();}catch(e){}return AC;}
function tone(f,d,type,v,t0,slide){if(!sound)return;var C=ac();if(!C)return;var t=C.currentTime+(t0||0),o=C.createOscillator(),g=C.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+d);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(master);o.start(t);o.stop(t+d+.05);}
function chalk(){if(!sound)return;var C=ac();if(!C)return;if(!nb){nb=C.createBuffer(1,C.sampleRate*.5,C.sampleRate);var a=nb.getChannelData(0);for(var i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*(Math.random()<.3?1:.35);}
  var s=C.createBufferSource();s.buffer=nb;var f=C.createBiquadFilter();f.type='bandpass';f.frequency.value=2600+Math.random()*1800;f.Q.value=.9;var g=C.createGain(),t=C.currentTime;g.gain.setValueAtTime(.05,t);g.gain.exponentialRampToValueAtTime(.0001,t+.09);s.connect(f);f.connect(g);g.connect(master);s.start(t,Math.random()*.3);s.stop(t+.1);}
var SFX={
  start:function(){tone(660,.1,'sine',.14,0,990);},
  step:function(i){tone([784,988,1175,1319,1568][i%5],.35,'triangle',.13);tone([784,988,1175,1319,1568][i%5]*2,.2,'sine',.04,.04);},
  nope:function(){tone(300,.14,'triangle',.12,0,210);},
  dot:function(){tone(1400,.12,'sine',.12,0,1900);},
  win:function(){[523,659,784,1046,1318,1568].forEach(function(f,i){tone(f,.4,'triangle',.12,i*.09);});[2093,2637,3136].forEach(function(f,i){tone(f,.3,'sine',.05,.6+i*.06);});},
  coin:function(){tone(1318,.08,'square',.05);tone(1976,.2,'square',.05,.07);},
  pop:function(){tone(420,.14,'sine',.18,0,1000);}
};
var voice=null;
function play(name){if(!sound)return;try{if(voice){voice.pause();}voice=new Audio('audio/trace/'+name+'.mp3');voice.volume=1;var p=voice.play();if(p&&p.catch)p.catch(function(){});}catch(e){}}
function sndUI(){$('#tr-snd').textContent=sound?'🔊':'🔇';}
$('#tr-snd').addEventListener('click',function(){sound=!sound;try{V2.setSound&&V2.setSound(sound);}catch(e){}if(!sound&&voice)voice.pause();sndUI();});sndUI();
addEventListener('pointerdown',function(){ac();},{once:true});

/* ---------- Ghalia sprite (illustrated frames) ---------- */
var GH=$('#tr-ghalia'),ga=GH.querySelector('img.a'),gb=GH.querySelector('img.b'),gCur='',gFront=ga,gTimer=0,gBase='neutral';
['neutral','happy','thinking','surprised','sad','cheer','wave','jump_air'].forEach(function(n){var i=new Image();i.src='img/trace/g-'+n+'.webp';});
function face(n,ms){clearTimeout(gTimer);if(n!==gCur){var back=gFront===ga?gb:ga;back.src='img/trace/g-'+n+'.webp';back.style.opacity=1;gFront.style.opacity=0;gFront=back;gCur=n;}
  if(ms)gTimer=setTimeout(function(){face(gBase);},ms);}
function body(kind){var a=null;if(!GH.animate)return;
  if(kind==='hop')a=[{transform:'translateY(0) scale(1)'},{transform:'translateY(0) scale(1.06,.92)',offset:.2},{transform:'translateY(-9%) scale(.96,1.05)',offset:.5},{transform:'translateY(0) scale(1.04,.96)',offset:.8},{transform:'none'}];
  else if(kind==='shake')a=[{transform:'rotate(0)'},{transform:'rotate(-4deg)'},{transform:'rotate(4deg)'},{transform:'rotate(-2deg)'},{transform:'none'}];
  else if(kind==='lean')a=[{transform:'none'},{transform:'rotate('+(layoutLeanDir*3)+'deg) translateX('+(layoutLeanDir*2)+'%)'}];
  else if(kind==='jump')a=[{transform:'none'},{transform:'scale(1.08,.9)',offset:.15},{transform:'translateY(-18%) scale(.95,1.06)',offset:.45},{transform:'translateY(0) scale(1.06,.94)',offset:.75},{transform:'none'}];
  if(!a)return;GH.classList.remove('idle');var an=GH.animate(a,{duration:kind==='lean'?300:kind==='jump'?800:520,easing:'ease-out',fill:kind==='lean'?'forwards':'none'});
  if(kind!=='lean')an.onfinish=function(){GH.classList.add('idle');};}
var layoutLeanDir=1;

/* ---------- state ---------- */
var set='ar',idx=0,L=null,strokes=[],si=0,mistakes=0,tracing=false,lastChalk=0,hintT=0,won=false;
function list(s){return s==='ar'?T.ar:T.en;}
function strokesOf(s,i){var e=list(s)[i];return s==='ar'?e.s:s==='up'?e.U:e.L;}
function glyph(s,i){var e=list(s)[i];return s==='ar'?e.ch:s==='up'?e.u:e.u.toLowerCase();}
function starsOf(s,i){return SAVE[s][i]||0;}
function starStr(n){var h='';for(var k=0;k<3;k++)h+='<span class="'+(k<n?'':'off')+'">⭐</span>';return h;}

/* ---------- picker ---------- */
var grid=$('#tr-grid');
function drawPicker(){var tabs=document.querySelectorAll('.tr-tabs button');for(var k=0;k<tabs.length;k++)tabs[k].classList.toggle('on',tabs[k].dataset.set===set);
  grid.innerHTML='';grid.classList.toggle('ltr',set!=='ar');var n=list(set).length,tot=0,full=0;
  for(var i=0;i<n;i++){(function(i){var st=starsOf(set,i);tot+=st;if(st)full++;var b=document.createElement('button');b.className='tr-tile'+(set==='ar'?'':' lat')+(st?' done':'');b.style.animationDelay=(i*18)+'ms';
    b.innerHTML='<b>'+glyph(set,i)+'</b><i>'+starStr(st)+'</i>';b.setAttribute('aria-label',set==='ar'?list(set)[i].name:glyph(set,i));
    b.addEventListener('click',function(){SFX.pop();openLetter(set,i);});grid.appendChild(b);})(i);}
  $('.tr-total').innerHTML='<span dir="ltr">⭐ '+tot+' / '+(n*3)+'</span> &nbsp;·&nbsp; <span dir="ltr">✅ '+full+' / '+n+'</span>';}
document.querySelectorAll('.tr-tabs button').forEach(function(b){b.addEventListener('click',function(){SFX.pop();set=b.dataset.set;drawPicker();});});
function showPicker(){$('#tr-play').hidden=true;$('#tr-win').hidden=true;$('#tr-pick').hidden=false;drawPicker();if(history.replaceState)history.replaceState(null,'',location.pathname+location.search.replace(/([?&])(set|i)=[^&]*/g,''));}

/* ---------- geometry ---------- */
var svg=$('#tr-svg'),gLines=$('#tr-lines'),gGhost=$('#tr-ghost'),gDots=$('#tr-dots'),gDone=$('#tr-done'),gLive=$('#tr-live'),gHint=$('#tr-hint'),gBad=$('#tr-badges');
function el(tag,at,par){var e=document.createElementNS(NS,tag);for(var k in at)e.setAttribute(k,at[k]);if(par)par.appendChild(e);return e;}
var probe=el('path',{d:'M0 0'},null);svg.appendChild(probe);probe.style.display='none';
function samplePath(d){probe.setAttribute('d',d);probe.style.display='';var len=probe.getTotalLength(),n=Math.max(2,Math.ceil(len)),pts=[];
  for(var k=0;k<=n;k++){var p=probe.getPointAtLength(len*k/n);pts.push([p.x,p.y]);}probe.style.display='none';return {pts:pts,len:len};}
function toSvg(e){var m=svg.getScreenCTM();if(!m)return null;var p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;p=p.matrixTransform(m.inverse());return [p.x,p.y];}
function dist(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1]);}

/* ---------- open a letter ---------- */
function openLetter(s,i){set=s;idx=i;L=list(s)[i];won=false;mistakes=0;si=0;tracing=false;
  $('#tr-pick').hidden=true;$('#tr-win').hidden=true;$('#tr-play').hidden=false;
  strokes=strokesOf(s,i).map(function(x){if(typeof x==='string'){var sp=samplePath(x);return {d:x,pts:sp.pts,len:sp.len,prog:0,done:false};}return {dot:x.dot,done:false};});
  var big=$('#tr-bigch');big.textContent=s==='ar'?L.ch:(L.u+' '+L.u.toLowerCase());big.classList.toggle('lat',s!=='ar');
  if(s==='ar'){$('#tr-name').textContent='حرف '+L.name;$('#tr-word').innerHTML=L.word+'<span class="em">'+L.em+'</span>';}
  else{$('#tr-name').textContent=s==='up'?'Capital '+L.u:'small '+L.u.toLowerCase();$('#tr-word').innerHTML='<span dir="ltr">'+L.u+' is for '+L.w+'</span><span class="em">'+L.em+'</span>';}
  svg.setAttribute('viewBox',s==='lo'?'0 5 100 100':'0 0 100 100');gLines.innerHTML='';
  if(s==='ar'){el('line',{x1:4,x2:96,y1:64,y2:64,stroke:'rgba(255,255,255,.22)','stroke-width':.5,'stroke-dasharray':'2 2'},gLines);}
  else{var ys=s==='up'?[15,50,85]:[12,45,82];ys.forEach(function(y,k){el('line',{x1:4,x2:96,y1:y,y2:y,stroke:k===1?'rgba(255,180,200,.35)':'rgba(255,255,255,.28)','stroke-width':k===1?.45:.55,'stroke-dasharray':k===1?'2 2':'none'},gLines);});}
  if(history.replaceState)history.replaceState(null,'','?'+(FROM?'from='+FROM+'&':'')+'set='+s+'&i='+i);
  render();layout();gBase='neutral';face('wave',1400);body('hop');
  if(s!=='ar')setTimeout(function(){play('en-'+L.u.toLowerCase());},250);else tone(880,.25,'sine',.1);
  msg(s==='ar'?'ابدئي من الرقم ١ واتبعي النقاط ✨':'ابدئي من الرقم 1 واتبعي النقاط ✨',2200);scheduleHint(900);}

function render(){gGhost.innerHTML='';gDots.innerHTML='';gBad.innerHTML='';gDone.innerHTML='';gLive.innerHTML='';
  var nums=set==='ar'?['١','٢','٣','٤','٥']:['1','2','3','4','5'];
  strokes.forEach(function(st,k){var active=k===si,future=k>si;
    if(st.dot){if(st.done){el('circle',{cx:st.dot[0],cy:st.dot[1],r:3.4,fill:'#ffe27a'},gDone);return;}
      el('circle',{cx:st.dot[0],cy:st.dot[1],r:3.6,fill:'none',stroke:'rgba(255,255,255,'+(active?.9:.4)+')','stroke-width':.7,'stroke-dasharray':'1.2 1.2'},gDots);
      el('circle',{cx:st.dot[0],cy:st.dot[1],r:1.4,fill:'rgba(255,255,255,'+(active?.95:.5)+')'},gDots);}
    else{
      el('path',{d:st.d,fill:'none',stroke:'rgba(255,255,255,'+(active?.13:.07)+')','stroke-width':12,'stroke-linecap':'round','stroke-linejoin':'round'},gGhost);
      if(st.done){var col=k%2?'#ffe27a':'#ff9cc6';el('path',{d:st.d,fill:'none',stroke:col,'stroke-width':6.4,'stroke-linecap':'round','stroke-linejoin':'round',opacity:.96},gDone);
        el('path',{d:st.d,fill:'none',stroke:'#fff','stroke-width':1.6,'stroke-linecap':'round','stroke-linejoin':'round',opacity:.45,transform:'translate(-.6 -.6)'},gDone);return;}
      var step=4.2,n=Math.max(2,Math.round(st.len/step));
      for(var j=0;j<=n;j++){var p=st.pts[Math.round(j*(st.pts.length-1)/n)];el('circle',{cx:p[0].toFixed(2),cy:p[1].toFixed(2),r:active?1.35:1.05,fill:'rgba(255,255,255,'+(active?.92:future?.4:.6)+')','class':'d'},gDots);}
      if(active){[.33,.66].forEach(function(f){if(st.len<16&&f>.5)return;var a=st.pts[Math.floor(f*(st.pts.length-1))],b=st.pts[Math.min(st.pts.length-1,Math.floor(f*(st.pts.length-1))+2)];
        var ang=Math.atan2(b[1]-a[1],b[0]-a[0]),cx=a[0],cy=a[1];el('path',{d:'M'+(cx+Math.cos(ang)*2.6)+' '+(cy+Math.sin(ang)*2.6)+' L'+(cx+Math.cos(ang+2.5)*2.4)+' '+(cy+Math.sin(ang+2.5)*2.4)+' L'+(cx+Math.cos(ang-2.5)*2.4)+' '+(cy+Math.sin(ang-2.5)*2.4)+'Z',fill:'#ffe27a',stroke:'#7a4a10','stroke-width':.25},gBad);});
        if(st.prog>0){var cov=st.pts.slice(0,st.prog+1).map(function(p){return p[0].toFixed(2)+','+p[1].toFixed(2);}).join(' ');el('polyline',{points:cov,fill:'none',stroke:'rgba(255,226,122,.35)','stroke-width':8,'stroke-linecap':'round','stroke-linejoin':'round'},gGhost);}}}
    var sp=st.dot||st.pts[0];if(st.done)return;
    if(!st.dot&&!active){for(var q=0;q<k;q++){var o=strokes[q],os=o.dot||o.pts[0];if(dist(os,sp)<6||(q===si&&dist(o.dot||o.pts[o.prog],sp)<6)){sp=st.pts[Math.min(st.pts.length-1,7)];break;}}}
    var g=el('g',{transform:'translate('+sp[0].toFixed(2)+' '+sp[1].toFixed(2)+')','class':active?'badge on':'badge'},gBad);
    var off=st.dot?[0,-6.5]:[0,0];
    el('circle',{cx:off[0],cy:off[1],r:active?4.4:3.2,fill:active?'#ff477e':'rgba(255,71,126,.55)',stroke:'#fff','stroke-width':active?.8:.5},g);
    var t=el('text',{x:off[0],y:off[1]+(active?1.7:1.25),'text-anchor':'middle','font-size':active?5:3.6,'font-weight':900,fill:'#fff','font-family':'Cairo,sans-serif'},g);t.textContent=nums[k]||String(k+1);
    if(active&&g.animate)g.animate([{transform:'translate('+sp[0].toFixed(2)+'px,'+sp[1].toFixed(2)+'px) scale(1)'},{transform:'translate('+sp[0].toFixed(2)+'px,'+sp[1].toFixed(2)+'px) scale(1.18)'},{transform:'translate('+sp[0].toFixed(2)+'px,'+sp[1].toFixed(2)+'px) scale(1)'}],{duration:1100,iterations:Infinity});
  });
  var on=gBad.querySelector('.badge.on');if(on)gBad.appendChild(on);
  var stp=$('#tr-steps');stp.dir=set==='ar'?'rtl':'ltr';stp.innerHTML='';strokes.forEach(function(st,k){var s=document.createElement('span');s.textContent=nums[k]||k+1;s.className=st.done?'ok':k===si?'cur':'';stp.appendChild(s);});}

/* hint: a glowing chalk ball that runs along the active stroke */
function scheduleHint(ms){clearTimeout(hintT);hintT=setTimeout(showHint,ms);}
function showHint(){gHint.innerHTML='';var st=strokes[si];if(!st||won||tracing)return;
  if(st.dot){var c=el('circle',{cx:st.dot[0],cy:st.dot[1],r:5,fill:'none',stroke:'#ffe27a','stroke-width':.8},gHint);if(c.animate)c.animate([{r:2,opacity:1},{r:7,opacity:0}],{duration:900,iterations:2});}
  else{var b=el('circle',{r:2.6,fill:'#ffe27a',opacity:.9},gHint);var hand=el('text',{'font-size':7},gHint);hand.textContent='👆';var t0=performance.now(),dur=Math.max(900,st.len*28);
    (function step(now){if(!b.parentNode)return;var f=Math.min(1,(now-t0)/dur),p=st.pts[Math.round(f*(st.pts.length-1))];b.setAttribute('cx',p[0]);b.setAttribute('cy',p[1]);hand.setAttribute('x',p[0]-2);hand.setAttribute('y',p[1]+8);
      if(f<1)requestAnimationFrame(step);else setTimeout(function(){gHint.innerHTML='';},250);})(t0);}
  scheduleHint(6500);}

var msgT=0;function msg(t,ms){var m=$('#tr-msg');m.textContent=t;m.classList.add('on');clearTimeout(msgT);msgT=setTimeout(function(){m.classList.remove('on');},ms||1600);}

/* ---------- tracing ---------- */
var live=null,livePts='',pid=null;
function newLive(){live=el('polyline',{points:'',fill:'none',stroke:'#fffbe8','stroke-width':5.6,'stroke-linecap':'round','stroke-linejoin':'round',opacity:.95},gLive);livePts='';}
function down(e){if(won||$('#tr-play').hidden)return;e.preventDefault();ac();var p=toSvg(e);if(!p)return;var st=strokes[si];if(!st)return;gHint.innerHTML='';scheduleHint(7000);
  if(st.dot){if(dist(p,st.dot)<DOTR){st.done=true;SFX.dot();sparkle(st.dot);face('happy',900);body('hop');advance();}else wrong(p);return;}
  var from=st.pts[st.prog];if(dist(p,from)<START||(st.prog===0&&dist(p,st.pts[0])<START)){tracing=true;pid=e.pointerId;try{svg.setPointerCapture(e.pointerId);}catch(_){}newLive();addInk(p);SFX.start();gBase='happy';face('happy');body('lean');}
  else wrong(p);}
function wrong(p){mistakes++;SFX.nope();face('thinking',1200);body('shake');var st=strokes[si];var sp=st.dot||st.pts[st.prog];
  var r=el('circle',{cx:sp[0],cy:sp[1],r:4,fill:'none',stroke:'#ff477e','stroke-width':1},gHint);if(r.animate)r.animate([{r:3,opacity:1},{r:9,opacity:0}],{duration:700,iterations:2});
  msg(st.dot?'اضغطي على النقطة 👆':(st.prog?'كملي من النقطة الوردية ✨':'ابدئي من الرقم '+(set==='ar'?['١','٢','٣','٤','٥'][si]:si+1)+' 👆'),1500);}
function addInk(p){livePts+=p[0].toFixed(2)+','+p[1].toFixed(2)+' ';live.setAttribute('points',livePts);var now=performance.now();if(now-lastChalk>70){chalk();lastChalk=now;}}
function move(e){if(!tracing||e.pointerId!==pid)return;e.preventDefault();var evs=e.getCoalescedEvents?e.getCoalescedEvents():[e];if(!evs.length)evs=[e];
  for(var k=0;k<evs.length;k++){if(!tracing)return;step(toSvg(evs[k]));}}
function step(p){if(!p)return;var st=strokes[si],best=-1,bd=1e9,hi=Math.min(st.pts.length-1,st.prog+AHEAD);
  for(var j=Math.max(0,st.prog-3);j<=hi;j++){var d=dist(p,st.pts[j]);if(d<bd){bd=d;best=j;}}
  if(bd<TOL){if(best>st.prog){st.prog=best;}addInk(p);if(st.prog>=st.pts.length-1-Math.min(3,st.pts.length*.1)){finishStroke();}}
  else if(bd>OFF){/* left the path: the ink stops, keep progress so she can resume from the pink badge */
    tracing=false;mistakes++;SFX.nope();face('surprised',1000);body('shake');fadeLive();render();msg('ارجعي للنقاط 🙂',1400);}
  else{/* wobble zone: no ink */}}
function fadeLive(){var l=live;if(l&&l.animate){var a=l.animate([{opacity:.95},{opacity:0}],{duration:450,fill:'forwards'});a.onfinish=function(){l.remove();};}else if(l)l.remove();live=null;}
function up(e){if(!tracing||e.pointerId!==pid)return;tracing=false;var st=strokes[si];if(st&&!st.done){fadeLive();render();if(st.prog>2)msg('كملي من النقطة الوردية ✨',1300);}
  gBase='neutral';face('neutral');body('hop');}
function finishStroke(){var st=strokes[si];st.done=true;st.prog=st.pts.length-1;tracing=false;try{svg.releasePointerCapture(pid);}catch(_){}
  var l=live;live=null;if(l){if(l.animate){var a=l.animate([{opacity:.95},{opacity:0}],{duration:300,fill:'forwards'});a.onfinish=function(){l.remove();};}else l.remove();}
  SFX.step(si);sparkle(st.pts[st.pts.length-1]);face('happy',900);body('hop');advance();}
function advance(){si++;while(si<strokes.length&&strokes[si].done)si++;render();if(si>=strokes.length)return win();scheduleHint(1400);}
svg.addEventListener('pointerdown',down);svg.addEventListener('pointermove',move);svg.addEventListener('pointerup',up);svg.addEventListener('pointercancel',up);
document.addEventListener('touchmove',function(e){if(e.target.closest&&e.target.closest('#tr-grid'))return;e.preventDefault();},{passive:false});
['gesturestart','contextmenu','dblclick'].forEach(function(t){document.addEventListener(t,function(e){e.preventDefault();});});

function sparkle(p){for(var k=0;k<8;k++){var a=k/8*Math.PI*2,c=el('circle',{cx:p[0],cy:p[1],r:1.2,fill:k%2?'#ffe27a':'#ff8fc0'},gHint);
  if(c.animate){var an=c.animate([{transform:'translate(0,0)',opacity:1},{transform:'translate('+(Math.cos(a)*9)+'px,'+(Math.sin(a)*9)+'px)',opacity:0}],{duration:600,easing:'ease-out',fill:'forwards'});an.onfinish=(function(c){return function(){c.remove();};})(c);}else c.remove();}}

/* ---------- success ---------- */
function win(){won=true;clearTimeout(hintT);gHint.innerHTML='';var stars=mistakes===0?3:mistakes<=2?2:1,prev=starsOf(set,idx);
  var gain=prev===0?5:stars>prev?2:1;if(stars>prev){SAVE[set][idx]=stars;persist();}
  gBase='happy';face('cheer');body('jump');SFX.win();setTimeout(function(){play('cheer-'+(1+Math.floor(Math.random()*4)));},350);
  setTimeout(function(){var w=$('#tr-win');w.hidden=false;
    $('#tr-wtitle').textContent=set==='ar'?'برافو! حرف '+L.name+' ✨':'برافو! '+glyph(set,idx)+' ✨';
    $('#tr-wstars').innerHTML=starStr(stars).replace(/<span/g,function(m,o){return m;});
    var sp=$('#tr-wstars').querySelectorAll('span');for(var k=0;k<sp.length;k++)sp[k].style.animationDelay=(300+k*180)+'ms';
    $('#tr-wcoin').textContent='+'+gain+' 🪙';addCoins(gain);setTimeout(SFX.coin,500);confetti();
    $('#tr-wnext').hidden=idx>=list(set).length-1;},700);}
function confetti(){var c=$('#tr-confetti'),x=c.getContext('2d'),W=c.width=innerWidth*Math.min(2,devicePixelRatio||1),H=c.height=innerHeight*Math.min(2,devicePixelRatio||1),P=[],cols=['#ff477e','#f9c846','#5dffa0','#00f0ff','#ff8c42','#ffffff','#c9a4ff'];
  for(var i=0;i<140;i++)P.push({x:W/2+(Math.random()-.5)*W*.3,y:H*.45,vx:(Math.random()-.5)*W*.018,vy:-Math.random()*H*.022-H*.006,r:Math.random()*6+4,c:cols[i%cols.length],a:Math.random()*6,va:(Math.random()-.5)*.3,s:Math.random()<.3});
  var t0=performance.now();(function f(now){if($('#tr-win').hidden)return;var dt=Math.min(32,now-t0)/16;t0=now;x.clearRect(0,0,W,H);var alive=0;
    P.forEach(function(p){p.vy+=H*.0006*dt;p.vx*=.99;p.x+=p.vx*dt;p.y+=p.vy*dt;p.a+=p.va*dt;if(p.y<H+20)alive++;x.save();x.translate(p.x,p.y);x.rotate(p.a);x.fillStyle=p.c;
      if(p.s){x.font=(p.r*4)+'px serif';x.fillText('⭐',-p.r*2,p.r*2);}else x.fillRect(-p.r,-p.r*.5,p.r*2,p.r);x.restore();});
    if(alive)requestAnimationFrame(f);})(t0);}
$('#tr-wnext').addEventListener('click',function(){SFX.pop();openLetter(set,Math.min(list(set).length-1,idx+1));});
$('#tr-wagain').addEventListener('click',function(){SFX.pop();openLetter(set,idx);});
$('#tr-wlist').addEventListener('click',function(){SFX.pop();showPicker();});
$('#tr-letters').innerHTML='🔠 <span>الحروف</span>';$('#tr-letters').addEventListener('click',function(){SFX.pop();showPicker();});
$('#tr-again').addEventListener('click',function(){SFX.pop();openLetter(set,idx);});
$('#tr-next').addEventListener('click',function(){SFX.pop();openLetter(set,(idx+1)%list(set).length);});
$('#tr-prev').addEventListener('click',function(){SFX.pop();openLetter(set,(idx-1+list(set).length)%list(set).length);});
$('#tr-hear').addEventListener('click',function(){if(set==='ar'){tone(880,.25,'sine',.12);msg('حرف '+L.name+' — '+L.word+' '+L.em,1800);body('hop');face('happy',900);}else{play('en-'+L.u.toLowerCase());face('happy',1500);}});
$('#tr-back').addEventListener('click',function(){var h=FROM==='class3d'?'class3d.html':FROM==='school'?'index.html#trace-school':'index.html#trace-menu';try{V2.wipe?V2.wipe(function(){location.href=h;},'يلا'):location.href=h;}catch(e){location.href=h;}});

/* ---------- layout (portrait phone + landscape) ---------- */
function layout(){var w=innerWidth,h=innerHeight,top=62,B=$('#tr-board'),I=$('#tr-info'),G=GH;
  if(w>=h*1.05){/* landscape: info right (RTL start), board centre, Ghalia left */
    var bs=Math.min(h-top-16,w*.56);var bx=(w-bs)/2+Math.min(40,w*.03);
    B.style.cssText='left:'+bx+'px;top:'+(top+(h-top-bs)/2-4)+'px;width:'+bs+'px;height:'+bs+'px';
    var iw=w-(bx+bs)-12;I.style.cssText='right:8px;top:'+(top+10)+'px;width:'+Math.max(150,iw)+'px';I.classList.remove('row');
    var gh=Math.min(h*.72,bs*.95),gw=gh*.4;G.style.cssText='left:'+Math.max(4,bx-gw*.82)+'px;bottom:'+(h-(top+(h-top-bs)/2+bs)+6)+'px;width:'+gw+'px;height:'+gh+'px';layoutLeanDir=1;}
  else{/* portrait */
    var infoH=Math.min(150,h*.2),gh2=Math.min(200,h*.24),bs2=Math.min(w-16,h-top-infoH-gh2*.62-10);
    I.style.cssText='left:8px;right:8px;top:'+top+'px;height:'+infoH+'px';I.classList.add('row');
    var by=top+infoH+4;B.style.cssText='left:'+((w-bs2)/2)+'px;top:'+by+'px;width:'+bs2+'px;height:'+bs2+'px';
    var room=h-(by+bs2);gh2=Math.max(150,Math.min(330,room+bs2*.18));
    G.style.cssText='left:6px;bottom:6px;width:'+(gh2*.42)+'px;height:'+gh2+'px';layoutLeanDir=1;}
  var gr=G.getBoundingClientRect?null:null;var M=$('#tr-msg'),gl=parseFloat(G.style.left),gb=parseFloat(G.style.bottom),ghh=parseFloat(G.style.height),gww=parseFloat(G.style.width);
  if(w>=h*1.05){M.style.left=(gl+gww*.35)+'px';M.style.bottom=(gb+ghh*.98)+'px';}else{M.style.left=(gl+gww*.95)+'px';M.style.bottom=(gb+ghh*.62)+'px';}M.style.maxWidth=Math.min(w-(parseFloat(M.style.left))-10,300)+'px';
  GH.classList.add('idle');}
addEventListener('resize',layout);addEventListener('orientationchange',function(){setTimeout(layout,250);});

/* ---------- boot ---------- */
var qs=params.get('set'),qi=parseInt(params.get('i'),10);
if(qs&&list(qs)&&(qs==='ar'||qs==='up'||qs==='lo')&&!isNaN(qi)&&qi>=0&&qi<list(qs).length){openLetter(qs,qi);}else{set=(qs==='up'||qs==='lo')?qs:'ar';showPicker();}
try{V2.grain&&V2.grain(document.body,{opacity:.05,vignette:true});}catch(e){}
/* test hook: screen-space samples for the active stroke */
window.__trace={open:openLetter,picker:showPicker,state:function(){return {set:set,idx:idx,si:si,n:strokes.length,won:won,mistakes:mistakes,prog:strokes[si]&&strokes[si].prog};},
  screen:function(k){var st=strokes[k===undefined?si:k];var m=svg.getScreenCTM();function tr(q){var p=svg.createSVGPoint();p.x=q[0];p.y=q[1];p=p.matrixTransform(m);return [p.x,p.y];}
    if(st.dot)return {dot:tr(st.dot)};var o=[];for(var j=0;j<st.pts.length;j+=2)o.push(tr(st.pts[j]));o.push(tr(st.pts[st.pts.length-1]));return {pts:o};},save:function(){return SAVE;}};
})();
