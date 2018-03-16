import { createTemplate, h, render, exp, a } from '../../helpers/template'

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

  it("should use child component's scope", () => {
    // prettier-ignore
    const template = createTemplate([
      h('Child', [], [])
    ])

    const components = {
      'file:///Child.vue': {
        // prettier-ignore
        template: createTemplate([
          h('div', [], [
            h('div', [a('id', 'first')], [
              exp('parentValue')
            ]),
            h('div', [a('id', 'second')], [
              exp('bothValue')
            ])
          ])
        ]),
        data: [
          {
            name: 'bothValue',
            default: 'should render child value'
          }
        ]
      }
    }

    const wrapper = render(
      template,
      [],
      [
        {
          name: 'parentValue',
          default: 'should not be rendered in child'
        },
        {
          name: 'bothValue',
          default: 'should not be rendered in child'
        }
      ],
      [
        {
          name: 'Child',
          uri: 'file:///Child.vue'
        }
      ],
      components
    )

    // should not resolved since child component does not have the value
    expect(wrapper.find('#first').text()).toBe('{{ parentValue }}')

    // should resolved as child component value
    expect(wrapper.find('#second').text()).toBe('should render child value')
  })
})
