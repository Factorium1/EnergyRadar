import { config } from 'dotenv'

// pnpm/turbo always run this with cwd = the app root, so `.env` is this
// app's own file and `../../.env` is the repo root's shared vars.
config({ path: ['.env', '../../.env'] })

import { prisma } from '@energyradar/db'
import { getAldiData } from './scrapers/aldi.js'
import { getEdekaData } from './scrapers/edeka.js'
import { matchBrand } from '../lib/brands.js'
import { slugify } from '../lib/helper/parse.js'
import type { ScraperProductWithNutrition } from '../types/product.js'

const edeka = await getEdekaData()
const aldi = await getAldiData()

const sellers = [
  { name: 'Edeka', slug: 'edeka' },
  { name: 'Aldi', slug: 'aldi' },
]

async function seedSellers() {
  for (const seller of sellers) {
    await prisma.seller.upsert({
      where: { name: seller.name },
      create: seller,
      update: seller,
    })
  }
}

async function seedProduct(item: ScraperProductWithNutrition) {
  const brandName = matchBrand(item.title)
  if (!brandName || item.canSizeMl === null) return

  const brand = await prisma.brand.upsert({
    where: { name: brandName },
    create: { name: brandName, slug: slugify(brandName) },
    update: {},
  })

  const product = await prisma.product.upsert({
    where: { slug: slugify(item.title) },
    create: {
      line: brandName,
      name: item.title,
      slug: slugify(item.title),
      volumeMl: item.canSizeMl,
      kcal: item.kcal,
      sugar: item.sugar,
      carbs: item.kohlenhydrate,
      caffeine: item.coffein,
      taurine: item.taurin,
      brandId: brand.id,
    },
    update: {
      kcal: item.kcal,
      sugar: item.sugar,
      carbs: item.kohlenhydrate,
      caffeine: item.coffein,
      taurine: item.taurin,
    },
  })

  const seller = await prisma.seller.findUniqueOrThrow({
    where: { slug: item.seller },
  })

  await prisma.offer.upsert({
    where: { productId_sellerId: { productId: product.id, sellerId: seller.id } },
    create: {
      productId: product.id,
      sellerId: seller.id,
      productUrl: item.url,
      price: item.price,
    },
    update: {
      productUrl: item.url,
      price: item.price,
      lastCheckedAt: new Date(),
    },
  })
}

async function seedDB() {
  await seedSellers()

  for (const item of [...edeka, ...aldi]) {
    await seedProduct(item)
  }
}

await seedDB()

console.log(`[Info] Total: ${edeka.length + aldi.length} products`)
