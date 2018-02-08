import * as deindent from 'deindent'
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
})
