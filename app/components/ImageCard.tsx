"use client";

import { useState, type CSSProperties } from "react";
import type { NaverImageItem } from "@/lib/types";

export default function ImageCard({
  item,
  className = "mb-5 break-inside-avoid",
  style,
  tile = false,
  ratio,
}: {
  item: NaverImageItem;
  // 놓이는 자리(여러 열, 가로 팔, 세로 팔)에 맞춘 크기와 여백은 부르는 쪽이 정한다.
  className?: string;
  style?: CSSProperties;
  // true면 칸(figure)이 원본 비율을 가지고 이미지는 그 안쪽에 일정한 여백을 두고 놓인다.
  // 칸의 크기가 비율 그대로라서, 칸을 이어 붙여 빈틈없이 채우는 배치(ㄱ자 묶음)에서 높이 계산이 어긋나지 않는다.
  tile?: boolean;
  // 실제로 받은 썸네일의 가로÷세로 비율. 주어지면 네이버가 준 원본 크기 대신 이 값으로 칸을 잡는다.
  ratio?: number;
}) {
  // 이미지가 깨지면 빈 칸 대신 카드를 숨긴다.
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  // 칸의 높이를 원본 비율로 미리 잡아 두면 이미지가 로딩될 때 화면이 밀리지 않고 자르지도 않는다.
  const aspectRatio = ratio ?? getAspectRatio(item);

  if (tile) {
    return (
      <figure className={`relative ${className}`} style={{ ...style, aspectRatio }}>
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="원본 보기"
          className="absolute inset-1 block overflow-hidden rounded-[3px] bg-placeholder"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.thumbnail}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
        </a>
      </figure>
    );
  }

  return (
    <figure className={className} style={style}>
      {/* 눈에 보이는 "원본" 글자 대신 이미지를 누르면 원본 페이지가 열리게 한다.
          약관의 원본 링크 표시 조건을 유지하면서 화면은 이미지만 남기기 위해서다. */}
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="원본 보기"
        className="block overflow-hidden rounded-[3px] bg-placeholder"
        style={{ aspectRatio }}
      >
        {/* next/image를 쓰지 않는 이유: 네이버 이미지를 우리 서버가 내려받아 가공·저장하게 되기 때문이다(NFR-05).
            썸네일은 https라서 브라우저가 네이버에서 직접 받는다. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.thumbnail}
          alt={item.title}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      </a>
    </figure>
  );
}

// 원본 가로÷세로. 크기를 알 수 없으면 정사각형으로 둔다.
export function getAspectRatio(item: NaverImageItem): number {
  const width = Number(item.sizewidth);
  const height = Number(item.sizeheight);
  return width > 0 && height > 0 ? width / height : 1;
}
