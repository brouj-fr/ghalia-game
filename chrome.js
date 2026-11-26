/* Ghalia v2 shared chrome: grain + vignette, sunset wipe transition, slot-machine coin counter, WebAudio UI sounds. No network. */
(function(){
'use strict';
var V2=window.V2=window.V2||{};
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
/* --- film grain (generated once, tiled) + vignette --- */
V2.grain=function(parent,opts){parent=parent||document.body;opts=opts||{};
  var c=document.createElement('canvas');c.width=c.height=180;var x=c.getContext('2d'),d=x.createImageData(180,180);
  for(var i=0;i<d.data.length;i+=4){var v=Math.random()*255|0;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255;}x.putImageData(d,0,0);
  var g=document.createElement('div');g.className='v2-grain';g.style.backgroundImage='url('+c.toDataURL()+')';if(opts.opacity!=null)g.style.opacity=opts.opacity;parent.appendChild(g);
  if(opts.vignette!==false){var v=document.createElement('div');v.className='v2-vignette';parent.appendChild(v);}
  return g;};
/* --- sunset wipe: covers right->left, runs fn at full cover, reveals to the left. ~0.6s ease-in-out --- */
var wipeEl=null,busy=false;
V2.wipe=function(fn,label,opts){opts=opts||{};
  if(!wipeEl){wipeEl=document.createElement('div');wipeEl.id='v2-wipe';wipeEl.innerHTML='<b></b>';document.body.appendChild(wipeEl);}
  V2.wiping=true;
  if(busy||reduce||!wipeEl.animate){try{fn&&fn();}finally{}return;}
  busy=true;wipeEl.querySelector('b').textContent=label||'';if(V2.sfx&&!opts.silent)V2.sfx.whoosh();
  var a=wipeEl.animate([{clipPath:'inset(0 0 0 100%)'},{clipPath:'inset(0 0 0 0%)'}],{duration:330,easing:'cubic-bezier(.65,0,.35,1)',fill:'forwards'});
  a.onfinish=function(){try{fn&&fn();}catch(e){busy=false;throw e;}
    setTimeout(function(){var b=wipeEl.animate([{clipPath:'inset(0 0 0 0%)'},{clipPath:'inset(0 100% 0 0)'}],{duration:360,easing:'cubic-bezier(.65,0,.35,1)',fill:'forwards'});
      b.onfinish=function(){busy=false;V2.wiping=false;wipeEl.animate([{clipPath:'inset(0 0 0 100%)'}],{duration:0,fill:'forwards'});};},label?260:60);};
};
/* --- slot-machine rolling counter --- */
V2.RollCounter=function(el,value,minDigits){this.el=el;this.min=minDigits||4;this.v=null;
  el.classList.add('v2-counter');el.innerHTML='<span class="coin">🪙</span><span class="v2-digits"></span>';this.box=el.querySelector('.v2-digits');this.set(value||0,true);};
V2.RollCounter.prototype.set=function(v,instant){v=Math.max(0,Math.round(v));var s=String(v);while(s.length<this.min)s='0'+s;
  var box=this.box;while(box.children.length<s.length){var d=document.createElement('span');d.className='v2-digit';var col='<i>';for(var k=0;k<3;k++)for(var n=0;n<10;n++)col+='<span>'+n+'</span>';d.innerHTML=col+'</i>';box.insertBefore(d,box.firstChild);}
  while(box.children.length>s.length)box.removeChild(box.firstChild);
  var lead=true,old=this.v==null?v:this.v,up=v>=old,changed=!instant&&old!==v;
  var os=String(old);while(os.length<s.length)os='0'+os;os=os.slice(-s.length);
  for(var i=0;i<s.length;i++){var dg=box.children[i],n=+s[i],c=+os[i];if(n!==0||i===s.length-1)lead=false;dg.classList.toggle('dim',lead);
    var col=dg.firstChild,EM=1.15;
    if(changed&&n!==c){var idx=up?(n>c?n+10:n+20):(n<c?n+10:n);
      col.style.transition='none';col.style.transform='translateY(-'+((c+10)*EM)+'em)';void col.offsetWidth;
      col.style.transition='transform '+(0.55+0.14*(s.length-i))+'s cubic-bezier(.2,.9,.25,1.12)';col.style.transform='translateY(-'+(idx*EM)+'em)';
      (function(cl,nn){clearTimeout(cl._t);cl._t=setTimeout(function(){cl.style.transition='none';cl.style.transform='translateY(-'+((nn+10)*EM)+'em)';},1400);})(col,n);}
    else if(!changed){col.style.transition='none';col.style.transform='translateY(-'+((n+10)*EM)+'em)';}}
  if(changed&&V2.sfx){var steps=Math.min(10,Math.abs(v-old));for(var t=0;t<steps;t++)setTimeout(V2.sfx.tick,40+t*70);}
  this.v=v;};
/* --- WebAudio sounds (lazy; unlocked on first gesture) --- */
var AC=null,master=null,nbuf=null,musicG=null,musicTimer=null;
var soundOn=(function(){try{return localStorage.getItem('ghalia_v2_sound')!=='0';}catch(e){return true;}})();
var musicOn=(function(){try{return localStorage.getItem('ghalia_v2_music')!=='0';}catch(e){return true;}})();
function ac(){if(!AC){try{var C=window.AudioContext||window.webkitAudioContext;if(!C)return null;AC=new C();master=AC.createGain();master.gain.value=.7;master.connect(AC.destination);
  musicG=AC.createGain();musicG.gain.value=.045;var lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1800;musicG.connect(lp);lp.connect(master);}catch(e){AC=null;return null;}}
  if(AC.state==='suspended'){try{AC.resume();}catch(e){}}return AC;}
function tone(f,d,type,v,t0,slide,dest){if(!soundOn&&!dest)return;var C=ac();if(!C)return;var t=C.currentTime+(t0||0),o=C.createOscillator(),g=C.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+d);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v||.2,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(dest||master);o.start(t);o.stop(t+d+.05);}
function noise(d,f0,f1,v){if(!soundOn)return;var C=ac();if(!C)return;if(!nbuf){nbuf=C.createBuffer(1,C.sampleRate,C.sampleRate);var a=nbuf.getChannelData(0);for(var i=0;i<a.length;i++)a[i]=Math.random()*2-1;}
  var s=C.createBufferSource();s.buffer=nbuf;var fl=C.createBiquadFilter();fl.type='bandpass';fl.Q.value=1.4;var t=C.currentTime;fl.frequency.setValueAtTime(f0,t);fl.frequency.exponentialRampToValueAtTime(f1,t+d);
  var g=C.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+d*.35);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(fl);fl.connect(g);g.connect(master);s.start(t);s.stop(t+d+.05);}
