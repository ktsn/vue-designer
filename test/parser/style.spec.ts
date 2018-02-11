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
  ChildNode,
  addScope
} from '@/parser/style'

describe('Style AST transformer', () => {
  it('should transform rules', () => {
    const ast = getAst(`a { color: cyan; }`)

    const expected: Style = style([
      rule([selector({ tag: 'a' })], [declaration('color', 'cyan')])
    ])

    assertWithoutRange(ast, expected)
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

    assertWithoutRange(ast, expected)
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

    assertWithoutRange(ast, expected)
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

    assertWithoutRange(ast, expected)
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

    assertWithoutRange(ast, expected)
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

    assertWithoutRange(ast, expected)
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

    const expected = style([
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
    addScope(ast, scope)

    const expected: any = getAst(code)
    expected.body[0].selectors[0].attributes.push(
      attribute('data-scope-' + scope)
    )

    assertWithoutRange(ast, expected)
  })

  it('should add scope attribute in at-rule', () => {
    const scope = 'abcdef'
    const code = '@media screen { .foo {} }'

    const ast = getAst(code)
    addScope(ast, scope)

    const expected: any = getAst(code)
    expected.body[0].children[0].selectors[0].attributes.push(
      attribute('data-scope-' + scope)
    )

    assertWithoutRange(ast, expected)
  })
})

function getAst(code: string): Style {
  const root = parse(code)
  return transformStyle(root, code)
}

export function style(body: (AtRule | Rule)[]): Style {
  modifyPath(body)
  return {
    body,
    range: [-1, -1]
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

export function atRule(
  name: string,
  params: string,
  children: ChildNode[] = []
): AtRule {
  return {
    type: 'AtRule',
    path: [],
    name,
    params,
    children,
    range: [-1, -1]
  }
}

export function rule(
  selectors: Selector[],
  declarations: Declaration[] = []
): Rule {
  return {
    type: 'Rule',
    path: [],
    selectors,
    declarations,
    range: [-1, -1]
  }
}

export function selector(
  options: Partial<Selector>,
  next?: Combinator
): Selector {
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

export function attribute(
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

export function combinator(operator: string, next: Selector): Combinator {
  return {
    type: 'Combinator',
    operator,
    left: next
  }
}

export function declaration(
  prop: string,
  value: string,
  important: boolean = false
): Declaration {
  return {
    type: 'Declaration',
    path: [],
    prop,
    value,
    important,
    range: [-1, -1]
  }
}

export function pClass(value: string, params: Selector[] = []): PseudoClass {
  return {
    type: 'PseudoClass',
    value,
    params
  }
}

export function pElement(
  value: string,
  pseudoClass: PseudoClass[] = []
): PseudoElement {
  return {
    type: 'PseudoElement',
    value,
    pseudoClass
  }
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
