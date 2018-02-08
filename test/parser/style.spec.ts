import parse from 'postcss-safe-parser'
import { AttributeOperator } from 'postcss-selector-parser'
import {
  transformStyle,
  Style,
  Declaration,
  Rule,
  Combinator,
  Selector,
  AtRule,
  PseudoClass,
  PseudoElement,
  Attribute,
  ChildNode
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

  it('should transform compound selector', () => {
    const ast = getAst(`a.foo > *#bar.baz.qux:hover[value*="name"]::before {}`)

    const expected = style([
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

  it('should transform declarations', () => {
    const ast = getAst(`
    a {
      color: cyan;
      text-decoration: underline !important;
    }
    `)

    const expected = style([
      rule(
        [selector({ tag: 'a' })],
        [
          declaration('color', 'cyan'),
          declaration('text-decoration', 'underline', true)
        ]
      )
    ])

    expect(ast).toEqual(expected)
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

    const expected = style([
      atRule('import', "'foo'"),
      atRule('media', 'screen and (max-width: 767px)', [
        rule([selector({ tag: 'h1' })], [declaration('font-size', '22px')])
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
  modifyPath(body)
  return {
    body
  }
}

function modifyPath(nodes: (AtRule | Rule | Declaration)[]): void {
  function loop(nodes: (AtRule | Rule | Declaration)[], path: number[]): void {
    nodes.forEach((node, i) => {
      const nextPath = path.concat(i)
      node.path = nextPath
      if (node.type === 'AtRule') {
        loop(node.children, nextPath)
      } else if (node.type === 'Rule') {
        loop(node.declarations, nextPath)
      }
    })
  }
  loop(nodes, [])
}

function atRule(
  name: string,
  params: string,
  children: ChildNode[] = []
): AtRule {
  return {
    type: 'AtRule',
    path: [],
    name,
    params,
    children
  }
}

function rule(selectors: Selector[], declarations: Declaration[] = []): Rule {
  return {
    type: 'Rule',
    path: [],
    selectors,
    declarations
  }
}

function selector(options: Partial<Selector>, next?: Combinator): Selector {
  const s: Selector = {
    type: 'Selector',
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

function attribute(
  name: string,
  operator?: AttributeOperator,
  value?: string
): Attribute {
  return {
    type: 'Attribute',
    name,
    operator,
    value
  }
}

function combinator(operator: string, next: Selector): Combinator {
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
    path: [],
    prop,
    value,
    important
  }
}

function pClass(value: string, params: Selector[] = []): PseudoClass {
  return {
    type: 'PseudoClass',
    value,
    params
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
