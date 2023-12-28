import { beforeAll, describe, expect, it, vitest } from 'vitest'
import { createTemplate, h, a, render } from '../../helpers/template'

describe('VueComponent select event', () => {
  beforeAll(() => {
    Element.prototype.getBoundingClientRect = vitest.fn(() => ({
      x: 0,
      y: 0,
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      width: 0,
      height: 0,
      toJSON: () => {},
    }))
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

    const spy = vitest.fn()
    const vm = render(
      template,
      [],
      [],
      [],
      {},
      {
        onSelect: spy,
      }
    )

    vm.$el.querySelector('#root')!.click()
    vm.$el.querySelector('#first')!.click()
    vm.$el.querySelector('#second')!.click()
    vm.$el.querySelector('#third')!.click()

    expect(spy).toHaveBeenCalledTimes(4)
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ ast: root }))
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ ast: first }))
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ ast: second }))
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ ast: third }))
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
        ]),
      },
    }

    const spy = vitest.fn()
    const vm = render(
      template,
      [],
      [],
      [
        {
          name: 'Foo',
          uri: 'file:///Foo.vue',
        },
      ],
      components,
      {
        onSelect: spy,
      }
    )

    vm.$el.querySelector('#child-button')!.click()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ ast: comp }))
  })
})
