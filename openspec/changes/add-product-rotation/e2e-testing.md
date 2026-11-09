# E2E Testing Checklist｜商品手動旋轉

## Test Setup

- **Start URL / route:** `/`；以 `npm run dev -- --port 5173` 啟動時為 `http://127.0.0.1:5173/`。
- **Viewport(s):** 桌面 1440 × 900；本次沒有新增響應式規格。
- **Test data / accounts:** 靜態目錄中的 `KD-2619 巧拼收納箱`（38 × 19 × 26 cm）與 `DB-26 大房子整理盒`；不需帳號。
- **Prerequisites:** npm 依賴已安裝、Vite 已啟動；每案使用新瀏覽器 context 或先清除 `fit-space:layout:v1`。以 Playwright MCP 操作瀏覽器；新增的「旋轉」控制需有可辨識的按鈕名稱，並能在對應的「已放入商品」實例列中定位。旋轉專用固定案例另由 `npm run test:geometry` 驗證；以下均為待執行清單。

## 1. 手動切換與實例隔離

- [x] E2E-001 原方向不自動改變，按鈕逐次切換
  - **Priority:** Critical
  - **Prerequisites:** 空白配置。
  - **Steps:**
    1. 在「寬（左右，cm）」「深（前後，cm）」「高（cm）」依序輸入 20、40、26，按「套用空間」。
    2. 在 `KD-2619 巧拼收納箱` 商品卡按「放入配置」。
    3. 確認第 1 件商品的「旋轉」按鈕可見，記錄其位置與畫布矩形寬深。
    4. 按該件「旋轉」一次，再按一次；每次讀取「配置檢查結果」與畫布矩形。
  - **Expected results:**
    1. 初始仍是 38 × 19 cm，顯示「不符合全部限制」與尺寸超限；不自動旋轉或提出方向建議。
    2. 第一次後矩形為 19 × 38 cm、左上角仍為 0, 0 cm，顯示「依所列尺寸，符合全部限制」。
    3. 第二次後回到 38 × 19 cm、左上角不變，再次顯示不符合；高度仍依原商品 26 cm 判定。
  - **Evidence:** 三個狀態的畫布與檢查結果截圖；記錄第 1 件商品列位置文字及可見按鈕；確認無頁面錯誤。
  - **Last run:** `2026-11-09 23:26 Asia/Taipei` — PASS
  - **Screenshot evidence:** [原方向](e2e-evidence/E2E-001-original.png)、[旋轉後](e2e-evidence/E2E-001-rotated.png)、[旋回](e2e-evidence/E2E-001-restored.png)
  - **Observed evidence:** 矩形寬深依序為 38 × 19、19 × 38、38 × 19 cm；左上角始終 (0, 0)，結果依序不符合、符合、不符合。
  - **Cleanup:** 關閉此 context。

- [x] E2E-002 同商品兩件各自旋轉且不改商品目錄
  - **Priority:** High
  - **Prerequisites:** 空白配置。
  - **Steps:**
    1. 設定空間 100 × 80 × 40 cm，從 `KD-2619 巧拼收納箱` 商品卡連按兩次「放入配置」。
    2. 在「已放入商品」中，僅按第 2 件的「旋轉」。
    3. 比較兩件的畫布矩形、位置文字及商品卡所列原始尺寸，再對第 2 件再按一次。
  - **Expected results:**
    1. 第一次只讓第 2 件從 38 × 19 cm 變為 19 × 38 cm；兩件左上角位置與第 1 件方向不變，商品卡仍列原始尺寸。
    2. 第二次只讓第 2 件恢復 38 × 19 cm；因兩件都在原點而重疊，整體始終不符合。
  - **Evidence:** 兩件實例列、畫布與商品卡截圖，記錄重疊提示。
  - **Last run:** `2026-11-09 23:26 Asia/Taipei` — PASS
  - **Screenshot evidence:** [第二件旋轉後](e2e-evidence/E2E-002-one-rotated.png)、[商品卡](e2e-evidence/E2E-002-catalog.png)、[第二件旋回](e2e-evidence/E2E-002-restored.png)
  - **Observed evidence:** 第一件保持 38 × 19 cm，第二件 19 × 38 cm 後恢復 38 × 19 cm；目錄仍為 38 × 19 × 26 cm；兩件位置 (0, 0)，重疊提示保留。
  - **Cleanup:** 關閉此 context。

