import { AssetResolver } from '@/asset-resolver'

describe('AssetResolver', () => {
  const asset = new AssetResolver()

  it('convers path to url', () => {
    const url = asset.pathToUrl('../assets/logo.png', '/path/to/components')
    expect(url).toBe(
      '/assets?path=' + encodeURIComponent('/path/to/assets/logo.png')
    )
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
