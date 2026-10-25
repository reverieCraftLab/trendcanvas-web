import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// /sitemap.xml을 만든다. 지금은 페이지가 홈 하나다.
// 마지막 수정일(lastModified)은 실제 값을 알 수 없어서 넣지 않았다. 틀린 날짜를 주면 오히려 신뢰를 잃는다.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_URL }];
}
