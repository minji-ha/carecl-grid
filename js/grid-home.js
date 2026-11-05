/* GRID 시안 메인 (2026-11-05)
   · 철학: 세로선 위 사진들이 각자 다른 속도로 위로 흘러간다 (가운데 글은 멈춤)
   · 5 STEPS: 사진이 세로선을 타고 서로 다른 높이에서 내려와 한 줄로 맞춰진 뒤 글이 나온다
   · 네 가지 기준: 오른쪽 글이 화면 가운데 오면 왼쪽 사진이 바뀐다
   · 라인업: 화살표 · 점 · 제품 클릭 / 4.5초마다 다음 제품 */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobile = matchMedia('(max-width: 767px)');
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  function progress(sec) {   // 섹션이 화면 위에 붙어 있는 동안 0 → 1
    var r = sec.getBoundingClientRect();
    return clamp(-r.top / Math.max(1, r.height - innerHeight));
  }

  var hero = document.querySelector('.hero');
  var intro = document.querySelector('[data-gintro]');
  var floats = intro ? [].slice.call(intro.querySelectorAll('[data-float]')) : [];
  var steps = document.querySelector('[data-gsteps]');
  var cards = steps ? [].slice.call(steps.querySelectorAll('[data-gstep]')) : [];
  var LAND = [0, .1, .22, .06, .16];   // 단계별로 출발 시점을 엇갈리게

  function frame() {
    if (hero) document.body.classList.toggle('on-hero', hero.getBoundingClientRect().bottom > 60);

    if (intro && !reduce) {
      var p = progress(intro);
      floats.forEach(function (f) {
        var y0 = parseFloat(f.style.getPropertyValue('--y'));
        var sp = parseFloat(f.dataset.float);
        f.style.transform = 'translate3d(-50%,' + (y0 - p * sp * 150).toFixed(2) + 'vh,0)';
      });
    }

    if (steps && !mobile.matches && !reduce) {
      var q = progress(steps);
      cards.forEach(function (c, i) {
        var t = clamp((q - LAND[i]) / .5);           // 0~0.72 구간 안에서 각자 내려온다
        c.style.setProperty('--p', ease(t).toFixed(4));
        c.style.setProperty('--t', clamp((q - .72 - i * .03) / .12).toFixed(3));
      });
    }
  }
  var ticking = false;
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; frame(); }); } }
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  frame();

  // 모바일 5 STEPS — 화면에 들어오면 위에서 내려앉는다
  if (cards.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting && mobile.matches) { e.target.style.setProperty('--p', 1); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    function arm() {
      cards.forEach(function (c) {
        if (mobile.matches && !reduce) { c.style.setProperty('--p', 0); c.style.setProperty('--t', 1); io.observe(c); }
      });
    }
    arm();
  }

  // 네 가지 기준
  var whyItems = [].slice.call(document.querySelectorAll('[data-why]'));
  var whyPics = [].slice.call(document.querySelectorAll('[data-why-pic]'));
  if (whyItems.length && 'IntersectionObserver' in window) {
    var wio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = whyItems.indexOf(e.target);
        whyItems.forEach(function (el, k) { el.classList.toggle('is-on', k === i); });
        whyPics.forEach(function (el, k) { el.classList.toggle('is-on', k === i); });
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    whyItems.forEach(function (el) { wio.observe(el); });
  }

  // 라인업
  var line = document.querySelector('[data-gline]');
  if (line) {
    var infos = [].slice.call(line.querySelectorAll('[data-line-info]'));
    var cuts = [].slice.call(line.querySelectorAll('[data-line-cut]'));
    var dots = [].slice.call(line.querySelectorAll('[data-line-dots] i'));
    var track = line.querySelector('[data-line-track]');
    var at = 0, timer;
    var last = 0;
    function go(i) {
      last = at;
      at = (i + cuts.length) % cuts.length;
      infos.forEach(function (el, k) { el.classList.toggle('is-on', k === at); });
      cuts.forEach(function (el, k) { el.classList.toggle('is-on', k === at); });
      dots.forEach(function (el, k) { el.classList.toggle('is-on', k === at); });
      // 고른 제품이 무대 왼쪽에 오도록
      track.style.transform = 'translateX(' + (-offsetOf(at)) + 'px)';
    }
    function offsetOf(i) {   // 앞 제품들은 모두 작은 폭(--cw)이라 개수만큼 밀면 된다
      var probe = cuts.filter(function (c, k) { return k !== i && k !== last; })[0];   // 크기가 바뀌는 중이 아닌 것으로 잰다
      var cs = getComputedStyle(probe);
      return i * (parseFloat(cs.width) + (parseFloat(getComputedStyle(track).columnGap) || 0));
    }
    function restart() { clearInterval(timer); if (!reduce) timer = setInterval(function () { go(at + 1); }, 4500); }
    line.querySelector('[data-line-prev]').addEventListener('click', function () { go(at - 1); restart(); });
    line.querySelector('[data-line-next]').addEventListener('click', function () { go(at + 1); restart(); });
    cuts.forEach(function (c, k) { c.addEventListener('click', function () { go(k); restart(); }); });
    line.addEventListener('pointerenter', function () { clearInterval(timer); });
    line.addEventListener('pointerleave', restart);
    addEventListener('resize', function () { go(at); });
    restart();
  }
})();
