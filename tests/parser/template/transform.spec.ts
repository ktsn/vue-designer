import { describe, it } from 'vitest'
import { parse } from 'vue-eslint-parser'
import {
  createTemplate,
  h,
  exp,
  a,
  d,
  vFor,
  assertWithoutRange,
} from '../../helpers/template'
import { transformTemplate } from '../../../src/parser/template/transform'

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
          a('foo')
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
        [],
        { hasEndTag: false }
      )
    ])

    assertWithoutRange(transformTemplate(ast, code), expected)
  })

  it('should transform v-bind.prop directive', () => {
    const code = '<template><div :lang.prop="en"></div></template>'
    const program = parse(code, {})
    const ast = program.templateBody!

    // prettier-ignore
    const expected = createTemplate([
      h(
        'div',
        [
          d('bind', { argument: 'lang', modifiers: ['prop'] }, 'en')
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
