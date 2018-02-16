import { createTemplate, h, render } from '../../parser/template-helpers'

describe('VueComponent child components', () => {
  it('should render child components in the store', () => {
    // prettier-ignore
    const template = createTemplate([
      h('div', [], [
        h('p', [], ['Normal element']),
        h('Foo', [], [])
      ])
    ])

    const components = {
      'file:///Foo.vue': {
        // prettier-ignore
        template: createTemplate([
          h('button', [], ['Component button'])
        ])
      }
    }
    const wrapper = render(
      template,
      [],
      [],
      [
        {
          name: 'Foo',
          uri: 'file:///Foo.vue'
        }
      ],
      components
    )

    expect(wrapper.find('p').text()).toBe('Normal element')
    expect(wrapper.find('button').text()).toBe('Component button')
  })
})
