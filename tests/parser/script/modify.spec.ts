import { parseComponent } from 'vue-template-compiler'
import { parse as _parse } from '@babel/parser'
import { insertComponentScript } from '@/parser/script/modify'
import { modify } from '@/parser/modifier'

describe('Script modifier', () => {
  function parse(code: string) {
    return _parse(code, {
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

    const program = parse(code)
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

    const program = parse(code)
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

    const program = parse(code)
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

    const program = parse(code)
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
    const program = parse(scriptCode)
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
