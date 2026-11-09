import type { Placement, Product } from './models';

export function effectiveDimensions(product: Product, placement: Placement) {
  return placement.rotated
    ? { width: product.depth, depth: product.width }
    : { width: product.width, depth: product.depth };
}