V2.sfx={
  click:function(){tone(1800,.04,'square',.035);tone(900,.06,'sine',.06);},
  tick:function(){tone(2400,.025,'square',.025);},
  pop:function(){tone(380,.16,'sine',.22,0,980);},
  whoosh:function(){noise(.55,300,2600,.16);},
  whooshIn:function(){noise(.7,2400,260,.14);},
  chime:function(){[1046.5,1318.5,1568,2093].forEach(function(f,i){tone(f,1.2,'sine',.12,i*.07);tone(f*2.01,.6,'sine',.03,i*.07);});},
  sparkle:function(){[2093,2637,3136,3520,4186].forEach(function(f,i){tone(f,.22,'triangle',.05,i*.045);});},
  nope:function(){tone(300,.14,'triangle',.14,0,210);tone(240,.18,'triangle',.12,.12,170);},
  swish:function(){noise(.22,1200,3800,.08);}
};
V2.audioUnlock=function(){ac();if(musicOn)V2.music(true);};
V2.isSound=function(){return soundOn;};V2.isMusic=function(){return musicOn;};
V2.setSound=function(on){soundOn=on;try{localStorage.setItem('ghalia_v2_sound',on?'1':'0');}catch(e){}};
/* soft synthwave lullaby loop */
var CH=[[57,60,64,69],[53,57,60,65],[55,59,62,67],[52,55,59,64]],step=0,nextT=0;
function mtof(m){return 440*Math.pow(2,(m-69)/12);}
V2.music=function(on){musicOn=on;try{localStorage.setItem('ghalia_v2_music',on?'1':'0');}catch(e){}
  if(!on){if(musicTimer){clearInterval(musicTimer);musicTimer=null;}return;}
  var C=ac();if(!C||musicTimer)return;nextT=C.currentTime+.1;
  musicTimer=setInterval(function(){var bt=.3;while(nextT<C.currentTime+.5){var ch=CH[(step/16|0)%4],o=nextT-C.currentTime,n=step%16;
    if(n===0){ch.forEach(function(m){tone(mtof(m),bt*15,'triangle',.18,o,null,musicG);});tone(mtof(ch[0]-12),bt*15,'sine',.5,o,null,musicG);}
    var arp=[0,1,2,3,2,1,2,3][n%8];tone(mtof(ch[arp]+12),bt*.9,'sine',.35,o,null,musicG);
    step++;nextT+=bt;}},100);};
