import { parse } from 'vue-eslint-parser'
import { Attribute } from '@/parser/template/types'
import { transformTemplate } from '@/parser/template/transform'
import { addScope } from '@/parser/template/manipulate'

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
    const scopeName = 'data-scope-' + scope
    const scopeAttr: Attribute = {
      type: 'Attribute',
      attrIndex: -1,
      name: scopeName,
      value: null,
      range: [-1, -1]
    }

    const result = addScope(ast, scope)

    const expected: any = ast
    expected.children[1].startTag.attributes[scopeName] = scopeAttr // #foo
    expected.children[1].children[1].startTag.attributes[scopeName] = scopeAttr // .bar
    expected.children[1].children[3].startTag.attributes[scopeName] = scopeAttr // [data-v-abcde]

    expect(result).toEqual(expected)
  })
})
