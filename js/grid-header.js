/* GRID 시안 헤더 — 내리면 숨고, 조금이라도 올리면 흰 막대로 다시 나온다.
   맨 위: 메인은 투명(영상 위), 서브는 흰 막대 / 조금이라도 내린 뒤 다시 나올 때는 오렌지 막대 */
(function () {
  // 제목 속 영문 글자 묶음만 <span class="en"> — 영문만 굵게 보이게 (한글은 600 그대로)
  var TITLES = '.subhead__title,.ghead__big,.ghead__title,.gwhy__title,.gtile__name,.gstep__head,.sec-title,.sub-body h2,.sub-body h3,.dp-title,.gshop__copy h2,.foot__side h2,.hnav__in b';
  [].forEach.call(document.querySelectorAll(TITLES), function (el) {
    var walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nodes = [];
    while (walk.nextNode()) nodes.push(walk.currentNode);
    nodes.forEach(function (n) {
      if (!/[A-Za-z0-9]/.test(n.nodeValue) || (n.parentNode.classList && n.parentNode.classList.contains('en'))) return;
      var frag = document.createDocumentFragment();
      n.nodeValue.split(/([A-Za-z0-9][A-Za-z0-9 &.,'’\-\/]*[A-Za-z0-9.]|[A-Za-z0-9])/).forEach(function (part, i) {
        if (!part) return;
        if (i % 2) { var sp = document.createElement('span'); sp.className = 'en'; sp.textContent = part; frag.appendChild(sp); }
        else frag.appendChild(document.createTextNode(part));
      });
      n.parentNode.replaceChild(frag, n);
    });
  });

  var h = document.querySelector('.header');
  if (!h) return;
  var hero = document.querySelector('.hero');
  var last = scrollY, ticking = false;
  function update() {
    ticking = false;
    var y = scrollY, dy = y - last;
    if (y <= 10) { h.classList.remove('is-hidden'); h.classList.remove('is-solid'); last = y; return; }
    if (Math.abs(dy) < 4) return;
    if (document.body.classList.contains('menu-open')) { last = y; return; }
    h.classList.toggle('is-hidden', dy > 0 && y > 120);
    h.classList.add('is-solid');
    last = y;
  }
  if (scrollY > 10) h.classList.add('is-solid');
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  // 메뉴에 마우스를 가져가면 (화면 맨 위로 올리면) 다시 보이게
  addEventListener('pointermove', function (e) { if (e.clientY < 30) h.classList.remove('is-hidden'); }, { passive: true });
})();
