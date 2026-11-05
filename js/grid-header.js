/* GRID 시안 헤더 — 내리면 숨고, 조금이라도 올리면 흰 막대로 다시 나온다.
   메인 맨 위(영상 위)에서만 투명, 그 밖에는 늘 불투명한 흰 배경 */
(function () {
  var h = document.querySelector('.header');
  if (!h) return;
  var hero = document.querySelector('.hero');
  var last = scrollY, ticking = false;
  function update() {
    ticking = false;
    var y = scrollY, dy = y - last;
    if (y <= 10) { h.classList.remove('is-hidden'); h.classList.toggle('is-solid', !hero); last = y; return; }
    if (Math.abs(dy) < 4) return;
    if (document.body.classList.contains('menu-open')) { last = y; return; }
    h.classList.toggle('is-hidden', dy > 0 && y > 120);
    h.classList.toggle('is-solid', !hero || y > 10);
    last = y;
  }
  if (!hero) h.classList.add('is-solid');
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  // 메뉴에 마우스를 가져가면 (화면 맨 위로 올리면) 다시 보이게
  addEventListener('pointermove', function (e) { if (e.clientY < 30) h.classList.remove('is-hidden'); }, { passive: true });
})();
