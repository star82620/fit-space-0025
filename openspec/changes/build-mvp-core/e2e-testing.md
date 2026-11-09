# E2E Testing Checklist｜MVP 核心功能

> **狀態：已執行，E2E-001～018 全數通過。** 各案由 Playwright MCP 操作並留證；AC07、AC08 依 proposal.md「審查決策」驗收。

## Test Setup

- **Start URL / route：** `http://127.0.0.1:5173/`，路由 `/`；由 `npm run dev -- --port 5173 --strictPort` 啟動。
- **Viewport：** 桌面 1440 × 900，Chromium。此為本輪執行條件，不新增手機版產品驗收承諾。
- **Test data / accounts：** 不需帳號。唯一目錄為 `product-info/shuter-products.json`，23 筆；不攔截／替換成假商品。KD-2619（以下簡稱 K）38 × 19 × 26；DB-26（D）51.7 × 37.05 × 18.55，單位 cm。
- **Prerequisites：** 應用程式已實作，依 README 執行 `npm install` 與 `npm run dev -- --port 5173 --strictPort`；確認起始頁可載入。沒有後端／資料庫／seed／登入依賴。
- **UI 契約：** 欄位「寬（左右，cm）」「深（前後，cm）」「高（cm）」、按鈕「套用空間」「放入配置」「移除」、圖面「收納配置區」、結果「配置檢查結果」、清單「異常明細」。商品動作需限定在指定商品的可見卡片或實例內，避免同名按鈕歧義。
- **隔離：** 每案使用全新瀏覽器 context 開啟 `/`（全新 context 沒有本機保存資料），確認沒有既有 placements。結束關閉該 context。E2E-018 例外，會在同一 context 內重新整理。
- **座標：** 以可見空間邊框左上角為 (0,0)，x 向右、y 向後。拖曳使用圖面與商品可見矩形的 bounding box、顯示比例及游標抓取偏移換算，不讀 React store、不從 console 注入 placements。一般案例選擇有明顯餘裕的位置；精確到 0.01 cm 的案例由下方 QA fixtures 驗證。
- **外部依賴：** 檢查來源連結的 href 是否符合 JSON 即可，不需官網在線或下單。商品圖片來自官網，可能載入失敗；只驗證每筆商品「有圖片或有替代圖示」，不以官網圖片成功載入作為通過條件。
- **Evidence：** 將各案指定截圖、可見文字與必要紀錄存於本 change 的 `e2e-evidence/`，以 case ID 命名；記錄 console error 及失敗的應用程式資源請求。

## 1. 空間與目錄

- [x] E2E-001 初始狀態不得假稱符合
  - **優先級：** Critical
  - **前置條件：** 全新 context，尚未設定空間。
  - **操作：**
    1. 開啟 `/`，查看三軸欄位、方向／公分說明與「配置檢查結果」。
  - **預期結果：** 尚無有效空間，不出現成功的「依所列尺寸，符合全部限制」判定；不要求特定空配置文案。
  - **證據：** 初始畫面截圖與結果文字，記錄啟動相關 console／network 錯誤。
  - **Last run:** `2026-11-09 22:46 Asia/Taipei` — PASS
  - **Screenshot evidence:** [`e2e-evidence/E2E-001-initial.png`](e2e-evidence/E2E-001-initial.png)
  - **Observed evidence:** 結果區顯示「尚未設定空間」；應用程式資源與瀏覽器 console 無錯誤。
  - **清理：** 關閉 context。

- [x] E2E-002 設定正整數空間
  - **優先級：** High
  - **前置條件：** 全新 context。
  - **操作：**
    1. 在寬／深／高欄位依序填入 100、80、40，按「套用空間」。
    2. 查看空間邊框與尺寸／方向說明。
  - **預期結果：** 接受設定，顯示 100 × 80 × 40 cm 的依據；商品寬對應左右、深對應前後。後續放入及檢查使用該設定。
  - **證據：** 設定與配置區截圖、可見尺寸及方向文字。
  - **Last run:** `2026-11-09 22:50 Asia/Taipei` — PASS
  - **Screenshot evidence:** [`e2e-evidence/E2E-002-space.png`](e2e-evidence/E2E-002-space.png)
  - **Observed evidence:** 顯示 100 × 80 × 40 cm，寬對應左右、深對應前後。 Console 與應用程式資源請求無錯誤。
  - **清理：** 關閉 context。

