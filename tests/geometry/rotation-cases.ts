import type { Issue } from '../../src/domain/validation';
import type { Placement, Space } from '../../src/domain/models';

type RotationCase = {
  id: string;
  space: Space;
  placements: Placement[];
  status: 'valid' | 'invalid';
  issueKinds: Issue['kind'][];
};
const K = 'shuter-kd-2619';
const D = 'shuter-db-26';
const p = (
  instanceId: string,
  productId: string,
  x: number,
  y: number,
  rotated = false,
): Placement => ({ instanceId, productId, x, y, rotated });
const space = (width: number, depth: number, height: number): Space => ({
  width,
  depth,
  height,
});

// 預期值獨立明列；原 40 筆 quality-cases 不變。
export const rotationCases: RotationCase[] = [
  {
    id: 'RT01 原方向不自動旋轉',
    space: space(20, 40, 26),
    placements: [p('a', K, 0, 0)],
    status: 'invalid',
    issueKinds: ['size', 'boundary'],
  },
  {
    id: 'RT02 旋轉後符合',
    space: space(20, 40, 26),
    placements: [p('a', K, 0, 0, true)],
    status: 'valid',
    issueKinds: [],
  },
  {
    id: 'RT03 旋轉後邊界貼齊',
    space: space(19, 38, 26),
    placements: [p('a', K, 0, 0, true)],
    status: 'valid',
    issueKinds: [],
  },
  {
    id: 'RT04 旋轉後深度越界',
    space: space(19, 37, 26),
    placements: [p('a', K, 0, 0, true)],
    status: 'invalid',
    issueKinds: ['size', 'boundary'],
  },
  {
    id: 'RT05 旋轉不改高度',
    space: space(20, 40, 25),
    placements: [p('a', K, 0, 0, true)],
    status: 'invalid',
    issueKinds: ['height'],
  },
  {
    id: 'RT06 旋轉後右緣貼齊',
    space: space(100, 80, 40),
    placements: [p('a', K, 81, 0, true)],
    status: 'valid',
    issueKinds: [],
  },
  {
    id: 'RT07 旋轉後右緣超出 0.01 cm',
    space: space(100, 80, 40),
    placements: [p('a', K, 81.01, 0, true)],
    status: 'invalid',
    issueKinds: ['boundary'],
  },
  {
    id: 'RT08 旋轉商品與原方向商品邊緣貼齊',
    space: space(100, 80, 40),
    placements: [p('a', K, 0, 0, true), p('b', K, 19, 0)],
    status: 'valid',
    issueKinds: [],
  },
  {
    id: 'RT09 旋轉商品與原方向商品相交 0.01 cm',
    space: space(100, 80, 40),
    placements: [p('a', K, 0, 0, true), p('b', K, 18.99, 0)],
    status: 'invalid',
    issueKinds: ['overlap'],
  },
  {
    id: 'RT10 旋轉新增深度造成重疊',
    space: space(100, 80, 40),
    placements: [p('a', K, 0, 0, true), p('b', K, 0, 19)],
    status: 'invalid',
    issueKinds: ['overlap'],
  },
  {
    id: 'RT11 旋轉後深度邊緣貼齊',
    space: space(100, 80, 40),
    placements: [p('a', K, 0, 0, true), p('b', K, 0, 38)],
    status: 'valid',
    issueKinds: [],
  },
  {
    id: 'RT12 小數尺寸轉向後符合',
    space: space(38, 52, 19),
    placements: [p('a', D, 0, 0, true)],
    status: 'valid',
    issueKinds: [],
  },
  {
    id: 'RT13 小數尺寸旋轉後右緣貼齊',
    space: space(38, 52, 19),
    placements: [p('a', D, 0.95, 0, true)],
    status: 'valid',
    issueKinds: [],
  },
  {
    id: 'RT14 小數尺寸旋轉後右緣超出 0.01 cm',
    space: space(38, 52, 19),
    placements: [p('a', D, 0.96, 0, true)],
    status: 'invalid',
    issueKinds: ['boundary'],
  },
];