## 2. 旋轉後重檢與保留位置

- [x] E2E-003 越界後保留旋轉結果，再旋回解除異常
  - **Priority:** Critical
  - **Prerequisites:** 空白配置。
  - **Steps:**
    1. 設定空間 38 × 20 × 26 cm，放入一件 `KD-2619 巧拼收納箱`；記錄其位置與畫布矩形。
    2. 按第 1 件「旋轉」，查看「配置檢查結果」與畫布。
    3. 再按一次「旋轉」。
  - **Expected results:**
    1. 初始 38 × 19 cm 符合，邊緣貼齊合法。
    2. 第一次後為 19 × 38 cm，左上角仍 0, 0 cm，商品保留並顯示尺寸／越界異常，整體不符合。
    3. 第二次後恢復原方向，異常自動解除，整體重新顯示符合。
  - **Evidence:** 三個狀態的畫布與結果截圖，包含異常明細；確認無頁面錯誤。
  - **Last run:** `2026-11-09 23:26 Asia/Taipei` — PASS
  - **Screenshot evidence:** [原方向符合](e2e-evidence/E2E-003-valid.png)、[轉向越界](e2e-evidence/E2E-003-outside.png)、[旋回解除](e2e-evidence/E2E-003-resolved.png)
  - **Observed evidence:** 旋轉後左上角仍 (0, 0)，出現尺寸超限與後側越界；旋回後自動顯示符合。
  - **Cleanup:** 關閉此 context。

- [x] E2E-004 旋轉後重疊，仍可繼續移動或旋轉
  - **Priority:** High
  - **Prerequisites:** 空白配置。
  - **Steps:**
    1. 設定空間 100 × 80 × 40 cm，放入兩件 `KD-2619 巧拼收納箱`。
    2. 在畫布拖曳第 2 件，使左上角約在 (0, 19) cm，確認兩件僅邊緣貼齊。
    3. 按第 1 件「旋轉」，再按一次旋回。
  - **Expected results:**
    1. 貼齊時無重疊提示且整體符合。
    2. 第一次旋轉後第 1 件深度增至 38 cm，與第 2 件重疊；兩件位置均保留，立即提示重疊，整體不符合。
    3. 旋回後重疊提示消失，整體重新符合；操作期間沒有阻止旋轉或自動移位。
  - **Evidence:** 貼齊、重疊與旋回後的畫布及異常明細截圖；記錄兩件位置文字。
  - **Last run:** `2026-11-09 23:27 Asia/Taipei` — PASS
  - **Screenshot evidence:** [邊緣貼齊](e2e-evidence/E2E-004-touching.png)、[旋轉後重疊](e2e-evidence/E2E-004-overlap.png)、[旋回解除](e2e-evidence/E2E-004-resolved.png)
  - **Observed evidence:** 拖曳後第二件左上角精確為 (0, 19) cm；第一件旋轉後重疊，旋回後解除；兩件座標均保留。
  - **Cleanup:** 關閉此 context。

## 3. 本機保存與相容性

- [x] E2E-005 重新整理後保留各件旋轉狀態
  - **Priority:** Critical
  - **Prerequisites:** 空白配置。
  - **Steps:**
    1. 設定空間 100 × 80 × 40 cm，放入兩件 `KD-2619 巧拼收納箱`，只旋轉第 2 件，記錄兩件位置及畫布形狀。
    2. 重新整理 `/`，比較空間、兩件方向、位置與「配置檢查結果」。
  - **Expected results:**
    1. 空間與兩件商品都恢復；第 1 件維持 38 × 19 cm，第 2 件維持 19 × 38 cm，位置與重新整理前相同。
    2. 因兩件仍在原點而重疊，重新整理前後都顯示不符合；不會因恢復資料而錯誤放行。
  - **Evidence:** 重新整理前後的畫布與結果截圖；確認無頁面錯誤。
  - **Last run:** `2026-11-09 23:27 Asia/Taipei` — PASS
  - **Screenshot evidence:** [重新整理前](e2e-evidence/E2E-005-before-reload.png)、[重新整理後](e2e-evidence/E2E-005-after-reload.png)
  - **Observed evidence:** 前後空間均為 100 × 80 × 40 cm，兩件寬分別為 38、19 cm，座標與重疊判定相同。
  - **Cleanup:** 關閉此 context。

