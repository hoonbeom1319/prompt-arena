---
name: no-dummy-envlocal
description: 빌드/테스트 검증 시 더미 .env.local 파일을 만들지 말 것 — 실 .env를 가리고 dev 서버를 오염시킴
metadata:
  type: feedback
---

로컬에서 `next build`나 Playwright e2e를 검증할 때, 더미값으로 `.env.local`을 만들면 안 된다.

**Why:** Next는 `.env.local`을 실제 `.env`보다 **우선** 적용한다. 이 프로젝트엔 진짜 자격증명이 담긴 `.env`가 있고 `.env.local`은 없는데(`.env*`는 gitignore), 더미 `.env.local`을 만들면 그게 실 `.env`를 덮어쓴다. 2026-06-15 실제 사고: 빌드/e2e 검증용으로 더미 `.env.local`을 잠깐 만든 사이 `npm run dev` 서버가 더미 Supabase URL(`e2eproj.supabase.co`)을 메모리에 물었고, 파일을 지운 뒤에도 **그 dev 서버가 안 죽어** 로그인이 가짜 주소로 튕기고 진행 중 챌린지가 안 보였다.

**How to apply:**
- 빌드/검증용 환경변수는 파일이 아니라 명령에 인라인으로 넘긴다: 예) `NEXT_PUBLIC_SUPABASE_URL=... npm run build`.
- 부득이 임시 파일을 만들었다면 즉시 삭제하고, **포트 3000에 떠 있는 dev 서버도 반드시 재시작**(메모리에 더미가 남아 있음).
- DB 조회 스크립트는 `node --env-file=.env script.mjs`로 실 `.env`를 읽는다(수동 파싱은 CRLF에서 깨짐).

관련: [[project-state]]
