"use client";

// ㄱ자 묶음의 한 겹(디저트 하나)이 쓸 이미지를 준비하는 훅.
//   1) 네이버에서 이미지를 받아 두고(useImageBuffer)
//   2) 그리기 전에 브라우저로 미리 내려받아 정상으로 뜨는지 확인하고, 실제 썸네일의 가로÷세로 비율을 알아낸 뒤
//   3) 앞에서부터 정상인 이미지를 needed장 고른다. 깨진 이미지는 건너뛰고 다음 이미지로 채운다.
//
// 이렇게 하는 이유: ㄱ자 묶음은 "모든 이미지가 정상으로 뜨고 칸의 비율이 이미지의 비율과 같다"는 전제에서 빈틈없이 맞는다.
// 이미지가 깨져 사라지거나, 칸의 비율을 네이버가 준 원본 크기로 잡았는데 실제 썸네일 비율이 다르면 그 전제가 깨져 빈 공간이 생긴다.
//
// 건너뛰는 것은 깨진 이미지뿐이다. 내용으로 고르거나 순서를 바꾸지 않는다(NFR-05, 약관 특약 1.2~1.3).

import { useEffect, useRef, useState } from "react";
import type { NaverImageItem } from "./types";
import { useImageBuffer } from "./useImageBuffer";

export type LoadedImage = { item: NaverImageItem; ratio: number };

// 정상이면 실제 썸네일의 가로÷세로 비율, 깨졌으면 "fail"
type Result = number | "fail";

// 필요한 장수보다 이만큼 더 후보로 미리 확인해 두면, 깨진 이미지가 한두 장 있어도 바로 채울 수 있다.
const SPARE = 2;

export function useLayerImages(keyword: string, needed: number, options: { startAt?: number; enabled: boolean }) {
  const { startAt, enabled } = options;
  const [results, setResults] = useState<Record<number, Result>>({});
  const startedRef = useRef(new Set<number>());
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const failCount = Object.values(results).filter((r) => r === "fail").length;

  // 깨진 이미지가 있으면 그만큼 더 받는다. 깨진 것이 없으면 필요한 장수만 받는다(한 번에 10장이라 요청은 한 번이다).
  const buffer = useImageBuffer(keyword, needed + failCount, { startAt, prefetch: 0, enabled });
  const items = buffer.items;

  // 새로 도착한 후보(필요한 수 + 깨진 수 + 여유분까지)를 미리 내려받아 확인한다.
  useEffect(() => {
    if (!enabled) return;
    const end = Math.min(items.length, needed + failCount + SPARE);
    for (let i = 0; i < end; i++) {
      if (startedRef.current.has(i)) continue;
      startedRef.current.add(i);
      const img = new Image();
      img.onload = () => {
        if (!mountedRef.current) return;
        const ok = img.naturalWidth > 0 && img.naturalHeight > 0;
        setResults((prev) => ({ ...prev, [i]: ok ? img.naturalWidth / img.naturalHeight : "fail" }));
      };
      img.onerror = () => {
        if (mountedRef.current) setResults((prev) => ({ ...prev, [i]: "fail" }));
      };
      img.src = items[i].thumbnail;
    }
  }, [items, needed, failCount, enabled]);

  // 앞에서부터 정상인 이미지를 needed장 고른다. 앞쪽에 아직 결과가 없는 이미지가 있으면
  // 그것이 나중에 깨질 때 순서가 바뀔 수 있으므로 기다린다.
  const usable: LoadedImage[] = [];
  let blocked = false;
  for (let i = 0; i < items.length && usable.length < needed; i++) {
    const r = results[i];
    if (r === undefined) {
      blocked = true;
      break;
    }
    if (r !== "fail") usable.push({ item: items[i], ratio: r });
  }

  // 준비 완료: 필요한 장수를 채웠거나, 더 받을 이미지가 없거나(끝, 오류 포함) 결과를 다 확인했을 때.
  const givenUp = buffer.done || buffer.error;
  const settled = !enabled || usable.length >= needed || (!blocked && givenUp);

  return { usable, settled, error: buffer.error, retry: buffer.retry };
}
