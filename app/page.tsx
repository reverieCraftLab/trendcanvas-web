import TrendGallery from "@/app/components/TrendGallery";
import { getTrends, toGalleryItems } from "@/lib/trends";

// 서버 컴포넌트. 데이터를 가져와서 카드 목록으로 바꾼 뒤 그리드에 넘기기만 한다.
export default async function Home() {
  const data = await getTrends();
  const items = toGalleryItems(data);
  const ranking = [...data.keywordGroups].sort((a, b) => a.rank - b.rank);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <p className="text-sm text-zinc-500">{data.collectedAt} 기준</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
          요즘 뜨는 {data.category}
        </h1>
        <ol className="mt-4 flex flex-wrap gap-2">
          {ranking.map((group) => (
            <li
              key={group.id}
              className="rounded-full border border-zinc-200 px-3 py-1 text-sm dark:border-zinc-800"
            >
              <span className="font-semibold text-rose-600 dark:text-rose-300">{group.rank}</span>{" "}
              {group.term}
            </li>
          ))}
        </ol>
      </header>

      <TrendGallery items={items} />
    </main>
  );
}
