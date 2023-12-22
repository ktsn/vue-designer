import { install } from 'sinai'
import { expect, vitest } from 'vitest'

// @ts-expect-error
import beautify from 'pretty'

// https://github.com/vitest-dev/vitest/issues/1700#issuecomment-1222959153
vitest.mock('vue', async () => {
  const Vue = (await vitest.importActual('vue')) as any

  Vue.default.config.productionTip = false
  Vue.default.config.devtools = false

  Vue.default.use(install)

  return Vue
})

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