- [x] E2E-003 無效值不被接受、離開欄位才提示
  - **優先級：** Critical
  - **前置條件：** 每個子案例使用全新 context，沒有前次有效空間。
  - **操作：**
    1. 在寬欄位輸入「0」，先不離開欄位，觀察是否出現錯誤；再按 Tab 離開欄位，觀察錯誤說明。
    2. 其餘兩軸設有效值，對任一軸分別輸入空白、0、-1、1.5、1e2、abc、1000，按「套用空間」。三軸分別驗證。
    3. 三軸都輸入 999，按「套用空間」。
    4. 若欄位原生阻止該字元，記錄不能輸入的事實，不透過程式改 DOM 繞過。
  - **預期結果：** 輸入中不顯示錯誤，離開欄位後欄位旁顯示錯誤；無效值不建立有效空間，不被截斷／取絕對值後套用，不能產生有效的成功判定；999 被接受。
  - **證據：** 代表性拒絕狀態截圖、各軸／輸入值／可見結果表；原生欄位阻擋者另由 domain 驗證拒絕。
  - **Last run:** `2026-11-09 22:50 Asia/Taipei` — PASS
  - **Screenshot evidence:** [`e2e-evidence/E2E-003-typing.png`](e2e-evidence/E2E-003-typing.png)、[`e2e-evidence/E2E-003-blur.png`](e2e-evidence/E2E-003-blur.png)、[`e2e-evidence/E2E-003-rejected.png`](e2e-evidence/E2E-003-rejected.png)、[`e2e-evidence/E2E-003-upper-limit.png`](e2e-evidence/E2E-003-upper-limit.png)
  - **Observed evidence:** 21 組無效輸入均拒絕，輸入中無錯誤，離開欄位後顯示錯誤；999 上限接受。 Console 與應用程式資源請求無錯誤。
  - **清理：** 關閉每個 context。

- [x] E2E-004 樹德 23 筆目錄、精度與來源
  - **優先級：** High
  - **前置條件：** 全新 context，套用 100 × 80 × 40。
  - **操作：**
    1. 瀏覽完整目錄，核對商品名稱、品牌、數量及三軸尺寸。
    2. 定位 D，讀取 51.7 × 37.05 × 18.55 cm 與來源連結 href。
    3. 另開全新 context 設定 20 × 20 × 20，核對仍有 23 筆，超尺寸商品仍可自行選擇。
  - **預期結果：** 只列 JSON 的樹德 23 筆；不取整、不交換寬深，D 的 href 為 `https://www.shuter.com.tw/tw/product/db/db-26`；沒有自動篩除／推薦。
  - **證據：** 目錄名稱與數量紀錄、D 卡片截圖、來源 href、兩種空間下的目錄比較。
  - **Last run:** `2026-11-09 22:51 Asia/Taipei` — PASS
  - **Screenshot evidence:** [`e2e-evidence/E2E-004-catalog-100.png`](e2e-evidence/E2E-004-catalog-100.png)、[`e2e-evidence/E2E-004-catalog-20.png`](e2e-evidence/E2E-004-catalog-20.png)
  - **Observed evidence:** 100 × 80 × 40：逐筆核對 23 筆名稱、品牌、尺寸、來源與可選狀態一致；20 × 20 × 20：逐筆核對 23 筆名稱、品牌、尺寸、來源與可選狀態一致；console 與應用程式資源請求無錯誤。
  - **清理：** 關閉 contexts。

- [x] E2E-005 尺寸備註可核對
  - **優先級：** High
  - **前置條件：** 全新 context。
  - **操作：**
    1. 查看 DB-2621、D 與 FB-5336DR 的商品資訊及尺寸備註。
  - **預期結果：** 依序保留「官網標示為外徑」、「官網未標明是外尺寸或內尺寸」、「官網標示為外徑；摺疊式，這裡用展開後的尺寸」。不把全部商品稱為已確認外部最大尺寸。
  - **證據：** 三筆備註的可見文字與代表截圖。
  - **Last run:** `2026-11-09 22:51 Asia/Taipei` — PASS
  - **Screenshot evidence:** [`e2e-evidence/E2E-005-shuter-db-2621.png`](e2e-evidence/E2E-005-shuter-db-2621.png)、[`e2e-evidence/E2E-005-shuter-db-26.png`](e2e-evidence/E2E-005-shuter-db-26.png)、[`e2e-evidence/E2E-005-shuter-fb-5336dr.png`](e2e-evidence/E2E-005-shuter-fb-5336dr.png)
  - **Observed evidence:** DB-2621 拼拼樂鞋盒：官網標示為外徑；DB-26 大房子整理盒：官網未標明是外尺寸或內尺寸；FB-5336DR 清水模摺疊收納箱：官網標示為外徑；摺疊式，這裡用展開後的尺寸；console 與應用程式資源請求無錯誤。
  - **清理：** 關閉 context。

