import { URL } from 'url'
import path from 'path'

export const assetsEndpoint = '/assets'

export class AssetResolver {
  pathToUrl(assetPath: string, basePath: string): string {
    const resolved = path.resolve(basePath, assetPath)
    return assetsEndpoint + '?path=' + encodeURIComponent(resolved)
  }

  urlToPath(assetUrl: string): string | null {
    const url = new URL(assetUrl, 'file://')
    if (url.pathname !== assetsEndpoint) {
      return null
    }

    const assetPath = url.searchParams.get('path')
    return assetPath && decodeURIComponent(assetPath)
  }
}
