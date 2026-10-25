"use client";

// 검색 결과: 키워드 하나의 이미지를 여러 열로 보여준다. 스크롤하면 5장씩 이어서 보여준다(FR-02, FR-03).
// 받는 일은 useImageBuffer가 하고, 이 컴포넌트는 몇 장을 보여줄지만 정한다.
// 결과를 걸러내거나 순서를 바꾸지 않는다(NFR-05, 약관 특약 1.2~1.3).

import { useEffect, useRef, useState } from "react";
import { useImageBuffer } from "@/lib/useImageBuffer";
import ImageCard from "./ImageCard";
import ImageError from "./ImageError";

// 스크롤할 때마다 새로 보여주는 장수. 한 번에 조금씩 늘면 화면이 자주 변해서 5장으로 정했다.
const REVEAL_SIZE = 5;

export default function ImageFeed({ keyword, listClassName }: { keyword: string; listClassName: string }) {
  // 키워드가 바뀌면 부모가 key={keyword}로 이 컴포넌트를 새로 만들어 상태가 초기화된다.
  const [shown, setShown] = useState(0);
  const { items, error, done, retry } = useImageBuffer(keyword, shown);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    // 받아 둔 이미지를 다 보여줬으면 더 보여줄 것이 없다. 다음 묶음이 도착하면 items가 늘어서 다시 감시한다.
    if (!sentinel || items.length <= shown) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setShown((n) => Math.min(n + REVEAL_SIZE, items.length));
      },
      { rootMargin: "400px" }, // 화면 아래 400px 전에 미리 진행해서 끊김이 덜 느껴지게 한다
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [shown, items.length]);

  return (
    <div>
      <div className={listClassName}>
        {items.slice(0, shown).map((item, index) => (
          <ImageCard key={`${index}-${item.link}`} item={item} />
        ))}
      </div>

      <div ref={sentinelRef} aria-hidden="true" />

      {!error && !done && items.length <= shown && <p className="py-4 font-mono text-xs text-muted">불러오는 중…</p>}
      {error && <ImageError onRetry={retry} />}
      {done && items.length === 0 && !error && <p className="py-4 text-sm text-muted">결과가 없어요.</p>}
    </div>
  );
}
