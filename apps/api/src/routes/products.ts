import express, { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import {
  getProductPriceMedian,
  getProductsWithPriceChange,
} from '../../lib/helper/productPrice.js';

const router: Router = express.Router();

router.get('/:productSlug', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: {
        slug: req.params.productSlug,
      },
      include: {
        brand: true,
        priceHistory: true,
      },
    });

    if (!product) {
      const error: Error & { status?: number } = new Error(
        `Product ${req.params.productSlug} not Found`,
      );
      error.status = 404;
      return next(error);
    }

    const [productWithChange] = getProductsWithPriceChange(
      getProductPriceMedian([product]),
    );

    res.json(productWithChange);
  } catch (err) {
    next(err);
  }
});

export default router;
