import { describe, expect, it } from 'vitest'
import { createTemplate, h, a, render } from '../../helpers/template'

describe('VueComponent error handling', () => {
  it('should not throw when invalid attribute name is passed', () => {
    // prettier-ignore
    // This may cause for the intermediate state of user's typing
    // e.g.
    //   <div>
    //     <p| <!-- The user is typing here -->
    //   </div>
    const template = createTemplate([
      h('div', [], [
        h('p', [a('<')], [])
      ])
    ])

    expect(() => render(template)).not.toThrow()
  })
})
