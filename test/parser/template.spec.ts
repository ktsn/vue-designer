import { parse } from 'vue-eslint-parser'
import {
  transformTemplate,
  getNode,
  Template,
  Attribute,
  addScope,
  Element,
  insertNode
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
      '<template><ul><li v-for="(item, key, i) in obj"></li></ul></template>'
    const program = parse(code, {})
    const ast = program.templateBody!

    // prettier-ignore
    const expected = createTemplate([
      h('ul', [], [
        h('li', [vFor(['item', 'key', 'i'], 'obj')], []),
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

describe('AST manipulation', () => {
  it('should insert a node', () => {
    // prettier-ignore
    const template = createTemplate([
      h('div', [], [
        h('p', [], ['Text']),
        h('div', [], [
          h('a', [a('href', '#foo')], ['Test'])
        ]),
        h('button', [], [])
      ])
    ])

    const target = h('a', [], ['inserted'])
    const inserted = insertNode(template, [0, 1], target)

    const expected: any = template
    expected.children[0].children.splice(1, 0, target)

    expect(inserted).toEqual(expected)
  })

  it('should insert a node to end of children', () => {
    // prettier-ignore
    const template = createTemplate([
      h('div', [], [
        h('p', [], ['Text']),
        h('div', [], [
          h('a', [a('href', '#foo')], ['Test'])
        ]),
        h('button', [], [])
      ])
    ])

    const target = h('a', [], ['inserted'])
    const inserted = insertNode(template, [0, 3], target)

    const expected: any = template
    expected.children[0].children.push(target)

    expect(inserted).toEqual(expected)
  })

  it('should insert a node to an empty children', () => {
    // prettier-ignore
    const template = createTemplate([
      h('div', [], [
        h('p', [], ['Text']),
        h('div', [], [
          h('a', [a('href', '#foo')], ['Test'])
        ]),
        h('button', [], [])
      ])
    ])

    const target = h('a', [], ['inserted'])
    const inserted = insertNode(template, [0, 2, 0], target)

    const expected: any = template
    expected.children[0].children[2].children.push(target)

    expect(inserted).toEqual(expected)
  })

  it('should throw if passing empty path', () => {
    const template = createTemplate([h('div', [], [])])
    const el = h('div', [], [])

    expect(() => insertNode(template, [], el)).toThrow(
      '[template] index should not be null or undefined'
    )
  })

  it('should throw if the path is unreachable as a node is missing', () => {
    // prettier-ignore
    const template = createTemplate([
      h('div', [], [
        h('div', [], [
          h('button', [], [])
        ]),
        h('div', [], [])
      ])
    ])

    const el = h('h1', [], [])

    expect(() => insertNode(template, [0, 2, 0], el)).toThrow(
      "[template] cannot reach to the path '0->2->0' as there is no node on the way"
    )
  })

  it('should throw if the path is unreachable as a node is text or expression', () => {
    // prettier-ignore
    const template = createTemplate([
      h('div', [], [
        h('div', [], [
          h('button', [], [])
        ]),
        exp('foo')
      ])
    ])

    const el = h('h1', [], [])

    expect(() => insertNode(template, [0, 1, 0], el)).toThrow(
      "[template] cannot reach to the path '0->1->0' as there is text or expression node on the way"
    )
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
