### [] 신고 기능 추가 (보류)
- n회 신고 시 운영자 블락 가능 등의 기능 도입 필요요

### [x] 챌린지 관리 페이지 제출 날짜 오표기 되는 것 같음
- 제출을 1일인데, 그 전날 ~ 당일로 표기 되고 있음
- 원인: 관리 페이지가 `toLocaleDateString`에 `timeZone` 미지정 → 서버(UTC) 기준으로 하루 밀림. 저장은 KST 자정 기준인데 표시는 UTC였음.
- 해결: `lib/time.ts`에 `isoToKstDate` 헬퍼 추가(KST 못박기), 관리/수정 페이지 모두 공유.

### [x] 제미나이 결과물 출력 확인
- 제미나이 결과물로 **강조할 텍스트** 이런식으로 나오는게 있는데, 이것이 그대로 노출됌, 혹시 마크업 스타일링이 적용될 수 있는지.
- 해결: `react-markdown`+`remark-gfm`+`remark-breaks` 도입, 공유 `components/GeminiOutput.tsx`로 generate·vote·results 4개 지점 일괄 교체. prose 대신 디자인 토큰 유틸로 매핑, raw HTML 비허용(XSS 안전).