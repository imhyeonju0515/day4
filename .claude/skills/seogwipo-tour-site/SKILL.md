---
name: seogwipo-tour-site
description: Build, extend, deploy or debug seogwipo-tour/ — Vite + vanilla JS site that visualizes Seogwipo city-run tourist spot monthly visitor counts (odcloud OpenAPI) as a Three.js Jeju diorama with pillars plus Chart.js charts. Use when asked to change the diorama, charts, data handling, or fix API key/Vercel problems for this site.
---

# 서귀포 관광지 관람객 추이 (`seogwipo-tour/`)

Vite(vanilla JS) + three r160 + chart.js. 서귀포시 직영관광지 6곳의 월별 관람객을 3D 디오라마 기둥과 차트로 시각화. 목적: 혼잡한 때를 피한 여행 계획.

## 데이터 (공공데이터포털 odcloud)
- 엔드포인트 `https://api.odcloud.kr/api/15125100/v1/uddi:32a1b877-af20-4505-a76a-fd389ebd30ca` (서귀포시_직영관광지 관람객수 추이_20251002), 인증은 `serviceKey` 쿼리(또는 `Authorization: Infuser <키>`). 키 없으면 `{"code":-401}`.
- 스펙(필드 목록)은 키 없이 `https://infuser.odcloud.kr/oas/docs?namespace=15125100/v1` 에서 읽을 수 있음. 칼럼: 기준연도, 기준월, 천지연폭포, 천제연폭포, 정방폭포, `중문대포 주상절리대`, `산방산_용머리`, 감귤박물관, 데이터기준일자. 응답은 `{ page, perPage, totalCount, data:[...] }`. "공란사유: 데이터 미집계" → 값이 비어 있을 수 있음(null 처리).
- 새 버전이 나오면 `api/visitors.js` 의 uddi 와 `SPOTS` 칼럼 이름만 바꾸면 됨.

## 구조
- `api/visitors.js` 서버 프록시(키 숨김, perPage 1000, 최대 5페이지, 24h 캐시, Encoding 키 자동 decode)
- `src/diorama.js` 섬+한라산+오름+바다 파도, 관광지 기둥(높이=값/전체최대, 색=한적 청록→붐빔 빨강), 이름표 캔버스 텍스처(긴 이름 자동 축소), OrbitControls, 클릭 vs 드래그 구분, 좁은 화면 카메라 거리 보정, 화면 밖이면 정지
- `src/charts.js` Chart.js 선 그래프 + 현재 달 세로선 플러그인, 달력 월별 평균 막대(붐빔 3·한적 3 색)
- `src/main.js` 상태: `selected`(Set), `idx`(월 인덱스), 슬라이더/재생(450ms)
- `src/data.js` `?demo=1` 이면 가짜 샘플(키 없이 화면 확인용, 화면에 경고 배너)

## 환경변수 / 배포
`DATA_GO_KR_KEY` 1개(서버 전용, Vercel secret, `VITE_` 금지). Vercel 새 프로젝트에서 **Root Directory = `seogwipo-tour`**. 키 승인 직후 반영에 1~2시간 걸릴 수 있음. 로컬은 `.env` + `npm run dev`(vite 플러그인이 `/api/visitors` 처리). 미리보기 설정은 `.claude/launch.json` 의 `seogwipo-tour`(포트 5178).

## 메모
- 브라우저 미리보기에서 탭이 배경이면 IntersectionObserver 때문에 3D가 멈춰 빈 화면처럼 보일 수 있음(탭을 앞으로 가져오면 정상).
- 실제 키로 호출해 본 적은 없음(스펙 기준으로 작성, 데모 데이터로 화면 검증).
- 긴 한글 파일은 셸 heredoc 대신 Write 도구 사용. 필요한 경로만 `git add`.
