import { createTemplate, render, h, a, d } from './helpers'

describe('VueComponent v-else', () => {
  it('should be removeod if corresponding v-if appears', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [a('id', 'foo'), d('if', 'true', true)], [
        'Foo'
      ]),
      h('p', [a('id', 'bar'), d('else')], [
        'Bar'
      ])
    ])

    const wrapper = render(template)
    const foo = wrapper.find('#foo')
    const bar = wrapper.find('#bar')
    expect(foo.exists()).toBe(true)
    expect(bar.exists()).toBe(false)
  })

  it('should appear if corrsponding v-if is removed', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [a('id', 'foo'), d('if', 'false', false)], [
        'Foo'
      ]),
      h('p', [a('id', 'bar'), d('else')], [
        'Bar'
      ])
    ])

    const wrapper = render(template)
    const foo = wrapper.find('#foo')
    const bar = wrapper.find('#bar')
    expect(foo.exists()).toBe(false)
    expect(bar.exists()).toBe(true)
  })

  it('should ignore empty text between v-if and v-else', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [a('id', 'foo'), d('if', 'true', true)], [
        'Foo'
      ]),
      '\n    ',
      h('p', [a('id', 'bar'), d('else')], [
        'Bar'
      ])
    ])

    const wrapper = render(template)
    const foo = wrapper.find('#foo')
    const bar = wrapper.find('#bar')
    expect(foo.exists()).toBe(true)
    expect(bar.exists()).toBe(false)
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
      h('p', [a('id', 'foo'), d('if', 'true', true)], [
        'Foo'
      ])
    ])

    const wrapper = render(template)
    const foo = wrapper.find('#foo')
    const bar = wrapper.find('#bar')
    expect(foo.exists()).toBe(true)
    expect(bar.exists()).toBe(true)
  })

  it('should be ignored if there is another element between if and else', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [a('id', 'foo'), d('if', 'true', true)], [
        'Foo'
      ]),
      h('div', [], [
        'Another'
      ]),
      h('p', [a('id', 'bar'), d('else')], [
        'Bar'
      ])
    ])

    const wrapper = render(template)
    const foo = wrapper.find('#foo')
    const bar = wrapper.find('#bar')
    expect(foo.exists()).toBe(true)
    expect(bar.exists()).toBe(true)
  })

  it('should be removed if at least one of v-else-if is true', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [a('id', 'foo'), d('if', 'false', false)], [
        'Foo'
      ]),
      h('p', [a('id', 'bar'), d('else-if', 'true', true)], [
        'Bar'
      ]),
      h('p', [a('id', 'baz'), d('else-if', 'false', false)], [
        'Baz'
      ]),
      h('p', [a('id', 'qux'), d('else')], [
        'Qux'
      ])
    ])

    const wrapper = render(template)
    const foo = wrapper.find('#foo')
    const bar = wrapper.find('#bar')
    const baz = wrapper.find('#baz')
    const qux = wrapper.find('#qux')
    expect(foo.exists()).toBe(false)
    expect(bar.exists()).toBe(true)
    expect(baz.exists()).toBe(false)
    expect(qux.exists()).toBe(false)
  })
})
