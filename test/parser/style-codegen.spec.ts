import {
  style,
  rule,
  selector,
  attribute,
  pClass,
  pElement,
  combinator
} from './style.spec'
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
    const expected = ':not(.bar,strong) {}'

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
})
