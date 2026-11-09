import { z } from 'zod';

export const productSchema = z.object({
  id: z.string().min(1),
  brand: z.string().min(1),
  name: z.string().min(1),
  width: z.number().positive().finite(),
  depth: z.number().positive().finite(),
  height: z.number().positive().finite(),
  sourceUrl: z.url(),
  note: z.string(),
  image: z.url(),
});

export const spaceSchema = z.object({
  width: z.number().int().min(1).max(999),
  depth: z.number().int().min(1).max(999),
  height: z.number().int().min(1).max(999),
});

export type Product = Readonly<z.infer<typeof productSchema>>;
export type Space = Readonly<z.infer<typeof spaceSchema>>;
export type Placement = Readonly<{
  instanceId: string;
  productId: string;
  x: number;
  y: number;
  rotated?: boolean;
}>;
export type LayoutState = Readonly<{
  space: Space | null;
  placements: readonly Placement[];
}>;

export const axisLabels = {
  width: '寬（左右，cm）',
  depth: '深（前後，cm）',
  height: '高（cm）',
} as const;
export type Axis = keyof Space;
export const axes = ['width', 'depth', 'height'] as const;

export function parseSpaceInput(value: string): number | null {
  const input = value.trim();
  if (!/^[0-9]+$/.test(input)) return null;
  const number = Number(input);
  return number >= 1 && number <= 999 ? number : null;
}
