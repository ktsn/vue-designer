import { describe, expect, it } from 'vitest'
import { createTemplate, render, h, a, d } from '../../helpers/template'

describe('VueComponent v-else-if', () => {
  it('should be removed if corresponding v-if appears', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [a('id', 'foo'), d('if', 'true')], [
        'Foo'
      ]),
      h('p', [a('id', 'bar'), d('else-if', 'true')], [
        'Bar'
      ])
    ])

    const vm = render(template)
    const foo = vm.$el.querySelector('#foo')!
    const bar = vm.$el.querySelector('#bar')!
    expect(foo).not.toBeNull()
    expect(bar).toBeNull()
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

    const vm = render(template)
    const foo = vm.$el.querySelector('#foo')!
    const bar = vm.$el.querySelector('#bar')!
    expect(foo).toBeNull()
    expect(bar).not.toBeNull()
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

    const vm = render(template)
    const list = vm.$el.querySelectorAll('p')
    expect(list.length).toBe(1)
    expect(list[0]!.textContent).toBe('Bar')
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

    const vm = render(template)
    expect(vm.$el.outerHTML).toMatchSnapshot()
  })
})
