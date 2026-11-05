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

  // 숫자 짝 맞추기 — 숫자 앞뒤에서 가장 가까운 글자가 영문이면 영문(로고) 서체 숫자로, 한글이면 그대로
  (function () {
    var BLOCK = /^(P|H1|H2|H3|H4|H5|H6|LI|A|BUTTON|DT|DD|FIGCAPTION|TD|TH|SPAN|EM|B|STRONG|SMALL|LABEL|DIV)$/;
    var root = document.body, all = [], w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) { var p = n.parentNode; return /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/.test(p.nodeName) || p.closest('svg') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }
    });
    while (w.nextNode()) all.push(w.currentNode);
    function block(n) { var e = n.parentNode; while (e && e !== root && getComputedStyle(e).display.indexOf('inline') === 0) e = e.parentNode; return e; }
    function near(i, pos, dir) {   // i번째 텍스트 노드의 pos부터 dir 방향으로 같은 블록 안에서 가장 가까운 글자
      var b = block(all[i]);
      for (var k = i; k >= 0 && k < all.length; k += dir) {
        if (k !== i && block(all[k]) !== b) break;
        var t = all[k].nodeValue, j = k === i ? pos : (dir > 0 ? 0 : t.length - 1);
        for (; j >= 0 && j < t.length; j += dir) {
          var c = t[j];
          if (/[A-Za-z]/.test(c)) return 'en';
          if (/[가-힣ㄱ-ㆎ]/.test(c)) return 'ko';
        }
      }
      return '';
    }
    for (var i = all.length - 1; i >= 0; i--) {
      var n = all[i], t = n.nodeValue;
      if (!/[0-9]/.test(t) || n.parentNode.classList.contains('num-en')) continue;
      var re = /[0-9]+/g, m, cuts = [];
      while ((m = re.exec(t))) {
        var before = near(i, m.index - 1, -1), after = near(i, m.index + m[0].length, 1);
        // 바로 붙은 쪽 우선: 숫자 뒤 첫 글자, 없으면 앞 글자
        var side = after || before;
        if (side === 'en' && before !== 'ko' || (before === 'en' && !after)) cuts.push([m.index, m[0].length]);
      }
      if (!cuts.length) continue;
      var frag = document.createDocumentFragment(), at = 0;
      cuts.forEach(function (c) {
        if (c[0] > at) frag.appendChild(document.createTextNode(t.slice(at, c[0])));
        var sp = document.createElement('span'); sp.className = 'num-en'; sp.textContent = t.substr(c[0], c[1]); frag.appendChild(sp);
        at = c[0] + c[1];
      });
      if (at < t.length) frag.appendChild(document.createTextNode(t.slice(at)));
      n.parentNode.replaceChild(frag, n);
    }
  })();

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
