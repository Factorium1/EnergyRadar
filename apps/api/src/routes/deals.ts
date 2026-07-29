import express, { Router } from 'express'
import { prisma } from '@energyradar/db'
import {
  getProductPriceMedian,
  getProductsWithPriceChange,
  sortProductsByCheapest,
} from '../../lib/helper/productPrice.js'

const router: Router = express.Router()

router.get('/', async (req, res) => {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
      brand: true,
      offers: { include: { seller: true } },
    },
  })

  const productsWithMedian = getProductPriceMedian(products)

  const productsWithChange = getProductsWithPriceChange(productsWithMedian)

  const productsSorted = sortProductsByCheapest(productsWithChange)

  res.json(productsSorted)
})

export default router
