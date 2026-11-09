import { products } from '../data/catalog';

export const decimalPlaces = Math.max(
  ...products
    .flatMap((p) => [p.width, p.depth, p.height])
    .map((n) => String(n).split('.')[1]?.length ?? 0),
);
export const scale = 10 ** decimalPlaces;

/** Convert decimal text exactly before comparing dimensions. */
export function toUnits(value: number): number {
  if (!Number.isFinite(value)) throw new RangeError('尺寸必須是有限值');
  const text = String(value);
  if (!/^-?\d+(\.\d+)?$/.test(text)) throw new RangeError('尺寸無法精確表示');
  const [whole, fraction = ''] = text.replace('-', '').split('.');
  if (fraction.length > decimalPlaces)
    throw new RangeError('尺寸精度超出支援範圍');
  const units =
    (BigInt(whole) * BigInt(scale) +
      BigInt(fraction.padEnd(decimalPlaces, '0'))) *
    (value < 0 ? -1n : 1n);
  if (
    units > BigInt(Number.MAX_SAFE_INTEGER) ||
    units < BigInt(Number.MIN_SAFE_INTEGER)
  ) {
    throw new RangeError('尺寸超出安全範圍');
  }
  return Number(units);
}

export function safeAdd(a: number, b: number): number {
  const sum = a + b;
  if (!Number.isSafeInteger(sum)) throw new RangeError('邊界超出安全範圍');
  return sum;
}

export function quantize(value: number): number {
  const units = Math.round(value * scale);
  if (!Number.isSafeInteger(units)) throw new RangeError('位置超出安全範圍');
  return units / scale;
}

export function pointerToPosition(
  client: { x: number; y: number },
  origin: { x: number; y: number },
  pixelsPerCm: number,
  grab: { x: number; y: number },
) {
  if (!(pixelsPerCm > 0)) throw new RangeError('畫布比例無效');
  return {
    x: quantize((client.x - origin.x) / pixelsPerCm - grab.x),
    y: quantize((client.y - origin.y) / pixelsPerCm - grab.y),
  };
}
