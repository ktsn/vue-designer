import { describe, it, expect } from 'vitest'
import { parse } from 'vue-eslint-parser'
import { transformTemplate } from '../../../src/parser/template/transform'
import { getNode } from '../../../src/parser/template/manipulate'
import { TEElement } from '../../../src/parser/template/types'

describe('AST traversal', () => {
  it('should return a node by path', () => {
    const code = `
    <template>
      <div>
        <p></p>
        <input type="text">
      </div>
    </template>`
    const program = parse(code, {})
    const ast = transformTemplate(program.templateBody!, code)

    const res = getNode(ast, [1, 3])! as TEElement
    expect(res.type === 'Element')
    expect(res.name === 'input')
  })

  it('should return undefined if not exists', () => {
    const code = `
    <template>
      <div>
        <p></p>
        <input type="text">
      </div>
    </template>`
    const program = parse(code, {})
    const ast = transformTemplate(program.templateBody!, code)

    const res = getNode(ast, [1, 5])
    expect(res === undefined)
  })
})
