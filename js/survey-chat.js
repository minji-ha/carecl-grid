/* =========================================================
   careCL — AI 상담 대화형 설문 (survey-c.html, 2026-11-12 B안)
   · 문항 데이터와 결과 계산·리포트는 js/survey.js · report.js 그대로 (window.ckuSurvey)
   · 여기서는 대화처럼 보여 주기만 한다: AI가 질문을 타이핑 → 보기를 고르면 내 답으로 쌓임 → 다음 질문
   · 보기를 고르면 바로 다음으로. 여러 개 고르는 문항(Q15)만 '선택 완료'
   · 끝나면 분석 장면 → 진단서(리포트)가 아래에 펼쳐짐
   ========================================================= */
(function () {
  'use strict';
  var S = window.ckuSurvey, thread = document.getElementById('svChat');
  var report = document.getElementById('svReport'), form = document.getElementById('svForm');
  var bar = document.querySelector('.svc__bar');
  if (!S || !thread) return;

  /* AI 아이콘 — 사이트 'AI 피부 진단' 버튼과 같은 반짝임 */
  var ICO = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2.2 14 8.4 20.2 10.4 14 12.4 12 18.6 10 12.4 3.8 10.4 10 8.4Z" fill="currentColor"/><circle cx="19.4" cy="4.2" r="1.7" fill="currentColor" opacity=".9"/><circle cx="4.8" cy="18.4" r="1.2" fill="currentColor" opacity=".7"/></svg>';
  var Q = S.Q, N = Q.length, answers = {}, cur = -1, busy = false, turns = [];
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function now() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function follow(node) {   // 새 말이 보이게 아래로
    if (cur < 0) return;   // 인사말 동안은 그대로 (위 상담 머리가 화면 밖으로 밀려나지 않게)
    var r = node.getBoundingClientRect(), pad = 140;
    if (r.bottom > innerHeight - pad) scrollBy({ top: r.bottom - innerHeight + pad, behavior: reduce ? 'auto' : 'smooth' });
  }

  /* 섹션이 바뀔 때 AI가 한마디 (문항 내용은 그대로, 이어 주는 말만) */
  var BRIDGE = {
    4: '좋아요. 이번에는 두 가지 중 <em>더 가까운 쪽</em>을 골라 주세요.',
    14: '거의 다 왔어요. 이제 변화가 큰 <em>부위</em>를 짚어 볼게요.',
    16: '마지막으로 기본 정보 두 가지만 여쭤볼게요.'
  };

  /* ── AI 말: 점 세 개 → 한 글자씩 ── */
  function typing(box) {
    var t = el('div', 'svc-typing', '<i></i><i></i><i></i>'); box.appendChild(t); follow(t); return t;
  }
  function aiSay(box, html, meta, small) {
    var m = el('div', 'svc-ai' + (small ? ' svc-ai--small' : ''));
    m.innerHTML = '<p class="svc-ai__by"><i class="svc-ai__ico">' + ICO + '</i><b><span class="lf">careCL</span> AI</b>' + (meta ? '<span>' + meta + '</span>' : '') + '<time>' + now() + '</time></p><p class="svc-ai__t"></p>';
    box.appendChild(m);
    var out = m.querySelector('.svc-ai__t');
    var parts = html.split(/(<br>|<em>|<\/em>|<i>|<\/i>)/), i = 0, j = 0, holder = out;
    return new Promise(function (done) {
      if (reduce) { out.innerHTML = html.replace(/<i>/g, '<span class="lf">').replace(/<\/i>/g, '</span>'); follow(m); return done(m); }
      out.classList.add('is-typing');
      (function tick() {
        if (i >= parts.length) { out.classList.remove('is-typing'); follow(m); return done(m); }
        var p = parts[i];
        if (p === '<br>') { holder.appendChild(document.createElement('br')); i++; return tick(); }
        if (p === '<em>') { holder = out.appendChild(document.createElement('em')); i++; return tick(); }
        if (p === '</em>') { holder = out; i++; return tick(); }
        if (p === '<i>') { holder = out.appendChild(document.createElement('span')); holder.className = 'lf'; i++; return tick(); }   // careCL — 로고 글꼴
        if (p === '</i>') { holder = out; i++; return tick(); }
        if (j < p.length) { holder.appendChild(document.createTextNode(p.charAt(j++))); follow(m); setTimeout(tick, small ? 8 : 22); }
        else { j = 0; i++; tick(); }
      })();
    });
  }
  async function ai(box, html, meta, small) {
    var t = typing(box); await sleep(small ? 300 : 620); t.remove();
    return aiSay(box, html, meta, small);
  }

  /* ── AI가 보여 주는 얼굴 사진 (부위 사진 그래픽: 22좌표 그리드가 번짐) — embed=loop 상담 중 / 1 분석 끝까지 ── */
  var VER = ((document.querySelector('script[src*="survey-chat.js"]') || {}).src || '').split('v=')[1] || '';
  async function photo(box, mode) {
    var t = typing(box); await sleep(500); t.remove();
    var m = el('div', 'svc-ai svc-media');
    m.innerHTML = '<iframe src="lab/left-7-zone-photo.html?embed=' + mode + '&amp;v=' + VER + '" title="Aging Map 22 얼굴 부위" tabindex="-1" loading="eager"></iframe>';
    box.appendChild(m); follow(m); await sleep(700); return m;
  }

  /* ── 내 답 ── */
  function mine(box, text, qi) {
    var m = el('div', 'svc-me', '<p class="svc-me__by">' + (qi != null ? Q[qi].label + ' · ' : '') + '나</p><p class="svc-me__t">' + esc(text) + '</p>');
    box.appendChild(m); follow(m); return m;
  }

  /* ── 보기 ── */
  function choices(i) {
    var q = Q[i];
    if (q.fromPrev) {
      var picked = answers[14] || [];
      q.opts = picked.map(function (t, k) { return { k: 'ABC'.charAt(k), t: t }; });
    }
    var kind = q.multi ? 'grid' : q.two ? 'two' : q.opts.length === 2 ? 'ab' : 'list';
    var c = el('div', 'svc-pick svc-pick--' + kind);
    c.innerHTML = q.opts.map(function (o, k) {
      return '<button type="button" class="svc-opt" data-k="' + k + '">' + (o.k && kind !== 'two' ? '<span class="svc-opt__k">' + o.k + '</span>' : '') +
        '<span class="svc-opt__t">' + esc(o.t) + '</span></button>';
    }).join('') +
      (q.multi ? '<div class="svc-pick__done"><span class="svc-pick__n">0 / ' + q.multi + '</span><button type="button" class="svc-go" data-done disabled>선택 완료 →</button></div>' : '');
    if (q.help) c.insertAdjacentHTML('afterbegin', '<p class="svc-pick__help">' + esc(q.help) + '</p>');
    return c;
  }

  async function ask(i) {
    busy = true; cur = i; progress();
    var turn = el('div', 'svc-turn'); turn.dataset.i = i; thread.appendChild(turn); turns[i] = turn;
    if (BRIDGE[i]) await ai(turn, BRIDGE[i], null, true);
    await ai(turn, Q[i].q, Q[i].label + ' · ' + Q[i].sect);
    var c = choices(i); turn.appendChild(c); follow(c);
    busy = false;
  }

  function pick(i, val) {
    answers[i] = val;
    var turn = turns[i], c = turn.querySelector('.svc-pick');
    c.classList.add('is-leaving');
    setTimeout(function () {
      c.remove();
      mine(turn, Array.isArray(val) ? val.join(' · ') : val, i);
      if (i + 1 < N) ask(i + 1); else finish();
    }, reduce ? 0 : 380);
  }

  function progress() {
    if (!bar) return;
    bar.hidden = cur < 0 || cur >= N;
    bar.querySelector('.svc__cnt b').textContent = ('0' + (cur + 1)).slice(-2);
    bar.querySelector('.svc__track i').style.width = ((cur) / N * 100) + '%';
    bar.querySelector('[data-back]').disabled = cur <= 0;
  }

  /* 이전 질문 — 지금 질문을 지우고, 바로 앞 질문의 내 답을 지운 뒤 보기를 다시 보여 준다 */
  function back() {
    if (busy || cur <= 0) return;
    turns[cur].remove(); turns[cur] = null;
    var p = cur - 1, turn = turns[p];
    delete answers[p];
    var me = turn.querySelector('.svc-me'); if (me) me.remove();
    cur = p; progress();
    var c = choices(p); turn.appendChild(c); follow(c);
  }

  /* ── 시작 ── */
  async function start() {
    var turn = el('div', 'svc-turn svc-turn--intro'); thread.appendChild(turn);
    await sleep(400);
    await ai(turn, '안녕하세요. <i>careCL</i> AI 피부 에이전트예요.');
    await ai(turn, '18개의 질문으로 <em>당신의 노화 타입</em>과,<br>얼굴 22개 부위 중 <em>먼저 관리할 곳</em>을 찾아 드릴게요.');
    await ai(turn, '이 상담은 피부과 전문의 인나 콜구넨코(Inna Kolgunenko) 박사의 5가지 노화 형태(Morphotypes)와 한국인 피부 노화 연구를 바탕으로, 노화를 6가지 타입과 22개 부위로 나누어 봅니다. 비회원도 참여할 수 있어요.', null, true);
    var c = el('div', 'svc-pick svc-pick--start',
      '<button type="button" class="svc-opt svc-opt--start" data-start><span class="svc-opt__t">시작할게요</span><span class="svc-opt__meta">18문항 · 약 2분</span></button>');
    turn.appendChild(c); follow(c);
  }

  /* ── 끝: 분석 → 진단서 ── */
  async function finish() {
    cur = N; progress(); busy = true;
    var turn = el('div', 'svc-turn svc-turn--end'); thread.appendChild(turn);
    await ai(turn, '고마워요. 답변을 바탕으로 노화 타입을 분석할게요.');
    var scan = el('div', 'svc-scan', '<div class="svc-scan__grid">' + new Array(22 + 1).join('<i></i>') + '</div><p class="svc-scan__t">Aging Map 22 · 분석 중</p>');
    turn.appendChild(scan); follow(scan);
    var dots = scan.querySelectorAll('i');
    for (var k = 0; k < dots.length; k++) { dots[k].classList.add('is-on'); await sleep(55); }
    await sleep(500);
    scan.classList.add('is-done'); scan.querySelector('.svc-scan__t').textContent = 'Aging Map 22 · 분석 완료';
    await ai(turn, '진단서가 나왔어요. 아래에서 확인해 보세요.');
    S.finish(answers);
    report.classList.add('is-on');
    setTimeout(function () { report.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }, 300);
    busy = false;
  }

  /* ── 진단서 머리 (문서 번호 · 날짜 · 도장) — 리포트 내용은 건드리지 않고 위에 얹기만 ── */
  function decorate() {
    var res = form.querySelector('.cku-result');
    if (!res || res.querySelector('.svc-doc')) return;
    var d = new Date(), ymd = d.getFullYear() + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + ('0' + d.getDate()).slice(-2);
    var no = String(d.getFullYear()).slice(2) + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + String(Math.floor(1000 + Math.random() * 9000));
    res.insertAdjacentHTML('afterbegin',
      '<header class="svc-doc"><p class="svc-doc__brand"><b class="lf">careCL</b><span>AI Skin Diagnosis Report</span></p>' +
      '<dl class="svc-doc__meta"><div><dt>No.</dt><dd>' + no + '</dd></div><div><dt>Date</dt><dd>' + ymd + '</dd></div><div><dt>Method</dt><dd>Aging Map 22 · 18 Q</dd></div></dl></header>');
  }
  new MutationObserver(decorate).observe(form, { childList: true, subtree: false });
  decorate();
  if (form.querySelector('.cku-result')) { report.classList.add('is-on'); document.querySelector('.svc-wrap').hidden = true; return; }   // ?view= 미리보기

  /* ── 클릭 ── */
  thread.addEventListener('click', function (e) {
    if (e.target.closest('[data-start]')) {
      var s = e.target.closest('.svc-pick'), tn = s.parentNode; s.classList.add('is-leaving');
      setTimeout(function () { s.remove(); mine(tn, '시작할게요'); ask(0); }, reduce ? 0 : 300);
      return;
    }
    var opt = e.target.closest('.svc-opt');
    if (opt && !busy) {
      var turn = opt.closest('.svc-turn'), i = +turn.dataset.i, q = Q[i], val = q.opts[+opt.dataset.k].t;
      if (q.multi) {
        var arr = answers['_' + i] || (answers['_' + i] = []), at = arr.indexOf(val);
        if (at > -1) arr.splice(at, 1); else if (arr.length < q.multi) arr.push(val);
        turn.querySelectorAll('.svc-opt').forEach(function (b) { b.classList.toggle('is-on', arr.indexOf(q.opts[+b.dataset.k].t) > -1); });
        turn.querySelector('.svc-pick__n').textContent = arr.length + ' / ' + q.multi;
        turn.querySelector('[data-done]').disabled = !arr.length;
        return;
      }
      opt.classList.add('is-on'); busy = true;
      pick(i, val);
      return;
    }
    var done = e.target.closest('[data-done]');
    if (done && !busy) {
      var t2 = done.closest('.svc-turn'), i2 = +t2.dataset.i;
      busy = true; pick(i2, (answers['_' + i2] || []).slice()); delete answers['_' + i2];
    }
  });
  if (bar) bar.addEventListener('click', function (e) { if (e.target.closest('[data-back]')) back(); });

  start();
})();
