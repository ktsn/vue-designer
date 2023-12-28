import { expect } from 'vitest'

// @ts-expect-error
import beautify from 'pretty'

/*
 * Prettify Vue component html snapshots
 */

const isHtmlString = (received: unknown): boolean =>
  !!received && typeof received === 'string' && received[0] === '<'

const removeServerRenderedText = (html: string) =>
  html.replace(/ data-server-rendered="true"/, '')

const removeDataTestAttributes = (html: string) =>
  html.replace(/ data-test="[-\w]+"/g, '')

const removeVueScopeIdAttributes = (html: string) =>
  html.replace(/ data-v-[\w]+(="[^"]*")?/g, '')

expect.addSnapshotSerializer({
  test(received: unknown): boolean {
    return isHtmlString(received)
  },
  print(received: any): string {
    let html = received ?? ''
    html = removeServerRenderedText(html)
    html = removeDataTestAttributes(html)
    html = removeVueScopeIdAttributes(html)
    return beautify(html, { indent_size: 2 })
  },
})
