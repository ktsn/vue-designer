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

describe('complex', () => {
  it('multiple word', () => {
    const result = lexStyleValue('1px solid #ccc')
    expect(result).toEqual([
      {
        type: 'numeric',
        value: 1,
        numberToken: '',
        unit: 'px',
        range: [0, 3]
      },
      {
        type: 'whitespace',
        value: ' ',
        range: [3, 4]
      },
      {
        type: 'textual',
        value: 'solid',
        quote: '',
        range: [4, 9]
      },
      {
        type: 'whitespace',
        value: ' ',
        range: [9, 10]
      },
      {
        type: 'textual',
        value: '#ccc',
        quote: '',
        range: [10, 14]
      }
    ])
  })

  it('function', () => {
    const result = lexStyleValue('calc(10px + 100%)')
    expect(result).toEqual([
      {
        type: 'textual',
        value: 'calc',
        quote: '',
        range: [0, 4]
      },
      {
        type: 'divider',
        value: '(',
        range: [4, 5]
      },
      {
        type: 'numeric',
        value: 10,
        numberToken: '',
        unit: 'px',
        range: [5, 9]
      },
      {
        type: 'whitespace',
        value: ' ',
        range: [9, 10]
      },
      {
        type: 'divider',
        value: '+',
        range: [10, 11]
      },
      {
        type: 'whitespace',
        value: ' ',
        range: [11, 12]
      },
      {
        type: 'numeric',
        value: 100,
        numberToken: '',
        unit: '%',
        range: [12, 16]
      },
      {
        type: 'divider',
        value: ')',
        range: [16, 17]
      }
    ])
  })

  it('multiple section', () => {
    const result = lexStyleValue('color, background-color')
    expect(result).toEqual([
      {
        type: 'textual',
        value: 'color',
        quote: '',
        range: [0, 5]
      },
      {
        type: 'divider',
        value: ',',
        range: [5, 6]
      },
      {
        type: 'whitespace',
        value: ' ',
        range: [6, 7]
      },
      {
        type: 'textual',
        value: 'background-color',
        quote: '',
        range: [7, 23]
      }
    ])
  })
})
