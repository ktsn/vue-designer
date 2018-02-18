import * as path from 'path'
import { parse } from 'babylon'
import {
  extractProps,
  extractData,
  Prop,
  Data,
  extractChildComponents,
  ChildComponent
} from '../../src/parser/script'

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
        default: undefined
      },
      {
        name: 'bar',
        type: 'Number',
        default: 42
      }
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
        default: undefined
      }
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
        default: undefined
      }
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
        default: 'test'
      }
    ]
    expect(extracted).toEqual(expected)
  })
})

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

describe('Script components parser', () => {
  const hostPath = '/path/to/Component.vue'
  const hostUri = 'file://' + hostPath
  const pathToUri = (filePath: string): string => {
    const dir = path.dirname(hostPath)
    return (
      'file://' +
      path.resolve(dir, filePath).replace(new RegExp(path.sep, 'g'), '/')
    )
  }

  it('should extract component local name and uri', () => {
    const code = `
    import Foo from './Foo.vue'
    export default {
      components: { Foo }
    }`

    const { program } = parse(code, { sourceType: 'module' })
    const components = extractChildComponents(program, hostUri, pathToUri)
    const expected: ChildComponent[] = [
      {
        name: 'Foo',
        uri: 'file:///path/to/Foo.vue'
      }
    ]
    expect(components).toEqual(expected)
  })

  it('should handle named import', () => {
    const code = `
    import { Foo } from './Foo.ts'
    export default {
      components: { Foo }
    }`

    const { program } = parse(code, { sourceType: 'module' })
    const components = extractChildComponents(program, hostUri, pathToUri)
    const expected: ChildComponent[] = [
      {
        name: 'Foo',
        uri: 'file:///path/to/Foo.ts'
      }
    ]
    expect(components).toEqual(expected)
  })

  it('should handle non-shorthand syntax', () => {
    const code = `
    import Foo from './Foo.vue'
    export default {
      components: {
        LocalFoo: Foo
      }
    }`

    const { program } = parse(code, { sourceType: 'module' })
    const components = extractChildComponents(program, hostUri, pathToUri)
    const expected: ChildComponent[] = [
      {
        name: 'LocalFoo',
        uri: 'file:///path/to/Foo.vue'
      }
    ]
    expect(components).toEqual(expected)
  })

  // https://vuejs.org/v2/guide/components.html#Recursive-Components
  it('should handle self recursive component', () => {
    const code = `export default { name: 'Self' }`

    const { program } = parse(code, { sourceType: 'module' })
    const components = extractChildComponents(program, hostUri, pathToUri)
    const expected: ChildComponent[] = [
      {
        name: 'Self',
        uri: hostUri
      }
    ]
    expect(components).toEqual(expected)
  })

  // https://vuejs.org/v2/guide/components.html#Circular-References-Between-Components
  it('should collect recursively referred component in beforeCreate hook', () => {
    const code = `
    import Recursive from './Recursive.vue'
    export default {
      beforeCreate() {
        this.options.components.Recursive = Recursive
      }
    }
    `

    const { program } = parse(code, { sourceType: 'module' })
    const components = extractChildComponents(program, hostUri, pathToUri)
    const expected: ChildComponent[] = [
      {
        name: 'Recursive',
        uri: 'file:///path/to/Recursive.vue'
      }
    ]
    expect(components).toEqual(expected)
  })

  it('should collect recursively referred component in TypeScript', () => {
    const code = `
    import Vue from 'vue'
    import Recursive from './Recursive.vue'
    export default Vue.extend({
      beforeCreate() {
        this.options.components!.Recursive = Recursive
      }
    })
    `

    const { program } = parse(code, {
      sourceType: 'module',
      plugins: ['typescript'] as any[]
    })
    const components = extractChildComponents(program, hostUri, pathToUri)
    const expected: ChildComponent[] = [
      {
        name: 'Recursive',
        uri: 'file:///path/to/Recursive.vue'
      }
    ]
    expect(components).toEqual(expected)
  })
})
