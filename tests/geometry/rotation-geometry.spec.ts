import { expect, test } from '@playwright/test';
import { productIndex } from '../../src/data/catalog';
import { effectiveDimensions } from '../../src/domain/rotation';
import { validateLayout } from '../../src/domain/validation';
import { rotationCases } from './rotation-cases';

test('旋轉只交換平面寬深，商品目錄及高度不變', () => {
  const product = productIndex.get('shuter-db-26')!;
  const placement = rotationCases[11].placements[0];
  expect(effectiveDimensions(product, placement)).toEqual({
    width: 37.05,
    depth: 51.7,
  });
  expect(product).toMatchObject({ width: 51.7, depth: 37.05, height: 18.55 });
});

for (const row of rotationCases) {
  test(row.id, () => {
    const result = validateLayout(row.space, row.placements);
    expect(result.status).toBe(row.status);
    expect(result.issues.map((issue) => issue.kind)).toEqual(row.issueKinds);
  });
}
