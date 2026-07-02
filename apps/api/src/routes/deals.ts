import express, { Router } from 'express';
import { prisma } from '../../lib/prisma.js';

const router: Router = express.Router();

router.get('/', async (req, res, next) => {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
      brand: true,
      priceHistory: true,
    },
  });

  const productsWithMedian = products.map((product) => {
    const sortedHistory = product.priceHistory.sort(
      (a, b) => Number(a.price) - Number(b.price),
    );
    const median =
      sortedHistory.length % 2 === 0
        ? sortedHistory[sortedHistory.length / 2]?.price
        : sortedHistory[(sortedHistory.length - 1) / 2]?.price;

    return {
      ...product,
      priceHistory: sortedHistory,
      median: Number(median),
      price: sortedHistory[0]?.price.toFixed(2),
    };
  });

  const productsWithChange = productsWithMedian.map((product) => {
    return {
      ...product,
      change: Number(
        (
          Number(product.median) - Number(product.priceHistory[0]?.price)
        ).toFixed(2),
      ),
    };
  });

  const productsSorted = () => {
    const sorted = productsWithChange.sort(
      (a, b) => Number(b.change) - Number(a.change),
    );
    return sorted.map(({ priceHistory, ...withoutHistory }) => withoutHistory);
  };

  res.json(productsSorted());
});

export default router;
