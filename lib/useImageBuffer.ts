"use client";

// 키워드 하나의 이미지를 서버에서 10장씩 받아 브라우저 메모리에 쌓아 두는 훅.
// "몇 장을 쓸지"는 부르는 쪽이 정하고(wanted), 이 훅은 그만큼(과 앞서 받아 둘 여유분)을 채운다.
// 결과를 걸러내거나 순서를 바꾸지 않고, 네이버가 준 순서 그대로 이어 붙인다(NFR-05, 약관 특약 1.2~1.3).

import { useEffect, useRef, useState } from "react";
import { fetchImages, IMAGE_MAX_START, IMAGE_PAGE_SIZE } from "./api";
import type { NaverImageItem } from "./types";

// 보여줄 장수보다 이 만큼 앞서 받아 둔다. 다음 이미지가 필요한 순간에 요청을 시작하면 화면이 멈추므로 미리 받는다.
const DEFAULT_PREFETCH = 5;

type Options = {
  // 첫 요청의 start. 같은 디저트를 두 번째로 쓸 때 앞에서 쓴 이미지 다음부터 이어서 받기 위해 쓴다.
  startAt?: number;
  // 보여줄 장수보다 앞서 받아 둘 여유분. 필요한 만큼만 받으려면 0으로 준다.
  prefetch?: number;
  // false면 아무것도 요청하지 않는다. 훅은 조건부로 호출할 수 없어서, 쓰지 않는 자리에서는 이 값으로 끈다.
  enabled?: boolean;
};

export function useImageBuffer(keyword: string, wanted: number, options: Options = {}) {
  const { startAt = 1, prefetch = DEFAULT_PREFETCH, enabled = true } = options;
  const [items, setItems] = useState<NaverImageItem[]>([]);
  // 다음에 요청할 start. null이면 더 받을 이미지가 없다.
  const [nextStart, setNextStart] = useState<number | null>(startAt > IMAGE_MAX_START ? null : startAt);
  const [error, setError] = useState(false);
  // 첫 응답(또는 첫 실패)을 받았는지. 이 값이 true가 되면 이미지가 몇 장인지 알 수 있다.
  const [ready, setReady] = useState(false);
  const loadingRef = useRef(false); // 같은 요청이 겹쳐 나가지 않게 하는 잠금
  const mountedRef = useRef(false);

  // 화면에서 사라진 뒤에 늦게 도착한 응답이 상태를 바꾸지 않게 한다.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // 오류 상태에서는 자동으로 다시 받지 않는다. 자동 재시도가 반복되면 호출 한도가 소모된다(NFR-04).
    if (!enabled || error || nextStart === null || loadingRef.current) return;
    if (items.length >= wanted + prefetch) return;

    loadingRef.current = true;
    fetchImages(keyword, nextStart)
      .then((res) => {
        if (!mountedRef.current) return;
        setItems((prev) => [...prev, ...res.items]);
        const next = nextStart + IMAGE_PAGE_SIZE;
        const last = Math.min(res.total, IMAGE_MAX_START);
        setNextStart(res.items.length < IMAGE_PAGE_SIZE || next > last ? null : next);
        setReady(true);
      })
      .catch(() => {
        if (!mountedRef.current) return;
        setError(true);
        setReady(true);
      })
      .finally(() => {
        // 응답이 오기 전에 wanted가 바뀌어 이 효과가 다시 실행되어도, 이 잠금 때문에 같은 페이지를 두 번 요청하지 않는다.
        loadingRef.current = false;
      });
  }, [keyword, nextStart, items.length, wanted, prefetch, error, enabled]);

  return {
    items,
    error,
    ready: ready || nextStart === null, // 더 받을 것이 없으면(시작부터 범위 밖 포함) 기다릴 필요가 없다
    done: nextStart === null,
    retry: () => setError(false),
  };
}
