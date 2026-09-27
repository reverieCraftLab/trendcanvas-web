import mock from "@/data/mock.json";
import type { GalleryItem, TrendResponse } from "./types";

// 데이터를 가져오는 곳을 이 함수 하나로 모아둔다.
// 백엔드 API가 생기면 이 안쪽만 fetch로 바꾸면 되고 화면 코드는 건드리지 않는다.
export async function getTrends(): Promise<TrendResponse> {
  return mock as TrendResponse;
}

// 키워드 그룹별 이미지를 카드 목록으로 펼친다.
// 순위대로 한 장씩 번갈아 꺼내서(라운드 로빈) 첫 줄에 1~5위가 순서대로 한 장씩 보이게 한다.
// 그냥 이어 붙이면 첫 줄이 전부 1위 키워드 사진으로 채워진다.
export function toGalleryItems(data: TrendResponse): GalleryItem[] {
  const groups = [...data.keywordGroups].sort((a, b) => a.rank - b.rank);
  const maxLength = Math.max(0, ...groups.map((g) => g.images.length));
  const items: GalleryItem[] = [];

  for (let i = 0; i < maxLength; i++) {
    for (const group of groups) {
      const image = group.images[i];
      if (image) {
        items.push({ ...image, term: group.term, rank: group.rank });
      }
    }
  }
  return items;
}
