import parse from 'postcss-safe-parser'
import {
  createStyle,
  atRule,
  rule,
  selector,
  declaration,
  combinator,
  attribute,
  pClass,
  pElement,
  assertStyleNode
} from '../../helpers/style'
import { transformStyle } from '@/parser/style/transform'
import { Style, Rule } from '@/parser/style/types'

function getAst(code: string): Style {
  const root = parse(code)
  return transformStyle(root, code, 0)
}

describe('Style AST transformer', () => {
  it('should transform rules', () => {
    const ast = getAst(`a { color: cyan; }`)

    const expected: Style = createStyle([
      rule([selector({ tag: 'a' })], [declaration('color', 'cyan')])
    ])

    assertStyleNode(ast, expected)
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

    assertStyleNode(ast, expected)
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

    assertStyleNode(ast, expected)
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

    assertStyleNode(ast, expected)
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

    assertStyleNode(ast, expected)
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

    assertStyleNode(ast, expected)
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

    assertStyleNode(ast, expected)
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

    assertStyleNode(ast, expected)
  })

  it('should transform node position', () => {
    const ast = getAst('.foo {\n  color: red;\n}\n.bar {}')
    const rule = ast.body[0] as Rule

    expect(ast.range).toEqual([0, 30])
    expect(rule.range).toEqual([0, 22])
    expect(rule.declarations[0].range).toEqual([9, 20])
  })
})
