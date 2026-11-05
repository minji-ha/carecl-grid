# careCL 홈페이지 GRID 시안 (2026-11-05)

- 확인용 주소: https://minji-ha.github.io/carecl-grid/ (배포 후)
- STEM 최종본(https://minji-ha.github.io/carecl-stem/)을 복사해 고객 수정요청(쥬베룩 톤)으로 다시 디자인한 시안입니다. STEM은 그대로 둡니다.
- 바뀐 곳: `css/grid.css`(전 페이지 공통 — 세로선 · 넓은 여백 · 둥근 사진 카드 · Jost 서체 · 알약 메뉴), 메인 `build.py` page_index + `css/grid-home.css` + `js/grid-home.js`
- 정적 HTML/CSS/JS. 서버 없이 그대로 열립니다.

## 구조

| 경로 | 내용 |
|---|---|
| `build.py` | 모든 페이지 생성기. 공통 헤더·메뉴·푸터, 페이지 목록(`PAGES`) |
| `content/*.html` | 서브 페이지 본문 원고(Company · Aging Lab · Technology · Products · Contact) |
| `css/` | `stem.css` 공통, `sub.css`·`detail.css` 서브, `home261019.css` 수정 보정, `survey.css`·`report.css`·`checkup-result.css` 설문·결과 |
| `js/` | `stem.js` 공통(스크롤 등장·숫자 카운트), `led.js` LED 헤드 효과, `radar.js` 설문 오각형, `report.js`·`report-data.js` 결과 화면 |
| `assets/` | 이미지·3D 모델 |
| `tools/` | 보조 스크립트(결과 문구 생성 `build_report_data.py`, 결과 CSS 병합 `build_checkup_css.py` 등) |

`*.html`(루트)은 `build.py`가 만드는 결과물입니다. 수정은 `content/`·`css/`·`js/`·`build.py`에서 하고 다시 빌드하세요.

## 빌드

```bash
python build.py
```

css/js 주소에 `?v=빌드시각`이 자동으로 붙어 캐시가 갱신됩니다.

## AI 진단 설문 · 결과

- 설문 시안 A(`survey.html`, 왼쪽 패널 + 오른쪽 질문)와 B(`survey2.html`, 전체 화면), 결과 화면은 `build.py`의 `page_survey_panel` / `page_survey_flow` / `page_report`가 만듭니다.
- 결과 미리보기: 설문 주소 뒤에 `?view=guest|member&type=유형`.
- `AI_TEST_PUBLIC = False`인 동안 설문·결과 파일은 `AI_SECRET` 접두어가 붙은 이름으로만 생성되고 공개 페이지의 링크는 모두 빠집니다. 정식 연동 시 `True`로 바꾸면 원래 이름(`survey.html`, `report.html`)으로 생성됩니다.
- 결과지 문구는 `js/report-data.js`(원고 pptx에서 `tools/build_report_data.py`로 생성).
