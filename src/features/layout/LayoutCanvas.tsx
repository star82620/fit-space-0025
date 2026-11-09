import { useRef, useState, type PointerEvent } from 'react';
import { productIndex } from '../../data/catalog';
import type { Placement, Space } from '../../domain/models';
import { pointerToPosition } from '../../domain/precision';
import { effectiveDimensions } from '../../domain/rotation';
import type { Issue } from '../../domain/validation';

type Props = {
  space: Space | null;
  placements: readonly Placement[];
  issues: readonly Issue[];
  onMove: (instanceId: string, x: number, y: number) => void;
  onRemove: (instanceId: string) => void;
  onRotate: (instanceId: string) => void;
};

export function LayoutCanvas({
  space,
  placements,
  issues,
  onMove,
  onRemove,
  onRotate,
}: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const border = useRef<SVGRectElement>(null);
  const drag = useRef<{
    id: string;
    grab: { x: number; y: number };
    origin: { x: number; y: number };
    ratio: number;
  } | null>(null);
  // Keep the transform fixed throughout a gesture; expanding the viewport during dragging would move the origin under the cursor.
  const [activeView, setActiveView] = useState<{
    minX: number;
    minY: number;
    width: number;
    height: number;
  } | null>(null);
  function contentView() {
    const bounds = placements.map((p) => ({
      ...p,
      dimensions: effectiveDimensions(productIndex.get(p.productId)!, p),
    }));
    const width = space?.width ?? 100;
    const depth = space?.depth ?? 80;
    const minX = Math.min(0, ...bounds.map((p) => p.x)) - 20;
    const minY = Math.min(0, ...bounds.map((p) => p.y)) - 20;
    const maxX =
      Math.max(width, ...bounds.map((p) => p.x + p.dimensions.width)) + 20;
    const maxY =
      Math.max(depth, ...bounds.map((p) => p.y + p.dimensions.depth)) + 20;
    return { minX, minY, width: maxX - minX, height: maxY - minY };
  }
  const v = activeView ?? contentView();
  const affected = new Set(issues.flatMap((i) => [...i.instanceIds]));
  function start(event: PointerEvent<SVGGElement>, placement: Placement) {
    if (event.button !== 0 || !border.current || !svg.current || !space) return;
    const bounds = border.current.getBoundingClientRect();
    const ratio = bounds.width / space.width;
    drag.current = {
      id: placement.instanceId,
      ratio,
      origin: { x: bounds.x, y: bounds.y },
      grab: {
        x: (event.clientX - bounds.x) / ratio - placement.x,
        y: (event.clientY - bounds.y) / ratio - placement.y,
      },
    };
    setActiveView(v);
    svg.current.setPointerCapture(event.pointerId);
    event.preventDefault();
  }
  function move(event: PointerEvent<SVGSVGElement>) {
    const active = drag.current;
    if (!active) return;
    const position = pointerToPosition(
      { x: event.clientX, y: event.clientY },
      active.origin,
      active.ratio,
      active.grab,
    );
    onMove(active.id, position.x, position.y);
  }
  function finish(event: PointerEvent<SVGSVGElement>) {
    if (!drag.current) return;
    move(event);
    drag.current = null;
    setActiveView(null);
    if (svg.current?.hasPointerCapture(event.pointerId))
      svg.current.releasePointerCapture(event.pointerId);
  }
  return (
    <section className="panel canvas-panel" aria-labelledby="canvas-title">
      <div className="canvas-toolbar">
        <div>
          <span className="eyebrow">03 / 自由配置</span>
          <h2 id="canvas-title">試著擺進你的空間</h2>
        </div>
        <span className="view-pill">俯視圖 · 可手動旋轉 90°</span>
      </div>
      <div className="canvas-stage">
        <svg
          ref={svg}
          role="group"
          aria-label="收納配置區"
          viewBox={`${v.minX} ${v.minY} ${v.width} ${v.height}`}
          onPointerMove={move}
          onPointerUp={finish}
          onPointerCancel={finish}
        >
          <defs>
            <pattern
              id="dots"
              width="5"
              height="5"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="0" cy="0" r="0.18" fill="#cbd3cb" />
            </pattern>
          </defs>
          <rect
            x={v.minX}
            y={v.minY}
            width={v.width}
            height={v.height}
            fill="url(#dots)"
          />
          {space && (
            <>
              <rect
                ref={border}
                data-testid="space-boundary"
                x="0"
                y="0"
                width={space.width}
                height={space.depth}
                fill="#ffffff"
                stroke="#758879"
                strokeWidth="0.4"
                strokeDasharray="2 1"
              />
              <text
                x={space.width / 2}
                y="-5"
                className="dimension-label"
                textAnchor="middle"
              >
                寬 {space.width} cm
              </text>
              <text
                x="-5"
                y={space.depth / 2}
                className="dimension-label"
                textAnchor="middle"
                transform={`rotate(-90 -5 ${space.depth / 2})`}
              >
                深 {space.depth} cm
              </text>
            </>
          )}
          {placements.map((placement, index) => {
            const product = productIndex.get(placement.productId)!;
            const dimensions = effectiveDimensions(product, placement);
            const invalid = affected.has(placement.instanceId);
            const font = Math.min(
              dimensions.width / 7,
              dimensions.depth / 3.8,
              3.6,
            );
            return (
              <g
                key={placement.instanceId}
                role="button"
                tabIndex={0}
                aria-label={`${product.name} 第 ${index + 1} 件，位置 ${placement.x}, ${placement.y} cm${invalid ? '，有異常' : ''}`}
                data-testid={`placement-${placement.instanceId}`}
                className={`placed-product ${invalid ? 'has-issue' : ''}`}
                onPointerDown={(e) => start(e, placement)}
              >
                <rect
                  data-testid="placement-shape"
                  x={placement.x}
                  y={placement.y}
                  width={dimensions.width}
                  height={dimensions.depth}
                  rx="1.2"
                  fill={invalid ? '#f9e5d8' : '#dfebe1'}
                  stroke={invalid ? '#ac5a35' : '#60836c'}
                  strokeWidth="0.55"
                />
                <text
                  pointerEvents="none"
                  x={placement.x + dimensions.width / 2}
                  y={placement.y + dimensions.depth / 2 - font / 2}
                  textAnchor="middle"
                  fontSize={font}
                  fill={invalid ? '#843c20' : '#294d39'}
                  fontWeight="600"
                >
                  {product.name.split(' ')[0]} · {index + 1}
                </text>
                <text
                  pointerEvents="none"
                  x={placement.x + dimensions.width / 2}
                  y={placement.y + dimensions.depth / 2 + font}
                  textAnchor="middle"
                  fontSize={font * 0.75}
                  fill={invalid ? '#843c20' : '#42614c'}
                >
                  {invalid
                    ? '⚠ 有異常'
                    : `${dimensions.width} × ${dimensions.depth}`}
                </text>
              </g>
            );
          })}
        </svg>
        {(!space || !placements.length) && (
          <div className="canvas-empty">
            <span className="empty-icon" aria-hidden="true">
              ▱
            </span>
            <h3>{space ? '空間準備好了' : '從一個空間開始'}</h3>
            <p>
              {space
                ? '從左側目錄放入商品，拖曳調整位置。'
                : '輸入寬、深、高，開始試擺收納品。'}
            </p>
          </div>
        )}
      </div>
      <div className="canvas-caption">
        <span>
          <i className="legend-dot" />
          收納空間邊界
        </span>
        <span>可拖到邊界外，系統會提示異常</span>
      </div>
      {space && (
        <p className="active-dimensions">
          目前空間：{space.width} × {space.depth} × {space.height} cm（寬 × 深 ×
          高）
        </p>
      )}
      {placements.length > 0 && (
        <div className="placement-list" aria-label="已放入商品">
          {placements.map((placement, index) => (
            <div
              className="placement-row"
              key={placement.instanceId}
              data-testid={`instance-row-${placement.instanceId}`}
            >
              <span className="instance-number">{index + 1}</span>
              <div>
                <strong>{productIndex.get(placement.productId)!.name}</strong>
                <small>
                  位置 {placement.x}, {placement.y} cm
                </small>
              </div>
              <button
                type="button"
                className="rotate-button"
                onClick={() => onRotate(placement.instanceId)}
                aria-label={`旋轉第 ${index + 1} 件`}
              >
                旋轉
              </button>
              <button
                type="button"
                className="remove-button"
                onClick={() => onRemove(placement.instanceId)}
                aria-label={`移除第 ${index + 1} 件`}
              >
                移除
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
