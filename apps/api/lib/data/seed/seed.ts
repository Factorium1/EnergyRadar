import fs from 'fs/promises';
import { prisma } from '../../prisma.js';
import { logger } from '../../logger.js';
import { Prisma } from '../../../src/generated/prisma/client.js';

type JsonDataType = {
  brand: Prisma.BrandGetPayload<{
    select: {
      name: true;
      slug: true;
    };
  }>;
  products: Prisma.ProductGetPayload<{
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
      source: true;
    };
  }>[];
};

async function dbCreateEntrys(data: JsonDataType) {
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
      data: data.products.map((product) => ({ ...product, brandId: brand.id })),
    }),
  ]);

  const products = await prisma.product.findMany({
    where: {
      brandId: brand.id,
    },
  });

  logger.info(`Create PriceHistory for ${products.length} products`);

  await prisma.$transaction([
    prisma.priceHistory.deleteMany({
      where: {
        productId: {
          in: products.map((product) => product.id),
        },
      },
    }),
    prisma.priceHistory.createMany({
      data: products.flatMap((product) => {
        const basePrice = 1 + Math.random() * 9;
        return Array.from({ length: 10 }, (_, i) => ({
          price: Number((basePrice * (0.9 + Math.random() * 0.2)).toFixed(2)),
          recordedAt: new Date(Date.now() - (9 - i) * 24 * 60 * 60 * 1000),
          productId: product.id,
        }));
      }),
    }),
  ]);
}

const BRANDS_DIR = new URL('./brands/', import.meta.url);

async function seed() {
  logger.info('Reading brand files...');
  const files = await fs.readdir(BRANDS_DIR);
  logger.info(`Found ${files.length} brand file(s): ${files.join(', ')}`);

  await Promise.all(
    files.map(async (file) => {
      const jsonString = await fs.readFile(new URL(file, BRANDS_DIR), 'utf-8');
      const data = JSON.parse(jsonString);
      await dbCreateEntrys(data);
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
