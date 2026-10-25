"use client";

// ㄱ자 묶음 하나. 디저트 한 개가 ㄱ자 한 겹을 맡고, 안쪽으로 한 겹씩 작아지는 ㄱ자가 이어진다.
//
//   A A A A A      A: 가로 팔(위쪽 한 줄)
//   B C C C C      B: 세로 팔(왼쪽, A 아래로)  → 한 겹 = 가로 팔 + 세로 팔 = 디저트 하나
//   B D E E E      C, D: 그 안쪽 한 겹을 다른 디저트가 맡는다 … 안으로 계속
//   B D F G G
//
// 이것은 배치의 "형식"이다. 이미지는 늘리거나 자르지 않고 원본 비율 그대로 놓는다.
// 한 디저트의 이미지는 네이버가 준 순서대로 가로 팔(왼쪽에서 오른쪽) → 세로 팔(위에서 아래) 순서로 쓴다.
// 이미지를 섞거나 순서를 바꾸지 않고, 한 디저트의 결과 사이에 다른 디저트의 이미지를 끼우지 않는다(FR-01, 약관 특약 1.3).
//
// 빈틈 없이 맞추는 계산:
// 폭을 1로 놓고 비율로만 계산한다(그래서 화면 폭이 바뀌어도 그대로 맞는다).
// - 가로 팔: 이미지를 같은 높이로 맞춰 폭을 채우면 높이 = 1 ÷ (이미지 비율의 합).
// - 세로 팔: 폭을 f라 하면 높이 = f × S (S = 이미지마다 1÷비율의 합).
// - 안쪽 ㄱ자: 폭이 (1−f)이고 높이는 (1−f) × α_안쪽 (α는 "폭 1일 때의 높이").
// 세로 팔과 안쪽의 높이가 같아야 하므로 f×S = (1−f)×α_안쪽 → f = α_안쪽 ÷ (S + α_안쪽).
// 안쪽 α를 알아야 바깥 f를 풀 수 있어서 가장 안쪽 겹부터 바깥으로 계산한다.

import { useEffect } from "react";
import type { Dessert } from "@/lib/types";
import { MAX_COLUMNS } from "@/lib/useColumns";
import { useLayerImages, type LoadedImage } from "@/lib/useLayerImages";
import ImageCard from "./ImageCard";
import ImageError from "./ImageError";

export type Block = {
  id: number;
  desserts: Dessert[];
  // 디저트마다 첫 요청의 start. 같은 디저트가 앞에서 이미 쓰였다면 그 다음 이미지부터 이어 받는다.
  startAts: number[];
};

const MAX_LAYERS = MAX_COLUMNS; // 겹 수의 최댓값

type Layer = {
  rowItems: LoadedImage[];
  colItems: LoadedImage[];
  f: number; // 세로 팔이 차지하는 폭의 비율(0이면 세로 팔 없음)
  hasInner: boolean;
};

