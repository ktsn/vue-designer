import { URL } from 'url'
import path from 'path'

const assetsEndpoint = '/assets'

// https://tools.ietf.org/html/rfc3986#section-3.1
const uriRegExp = /^\w[\w\d+-.]*:/

export class AssetResolver {
  pathToUrl(assetPath: string, basePath: string): string {
    // If it is full url, don't try to resolve it
    if (uriRegExp.test(assetPath)) {
      return assetPath
    }

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
