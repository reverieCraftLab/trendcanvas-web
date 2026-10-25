// 이미지를 불러오지 못했을 때의 안내. 한도 초과(QUOTA_EXCEEDED)를 포함한 모든 실패에 같은 문구를 쓴다.
// 한도 초과 전용 문구는 사용자를 본 뒤에 추가한다(D-11).
export default function ImageError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="py-4 text-sm">
      <p className="text-muted">이미지를 불러오지 못했어요.</p>
      <button type="button" onClick={onRetry} className="mt-2 border-b border-foreground font-mono text-xs">
        다시 시도
      </button>
    </div>
  );
}
