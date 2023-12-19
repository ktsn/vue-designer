import { describe, it, expect } from 'vitest'
import { createTemplate, h, exp, a } from '../../helpers/template'
import { insertNode } from '../../../src/parser/template/manipulate'

describe('AST manipulation', () => {
  it('should insert a node', () => {
    // prettier-ignore
    const template = createTemplate([
      h('div', [], [
        h('p', [], ['Text']),
        h('div', [], [
          h('a', [a('href', '#foo')], ['Test'])
        ]),
        h('button', [], [])
      ])
    ])

    const target = h('a', [], ['inserted'])
    const inserted = insertNode(template, [0, 1], target)

    const expected: any = template
    expected.children[0].children.splice(1, 0, target)

    expect(inserted).toEqual(expected)
  })

  it('should insert a node to end of children', () => {
    // prettier-ignore
    const template = createTemplate([
      h('div', [], [
        h('p', [], ['Text']),
        h('div', [], [
          h('a', [a('href', '#foo')], ['Test'])
        ]),
        h('button', [], [])
      ])
    ])

    const target = h('a', [], ['inserted'])
    const inserted = insertNode(template, [0, 3], target)

    const expected: any = template
    expected.children[0].children.push(target)

    expect(inserted).toEqual(expected)
  })

  it('should insert a node to an empty children', () => {
    // prettier-ignore
    const template = createTemplate([
      h('div', [], [
        h('p', [], ['Text']),
        h('div', [], [
          h('a', [a('href', '#foo')], ['Test'])
        ]),
        h('button', [], [])
      ])
    ])

    const target = h('a', [], ['inserted'])
    const inserted = insertNode(template, [0, 2, 0], target)

    const expected: any = template
    expected.children[0].children[2].children.push(target)

    expect(inserted).toEqual(expected)
  })

  it('should throw if passing empty path', () => {
    const template = createTemplate([h('div', [], [])])
    const el = h('div', [], [])

    expect(() => insertNode(template, [], el)).toThrow(
      '[template] index should not be null or undefined'
    )
  })

  it('should throw if the path is unreachable as a node is missing', () => {
    // prettier-ignore
    const template = createTemplate([
      h('div', [], [
        h('div', [], [
          h('button', [], [])
        ]),
        h('div', [], [])
      ])
    ])

    const el = h('h1', [], [])

    expect(() => insertNode(template, [0, 2, 0], el)).toThrow(
      "[template] cannot reach to the path '0->2->0' as there is no node on the way"
    )
  })

  it('should throw if the path is unreachable as a node is text or expression', () => {
    // prettier-ignore
    const template = createTemplate([
      h('div', [], [
        h('div', [], [
          h('button', [], [])
        ]),
        exp('foo')
      ])
    ])

    const el = h('h1', [], [])

    expect(() => insertNode(template, [0, 1, 0], el)).toThrow(
      "[template] cannot reach to the path '0->1->0' as there is text or expression node on the way"
    )
  })
})
