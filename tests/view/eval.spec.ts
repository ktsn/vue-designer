import { describe, expect, it } from 'vitest'
import { evalWithScope, EvalSuccess, EvalError } from '../../src/view/eval'

describe('Expression evaluation', () => {
  it('should evaluate JS expression', () => {
    const res = evalWithScope('1 + 2', {}) as EvalSuccess
    expect(res.value).toBe(3)
  })

  it('should able to use a variable in scope', () => {
    const res = evalWithScope('"Hello, " + person', {
      person: 'John',
    }) as EvalSuccess
    expect(res.value).toBe('Hello, John')
  })

  it('should return error if the expression uses a variable which scope does not have', () => {
    const res = evalWithScope('foo + bar', { foo: 'Test' }) as EvalError
    expect(res.error.message).toBe('bar is not defined')
  })

  it('should not mutate scope object', () => {
    const scope = { foo: 'initial' }
    const res = evalWithScope('foo = "mutated"', scope) as EvalSuccess
    expect(res.value).toBe('mutated')
    expect(scope.foo).toBe('initial')
  })
})
