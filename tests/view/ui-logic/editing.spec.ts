import { updateStyleValue } from '@/view/ui-logic/editing'

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
