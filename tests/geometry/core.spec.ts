import { test, expect } from '@playwright/test';
import { products } from '../../src/data/catalog';
import { parseSpaceInput } from '../../src/domain/models';
import {
  safeAdd,
  toUnits,
  pointerToPosition,
} from '../../src/domain/precision';
import { validateLayout } from '../../src/domain/validation';
import {
  emptyLayout,
  layoutReducer,
  restoreLayout,
  saveLayout,
  storageKey,
} from '../../src/domain/layout';
import { qualityCases } from './quality-cases';

test('商品資料為 23 個唯一 ID，保留原始小數', () => {
  expect(products).toHaveLength(23);
  expect(new Set(products.map((p) => p.id)).size).toBe(23);
  expect(products.find((p) => p.id === 'shuter-db-26')).toMatchObject({
    width: 51.7,
    depth: 37.05,
    height: 18.55,
  });
});
test('精確定點、負座標及安全範圍', () => {
  expect(toUnits(37.05)).toBe(3705);
  expect(toUnits(-0.01)).toBe(-1);
  expect(toUnits(18.55)).toBe(1855);
  for (const value of [NaN, Infinity, 1.001, Number.MAX_SAFE_INTEGER])
    expect(() => toUnits(value)).toThrow();
  expect(() => safeAdd(Number.MAX_SAFE_INTEGER, 1)).toThrow();
});
test('游標換算含偏移與抓取點，保留負座標', () => {
  expect(
    pointerToPosition({ x: 130, y: 240 }, { x: 100, y: 200 }, 2, {
      x: 5,
      y: 10,
    }),
  ).toEqual({ x: 10, y: 10 });
  expect(
    pointerToPosition({ x: 90, y: 190 }, { x: 100, y: 200 }, 2, { x: 0, y: 0 }),
  ).toEqual({ x: -5, y: -5 });
  expect(() =>
    pointerToPosition({ x: 1, y: 1 }, { x: 0, y: 0 }, 0, { x: 0, y: 0 }),
  ).toThrow();
});
test('輸入只接受 1～999 純數字並忽略前後空白', () => {
  for (const value of [
    '',
    '0',
    '-1',
    '1.5',
    '1.0',
    '1e2',
    'abc',
    '1000',
    'Infinity',
  ])
    expect(parseSpaceInput(value)).toBeNull();
  expect(parseSpaceInput('999')).toBe(999);
  expect(parseSpaceInput(' 100 ')).toBe(100);
  expect(parseSpaceInput('001')).toBe(1);
});
test('40 筆固定案例為 20 符合、20 不符合，重大誤判為 0', () => {
  expect(qualityCases).toHaveLength(40);
  expect(qualityCases.filter((c) => c.fits)).toHaveLength(20);
  const falsePositives = qualityCases.filter(
    (c) => !c.fits && validateLayout(c.space, c.placements).status === 'valid',
  );
  expect(falsePositives).toEqual([]);
});
for (const row of qualityCases) {
  test(`${row.id} ${row.fits ? '符合' : '不符合'}`, () => {
    expect(validateLayout(row.space, row.placements).status).toBe(
      row.fits ? 'valid' : 'invalid',
    );
  });
}
test('全部異常依放入順序、包含方向與重疊雙方，部分解除不誤判', () => {
  const row = qualityCases[38];
  const result = validateLayout(row.space, row.placements);
  expect(result.issues.filter((i) => i.kind === 'height')).toHaveLength(2);
  expect(
    result.issues.filter((i) => i.kind === 'boundary').map((i) => i.message),
  ).toEqual(['越界：右側', '越界：右側']);
  expect(result.issues.find((i) => i.kind === 'overlap')?.instanceIds).toEqual([
    'instance-1',
    'instance-2',
  ]);
  expect(result.issues.map((i) => i.instanceIds[0])).toEqual([
    'instance-1',
    'instance-1',
    'instance-1',
    'instance-2',
    'instance-2',
  ]);
  expect(
    validateLayout(
      qualityCases[39].space,
      qualityCases[39].placements,
    ).issues.map((i) => i.kind),
  ).toEqual(['height', 'height']);
});
test('缺少資料、壞座標、重複實例不得判符合', () => {
  const row = qualityCases[0];
  expect(validateLayout(null, row.placements).status).toBe('unconfigured');
  expect(
    validateLayout(row.space, [{ ...row.placements[0], productId: 'missing' }])
      .status,
  ).toBe('invalid');
  expect(
    validateLayout(row.space, [{ ...row.placements[0], x: NaN }]).status,
  ).toBe('invalid');
  expect(
    validateLayout(row.space, [row.placements[0], row.placements[0]]).status,
  ).toBe('invalid');
});
test('同款不同實例可移動、移除，其他實例與目錄不變', () => {
  const original = JSON.stringify(products);
  const row = qualityCases[14];
  let state = layoutReducer(emptyLayout, { type: 'space', space: row.space });
  for (const placement of row.placements)
    state = layoutReducer(state, { type: 'add', placement });
  const first = state.placements[0];
  state = layoutReducer(state, {
    type: 'move',
    instanceId: 'instance-2',
    x: -5,
    y: 4,
  });
  expect(state.placements[0]).toBe(first);
  expect(state.placements[1].x).toBe(-5);
  state = layoutReducer(state, { type: 'remove', instanceId: 'instance-2' });
  expect(state.placements).toEqual([first]);
  expect(JSON.stringify(products)).toBe(original);
});
test('保存及恢復、損毀／未知商品／讀寫失敗均受控', () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const state = {
    space: qualityCases[0].space,
    placements: qualityCases[0].placements,
  };
  expect(saveLayout(storage, state)).toBe(true);
  expect(restoreLayout(storage)).toEqual({ state, error: false });
  for (const saved of [
    'bad json',
    '{}',
    JSON.stringify({
      ...state,
      placements: [{ ...state.placements[0], productId: 'missing' }],
    }),
    JSON.stringify({
      ...state,
      placements: [state.placements[0], state.placements[0]],
    }),
  ]) {
    values.set(storageKey, saved);
    expect(restoreLayout(storage)).toEqual({ state: emptyLayout, error: true });
  }
  expect(
    restoreLayout({
      getItem: () => {
        throw new Error('blocked');
      },
    }).state,
  ).toEqual(emptyLayout);
  expect(
    saveLayout(
      {
        setItem: () => {
          throw new Error('blocked');
        },
      },
      state,
    ),
  ).toBe(false);
});
