import {
  style,
  rule,
  selector,
  attribute,
  pClass,
  pElement,
  combinator,
  declaration,
  atRule
} from './style-helpers'
import { genStyle } from '@/parser/style-codegen'

describe('Style codegen', () => {
  it('should generate simple selector', () => {
    const ast = style([rule([selector({ tag: 'a' })])])
    const expected = 'a {}'

    expect(genStyle(ast)).toBe(expected)
  })

  it('should generate compound selector', () => {
    const ast = style([
      rule([
        selector({
          universal: true,
          class: ['foo', 'bar'],
          id: 'baz',
          attributes: [attribute('value', '=', 'text')],
          pseudoClass: [pClass('hover')],
          pseudoElement: pElement('before')
        })
      ])
    ])
    const expected = '*#baz.foo.bar[value="text"]:hover::before {}'

    expect(genStyle(ast)).toBe(expected)
  })

  it('should generate complex selector', () => {
    const ast = style([
      rule([
        selector({ tag: 'h1' }, combinator('>', selector({ class: ['test'] })))
      ])
    ])
    const expected = '.test > h1 {}'

    expect(genStyle(ast)).toBe(expected)
  })

  it('should generate selector list', () => {
    const ast = style([
      rule([selector({ tag: 'p' }), selector({ tag: 'strong' })])
    ])
    const expected = 'p, strong {}'

    expect(genStyle(ast)).toBe(expected)
  })

  it('should generate pseudo class params: selectors', () => {
    const ast = style([
      rule([
        selector({
          pseudoClass: [
            pClass('not', [
              selector({ class: ['bar'] }),
              selector({ tag: 'strong' })
            ])
          ]
        })
      ])
    ])
    const expected = ':not(.bar, strong) {}'

    expect(genStyle(ast)).toBe(expected)
  })

  it('should generate pseudo class params: string', () => {
    const ast = style([
      rule([
        selector({
          pseudoClass: [pClass('nth-child', [selector({ tag: '2n' })])]
        })
      ])
    ])
    const expected = ':nth-child(2n) {}'

    expect(genStyle(ast)).toBe(expected)
  })

  it('should generate pseudo class follows pseudo element', () => {
    const ast = style([
      rule([
        selector({
          pseudoElement: pElement('after', [pClass('hover')])
        })
      ])
    ])
    const expected = '::after:hover {}'

    expect(genStyle(ast)).toBe(expected)
  })

  it('should generate declarations', () => {
    const ast = style([
      rule(
        [selector({ tag: 'h1' })],
        [
          declaration('font-size', '22px'),
          declaration('font-weight', 'bold', true)
        ]
      )
    ])
    const expected = 'h1 {font-size: 22px; font-weight: bold !important;}'

    expect(genStyle(ast)).toBe(expected)
  })

  it('should generate at-rule: without children', () => {
    const ast = style([atRule('import', '"foo"')])
    const expected = '@import "foo";'

    expect(genStyle(ast)).toBe(expected)
  })

  it('should generate at-rule: with children', () => {
    const ast = style([
      atRule('media', 'screen and (max-width: 767px)', [
        rule([selector({ tag: 'p' })], [declaration('color', 'red')])
      ])
    ])
    const expected = '@media screen and (max-width: 767px) {p {color: red;}}'

    expect(genStyle(ast)).toBe(expected)
  })
})
