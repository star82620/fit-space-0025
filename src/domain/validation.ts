import { productIndex } from '../data/catalog';
import {
  spaceSchema,
  type Placement,
  type Product,
  type Space,
} from './models';
import { safeAdd, toUnits } from './precision';
import { effectiveDimensions } from './rotation';

export type Issue = Readonly<{
  kind: 'size' | 'boundary' | 'height' | 'overlap' | 'data';
  instanceIds: readonly string[];
  message: string;
}>;
export type Validation = {
  status: 'unconfigured' | 'empty' | 'valid' | 'invalid';
  issues: Issue[];
};

export function validateLayout(
  space: Space | null,
  placements: readonly Placement[],
  catalog: ReadonlyMap<string, Product> = productIndex,
): Validation {
  if (!space || !spaceSchema.safeParse(space).success)
    return { status: 'unconfigured', issues: [] };
  if (!placements.length) return { status: 'empty', issues: [] };
  const issues: Issue[] = [];
  const rectangles: {
    placement: Placement;
    x: number;
    y: number;
    right: number;
    back: number;
  }[] = [];
  const [width, depth, height] = [space.width, space.depth, space.height].map(
    toUnits,
  );
  const seen = new Set<string>();
  for (const placement of placements) {
    const product = catalog.get(placement.productId);
    const ids = [placement.instanceId];
    try {
      if (!product || seen.has(placement.instanceId))
        throw new Error('商品或實例資料無效');
      if (
        placement.rotated !== undefined &&
        typeof placement.rotated !== 'boolean'
      )
        throw new Error('旋轉狀態無效');
      seen.add(placement.instanceId);
      const dimensions = effectiveDimensions(product, placement);
      const [w, d, h, x, y] = [
        dimensions.width,
        dimensions.depth,
        product.height,
        placement.x,
        placement.y,
      ].map(toUnits);
      if (w <= 0 || d <= 0 || h <= 0) throw new Error('商品尺寸無效');
      const right = safeAdd(x, w);
      const back = safeAdd(y, d);
      if (w > width || d > depth)
        issues.push({
          kind: 'size',
          instanceIds: ids,
          message: '尺寸超限：商品寬或深超過空間',
        });
      const sides = [
        x < 0 && '左側',
        right > width && '右側',
        y < 0 && '前側',
        back > depth && '後側',
      ].filter(Boolean);
      if (sides.length)
        issues.push({
          kind: 'boundary',
          instanceIds: ids,
          message: `越界：${sides.join('、')}`,
        });
      if (h > height)
        issues.push({
          kind: 'height',
          instanceIds: ids,
          message: `高度超限：${product.height} cm > ${space.height} cm`,
        });
      rectangles.push({ placement, x, y, right, back });
    } catch {
      issues.push({
        kind: 'data',
        instanceIds: ids,
        message: '資料無法判讀，無法確認符合限制',
      });
    }
  }
  for (let i = 0; i < rectangles.length; i++) {
    for (let j = i + 1; j < rectangles.length; j++) {
      const a = rectangles[i];
      const b = rectangles[j];
      if (a.x < b.right && a.right > b.x && a.y < b.back && a.back > b.y) {
        issues.push({
          kind: 'overlap',
          instanceIds: [a.placement.instanceId, b.placement.instanceId],
          message: '重疊：兩件商品的平面範圍相交',
        });
      }
    }
  }
  const order = new Map(placements.map((p, index) => [p.instanceId, index]));
  issues.sort(
    (a, b) =>
      (order.get(a.instanceIds[0]) ?? 0) - (order.get(b.instanceIds[0]) ?? 0),
  );
  return { status: issues.length ? 'invalid' : 'valid', issues };
}
