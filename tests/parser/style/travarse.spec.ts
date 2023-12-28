import { describe, it, expect } from 'vitest'
import { getDeclaration } from '../../../src/parser/style/manipulate'
import { createStyle, rule, selector, declaration } from '../../helpers/style'

describe('Get style node', () => {
  it('should find declaration node', () => {
    const styles = [
      createStyle([]),
      createStyle([
        rule([selector({ tag: 'a' })], [declaration('color', 'red')]),
        rule(
          [selector({ class: ['foo'] })],
          [declaration('color', 'blue'), declaration('font-size', '22px')],
        ),
      ]),
    ]

    const result = getDeclaration(styles, [1, 1, 1])!
    expect(result).toBeTruthy()
    expect(result.prop).toBe('font-size')
    expect(result.value).toBe('22px')
  })

  it('should return undefined if the path does not indicate declaration', () => {
    const styles = [
      createStyle([]),
      createStyle([
        rule([selector({ tag: 'a' })], [declaration('color', 'red')]),
        rule(
          [selector({ class: ['foo'] })],
          [declaration('color', 'blue'), declaration('font-size', '22px')],
        ),
      ]),
    ]

    const result = getDeclaration(styles, [1, 0])!
    expect(result).toBeUndefined()
  })

  it('should return undefined if the path points nothing', () => {
    const styles = [
      createStyle([]),
      createStyle([
        rule([selector({ tag: 'a' })], [declaration('color', 'red')]),
        rule(
          [selector({ class: ['foo'] })],
          [declaration('color', 'blue'), declaration('font-size', '22px')],
        ),
      ]),
    ]

    const result = getDeclaration(styles, [0, 1, 1])!
    expect(result).toBeUndefined()
  })
})
