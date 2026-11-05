/* GRID 시안 메인 (2026-11-05)
   · 5 STEPS: 사진이 세로선을 타고 서로 다른 높이에서 내려와 한 줄로 맞춰진 뒤 글이 나온다
   · 네 가지 기준: 오른쪽 글이 화면 가운데 오면 왼쪽 사진이 바뀐다
   · 라인업: 좌우 슬라이더 (화살표 · 끌기 · 진행 막대), 처음엔 카드가 차례로 들어온다
   · 공식몰: 도착하면 사진이 살짝 확대, 다시 올라가면 원래대로 */
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
  var steps = document.querySelector('[data-gsteps]');
  var cards = steps ? [].slice.call(steps.querySelectorAll('[data-gstep]')) : [];
  var LAND = [0, .1, .22, .06, .16];   // 단계별로 출발 시점을 엇갈리게

  function frame() {
    if (hero) document.body.classList.toggle('on-hero', hero.getBoundingClientRect().bottom > 60);

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

  // 라인업 슬라이더 — 화살표 · 마우스 끌기 · 진행 막대
  var slider = document.querySelector('[data-line-slider]');
  if (slider) {
    var track = slider.querySelector('[data-gtiles]');
    var bar = document.querySelector('[data-line-bar]');
    var prev = document.querySelector('[data-line-prev]'), next = document.querySelector('[data-line-next]');
    function step() { var t = track.querySelector('.gtile'); return t.offsetWidth + (parseFloat(getComputedStyle(track).columnGap) || 0); }
    function sync() {
      var max = slider.scrollWidth - slider.clientWidth;
      var vis = slider.clientWidth / slider.scrollWidth;
      bar.style.width = (vis * 100) + '%';
      bar.style.transform = 'translateX(' + (max > 0 ? slider.scrollLeft / max * (1 / vis - 1) * 100 : 0) + '%)';
      prev.disabled = slider.scrollLeft < 4;
      next.disabled = slider.scrollLeft > max - 4;
    }
    prev.addEventListener('click', function () { slider.scrollBy({ left: -step(), behavior: 'smooth' }); });
    next.addEventListener('click', function () { slider.scrollBy({ left: step(), behavior: 'smooth' }); });
    slider.addEventListener('scroll', sync, { passive: true });
    addEventListener('resize', sync);
    sync();
    // 마우스로 끌어서 넘기기 (터치는 기본 스크롤)
    var down = null;
    slider.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = { x: e.clientX, l: slider.scrollLeft, moved: false }; });
    addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - down.x;
      if (!down.moved && Math.abs(dx) > 5) { down.moved = true; slider.classList.add('is-drag'); }
      if (down.moved) slider.scrollLeft = down.l - dx;
    });
    addEventListener('pointerup', function () {
      if (!down) return;
      var moved = down.moved; down = null;
      if (moved) {   // 놓으면 가까운 카드에 맞춘다
        var st = step(), target = Math.round(slider.scrollLeft / st) * st;
        slider.classList.remove('is-drag');
        slider.scrollTo({ left: target, behavior: 'smooth' });
      }
    });
    if (!reduce && 'IntersectionObserver' in window) {
      document.documentElement.classList.add('js-tiles');
      var tio = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { track.classList.add('is-in'); tio.disconnect(); }
      }, { rootMargin: '0px 0px -15% 0px' });
      tio.observe(track);
    }
  }

  // 공식몰 사진 확대/축소
  var shop = document.querySelector('[data-gshop]');
  if (shop && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      var e = es[0];
      if (e.isIntersecting) shop.classList.add('is-zoom');
      else if (e.boundingClientRect.top > 0) shop.classList.remove('is-zoom');   // 위로 되돌아갔을 때만
    }, { threshold: .55 }).observe(shop);
  }
})();
