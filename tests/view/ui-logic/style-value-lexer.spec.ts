import { lexStyleValue } from '@/view/ui-logic/style-value-lexer'

describe('textual', () => {
  it('ident', () => {
    const result = lexStyleValue('inherit')
    expect(result).toEqual([
      {
        type: 'textual',
        value: 'inherit',
        quote: '',
        range: [0, 7]
      }
    ])
  })

  it('single quoted string', () => {
    const result = lexStyleValue("'test value'")
    expect(result).toEqual([
      {
        type: 'textual',
        value: 'test value',
        quote: "'",
        range: [0, 12]
      }
    ])
  })

  it('double quoted string', () => {
    const result = lexStyleValue('"test"')
    expect(result).toEqual([
      {
        type: 'textual',
        value: 'test',
        quote: '"',
        range: [0, 6]
      }
    ])
  })
})

describe('numeric', () => {
  it('integer', () => {
    const result = lexStyleValue('123')
    expect(result).toEqual([
      {
        type: 'numeric',
        value: 123,
        numberToken: '',
        unit: '',
        range: [0, 3]
      }
    ])
  })

  it('number token: minus', () => {
    const result = lexStyleValue('-123')
    expect(result).toEqual([
      {
        type: 'numeric',
        value: -123,
        numberToken: '-',
        unit: '',
        range: [0, 4]
      }
    ])
  })

  it('number token: plus', () => {
    const result = lexStyleValue('+123')
    expect(result).toEqual([
      {
        type: 'numeric',
        value: 123,
        numberToken: '+',
        unit: '',
        range: [0, 4]
      }
    ])
  })

  it('decimal', () => {
    const result = lexStyleValue('1.234')
    expect(result).toEqual([
      {
        type: 'numeric',
        value: 1.234,
        numberToken: '',
        unit: '',
        range: [0, 5]
      }
    ])
  })

  it('decimal: without base', () => {
    const result = lexStyleValue('.5')
    expect(result).toEqual([
      {
        type: 'numeric',
        value: 0.5,
        numberToken: '',
        unit: '',
        range: [0, 2]
      }
    ])
  })

  it('E notation', () => {
    const result = lexStyleValue('12e5')
    expect(result).toEqual([
      {
        type: 'numeric',
        value: 12e5,
        numberToken: '',
        unit: '',
        range: [0, 4]
      }
    ])
  })

  it('E notation: with sign', () => {
    const result = lexStyleValue('123E-10')
    expect(result).toEqual([
      {
        type: 'numeric',
        value: 123e-10,
        numberToken: '',
        unit: '',
        range: [0, 7]
      }
    ])
  })

  it('with unit: percent', () => {
    const result = lexStyleValue('100%')
    expect(result).toEqual([
      {
        type: 'numeric',
        value: 100,
        numberToken: '',
        unit: '%',
        range: [0, 4]
      }
    ])
  })

  it('with unit: rem', () => {
    const result = lexStyleValue('1.5rem')
    expect(result).toEqual([
      {
        type: 'numeric',
        value: 1.5,
        numberToken: '',
        unit: 'rem',
        range: [0, 6]
      }
    ])
  })
})
