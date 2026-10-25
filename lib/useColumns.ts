import { useSyncExternalStore } from "react";

// 사진 한 칸의 목표 폭(px). 화면(콘텐츠) 폭을 이 값으로 나눠 가로 칸 수를 정한다.
// 네이버 썸네일이 150px 정도라 칸이 이보다 너무 크면 흐려진다. 5칸이면 사진 한 장이 약 270px(1.8배 확대)다.
const TARGET_CELL_WIDTH = 280;
// 홈 화면 콘텐츠의 최대 폭(page.tsx의 max-w-[1440px]). 화면이 아무리 넓어도 콘텐츠는 이 폭을 넘지 않는다.
const MAX_CONTENT_WIDTH = 1440;
// 한 묶음이 쓰는 디저트(겹) 수의 한계. 한 묶음이 디저트 5개를 쓴다(2026-10-22 GT 결정).
// 칸 수 W는 곧 ㄱ자의 겹 수다(W, W-1, …, 1칸의 가로 팔 + 같은 수의 세로 팔).
export const MIN_COLUMNS = 2;
export const MAX_COLUMNS = 5;

function getColumns(): number {
  const width = Math.min(window.innerWidth, MAX_CONTENT_WIDTH);
  return Math.max(MIN_COLUMNS, Math.min(MAX_COLUMNS, Math.floor(width / TARGET_CELL_WIDTH)));
}

function subscribe(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

// useSyncExternalStore: 브라우저 창 크기처럼 React 바깥에서 바뀌는 값을 안전하게 읽는 방법이다.
// 창 크기가 바뀌어 칸 수가 달라지면 이 값을 쓰는 화면이 즉시 다시 그려진다.
export function useColumns(): number {
  return useSyncExternalStore(subscribe, getColumns, () => MAX_COLUMNS);
}
