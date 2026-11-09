import { z } from 'zod';
import source from '../../product-info/shuter-products.json' with { type: 'json' };
import { productSchema } from '../domain/models';

const catalogSchema = z.object({
  unit: z.literal('cm'),
  products: z
    .array(productSchema)
    .min(1)
    .refine(
      (products) => new Set(products.map((p) => p.id)).size === products.length,
      '商品 ID 不可重複',
    ),
});

export const products = Object.freeze(
  catalogSchema.parse(source).products.map((product) => Object.freeze(product)),
);
export const productIndex: ReadonlyMap<string, (typeof products)[number]> =
  new Map(products.map((product) => [product.id, product]));
