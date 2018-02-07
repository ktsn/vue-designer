import parse from 'postcss-safe-parser'
import {
  transformStyle,
  Style,
  Selector,
  Declaration,
  Rule,
  Combinator,
  SelectorElement,
  AtRule,
  PseudoClass,
  PseudoElement
} from '@/parser/style'

describe('Style AST transformer', () => {
  it('should transform rules', () => {
    const ast = getAst(`a { color: cyan; }`)

    const expected: Style = style([
      rule([selector({ tag: 'a' })], [declaration('color', 'cyan')])
    ])

    expect(ast).toEqual(expected)
  })

  it('should transform combinators', () => {
    const ast = getAst(`div > a strong + span {}`)

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

  it('should transform pseudo class', () => {
    const ast = getAst(`.foo:not(.bar) {}`)

    const expected = style([
      rule([
        selector({
          class: ['foo'],
          pseudoClass: [pClass('not', [selector({ class: ['bar'] })])]
        })
      ])
    ])

    expect(ast).toEqual(expected)
  })

  it('should transform pseudo element', () => {
    const ast = getAst(`.foo::after {}`)

    const expected = style([
      rule([
        selector({
          class: ['foo'],
          pseudoElement: pElement('after')
        })
      ])
    ])

    expect(ast).toEqual(expected)
  })

  it('should transform pseudo class belongs to pseudo element', () => {
    const ast = getAst(`.foo::after:hover {}`)

    const expected = style([
      rule([
        selector({
          class: ['foo'],
          pseudoElement: pElement('after', [pClass('hover')])
        })
      ])
    ])

    expect(ast).toEqual(expected)
  })
})

function getAst(code: string): Style {
  const root = parse(code)
  return transformStyle(root)
}

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
    attributes: options.attributes || [],
    pseudoClass: options.pseudoClass || []
  }

  if (options.tag) {
    s.tag = options.tag
  }

  if (options.id) {
    s.id = options.id
  }

  if (options.pseudoElement) {
    s.pseudoElement = options.pseudoElement
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

function pClass(value: string, params: SelectorElement[] = []): PseudoClass {
  return {
    type: 'PseudoClass',
    value,
    params: params.map((p): Selector => {
      return {
        type: 'Selector',
        last: p
      }
    })
  }
}

function pElement(
  value: string,
  pseudoClass: PseudoClass[] = []
): PseudoElement {
  return {
    type: 'PseudoElement',
    value,
    pseudoClass
  }
}
