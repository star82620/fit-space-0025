import { expect, test, type Page } from '@playwright/test';

const productName = 'KD-2619 巧拼收納箱';
const productId = 'shuter-kd-2619';

async function setup(page: Page, width: number, depth: number, height: number) {
  await page.goto('/');
  for (const [label, value] of [
    ['寬（左右，cm）', width],
    ['深（前後，cm）', depth],
    ['高（cm）', height],
  ] as const)
    await page.getByLabel(label, { exact: true }).fill(String(value));
  await page.getByRole('button', { name: '套用空間' }).click();
}
async function add(page: Page) {
  await page
    .getByRole('article', { name: productName, exact: true })
    .getByRole('button', { name: '放入配置' })
    .click();
}
const row = (page: Page, index: number) =>
  page.getByTestId(/^instance-row-/).nth(index);
const shape = (page: Page, index: number) =>
  page.getByTestId('placement-shape').nth(index);
const rotate = (page: Page, index: number) =>
  row(page, index)
    .getByRole('button', { name: `旋轉第 ${index + 1} 件` })
    .click();
const valid = (page: Page) =>
  page
    .getByRole('region', { name: '配置檢查結果' })
    .getByRole('heading', { name: '依所列尺寸，符合全部限制' });
const invalid = (page: Page) =>
  page
    .getByRole('region', { name: '配置檢查結果' })
    .getByRole('heading', { name: '不符合全部限制' });

test('旋轉兩次依序解除及恢復尺寸異常，左上角不變', async ({ page }) => {
  await setup(page, 20, 40, 26);
  await add(page);
  await expect(invalid(page)).toBeVisible();
  await expect(shape(page, 0)).toHaveAttribute('width', '38');
  await rotate(page, 0);
  await expect(valid(page)).toBeVisible();
  await expect(shape(page, 0)).toHaveAttribute('width', '19');
  await expect(shape(page, 0)).toHaveAttribute('height', '38');
  await expect(shape(page, 0)).toHaveAttribute('x', '0');
  await expect(shape(page, 0)).toHaveAttribute('y', '0');
  await rotate(page, 0);
  await expect(invalid(page)).toBeVisible();
  await expect(shape(page, 0)).toHaveAttribute('width', '38');
});

test('同商品兩件旋轉互不影響且保留目錄尺寸', async ({ page }) => {
  await setup(page, 100, 80, 40);
  await add(page);
  await add(page);
  await rotate(page, 1);
  await expect(shape(page, 0)).toHaveAttribute('width', '38');
  await expect(shape(page, 1)).toHaveAttribute('width', '19');
  await expect(row(page, 1)).toContainText('位置 0, 0 cm');
  await expect(
    page.getByRole('article', { name: productName, exact: true }),
  ).toContainText('38 × 19 × 26');
  await expect(invalid(page)).toBeVisible();
  await rotate(page, 1);
  await expect(shape(page, 1)).toHaveAttribute('width', '38');
});

test('旋轉造成越界仍保留，旋回即清除異常', async ({ page }) => {
  await setup(page, 38, 20, 26);
  await add(page);
  await expect(valid(page)).toBeVisible();
  await rotate(page, 0);
  await expect(invalid(page)).toBeVisible();
  await expect(row(page, 0)).toContainText('位置 0, 0 cm');
  await expect(shape(page, 0)).toHaveAttribute('height', '38');
  await expect(page.getByRole('list', { name: /^異常明細/ })).toContainText(
    '越界',
  );
  await rotate(page, 0);
  await expect(valid(page)).toBeVisible();
});

test('旋轉造成重疊仍保留兩件位置，旋回即解除', async ({ page }) => {
  await setup(page, 100, 80, 40);
  await add(page);
  await add(page);
  const boundary = await page.getByTestId('space-boundary').boundingBox();
  const second = await shape(page, 1).boundingBox();
  if (!boundary || !second) throw new Error('畫布未顯示');
  const ratio = boundary.width / 100;
  const grabX = Math.min(second.width / 4, 10);
  const grabY = Math.min(second.height / 4, 10);
  await page.mouse.move(second.x + grabX, second.y + grabY);
  await page.mouse.down();
  await page.mouse.move(boundary.x + grabX, boundary.y + 20 * ratio + grabY, {
    steps: 8,
  });
  await page.mouse.up();
  await expect(valid(page)).toBeVisible();
  const positions = await page.getByTestId(/^instance-row-/).allInnerTexts();
  await rotate(page, 0);
  await expect(invalid(page)).toBeVisible();
  await expect(page.getByRole('list', { name: /^異常明細/ })).toContainText(
    '重疊',
  );
  expect(await page.getByTestId(/^instance-row-/).allInnerTexts()).toEqual(
    positions,
  );
  await rotate(page, 0);
  await expect(valid(page)).toBeVisible();
});

test('旋轉後重新整理保留每件方向並重檢', async ({ page }) => {
  await setup(page, 100, 80, 40);
  await add(page);
  await add(page);
  await rotate(page, 1);
  await expect(invalid(page)).toBeVisible();
  await page.reload();
  await expect(shape(page, 0)).toHaveAttribute('width', '38');
  await expect(shape(page, 1)).toHaveAttribute('width', '19');
  await expect(invalid(page)).toBeVisible();
});

test('舊配置缺方向欄位可還原；非布林方向拒絕', async ({ page }) => {
  await page.goto('/');
  const state = {
    space: { width: 20, depth: 40, height: 26 },
    placements: [{ instanceId: 'legacy', productId, x: 0, y: 0 }],
  };
  await page.evaluate(
    (data) => localStorage.setItem('fit-space:layout:v1', JSON.stringify(data)),
    state,
  );
  await page.reload();
  await expect(shape(page, 0)).toHaveAttribute('width', '38');
  await expect(invalid(page)).toBeVisible();
  await page.evaluate(
    (data) => localStorage.setItem('fit-space:layout:v1', JSON.stringify(data)),
    { ...state, placements: [{ ...state.placements[0], rotated: 'true' }] },
  );
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('無法保存或讀取配置');
  await expect(
    page.getByRole('heading', { name: '尚未設定空間' }),
  ).toBeVisible();
  await expect(shape(page, 0)).toHaveCount(0);
});