- [x] E2E-006 舊資料缺方向欄位與無效方向資料
  - **Priority:** High
  - **Prerequisites:** 測試者可在載入頁面前，於相同 origin 的 `localStorage` 寫入 `fit-space:layout:v1`；兩種資料各用獨立 context。
  - **Steps:**
    1. 寫入舊版有效配置：空間 20 × 40 × 26 cm，一件 `KD-2619` 位於 (0, 0) cm，實例沒有 `rotated` 欄位；開啟或重新整理 `/`。
    2. 記錄畫布與檢查結果後，在另一個 context 寫入相同資料，但令 `rotated` 為字串 `"true"`；開啟或重新整理 `/`。
  - **Expected results:**
    1. 舊版資料恢復空間與商品，商品仍為原方向 38 × 19 cm，顯示不符合，不會自行旋轉。
    2. 非布林方向資料遭拒，頁面以未設定空間的空白配置開始，不顯示「依所列尺寸，符合全部限制」。
  - **Evidence:** 兩次載入後的畫布／空間／結果截圖及可見提示；保留測試輸入 JSON 與頁面錯誤紀錄。
  - **Last run:** `2026-11-09 23:28 Asia/Taipei` — PASS
  - **Screenshot evidence:** [舊資料恢復](e2e-evidence/E2E-006-legacy.png)、[無效方向空白配置](e2e-evidence/E2E-006-invalid.png)、[無效資料提示](e2e-evidence/E2E-006-invalid-alert.png)
  - **Observed evidence:** [舊資料輸入](e2e-evidence/E2E-006-legacy-input.json) 恢復原方向 38 × 19 cm 並判不符合；[無效方向輸入](e2e-evidence/E2E-006-invalid-input.json) 被拒絕，出現空白配置與提示。整次 MCP 瀏覽器工作階段錯誤訊息 0。
  - **Cleanup:** 關閉兩個 context。

## Traceability

| Spec scenario | E2E case(s) | Notes |
|---|---|---|
| `layout-editing: 非正方形商品不可轉向` | `E2E-001` | OpenSpec 要求 MODIFIED 保留原情境名稱；新內容是放入時維持原方向，可手動旋轉。 |
| `layout-editing: 逐件切換且左上角不變` | `E2E-001`, `E2E-002` | 實例隔離及二次切換。 |
| `layout-editing: 旋轉造成異常仍保留` | `E2E-003`, `E2E-004` | 越界、重疊與保留位置。 |
| `layout-editing: 重新整理後保留` | `E2E-005` | 本次仍保留原保存情境。 |
| `layout-editing: 保存資料損毀` | `E2E-006` | 無效方向狀態也是損毀資料。 |
| `layout-editing: 旋轉狀態重新整理後保留` | `E2E-005` | 檢查每件方向。 |
| `layout-editing: 舊版保存資料維持原方向` | `E2E-006` | 以舊結構直接載入。 |
| `layout-editing: 無效旋轉狀態不得放行` | `E2E-006` | 非布林狀態拒絕。 |
| `layout-validation: 正常配置符合限制` | `E2E-001`, `E2E-003` | 比對原方向與旋轉方向。 |
| `layout-validation: 平面尺寸超過空間` | `E2E-001`, `E2E-003` | 轉向前後重檢。 |
| `layout-validation: 高度超限` | — | 既有 E2E 與原 40 筆固定案例驗證；旋轉不改高度另用旋轉固定案例驗證。 |
| `layout-validation: 高度恰等於上限` | `E2E-001`, `E2E-003` | 26 cm 貼齊上限。 |
| `layout-validation: 轉向後尺寸與高度分別判定` | `E2E-001` | 對應 20 × 40 × 26 cm。 |
| `layout-validation: 轉向後邊界與重疊使用新矩形` | `E2E-003`, `E2E-004` | 貼齊與正面積相交另用旋轉固定案例精確驗證。 |
| `layout-validation: 新增與移動自動檢查` | `E2E-004` | 放入與拖曳後結果直接更新。 |
| `layout-validation: 移動解除衝突` | — | 既有 E2E 與原 40 筆固定案例驗證；本次另驗證旋回解除。 |
| `layout-validation: 旋轉產生與解除異常` | `E2E-001`, `E2E-003`, `E2E-004` | 無需手動檢查。 |
