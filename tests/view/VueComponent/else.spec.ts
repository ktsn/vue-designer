import { describe, expect, it } from 'vitest'
import { createTemplate, render, h, a, d } from '../../helpers/template'

describe('VueComponent v-else', () => {
  it('should be removed if corresponding v-if appears', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [a('id', 'foo'), d('if', 'true')], [
        'Foo'
      ]),
      h('p', [a('id', 'bar'), d('else')], [
        'Bar'
      ])
    ])

    const vm = render(template)
    const foo = vm.$el.querySelector('#foo')
    const bar = vm.$el.querySelector('#bar')
    expect(foo).not.toBe(null)
    expect(bar).toBe(null)
  })

  it('should appear if corresponding v-if is removed', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [a('id', 'foo'), d('if', 'false')], [
        'Foo'
      ]),
      h('p', [a('id', 'bar'), d('else')], [
        'Bar'
      ])
    ])

    const vm = render(template)
    const foo = vm.$el.querySelector('#foo')
    const bar = vm.$el.querySelector('#bar')
    expect(foo).toBe(null)
    expect(bar).not.toBe(null)
  })

  it('should ignore empty text between v-if and v-else', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [a('id', 'foo'), d('if', 'true')], [
        'Foo'
      ]),
      '\n    ',
      h('p', [a('id', 'bar'), d('else')], [
        'Bar'
      ])
    ])

    const vm = render(template)
    const foo = vm.$el.querySelector('#foo')
    const bar = vm.$el.querySelector('#bar')
    expect(foo).not.toBe(null)
    expect(bar).toBe(null)
  })

  it('should be ignored if there is no v-if before it', () => {
    // prettier-ignore
    const template = createTemplate([
      h('div', [], [
        'First'
      ]),
      h('p', [a('id', 'bar'), d('else')], [
        'Bar'
      ]),
      h('p', [a('id', 'foo'), d('if', 'true')], [
        'Foo'
      ])
    ])

    const vm = render(template)
    const foo = vm.$el.querySelector('#foo')
    const bar = vm.$el.querySelector('#bar')
    expect(foo).not.toBe(null)
    expect(bar).not.toBe(null)
  })

  it('should be ignored if there is another element between if and else', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [a('id', 'foo'), d('if', 'true')], [
        'Foo'
      ]),
      h('div', [], [
        'Another'
      ]),
      h('p', [a('id', 'bar'), d('else')], [
        'Bar'
      ])
    ])

    const vm = render(template)
    const foo = vm.$el.querySelector('#foo')
    const bar = vm.$el.querySelector('#bar')
    expect(foo).not.toBe(null)
    expect(bar).not.toBe(null)
  })

  it('should be removed if at least one of v-else-if is true', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [a('id', 'foo'), d('if', 'false')], [
        'Foo'
      ]),
      h('p', [a('id', 'bar'), d('else-if', 'true')], [
        'Bar'
      ]),
      h('p', [a('id', 'baz'), d('else-if', 'false')], [
        'Baz'
      ]),
      h('p', [a('id', 'qux'), d('else')], [
        'Qux'
      ])
    ])

    const vm = render(template)
    const foo = vm.$el.querySelector('#foo')
    const bar = vm.$el.querySelector('#bar')
    const baz = vm.$el.querySelector('#baz')
    const qux = vm.$el.querySelector('#qux')
    expect(foo).toBe(null)
    expect(bar).not.toBe(null)
    expect(baz).toBe(null)
    expect(qux).toBe(null)
  })

  it('resolves template children as the else block', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('if', 'false')], [
        'Foo'
      ]),
      h('template', [d('else')], [
        h('strong', [], ['Bar']),
        'Content'
      ])
    ])

    const vm = render(template)
    expect(vm.$el.outerHTML).toMatchSnapshot()
  })
})
