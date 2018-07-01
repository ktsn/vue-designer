import { createTemplate, h, render } from '../../helpers/template'

describe('VueComponent slot', () => {
  it('renders placeholder slot content', () => {
    // prettier-ignore
    const template = createTemplate([
      h('div', [], [
        h('slot', [], [
          h('p', [], ['placeholder content'])
        ])
      ])
    ])

    const wrapper = render(template)
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('renders slot content', () => {
    // prettier-ignore
    const template = createTemplate([
      h('Foo', [], [
        h('p', [], ['injected'])
      ])
    ])

    const components = {
      'file://Foo.vue': {
        // prettier-ignore
        template: createTemplate([
          h('div', [], [
            h('p', [], ['foo content']),
            h('slot', [], [])
          ])
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
          uri: 'file://Foo.vue'
        }
      ],
      components
    )

    expect(wrapper.html()).toMatchSnapshot()
  })
})
