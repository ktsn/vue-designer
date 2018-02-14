import { parse } from 'vue-eslint-parser'
import {
  transformTemplate,
  getNode,
  Template,
  Attribute,
  addScope,
  Element
} from '../../src/parser/template'
import { createTemplate, h, exp, a, d, vFor } from './template-helpers'

describe('Template AST transformer', () => {
  it('should transform element', () => {
    const code = '<template><div>Test {{ foo }}<p>bar</p></div></template>'
    const program = parse(code, {})
    const ast = program.templateBody!

    // prettier-ignore
    const expected = createTemplate([
      h('div', [], [
        'Test ',
        exp('foo'),
        h('p', [], [
          'bar'
        ])
      ])
    ])

    assertWithoutRange(transformTemplate(ast, code), expected)
  })

  it('should transform attributes', () => {
    const code = '<template><h1 id="test" title="title" foo></h1></template>'
    const program = parse(code, {})
    const ast = program.templateBody!

    // prettier-ignore
    const expected = createTemplate([
      h(
        'h1',
        [
          a('id', 'test'),
          a('title', 'title'),
          a('foo', null)
        ],
        []
      )
    ])

    assertWithoutRange(transformTemplate(ast, code), expected)
  })

  it('should transform directives', () => {
    const code = '<template><input :name="foo" v-model="value"></template>'
    const program = parse(code, {})
    const ast = program.templateBody!

    // prettier-ignore
    const expected = createTemplate([
      h(
        'input',
        [
          d('bind', { argument: 'name' }, 'foo'),
          d('model', 'value')
        ],
        []
      )
    ])

    assertWithoutRange(transformTemplate(ast, code), expected)
  })

  it('should evaluate literal value of directives', () => {
    const code = '<template><p v-if="true">test</p></template>'
    const program = parse(code, {})
    const ast = program.templateBody!

    // prettier-ignore
    const expected = createTemplate([
      h(
        'p',
        [d('if', 'true')],
        ['test']
      )
    ])

    assertWithoutRange(transformTemplate(ast, code), expected)
  })

  it('should extract v-for directive', () => {
    const code =
      '<template><ul><li v-for="({ name }, key, i) in obj"></li></ul></template>'
    const program = parse(code, {})
    const ast = program.templateBody!

    // prettier-ignore
    const expected = createTemplate([
      h('ul', [], [
        h('li', [vFor(['{ name }', 'key', 'i'], 'obj')], []),
      ])
    ])

    assertWithoutRange(transformTemplate(ast, code), expected)
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
    const ast = transformTemplate(program.templateBody!, code)

    const res = getNode(ast, [1, 3])! as Element
    expect(res.type === 'Element')
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
    const ast = transformTemplate(program.templateBody!, code)

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
    const ast = transformTemplate(program.templateBody!, code)

    const scope = '1a2s3d'
    const scopeAttr: Attribute = {
      type: 'Attribute',
      directive: false,
      index: -1,
      name: 'data-scope-' + scope,
      value: null,
      range: [-1, -1]
    }

    const result = addScope(ast, scope)

    const expected: any = ast
    expected.children[1].attributes.push(scopeAttr) // #foo
    expected.children[1].children[1].attributes.push(scopeAttr) // .bar
    expected.children[1].children[3].attributes.push(scopeAttr) // [data-v-abcde]

    expect(result).toEqual(expected)
  })
})

function assertWithoutRange(result: Template, expected: Template): void {
  expect(excludeRange(result)).toEqual(excludeRange(expected))
}

function excludeRange(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(excludeRange)
  } else if (obj === null || typeof obj !== 'object') {
    return obj
  }

  const res: any = {}
  Object.keys(obj).forEach(key => {
    if (key !== 'range') {
      const value = obj[key]
      res[key] = excludeRange(value)
    }
  })
  return res
}
