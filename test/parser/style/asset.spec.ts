import { AssetResolver } from '@/asset-resolver'
import { createStyle, rule, selector, declaration } from '../../helpers/style'
import { resolveAsset } from '@/parser/style/manipulate'
import { Rule } from '@/parser/style/types'

describe('Style asset resolution', () => {
  const basePath = '/path/to/components'
  const asset = new AssetResolver()

  it('resolves assets in url function', () => {
    const style = createStyle([
      rule(
        [selector({ tag: 'p' })],
        [declaration('background', 'url(../assets/bg.png)')]
      )
    ])

    const resolved = resolveAsset(style, basePath, asset)
    const decl = (resolved.body[0] as Rule).declarations[0]
    expect(decl.prop).toBe('background')
    expect(decl.value).toBe(
      'url("/assets?path=' + encodeURIComponent('/path/to/assets/bg.png') + '")'
    )
  })

  it('resolves url function with other kind of values', () => {
    const style = createStyle([
      rule(
        [selector({ tag: 'p' })],
        [
          declaration('font-size', '18px'),
          declaration(
            'background',
            'cyan url("../assets/bg.png") repeat, url("test/icon.gif") no-repeat'
          )
        ]
      )
    ])

    const resolved = resolveAsset(style, basePath, asset)
    const decls = (resolved.body[0] as Rule).declarations
    expect(decls.length).toBe(2)
    expect(decls[0].prop).toBe('font-size')
    expect(decls[0].value).toBe('18px')
    expect(decls[1].prop).toBe('background')
    expect(decls[1].value).toBe(
      'cyan url("/assets?path=' +
        encodeURIComponent('/path/to/assets/bg.png') +
        '") repeat, ' +
        'url("/assets?path=' +
        encodeURIComponent('/path/to/components/test/icon.gif') +
        '") no-repeat'
    )
  })
})