## 2. 放入、移動與固定方向

- [x] E2E-006 正常放入與移動自動檢查
  - **優先級：** Critical
  - **前置條件：** 全新 context，套用 100 × 80 × 40。
  - **操作：**
    1. 在 K 卡片按「放入配置」，查看圖面及結果。
    2. 將 K 拖到圖面內部，左上角約 (10,10)，放開後查看結果，不按任何檢查按鈕。
  - **預期結果：** 商品顯示且可移動，結果自動維持「依所列尺寸，符合全部限制」；不出現自身重疊警示。單件寬深方向保持 38 × 19。
  - **證據：** 放入及移動後截圖、可見商品數、位置變化與結果文字。
  - **Last run:** `2026-11-09 22:51 Asia/Taipei` — PASS
  - **Screenshot evidence:** [`e2e-evidence/E2E-006-added.png`](e2e-evidence/E2E-006-added.png)、[`e2e-evidence/E2E-006-moved.png`](e2e-evidence/E2E-006-moved.png)
  - **Observed evidence:** 依所列尺寸，符合全部限制；第 1 件位置 10.11, 10.11 cm；依所列尺寸，符合全部限制；console 與應用程式資源請求無錯誤。
  - **清理：** 關閉 context。

- [x] E2E-007 同款多件獨立移動與重疊修正
  - **優先級：** Critical
  - **前置條件：** 全新 context，套用 100 × 80 × 40。
  - **操作：**
    1. 放入 K，移至約 (10,10)；記錄第一件位置，再放入第二件 K。
    2. 將第二件移至約 (20,10)，造成明顯重疊。
    3. 將第二件移至約 (55,10)，解除衝突。
  - **預期結果：** 兩件可辨識，第一件位置不變；重疊時提示重疊、整體不符合且不排開／刪除；解除後自動符合，不必手動檢查。目錄 K 尺寸不變。
  - **證據：** 重疊與解除後各一張截圖、商品數量、第一件位置與結果文字。
  - **Last run:** `2026-11-09 22:51 Asia/Taipei` — PASS
  - **Screenshot evidence:** [`e2e-evidence/E2E-007-overlap.png`](e2e-evidence/E2E-007-overlap.png)、[`e2e-evidence/E2E-007-resolved.png`](e2e-evidence/E2E-007-resolved.png)
  - **Observed evidence:** 第 1 件位置 10.11, 10.11 cm；第 2 件位置 20.15, 10.11 cm；不符合全部限制；第 2 件位置 55.29, 10.11 cm；依所列尺寸，符合全部限制；console 與應用程式資源請求無錯誤。
  - **清理：** 關閉 context。

- [x] E2E-008 不可旋轉及平面尺寸超限
  - **優先級：** Critical
  - **前置條件：** 全新 context，套用 20 × 40 × 40。
  - **操作：**
    1. 放入 K，觀察圖面方向與檢查結果。
    2. 檢查商品可用控制並移動一次。
  - **預期結果：** 保留寬 38、深 19，不交換成 19 × 38；提示尺寸／越界異常、整體不符合，商品仍存在。無旋轉控制或自動轉向。
  - **證據：** 商品、邊界、控制及不符合結果截圖。
  - **Last run:** `2026-11-09 22:51 Asia/Taipei` — PASS
  - **Screenshot evidence:** [`e2e-evidence/E2E-008-fixed-direction.png`](e2e-evidence/E2E-008-fixed-direction.png)
  - **Observed evidence:** 不符合全部限制；第 1 件位置 2.11, 5.17 cm；不符合全部限制；console 與應用程式資源請求無錯誤。
  - **清理：** 關閉 context。

