"use client";

// 홈 화면. 처음에는 디저트 5개를 열로 보여주고, 검색하면 그 키워드의 이미지만 보여준다(FR-01, FR-03).
// 흐름: 접속 → /api/desserts/home로 키워드 5개 → 열마다 /api/images를 따로 호출(D-15).
// 한 열이 실패해도 다른 열은 그대로 보인다(NFR-09).

import { useEffect, useState } from "react";
import { fetchHomeDesserts } from "@/lib/api";
import type { Dessert } from "@/lib/types";
import ImageFeed from "./ImageFeed";

// 홈: 디저트마다 한 줄로 쌓인 열. 모바일에서는 열이 세로로 이어진다(NFR-10, 세부 배치는 화면을 보며 조정).
const COLUMN_LIST = "flex flex-col";
// 검색: 한 키워드를 여러 열로 보여준다. CSS 열 나누기는 DOM 순서(API 순서)를 그대로 유지한다.
const SEARCH_LIST = "columns-2 gap-5 sm:columns-3 lg:columns-4";

export default function HomeGallery() {
  const [desserts, setDesserts] = useState<Dessert[] | null>(null);
  const [homeFailed, setHomeFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [input, setInput] = useState("");
  // 검색 중인 키워드. null이면 홈이다.
  const [query, setQuery] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchHomeDesserts()
      .then((data) => !cancelled && setDesserts(data))
      .catch(() => !cancelled && setHomeFailed(true));
    return () => {
      cancelled = true; // 화면이 바뀐 뒤 늦게 도착한 응답이 상태를 덮어쓰지 않게 한다
    };
  }, [retry]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const keyword = input.trim();
    if (keyword) setQuery(keyword);
  };

  return (
    <>
      {/* 상단 띠: 서비스 이름과 검색창 */}
      <div className="flex items-center justify-between gap-4 border-b border-foreground py-3">
        <button
          type="button"
          onClick={() => {
            setQuery(null);
            setInput("");
          }}
          className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em]"
        >
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
        ) : homeFailed ? (
          <div className="text-sm">
            <p className="text-muted">디저트를 불러오지 못했어요.</p>
            <button
              type="button"
              onClick={() => {
                // 실패 표시는 효과 안이 아니라 버튼을 누르는 이 순간에 지운다(효과 안에서 상태를 바꾸면 불필요한 재렌더링이 연쇄로 생긴다).
                setHomeFailed(false);
                setRetry((n) => n + 1);
              }}
              className="mt-2 border-b border-foreground font-mono text-xs"
            >
              다시 시도
            </button>
          </div>
        ) : desserts === null ? (
          <p className="font-mono text-xs text-muted">불러오는 중…</p>
        ) : (
          <div className="grid gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
            {desserts.map((dessert) => (
              <div key={dessert.id}>
                <ImageFeed keyword={dessert.keyword} listClassName={COLUMN_LIST} />
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
