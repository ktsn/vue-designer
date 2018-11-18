/**
 * Loose and small CSS value lexer to provide useful editing features.
 */

interface Range {
  range: [number, number]
}

type Lex = Textual | Numeric | Divider | Whitespace

/**
 * 4. Textual Data Types
 * But url will not be completely parsed.
 * It also includes colors.
 * https://www.w3.org/TR/css-values-4/#textual-values
 */
interface Textual extends Range {
  type: 'textual'
  value: string
  quote: "'" | '"' | ''
}

/**
 * 5. Numeric Data Types
 * https://www.w3.org/TR/css-values-4/#numeric-types
 */
interface Numeric extends Range {
  type: 'numeric'
  numberToken: '-' | '+' | ''
  value: number
  unit: string
}

/**
 * Character that divides value or a part of it: ",", "+", "-", "*", "/", "(", ")"
 */
interface Divider extends Range {
  type: 'divider'
  value: string
}

/**
 * Space, line break, etc.
 */
interface Whitespace extends Range {
  type: 'whitespace'
  value: string
}

type Lexer<T> = (ctx: LexerContext) => LexerResult<T>

interface LexerContext {
  buffer: string
  position: number
}

type LexerResult<T> = LexerSuccess<T> | LexerFailure

interface LexerSuccess<T> {
  success: true
  value: T
  range: [number, number]
  context: LexerContext
}

interface LexerFailure {
  success: false
  message: string
  context: LexerContext
}

function success<T>(
  ctx: LexerContext,
  value: T,
  succ: number
): LexerSuccess<T> {
  const next = ctx.position + succ
  return {
    success: true,
    value,
    range: [ctx.position, next],
    context: {
      ...ctx,
      buffer: ctx.buffer.slice(succ),
      position: next
    }
  }
}

function failure(ctx: LexerContext, message: string): LexerFailure {
  return {
    success: false,
    message,
    context: ctx
  }
}

function seqResult<T>(result: LexerResult<T>[]): LexerResult<T[]> {
  const [head, ...tail] = result
  if (!head) {
    throw new Error('lexer results must have at least one item.')
  }

  if (!head.success) {
    return head
  }

  return tail.reduce<LexerResult<T[]>>(
    (acc, res) => {
      if (!acc.success) {
        return acc
      }

      if (!res.success) {
        return res
      }

      return {
        ...acc,
        value: acc.value.concat(res.value),
        range: [acc.range[0], res.range[1]],
        context: res.context
      }
    },
    {
      ...head,
      value: [head.value]
    }
  )
}

function empty<T>(x: T): Lexer<T> {
  return ctx => success(ctx, x, 0)
}

function string<T extends string>(s: T): Lexer<T> {
  return ctx => {
    if (s === ctx.buffer.slice(0, s.length)) {
      return success(ctx, s, s.length)
    } else {
      return failure(ctx, `Expected '${s}' but found ${ctx.buffer}`)
    }
  }
}

function regexp(r: RegExp): Lexer<string> {
  return ctx => {
    const match = ctx.buffer.match(r)
    if (match) {
      return success(ctx, match[0], match[0].length)
    } else {
      return failure(ctx, `Expected '${r.toString()}' but found ${ctx.buffer}`)
    }
  }
}

function seq<T>(...xs: Lexer<T>[]): Lexer<T[]> {
  const process = (
    acc: LexerResult<T>[],
    ctx: LexerContext,
    xs: Lexer<T>[]
  ): LexerResult<T>[] => {
    const [head, ...tail] = xs
    if (!head) {
      return acc
    }

    const result = head(ctx)
    return process(acc.concat(result), result.context, tail)
  }

  return ctx => seqResult(process([], ctx, xs))
}

function joinSeq(...xs: Lexer<string>[]): Lexer<string> {
  return ctx => {
    const result = seq(...xs)(ctx)
    if (result.success) {
      return {
        ...result,
        value: result.value.join('')
      }
    } else {
      return result
    }
  }
}

function many<T>(lexer: Lexer<T>): Lexer<T[]> {
  const process = (
    acc: LexerResult<T>[],
    ctx: LexerContext
  ): LexerResult<T>[] => {
    const result = lexer(ctx)
    if (result.success) {
      return process(acc.concat(result), result.context)
    } else {
      return acc
    }
  }

  return ctx => seqResult(process([], ctx))
}

