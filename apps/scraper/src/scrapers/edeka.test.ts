vi.mock('../lib/helper/request.js', () => ({
  fetchHtml: vi.fn(),
  politeDelay: vi.fn().mockResolvedValue(undefined),
}))

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

import { fetchHtml } from '../lib/helper/request.js'
import { getEdekaData } from './edeka.js'

const emptyListPageHtml = `<div></div>`

function productHtml({
  title = 'Red Bull Energy Drink 250ml',
  href = '/produkt/123',
  price = '1,49 €',
  priceNote = '5,96 €/l',
}: {
  title?: string
  href?: string
  price?: string
  priceNote?: string
} = {}) {
  return `
    <div class="product-details">
      <a class="title" href="${href}"><h2>${title}</h2></a>
      <span class="price">${price}</span>
      <span class="price-note">${priceNote}</span>
    </div>
    `
}

const emptyDetailPageHtml = `<div class="article-long-description"></div>`

describe('getEdekaData', () => {
  it('parses a product from a list page + detail page', async () => {
    const detailPageHtml = `
      <table class="nutrient-table">
        <tr><th>Brennwert in kcal</th><td>43</td></tr>
        <tr><th>Davon Zucker in g</th><td>10,5</td></tr>
      </table>
      <div class="article-long-description">Koffein 32 mg / 100 ml</div>
    `

    vi.mocked(fetchHtml)
      .mockResolvedValueOnce(productHtml())
      .mockResolvedValueOnce(emptyListPageHtml)
      .mockResolvedValueOnce(detailPageHtml)

    const result = await getEdekaData()

    expect(result).toEqual([
      expect.objectContaining({
        title: 'Red Bull Energy Drink 250ml',
        url: '/produkt/123',
        price: 1.49,
        pricePerLiter: 5.96,
        canSizeMl: 250,
        kcal: 43,
        sugar: 10.5,
        coffein: 32,
      }),
    ])
  })

  it('fetches both list pages and one detail page per product, in order', async () => {
    vi.mocked(fetchHtml)
      .mockResolvedValueOnce(productHtml({ title: 'Red Bull Drink', href: '/produkt/1' }))
      .mockResolvedValueOnce(productHtml({ title: 'Monster Drink', href: '/produkt/2' }))
      .mockResolvedValueOnce(emptyDetailPageHtml)
      .mockResolvedValueOnce(emptyDetailPageHtml)

    const result = await getEdekaData()

    expect(result).toHaveLength(2)
    expect(fetchHtml).toHaveBeenNthCalledWith(
      1,
      'https://www.edeka24.de/Lebensmittel/Getraenke/Energydrinks/',
    )
    expect(fetchHtml).toHaveBeenNthCalledWith(
      2,
      'https://www.edeka24.de/Lebensmittel/Getraenke/Energydrinks/?pgNr=1',
    )
    expect(fetchHtml).toHaveBeenNthCalledWith(3, '/produkt/1')
    expect(fetchHtml).toHaveBeenNthCalledWith(4, '/produkt/2')
  })

  it('pricePerLiter and canSizeMl are null when the price note has no €/l match', async () => {
    vi.mocked(fetchHtml)
      .mockResolvedValueOnce(productHtml({ priceNote: 'Grundpreis nicht verfügbar' }))
      .mockResolvedValueOnce(emptyListPageHtml)
      .mockResolvedValueOnce(emptyDetailPageHtml)

    const result = await getEdekaData()

    expect(result[0]).toEqual(
      expect.objectContaining({
        pricePerLiter: null,
        canSizeMl: null,
      }),
    )
  })

  it('keeps a product with empty title and price, defaults price to 0, then filters it out for having no known brand', async () => {
    vi.mocked(fetchHtml)
      .mockResolvedValueOnce(productHtml({ title: '', price: '' }))
      .mockResolvedValueOnce(emptyListPageHtml)
      .mockResolvedValueOnce(emptyDetailPageHtml)

    const result = await getEdekaData()

    expect(result).toEqual([])
  })

  it('filters out a product whose title has no known brand', async () => {
    vi.mocked(fetchHtml)
      .mockResolvedValueOnce(productHtml({ title: 'No Name Energy Drink' }))
      .mockResolvedValueOnce(emptyListPageHtml)
      .mockResolvedValueOnce(emptyDetailPageHtml)

    const result = await getEdekaData()

    expect(result).toEqual([])
  })

  it('nutrition fields are null when the detail page has no data for them', async () => {
    vi.mocked(fetchHtml)
      .mockResolvedValueOnce(productHtml())
      .mockResolvedValueOnce(emptyListPageHtml)
      .mockResolvedValueOnce(emptyDetailPageHtml)

    const result = await getEdekaData()

    expect(result[0]).toEqual(
      expect.objectContaining({
        kcal: null,
        sugar: null,
        kohlenhydrate: null,
        coffein: null,
        taurin: null,
      }),
    )
  })

  it('returns an empty array and skips detail page fetches when both list pages have no products', async () => {
    vi.mocked(fetchHtml)
      .mockResolvedValueOnce(emptyListPageHtml)
      .mockResolvedValueOnce(emptyListPageHtml)

    const result = await getEdekaData()

    expect(result).toEqual([])
    expect(fetchHtml).toHaveBeenCalledTimes(2)
  })

  it('propagates an error when fetching a list page fails', async () => {
    vi.mocked(fetchHtml).mockRejectedValueOnce(new Error('HTTP 500: Internal Server Error'))

    await expect(getEdekaData()).rejects.toThrow('HTTP 500: Internal Server Error')
  })
})