- [x] E2E-009 小數尺寸在配置中不取整
  - **優先級：** Critical
  - **前置條件：** 全新 context，套用 100 × 37 × 40。
  - **操作：**
    1. 放入 D，檢視所用尺寸與異常結果。
  - **預期結果：** 商品深 37.05 大於空間 37，整體不符合，商品保留；不能因把深取成 37 而通過。
  - **證據：** D 尺寸、空間設定與不符合結果的同框截圖；其餘精確邊界由 QA 測試補足。
  - **Last run:** `2026-11-09 22:51 Asia/Taipei` — PASS
  - **Screenshot evidence:** [`e2e-evidence/E2E-009-decimal-depth.png`](e2e-evidence/E2E-009-decimal-depth.png)
  - **Observed evidence:** 不符合全部限制；console 與應用程式資源請求無錯誤。
  - **清理：** 關閉 context。

## 3. 邊界、高度與整體判定

- [x] E2E-010 四側越界保留並可拖回
  - **優先級：** Critical
  - **前置條件：** 右／左／後／前四個子案各用全新 context，套用 100 × 80 × 40，放入 K。
  - **操作：**
    1. 將 K 分別拖至明顯超出指定邊界的位置：左上角約 (70,10)、(-5,10)、(10,70)、(10,-5)，每子案只驗一側。
    2. 放開，記錄位置與結果；再將商品拖回約 (10,10)。
  - **預期結果：** 越界時提示異常、整體不符合，停留於放開位置且仍可取得；不吸回／刪除／阻止。拖回後自動符合。
  - **證據：** 四側各一張越界截圖，代表性拖回截圖與結果文字。
  - **Last run:** `2026-11-09 22:51 Asia/Taipei` — PASS
  - **Screenshot evidence:** [`e2e-evidence/E2E-010-右側.png`](e2e-evidence/E2E-010-右側.png)、[`e2e-evidence/E2E-010-左側.png`](e2e-evidence/E2E-010-左側.png)、[`e2e-evidence/E2E-010-後側.png`](e2e-evidence/E2E-010-後側.png)、[`e2e-evidence/E2E-010-前側.png`](e2e-evidence/E2E-010-前側.png)、[`e2e-evidence/E2E-010-returned.png`](e2e-evidence/E2E-010-returned.png)
  - **Observed evidence:** 第 1 件位置 70.35, 10.11 cm；不符合全部限制；第 1 件位置 10.12, 10.11 cm；依所列尺寸，符合全部限制；第 1 件位置 -4.95, 10.11 cm；不符合全部限制；第 1 件位置 10.11, 10.11 cm；依所列尺寸，符合全部限制；第 1 件位置 10.11, 70.36 cm；不符合全部限制；第 1 件位置 10.11, 10.12 cm；依所列尺寸，符合全部限制；第 1 件位置 10.11, -4.95 cm；不符合全部限制；第 1 件位置 10.12, 10.12 cm；依所列尺寸，符合全部限制；console 與應用程式資源請求無錯誤。
  - **清理：** 關閉每個 context。

- [x] E2E-011 四側貼齊與高度相等合法
  - **優先級：** Critical
  - **前置條件：** 全新 context，套用 38 × 19 × 26。
  - **操作：**
    1. 放入 K（設計起點為原點），查看所有邊界與結果。
  - **預期結果：** 四側貼齊、高度等於限制，顯示符合全部限制；無越界、重疊或高度超限。
  - **證據：** 空間尺寸、貼齊圖面與符合文字截圖；精確共邊／共角另由 QA fixtures 驗證。
  - **Last run:** `2026-11-09 22:52 Asia/Taipei` — PASS
  - **Screenshot evidence:** [`e2e-evidence/E2E-011-flush.png`](e2e-evidence/E2E-011-flush.png)
  - **Observed evidence:** 38 × 19 × 26 cm 三軸貼齊合法，無異常明細。 Console 與應用程式資源請求無錯誤。
  - **清理：** 關閉 context。

