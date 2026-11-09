import { z } from 'zod';
import { productIndex } from '../data/catalog';
import {
  spaceSchema,
  type LayoutState,
  type Placement,
  type Space,
} from './models';
import { toUnits } from './precision';

export const emptyLayout: LayoutState = { space: null, placements: [] };
export const storageKey = 'fit-space:layout:v1';
export type LayoutAction =
  | { type: 'space'; space: Space }
  | { type: 'add'; placement: Placement }
  | { type: 'move'; instanceId: string; x: number; y: number }
  | { type: 'remove'; instanceId: string };

export function layoutReducer(
  state: LayoutState,
  action: LayoutAction,
): LayoutState {
  switch (action.type) {
    case 'space':
      return { ...state, space: action.space };
    case 'add':
      return { ...state, placements: [...state.placements, action.placement] };
    case 'move':
      return {
        ...state,
        placements: state.placements.map((p) =>
          p.instanceId === action.instanceId
            ? { ...p, x: action.x, y: action.y }
            : p,
        ),
      };
    case 'remove':
      return {
        ...state,
        placements: state.placements.filter(
          (p) => p.instanceId !== action.instanceId,
        ),
      };
  }
}

const coordinateSchema = z
  .number()
  .finite()
  .refine((value) => {
    try {
      toUnits(value);
      return true;
    } catch {
      return false;
    }
  });
const savedLayoutSchema = z
  .object({
    space: spaceSchema.nullable(),
    placements: z.array(
      z.object({
        instanceId: z.string().min(1),
        productId: z.string().refine((id) => productIndex.has(id)),
        x: coordinateSchema,
        y: coordinateSchema,
      }),
    ),
  })
  .refine(
    (state) =>
      (state.space !== null || state.placements.length === 0) &&
      new Set(state.placements.map((p) => p.instanceId)).size ===
        state.placements.length,
  );

export function restoreLayout(storage: Pick<Storage, 'getItem'>): {
  state: LayoutState;
  error: boolean;
} {
  try {
    const saved = storage.getItem(storageKey);
    if (saved === null) return { state: emptyLayout, error: false };
    return { state: savedLayoutSchema.parse(JSON.parse(saved)), error: false };
  } catch {
    return { state: emptyLayout, error: true };
  }
}

export function saveLayout(
  storage: Pick<Storage, 'setItem'>,
  state: LayoutState,
): boolean {
  try {
    storage.setItem(storageKey, JSON.stringify(savedLayoutSchema.parse(state)));
    return true;
  } catch {
    return false;
  }
}
