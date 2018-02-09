import { parse, AST } from 'vue-eslint-parser'
import {
  transformTemplate,
  getNode,
  Template,
  Attribute,
  addScope,
  Element
} from '../../src/parser/template'

describe('Template AST transformer', () => {
  it('should transform element', () => {
    const code = '<template><div>Test {{ foo }}<p>bar</p></div></template>'
    const program = parse(code, {})
    const ast = program.templateBody!

    expect(transformTemplate(ast, code)).toEqual({
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

    expect(transformTemplate(ast, code)).toEqual({
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

    expect(transformTemplate(ast, code)).toEqual(expected)
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
    expect(transformTemplate(ast, code)).toEqual(expected)
  })
})

describe('AST traversal', () => {
  it('should return a node by path', () => {
    const code = `
    <template>
      <div>
        <p></p>
        <input type="text">
      </div>
    </template>`
    const program = parse(code, {})
    const ast = program.templateBody!

    const res = getNode(ast, [1, 3])! as AST.VElement
    expect(res.type === 'VElement')
    expect(res.name === 'input')
  })

  it('should return undefined if not exists', () => {
    const code = `
    <template>
      <div>
        <p></p>
        <input type="text">
      </div>
    </template>`
    const program = parse(code, {})
    const ast = program.templateBody!

    const res = getNode(ast, [1, 5])
    expect(res === undefined)
  })
})

describe('Scope attribute', () => {
  it('should add scope attribute for all elements', () => {
    const code = `
    <template>
      <div id="foo">
        <p class="bar">Test</p>
        <p data-v-abcde>{{ test }}</p>
      </div>
    </template>
    `
    const program = parse(code, {})
    const ast = program.templateBody!

    const scope = '1a2s3d'
    const scopeAttr: Attribute = {
      type: 'Attribute',
      directive: false,
      index: -1,
      name: 'data-scope-' + scope,
      value: null
    }

    const result = transformTemplate(ast, code)
    addScope(result, scope)

    const expected: any = transformTemplate(ast, code)
    expected.children[1].attributes.push(scopeAttr) // #foo
    expected.children[1].children[1].attributes.push(scopeAttr) // .bar
    expected.children[1].children[3].attributes.push(scopeAttr) // [data-v-abcde]

    expect(result).toEqual(expected)
  })
})
