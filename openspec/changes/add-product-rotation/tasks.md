# Tasks｜商品手動旋轉 90 度

每完成一組任務，先以註明組別與任務編號的訊息建立一次 git commit，再進入下一組。以下共 8 項追蹤任務；提案審查通過後才開始執行。

## 1. 實例狀態與本機相容

- [x] 1.1 在 `Placement` 與 `layoutReducer` 加入逐件切換的 `rotated` 狀態，維持 x／y 不變；以 reducer 測試確認只影響指定實例、連按兩次還原，並以 `npm run typecheck` 驗證型別。
- [x] 1.2 更新 Zod 保存／還原格式，讓舊資料缺欄位時視為原方向、非布林欄位遭拒，沿用現有保存鍵；以本機儲存測試驗證重新載入與損毀資料處理。

## 2. 幾何與檢查

- [ ] 2.1 加入共用有效寬深計算並套用至 `validateLayout`，高度仍取原始值；以 `npm run test:geometry` 驗證旋轉後尺寸、邊界、重疊及貼齊判定，並確認原 40 筆案例未修改且全數通過。
- [ ] 2.2 在原 40 筆 fixture 之外新增獨立、預期值明列的旋轉固定案例，涵蓋兩次切換、左上角固定、高度、邊界貼齊／越界、重疊貼齊／相交與商品小數尺寸；以 `npm run test:geometry` 驗證全部案例。

## 3. 畫布、互動與瀏覽器驗收

- [ ] 3.1 在每件已放入商品的實例列加「旋轉」按鈕，連接 reducer、即時重檢與本機保存；畫布矩形及拖曳幾何使用有效寬深。以 `npm run build` 及瀏覽器操作確認畫面、位置和檢查同步。
- [ ] 3.2 增補旋轉瀏覽器自動化測試，更新既有 E2E-008 過時的禁止旋轉斷言；執行 `npm run test:e2e`，確認原流程與新增流程通過。
- [ ] 3.3 更新 `README.md` 中的操作及功能說明，移除現行介面的「不可旋轉」文字；檢查文件、畫面與 `layout-editing` 新規格一致，並執行 `npm run lint`、`npm run format:check`。
- [ ] 3.4 使用 Playwright MCP 逐案執行 [e2e-testing.md](e2e-testing.md) 並保存證據；僅勾選實際通過案例，再以 `openspec validate add-product-rotation --strict` 確認變更文件有效。

## Workflow follow-up

- 實作驗證完成後再執行變更驗證與封存；封存同步主規格時，檢查舊的固定方向 Purpose 是否需一併更新。
