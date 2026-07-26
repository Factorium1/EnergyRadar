import { Prisma } from '../../src/generated/prisma/browser.js';

type ProductWithOffers = Prisma.ProductGetPayload<{
  select: {
    id: true;
    name: true;
    slug: true;
    imageUrl: true;
    brand: true;
    offers: { include: { seller: true } };
  };
}>;

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
    : (sorted[mid] ?? 0);
}

/**
 * The market view of a product: what does it cost *right now*, across the
 * sellers that carry it. `median` is the middle of the current seller prices —
 * not an average over time. Out-of-stock offers are still listed but never
 * count as the best price.
 */
export function getProductPriceMedian(products: ProductWithOffers[]) {
  return products.map((product) => {
    const offers = [...product.offers].sort(
      (a, b) => Number(a.price) - Number(b.price),
    );
    const available = offers.filter((offer) => offer.inStock);
    const prices = offers.map((offer) => Number(offer.price));
    const best = available[0] ?? offers[0];

    return {
      ...product,
      offers,
      median: Number(median(prices).toFixed(2)),
      price: best ? Number(best.price).toFixed(2) : null,
      bestOfferId: best?.id ?? null,
      sellerCount: offers.length,
    };
  });
}

/**
 * How far the best current price sits below the median of all current offers.
 * Positive = the best price is a saving.
 */
export function getProductsWithPriceChange(
  products: ReturnType<typeof getProductPriceMedian>,
) {
  return products.map((product) => ({
    ...product,
    change: Number((Number(product.median) - Number(product.price ?? 0)).toFixed(2)),
  }));
}

type PriceHistoryRow = {
  price: InstanceType<typeof Prisma.Decimal> | number | string;
  recordedAt: Date;
  sellerId: string;
  inStock: boolean;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * PriceHistory is change-based — a seller only gets a row when its price moved.
 * To draw a continuous chart the last known price of every seller has to be
 * carried forward across the days it did not change. Returns one point per day
 * with the best price among the sellers that had stock, matching what the
 * product page shows as "bester Preis".
 */
export function buildPriceTimeline(history: PriceHistoryRow[], days = 30) {
  if (history.length === 0) return [];

  const sorted = [...history].sort(
    (a, b) => a.recordedAt.getTime() - b.recordedAt.getTime(),
  );

  const start = new Date(Date.now() - (days - 1) * DAY_IN_MS);
  start.setUTCHours(0, 0, 0, 0);

  const lastKnown = new Map<string, { price: number; inStock: boolean }>();
  let cursor = 0;

  const remember = (row: PriceHistoryRow) =>
    lastKnown.set(row.sellerId, {
      price: Number(row.price),
      inStock: row.inStock,
    });

  // Fold everything recorded before the window into the starting state.
  while (
    cursor < sorted.length &&
    sorted[cursor]!.recordedAt.getTime() < start.getTime()
  ) {
    remember(sorted[cursor]!);
    cursor++;
  }

  const timeline: { date: string; price: number; sellerCount: number }[] = [];

  for (let i = 0; i < days; i++) {
    const day = new Date(start.getTime() + i * DAY_IN_MS);
    const dayEnd = day.getTime() + DAY_IN_MS;

    while (
      cursor < sorted.length &&
      sorted[cursor]!.recordedAt.getTime() < dayEnd
    ) {
      remember(sorted[cursor]!);
      cursor++;
    }

    if (lastKnown.size === 0) continue;

    const known = [...lastKnown.values()];
    const available = known.filter((entry) => entry.inStock);
    const pool = available.length > 0 ? available : known;

    timeline.push({
      date: day.toISOString(),
      price: Math.min(...pool.map((entry) => entry.price)),
      sellerCount: known.length,
    });
  }

  return timeline;
}

export function sortProductsByCheapest(
  products: ReturnType<typeof getProductsWithPriceChange>,
) {
  const sorted = [...products].sort((a, b) => {
    const aRatio = Number(a.median) > 0 ? Number(a.change) / Number(a.median) : 0;
    const bRatio = Number(b.median) > 0 ? Number(b.change) / Number(b.median) : 0;
    return bRatio - aRatio;
  });
  return sorted.map(({ offers, ...withoutOffers }) => withoutOffers);
}
