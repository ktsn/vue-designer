import { describe, expect, it } from 'vitest'
import {
  updateStyleValue,
  getTextOffset,
} from '../../../src/view/ui-logic/editing'

describe('getTextOffset', () => {
  it('just uses given offset if the node is text node', () => {
    const text = document.createTextNode('test')
    const offset = getTextOffset(text, 3)
    expect(offset).toBe(3)
  })

  it('converts node offset to text offset', () => {
    const root = document.createElement('div')

    const a = document.createElement('p')
    a.textContent = 'test1'

    const b = document.createTextNode('test2')

    const c = document.createElement('div')
    c.textContent = 'test3'

    root.appendChild(a)
    root.appendChild(b)
    root.appendChild(c)

    const offset = getTextOffset(root, 2)
    expect(offset).toBe(10)
  })
})

describe('updateStyleValue', () => {
  it('updates numeric value', () => {
    const updated = updateStyleValue('10px 20px', 7, 1)
    expect(updated.value).toBe('10px 21px')
    expect(updated.range).toEqual([5, 9])
  })

  it('does not updates textual value', () => {
    const updated = updateStyleValue('1px solid black', 6, 1)
    expect(updated.value).toBe('1px solid black')
    expect(updated.range).toBe(undefined)
  })

  it('boundary: start, positive', () => {
    const updated = updateStyleValue('inset 1px', 6, 1)
    expect(updated.value).toBe('inset 2px')
    expect(updated.range).toEqual([6, 9])
  })

  it('boundary: start, negative', () => {
    const updated = updateStyleValue('inset 1px', 5, 1)
    expect(updated.value).toBe('inset 1px')
    expect(updated.range).toBe(undefined)
  })

  it('boundary: end, positive', () => {
    const updated = updateStyleValue('1px solid', 2, 1)
    expect(updated.value).toBe('2px solid')
    expect(updated.range).toEqual([0, 3])
  })

  it('boundary: end, negative', () => {
    const updated = updateStyleValue('1px solid', 3, 1)
    expect(updated.value).toBe('1px solid')
    expect(updated.range).toBe(undefined)
  })
})