// columns: 지금 화면의 가로 칸 수. 화면 폭이 바뀌면 이 값이 바뀌고 묶음의 모양과 쓰는 사진 수가 즉시 다시 정해진다.
export default function LBlock({
  block,
  columns,
  onReady,
}: {
  block: Block;
  columns: number;
  onReady: (blockId: number) => void;
}) {
  const layerCount = Math.min(columns, block.desserts.length, MAX_LAYERS);

  // 훅은 반복문이나 조건문 안에서 부를 수 없어서(React 규칙) 최대 겹 수만큼 직접 나열한다.
  // 쓰지 않는 겹은 enabled가 꺼져 있어 요청하지 않는다.
  const b0 = useLayerBuffer(block, columns, 0, layerCount);
  const b1 = useLayerBuffer(block, columns, 1, layerCount);
  const b2 = useLayerBuffer(block, columns, 2, layerCount);
  const b3 = useLayerBuffer(block, columns, 3, layerCount);
  const b4 = useLayerBuffer(block, columns, 4, layerCount);
  const buffers = [b0, b1, b2, b3, b4].slice(0, layerCount);

  // 모든 겹이 첫 응답을 받아야(이미지 크기를 알아야) 모양을 계산할 수 있다.
  // 홈은 이 신호가 있어야 다음 묶음을 붙인다. 신호 없이 붙이면 빈 묶음이 계속 쌓이고 호출이 한꺼번에 나간다.
  const ready = buffers.every((b) => b.settled);
  useEffect(() => {
    if (ready) onReady(block.id);
  }, [ready, block.id, onReady]);

  if (!ready) return <p className="py-2 font-mono text-xs text-muted">불러오는 중…</p>;

  // 가장 안쪽 겹부터 바깥으로 계산한다.
  const layers: Layer[] = [];
  let alphaInner = 0; // 안쪽 겹의 "폭 1일 때의 높이". 0이면 안쪽에 그릴 것이 없다.
  for (let index = layerCount - 1; index >= 0; index--) {
    const n = columns - index; // 이 겹의 가로 팔 칸 수(5, 4, 3, 2, 1)
    const items = buffers[index].usable;
    const rowItems = items.slice(0, n);
    const colItems = items.slice(n, 2 * n);

    const sumRatio = rowItems.reduce((sum, { ratio }) => sum + ratio, 0);
    const alphaRow = sumRatio > 0 ? 1 / sumRatio : 0;
    const colSum = colItems.reduce((sum, { ratio }) => sum + 1 / ratio, 0);
    const hasInner = alphaInner > 0;

    // 세로 팔이 없으면 안쪽이 가로 팔 아래에서 전체 폭을 쓴다. 안쪽이 없으면 세로 팔이 전체 폭을 쓴다.
    const f = colItems.length === 0 ? 0 : hasInner ? alphaInner / (colSum + alphaInner) : 1;
    const alpha = alphaRow + (colItems.length === 0 ? alphaInner : f * colSum);

    layers[index] = { rowItems, colItems, f, hasInner };
    alphaInner = alpha;
  }

  const failed = buffers.filter((b) => b.error);

  return (
    // -mx-1: 이미지 칸 안쪽에 넣은 여백(inset-1)만큼 바깥으로 당겨 묶음의 양쪽 끝이 화면 끝선에 맞게 한다.
    // 묶음 아래에 따로 간격을 두지 않는다. 칸마다 안쪽 여백(0.25rem)이 있어서 위아래 묶음 사이도 사진 사이와 같은 0.5rem이 된다.
    <section className="-mx-1">
      <LayerView layers={layers} index={0} />
      {failed.length > 0 && <ImageError onRetry={() => failed.forEach((b) => b.retry())} />}
    </section>
  );
}

// 겹 하나의 훅. 디저트가 없는 겹(홈 API가 칸 수보다 적게 줬을 때)은 빈 검색어로 요청하지 않도록 끈다.
// 필요한 이미지는 가로 팔 n장 + 세로 팔 n장이다. 깨진 이미지는 건너뛰고 다음 이미지로 채운다.
function useLayerBuffer(block: Block, columns: number, index: number, layerCount: number) {
  const n = columns - index;
  return useLayerImages(block.desserts[index]?.keyword ?? "", 2 * n, {
    startAt: block.startAts[index],
    enabled: index < layerCount && n >= 1,
  });
}

function LayerView({ layers, index }: { layers: Layer[]; index: number }) {
  const layer = layers[index];
  if (!layer) return null;
  const { rowItems, colItems, f, hasInner } = layer;
  const inner = hasInner ? <LayerView layers={layers} index={index + 1} /> : null;

  return (
    <div className="flex flex-col">
      {/* 가로 팔: 이미지마다 비율만큼 폭을 주면 높이가 같아지고 폭이 빈틈없이 채워진다. */}
      {rowItems.length > 0 && (
        <div className="flex">
          {rowItems.map(({ item, ratio }, i) => (
            <ImageCard
              key={`${i}-${item.link}`}
              item={item}
              ratio={ratio}
              tile
              className="min-w-0"
              style={{ flex: `${ratio} 1 0%` }}
            />
          ))}
        </div>
      )}

      <div className="flex items-start">
        {/* 세로 팔: 폭 f로 이미지를 원본 비율대로 위에서 아래로 쌓는다. 높이는 안쪽 겹과 같아진다. */}
        {colItems.length > 0 && (
          <div className="flex flex-none flex-col" style={{ width: `${f * 100}%` }}>
            {colItems.map(({ item, ratio }, i) => (
              <ImageCard key={`${i}-${item.link}`} item={item} ratio={ratio} tile className="" />
            ))}
          </div>
        )}
        {inner && <div className="min-w-0 flex-none" style={{ width: `${(1 - f) * 100}%` }}>{inner}</div>}
      </div>
    </div>
  );
}
