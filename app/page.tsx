import HomeGallery from "@/app/components/HomeGallery";

// 서버 컴포넌트. 데이터는 브라우저가 백엔드에서 직접 가져오므로(D-15) 여기서는 화면 틀만 만든다.
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-[1440px] px-5 sm:px-10">
      <HomeGallery />

      {/* 네이버 출처 표기(NFR-05). 이미지마다 원본 링크도 함께 보여준다 */}
      <footer className="border-t border-line py-6 font-mono text-[11px] text-muted">
        이미지는 네이버 검색 결과이며, 저작권은 각 원작자에게 있습니다.
      </footer>
    </main>
  );
}
