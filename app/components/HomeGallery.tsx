"use client";

// 홈 화면. 처음에는 ㄱ자 묶음(디저트 한 개가 ㄱ자 한 겹)을 보여주고, 스크롤하면 다른 디저트로 같은 모양을 아래에 이어 붙인다.
// 검색하면 그 키워드의 이미지만 여러 열로 보여준다(FR-01, FR-03).
// 흐름: 접속 → /api/desserts/home로 디저트를 받아 묶음 하나를 만든다 → 겹마다 /api/images를 따로 호출(D-15).
// 한 겹이 실패해도 다른 겹은 그대로 보인다(NFR-09).

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchHomeDesserts, IMAGE_PAGE_SIZE } from "@/lib/api";
import { MAX_COLUMNS, useColumns } from "@/lib/useColumns";
import type { Dessert } from "@/lib/types";
import ImageFeed from "./ImageFeed";
import LBlock, { type Block } from "./LBlock";

// 검색: 한 키워드를 여러 열로 보여준다. CSS 열 나누기는 DOM 순서(API 순서)를 그대로 유지한다.
const SEARCH_LIST = "columns-2 gap-5 sm:columns-3 lg:columns-4";

export default function HomeGallery() {
  const columns = useColumns();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [readyIds, setReadyIds] = useState<number[]>([]);
  const [homeFailed, setHomeFailed] = useState(false);
  const [input, setInput] = useState("");
  // 검색 중인 키워드. null이면 홈이다.
  const [query, setQuery] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const appendingRef = useRef(false); // 묶음 요청이 겹쳐 나가지 않게 하는 잠금
  const nextIdRef = useRef(0);
  // 디저트별로 몇 번 썼는지. 같은 디저트가 다시 나오면 앞에서 쓴 이미지 다음부터 이어서 받는다(중복 방지).
  const usageRef = useRef(new Map<string, number>());
  // 홈 API로 받아 두었지만 아직 묶음에 쓰지 않은 디저트. 묶음이 이 목록에서 앞에서부터 3개씩 가져간다.
  const poolRef = useRef<Dessert[]>([]);

  // 받아 둔 디저트에서 count개를 앞에서부터 꺼낸다. 다 쓰면 홈 API를 다시 불러 새 목록으로 이어간다.
  // 새 목록에서는 이번 묶음에 이미 들어간 디저트를 걸러서 한 묶음에 같은 디저트가 두 번 들어가지 않게 한다.
  const takeDesserts = useCallback(async (count: number): Promise<Dessert[]> => {
    const taken: Dessert[] = [];
    while (taken.length < count) {
      if (poolRef.current.length === 0) {
        const fetched = await fetchHomeDesserts();
        poolRef.current = fetched.filter((d) => !taken.some((t) => t.keyword === d.keyword));
        if (poolRef.current.length === 0) break; // 더 쓸 디저트가 없다
      }
      taken.push(poolRef.current.shift()!);
    }
    return taken;
  }, []);

  // 새 묶음 하나를 붙인다. 묶음은 디저트를 최대 칸 수(3)만큼 가져간다. 화면이 좁아 칸이 줄어들면 앞의 디저트만 쓴다.
  const appendBlock = useCallback(async () => {
    if (appendingRef.current) return;
    appendingRef.current = true;
    setHomeFailed(false);
    try {
      const desserts = await takeDesserts(MAX_COLUMNS);
      if (desserts.length === 0) throw new Error("no desserts");
      const startAts = desserts.map((d) => {
        const used = usageRef.current.get(d.keyword) ?? 0;
        usageRef.current.set(d.keyword, used + 1);
        return 1 + used * IMAGE_PAGE_SIZE;
      });
      setBlocks((prev) => [...prev, { id: nextIdRef.current++, desserts, startAts }]);
    } catch {
      setHomeFailed(true);
    } finally {
      appendingRef.current = false;
    }
  }, [takeDesserts]);

  const handleReady = useCallback((blockId: number) => {
    setReadyIds((prev) => (prev.includes(blockId) ? prev : [...prev, blockId]));
  }, []);

  // 처음 접속하면 첫 묶음을 붙인다.
  useEffect(() => {
    void appendBlock();
  }, [appendBlock]);

  const allReady = blocks.length > 0 && blocks.every((b) => readyIds.includes(b.id));

  // 마지막 묶음 아래의 감시 지점이 화면에 들어오면 다음 묶음을 붙인다.
  // 모든 묶음이 준비되었을 때만 붙인다(이미지 크기를 알기 전에는 묶음의 높이를 몰라 감시 지점이 계속 보이기 때문이다).
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (query !== null || !sentinel || !allReady || homeFailed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void appendBlock();
      },
      { rootMargin: "400px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [query, allReady, homeFailed, blocks.length, appendBlock]);

  const goHome = () => {
    setQuery(null);
    setInput("");
    // 홈으로 돌아오면 묶음을 처음부터 새로 만든다
    setBlocks([]);
    setReadyIds([]);
    usageRef.current = new Map();
    poolRef.current = [];
    void appendBlock();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const keyword = input.trim();
    if (keyword) setQuery(keyword);
  };

  return (
    <>
      {/* 상단 띠: 서비스 이름과 검색창 */}
      <div className="flex items-center justify-between gap-4 border-b border-foreground py-3">
        <button type="button" onClick={goHome} className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em]">
          TrendCanvas
        </button>
        <form onSubmit={submit} className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={100} // 서버도 100자까지만 받는다
            placeholder="Search"
            aria-label="디저트 검색"
            className="w-40 border-b border-line bg-transparent py-1 text-sm outline-none focus:border-foreground sm:w-64"
          />
          {/* 글자 대신 돋보기 아이콘. 글자가 없어서 스크린 리더가 읽을 수 있게 aria-label을 둔다 */}
          <button type="submit" aria-label="검색" className="p-1">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </button>
        </form>
      </div>

      <section className="py-8 sm:py-10">
        {query !== null ? (
          // key={query}: 검색어가 바뀌면 목록을 처음부터 새로 만든다
          <ImageFeed key={query} keyword={query} listClassName={SEARCH_LIST} />
        ) : (
          <>
            {blocks.map((block) => (
              <LBlock key={block.id} block={block} columns={columns} onReady={handleReady} />
            ))}
            <div ref={sentinelRef} aria-hidden="true" />
            {blocks.length === 0 && !homeFailed && <p className="font-mono text-xs text-muted">불러오는 중…</p>}
            {homeFailed && (
              <div className="text-sm">
                <p className="text-muted">디저트를 불러오지 못했어요.</p>
                <button
                  type="button"
                  onClick={() => void appendBlock()}
                  className="mt-2 border-b border-foreground font-mono text-xs"
                >
                  다시 시도
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
