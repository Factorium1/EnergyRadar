import {
  buildPriceTimeline,
  getProductPriceMedian,
  getProductsWithPriceChange,
  sortProductsByCheapest,
} from './productPrice.js'

function makeProduct({
  offers,
  median,
  price,
}: {
  offers?: { id: string; price: number; inStock: boolean }[]
  median?: number | null
  price?: number | null
}) {
  return [{ id: '1', offers, median, price }]
}

const oddOffers = makeProduct({
  offers: [
    { id: 'o1', price: 10, inStock: true },
    { id: 'o2', price: 20, inStock: true },
    { id: 'o3', price: 30, inStock: true },
  ],
}) as unknown as Parameters<typeof getProductPriceMedian>[0]

const evenOffers = makeProduct({
  offers: [
    { id: 'o1', price: 10, inStock: true },
    { id: 'o2', price: 20, inStock: true },
  ],
}) as unknown as Parameters<typeof getProductPriceMedian>[0]

const outOfStockOffers = makeProduct({
  offers: [
    { id: 'o1', price: 10, inStock: false },
    { id: 'o2', price: 20, inStock: false },
  ],
}) as unknown as Parameters<typeof getProductPriceMedian>[0]

const offer = makeProduct({
  offers: [
    { id: 'o1', price: 10, inStock: false },
    { id: 'o2', price: 20, inStock: true },
    { id: 'o3', price: 30, inStock: false },
    { id: 'o4', price: 40, inStock: true },
  ],
}) as unknown as Parameters<typeof getProductPriceMedian>[0]

const oneOffer = makeProduct({
  offers: [{ id: 'o1', price: 10, inStock: false }],
}) as unknown as Parameters<typeof getProductPriceMedian>[0]

const noOffer = makeProduct({ offers: [] }) as unknown as Parameters<
  typeof getProductPriceMedian
>[0]

describe('getProductPriceMedian', () => {
  it('calc median with odd amount of offers', () => {
    const [result] = getProductPriceMedian(oddOffers)
    expect(result!.median).toBe(20)
  })

  it('calc median wit even amount of offers', () => {
    const [result] = getProductPriceMedian(evenOffers)
    expect(result!.median).toBe(15)
  })

  it('calc median with no offer in stock', () => {
    const [result] = getProductPriceMedian(outOfStockOffers)
    expect(result!.median).toBe(15)
  })

  it('calc median with oneOffer', () => {
    const [result] = getProductPriceMedian(oneOffer)
    expect(result!.median).toBe(10)
  })

  it('calc median with no offer', () => {
    const [result] = getProductPriceMedian(noOffer)
    expect(result!.median).toBe(0)
    expect(result!.price).toBe(null)
    expect(result!.bestOfferId).toBe(null)
  })

  it('calc median', () => {
    const [result] = getProductPriceMedian(offer)
    expect(result!.median).toBe(25)
  })

  it('picks the cheapest in-stock offer as best price, keeps offers sorted by price', () => {
    const [result] = getProductPriceMedian(offer)
    expect(result!.offers.map((o) => o.id)).toEqual(['o1', 'o2', 'o3', 'o4'])
    expect(result!.price).toBe('20.00')
    expect(result!.bestOfferId).toBe('o2')
    expect(result!.sellerCount).toBe(4)
  })

  it('falls back to the cheapest offer overall when none are in stock', () => {
    const [result] = getProductPriceMedian(outOfStockOffers)
    expect(result!.price).toBe('10.00')
    expect(result!.bestOfferId).toBe('o1')
  })
})

const normalProduct = makeProduct({ median: 20, price: 10 }) as unknown as ReturnType<
  typeof getProductPriceMedian
>

const nullPrice = makeProduct({ median: 20, price: null }) as unknown as ReturnType<
  typeof getProductPriceMedian
>

const zeroMedian = makeProduct({ median: 0, price: 10 }) as unknown as ReturnType<
  typeof getProductPriceMedian
>

describe('getProductsWithPriceChange', () => {
  it('calc pice change', () => {
    const [result] = getProductsWithPriceChange(normalProduct)
    expect(result!.change).toBe(10)
  })

  it('calc price change with price is null', () => {
    const [result] = getProductsWithPriceChange(nullPrice)
    expect(result!.change).toBe(20)
  })

  it('calc price change with median is 0', () => {
    const [result] = getProductsWithPriceChange(zeroMedian)
    expect(result!.change).toBe(-10)
  })
})

const oneDayInMs = 24 * 60 * 60 * 1000
function subtractDaysFromNow(days: number) {
  return new Date(Date.now() - oneDayInMs * days)
}

