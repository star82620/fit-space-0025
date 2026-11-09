import { expect, test } from '@playwright/test';
import {
  emptyLayout,
  layoutReducer,
  restoreLayout,
  saveLayout,
  storageKey,
} from '../../src/domain/layout';
import type { Placement } from '../../src/domain/models';

const first: Placement = {
  instanceId: 'first',
  productId: 'shuter-kd-2619',
  x: 5,
  y: 7,
};
const second: Placement = {
  instanceId: 'second',
  productId: 'shuter-kd-2619',
  x: 20,
  y: 30,
};
const space = { width: 100, depth: 80, height: 40 };

test('旋轉只切換指定實例，兩次還原且座標不變', () => {
  const original = { space, placements: [first, second] };
  const once = layoutReducer(original, {
    type: 'rotate',
    instanceId: 'second',
  });
  expect(once.placements[0]).toBe(first);
  expect(once.placements[1]).toEqual({ ...second, rotated: true });
  const twice = layoutReducer(once, { type: 'rotate', instanceId: 'second' });
  expect(twice.placements[0]).toBe(first);
  expect(twice.placements[1]).toEqual({ ...second, rotated: false });
});

test('本機配置保留旋轉，舊資料與無效方向分別還原或拒絕', () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const rotated = { space, placements: [{ ...first, rotated: true }, second] };
  expect(saveLayout(storage, rotated)).toBe(true);
  expect(restoreLayout(storage)).toEqual({ state: rotated, error: false });
  values.set(
    storageKey,
    JSON.stringify({ space, placements: [first, second] }),
  );
  expect(restoreLayout(storage)).toEqual({
    state: { space, placements: [first, second] },
    error: false,
  });
  values.set(
    storageKey,
    JSON.stringify({ space, placements: [{ ...first, rotated: 'true' }] }),
  );
  expect(restoreLayout(storage)).toEqual({ state: emptyLayout, error: true });
});
