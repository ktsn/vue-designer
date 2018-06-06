import parse from 'postcss-safe-parser'
import { transformStyle } from '@/parser/style/transform'
import { addScope } from '@/parser/style/manipulate'
import { attribute, assertStyleNode } from '../../helpers/style'

function getAst(code: string) {
  const root = parse(code)
  return transformStyle(root, code, 0)
}

describe('Scoped selector', () => {
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
})
