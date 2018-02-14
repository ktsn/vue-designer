export type EvalResult = EvalSuccess | EvalError

interface EvalSuccess {
  error?: undefined
  value: any
}

interface EvalError {
  error: Error
  value?: any
}

export function evalWithScope(expression: string, scope: object): EvalResult {
  try {
    const proxy = createScopeProxy(scope)
    return {
      value: new Function(`with (this) { return ${expression} }`).call(proxy)
    }
  } catch (error) {
    return { error }
  }
}

function createScopeProxy(scope: Record<string, any>): Record<string, any> {
  return new Proxy(scope, {
    get(target, name) {
      if (name === Symbol.unscopables) {
        return target[name]
      }

      const value = target[name]
      if (value !== null && typeof value === 'object') {
        return createScopeProxy(value)
      } else {
        return value
      }
    },

    set() {
      return true
    }
  })
}