/* --- quality tier --- */
V2.tier=function(){var q=(location.search.match(/fx=(high|mid|low)/)||[])[1];if(q)return q;
  var coarse=matchMedia('(pointer: coarse)').matches,small=Math.min(screen.width,screen.height)<=820;
  var mem=navigator.deviceMemory||8,cores=navigator.hardwareConcurrency||4;
  if(coarse||small)return (mem<=3||cores<=4)?'low':'mid';
  return (mem<=4||cores<=2)?'mid':'high';};

/* certificate decorator: V2.certify(cardEl, {date:true}) — idempotent */
V2.certify=function(card,o){if(!card||card.__v2c)return;card.__v2c=1;o=o||{};card.classList.add('v2cert');
  var rays=document.createElement('div');rays.className='v2rays';card.insertBefore(rays,card.firstChild);
  var sh=document.createElement('div');sh.className='v2shine';card.appendChild(sh);
  var seal=document.createElement('div');seal.className='v2seal';seal.textContent='⭐';card.appendChild(seal);
  if(!card.querySelector('img')){var m=document.createElement('div');m.className='v2medal';m.innerHTML='<img src="img/ghalia.png" alt="">';var first=card.querySelector('.cert-ribbon,[data-v2-ribbon]');
    if(first){first.className+=' v2stars';first.innerHTML='<span>⭐</span><span>🌟</span><span>⭐</span>';first.parentNode.insertBefore(m,first.nextSibling);}else card.insertBefore(m,rays.nextSibling);}
  else{var im=card.querySelector('img');var md=document.createElement('div');md.className='v2medal';im.parentNode.insertBefore(md,im);md.appendChild(im);}
  if(o.date!==false&&!card.querySelector('.cd,.v2date')){var d=new Date();var dt=document.createElement('div');dt.className='v2date';dt.textContent=d.getDate()+' / '+(d.getMonth()+1)+' / '+d.getFullYear();var btn=card.querySelector('button');btn?card.insertBefore(dt,btn):card.appendChild(dt);}
  /* replay entrance whenever it is shown again */
  var mo=new MutationObserver(function(){var bd=card.closest('.modal-backdrop');if(bd&&bd.classList.contains('open')){card.style.animation='none';void card.offsetWidth;card.style.animation='';}});
  var bd=card.closest('.modal-backdrop');if(bd)mo.observe(bd,{attributes:true,attributeFilter:['class']});};
})();
