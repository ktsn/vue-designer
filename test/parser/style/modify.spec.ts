import _parse from 'postcss-safe-parser'
import { updateDeclaration, removeDeclaration } from '@/parser/style/modify'
import { Style } from '@/parser/style/types'
import { transformStyle } from '@/parser/style/transform'
import { modify } from '@/parser/modifier'

describe('Style modifier', () => {
  function parse(code: string): Style[] {
    return [transformStyle(_parse(code), code, 0)]
  }

  it('should modify specified declaration', () => {
    const code = `
    p {
      color: red;
      font-size: 22px;
    }
    `

    const styles = parse(code)
    const res = modify(code, [
      updateDeclaration(styles, {
        path: [0, 0, 1],
        prop: 'font-weight',
        value: 'bold',
        important: true
      })
    ])
    const expected = `
    p {
      color: red;
      font-weight: bold !important;
    }
    `
    expect(res).toBe(expected)
  })

  it('should partially update declaration', () => {
    const code = `
    p {
      color: red;
      font-size: 22px;
    }
    `

    const styles = parse(code)
    const res = modify(code, [
      updateDeclaration(styles, {
        path: [0, 0, 1],
        value: '24px'
      })
    ])
    const expected = `
    p {
      color: red;
      font-size: 24px;
    }
    `
    expect(res).toBe(expected)
  })

  it('should do nothing when the declaration is not found', () => {
    const code = `
    p {
      color: red;
      font-size: 22px;
    }
    `

    const styles = parse(code)
    const res = modify(code, [
      updateDeclaration(styles, {
        path: [0, 0, 2],
        value: '24px'
      })
    ])
    const expected = `
    p {
      color: red;
      font-size: 22px;
    }
    `
    expect(res).toBe(expected)
  })

  it('should remove declaration', () => {
    const code = `
    p {
      color: red;
      font-size: 22px;
    }
    `

    const styles = parse(code)
    const res = modify(code, [removeDeclaration(styles, [0, 0, 1])])
    const expected = `
    p {
      color: red;
    }
    `
    expect(res).toBe(expected)
  })
})
