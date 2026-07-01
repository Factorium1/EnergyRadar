import express, { Router } from 'express';
import { prisma } from '../../lib/prisma.js';

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
      include: {
        products: true,
      },
    });

    if (!brand) {
      const error: Error & { status?: number } = new Error('No Brand found');
      error.status = 404;
      next(error);
    }

    res.json(brand);
  } catch (err) {
    next(err);
  }
});

export default router;
