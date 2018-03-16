import { parse } from 'babylon'
import { extractData } from '@/parser/script/manipulate'
import { Data } from '@/parser/script/types'

describe('Script data parser', () => {
  it('should extract data', () => {
    const code = `
    export default {
      data () {
        return { foo: 'test' }
      }
    }`

    const { program } = parse(code, { sourceType: 'module' })
    const extracted = extractData(program)
    const expected: Data[] = [
      {
        name: 'foo',
        default: 'test'
      }
    ]
    expect(extracted).toEqual(expected)
  })

  it('should extract data from arrow function', () => {
    const code = `
    export default {
      data: () => ({
        abc: 123,
        cde: true
      })
    }`

    const { program } = parse(code, { sourceType: 'module' })
    const extracted = extractData(program)
    const expected: Data[] = [
      {
        name: 'abc',
        default: 123
      },
      {
        name: 'cde',
        default: true
      }
    ]
    expect(extracted).toEqual(expected)
  })

  it('should extract array data', () => {
    const code = `
    export default {
      data: () => ({
        foo: ['test', 123]
      })
    }`

    const { program } = parse(code, { sourceType: 'module' })
    const extracted = extractData(program)
    const expected: Data[] = [
      {
        name: 'foo',
        default: ['test', 123]
      }
    ]
    expect(extracted).toEqual(expected)
  })

  it('should extract object data', () => {
    const code = `
    export default {
      data: () => ({
        obj: {
          foo: 'test',
          bar: 123
        }
      })
    }`

    const { program } = parse(code, { sourceType: 'module' })
    const extracted = extractData(program)
    const expected: Data[] = [
      {
        name: 'obj',
        default: {
          foo: 'test',
          bar: 123
        }
      }
    ]
    expect(extracted).toEqual(expected)
  })
})
