import { useState, type FormEvent } from 'react';
import {
  axes,
  axisLabels,
  parseSpaceInput,
  type Axis,
  type Space,
} from '../../domain/models';

export function SpaceSettings({
  space,
  onApply,
}: {
  space: Space | null;
  onApply: (space: Space) => void;
}) {
  const [draft, setDraft] = useState<Record<Axis, string>>(() => ({
    width: space ? String(space.width) : '',
    depth: space ? String(space.depth) : '',
    height: space ? String(space.height) : '',
  }));
  const [errors, setErrors] = useState<Partial<Record<Axis, string>>>({});
  const errorText = '請輸入 1～999 的整數公分（僅限數字）';
  const hasInvalidDraft = axes.some(
    (axis) => parseSpaceInput(draft[axis]) === null,
  );
  function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: Partial<Record<Axis, string>> = {};
    for (const axis of axes)
      if (parseSpaceInput(draft[axis]) === null) nextErrors[axis] = errorText;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const next = Object.fromEntries(
      axes.map((axis) => [axis, parseSpaceInput(draft[axis])!]),
    ) as Record<Axis, number>;
    onApply(next);
    setDraft({
      width: String(next.width),
      depth: String(next.depth),
      height: String(next.height),
    });
  }
  return (
    <section className="panel space-panel" aria-labelledby="space-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">01 / 設定空間</span>
          <h2 id="space-title">你的收納空間有多大？</h2>
        </div>
        <span className="subtle">單位：公分</span>
      </div>
      <form onSubmit={submit} noValidate>
        <div className="space-fields">
          {axes.map((axis, i) => (
            <div className="field" key={axis}>
              <label htmlFor={axis}>{axisLabels[axis]}</label>
              <input
                id={axis}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder={['100', '80', '40'][i]}
                value={draft[axis]}
                aria-invalid={Boolean(errors[axis])}
                aria-describedby={errors[axis] ? `${axis}-error` : undefined}
                onChange={(event) => {
                  setDraft({ ...draft, [axis]: event.target.value });
                  setErrors({ ...errors, [axis]: undefined });
                }}
                onBlur={() =>
                  setErrors({
                    ...errors,
                    [axis]:
                      parseSpaceInput(draft[axis]) === null
                        ? errorText
                        : undefined,
                  })
                }
              />
              {errors[axis] && (
                <p className="field-error" id={`${axis}-error`}>
                  {errors[axis]}
                </p>
              )}
            </div>
          ))}
          <button className="primary-button" type="submit">
            套用空間 <span aria-hidden="true">↗</span>
          </button>
        </div>
        {space && hasInvalidDraft && (
          <p className="previous-space" role="status">
            仍使用上一次的有效空間：{space.width} × {space.depth} ×{' '}
            {space.height} cm
          </p>
        )}
      </form>
    </section>
  );
}