- [x] E2E-012 高度超限仍保留商品
  - **優先級：** Critical
  - **前置條件：** 全新 context，套用 100 × 80 × 25。
  - **操作：**
    1. 放入 K，再移至約 (10,10)。
  - **預期結果：** 顯示高度 26 超過 25 的異常與整體不符合，移動不能消除高度問題；商品及選定位置均保留。
  - **證據：** 高度設定、商品尺寸、異常及保留位置截圖。
  - **Last run:** `2026-11-09 22:52 Asia/Taipei` — PASS
  - **Screenshot evidence:** [`e2e-evidence/E2E-012-height.png`](e2e-evidence/E2E-012-height.png)
  - **Observed evidence:** 高 26 cm 超過空間 25 cm；商品移動後仍保留並顯示不符合。 Console 與應用程式資源請求無錯誤。
  - **清理：** 關閉 context。

- [x] E2E-013 多重異常與部分解除的 R06 底線
  - **優先級：** Critical
  - **前置條件：** 全新 context，套用 100 × 80 × 25。
  - **操作：**
    1. 放入兩件 K，將其左上角移至約 (65,10) 與 (66,10)，造成越界、重疊與高度超限。
    2. 將兩件分別移至約 (5,10) 與 (55,10)，解除平面衝突但保留高度超限。
  - **預期結果：** 兩階段均顯示整體不符合，商品可操作且位置保留；第二階段高度異常仍存在。此案不指定 AC08 的完整清單、排序、配對明細或解除動畫。
  - **證據：** 兩階段截圖、可見結果與高度異常文字、商品數量。
  - **Last run:** `2026-11-09 22:52 Asia/Taipei` — PASS
  - **Screenshot evidence:** [`e2e-evidence/E2E-013-all-issues.png`](e2e-evidence/E2E-013-all-issues.png)、[`e2e-evidence/E2E-013-remaining.png`](e2e-evidence/E2E-013-remaining.png)
  - **Observed evidence:** 先同時列出兩件的右側越界、高度超限及重疊；移回後只保留兩件高度異常，整體仍不符合。 Console 與應用程式資源請求無錯誤。
  - **清理：** 關閉 context。

## 4. 輸入修改、異常明細、移除、圖片與保存

- [x] E2E-014 已有配置時輸入無效值，沿用上一次有效空間
  - **優先級：** High
  - **前置條件：** 全新 context，套用 100 × 80 × 40，放入一件 K 並移至約 (10,10)。
  - **操作：**
    1. 將高改為 0，按 Tab 離開欄位，觀察欄位錯誤、空間標示、商品位置與檢查結果。
    2. 將高改為 25，按「套用空間」，觀察檢查結果。
  - **預期結果：** 第 1 步高欄位顯示錯誤，畫面標示「仍使用上一次的有效空間」與 100 × 80 × 40，商品位置與「符合全部限制」結果不變。第 2 步改用 100 × 80 × 25，自動顯示 K 高度超限、整體不符合。
  - **證據：** 兩步驟的截圖與可見文字。
  - **Last run:** `2026-11-09 22:50 Asia/Taipei` — PASS
  - **Screenshot evidence:** [`e2e-evidence/E2E-014-previous-space.png`](e2e-evidence/E2E-014-previous-space.png)、[`e2e-evidence/E2E-014-new-space.png`](e2e-evidence/E2E-014-new-space.png)
  - **Observed evidence:** 無效高沿用 100 × 80 × 40 與原位置；套用高 25 後即時顯示高度異常。 Console 與應用程式資源請求無錯誤。
  - **清理：** 關閉 context。

- [x] E2E-015 異常明細同時列出、標示商品、部分解除
  - **優先級：** High
  - **前置條件：** 全新 context，套用 100 × 80 × 25。
  - **操作：**
    1. 放入兩件 K，移至約 (65,10) 與 (66,10)，查看「異常明細」與配置區。
    2. 將兩件移至約 (5,10) 與 (55,10)，再查看明細與配置區。
  - **預期結果：** 第 1 步明細同時列出兩件的高度超限、兩件的右側越界、兩件之間的重疊，依放入順序排列；兩件在配置區都有醒目標示與文字標記。第 2 步越界與重疊從明細消失、高度超限保留，兩件仍標示，整體不符合。
  - **證據：** 兩階段截圖與明細文字。
  - **Last run:** `2026-11-09 22:52 Asia/Taipei` — PASS
  - **Screenshot evidence:** [`e2e-evidence/E2E-015-all-issues.png`](e2e-evidence/E2E-015-all-issues.png)、[`e2e-evidence/E2E-015-remaining.png`](e2e-evidence/E2E-015-remaining.png)
  - **Observed evidence:** 異常明細依放入順序列出 5 項、重疊標明雙方，兩件在圖面標示；解除平面衝突後僅剩 2 項高度異常。 Console 與應用程式資源請求無錯誤。
  - **清理：** 關閉 context。

