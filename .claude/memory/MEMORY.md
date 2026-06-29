# Memory Index

- [작업 자율성 — 승인 불필요](feedback_no_approval_needed.md) — prompt-arena 내 모든 작업은 별도 승인 없이 진행
- [프로젝트 철학](project_philosophy.md) — AI 주도 개발 프로세스 실험 프로젝트. 컨벤션은 AI-사람 간 공유 언어
- [메모리 워크플로우](feedback_memory_workflow.md) — 세션 끝에 .claude/memory/ 업데이트 + commit. push는 사용자가 직접
- [프로젝트 상태](project_state.md) — 스냅샷. **2026-06-29 서비스 종료** — 유저 PII 폐기, 콘텐츠만 보존. 재시작 키트(schema.sql + restore-content.sql), 절차는 docs/RESTART.md. (이전: 아키텍처 리팩토링 P0~P6 완료, A-9 홀드)
- [더미 .env.local 금지](feedback_no_dummy_envlocal.md) — 빌드/테스트용 더미 .env.local 만들지 말 것 (실 .env 가림 + dev서버 오염 사고)
- [Gemini 결제/모델 (해결됨)](blocker_gemini_billing.md) — 선불 충전으로 해결. 모델은 gemini-2.5-flash 사용 (1.5/2.0은 죽음) (2026-06-09)
