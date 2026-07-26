
(function(){
  var DRAGGING = false;      // finger wins: gyro ignored while dragging
  var cards = [];

  function reg(wrap, card){
    var o = {wrap:wrap, card:card, tx:0, ty:0, gx:0, gy:0};
    cards.push(o);
    return o;
  }

  // one shared animation loop = buttery smooth on every card
  function loop(){
    for (var i=0;i<cards.length;i++){
      var o = cards[i];
      // ease toward target (higher = snappier, lower = smoother)
      o.tx += (o.gx - o.tx) * 0.16;
      o.ty += (o.gy - o.ty) * 0.16;
      if (Math.abs(o.gx-o.tx) < 0.0006) o.tx = o.gx;
      if (Math.abs(o.gy-o.ty) < 0.0006) o.ty = o.gy;
      o.card.style.setProperty('--tx', o.tx.toFixed(4));
      o.card.style.setProperty('--ty', o.ty.toFixed(4));
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  window.bindTilt = function(wrap){
    if (wrap.dataset.tilt) return;
    wrap.dataset.tilt = "1";
    var card = wrap.querySelector('.dscene') || wrap.querySelector('.dcard');
    if (!card) return;
    var o = reg(wrap, card);
    var down = false;

    function target(x, y){
      o.gx = Math.max(-1, Math.min(1, x));
      o.gy = Math.max(-1, Math.min(1, y));
    }
    function fromEvent(e){
      var r = wrap.getBoundingClientRect();
      target(((e.clientX-r.left)/r.width-0.5)*2, ((e.clientY-r.top)/r.height-0.5)*2);
    }
    wrap.addEventListener('pointerdown', function(e){
      down = true; DRAGGING = true;
      try { wrap.setPointerCapture(e.pointerId); } catch(_){}
      fromEvent(e);
      e.preventDefault();
    }, {passive:false});
    wrap.addEventListener('pointermove', function(e){
      if (down) { fromEvent(e); e.preventDefault(); }
      else if (e.pointerType === 'mouse') fromEvent(e);
    }, {passive:false});
    function release(){
      if (!down) return;
      down = false; DRAGGING = false;
      target(0, 0);            // glide back to rest
    }
    wrap.addEventListener('pointerup', release);
    wrap.addEventListener('pointercancel', release);
    wrap.addEventListener('pointerleave', function(e){
      if (!down && e.pointerType === 'mouse') target(0,0);
    });
    o.setGyro = function(x, y){ if (!DRAGGING && !down) target(x, y); };
  };

  window.enableGyro = function(){
    function handle(ev){
      if (DRAGGING) return;                     // finger always wins
      var g = (ev.gamma||0)/30, b = ((ev.beta||0)-42)/30;
      for (var i=0;i<cards.length;i++){
        if (cards[i].setGyro) cards[i].setGyro(g, b);
      }
    }
    function start(){ window.addEventListener('deviceorientation', handle); }
    if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission){
      DeviceOrientationEvent.requestPermission().then(function(s){ if (s==='granted') start(); });
    } else { start(); }
    return true;
  };
})();