- [x] E2E-016 移除已放入的商品
  - **優先級：** High
  - **前置條件：** 全新 context，套用 100 × 80 × 40。
  - **操作：**
    1. 放入兩件 K，第一件移至約 (10,10)，第二件移至約 (20,10) 造成重疊。
    2. 對第二件按「移除」。
  - **預期結果：** 只剩第一件，位置不變；重疊異常自動消失，整體顯示符合全部限制；目錄仍有 K。
  - **證據：** 移除前後截圖、商品數量與結果文字。
  - **Last run:** `2026-11-09 22:52 Asia/Taipei` — PASS
  - **Screenshot evidence:** [`e2e-evidence/E2E-016-before-remove.png`](e2e-evidence/E2E-016-before-remove.png)、[`e2e-evidence/E2E-016-removed.png`](e2e-evidence/E2E-016-removed.png)
  - **Observed evidence:** 移除第二件後，第一件位置不變，重疊消失，整體恢復符合。 Console 與應用程式資源請求無錯誤。
  - **清理：** 關閉 context。

- [x] E2E-017 商品圖片與作業練習聲明
  - **優先級：** Medium
  - **前置條件：** 全新 context。
  - **操作：**
    1. 開啟 `/`，瀏覽商品目錄，檢查每筆商品的圖片區。
    2. 找到頁面上的聲明文字。
  - **預期結果：** 每筆商品都有圖片或替代圖示，名稱與尺寸照常顯示；頁面可見「本專案為課程作業練習，商品資料與圖片版權屬樹德」。
  - **證據：** 目錄截圖、聲明文字；記錄載入失敗的圖片數量（僅供參考，不影響通過）。
  - **Last run:** `2026-11-09 22:52 Asia/Taipei` — PASS
  - **Screenshot evidence:** [`e2e-evidence/E2E-017-images.png`](e2e-evidence/E2E-017-images.png)、[`e2e-evidence/E2E-017-notice.png`](e2e-evidence/E2E-017-notice.png)
  - **Observed evidence:** 23 筆商品均有圖片或替代圖示，觀察時替代圖示 0 筆；版權聲明可見。 Console 與應用程式資源請求無錯誤。
  - **清理：** 關閉 context。

- [x] E2E-018 重新整理後保留配置
  - **優先級：** High
  - **前置條件：** 全新 context，套用 100 × 80 × 40。
  - **操作：**
    1. 放入兩件 K，分別移至約 (10,10) 與 (55,10)，記錄位置與結果。
    2. 在同一 context 重新整理頁面。
  - **預期結果：** 空間 100 × 80 × 40、兩件商品與位置都恢復，檢查結果與重新整理前一致。
  - **證據：** 重新整理前後截圖。
  - **Last run:** `2026-11-09 22:52 Asia/Taipei` — PASS
  - **Screenshot evidence:** [`e2e-evidence/E2E-018-before-reload.png`](e2e-evidence/E2E-018-before-reload.png)、[`e2e-evidence/E2E-018-restored.png`](e2e-evidence/E2E-018-restored.png)
  - **Observed evidence:** 重新整理後恢復 100 × 80 × 40 cm、兩件商品及相同位置與判定。 Console 與應用程式資源請求無錯誤。
  - **清理：** 關閉 context。保存資料損毀的情境由 domain 測試驗證，不在瀏覽器手動竄改本機資料。

## 5. 固定品質案例｜較低層驗證計畫

以下是 domain fixtures 的獨立標準答案，與瀏覽器 E2E 分開驗證。已轉為 `tests/geometry/quality-cases.ts` 的 40 筆固定資料，執行 `npm run test:geometry` 後，40 筆逐筆一致；geometry project 含其他防呆測試共 49/49 通過。精確座標無需在瀏覽器注入或增加產品座標輸入功能。

