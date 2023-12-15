import * as path from 'path'
import { parse } from '@babel/parser'
import { ChildComponent } from '@/parser/script/types'
import { extractChildComponents } from '@/parser/script/manipulate'

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
        uri: 'file:///path/to/Foo.vue',
      },
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
        uri: 'file:///path/to/Foo.ts',
      },
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
        uri: 'file:///path/to/Foo.vue',
      },
    ]
    expect(components).toEqual(expected)
  })

  it('should handle quited key', () => {
    const code = `
    import Foo from './Foo.vue'
    export default {
      components: {
        "local-foo": Foo
      }
    }`

    const { program } = parse(code, { sourceType: 'module' })
    const components = extractChildComponents(program, hostUri, pathToUri)
    const expected: ChildComponent[] = [
      {
        name: 'local-foo',
        uri: 'file:///path/to/Foo.vue',
      },
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
        uri: hostUri,
      },
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
        uri: 'file:///path/to/Recursive.vue',
      },
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
      plugins: ['typescript'],
    })
    const components = extractChildComponents(program, hostUri, pathToUri)
    const expected: ChildComponent[] = [
      {
        name: 'Recursive',
        uri: 'file:///path/to/Recursive.vue',
      },
    ]
    expect(components).toEqual(expected)
  })
})
