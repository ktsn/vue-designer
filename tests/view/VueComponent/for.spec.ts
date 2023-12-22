import { describe, expect, it } from 'vitest'
import { render, createTemplate, h, exp, vFor } from '../../helpers/template'

describe('VueComponent v-for', () => {
  it('should iterate array value', () => {
    // prettier-ignore
    const template = createTemplate([
      h('ul', [], [
        h('li', [vFor(['item', 'i'], 'list')], [
          exp('item + " - " + i')
        ])
      ])
    ])

    const wrapper = render(template, [
      {
        name: 'list',
        type: 'Array',
        default: ['first', 'second', 'third'],
      },
    ])
    const list = wrapper.$el.querySelectorAll('li')
    expect(list.length).toBe(3)
    expect(list[0].textContent).toBe('first - 0')
    expect(list[1].textContent).toBe('second - 1')
    expect(list[2].textContent).toBe('third - 2')
  })

  it('should iterate object value', () => {
    // prettier-ignore
    const template = createTemplate([
      h('ul', [], [
        h('li', [vFor(['item', 'key', 'i'], 'obj')], [
          exp('item + " - " + key + " - " + i')
        ])
      ])
    ])

    const wrapper = render(template, [
      {
        name: 'obj',
        type: 'Object',
        default: {
          foo: 'first',
          bar: 'second',
          baz: 'third',
        },
      },
    ])
    const list = wrapper.$el.querySelectorAll('li')
    expect(list.length).toBe(3)
    expect(list[0].textContent).toBe('first - foo - 0')
    expect(list[1].textContent).toBe('second - bar - 1')
    expect(list[2].textContent).toBe('third - baz - 2')
  })

  it('should iterate range', () => {
    const template = createTemplate([
      h('ul', [], [h('li', [vFor(['i'], '3')], [exp('i')])]),
    ])

    const wrapper = render(template)
    const list = wrapper.$el.querySelectorAll('li')
    expect(list.length).toBe(3)
    expect(list[0].textContent).toBe('1')
    expect(list[1].textContent).toBe('2')
    expect(list[2].textContent).toBe('3')
  })

  it('should be removed if v-for is invalid', () => {
    // prettier-ignore
    const template = createTemplate([
      h('ul', [], [
        h('li', [vFor([])], [])
      ])
    ])

    const wrapper = render(template)
    const list = wrapper.$el.querySelectorAll('li')
    expect(list.length).toBe(0)
  })

  it('should be removed if iteratee cannot be resolved', () => {
    // prettier-ignore
    const template = createTemplate([
      h('ul', [], [
        h('li', [vFor(['item'], 'list')], [])
      ])
    ])

    const wrapper = render(template)
    const list = wrapper.$el.querySelectorAll('li')
    expect(list.length).toBe(0)
  })

  it('should be removed if iteratee is not iterable', () => {
    // prettier-ignore
    const template = createTemplate([
      h('ul', [], [
        h('li', [vFor(['item'], '"Test"')], [])
      ])
    ])

    const wrapper = render(template)
    const list = wrapper.$el.querySelectorAll('li')
    expect(list.length).toBe(0)
  })

  it('repeats template element children', () => {
    // prettier-ignore
    const template = createTemplate([
      h('div', [], [
        h('template', [vFor(['i'], '3')], [
          h('div', [], ['first - ', exp('i')]),
          h('div', [], ['second - ', exp('i')])
        ])
      ])
    ])

    const wrapper = render(template)
    expect(wrapper.$el.outerHTML).toMatchSnapshot()
  })
})