空間欄為寬 × 深 × 高（cm）；未註明為 100 × 80 × 40。K＝KD-2619，D＝DB-26，S＝DB-13（37.05 × 26 × 18.55），B＝DB-2621（26.5 × 37.2 × 21.3）；同列多座標代表各自獨立實例。全部採固定寬深方向。

| ID | 商品與左上角位置 | 空間（如異於預設） | 標準答案／檢查重點 |
|---|---|---|---|
| QA01 | K (0,0) | — | 符合；單件無自撞 |
| QA02 | K (62,0) | — | 符合；右貼齊 |
| QA03 | K (0,61) | — | 符合；後貼齊 |
| QA04 | K (62,61) | — | 符合；右後角貼齊 |
| QA05 | K (10,10) | — | 符合；內部位置 |
| QA06 | K (0,0) | 38 × 19 × 26 | 符合；三軸相等 |
| QA07 | D (0,0) | — | 符合；小數尺寸 |
| QA08 | D (48.3,0) | — | 符合；小數右貼齊 |
| QA09 | D (0,42.95) | — | 符合；小數後貼齊 |
| QA10 | D (48.3,42.95) | — | 符合；小數右後貼齊 |
| QA11 | D (10.1,5.05) | — | 符合；小數座標 |
| QA12 | S (0,0) | 38 × 26 × 19 | 符合；深度相等 |
| QA13 | B (0,0) | 27 × 38 × 22 | 符合；另一小數尺寸 |
| QA14 | K (0,0)、K (38,0) | — | 符合；共邊 |
| QA15 | K (0,0)、K (38,19) | — | 符合；共角 |
| QA16 | K (0,0)、K (0,19) | — | 符合；前後共邊 |
| QA17 | K (0,0)、K (38.01,0) | — | 符合；0.01 cm 間距 |
| QA18 | D (0,0)、D (51.7,0) | 120 × 100 × 40 | 符合；小數共邊 |
| QA19 | K (0,0)、K (38,0)、K (0,19)、K (38,19) | 76 × 38 × 26 | 符合；四件滿版貼齊 |
| QA20 | K (0,0)、K (38,0)、K (0,19) | 76 × 38 × 26 | 符合；多件未填滿 |
| QA21 | K (63,0) | — | 不符合；右越界 |
| QA22 | K (-0.01,0) | — | 不符合；左微量越界 |
| QA23 | K (0,61.01) | — | 不符合；後微量越界 |
| QA24 | K (0,-0.01) | — | 不符合；前微量越界 |
| QA25 | D (48.31,0) | — | 不符合；小數右超出 0.01 |
| QA26 | D (0,42.96) | — | 不符合；小數後超出 0.01 |
| QA27 | D (-0.01,0) | — | 不符合；小數商品左越界 |
| QA28 | D (0,-0.01) | — | 不符合；小數商品前越界 |
| QA29 | K (0,0) | 37 × 80 × 40 | 不符合；商品寬超限及右越界 |
| QA30 | K (0,0) | 100 × 18 × 40 | 不符合；商品深超限及後越界 |
| QA31 | K (0,0) | 100 × 80 × 25 | 不符合；高度超限 |
| QA32 | D (0,0) | 51 × 80 × 40 | 不符合；小數寬超限 |
| QA33 | D (0,0) | 100 × 37 × 40 | 不符合；小數深超限 |
| QA34 | D (0,0) | 100 × 80 × 18 | 不符合；小數高超限 |
| QA35 | K (0,0)、K (37,0) | — | 不符合；左右重疊 |
| QA36 | K (0,0)、K (0,18.99) | — | 不符合；前後微量重疊 |
| QA37 | D (0,0)、D (51.69,0) | 120 × 100 × 40 | 不符合；小數微量重疊 |
| QA38 | K (0,0)、K (0,0) | — | 不符合；同款不同實例完全重疊 |
| QA39 | K (63,0)、K (64,0) | 100 × 80 × 25 | 不符合；越界＋重疊＋高度 |
| QA40 | K (0,0)、K (38,0) | 100 × 80 × 25 | 不符合；平面通過但高度仍失敗 |

預期共 20 筆符合、20 筆不符合；必須逐筆與標準答案一致。尺寸誤判率依 `sdd-input.md` 8.4 計算，重大誤判（系統顯示符合但違反規則）目標為 0；若沒有任何系統判定符合案例，記為無法計算，不能宣稱誤判率 0。資料錯誤、無效表單與數值溢位另做 domain 防呆案例，不混入這 40 筆或宣稱新增產品規則。

