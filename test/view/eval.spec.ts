import { evalWithScope } from '@/view/eval'

describe('Expression evaluation', () => {
  it('should evaluate JS expression', () => {
    const res = evalWithScope('1 + 2', {})
    expect(res.value).toBe(3)
  })

  it('should able to use a variable in scope', () => {
    const res = evalWithScope('"Hello, " + person', { person: 'John' })
    expect(res.value).toBe('Hello, John')
  })

  it('should return error if the expression uses a variable which scope does not have', () => {
    const res = evalWithScope('foo + bar', { foo: 'Test' })
    expect(res.error!.message).toBe('bar is not defined')
  })

  it('should not mutate scope object', () => {
    const scope = { foo: 'initial' }
    const res = evalWithScope('foo = "mutated"', scope)
    expect(res.value).toBe('mutated')
    expect(scope.foo).toBe('initial')
  })
})
