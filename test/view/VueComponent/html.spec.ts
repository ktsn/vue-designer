import { createTemplate, h, d, render } from './helpers'

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
          default: '<strong>Hello text!</strong>'
        }
      ]
    )
    expect(wrapper.find('p').html()).toBe('<p><strong>Hello text!</strong></p>')
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
          default: '<strong>overwritten</strong>'
        }
      ]
    )
    const p = wrapper.find('p')
    expect(p.html()).toBe('<p><strong>overwritten</strong></p>')
  })

  it('should not render if the value is not resolved', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('html', 'message')], [])
    ])

    const wrapper = render(template)
    expect(wrapper.find('p').text()).toBe('')
  })
})
