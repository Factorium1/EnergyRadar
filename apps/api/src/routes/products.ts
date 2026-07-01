import express, { Router } from 'express';
import { prisma } from '../../lib/prisma.js';

const router: Router = express.Router();

router.get('/:productSlug', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: {
        slug: req.params.productSlug,
      },
    });

    if (!product) {
      const error: Error & { status?: number } = new Error(
        `Product ${req.params.productSlug} not Found`,
      );
      error.status = 404;
      next(error);
    }

    res.json(product);
  } catch (err) {
    next(err);
  }
});

export default router;
