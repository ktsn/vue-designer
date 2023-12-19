import { describe, expect, it } from 'vitest'
import { createTemplate, render, h, a, d } from '../../helpers/template'

describe('VueComponent v-else-if', () => {
  it('should be removeod if corresponding v-if appears', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [a('id', 'foo'), d('if', 'true')], [
        'Foo'
      ]),
      h('p', [a('id', 'bar'), d('else-if', 'true')], [
        'Bar'
      ])
    ])

    const wrapper = render(template)
    const foo = wrapper.find('#foo')
    const bar = wrapper.find('#bar')
    expect(foo.exists()).toBe(true)
    expect(bar.exists()).toBe(false)
  })

  it('should appear if the expression is truthy and previous v-if is falsy', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [a('id', 'foo'), d('if', 'false')], [
        'Foo'
      ]),
      h('p', [a('id', 'bar'), d('else-if', 'true')], [
        'Bar'
      ])
    ])

    const wrapper = render(template)
    const foo = wrapper.find('#foo')
    const bar = wrapper.find('#bar')
    expect(foo.exists()).toBe(false)
    expect(bar.exists()).toBe(true)
  })

  it('should appear only first truthy v-else-if', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('if', 'false')], [
        'Foo'
      ]),
      h('p', [d('else-if', 'true')], [
        'Bar'
      ]),
      h('p', [d('else-if', 'false')], [
        'Baz'
      ]),
      h('p', [d('else-if', 'true')], [
        'Qux'
      ])
    ])

    const list = render(template).findAll('p')
    expect(list.length).toBe(1)
    expect(list.at(0).text()).toBe('Bar')
  })

  it('resolves template children as the else-if block', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('if', 'false')], [
        'Foo'
      ]),
      h('template', [d('else-if', 'true')], [
        h('strong', [], ['Bar']),
        'Content'
      ])
    ])

    const wrapper = render(template)
    expect(wrapper.html()).toMatchSnapshot()
  })
})
