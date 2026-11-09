import { productIndex } from '../../data/catalog';
import type { Placement } from '../../domain/models';
import type { Validation } from '../../domain/validation';

export function ValidationPanel({
  result,
  placements,
}: {
  result: Validation;
  placements: readonly Placement[];
}) {
  function describe(id: string) {
    const index = placements.findIndex((p) => p.instanceId === id);
    return `${productIndex.get(placements[index]?.productId)?.name ?? '未知商品'}（第 ${index + 1} 件）`;
  }
  const titles = {
    unconfigured: '尚未設定空間',
    empty: '放入商品後，會自動檢查',
    valid: '依所列尺寸，符合全部限制',
    invalid: '不符合全部限制',
  };
  return (
    <section
      className={`panel validation-panel status-${result.status}`}
      aria-label="配置檢查結果"
      aria-live="polite"
    >
      <div className="result-heading">
        <span className="result-icon" aria-hidden="true">
          {result.status === 'valid'
            ? '✓'
            : result.status === 'invalid'
              ? '!'
              : '·'}
        </span>
        <div>
          <h2>{titles[result.status]}</h2>
          <p>
            {result.status === 'invalid'
              ? '商品保留在目前位置，你可以繼續調整。'
              : '依商品所列尺寸檢查；請留意各商品的尺寸備註。'}
          </p>
        </div>
        {placements.length > 0 && (
          <span className="result-count">{placements.length} 件商品</span>
        )}
      </div>
      {result.issues.length > 0 && (
        <div className="issue-details">
          <h3 id="issues-title">
            異常明細 <span>{result.issues.length}</span>
          </h3>
          <ol aria-labelledby="issues-title">
            {result.issues.map((issue, index) => (
              <li key={`${issue.kind}-${index}`}>
                <strong>{issue.message}</strong>
                <span>{issue.instanceIds.map(describe).join(' 與 ')}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
