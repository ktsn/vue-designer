import { AssetResolver } from '@/asset-resolver'

describe('AssetResolver', () => {
  const asset = new AssetResolver()

  it('converts path to url', () => {
    const url = asset.pathToUrl('../assets/logo.png', '/path/to/components')
    expect(url).toBe(
      '/assets?path=' + encodeURIComponent('/path/to/assets/logo.png')
    )
  })

  it('should not convert url', () => {
    const value = 'https://example.com/logo.png'
    const url = asset.pathToUrl(value, '/path/to/components')
    expect(url).toBe(value)
  })

  it('convers url to path', () => {
    const expected = '/path/to/assets/logo.png'
    const path = asset.urlToPath('/assets?path=' + encodeURIComponent(expected))
    expect(path).toBe(expected)
  })

  it('returns null if invalid format', () => {
    const invalidEndpoint = asset.urlToPath(
      '/assets/foo?path=' + encodeURIComponent('/logo.png')
    )
    expect(invalidEndpoint).toBe(null)

    const noPath = asset.urlToPath(
      '/assets?test=' + encodeURIComponent('/logo.png')
    )
    expect(noPath).toBe(null)
  })
})
