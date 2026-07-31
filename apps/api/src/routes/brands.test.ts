import request from 'supertest'
import { app } from '../app.js'
import { prisma } from '@energyradar/db'

vi.mock('pino-http', () => ({
  pinoHttp: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}))

vi.mock('@energyradar/db', () => ({
  prisma: {
    brand: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
    },
  },
}))

describe('GET /api/v1/brands', () => {
  it('returns list of brands', async () => {
    const mockBrands = [
      {
        id: '1',
        name: 'RedBull',
        slug: 'redbull',
        products: [],
      },
      {
        id: '2',
        name: 'Monster',
        slug: 'monster',
        products: [],
      },
    ] as unknown as Awaited<ReturnType<typeof prisma.brand.findMany>>

    vi.mocked(prisma.brand.findMany).mockResolvedValue(mockBrands)

    const res = await request(app).get('/api/v1/brands')
    expect(res.status).toBe(200)
    expect(res.body).toEqual(mockBrands)
  })

  it('no brands available', async () => {
    vi.mocked(prisma.brand.findMany).mockResolvedValue([])
    const res = await request(app).get('/api/v1/brands')
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ msg: 'No Brand found' })
  })

  it('prisma.brand.findMany rejected', async () => {
    vi.mocked(prisma.brand.findMany).mockRejectedValue(new Error('DB down'))
    const res = await request(app).get('/api/v1/brands')
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ msg: 'DB down' })
  })
})

describe('GET /api/v1/brands/:brandSlug', () => {
  it('get brand by id', async () => {
    const brand = {
      id: '1',
      name: 'RedBull',
      slug: 'redbull',
    } as Awaited<ReturnType<typeof prisma.brand.findUnique>>

    const products = [
      {
        id: '1',
        name: 'RedBull Energy Drink',
        slug: 'redbull-energy-drink',
        imageUrl: null,
        brand: 'RedBull',
        offers: [
          {
            id: '1',
            price: 2.5,
            priceChange: 0,
            seller: {
              id: '1',
              name: 'Edeka',
              slug: 'edeka',
            },
          },
        ],
      },
      {
        id: '2',
        name: 'RedBull Sugarfree',
        slug: 'redbull-sugarfree',
        imageUrl: null,
        brand: 'RedBull',
        offers: [
          {
            id: '2',
            price: 2.0,
            priceChange: 0,
            seller: {
              id: '2',
              name: 'Aldi',
              slug: 'aldi',
            },
          },
        ],
      },
    ] as unknown as Awaited<ReturnType<typeof prisma.product.findMany>>

    const expectedBrand = {
      id: '1',
      name: 'RedBull',
      slug: 'redbull',
    } as Awaited<ReturnType<typeof prisma.brand.findUnique>>

    const expectedProducts = [
      {
        id: '1',
        name: 'RedBull Energy Drink',
        slug: 'redbull-energy-drink',
        imageUrl: null,
        brand: 'RedBull',
        change: 0,
        median: 2.5,
        price: '2.50',
        sellerCount: 1,
        bestOfferId: '1',
      },
      {
        id: '2',
        name: 'RedBull Sugarfree',
        slug: 'redbull-sugarfree',
        imageUrl: null,
        brand: 'RedBull',
        change: 0,
        median: 2.0,
        price: '2.00',
        sellerCount: 1,
        bestOfferId: '2',
      },
    ] as unknown as Awaited<ReturnType<typeof prisma.product.findMany>>

    vi.mocked(prisma.brand.findUnique).mockResolvedValue(brand)
    vi.mocked(prisma.product.findMany).mockResolvedValue(products)

    const result = await request(app).get('/api/v1/brands/RedBull')
    expect(result.status).toBe(200)
    expect(result.body).toEqual({ ...expectedBrand, products: expectedProducts })
  })

  it('not existing brand', async () => {
    vi.mocked(prisma.brand.findUnique).mockResolvedValue(null)

    const response = await request(app).get('/api/v1/brands/RedBull')
    expect(response.status).toBe(404)
    expect(prisma.product.findMany).not.toHaveBeenCalled()
  })

  it('called slug is received slug', async () => {
    const brand = {
      id: '1',
      name: 'RedBull',
      slug: 'redbull',
    } as Awaited<ReturnType<typeof prisma.brand.findUnique>>

    vi.mocked(prisma.brand.findUnique).mockResolvedValue(brand)
    vi.mocked(prisma.product.findMany).mockResolvedValue([])

    await request(app).get('/api/v1/brands/RedBull')
    expect(prisma.brand.findUnique).toHaveBeenCalledWith({
      where: {
        slug: 'RedBull',
      },
    })
  })

  it('brand.findUnique rejected', async () => {
    vi.mocked(prisma.brand.findUnique).mockRejectedValue(new Error('DB down'))
    const response = await request(app).get('/api/v1/brands/RedBull')
    expect(response.status).toBe(500)
    expect(response.body).toEqual({ msg: 'DB down' })
  })

  it('product.findMany rejected', async () => {
    const brand = {
      id: '1',
      name: 'RedBull',
      slug: 'redbull',
    } as Awaited<ReturnType<typeof prisma.brand.findUnique>>

    vi.mocked(prisma.brand.findUnique).mockResolvedValue(brand)
    vi.mocked(prisma.product.findMany).mockRejectedValue(new Error('DB down'))
    const response = await request(app).get('/api/v1/brands/RedBull')
    expect(response.status).toBe(500)
    expect(response.body).toEqual({ msg: 'DB down' })
  })
})
