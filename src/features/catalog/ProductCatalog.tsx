import { useState } from 'react';
import { products } from '../../data/catalog';
import type { Product } from '../../domain/models';

function ProductImage({ product }: { product: Product }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="product-image">
      {failed ? (
        <span
          role="img"
          aria-label={`${product.name} 圖片暫無法顯示`}
          className="image-fallback"
        >
          ▱<small>圖片暫無法顯示</small>
        </span>
      ) : (
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

export function ProductCatalog({
  canAdd,
  onAdd,
}: {
  canAdd: boolean;
  onAdd: (product: Product) => void;
}) {
  return (
    <section className="panel catalog-panel" aria-labelledby="catalog-title">
      <div className="catalog-heading">
        <span className="eyebrow">02 / 挑選收納品</span>
        <div className="catalog-title">
          <h2 id="catalog-title">商品目錄</h2>
          <span className="count-pill">23 件</span>
        </div>
        <p className="subtle">樹德 SHUTER · 放入後可手動旋轉</p>
      </div>
      <div className="catalog-list" aria-label="樹德商品目錄">
        {products.map((product) => (
          <article
            className="product-card"
            aria-label={product.name}
            key={product.id}
            data-testid={`product-${product.id}`}
          >
            <ProductImage product={product} />
            <div className="product-content">
              <span className="brand-label">{product.brand}</span>
              <h3>{product.name}</h3>
              <p className="product-dimensions">
                {product.width} × {product.depth} × {product.height}{' '}
                <span>cm</span>
              </p>
              <p className="dimension-hint">寬 × 深 × 高</p>
            </div>
            <p className="product-note">{product.note}</p>
            <div className="product-actions">
              <a href={product.sourceUrl} target="_blank" rel="noreferrer">
                規格來源 ↗
              </a>
              <button
                type="button"
                className="add-button"
                disabled={!canAdd}
                onClick={() => onAdd(product)}
              >
                ＋ 放入配置
              </button>
            </div>
          </article>
        ))}
      </div>
      {!canAdd && (
        <p className="catalog-help">先設定空間，就能開始放入商品。</p>
      )}
    </section>
  );
}
