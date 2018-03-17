import * as td from 'testdouble'
import { createTemplate, h, a, render } from '../../helpers/template'

describe('VueComponent select event', () => {
  it('should catch select event from descendant nodes', () => {
    const third = h('button', [a('id', 'third')], [])
    // prettier-ignore
    const second = h('div', [a('id', 'second')], [
      third
    ])
    const first = h('button', [a('id', 'first')], [])
    // prettier-ignore
    const root = h('div', [a('id', 'root')], [
      first,
      second
    ])

    const template = createTemplate([root])

    const spy = td.function()
    const wrapper = render(template)
    wrapper.vm.$on('select', spy)

    wrapper.find('#root').trigger('click')
    wrapper.find('#first').trigger('click')
    wrapper.find('#second').trigger('click')
    wrapper.find('#third').trigger('click')

    td.verify(spy(root), { times: 1 })
    td.verify(spy(first), { times: 1 })
    td.verify(spy(second), { times: 1 })
    td.verify(spy(third), { times: 1 })
  })

  it('should catch select event of child component', () => {
    const comp = h('Foo', [], [])
    // prettier-ignore
    const template = createTemplate([
      h('div', [], [
        comp
      ])
    ])

    const components = {
      'file:///Foo.vue': {
        // prettier-ignore
        template: createTemplate([
          h('div', [], [
            h('button', [a('id', 'child-button')], [])
          ])
        ])
      }
    }

    const spy = td.function()
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

    wrapper.vm.$on('select', spy)
    wrapper.find('#child-button').trigger('click')
    td.verify(spy(comp), { times: 1 })
  })
})
