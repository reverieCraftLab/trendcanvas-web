import TrendGallery from "@/app/components/TrendGallery";
import { getTrends, toGalleryItems } from "@/lib/trends";

// 순위 번호를 01, 02처럼 두 자리로 맞춘다. 숫자 폭이 같아야 목록이 세로로 가지런히 정렬된다.
const pad = (n: number) => String(n).padStart(2, "0");

// 서버 컴포넌트. 데이터를 가져와서 카드 목록으로 바꾼 뒤 그리드에 넘기기만 한다.
export default async function Home() {
  const data = await getTrends();
  const items = toGalleryItems(data);
  const ranking = [...data.keywordGroups].sort((a, b) => a.rank - b.rank);
  const issueDate = data.collectedAt.replaceAll("-", ".");

  return (
    <main className="mx-auto w-full max-w-[1440px] px-5 sm:px-10">
      {/* 매거진 상단 띠: 제호와 호수 */}
      <div className="flex items-center justify-between border-b border-foreground py-3 font-mono text-[11px] uppercase tracking-[0.18em]">
        <span className="font-semibold">TrendCanvas</span>
        <span>{data.category} · Vol. {issueDate}</span>
      </div>

      <header className="grid gap-10 border-b border-line py-12 sm:py-16 lg:grid-cols-[1.3fr_1fr] lg:items-end lg:gap-16">
        <div>
          <p className="font-mono text-xs text-muted">This week&apos;s dessert index</p>
          <h1 className="mt-4 font-serif text-[clamp(2.4rem,6vw,4.75rem)] font-bold leading-[1.08] tracking-[-0.02em]">
            이번 주,
            <br />
            사람들이 찾는 디저트
          </h1>
        </div>

        {/* 순위 목록. 막대 길이는 keyword_group.relative_ratio(1위를 100으로 둔 상대 관심도) */}
        <ol className="divide-y divide-line border-y border-line">
          {ranking.map((group) => (
            <li key={group.id} className="grid grid-cols-[2.25rem_5.5rem_1fr_2.5rem] items-center gap-3 py-3 text-sm">
              <span className="font-mono text-xs text-muted">{pad(group.rank)}</span>
              <span className="font-medium">{group.term}</span>
              <span className="h-px bg-line">
                <span className="block h-px bg-foreground" style={{ width: `${group.relativeRatio}%` }} />
              </span>
              <span className="text-right font-mono text-xs tabular-nums">{Math.round(group.relativeRatio)}</span>
            </li>
          ))}
        </ol>
      </header>

      <section className="py-10 sm:py-14">
        <TrendGallery items={items} />
      </section>

      {/* 지금은 가짜 데이터라는 걸 방문자에게 숨기지 않는다 */}
      <footer className="flex flex-col gap-1 border-t border-line py-6 font-mono text-[11px] text-muted sm:flex-row sm:justify-between">
        <span>순위와 수치는 서비스 준비 중인 예시 데이터입니다</span>
        <span>Photos from Unsplash</span>
      </footer>
    </main>
  );
}
