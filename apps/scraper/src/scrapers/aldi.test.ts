vi.mock('../lib/helper/request.js', () => ({
  fetchHtml: vi.fn(),
  politeDelay: vi.fn().mockResolvedValue(undefined),
}))

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

import { fetchHtml } from '../lib/helper/request.js'
import { getAldiData } from './aldi.js'

describe('getAldiData', () => {
  it('parses a product from search + detail page', async () => {
    const searchPageHtml = `
      <div data-test="product-tile" class="product-tile">
        <div data-test="product-tile__name">
          <p>Energy Drink 250ml</p>
        </div>
        <div data-test="product-tile__brandname">
          <p>Red Bull</p>
        </div>
        <a class="product-tile__link" href="/produkt/123"></a>
        <div class="base-price__regular">
          <span>1,49 €</span>
        </div>
        <div data-test="product-tile__comparison-price">
          <p>5,96 €/1 l</p>
        </div>
        <div data-test="product-tile__unit-of-measurement">
          <p>0,25 l</p>
        </div>
      </div>
      `

    const detailPageHtml = `
      <div class="product-details">
        <table class="table">
          <tbody>
            <tr>
              <td>Energie [kcal]</td>
              <td>45</td>
            </tr>
          </tbody>
        </table>
        Koffein 32 mg / 100 ml
      </div>
    `

    vi.mocked(fetchHtml).mockResolvedValueOnce(searchPageHtml).mockResolvedValueOnce(detailPageHtml)

    const result = await getAldiData()

    expect(result).toEqual([
      expect.objectContaining({
        title: 'Red Bull Energy Drink 250ml',
        price: 1.49,
        canSizeMl: 250,
        kcal: 45,
        coffein: 32,
      }),
    ])
  })

  it('no title and brand for item in search', async () => {
    const searchPageHtml = `
      <div data-test="product-tile" class="product-tile">
        <div data-test="product-tile__name">
        </div>
        <div data-test="product-tile__brandname">
        </div>
        <a class="product-tile__link" href="/produkt/123"></a>
        <div class="base-price__regular">
          <span>1,49 €</span>
        </div>
        <div data-test="product-tile__comparison-price">
          <p>5,96 €/1 l</p>
        </div>
        <div data-test="product-tile__unit-of-measurement">
          <p>0,25 l</p>
        </div>
      </div>
      `

    vi.mocked(fetchHtml).mockResolvedValueOnce(searchPageHtml)

    const result = await getAldiData()

    expect(result).toEqual([])
  })

  it('no price for item in search', async () => {
    const searchPageHtml = `
      <div data-test="product-tile" class="product-tile">
        <div data-test="product-tile__name">
          <p>Energy Drink 250ml</p>
        </div>
        <div data-test="product-tile__brandname">
          <p>Red Bull</p>
        </div>
        <a class="product-tile__link" href="/produkt/123"></a>
        <div class="base-price__regular">
        </div>
        <div data-test="product-tile__comparison-price">
          <p>5,96 €/1 l</p>
        </div>
        <div data-test="product-tile__unit-of-measurement">
          <p>0,25 l</p>
        </div>
      </div>
      `

    vi.mocked(fetchHtml).mockResolvedValueOnce(searchPageHtml)

    const result = await getAldiData()
    expect(result).toEqual([])
  })

  it('no title for item in search', async () => {
    const searchPageHtml = `
      <div data-test="product-tile" class="product-tile">
        <div data-test="product-tile__name">
        </div>
        <div data-test="product-tile__brandname">
          <p>Red Bull</p>
        </div>
        <a class="product-tile__link" href="/produkt/123"></a>
        <div class="base-price__regular">
          <span>1,49 €</span>
        </div>
        <div data-test="product-tile__comparison-price">
          <p>5,96 €/1 l</p>
        </div>
        <div data-test="product-tile__unit-of-measurement">
          <p>0,25 l</p>
        </div>
      </div>
      `

    const detailPageHtml = `
      <div class="product-details">
        <table class="table">
          <tbody>
            <tr>
              <td>Energie [kcal]</td>
              <td>45</td>
            </tr>
          </tbody>
        </table>
        Koffein 32 mg / 100 ml
      </div>
    `

    vi.mocked(fetchHtml).mockResolvedValueOnce(searchPageHtml).mockResolvedValueOnce(detailPageHtml)

    const result = await getAldiData()
    expect(result[0]?.title).toEqual('Red Bull ')
  })

  it('unknown brand', async () => {
    const searchPageHtml = `
      <div data-test="product-tile" class="product-tile">
        <div data-test="product-tile__name">
        </div>
        <div data-test="product-tile__brandname">
          <p>Unknown Brand</p>
        </div>
        <a class="product-tile__link" href="/produkt/123"></a>
        <div class="base-price__regular">
          <span>1,49 €</span>
        </div>
        <div data-test="product-tile__comparison-price">
          <p>5,96 €/1 l</p>
        </div>
        <div data-test="product-tile__unit-of-measurement">
          <p>0,25 l</p>
        </div>
      </div>
      `

    const detailPageHtml = `
      <div class="product-details">
        <table class="table">
          <tbody>
            <tr>
              <td>Energie [kcal]</td>
              <td>45</td>
            </tr>
          </tbody>
        </table>
        Koffein 32 mg / 100 ml
      </div>
    `

    vi.mocked(fetchHtml).mockResolvedValueOnce(searchPageHtml).mockResolvedValueOnce(detailPageHtml)

    const result = await getAldiData()
    expect(result).toEqual([])
  })

  it('title falls back to the name when there is no brandname', async () => {
    const searchPageHtml = `
      <div data-test="product-tile" class="product-tile">
        <div data-test="product-tile__name">
          <p>Red Bull Energy Drink 250ml</p>
        </div>
        <div data-test="product-tile__brandname">
        </div>
        <a class="product-tile__link" href="/produkt/123"></a>
        <div class="base-price__regular">
          <span>1,49 €</span>
        </div>
        <div data-test="product-tile__comparison-price">
          <p>5,96 €/1 l</p>
        </div>
        <div data-test="product-tile__unit-of-measurement">
          <p>0,25 l</p>
        </div>
      </div>
      `

    const detailPageHtml = `
      <div class="product-details">
        <table class="table">
          <tbody>
            <tr>
              <td>Energie [kcal]</td>
              <td>45</td>
            </tr>
          </tbody>
        </table>
      </div>
    `

    vi.mocked(fetchHtml).mockResolvedValueOnce(searchPageHtml).mockResolvedValueOnce(detailPageHtml)

    const result = await getAldiData()
    expect(result[0]?.title).toEqual('Red Bull Energy Drink 250ml')
  })

  it('prepends the base url to a relative link', async () => {
    const searchPageHtml = `
      <div data-test="product-tile" class="product-tile">
        <div data-test="product-tile__name">
          <p>Energy Drink 250ml</p>
        </div>
        <div data-test="product-tile__brandname">
          <p>Red Bull</p>
        </div>
        <a class="product-tile__link" href="/produkt/123"></a>
        <div class="base-price__regular">
          <span>1,49 €</span>
        </div>
        <div data-test="product-tile__comparison-price">
          <p>5,96 €/1 l</p>
        </div>
        <div data-test="product-tile__unit-of-measurement">
          <p>0,25 l</p>
        </div>
      </div>
      `

    const detailPageHtml = `<div class="product-details"></div>`

    vi.mocked(fetchHtml).mockResolvedValueOnce(searchPageHtml).mockResolvedValueOnce(detailPageHtml)

    const result = await getAldiData()
    expect(result[0]?.url).toEqual('https://www.aldi-sued.de/produkt/123')
  })

  it('keeps an already absolute link as is', async () => {
    const searchPageHtml = `
      <div data-test="product-tile" class="product-tile">
        <div data-test="product-tile__name">
          <p>Energy Drink 250ml</p>
        </div>
        <div data-test="product-tile__brandname">
          <p>Red Bull</p>
        </div>
        <a class="product-tile__link" href="https://www.aldi-sued.de/produkt/123"></a>
        <div class="base-price__regular">
          <span>1,49 €</span>
        </div>
        <div data-test="product-tile__comparison-price">
          <p>5,96 €/1 l</p>
        </div>
        <div data-test="product-tile__unit-of-measurement">
          <p>0,25 l</p>
        </div>
      </div>
      `

    const detailPageHtml = `<div class="product-details"></div>`

    vi.mocked(fetchHtml).mockResolvedValueOnce(searchPageHtml).mockResolvedValueOnce(detailPageHtml)

    const result = await getAldiData()
    expect(result[0]?.url).toEqual('https://www.aldi-sued.de/produkt/123')
  })

  it('canSizeMl is null when the unit of measurement is missing', async () => {
    const searchPageHtml = `
      <div data-test="product-tile" class="product-tile">
        <div data-test="product-tile__name">
          <p>Energy Drink 250ml</p>
        </div>
        <div data-test="product-tile__brandname">
          <p>Red Bull</p>
        </div>
        <a class="product-tile__link" href="/produkt/123"></a>
        <div class="base-price__regular">
          <span>1,49 €</span>
        </div>
        <div data-test="product-tile__comparison-price">
          <p>5,96 €/1 l</p>
        </div>
        <div data-test="product-tile__unit-of-measurement">
        </div>
      </div>
      `

    const detailPageHtml = `<div class="product-details"></div>`

    vi.mocked(fetchHtml).mockResolvedValueOnce(searchPageHtml).mockResolvedValueOnce(detailPageHtml)

    const result = await getAldiData()
    expect(result[0]?.canSizeMl).toBeNull()
  })

  it('nutrition fields are null when the detail page has no data for them', async () => {
    const searchPageHtml = `
      <div data-test="product-tile" class="product-tile">
        <div data-test="product-tile__name">
          <p>Energy Drink 250ml</p>
        </div>
        <div data-test="product-tile__brandname">
          <p>Red Bull</p>
        </div>
        <a class="product-tile__link" href="/produkt/123"></a>
        <div class="base-price__regular">
          <span>1,49 €</span>
        </div>
        <div data-test="product-tile__comparison-price">
          <p>5,96 €/1 l</p>
        </div>
        <div data-test="product-tile__unit-of-measurement">
          <p>0,25 l</p>
        </div>
      </div>
      `

    const detailPageHtml = `<div class="product-details"></div>`

    vi.mocked(fetchHtml).mockResolvedValueOnce(searchPageHtml).mockResolvedValueOnce(detailPageHtml)

    const result = await getAldiData()
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

  it('fetches one detail page per product, in order, for multiple products', async () => {
    const searchPageHtml = `
      <div data-test="product-tile" class="product-tile">
        <div data-test="product-tile__name"><p>Energy Drink 250ml</p></div>
        <div data-test="product-tile__brandname"><p>Red Bull</p></div>
        <a class="product-tile__link" href="/produkt/1"></a>
        <div class="base-price__regular"><span>1,49 €</span></div>
        <div data-test="product-tile__comparison-price"><p>5,96 €/1 l</p></div>
        <div data-test="product-tile__unit-of-measurement"><p>0,25 l</p></div>
      </div>
      <div data-test="product-tile" class="product-tile">
        <div data-test="product-tile__name"><p>Energy Drink 500ml</p></div>
        <div data-test="product-tile__brandname"><p>Monster</p></div>
        <a class="product-tile__link" href="/produkt/2"></a>
        <div class="base-price__regular"><span>2,49 €</span></div>
        <div data-test="product-tile__comparison-price"><p>4,98 €/1 l</p></div>
        <div data-test="product-tile__unit-of-measurement"><p>0,5 l</p></div>
      </div>
      `

    const detailPageHtml1 = `<div class="product-details"></div>`
    const detailPageHtml2 = `<div class="product-details"></div>`

    vi.mocked(fetchHtml)
      .mockResolvedValueOnce(searchPageHtml)
      .mockResolvedValueOnce(detailPageHtml1)
      .mockResolvedValueOnce(detailPageHtml2)

    const result = await getAldiData()

    expect(result).toHaveLength(2)
    expect(fetchHtml).toHaveBeenNthCalledWith(2, 'https://www.aldi-sued.de/produkt/1')
    expect(fetchHtml).toHaveBeenNthCalledWith(3, 'https://www.aldi-sued.de/produkt/2')
  })

  it('returns an empty array and skips detail page fetches when the search page has no products', async () => {
    vi.mocked(fetchHtml).mockResolvedValueOnce('<div></div>')

    const result = await getAldiData()

    expect(result).toEqual([])
    expect(fetchHtml).toHaveBeenCalledTimes(1)
  })

  it('propagates an error when fetching the search page fails', async () => {
    vi.mocked(fetchHtml).mockRejectedValueOnce(new Error('HTTP 500: Internal Server Error'))

    await expect(getAldiData()).rejects.toThrow('HTTP 500: Internal Server Error')
  })
})
