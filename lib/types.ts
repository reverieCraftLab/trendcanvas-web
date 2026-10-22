// 백엔드(trendcanvas) API 응답 타입. 네이버 값은 가공하지 않고 그대로 받는다(NFR-05).

// GET /api/desserts/home: 홈에 보여줄 디저트. 이미지는 따로 받는다.
export type Dessert = {
  id: number;
  keyword: string; // 화면에 보이면서 네이버 검색에도 쓰는 이름
};

// 네이버 이미지 검색 결과 한 장.
export type NaverImageItem = {
  // 네이버가 준 그대로다. 검색어를 감싼 HTML 태그가 섞일 수 있으므로 HTML로 해석하지 않는다(XSS 방지).
  // 그래서 alt 속성처럼 글자로만 쓰고, dangerouslySetInnerHTML에는 넣지 않는다.
  title: string;
  // 원본 이미지 주소. http://일 수 있어 우리 사이트(https)의 <img>에는 쓰지 않고 '원본 링크'로만 쓴다.
  link: string;
  // 작은 미리보기. https://search.pstatic.net/... 라서 <img>에 쓸 수 있다.
  thumbnail: string;
  // 원본 크기. 네이버가 문자열로 준다. 이미지가 로딩되기 전에 칸의 높이를 잡는 데만 쓴다.
  sizeheight: string;
  sizewidth: string;
};

// GET /api/images 응답
export type ImageSearchResponse = {
  total: number;
  start: number;
  display: number;
  items: NaverImageItem[];
};
