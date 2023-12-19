import { describe, it, expect } from 'vitest'
import { parse } from 'vue-eslint-parser'
import { transformTemplate } from '../../../src/parser/template/transform'
import { modify } from '../../../src/parser/modifier'
import { insertToTemplate } from '../../../src/parser/template/modify'

describe('Template modifier', () => {
  it('should insert a node code', () => {
    const code = `
    <template>
      <div>
        <a href="#">Test</a>
      </div>
    </template>
    `

    const program = parse(code, {})
    const ast = transformTemplate(program.templateBody!, code)

    const actual = modify(code, [
      insertToTemplate(ast, [1, 1], '<h1>Hello!</h1>'),
    ])
    const expected = `
    <template>
      <div>
        <h1>Hello!</h1>
        <a href="#">Test</a>
      </div>
    </template>
    `
    expect(actual).toBe(expected)
  })

  it('should insert to the last children', () => {
    const code = `
    <template>
      <div>
        <a href="#">Test</a>
      </div>
    </template>
    `

    const program = parse(code, {})
    const ast = transformTemplate(program.templateBody!, code)

    const actual = modify(code, [
      insertToTemplate(ast, [1, 3], '<p>Message</p>'),
    ])
    const expected = `
    <template>
      <div>
        <a href="#">Test</a>
        <p>Message</p>
      </div>
    </template>
    `
    expect(actual).toBe(expected)
  })

  it('should insert into an empty element', () => {
    const code = `
    <template>
      <div></div>
    </template>
    `

    const program = parse(code, {})
    const ast = transformTemplate(program.templateBody!, code)

    const actual = modify(code, [
      insertToTemplate(ast, [1, 0], '<p>Message</p>'),
    ])
    const expected = `
    <template>
      <div>
        <p>Message</p>
      </div>
    </template>
    `
    expect(actual).toBe(expected)
  })

  it('should insert into one line code', () => {
    const code = `
    <template>
      <div>
        <h1>Test</h1>
      </div>
    </template>
    `

    const program = parse(code, {})
    const ast = transformTemplate(program.templateBody!, code)

    const actual = modify(code, [
      insertToTemplate(ast, [1, 1, 1], '<span>Message</span>'),
    ])
    const expected = `
    <template>
      <div>
        <h1>Test
          <span>Message</span>
        </h1>
      </div>
    </template>
    `
    expect(actual).toBe(expected)
  })
})
