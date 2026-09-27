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

const pad = (n: number) => String(n).padStart(2, "0");

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
    // 카드 테두리와 그림자를 없앴다. 사진 자체가 카드 역할을 하게 두는 게 매거진 느낌의 핵심이다.
    <figure className="group mb-6 sm:mb-8">
      {/* aspect-ratio로 높이를 미리 잡아둬야 이미지 로딩 중에 카드가 밀리지 않는다.
          로딩 전에는 배경과 비슷한 톤의 빈 면을 보여준다 */}
      <div
        className="relative overflow-hidden rounded-[3px] bg-placeholder"
        style={{ aspectRatio: `${item.width} / ${item.height}` }}
      >
        <Image
          src={item.imageUrl}
          alt={`${item.term} 사진`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          priority={priority}
          onError={() => setFailed(true)}
        />
      </div>
      <figcaption className="mt-2.5 flex items-baseline gap-2 text-[13px]">
        <span className="font-mono text-[11px] text-muted">{pad(item.rank)}</span>
        <span className="font-medium">{item.term}</span>
        {item.sourcePageUrl && (
          <a
            href={item.sourcePageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
          >
            {item.source} ↗
          </a>
        )}
      </figcaption>
    </figure>
  );
}
