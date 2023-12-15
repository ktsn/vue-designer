import { createTemplate, h, d, render } from '../../helpers/template'

describe('VueComponent v-text', () => {
  it('should render text into an element', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('text', 'message')], [])
    ])

    const wrapper = render(
      template,
      [],
      [
        {
          name: 'message',
          default: 'Hello text!',
        },
      ]
    )
    expect(wrapper.find('p').text()).toBe('Hello text!')
  })

  it('should overwrite default content', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('text', 'message')], [
        h('span', [], ['This should not be rendered'])
      ])
    ])

    const wrapper = render(
      template,
      [],
      [
        {
          name: 'message',
          default: 'overwritten',
        },
      ]
    )
    const p = wrapper.find('p')
    expect(p.text()).toBe('overwritten')
    expect(p.contains('span')).toBe(false)
  })

  it('should not render if the value is not resolved', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('text', 'message')], [])
    ])

    const wrapper = render(template)
    expect(wrapper.find('p').text()).toBe('')
  })
})
