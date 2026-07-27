import express, { Router } from 'express';
import { prisma } from '@energyradar/db';
import {
  getProductPriceMedian,
  getProductsWithPriceChange,
  sortProductsByCheapest,
} from '../../lib/helper/productPrice.js';

const router: Router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const brands = await prisma.brand.findMany();

    if (brands.length === 0) {
      const error: Error & { status?: number } = new Error('No Brand found');
      error.status = 404;
      return next(error);
    }

    res.json(brands);
  } catch (err) {
    next(err);
  }
});

router.get('/:brandSlug', async (req, res, next) => {
  try {
    const brand = await prisma.brand.findUnique({
      where: {
        slug: req.params.brandSlug,
      },
    });

    if (!brand) {
      const error: Error & { status?: number } = new Error('No Brand found');
      error.status = 404;
      return next(error);
    }

    const products = await prisma.product.findMany({
      where: { brandId: brand.id },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        brand: true,
        offers: { include: { seller: true } },
      },
    });

    const productsSorted = sortProductsByCheapest(
      getProductsWithPriceChange(getProductPriceMedian(products)),
    );

    res.json({ ...brand, products: productsSorted });
  } catch (err) {
    next(err);
  }
});

export default router;
