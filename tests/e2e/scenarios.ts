import type { Browser, BrowserContext, Locator, Page } from '@playwright/test';
type Item = {
  id: string;
  name: string;
  width: number;
  depth: number;
  height: number;
  sourceUrl: string;
  note: string;
};
type Options = {
  origin: string;
  catalog: readonly Item[];
  evidenceDir?: string;
};
export const caseIds = Array.from(
  { length: 18 },
  (_, i) => `E2E-${String(i + 1).padStart(3, '0')}`,
);
export async function runScenario(
  browser: Browser,
  id: string,
  options: Options,
) {
  const result = {
    screenshots: [] as string[],
    observations: [] as string[],
    consoleErrors: [] as string[],
    networkFailures: [] as string[],
  };
  const contexts: BrowserContext[] = [];
  const labels = ['寬（左右，cm）', '深（前後，cm）', '高（cm）'];
  const K = 'KD-2619 巧拼收納箱',
    D = 'DB-26 大房子整理盒';
  function check(value: unknown, message: string): asserts value {
    if (!value) throw new Error(message);
  }
  async function fresh() {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    contexts.push(context);
    const page = await context.newPage();
    page.on('pageerror', (e) => result.consoleErrors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') result.consoleErrors.push(m.text());
    });
    page.on('requestfailed', (r) =>
      result.networkFailures.push(`${r.url()} ${r.failure()?.errorText}`),
    );
    await page.goto(options.origin, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: '先試著擺，再決定。' }).waitFor();
    return page;
  }
  async function shot(page: Page, suffix: string, locator?: Locator) {
    if (!options.evidenceDir) return;
    const path = `${options.evidenceDir}/${id}-${suffix}.png`;
    if (locator) await locator.screenshot({ path });
    else await page.screenshot({ path, fullPage: true });
    result.screenshots.push(path);
  }
  async function setup(page: Page, dims = [100, 80, 40]) {
    for (let i = 0; i < 3; i++)
      await page.getByLabel(labels[i], { exact: true }).fill(String(dims[i]));
    await page.getByRole('button', { name: '套用空間', exact: true }).click();
    await page
      .locator('.active-dimensions')
      .filter({ hasText: dims.join(' × ') })
      .waitFor();
  }
  const card = (p: Page, name: string) =>
    p.getByRole('article', { name, exact: true });
  const rows = (p: Page) => p.getByTestId(/^instance-row-/);
  const placed = (p: Page) =>
    p
      .getByTestId(/^placement-/)
      .filter({ has: p.getByTestId('placement-shape') });
  async function add(p: Page, name = K) {
    await card(p, name).getByRole('button', { name: '放入配置' }).click();
  }
  async function status(p: Page, fits: boolean) {
    const title = fits ? '依所列尺寸，符合全部限制' : '不符合全部限制';
    await p
      .getByRole('region', { name: '配置檢查結果', exact: true })
      .getByRole('heading', { name: title, exact: true })
      .waitFor();
    result.observations.push(title);
  }
  async function details(p: Page) {
    return await p.getByRole('list', { name: /^異常明細/ }).innerText();
  }
  const lastPositions = new Map<number, string>();
  async function move(p: Page, i: number, x: number, y: number) {
    await p
      .getByRole('group', { name: '收納配置區', exact: true })
      .scrollIntoViewIfNeeded();
    const boundary = await p.getByTestId('space-boundary').boundingBox();
    const shape = await placed(p)
      .nth(i)
      .getByTestId('placement-shape')
      .boundingBox();
    check(boundary && shape, '商品或空間邊框不可見');
    const width = Number(
      (await p.locator('.active-dimensions').innerText()).match(
        /目前空間：(\d+)/,
      )?.[1],
    );
    const ratio = boundary.width / width,
      gx = Math.min(shape.width / 4, 10),
      gy = Math.min(shape.height / 4, 10);
    await p.mouse.move(shape.x + gx, shape.y + gy);
    await p.mouse.down();
    await p.mouse.move(
      boundary.x + x * ratio + gx,
      boundary.y + y * ratio + gy,
      { steps: 8 },
    );
    await p.mouse.up();
    const text = await rows(p).nth(i).innerText(),
      pos = text.match(/位置 (-?[\d.]+), (-?[\d.]+) cm/);
    check(
      pos &&
        Math.abs(Number(pos[1]) - x) <= 1 &&
        Math.abs(Number(pos[2]) - y) <= 1,
      `商品未保留目標 (${x},${y})：${text}`,
    );
    lastPositions.set(i, text);
    result.observations.push(`第 ${i + 1} 件位置 ${pos[1]}, ${pos[2]} cm`);
  }
  try {
    let p = await fresh();
    switch (id) {
      case 'E2E-001': {
        for (const label of labels)
          check(
            await p.getByLabel(label, { exact: true }).isVisible(),
            `${label} 不可見`,
          );
        const text = await p
          .getByRole('region', { name: '配置檢查結果', exact: true })
          .innerText();
        check(!text.includes('依所列尺寸，符合全部限制'), text);
        result.observations.push(text);
        await shot(p, 'initial');
        break;
      }
      case 'E2E-002':
        await setup(p);
        result.observations.push(
          await p.locator('.active-dimensions').innerText(),
        );
        await shot(p, 'space');
        break;
      case 'E2E-003': {
        await p.getByLabel(labels[0], { exact: true }).fill('0');
        check(
          (await p.locator('#width-error').count()) === 0,
          '輸入中出現錯誤',
        );
        await shot(p, 'typing');
        await p.getByLabel(labels[0], { exact: true }).press('Tab');
        await p.locator('#width-error').waitFor();
        await shot(p, 'blur');
        for (let axis = 0; axis < 3; axis++)
          for (const value of ['', '0', '-1', '1.5', '1e2', 'abc', '1000']) {
            p = await fresh();
            for (let i = 0; i < 3; i++)
              await p
                .getByLabel(labels[i], { exact: true })
                .fill(i === axis ? value : String([100, 80, 40][i]));
            await p
              .getByRole('button', { name: '套用空間', exact: true })
              .click();
            check(
              (await p
                .getByLabel(labels[axis], { exact: true })
                .getAttribute('aria-invalid')) === 'true',
              `${labels[axis]} ${value} 未拒絕`,
            );
            check(
              (await p.locator('.active-dimensions').count()) === 0,
              '無效值建立有效空間',
            );
            check(
              !(
                await p
                  .getByRole('region', { name: '配置檢查結果', exact: true })
                  .innerText()
              ).includes('依所列尺寸，符合全部限制'),
              '無效輸入產生符合判定',
            );
            result.observations.push(
              `${labels[axis]}=${JSON.stringify(value)}：拒絕，無有效空間`,
            );
          }
        await shot(p, 'rejected');
        p = await fresh();
        await setup(p, [999, 999, 999]);
        result.observations.push('999 上限接受');
        await shot(p, 'upper-limit');
        break;
      }
      case 'E2E-004': {
        for (const dims of [
          [100, 80, 40],
          [20, 20, 20],
        ]) {
          await setup(p, dims);
          check(
            (await p.getByRole('article').count()) === 23,
            '商品數量不是 23',
          );
          for (const item of options.catalog) {
            const a = card(p, item.name),
              text = await a.innerText();
            check(
              text.includes(`${item.width} × ${item.depth} × ${item.height}`) &&
                text.includes('樹德 SHUTER'),
              `${item.name} 尺寸或品牌錯誤`,
            );
            check(
              (await a
                .getByRole('link', { name: /規格來源/ })
                .getAttribute('href')) === item.sourceUrl,
              '來源錯誤',
            );
            check(
              await a.getByRole('button', { name: '放入配置' }).isEnabled(),
              '商品被自動篩掉',
            );
          }
          await card(p, D).scrollIntoViewIfNeeded();
          await shot(p, `catalog-${dims[0]}`);
          result.observations.push(
            `${dims.join(' × ')}：逐筆核對 23 筆名稱、品牌、尺寸、來源與可選狀態一致`,
          );
          p = await fresh();
        }
        break;
      }
      case 'E2E-005': {
        for (const item of options.catalog.filter((item) =>
          ['shuter-db-2621', 'shuter-db-26', 'shuter-fb-5336dr'].includes(
            item.id,
          ),
        )) {
          const a = card(p, item.name);
          await a.scrollIntoViewIfNeeded();
          check((await a.innerText()).includes(item.note), '備註不一致');
          result.observations.push(`${item.name}：${item.note}`);
          await shot(p, item.id, a);
        }
        break;
      }
      case 'E2E-006':
        await setup(p);
        await add(p);
        await status(p, true);
        await shot(p, 'added');
        await move(p, 0, 10, 10);
        await status(p, true);
        check(
          (await rows(p).count()) === 1 &&
            (await p.getByRole('list', { name: /^異常明細/ }).count()) === 0,
          '商品數量或自身碰撞錯誤',
        );
        await shot(p, 'moved');
        break;
      case 'E2E-007':
        await setup(p);
        await add(p);
        await move(p, 0, 10, 10);
        await add(p);
        await move(p, 1, 20, 10);
        await status(p, false);
        check(
          (await details(p)).includes('重疊') && (await rows(p).count()) === 2,
          '重疊未保留',
        );
        await shot(p, 'overlap');
        await move(p, 1, 55, 10);
        await status(p, true);
        check(
          (await rows(p).nth(0).innerText()) === lastPositions.get(0),
          '第一件位置改變',
        );
        check(
          (await card(p, K).innerText()).includes('38 × 19 × 26'),
          '商品資料被修改',
        );
        await shot(p, 'resolved');
        break;
      case 'E2E-008':
        await setup(p, [20, 40, 40]);
        await add(p);
        await status(p, false);
        check(
          (await p.getByRole('button', { name: /旋轉/ }).count()) === 0,
          '出現旋轉控制',
        );
        check(
          (await p.getByTestId('placement-shape').getAttribute('width')) ===
            '38' &&
            (await p.getByTestId('placement-shape').getAttribute('height')) ===
              '19',
          '商品被旋轉',
        );
        await move(p, 0, 2, 5);
        await status(p, false);
        await shot(p, 'fixed-direction');
        break;
      case 'E2E-009':
        await setup(p, [100, 37, 40]);
        await add(p, D);
        await status(p, false);
        check(
          (await details(p)).includes('尺寸超限') &&
            (await rows(p).count()) === 1,
          '小數被取整或商品被阻止',
        );
        await shot(p, 'decimal-depth');
        break;
      case 'E2E-010': {
        for (const [direction, x, y] of [
          ['右側', 70, 10],
          ['左側', -5, 10],
          ['後側', 10, 70],
          ['前側', 10, -5],
        ] as const) {
          p = await fresh();
          await setup(p);
          await add(p);
          await move(p, 0, x, y);
          await status(p, false);
          check(
            (await details(p)).includes(`越界：${direction}`),
            `缺少越界 ${direction}`,
          );
          await shot(p, direction);
          await move(p, 0, 10, 10);
          await status(p, true);
        }
        await shot(p, 'returned');
        break;
      }
      case 'E2E-011':
        await setup(p, [38, 19, 26]);
        await add(p);
        await status(p, true);
        check(
          (await p.getByRole('list', { name: /^異常明細/ }).count()) === 0,
          '合法貼齊誤報',
        );
        await shot(p, 'flush');
        break;
      case 'E2E-012':
        await setup(p, [100, 80, 25]);
        await add(p);
        await move(p, 0, 10, 10);
        await status(p, false);
        check(
          (await details(p)).includes('高度超限：26 cm > 25 cm'),
          '移動消除高度限制',
        );
        await shot(p, 'height');
        break;
      case 'E2E-013':
      case 'E2E-015': {
        await setup(p, [100, 80, 25]);
        await add(p);
        await move(p, 0, 65, 10);
        await add(p);
        await move(p, 1, 66, 10);
        await status(p, false);
        const text = await details(p);
        check(
          (text.match(/高度超限/g) ?? []).length === 2 &&
            (text.match(/越界：右側/g) ?? []).length === 2 &&
            text.includes('重疊'),
          '多項異常未列全',
        );
        const items = await p
          .getByRole('list', { name: /^異常明細/ })
          .getByRole('listitem')
          .allTextContents();
        check(
          items.slice(0, 3).every((t) => t.includes('第 1 件')) &&
            items.slice(3).every((t) => t.includes('第 2 件')),
          '未依放入順序排序',
        );
        check(
          text.includes('第 1 件') &&
            text.includes('第 2 件') &&
            (await placed(p).filter({ hasText: '有異常' }).count()) === 2,
          '缺少雙方名稱或文字標記',
        );
        check(
          (
            await p
              .getByTestId('placement-shape')
              .evaluateAll((es) => es.map((e) => e.getAttribute('fill')))
          ).every((c) => c === '#f9e5d8'),
          '缺少異常醒目樣式',
        );
        result.observations.push(text);
        await shot(p, 'all-issues');
        // 先移開上層實例，避免拖曳被它攔截；最後仍放到案例指定位置。
        await move(p, 1, 55, 50);
        await move(p, 0, 5, 10);
        await move(p, 1, 55, 10);
        await status(p, false);
        const rest = await details(p);
        check(
          !rest.includes('越界') &&
            !rest.includes('重疊') &&
            (rest.match(/高度超限/g) ?? []).length === 2,
          '部分解除結果錯誤',
        );
        result.observations.push(rest);
        await shot(p, 'remaining');
        break;
      }
      case 'E2E-014':
        await setup(p);
        await add(p);
        await move(p, 0, 10, 10);
        await status(p, true);
        await p.getByLabel(labels[2], { exact: true }).fill('0');
        await p.getByLabel(labels[2], { exact: true }).press('Tab');
        await p.locator('#height-error').waitFor();
        check(
          (await p.getByText(/仍使用上一次的有效空間/).innerText()).includes(
            '100 × 80 × 40',
          ),
          '未標舊空間',
        );
        check(
          (await rows(p).nth(0).innerText()) === lastPositions.get(0),
          '無效編輯影響配置',
        );
        await status(p, true);
        await shot(p, 'previous-space');
        await p.getByLabel(labels[2], { exact: true }).fill('25');
        await p.getByRole('button', { name: '套用空間', exact: true }).click();
        await status(p, false);
        check((await details(p)).includes('高度超限'), '新空間未重檢');
        await shot(p, 'new-space');
        break;
      case 'E2E-016':
        await setup(p);
        await add(p);
        await move(p, 0, 10, 10);
        await add(p);
        await move(p, 1, 20, 10);
        await status(p, false);
        await shot(p, 'before-remove');
        await rows(p)
          .nth(1)
          .getByRole('button', { name: '移除第 2 件', exact: true })
          .click();
        check(
          (await rows(p).count()) === 1 &&
            (await rows(p).nth(0).innerText()) === lastPositions.get(0),
          '移除影響其他實例',
        );
        await status(p, true);
        check((await card(p, K).count()) === 1, '移除改變目錄');
        await shot(p, 'removed');
        break;
      case 'E2E-017': {
        let fallback = 0;
        for (const item of options.catalog) {
          const a = card(p, item.name);
          await a.scrollIntoViewIfNeeded();
          check(
            (await a.locator('img, [role="img"]').count()) === 1 &&
              (await a.innerText()).includes(
                `${item.width} × ${item.depth} × ${item.height}`,
              ),
            '圖片或尺寸缺漏',
          );
          fallback += await a.locator('.image-fallback').count();
        }
        await card(p, D).scrollIntoViewIfNeeded();
        await shot(p, 'images');
        await p
          .getByText('本專案為課程作業練習，商品資料與圖片版權屬樹德', {
            exact: true,
          })
          .scrollIntoViewIfNeeded();
        await shot(p, 'notice');
        result.observations.push(
          `23 筆圖片區完整；觀察時 ${fallback} 筆替代圖示；版權聲明可見`,
        );
        break;
      }
      case 'E2E-018': {
        await setup(p);
        await add(p);
        await move(p, 0, 10, 10);
        await add(p);
        await move(p, 1, 55, 10);
        await status(p, true);
        const before = await rows(p).allTextContents();
        await shot(p, 'before-reload');
        await p.reload({ waitUntil: 'domcontentloaded' });
        await p.locator('.active-dimensions').waitFor();
        check(
          (await p.locator('.active-dimensions').innerText()).includes(
            '100 × 80 × 40',
          ) &&
            JSON.stringify(await rows(p).allTextContents()) ===
              JSON.stringify(before),
          '未恢復相同配置',
        );
        await status(p, true);
        await shot(p, 'restored');
        break;
      }
      default:
        throw new Error(`未知案例 ${id}`);
    }
    check(
      result.consoleErrors.filter(
        (t) =>
          !t.includes('Failed to load resource') && !t.includes('net::ERR_'),
      ).length === 0,
      `瀏覽器錯誤：${result.consoleErrors.join(';')}`,
    );
    check(
      result.networkFailures.filter((t) => t.startsWith(options.origin))
        .length === 0,
      '應用程式資源失敗',
    );
    return result;
  } finally {
    for (const context of contexts) await context.close();
  }
}
