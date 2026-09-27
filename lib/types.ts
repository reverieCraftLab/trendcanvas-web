// 백엔드 스키마(keyword_group → image)와 같은 모양의 응답 타입.
// Spring Boot 조회 API가 준비되면 이 타입을 API 응답 DTO에 맞춰 그대로 재사용한다.

export type TrendImage = {
  id: number;
  source: string; // image.source
  sourceId: string | null; // image.source_id
  imageUrl: string; // image.image_url
  sourcePageUrl: string | null; // image.source_page_url
  // 아래 두 값은 아직 DB 스키마에 없다.
  // 매소너리 그리드는 이미지가 로딩되기 전에 카드 높이를 알아야 레이아웃이 튀지 않아서
  // image 테이블에 width/height 컬럼 추가를 검토해야 한다.
  width: number;
  height: number;
};

export type KeywordGroup = {
  id: number;
  term: string; // candidate_term.term
  rank: number;
  relativeRatio: number; // keyword_group.relative_ratio
  images: TrendImage[];
};

export type TrendResponse = {
  category: string;
  collectedAt: string;
  keywordGroups: KeywordGroup[];
};

// 그리드에 뿌리는 카드 한 장. 이미지 하나에 자기가 속한 키워드 정보를 붙인 형태.
export type GalleryItem = TrendImage & {
  term: string;
  rank: number;
};
