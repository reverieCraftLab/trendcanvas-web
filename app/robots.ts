import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// /robots.txt를 만든다. 검색엔진 크롤러에게 "전체 공개, 사이트맵은 여기"라고 알려 준다.
// 백엔드 API는 다른 주소(api.trendcanvas...)에 있어서 이 사이트에서는 막을 경로가 없다.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
