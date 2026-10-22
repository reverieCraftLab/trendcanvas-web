"use client";

// 키워드 하나의 이미지를 보여주는 목록. 네이버가 준 순서 그대로 이어 붙이고,
// 열 아래의 감시 지점이 화면에 보이면 다음 이미지를 보여주고, 받아 둔 것을 다 보여주면 서버에서 다음 10장을 불러온다(FR-02).
// 결과를 걸러내거나 순서를 바꾸지 않고, 다른 키워드의 결과와 섞지 않는다(NFR-05, 약관 특약 1.2~1.3).

import { useEffect, useRef, useState } from "react";
import { fetchImages, IMAGE_MAX_START, IMAGE_PAGE_SIZE } from "@/lib/api";
import type { NaverImageItem } from "@/lib/types";

type Status = "idle" | "loading" | "error";

// 스크롤할 때 한 번에 화면에 보여주는 이미지 수. 서버에서는 10장을 한 번에 받아 브라우저 메모리에 두고
// 이 수만큼씩 보여준다. 보여주는 수만큼씩 서버에 요청하면 호출이 늘어난다(NFR-04).
const REVEAL_SIZE = 3;

export default function ImageFeed({
  keyword,
  listClassName,
}: {
  keyword: string;
  // 이미지를 어떻게 배치할지(한 줄로 쌓기, 여러 열 등)는 부르는 쪽이 정한다.
  listClassName: string;
}) {
  const [items, setItems] = useState<NaverImageItem[]>([]);
  // 다음에 요청할 start. null이면 더 가져올 이미지가 없다.
  const [nextStart, setNextStart] = useState<number | null>(1);
  const [status, setStatus] = useState<Status>("idle");
  // 받아 둔 이미지 중 화면에 보여주는 개수
  const [shown, setShown] = useState(0);
  const loadingRef = useRef(false); // 같은 요청이 겹쳐 나가지 않게 하는 잠금
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 키워드가 바뀌면 부모가 key={keyword}로 이 컴포넌트를 새로 만들어 상태가 초기화된다.

  useEffect(() => {
    const sentinel = sentinelRef.current;
    // 오류 상태에서는 자동으로 다시 불러오지 않는다. 자동 재시도가 반복되면 호출 한도가 소모된다(NFR-04).
    if (!sentinel || status !== "idle") return;
    // 받아 둔 이미지를 다 보여줬고 더 받을 것도 없으면 감시를 멈춘다.
    if (shown >= items.length && nextStart === null) return;

    const load = async () => {
      if (loadingRef.current || nextStart === null) return;
      loadingRef.current = true;
      setStatus("loading");
      try {
        const res = await fetchImages(keyword, nextStart);
        setItems((prev) => [...prev, ...res.items]);
        const next = nextStart + IMAGE_PAGE_SIZE;
        const last = Math.min(res.total, IMAGE_MAX_START);
        setNextStart(res.items.length < IMAGE_PAGE_SIZE || next > last ? null : next);
        setStatus("idle");
      } catch {
        setStatus("error");
      } finally {
        loadingRef.current = false;
      }
    };

    // 감시 지점이 화면에 들어오면 다음 이미지를 보여준다. 받아 둔 것이 남았으면 그것을 먼저 보여주고(서버 호출 없음),
    // 다 보여줬을 때만 서버에서 다음 10장을 받는다. 처음에는 목록이 비어 있어서 첫 10장을 이 경로로 받는다.
    // observe()는 등록 직후에도 현재 상태를 한 번 알려 주므로, 보여준 뒤에도 감시 지점이 화면 안이면 이어서 진행한다.
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        if (shown < items.length) {
          setShown((n) => Math.min(n + REVEAL_SIZE, items.length));
        } else {
          void load();
        }
      },
      { rootMargin: "400px" }, // 화면 아래 400px 전에 미리 진행해서 끊김이 덜 느껴지게 한다
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [keyword, nextStart, status, items.length, shown]);

  return (
    <div>
      <div className={listClassName}>
        {items.slice(0, shown).map((item, index) => (
          // 같은 이미지가 다른 묶음에 다시 올 수 있어 주소만으로는 유일하지 않다. 순서 번호를 함께 쓴다.
          <ImageCard key={`${index}-${item.link}`} item={item} />
        ))}
      </div>

      <div ref={sentinelRef} aria-hidden="true" />

      {status === "loading" && <p className="py-4 font-mono text-xs text-muted">불러오는 중…</p>}

      {status === "error" && (
        // 한도 초과(QUOTA_EXCEEDED)를 포함한 모든 실패에 같은 안내를 쓴다. 한도 초과 전용 문구는 사용자를 본 뒤에 추가한다(D-11).
        <div className="py-4 text-sm">
          <p className="text-muted">이미지를 불러오지 못했어요.</p>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="mt-2 border-b border-foreground font-mono text-xs"
          >
            다시 시도
          </button>
        </div>
      )}

      {status === "idle" && nextStart === null && items.length === 0 && (
        <p className="py-4 text-sm text-muted">결과가 없어요.</p>
      )}
    </div>
  );
}

function ImageCard({ item }: { item: NaverImageItem }) {
  // 이미지가 깨지면 빈 칸 대신 카드를 숨긴다.
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  // 로딩 전에 칸의 높이를 잡아 두어야 이미지가 들어올 때 화면이 밀리지 않는다.
  const width = Number(item.sizewidth);
  const height = Number(item.sizeheight);
  const aspectRatio = width > 0 && height > 0 ? `${width} / ${height}` : "1 / 1";

  return (
    <figure className="mb-5 break-inside-avoid">
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