describe('buildPriceTimeline', () => {
  const priceRow = [
    {
      price: 20,
      recordedAt: subtractDaysFromNow(0),
      inStock: true,
      sellerId: '1',
    },
    {
      price: 15,
      recordedAt: subtractDaysFromNow(1),
      inStock: true,
      sellerId: '2',
    },
    {
      price: 5,
      recordedAt: subtractDaysFromNow(2),
      inStock: false,
      sellerId: '4',
    },
    {
      price: 10,
      recordedAt: subtractDaysFromNow(2),
      inStock: true,
      sellerId: '3',
    },
    {
      price: 25,
      recordedAt: subtractDaysFromNow(5),
      inStock: true,
      sellerId: '5',
    },
    {
      price: 5,
      recordedAt: subtractDaysFromNow(5),
      inStock: true,
      sellerId: '4',
    },
  ] as Parameters<typeof buildPriceTimeline>[0]

  it('normal data', () => {
    const expectedPriceRow = [
      {
        date: new Date(subtractDaysFromNow(3).setUTCHours(0, 0, 0, 0)).toISOString(),
        price: 5,
        sellerCount: 2,
      },
      {
        date: new Date(subtractDaysFromNow(2).setUTCHours(0, 0, 0, 0)).toISOString(),
        price: 10,
        sellerCount: 3,
      },
      {
        date: new Date(subtractDaysFromNow(1).setUTCHours(0, 0, 0, 0)).toISOString(),
        price: 10,
        sellerCount: 4,
      },
      {
        date: new Date(subtractDaysFromNow(0).setUTCHours(0, 0, 0, 0)).toISOString(),
        price: 10,
        sellerCount: 5,
      },
    ] as ReturnType<typeof buildPriceTimeline>

    const timeline = buildPriceTimeline(priceRow, 4)
    expect(timeline).toStrictEqual(expectedPriceRow)
  })

  it('empty input data', () => {
    const emptyHistory = [] as Parameters<typeof buildPriceTimeline>[0]
    const timeline = buildPriceTimeline(emptyHistory)
    expect(timeline).toEqual([])
  })

  it('input days as 0', () => {
    const timeline = buildPriceTimeline(priceRow, 0)
    expect(timeline).toEqual([])
  })

  it('input only before days window', () => {
    const pastPriceRow = [
      {
        price: 20,
        recordedAt: subtractDaysFromNow(5),
        inStock: true,
        sellerId: '1',
      },
      {
        price: 15,
        recordedAt: subtractDaysFromNow(8),
        inStock: true,
        sellerId: '2',
      },
      {
        price: 5,
        recordedAt: subtractDaysFromNow(9),
        inStock: false,
        sellerId: '4',
      },
      {
        price: 10,
        recordedAt: subtractDaysFromNow(12),
        inStock: true,
        sellerId: '3',
      },
      {
        price: 25,
        recordedAt: subtractDaysFromNow(15),
        inStock: true,
        sellerId: '5',
      },
      {
        price: 5,
        recordedAt: subtractDaysFromNow(15),
        inStock: true,
        sellerId: '4',
      },
    ] as Parameters<typeof buildPriceTimeline>[0]

    const expectedPriceRow = [
      {
        date: new Date(subtractDaysFromNow(1).setUTCHours(0, 0, 0, 0)).toISOString(),
        price: 10,
        sellerCount: 5,
      },
      {
        date: new Date(subtractDaysFromNow(0).setUTCHours(0, 0, 0, 0)).toISOString(),
        price: 10,
        sellerCount: 5,
      },
    ] as ReturnType<typeof buildPriceTimeline>

    const timeline = buildPriceTimeline(pastPriceRow, 2)
    expect(timeline).toStrictEqual(expectedPriceRow)
  })

  it('sorts unsorted input by recordedAt before folding it into the timeline', () => {
    const shuffled = [...priceRow].reverse()
    const timeline = buildPriceTimeline(shuffled, 4)
    expect(timeline).toStrictEqual(buildPriceTimeline(priceRow, 4))
  })

  it('falls back to the cheapest known price when every seller is out of stock', () => {
    const allOutOfStockRow = [
      {
        price: 10,
        recordedAt: subtractDaysFromNow(5),
        inStock: true,
        sellerId: '1',
      },
      {
        price: 8,
        recordedAt: subtractDaysFromNow(3),
        inStock: false,
        sellerId: '1',
      },
    ] as Parameters<typeof buildPriceTimeline>[0]

    const expectedTimeline = [
      {
        date: new Date(subtractDaysFromNow(1).setUTCHours(0, 0, 0, 0)).toISOString(),
        price: 8,
        sellerCount: 1,
      },
      {
        date: new Date(subtractDaysFromNow(0).setUTCHours(0, 0, 0, 0)).toISOString(),
        price: 8,
        sellerCount: 1,
      },
    ] as ReturnType<typeof buildPriceTimeline>

    const timeline = buildPriceTimeline(allOutOfStockRow, 2)
    expect(timeline).toStrictEqual(expectedTimeline)
  })
})

describe('sortProductsByCheapest', () => {
  it('empty products input', () => {
    const products = [] as Parameters<typeof sortProductsByCheapest>[0]
    const result = sortProductsByCheapest(products)
    expect(result).toEqual([])
  })

  it('correct sorted', () => {
    const products = [
      {
        median: 20,
        change: -5,
      },
      {
        median: 20,
        change: 8,
      },
      {
        median: 10,
        change: 20,
      },
    ] as ReturnType<typeof getProductsWithPriceChange>

    const sortedProducts = [
      {
        median: 10,
        change: 20,
      },
      {
        median: 20,
        change: 8,
      },
      {
        median: 20,
        change: -5,
      },
    ] as ReturnType<typeof sortProductsByCheapest>

    const result = sortProductsByCheapest(products)
    expect(result).toStrictEqual(sortedProducts)
  })

  it('median 0', () => {
    const products = [
      {
        median: 0,
        change: 2,
      },
      {
        median: 20,
        change: 5,
      },
    ] as ReturnType<typeof getProductsWithPriceChange>

    const sortedProducts = [
      {
        median: 20,
        change: 5,
      },
      {
        median: 0,
        change: 2,
      },
    ] as ReturnType<typeof getProductsWithPriceChange>

    const result = sortProductsByCheapest(products)
    expect(result).toStrictEqual(sortedProducts)
  })

  it('strips offers from the returned products', () => {
    const products = [
      {
        median: 10,
        change: 5,
        offers: [{ id: 'o1', price: 10, inStock: true }],
      },
    ] as unknown as Parameters<typeof sortProductsByCheapest>[0]

    const [result] = sortProductsByCheapest(products)
    expect(result).not.toHaveProperty('offers')
    expect(result).toEqual({ median: 10, change: 5 })
  })
})
