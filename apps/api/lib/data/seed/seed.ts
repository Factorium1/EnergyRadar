import fs from 'fs/promises';
import { prisma } from '../../prisma.js';
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

  if (!brand) return;

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
}

const BRANDS_DIR = new URL('./brands/', import.meta.url);

async function seed() {
  const files = await fs.readdir(BRANDS_DIR);

  await Promise.all(
    files.map(async (file) => {
      const jsonString = await fs.readFile(new URL(file, BRANDS_DIR), 'utf-8');
      const data = JSON.parse(jsonString);
      await dbCreateEntrys(data);
    }),
  );
}

seed();
