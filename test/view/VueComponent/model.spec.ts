import { createTemplate, render, h, a, d, exp } from './helpers'

describe('VueComponent v-model', () => {
  it('should bind a value with v-model', () => {
    // prettier-ignore
    const template = createTemplate([
      h('input', [
        d('model', 'test')
      ], [])
    ])

    const wrapper = render(
      template,
      [],
      [
        {
          name: 'test',
          default: 'message'
        }
      ]
    )
    expect(wrapper.find('input').attributes()!.value).toBe('message')
  })
})
