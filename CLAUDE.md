@AGENTS.md

# trendcanvas-web (프런트) 작업 규칙

디저트 트렌드 갤러리 사이트의 프런트다. Next.js 16, React 19, Tailwind 4. 백엔드는 [trendcanvas](https://github.com/reverieCraftLab/trendcanvas)다.

## 시작할 때 먼저 읽을 것

요구사항과 결정 기록은 다른 저장소에 있다. 작업 전에 읽고 현재 상태와 결정을 파악한다.

- `../dessert-trend-docs/docs/next-steps.md`: 현재 상태와 다음 할 일
- `../dessert-trend-docs/docs/decisions.md`: 결정과 이유
- `../dessert-trend-docs/docs/01-requirements.md`: 요구사항

위 경로에 없으면 https://github.com/reverieCraftLab/dessert-trend-docs 의 같은 파일을 본다.

## 작업 규칙

- 답변은 한글로 한다. 코드를 만들면 왜 그렇게 했는지 설명한다.
- 사용자(GT)가 정하지 않은 요구사항은 채우지 않는다. 초안과 이유를 보여주고 합의한 뒤 진행한다.
- 코드는 Claude가 만들고, GT가 검토·실행하고 커밋·푸시한다. 결정과 이유는 문서 저장소의 `decisions.md`에 기록한다.
- Next.js 코드를 쓰기 전에 `node_modules/next/dist/docs/`의 관련 문서를 읽는다(AGENTS.md 참고).
- 변경 후 `npx tsc --noEmit`, `npm run lint`, `npm run build`가 통과하는지 확인한다.

## 구조와 데이터 흐름

- 브라우저가 백엔드를 직접 부른다(D-15, 경로 A). 홈 접속 → `GET /api/desserts/home`으로 디저트 3개 → 디저트마다 `GET /api/images?keyword=&start=`를 따로 호출해 열을 채운다.
- 백엔드 주소는 `NEXT_PUBLIC_API_BASE_URL`(기본 `http://localhost:8080`). 이 변수는 브라우저에 공개되므로 비밀 값을 넣지 않는다.
- `lib/api.ts`: 백엔드 호출. `lib/types.ts`: 응답 타입. `app/components/HomeGallery.tsx`: 홈(열 3개, 검색). `ImageFeed.tsx`: 키워드 하나의 이미지 목록과 무한 스크롤.

## 지켜야 할 것

- **네이버 이미지는 `next/image` 없이 일반 `<img>`로 브라우저가 직접 받게 한다**(NFR-05). `next/image`는 이미지를 서버가 내려받아 가공·저장하는 기능이라 네이버 약관(7.3③)에 걸릴 수 있다. 썸네일(`thumbnail`, https)을 쓰고, 원본 주소(`link`, http일 수 있음)는 원본 링크 표시에만 쓴다.
- 네이버 결과를 가공하지 않는다. 걸러내거나, 순서를 바꾸거나, 다른 디저트의 결과와 섞거나, 사이에 다른 내용을 끼우지 않는다(특약 1.2~1.3). 한 디저트의 결과는 API 순서대로 이어 붙인다.
- `title`에는 HTML 태그가 섞일 수 있다. HTML로 해석하지 않는다(`dangerouslySetInnerHTML` 금지).
- 각 이미지의 원본 링크와 네이버 출처 표기를 항상 보이게 한다.
- 실패한 호출을 자동으로 다시 시도하지 않는다. 사용자가 버튼을 눌렀을 때만 다시 한다(네이버 호출 한도 25,000회, NFR-04). 한도 초과 전용 문구는 사용자를 본 뒤에 추가한다(D-11).
- 비밀 값(키, 비밀번호)을 코드와 문서에 적지 않는다.
- 커밋 메시지는 `타입: 한 줄 요약` 형태로 쓴다(feat, refactor, fix, docs, chore).
