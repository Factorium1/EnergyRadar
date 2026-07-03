import { Prisma } from '../../src/generated/prisma/browser.js';

type ProductWithPriceHistory = Prisma.ProductGetPayload<{
  select: {
    id: true;
    name: true;
    slug: true;
    imageUrl: true;
    brand: true;
    priceHistory: true;
  };
}>;

export function getProductPriceMedian(products: ProductWithPriceHistory[]) {
  return products.map((product) => {
    const sortedHistory = product.priceHistory.sort(
      (a, b) => Number(a.price) - Number(b.price),
    );
    const median =
      sortedHistory.length % 2 === 0
        ? sortedHistory[sortedHistory.length / 2]?.price
        : sortedHistory[(sortedHistory.length - 1) / 2]?.price;

    return {
      ...product,
      priceHistory: sortedHistory,
      median: Number(median),
      price: sortedHistory[0]?.price.toFixed(2),
    };
  });
}

export function getProductsWithPriceChange(
  products: ReturnType<typeof getProductPriceMedian>,
) {
  return products.map((product) => {
    return {
      ...product,
      change: Number(
        (
          Number(product.median) - Number(product.priceHistory[0]?.price)
        ).toFixed(2),
      ),
    };
  });
}

export function sortProductsByCheapest(
  products: ReturnType<typeof getProductsWithPriceChange>,
) {
  const sorted = products.sort(
    (a, b) =>
      Number(b.change) / Number(b.median) - Number(a.change) / Number(a.median),
  );
  return sorted.map(({ priceHistory, ...withoutHistory }) => withoutHistory);
}
