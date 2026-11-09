import { useState } from 'react';
import {
  emptyLayout,
  layoutReducer,
  restoreLayout,
  saveLayout,
  type LayoutAction,
} from './domain/layout';
import type { Product } from './domain/models';
import { validateLayout } from './domain/validation';
import { SpaceSettings } from './features/space/SpaceSettings';
import { ProductCatalog } from './features/catalog/ProductCatalog';
import { LayoutCanvas } from './features/layout/LayoutCanvas';
import { ValidationPanel } from './features/validation/ValidationPanel';

export default function App() {
  const [session, setSession] = useState(() => {
    try {
      return restoreLayout(window.localStorage);
    } catch {
      return { state: emptyLayout, error: true };
    }
  });
  const state = session.state;
  function dispatch(action: LayoutAction) {
    // Persist outside the state updater, which React may run more than once in Strict Mode.
    const next = layoutReducer(state, action);
    try {
      if (!saveLayout(window.localStorage, next)) {
        setSession({ state: emptyLayout, error: true });
        return;
      }
      setSession({ state: next, error: false });
    } catch {
      setSession({ state: emptyLayout, error: true });
    }
  }
  function add(product: Product) {
    if (!state.space) return;
    dispatch({
      type: 'add',
      placement: {
        instanceId: crypto.randomUUID(),
        productId: product.id,
        x: 0,
        y: 0,
      },
    });
  }
  const result = validateLayout(state.space, state.placements);
  return (
    <>
      <header className="site-header">
        <a className="wordmark" href="/" aria-label="Fit Space 首頁">
          <span className="logo-mark" aria-hidden="true">
            ▦
          </span>
          Fit Space<span className="wordmark-dot">.</span>
        </a>
        <span className="header-description">讓收納，剛剛好。</span>
        <span className="practice-label">課程作業練習</span>
      </header>
      <main className="app-shell">
        <div className="page-intro">
          <div>
            <span className="eyebrow">YOUR SPACE, WELL PLANNED</span>
            <h1>先試著擺，再決定。</h1>
            <p>用真實商品尺寸，找到適合你的收納方式。</p>
          </div>
          <span className="intro-note">
            <i className="live-dot" />
            尺寸與衝突自動檢查
          </span>
        </div>
        {session.error && (
          <p className="storage-error" role="alert">
            無法保存或讀取配置，已從空白狀態開始。請確認瀏覽器允許本機儲存。
          </p>
        )}
        <div className="workspace">
          <ProductCatalog canAdd={Boolean(state.space)} onAdd={add} />
          <div className="planning-area">
            <SpaceSettings
              key={session.error ? 'storage-error' : 'space-form'}
              space={state.space}
              onApply={(space) => dispatch({ type: 'space', space })}
            />
            <LayoutCanvas
              space={state.space}
              placements={state.placements}
              issues={result.issues}
              onMove={(instanceId, x, y) =>
                dispatch({ type: 'move', instanceId, x, y })
              }
              onRemove={(instanceId) =>
                dispatch({ type: 'remove', instanceId })
              }
            />
            <ValidationPanel result={result} placements={state.placements} />
          </div>
        </div>
      </main>
      <footer className="site-footer">
        <span className="footer-brand">Fit Space.</span>
        <p>本專案為課程作業練習，商品資料與圖片版權屬樹德</p>
        <span>寬 × 深 × 高 · 公分</span>
      </footer>
    </>
  );
}
