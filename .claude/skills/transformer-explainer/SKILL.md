---
name: transformer-explainer
description: Edit or extend transformer.html, the kid-friendly Three.js animation that explains how ChatGPT/Gemini/Claude-style transformers work (tokens, embeddings, attention, layers, next-word generation). Use when asked to change scenes, captions, timing, visuals, or add scenes.
---

# 트랜스포머 쉬운 설명 애니메이션 (`transformer.html`)

단일 HTML, Three.js r160(CDN importmap), 빌드 없음. `index.html` 의 "🤖 AI 원리 배우기" 버튼에서 연결. 유치원생 눈높이 한국어 자막 + 비유가 핵심.

## 5개 장면 (`SCENES` 배열: name, dur, caps[[시작초, 자막]])
1. 자르기 (10s): 문장 "아기 고양이가 배고파서 우유를" 을 가위가 블록(토큰) 4개로 자름
2. 숫자 이름표 (11s): 블록 위 막대 + 아래 숫자 태그 = 임베딩
3. 서로 쳐다보기 (17s): 교실 비유. 블록에 눈이 있고 `FOCUS` 로 어텐션 선(굵기=가중치, 퍼센트 라벨) 표시. "우유를→배고파서", "배고파서→고양이가"
4. 층 올라가기 (16s): 반투명 바닥 층 4개(+흐릿한 2개)를 블록이 올라가며 점점 빛남. 카메라가 따라감
5. 한 단어씩 쓰기 (29s): `ROUNDS` 3회 확률 막대 → 주사위가 튀며 선택 → 2번째 줄에 단어가 이어짐. 3회차는 2등("놀았어요")이 뽑혀 "매번 다른 이야기" 설명

## 구조
- 상태 기반: `(sceneIdx, st)` 로 `layout()` 이 토큰별 목표(x,y,s,white,glow,look)를 계산 → `applyTokens` 가 `damp` 로 부드럽게 접근. 장면 이동은 `goScene(i, t)` 만 호출하면 됨
- 토큰 데이터 `DATA`(7개: 4 프롬프트 + 3 생성), 폭은 글자 수 기반(`0.5*len+0.8`)
- 카메라는 화면 비율로 거리 보정(`needW`) 해서 모바일 세로에서도 보임, 하단 자막 패널 때문에 장면을 위로 11% 올림
- UI: 이전/다음/재생·멈춤, 장면 번호 버튼, 진행 바, 방향키·스페이스. 마지막 장면 끝나면 정지 + "↻ 처음부터"
- 테스트용 `window.__t.goScene(i, t)`, `setPlaying(bool)`

## 주의
- 장면 시간(`dur`)과 `caps` 시작초, `FOCUS`/`ROUNDS`/`R0`/`RLEN` 타이밍이 서로 맞물려 있으니 함께 수정
- `file://` 로 열면 미리보기에서 JS 가 안 돌 수 있음 → 로컬 http 서버(`.claude/launch.json` 의 `day4-static`, 포트 8123)로 확인
- 파일 생성은 Write 도구 사용(긴 한글 heredoc 은 셸 파싱 오류)