## Traceability

| Spec scenario／來源 | E2E case(s)／較低層驗證 | 備註 |
|---|---|---|
| space-settings：接受正整數空間 | E2E-002 | F01 |
| space-settings：拒絕無效數值 | E2E-003＋domain 輸入驗證 | AC07、Q07-3 |
| space-settings：接受上限值 | E2E-003＋domain 輸入驗證 | Q07-3 |
| space-settings：尚無有效空間 | E2E-001、E2E-003 | |
| space-settings：輸入中不提示、離開欄位才提示 | E2E-003 | Q07-1 |
| space-settings：無效修改不影響現有配置 | E2E-014 | Q07-2 |
| space-settings：改回有效值後重新檢查 | E2E-014 | Q07-2 |
| product-catalog：瀏覽並核對商品 | E2E-004 | F02 |
| product-catalog：小數商品維持原始尺寸 | E2E-004、E2E-009；QA07～QA11、QA25～QA28、QA32～QA34 | 精度不可取整 |
| product-catalog：核對不同商品備註 | E2E-005 | 原始 JSON 為來源 |
| product-catalog：圖片正常顯示 | E2E-017 | 追加 2 |
| product-catalog：圖片載入失敗 | E2E-017＋元件測試 | 追加 2；以元件測試模擬失敗 |
| product-catalog：看到聲明 | E2E-017 | 追加 2 |
| layout-editing：放入並移動單件商品 | E2E-006 | F03 |
| layout-editing：同商品多件可獨立操作 | E2E-007 | 獨立實例 |
| layout-editing：非正方形商品不可轉向 | E2E-008 | 寬深方向固定 |
| layout-editing：越界位置不被強制修正 | E2E-010 | F06 |
| layout-editing：重疊與高度超限仍可操作 | E2E-013 | 不當成堆疊 |
| layout-editing：移除一件商品 | E2E-016 | 追加 1 |
| layout-editing：移除造成重疊的商品即解除重疊 | E2E-016 | 追加 1 |
| layout-editing：重新整理後保留 | E2E-018 | 追加 3 |
| layout-editing：保存資料損毀 | domain 測試 | 追加 3；不在瀏覽器竄改資料 |
| layout-validation：正常配置符合限制 | E2E-006；QA01～QA20 | AC01 |
| layout-validation：平面尺寸超過空間 | E2E-008、E2E-009；QA29～QA30、QA32～QA33 | F04 |
| layout-validation：高度超限 | E2E-012；QA31、QA34 | AC04 |
| layout-validation：高度恰等於上限 | E2E-011；QA06、QA19～QA20 | 貼齊合法 |
| layout-validation：任一側越界 | E2E-010；QA21～QA28 | AC02 |
| layout-validation：四側貼齊合法 | E2E-011；QA06 | AC01 邊界 |
| layout-validation：小數貼齊與微量超出區別 | QA08～QA10、QA25～QA26 | **不以 MCP 精準拖曳驗證**，以 geometry 精確斷言；E2E-009 驗整合 |
| layout-validation：不同實例重疊 | E2E-007；QA35～QA38 | AC03 |
| layout-validation：共邊與共角合法 | QA14～QA18 | **不以 MCP 精準拖曳驗證**，geometry 精確斷言；E2E-007 驗解除流程 |
| layout-validation：不把自身當重疊 | E2E-006；QA01 | 單件不自撞 |
| layout-validation：新增與移動自動檢查 | E2E-006～E2E-007、E2E-010 | AC06 |
| layout-validation：移動解除衝突 | E2E-007、E2E-010 | AC05 |
| layout-validation：多重異常不能被單項通過覆蓋 | E2E-013；QA39 | R06；AC08 完整明細另見 E2E-015 |
| layout-validation：部分解除仍不符合 | E2E-013；QA40 | R06 |
| layout-validation：多種異常同時列出 | E2E-015；QA39 | AC08、Q08-1～Q08-2 |
| layout-validation：部分解除後只留剩餘異常 | E2E-015；QA40 | AC08、Q08-3 |

本輪未新增權限、登入、下載或多路由流程；行動裝置支援未確認，不為它創造驗收情境。
