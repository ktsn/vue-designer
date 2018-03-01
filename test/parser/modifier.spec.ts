import { parseComponent } from 'vue-template-compiler'
import { parse as parseTemplate } from 'vue-eslint-parser'
import { parse as _parseScript } from 'babylon'
import {
  modify,
  insertBefore,
  insertAfter,
  remove,
  replace,
  insertToTemplate,
  insertComponentScript
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

describe('Template modifier', () => {
  it('should insert a node code', () => {
    const code = `
    <template>
      <div>
        <a href="#">Test</a>
      </div>
    </template>
    `

    const program = parseTemplate(code, {})
    const ast = transformTemplate(program.templateBody!, code)

    const actual = modify(code, [
      insertToTemplate(ast, [1, 1], '<h1>Hello!</h1>')
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

    const program = parseTemplate(code, {})
    const ast = transformTemplate(program.templateBody!, code)

    const actual = modify(code, [
      insertToTemplate(ast, [1, 3], '<p>Message</p>')
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

    const program = parseTemplate(code, {})
    const ast = transformTemplate(program.templateBody!, code)

    const actual = modify(code, [
      insertToTemplate(ast, [1, 0], '<p>Message</p>')
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

    const program = parseTemplate(code, {})
    const ast = transformTemplate(program.templateBody!, code)

    const actual = modify(code, [
      insertToTemplate(ast, [1, 1, 1], '<span>Message</span>')
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

describe('Script modifier', () => {
  function parseScript(code: string) {
    return _parseScript(code, {
      sourceType: 'module'
    }).program
  }

  it('should add child component', () => {
    const code = `
    import Foo from './Foo.vue'

    export default {
      components: {
        Foo
      }
    }
    `

    const program = parseScript(code)
    const actual = modify(code, [
      insertComponentScript(program, code, 'Bar', './Bar.vue')
    ])

    const expected = `
    import Foo from './Foo.vue'
    import Bar from './Bar.vue'

    export default {
      components: {
        Foo,
        Bar
      }
    }
    `
    expect(actual).toBe(expected)
  })

  it('should handle the existing trailing comma', () => {
    const code = `
    import Foo from './Foo.vue'

    export default {
      components: {
        Foo,
      }
    }
    `

    const program = parseScript(code)
    const actual = modify(code, [
      insertComponentScript(program, code, 'Bar', './Bar.vue')
    ])

    const expected = `
    import Foo from './Foo.vue'
    import Bar from './Bar.vue'

    export default {
      components: {
        Foo,
        Bar,
      }
    }
    `
    expect(actual).toBe(expected)
  })

  it('should add into empty component options', () => {
    const code = `
    export default {
      components: {
      }
    }
    `

    const program = parseScript(code)
    const actual = modify(code, [
      insertComponentScript(program, code, 'Foo', './Foo.vue')
    ])

    const expected = `
    import Foo from './Foo.vue'
    export default {
      components: {
        Foo
      }
    }
    `
    expect(actual).toBe(expected)
  })

  it('should add component options if not exist', () => {
    const code = `
    export default {
    }
    `

    const program = parseScript(code)
    const actual = modify(code, [
      insertComponentScript(program, code, 'Foo', './Foo.vue')
    ])

    const expected = `
    import Foo from './Foo.vue'
    export default {
      components: {
        Foo
      }

    }
    `
    expect(actual).toBe(expected)
  })

  it('should only insert into script block', () => {
    const code = `
<template>
  <p>Hi</p>
</template>

<script>
export default {
}
</script>
`

    const { script } = parseComponent(code, { pad: 'space' })
    const scriptCode = script!.content
    const program = parseScript(scriptCode)
    const actual = modify(scriptCode, [
      insertComponentScript(program, scriptCode, 'Foo', './Foo.vue')
    ])

    const spacify = (matched: string) => matched.replace(/./g, ' ')

    const expected = `
<template>
  <p>Hi</p>
</template>

<script>
import Foo from './Foo.vue'
export default {
  components: {
    Foo
  }

}
`.replace(/<template>[\S\s]+<script>/, spacify)

    expect(actual).toBe(expected)
  })
})
