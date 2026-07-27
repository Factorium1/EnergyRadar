import fs from 'fs/promises';
import { prisma, Prisma } from '@energyradar/db';
import { logger } from '../../logger.js';

type JsonDataType = {
  brand: Prisma.BrandGetPayload<{
    select: {
      name: true;
      slug: true;
    };
  }>;
  products: (Prisma.ProductGetPayload<{
    select: {
      line: true;
      name: true;
      slug: true;
      volumeMl: true;
      ean: true;
      imageUrl: true;
      kcal: true;
      sugar: true;
      carbs: true;
      caffeine: true;
      taurine: true;
      sugarFree: true;
    };
  }> & {
    /**
     * The retailer deeplink the product data was taken from. Not a Product
     * column any more — it becomes that seller's Offer.productUrl.
     */
    source?: string | null;
  })[];
};

type SellerSeed = {
  name: string;
  slug: string;
  shopUrl: string;
};

type SellerRecord = { id: string; slug: string; shopUrl: string | null };

const DAYS_OF_HISTORY = 30;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * Truncates to midnight UTC so a re-run of the seeder hits the same
 * `recordedAt` values and the @@unique([productId, sellerId, recordedAt])
 * constraint stays meaningful.
 */
function dayOffset(daysAgo: number) {
  const date = new Date(Date.now() - daysAgo * DAY_IN_MS);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

/**
 * Mirrors what the scraper is supposed to do: observe a price every day, but
 * only append a PriceHistory row when the price actually changed. The Offer
 * carries the latest observation.
 */
function buildSellerTimeline(basePrice: number) {
  const sellerFactor = 0.92 + Math.random() * 0.22;
  let price = Number((basePrice * sellerFactor).toFixed(2));

  const changes: { price: number; recordedAt: Date; inStock: boolean }[] = [];
  let lastWritten: number | null = null;
  let inStock = true;

  for (let daysAgo = DAYS_OF_HISTORY - 1; daysAgo >= 0; daysAgo--) {
    // ~20% chance of a price move on any given day
    if (Math.random() < 0.2) {
      price = Number((price * (0.9 + Math.random() * 0.2)).toFixed(2));
    }
    inStock = Math.random() > 0.05;

    if (lastWritten === null || price !== lastWritten) {
      changes.push({ price, recordedAt: dayOffset(daysAgo), inStock });
      lastWritten = price;
    }
  }

  // The Offer is the cached latest observation, so its stock flag has to be the
  // one from the newest history row — otherwise chart and offer table disagree.
  const latest = changes[changes.length - 1]!;
  return { changes, latest };
}

async function dbCreateEntrys(data: JsonDataType, sellers: SellerRecord[]) {
  const brandData = data.brand;
  logger.info(`Create or update brand ${brandData.name}`);
  const brand = await prisma.brand.upsert({
    where: {
      name: brandData.name,
    },
    update: {
      name: brandData.name,
      slug: brandData.slug,
    },
    create: {
      name: brandData.name,
      slug: brandData.slug,
    },
  });

  if (!brand) {
    logger.warn(`Couldn't create brand ${brandData.name}`);
    return;
  }

  logger.info(
    `Create ${data.products.length} products for brand ${brandData.name}`,
  );
  await prisma.$transaction([
    prisma.product.deleteMany({
      where: {
        brandId: brand.id,
      },
    }),
    prisma.product.createMany({
      data: data.products.map(({ source: _source, ...product }) => ({
        ...product,
        brandId: brand.id,
      })),
    }),
  ]);

  // slug -> the real retailer deeplink from the brand file, if there is one
  const sourceBySlug = new Map<string, string>(
    data.products
      .filter((product) => Boolean(product.source))
      .map((product) => [product.slug, product.source as string]),
  );

  const products = await prisma.product.findMany({
    where: {
      brandId: brand.id,
    },
  });

  logger.info(`Create offers and price history for ${products.length} products`);

  const productIds = products.map((product) => product.id);
  const offerRows: Prisma.OfferCreateManyInput[] = [];
  const historyRows: Prisma.PriceHistoryCreateManyInput[] = [];

  for (const product of products) {
    const basePrice = 1 + Math.random() * 3;
    const knownUrl = sourceBySlug.get(product.slug);
    const knownSellerSlug = knownUrl
      ? sellers.find((seller) =>
          knownUrl.includes(new URL(seller.shopUrl ?? '').hostname),
        )?.slug
      : undefined;

    // Every product is carried by 3–5 of the known sellers. If the brand file
    // has a real deeplink, that seller is always among them.
    const sellerCount = 3 + Math.floor(Math.random() * 3);
    const shuffled = [...sellers].sort(() => Math.random() - 0.5);
    const productSellers = shuffled
      .sort((a, b) =>
        a.slug === knownSellerSlug ? -1 : b.slug === knownSellerSlug ? 1 : 0,
      )
      .slice(0, Math.min(sellerCount, sellers.length));

    for (const seller of productSellers) {
      const { changes, latest } = buildSellerTimeline(basePrice);

      offerRows.push({
        productId: product.id,
        sellerId: seller.id,
        productUrl:
          seller.slug === knownSellerSlug && knownUrl
            ? knownUrl
            : `${seller.shopUrl ?? ''}/p/${product.slug}`,
        price: latest.price,
        shippingCost: Math.random() < 0.4 ? 3.99 : null,
        freeShippingFrom: Math.random() < 0.6 ? 29 : null,
        inStock: latest.inStock,
        lastCheckedAt: dayOffset(0),
        lastChangedAt: latest.recordedAt,
      });

      for (const change of changes) {
        historyRows.push({
          productId: product.id,
          sellerId: seller.id,
          price: change.price,
          inStock: change.inStock,
          recordedAt: change.recordedAt,
        });
      }
    }
  }

  await prisma.$transaction([
    prisma.priceHistory.deleteMany({ where: { productId: { in: productIds } } }),
    prisma.offer.deleteMany({ where: { productId: { in: productIds } } }),
    prisma.offer.createMany({ data: offerRows }),
    prisma.priceHistory.createMany({ data: historyRows }),
  ]);

  logger.info(
    `Created ${offerRows.length} offers and ${historyRows.length} price points for brand ${brandData.name}`,
  );
}

const SELLERS_FILE = new URL('./sellers.json', import.meta.url);

async function seedSellers(): Promise<SellerRecord[]> {
  const jsonString = await fs.readFile(SELLERS_FILE, 'utf-8');
  const sellers: SellerSeed[] = JSON.parse(jsonString);

  logger.info(`Create or update ${sellers.length} sellers`);

  // Sequential on purpose: brand files are seeded in parallel below and must
  // all see the same seller rows.
  const records: SellerRecord[] = [];
  for (const seller of sellers) {
    records.push(
      await prisma.seller.upsert({
        where: { slug: seller.slug },
        update: { name: seller.name, shopUrl: seller.shopUrl },
        create: seller,
        select: { id: true, slug: true, shopUrl: true },
      }),
    );
  }
  return records;
}

const BRANDS_DIR = new URL('./brands/', import.meta.url);

async function seed() {
  const sellers = await seedSellers();

  logger.info('Reading brand files...');
  const files = await fs.readdir(BRANDS_DIR);
  logger.info(`Found ${files.length} brand file(s): ${files.join(', ')}`);

  await Promise.all(
    files.map(async (file) => {
      const jsonString = await fs.readFile(new URL(file, BRANDS_DIR), 'utf-8');
      const data = JSON.parse(jsonString);
      await dbCreateEntrys(data, sellers);
    }),
  );

  logger.info('Seeding finished.');
}

seed()
  .catch((err) => {
    logger.error(err, 'Seeding failed');
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
