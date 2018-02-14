import parse from 'postcss-safe-parser'
import { transformStyle, Style, Rule, addScope } from '@/parser/style'
import {
  createStyle,
  atRule,
  rule,
  selector,
  declaration,
  combinator,
  attribute,
  pClass,
  pElement
} from './style-helpers'

describe('Style AST transformer', () => {
  it('should transform rules', () => {
    const ast = getAst(`a { color: cyan; }`)

    const expected: Style = createStyle([
      rule([selector({ tag: 'a' })], [declaration('color', 'cyan')])
    ])

    assertWithoutRange(ast, expected)
  })

  it('should transform combinators', () => {
    const ast = getAst(`div > a strong + span {}`)

    const expected = createStyle([
      rule([
        selector(
          { tag: 'span' },
          combinator(
            '+',
            selector(
              { tag: 'strong' },
              combinator(
                ' ',
                selector(
                  { tag: 'a' },
                  combinator('>', selector({ tag: 'div' }))
                )
              )
            )
          )
        )
      ])
    ])

    assertWithoutRange(ast, expected)
  })

  it('should transform compound selector', () => {
    const ast = getAst(`a.foo > *#bar.baz.qux:hover[value*="name"]::before {}`)

    const expected = createStyle([
      rule([
        selector(
          {
            universal: true,
            id: 'bar',
            class: ['baz', 'qux'],
            attributes: [attribute('value', '*=', 'name')],
            pseudoClass: [pClass('hover')],
            pseudoElement: pElement('before')
          },
          combinator('>', selector({ tag: 'a', class: ['foo'] }))
        )
      ])
    ])

    assertWithoutRange(ast, expected)
  })

  it('should transform pseudo class', () => {
    const ast = getAst(`.foo:not(.bar) {}`)

    const expected = createStyle([
      rule([
        selector({
          class: ['foo'],
          pseudoClass: [pClass('not', [selector({ class: ['bar'] })])]
        })
      ])
    ])

    assertWithoutRange(ast, expected)
  })

  it('should transform pseudo element', () => {
    const ast = getAst(`.foo::after {}`)

    const expected = createStyle([
      rule([
        selector({
          class: ['foo'],
          pseudoElement: pElement('after')
        })
      ])
    ])

    assertWithoutRange(ast, expected)
  })

  it('should transform pseudo class belongs to pseudo element', () => {
    const ast = getAst(`.foo::after:hover {}`)

    const expected = createStyle([
      rule([
        selector({
          class: ['foo'],
          pseudoElement: pElement('after', [pClass('hover')])
        })
      ])
    ])

    assertWithoutRange(ast, expected)
  })

  it('should transform declarations', () => {
    const ast = getAst(`
    a {
      color: cyan;
      text-decoration: underline !important;
    }
    `)

    const expected = createStyle([
      rule(
        [selector({ tag: 'a' })],
        [
          declaration('color', 'cyan'),
          declaration('text-decoration', 'underline', true)
        ]
      )
    ])

    assertWithoutRange(ast, expected)
  })

  it('should transform at-rules', () => {
    const ast = getAst(`
    @import 'foo';

    @media screen and (max-width: 767px) {
      h1 {
        font-size: 22px;
      }
    }
    `)

    const expected = createStyle([
      atRule('import', "'foo'"),
      atRule('media', 'screen and (max-width: 767px)', [
        rule([selector({ tag: 'h1' })], [declaration('font-size', '22px')])
      ])
    ])

    assertWithoutRange(ast, expected)
  })

  it('should transform node position', () => {
    const ast = getAst('.foo {\n  color: red;\n}\n.bar {}')
    const rule = ast.body[0] as Rule

    expect(ast.range).toEqual([0, 30])
    expect(rule.range).toEqual([0, 22])
    expect(rule.declarations[0].range).toEqual([9, 20])
  })
})

describe('Scoped selector', () => {
  it('should add scope attribute on the last selector', () => {
    const scope = 'abcdef'
    const code = 'h1 > .foo .bar {}'

    const ast = getAst(code)
    const result = addScope(ast, scope)

    const expected: any = ast
    expected.body[0].selectors[0].attributes.push(
      attribute('data-scope-' + scope)
    )

    assertWithoutRange(result, expected)
  })

  it('should add scope attribute in at-rule', () => {
    const scope = 'abcdef'
    const code = '@media screen { .foo {} }'

    const ast = getAst(code)
    const result = addScope(ast, scope)

    const expected: any = ast
    expected.body[0].children[0].selectors[0].attributes.push(
      attribute('data-scope-' + scope)
    )

    assertWithoutRange(result, expected)
  })
})

function getAst(code: string): Style {
  const root = parse(code)
  return transformStyle(root, code)
}

function assertWithoutRange(result: Style, expected: Style): void {
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
