import { AssetResolver } from '@/asset-resolver'
import { createTemplate, h, a } from '../../helpers/template'
import { resolveAsset } from '@/parser/template/manipulate'
import { Element } from '@/parser/template/types'

describe('Template asset resolution', () => {
  const basePath = '/path/to/component'
  const asset = new AssetResolver()

  it('resolves all src paths on img elements', () => {
    const template = createTemplate([
      h('img', [a('src', '../assets/logo.png'), a('alt', 'test')], [])
    ])

    const resolved = resolveAsset(template, basePath, asset)
    const img = resolved.children[0] as Element
    const attrs = img.startTag.attributes

    expect(img.name).toBe('img')
    expect(Object.keys(attrs).length).toBe(2)

    // should convert src value
    expect(attrs.src.value).toBe(
      '/assets?path=' + encodeURIComponent('/path/to/assets/logo.png')
    )

    // should not touch other attribute
    expect(attrs.alt.value).toBe('test')
  })
})
