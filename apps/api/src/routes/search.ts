import express, { Router } from 'express';
import { prisma } from '../../lib/prisma.js';

const router: Router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const query = req.query.q;

    if (typeof query !== 'string' || query.trim() === '') {
      const error: Error & { status?: number } = new Error(
        'Search query q is required',
      );
      error.status = 400;
      return next(error);
    }

    const words = query.split(' ');

    const products = await prisma.product.findMany({
      where: {
        AND: words.map((word) => {
          const volumeMatch = word.includes('ml');
          if (volumeMatch && Number(word.split('ml')[0])) {
            return { volumeMl: Number(word.split('ml')[0]) };
          }

          if (Number(word)) {
            return { volumeMl: Number(word) };
          }

          return {
            OR: [
              { name: { contains: word, mode: 'insensitive' } },
              { line: { contains: word, mode: 'insensitive' } },
              { brand: { name: { contains: word, mode: 'insensitive' } } },
            ],
          };
        }),
      },
      include: {
        brand: true,
      },
    });

    res.json(products);
  } catch (err) {
    next(err);
  }
});

export default router;
