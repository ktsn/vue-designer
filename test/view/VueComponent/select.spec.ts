import * as td from 'testdouble'
import { createTemplate, h, a, render } from '../../helpers/template'

describe('VueComponent select event', () => {
  beforeAll(() => {
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      x: 0,
      y: 0,
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      width: 0,
      height: 0
    }))
  })

  afterAll(() => {
    delete Element.prototype.getBoundingClientRect
  })

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

    td.verify(spy(td.matchers.contains({ node: root })), { times: 1 })
    td.verify(spy(td.matchers.contains({ node: first })), { times: 1 })
    td.verify(spy(td.matchers.contains({ node: second })), { times: 1 })
    td.verify(spy(td.matchers.contains({ node: third })), { times: 1 })
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
    td.verify(spy(td.matchers.contains({ node: comp })), { times: 1 })
  })
})
