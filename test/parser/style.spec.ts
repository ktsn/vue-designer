import parse from 'postcss-safe-parser'
import {
  transformStyle,
  Style,
  Selector,
  Declaration,
  Rule,
  Combinator,
  SelectorElement,
  AtRule
} from '@/parser/style'

describe('Style AST transformer', () => {
  it('should transform rules', () => {
    const code = `a { color: cyan; }`
    const root = parse(code)
    const ast = transformStyle(root)

    const expected: Style = style([
      rule([selector({ tag: 'a' })], [declaration('color', 'cyan')])
    ])

    expect(ast).toEqual(expected)
  })

  it('should transform combinators', () => {
    const code = `div > a strong + span {}`
    const root = parse(code)
    const ast = transformStyle(root)

    const expected = style([
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

    expect(ast).toEqual(expected)
  })
})

function style(body: (AtRule | Rule)[]): Style {
  return {
    body
  }
}

function rule(
  selectors: SelectorElement[],
  declarations: Declaration[] = []
): Rule {
  return {
    type: 'Rule',
    selectors: selectors.map((s): Selector => {
      return {
        type: 'Selector',
        last: s
      }
    }),
    declarations
  }
}

function selector(
  options: Partial<SelectorElement>,
  next?: Combinator
): SelectorElement {
  const s: SelectorElement = {
    type: 'SelectorElement',
    universal: options.universal || false,
    class: options.class || [],
    attributes: options.attributes || []
  }

  if (options.tag) {
    s.tag = options.tag
  }

  if (options.id) {
    s.id = options.id
  }

  if (options.pseudo) {
    s.pseudo = options.pseudo
  }

  if (next) {
    s.leftCombinator = next
  }

  return s
}

function combinator(operator: string, next: SelectorElement): Combinator {
  return {
    type: 'Combinator',
    operator,
    left: next
  }
}

function declaration(
  prop: string,
  value: string,
  important: boolean = false
): Declaration {
  return {
    type: 'Declaration',
    prop,
    value,
    important
  }
}
