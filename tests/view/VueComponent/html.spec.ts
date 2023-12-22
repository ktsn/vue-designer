import { describe, expect, it } from 'vitest'
import { createTemplate, h, d, render } from '../../helpers/template'

describe('VueComponent v-html', () => {
  it('should render html into an element', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('html', 'message')], [])
    ])

    const wrapper = render(
      template,
      [],
      [
        {
          name: 'message',
          default: '<strong>Hello text!</strong>',
        },
      ]
    )
    const p = wrapper.$el.querySelector('p')!
    expect(p.innerHTML).toBe('<strong>Hello text!</strong>')
  })

  it('should overwrite default content', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('html', 'message')], [
        h('span', [], ['This should not be rendered'])
      ])
    ])

    const wrapper = render(
      template,
      [],
      [
        {
          name: 'message',
          default: '<strong>overwritten</strong>',
        },
      ]
    )
    const p = wrapper.$el.querySelector('p')!
    expect(p.innerHTML).toBe('<strong>overwritten</strong>')
  })

  it('should not render if the value is not resolved', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('html', 'message')], [])
    ])

    const wrapper = render(template)
    const p = wrapper.$el.querySelector('p')!
    expect(p.innerHTML).toBe('')
  })
})