function or<T>(...xs: Lexer<T>[]): Lexer<T> {
  const process = (
    errors: LexerFailure[],
    ctx: LexerContext,
    xs: Lexer<T>[]
  ): LexerResult<T> => {
    const [head, ...tail] = xs

    if (!head) {
      const messages = errors
        .map(e => e.message + ' at ' + e.context.position)
        .join('\n')
      return failure(ctx, `All disjunct parse failed:\n` + messages)
    }

    const result = head(ctx)
    if (result.success) {
      return result
    } else {
      return process(errors.concat(result), ctx, tail)
    }
  }

  return ctx => {
    return process([], ctx, xs)
  }
}

function option<T>(lexer: Lexer<T>): Lexer<T | null>
function option<T>(lexer: Lexer<T>, defaultValue: T): Lexer<T>
function option<T>(
  lexer: Lexer<T>,
  defaultValue: T | null = null
): Lexer<T | null> {
  return or(lexer, empty(defaultValue))
}

function map<T, R>(
  lexer: Lexer<T>,
  fn: (value: T, res: LexerSuccess<T>) => R
): Lexer<R> {
  return ctx => {
    const result = lexer(ctx)
    if (result.success) {
      return {
        ...result,
        value: fn(result.value, result)
      }
    } else {
      return result
    }
  }
}

const digits: Lexer<string> = regexp(/^\d+/)

/**
 * https://www.w3.org/TR/css-syntax-3/#ident-token-diagram
 * Much looser than spec
 */
const identTokenLike: Lexer<string> = regexp(/^-?[a-zA-Z_#][\w-]*/)

/**
 * https://www.w3.org/TR/css-syntax-3/#string-token-diagram
 */
const stringToken: Lexer<string> = or(
  joinSeq(string("'"), regexp(/^[^'\\]*/), string("'")),
  joinSeq(string('"'), regexp(/^[^"\\]*/), string('"'))
)

/**
 * https://www.w3.org/TR/css-syntax-3/#number-token-diagram
 */
const numberToken: Lexer<string> = joinSeq(
  or(string('+'), string('-'), empty('')),
  or(
    joinSeq(digits, string('.'), digits),
    joinSeq(digits),
    joinSeq(string('.'), digits)
  ),
  option(
    joinSeq(
      or(string('e'), string('E')),
      or(string('+'), string('-'), empty('')),
      digits
    ),
    ''
  )
)

const unit: Lexer<string> = regexp(/^(%|[a-zA-Z]+)/)

const textual: Lexer<Lex> = map(
  or(identTokenLike, stringToken),
  (value, res): Textual => {
    const quote: any = value[0] === '"' || value[0] === "'" ? value[0] : ''
    return {
      type: 'textual',
      quote,
      value: quote !== '' ? value.slice(1, value.length - 1) : value,
      range: res.range
    }
  }
)

const numeric: Lexer<Lex> = map(
  seq(numberToken, option(unit, '')),
  (value, res): Numeric => {
    const [num, unit] = value
    const numberToken: any = num[0] === '+' || num[0] === '-' ? num[0] : ''

    return {
      type: 'numeric',
      value: parseFloat(num),
      numberToken,
      unit,
      range: res.range
    }
  }
)

const divider: Lexer<Lex> = map(
  regexp(/^[,()+\-*/]/),
  (value, res): Divider => {
    return {
      type: 'divider',
      value,
      range: res.range
    }
  }
)

const whitespace: Lexer<Lex> = map(
  regexp(/^\s+/),
  (value, res): Whitespace => {
    return {
      type: 'whitespace',
      value,
      range: res.range
    }
  }
)

const lexer: Lexer<Lex[]> = many(or(numeric, whitespace, divider, textual))

export function lexStyleValue(value: string): Lex[] {
  const ctx = {
    buffer: value,
    position: 0
  }

  const result = lexer(ctx)

  if (!result.success) {
    throw new Error(
      `Parse Error found at ${result.context.position}\n` + result.message
    )
  }

  return result.value
}
