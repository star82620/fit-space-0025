import { test, expect } from '@playwright/test';
import { products } from '../../src/data/catalog';
import { caseIds, runScenario } from './scenarios';
for (const id of caseIds) {
  test(id, async ({ browser, baseURL }) => {
    test.setTimeout(id === 'E2E-003' ? 120_000 : 60_000);
    await runScenario(browser, id, { origin: baseURL!, catalog: products });
  });
}
test('圖片失敗不影響商品與放入操作', async ({ page }) => {
  await page.route('https://www.shuter.com.tw/**', (route) => route.abort());
  await page.goto('/');
  const card = page.getByRole('article', {
    name: 'KD-2619 巧拼收納箱',
    exact: true,
  });
  await card.scrollIntoViewIfNeeded();
  await expect(
    card.getByRole('img', {
      name: 'KD-2619 巧拼收納箱 圖片暫無法顯示',
      exact: true,
    }),
  ).toBeVisible();
  await expect(card).toContainText('38 × 19 × 26');
  for (const [label, value] of [
    ['寬（左右，cm）', '100'],
    ['深（前後，cm）', '80'],
    ['高（cm）', '40'],
  ])
    await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByRole('button', { name: '套用空間', exact: true }).click();
  await card.getByRole('button', { name: '放入配置' }).click();
  await expect(
    page.getByRole('heading', {
      name: '依所列尺寸，符合全部限制',
      exact: true,
    }),
  ).toBeVisible();
});
