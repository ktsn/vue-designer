import parse from 'postcss-safe-parser'
import { transformStyle } from '@/parser/style/transform'
import { addScope } from '@/parser/style/manipulate'
import { attribute, assertStyleNode } from '../../helpers/style'

function getAst(code: string) {
  const root = parse(code)
  return transformStyle(root, code, 0)
}

describe('Scoped style', () => {
  it('should add scope attribute on the last selector', () => {
    const scope = 'abcdef'
    const code = 'h1 > .foo .bar {}'

    const ast = getAst(code)
    const result = addScope(ast, scope)

    const expected: any = ast
    expected.children[0].selectors[0].attributes.push(
      attribute('data-scope-' + scope)
    )

    assertStyleNode(result, expected)
  })

  it('should add scope attribute in at-rule', () => {
    const scope = 'abcdef'
    const code = '@media screen { .foo {} }'

    const ast = getAst(code)
    const result = addScope(ast, scope)

    const expected: any = ast
    expected.children[0].children[0].selectors[0].attributes.push(
      attribute('data-scope-' + scope)
    )

    assertStyleNode(result, expected)
  })

  it('adds scope id to keyframes and animation name', () => {
    const scope = 'abcdef'
    const code = `
    .foo {
      animate: test 2s;
    }

    @keyframes test {
      from {
        opacity: 0;
      }

      to {
        opacity: 1;
      }
    }
    `

    const ast = getAst(code)
    const result = addScope(ast, scope)

    const expected: any = ast
    expected.children[0].selectors[0].attributes.push(
      attribute('data-scope-' + scope)
    )
    expected.children[0].children[0].value = 'test-' + scope + ' 2s'
    expected.children[1].params = 'test-' + scope

    assertStyleNode(result, expected)
  })

  it('does not add scope id to no-matched animation name', () => {
    const scope = 'abcdef'
    const code = `
    .foo {
      animate: test 2s;
    }
    `

    const ast = getAst(code)
    const result = addScope(ast, scope)

    const expected: any = ast
    expected.children[0].selectors[0].attributes.push(
      attribute('data-scope-' + scope)
    )

    assertStyleNode(result, expected)
  })
})
