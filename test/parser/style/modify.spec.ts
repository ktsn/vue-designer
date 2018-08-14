import _parse from 'postcss-safe-parser'
import {
  updateDeclaration,
  removeDeclaration,
  insertDeclaration
} from '@/parser/style/modify'
import { STStyle } from '@/parser/style/types'
import { transformStyle } from '@/parser/style/transform'
import { modify } from '@/parser/modifier'
import { declaration } from '../../helpers/style'

describe('Style modifier', () => {
  function parse(code: string): STStyle[] {
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

  it('should insert declaration', () => {
    const code = `
    p {
      color: red;
      font-size: 22px;
    }
    `

    const styles = parse(code)
    const res = modify(code, [
      insertDeclaration(styles, declaration('font-weight', 'bold'), [0, 0, 1])
    ])
    const expected = `
    p {
      color: red;
      font-weight: bold;
      font-size: 22px;
    }
    `
    expect(res).toBe(expected)
  })

  it('should insert to the last declaration', () => {
    const code = `
    p {
      color: red;
      font-size: 22px;
    }
    `

    const styles = parse(code)
    const res = modify(code, [
      insertDeclaration(styles, declaration('font-weight', 'bold'), [0, 0, 2])
    ])
    const expected = `
    p {
      color: red;
      font-size: 22px;
      font-weight: bold;
    }
    `
    expect(res).toBe(expected)
  })

  it('should insert to the first declaration', () => {
    const code = `
    p {
      color: red;
      font-size: 22px;
    }
    `

    const styles = parse(code)
    const res = modify(code, [
      insertDeclaration(styles, declaration('font-weight', 'bold'), [0, 0, 0])
    ])
    const expected = `
    p {
      font-weight: bold;
      color: red;
      font-size: 22px;
    }
    `
    expect(res).toBe(expected)
  })

  it('should insert to the empty rule', () => {
    const code = `
    p {}
    `

    const styles = parse(code)
    const res = modify(code, [
      insertDeclaration(styles, declaration('font-weight', 'bold'), [0, 0, 0])
    ])
    const expected = `
    p {font-weight: bold;}
    `
    expect(res).toBe(expected)
  })
})
