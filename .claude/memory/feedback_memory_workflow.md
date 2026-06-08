---
name: feedback-memory-workflow
description: 메모리 관리 워크플로우 — 세션 끝에 업데이트, push는 사용자가 직접
metadata:
  type: feedback
---

메모리는 세션 끝에 `.claude/memory/`에 업데이트하고 git commit까지만 한다. push는 사용자가 필요할 때 직접 한다.

**Why:** 사용자가 여러 컴퓨터에서 작업하므로 메모리를 로컬이 아닌 git으로 공유. 단, push 타이밍은 사용자가 제어하길 원함.

**How to apply:** 세션 마무리 시 이번 세션에서 생긴 중요한 컨텍스트(결정, 선호, 프로젝트 상태)를 `.claude/memory/`에 반영하고 `git commit`. push는 하지 않는다.
