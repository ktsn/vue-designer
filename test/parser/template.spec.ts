import { parse, AST } from 'vue-eslint-parser'
import { templateToPayload } from '../../src/parser/template'

describe('Template AST transformer', () => {
  it('should transform element', () => {
    const code = '<template><div>Test {{ foo }}<p>bar</p></div></template>'
    const program = parse(code, {})
    const ast = program.templateBody!

    expect(templateToPayload(ast, code)).toEqual({
      type: 'Template',
      attributes: [],
      children: [
        {
          path: [0],
          type: 'Element',
          name: 'div',
          attributes: [],
          children: [
            {
              path: [0, 0],
              type: 'TextNode',
              text: 'Test '
            },
            {
              path: [0, 1],
              type: 'ExpressionNode',
              expression: 'foo'
            },
            {
              path: [0, 2],
              type: 'Element',
              name: 'p',
              attributes: [],
              children: [
                {
                  path: [0, 2, 0],
                  type: 'TextNode',
                  text: 'bar'
                }
              ]
            }
          ]
        }
      ]
    })
  })

  it('should transform attributes', () => {
    const code = '<template><h1 id="test" title="title" foo></h1></template>'
    const program = parse(code, {})
    const ast = program.templateBody!

    expect(templateToPayload(ast, code)).toEqual({
      type: 'Template',
      attributes: [],
      children: [
        {
          path: [0],
          type: 'Element',
          name: 'h1',
          attributes: [
            {
              index: 0,
              type: 'Attribute',
              name: 'id',
              value: 'test'
            },
            {
              index: 1,
              type: 'Attribute',
              name: 'title',
              value: 'title'
            },
            {
              index: 2,
              type: 'Attribute',
              name: 'foo',
              value: null
            }
          ],
          children: []
        }
      ]
    })
  })
})
