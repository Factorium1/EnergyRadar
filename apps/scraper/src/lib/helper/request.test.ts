import { fetchHtml } from './request.js'

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchHtml', () => {
  it('returns the response body on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<html></html>'),
    } as Response)

    const result = await fetchHtml('https://example.com')
    expect(result).toBe('<html></html>')
  })

  it('sends a User-Agent and Accept-Language header', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<html></html>'),
    } as Response)

    await fetchHtml('https://example.com')

    expect(fetch).toHaveBeenCalledWith('https://example.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'de-DE,de;q=0.9',
      },
    })
  })

  it('throws with status and statusText when the response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response)

    await expect(fetchHtml('https://example.com')).rejects.toThrow(
      'HTTP 500: Internal Server Error',
    )
  })

  it('propagates a network error', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network down'))

    await expect(fetchHtml('https://example.com')).rejects.toThrow('network down')
  })
})
