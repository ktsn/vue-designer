import parse from 'postcss-safe-parser'
import { transformStyle, Style } from '@/parser/style'

describe('Style AST transformer', () => {
  it('should transform rules', () => {
    const code = `a { color: cyan; }`
    const root = parse(code)
    const ast = transformStyle(root)

    const expected: Style = {
      body: [
        {
          type: 'Rule',
          selectors: [
            {
              type: 'Selector',
              last: {
                type: 'SelectorElement',
                universal: false,
                tag: 'a',
                class: [],
                attributes: []
              }
            }
          ],
          declarations: [
            {
              type: 'Declaration',
              prop: 'color',
              value: 'cyan',
              important: false
            }
          ]
        }
      ]
    }

    expect(ast).toEqual(expected)
  })
})
