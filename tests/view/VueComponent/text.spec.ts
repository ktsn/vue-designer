import { describe, expect, it } from 'vitest'
import { createTemplate, h, d, render } from '../../helpers/template'

describe('VueComponent v-text', () => {
  it('should render text into an element', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('text', 'message')], [])
    ])

    const vm = render(
      template,
      [],
      [
        {
          name: 'message',
          default: 'Hello text!',
        },
      ],
    )
    const p = vm.$el.querySelector('p')!
    expect(p.textContent).toBe('Hello text!')
  })

  it('should overwrite default content', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('text', 'message')], [
        h('span', [], ['This should not be rendered'])
      ])
    ])

    const vm = render(
      template,
      [],
      [
        {
          name: 'message',
          default: 'overwritten',
        },
      ],
    )
    const p = vm.$el.querySelector('p')!
    expect(p.textContent).toBe('overwritten')
    expect(p.querySelector('span')).toBe(null)
  })

  it('should not render if the value is not resolved', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('text', 'message')], [])
    ])

    const vm = render(template)
    const p = vm.$el.querySelector('p')!
    expect(p.textContent).toBe('')
  })
})
