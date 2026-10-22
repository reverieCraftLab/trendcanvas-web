import type { Dessert, ImageSearchResponse } from "./types";

// 백엔드 주소. 배포할 때는 빌드 시점에 NEXT_PUBLIC_API_BASE_URL로 바꾼다.
// NEXT_PUBLIC_ 접두사가 있는 값은 브라우저 코드에 들어간다(공개되어도 되는 값만 쓴다).
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

// 백엔드 ImageSearchService.DISPLAY(10)와 ImageController.MAX_START(1000)와 같아야 하는 값.
// 한 번에 10장을 받고, 다음 묶음은 start를 10씩 올려 요청한다.
export const IMAGE_PAGE_SIZE = 10;
export const IMAGE_MAX_START = 1000;

// 호출 실패. status가 0이면 서버에 닿지 못한 것(연결 실패 등)이다.
// code는 백엔드가 준 구분 값(QUOTA_EXCEEDED, UPSTREAM_ERROR 등)이고 없을 수도 있다.
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string | null,
  ) {
    super(`API 호출 실패 status=${status} code=${code ?? "-"}`);
  }
}

async function getJson<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(path, API_BASE);
  // URLSearchParams가 한글과 공백을 알아서 인코딩해 준다(주소에 직접 이어 붙이면 Tomcat이 400으로 막는다).
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  let res: Response;
  try {
    // 이미지 검색 결과는 우리가 저장하지 않으므로 브라우저에도 캐시하지 않는다(NFR-05).
    res = await fetch(url, { cache: "no-store" });
  } catch {
    throw new ApiError(0, null);
  }

  if (!res.ok) {
    let code: string | null = null;
    try {
      code = ((await res.json()) as { code?: string }).code ?? null;
    } catch {
      // 본문이 JSON이 아니면 code 없이 status만 알린다.
    }
    throw new ApiError(res.status, code);
  }
  return (await res.json()) as T;
}

export function fetchHomeDesserts(): Promise<Dessert[]> {
  return getJson<Dessert[]>("/api/desserts/home");
}

export function fetchImages(keyword: string, start: number): Promise<ImageSearchResponse> {
  return getJson<ImageSearchResponse>("/api/images", { keyword, start: String(start) });
}
