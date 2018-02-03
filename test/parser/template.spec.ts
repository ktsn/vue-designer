import { parse, AST } from 'vue-eslint-parser'
import { templateToPayload, Template } from '../../src/parser/template'

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
              directive: false,
              type: 'Attribute',
              name: 'id',
              value: 'test'
            },
            {
              index: 1,
              directive: false,
              type: 'Attribute',
              name: 'title',
              value: 'title'
            },
            {
              index: 2,
              directive: false,
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

  it('should transform directives', () => {
    const code = '<template><input :name="foo" v-model="value"></template>'
    const program = parse(code, {})
    const ast = program.templateBody!

    const expected: Template = {
      type: 'Template',
      attributes: [],
      children: [
        {
          path: [0],
          type: 'Element',
          name: 'input',
          attributes: [
            {
              index: 0,
              directive: true,
              type: 'Attribute',
              name: 'bind',
              argument: 'name',
              modifiers: [],
              expression: 'foo'
            },
            {
              index: 1,
              directive: true,
              type: 'Attribute',
              name: 'model',
              argument: null,
              modifiers: [],
              expression: 'value'
            }
          ],
          children: []
        }
      ]
    }

    expect(templateToPayload(ast, code)).toEqual(expected)
  })

  it('should evaluate literal value of directives', () => {
    const code = '<template><p v-if="true">test</p></template>'
    const program = parse(code, {})
    const ast = program.templateBody!

    const expected: Template = {
      type: 'Template',
      attributes: [],
      children: [
        {
          path: [0],
          type: 'Element',
          name: 'p',
          attributes: [
            {
              index: 0,
              directive: true,
              type: 'Attribute',
              name: 'if',
              argument: null,
              modifiers: [],
              expression: 'true',
              value: true
            }
          ],
          children: [
            {
              path: [0, 0],
              type: 'TextNode',
              text: 'test'
            }
          ]
        }
      ]
    }
    expect(templateToPayload(ast, code)).toEqual(expected)
  })
})
