import { parse as parseTemplate } from 'vue-eslint-parser'
import {
  modify,
  insertBefore,
  insertAfter,
  remove,
  replace
} from '@/parser/modifier'
import { transformTemplate } from '@/parser/template/transform'

describe('Modifier', () => {
  it('should insert string before specified range', () => {
    const code = 'const foo = "World";'
    const actual = modify(code, [
      insertBefore({ range: [12, 19] }, '"Hello" + ')
    ])
    const expected = 'const foo = "Hello" + "World";'

    expect(actual).toBe(expected)
  })

  it('should insert string after specified range', () => {
    const code = 'const foo = "Hello";'
    const actual = modify(code, [insertAfter({ range: [6, 9] }, ': string')])
    const expected = 'const foo: string = "Hello";'

    expect(actual).toBe(expected)
  })

  it('should remove specified range', () => {
    const code = 'let foo; let bar;'
    const actual = modify(code, [remove({ range: [0, 9] })])
    const expected = 'let bar;'

    expect(actual).toBe(expected)
  })

  it('should replace specified range with a string', () => {
    const code = 'let foo; let bar;'
    const actual = modify(code, [
      replace({ range: [4, 7] }, 'message = "Hello"')
    ])
    const expected = 'let message = "Hello"; let bar;'

    expect(actual).toBe(expected)
  })

  it('should work in complex case', () => {
    const code = `<template><div id="foo"><h1>Hello</h1><p>World</p></div></template>`
    const template = parseTemplate(code, {}).templateBody!
    const ast: any = transformTemplate(template, code)

    const actual = modify(code, [
      remove(ast.children[0].startTag.attributes[0]),
      replace(ast.children[0].children[0].children[0], 'Hi'),
      insertBefore(ast.children[0].children[1], 'Test')
    ])
    const expected =
      '<template><div ><h1>Hi</h1>Test<p>World</p></div></template>'

    expect(actual).toBe(expected)
  })

  it('should work when the modifiers does not ordered by pos', () => {
    const code = 'let foo, bar;'
    const actual = modify(code, [
      remove({ range: [7, 12] }),
      insertBefore({ range: [3, 7] }, ' baz,')
    ])
    const expected = 'let baz, foo;'
    expect(actual).toBe(expected)
  })

  it('should work when modifier ranges are overwrapped: remove -> add', () => {
    const code = 'let foo, bar;'
    const actual = modify(code, [
      remove({ range: [4, 12] }),
      insertAfter({ range: [4, 8] }, 'baz')
    ])
    const expected = 'let baz;'
    expect(actual).toBe(expected)
  })

  it('should work when modifier ranges are overwrapped: add -> remove', () => {
    const code = 'let foo, bar;'
    const actual = modify(code, [
      insertAfter({ range: [4, 8] }, 'baz'),
      remove({ range: [4, 12] })
    ])
    const expected = 'let baz;'
    expect(actual).toBe(expected)
  })

  it('should work when modifier ranges are overwrapped: remove -> remove', () => {
    const code = 'let foo, bar, baz;'
    const actual = modify(code, [
      remove({ range: [4, 17] }),
      remove({ range: [9, 12] })
    ])
    const expected = 'let ;'
    expect(actual).toBe(expected)
  })
})
