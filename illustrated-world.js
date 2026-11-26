/* V2ILL — hosts a 2.5D illustrated room (GhaliaHouseScene / GhaliaClassScene from scene-kit.js) inside an
   existing game page. It has its own scene, camera and post FX, and shares the page's renderer. The page's
   Ghalia (GhaliaRig adapter around ghalia-sprite.js) is moved into the illustrated scene while it is active.
   Joystick / tap-to-walk run in the plate's floor coordinates (x -1..1 left→right, z 0..1 far→near). */
(function () {
  'use strict';
  window.V2ILL = {
    create: function (o) {
      var T = THREE, K = window.GhaliaSceneKit, renderer = o.renderer, rig = o.rig, Q = K.detectQuality();
      var scene = new T.Scene(), camera = new T.PerspectiveCamera(30, innerWidth / innerHeight, .5, 80);
      var savedTM = renderer.toneMapping, savedExp = renderer.toneMappingExposure, savedShadow = renderer.shadowMap.enabled;
      var world = o.Module.build(T, scene, { renderer: renderer, quality: Q, width: innerWidth, height: innerHeight, letters: o.letters,
        onEvent: function (type, d) { if (o.onEvent) o.onEvent(type, d || {}); } });
      renderer.toneMapping = savedTM; renderer.toneMappingExposure = savedExp;    // restored; set again on enter()
      var fx = K.createPostFX(T, renderer, scene, camera, { quality: Q, bloom: Q === 'low' ? .55 : .65, radius: .55, threshold: .82, vignette: .42, grain: .045 });
      var api = { active: false, world: world, scene: scene, camera: camera, quality: Q, ready: false };
      var g = rig.root, home = null, pos = { x: 0, z: .55 }, target = null, onArrive = null, px = 0, py = 0;
      var ray = new T.Raycaster(), ndc = new T.Vector2();
      function resize() { if (!api.ready) return; fx.setSize(innerWidth, innerHeight); world.setView(camera, innerWidth, innerHeight); }
      world.ready.then(function () { pos.x = world.spawn.x; pos.z = world.spawn.z; api.ready = true; resize(); });
      world.on && world.on('variant', function () { pos.x = world.spawn.x; pos.z = world.spawn.z; target = null; });
      addEventListener('resize', function () { if (api.active) resize(); });
      addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') { px = e.clientX / innerWidth * 2 - 1; py = -(e.clientY / innerHeight * 2 - 1); } });
      addEventListener('deviceorientation', function (e) { if (e.gamma == null) return; px = Math.max(-1, Math.min(1, e.gamma / 25)); py = Math.max(-1, Math.min(1, ((e.beta || 45) - 45) / 25)); });
      api.enter = function () {
        if (api.active) return; api.active = true;
        home = g.parent; scene.add(g); g.rotation.y = 0; rig.setCamera(camera);
        renderer.toneMapping = T.NoToneMapping; renderer.shadowMap.enabled = false; resize();
      };
      api.leave = function () {
        if (!api.active) return; api.active = false; target = null;
        if (home) home.add(g); g.scale.setScalar(1); rig.setCamera(o.mainCamera);
        renderer.toneMapping = savedTM; renderer.toneMappingExposure = savedExp; renderer.shadowMap.enabled = savedShadow;
      };
      api.walkTo = function (x, z, cb) { target = world.clampToWalkable({ x: x, z: z }); onArrive = cb || null; };
      api.tap = function (cx, cy) {
        if (!api.ready) return true;
        ndc.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
        if (ray.intersectObject(g, true).length) { rig.react(); if (o.onGhaliaTap) o.onGhaliaTap(cx, cy); return true; }
        var hit = K.pick(ray, world.interactables);
        if (hit) {
          if (o.onTapObject) o.onTapObject(hit.entry.name, cx, cy);
          hit.entry.onTap(hit.point); rig.expr('happy', 1.6);
          if (hit.entry.spot) api.walkTo(hit.entry.spot.x, hit.entry.spot.z);
          return true;
        }
        var f = ray.intersectObject(world.stage.plate);
        if (f.length) { var fl = world.floorFromHit(f[0]); if (fl && fl.z > -.15 && fl.z < 1.15) { api.walkTo(fl.x, fl.z); if (o.onFloor) o.onFloor(); } }
        return true;
      };
      api.frame = function (dt, jx, jy, blocked) {
        world.update(dt);
        if (api.ready) {
          var a = world.actorAt(pos.x, pos.z), moving = false, dx = 0, dz = 0, run = false;
          if (!blocked && Math.hypot(jx, jy) > .12) {
            run = Math.hypot(jx, jy) > .85; target = null; onArrive = null;
            var sp = (run ? .62 : .36) * Math.max(.45, a.speedScale) * dt;
            dx = jx * sp / 1.6; dz = jy * sp; pos.x += dx; pos.z += dz; world.clampToWalkable(pos); moving = true;
          } else if (!blocked && target) {
            var tx = target.x - pos.x, tz = target.z - pos.z, d = Math.hypot(tx * 1.6, tz);
            if (d < .012) { target = null; var cb = onArrive; onArrive = null; if (cb) cb(); }
            else { var s2 = .36 * Math.max(.45, a.speedScale) * dt, k = Math.min(1, s2 / d); dx = tx * k; dz = tz * k; pos.x += dx; pos.z += dz; world.clampToWalkable(pos); moving = true; }
          }
          a = world.actorAt(pos.x, pos.z);
          g.position.copy(a.position); g.scale.setScalar(a.height / 1.62); if (g.__ro !== a.renderOrder) { g.__ro = a.renderOrder; g.traverse(function (c) { c.renderOrder = a.renderOrder; }); }
          if (moving && (dx || dz)) { var yaw = Math.atan2(dx * 1.6, dz), cur = g.rotation.y; g.rotation.y = cur + Math.atan2(Math.sin(yaw - cur), Math.cos(yaw - cur)) * Math.min(1, dt * 10); }
          else g.rotation.y = K.damp(g.rotation.y, 0, 3, dt);
          rig.module.update(dt, { camera: camera, speed: moving ? (run ? 3.6 : 1.2) : 0, turnRate: 0 });
          rig.tickPortrait && rig.tickPortrait();
        }
        world.updateCamera(camera, dt, px, py);
        fx.render(dt);
      };
      api.starBurst = function (p, n) { world.starBurst && world.starBurst(p, n); };
      api.coinRain = function (p, n) { world.coinRain && world.coinRain(p, n); };
      api.pos = pos;
      return api;
    }
  };
})();

/* wardrobe v3: the 3D closet modal shows the illustrated wardrobe (only pages that have #dress-grid use it) */
if(typeof document!=='undefined'&&document.readyState==='loading'&&document.getElementById('dress-grid'))document.write('<script src="ghalia-outfits/index.js"><\/script><script src="wardrobe-3d.js"><\/script>');
