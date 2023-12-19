import { describe, it, expect } from 'vitest'
import { parse } from '@babel/parser'
import { extractProps } from '../../../src/parser/script/manipulate'
import { Prop } from '../../../src/parser/script/types'

describe('Script props parser', () => {
  it('should extract props', () => {
    const code = `
    export default {
      props: {
        foo: String,
        bar: {
          type: Number,
          default: 42
        }
      }
    }`

    const { program } = parse(code, { sourceType: 'module' })
    const extracted = extractProps(program)
    const expected: Prop[] = [
      {
        name: 'foo',
        type: 'String',
        default: undefined,
      },
      {
        name: 'bar',
        type: 'Number',
        default: 42,
      },
    ]
    expect(extracted).toEqual(expected)
  })

  it('should extract props from array definition', () => {
    const code = `export default { props: ['test'] }`

    const { program } = parse(code, { sourceType: 'module' })
    const extracted = extractProps(program)
    const expected: Prop[] = [
      {
        name: 'test',
        type: 'any',
        default: undefined,
      },
    ]
    expect(extracted).toEqual(expected)
  })

  it('should extract props from Vue.extend defintion', () => {
    const code = `export default Vue.extend({ props: ['foo'] })`

    const { program } = parse(code, { sourceType: 'module' })
    const extracted = extractProps(program)
    const expected: Prop[] = [
      {
        name: 'foo',
        type: 'any',
        default: undefined,
      },
    ]
    expect(extracted).toEqual(expected)
  })

  it('should extract default props from function', () => {
    const code = `
    export default {
      props: {
        foo: {
          type: String,
          default: () => 'test'
        }
      }
    }`

    const { program } = parse(code, { sourceType: 'module' })
    const extracted = extractProps(program)
    const expected: Prop[] = [
      {
        name: 'foo',
        type: 'String',
        default: 'test',
      },
    ]
    expect(extracted).toEqual(expected)
  })
})
