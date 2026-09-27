"use client";

// react-masonry-css는 브라우저에서 열 개수를 계산하는 클라이언트 컴포넌트라서
// 이 파일만 "use client"로 분리했다. 데이터 준비는 서버 컴포넌트(page.tsx)가 맡는다.

import Image from "next/image";
import { useState } from "react";
import Masonry from "react-masonry-css";
import type { GalleryItem } from "@/lib/types";

// 화면 너비별 열 개수. default는 가장 넓은 화면, 숫자 키는 "이 너비 이하일 때".
const breakpointColumns = {
  default: 5,
  1280: 4,
  1024: 3,
  640: 2,
};

export default function TrendGallery({ items }: { items: GalleryItem[] }) {
  return (
    <Masonry
      breakpointCols={breakpointColumns}
      className="masonry-grid"
      columnClassName="masonry-column"
    >
      {items.map((item, index) => (
        // 앞쪽 카드 몇 장만 우선 로딩해서 첫 화면이 빨리 뜨게 한다.
        <GalleryCard key={item.id} item={item} priority={index < 5} />
      ))}
    </Masonry>
  );
}

function GalleryCard({ item, priority }: { item: GalleryItem; priority: boolean }) {
  // 외부 이미지가 깨지면 빈 칸 대신 카드 자체를 숨긴다.
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <figure className="mb-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10">
      {/* aspect-ratio로 높이를 미리 잡아둬야 이미지 로딩 중에 카드가 밀리지 않는다 */}
      <div className="relative" style={{ aspectRatio: `${item.width} / ${item.height}` }}>
        <Image
          src={item.imageUrl}
          alt={`${item.term} 사진`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
          className="object-cover"
          priority={priority}
          onError={() => setFailed(true)}
        />
      </div>
      <figcaption className="flex items-center gap-2 px-3 py-2.5">
        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-500/20 dark:text-rose-200">
          {item.rank}위
        </span>
        <span className="text-sm font-medium">{item.term}</span>
        {item.sourcePageUrl && (
          <a
            href={item.sourcePageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            {item.source}
          </a>
        )}
      </figcaption>
    </figure>
  );
}
