import { createTemplate, render, h, a, d, exp } from './helpers'

describe('VueComponent v-bind', () => {
  it('should bind attributes with v-bind', () => {
    // prettier-ignore
    const template = createTemplate([
      h('input', [
        d('bind', { argument: 'value' }, 'foo')
      ], [])
    ])

    const wrapper = render(template, [
      {
        name: 'foo',
        type: 'String',
        default: 'default value'
      }
    ])
    expect(wrapper.find('input').attributes()!.value).toBe('default value')
  })
})
