import express, { Router } from 'express';
import { prisma } from '@energyradar/db';
import {
  buildPriceTimeline,
  getProductPriceMedian,
  getProductsWithPriceChange,
} from '../../lib/helper/productPrice.js';

const router: Router = express.Router();

const TIMELINE_DAYS = 30;

router.get('/:productSlug', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: {
        slug: req.params.productSlug,
      },
      include: {
        brand: true,
        offers: {
          include: { seller: true },
          orderBy: { price: 'asc' },
        },
      },
    });

    if (!product) {
      const error: Error & { status?: number } = new Error(
        `Product ${req.params.productSlug} not Found`,
      );
      error.status = 404;
      return next(error);
    }

    const history = await prisma.priceHistory.findMany({
      where: { productId: product.id },
      select: {
        price: true,
        recordedAt: true,
        sellerId: true,
        inStock: true,
      },
      orderBy: { recordedAt: 'asc' },
    });

    const [productWithChange] = getProductsWithPriceChange(
      getProductPriceMedian([product]),
    );

    res.json({
      ...productWithChange,
      priceTimeline: buildPriceTimeline(history, TIMELINE_DAYS),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
