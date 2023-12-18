import { createTemplate, render, h, d, a } from '../../helpers/template'

describe('VueComponent v-model', () => {
  it('should bind a value with v-model', () => {
    // prettier-ignore
    const template = createTemplate([
      h('input', [
        d('model', 'test')
      ], [])
    ])

    const wrapper = render(
      template,
      [],
      [
        {
          name: 'test',
          default: 'message',
        },
      ]
    )
    const input = wrapper.find('input').element as HTMLInputElement
    expect(input.value).toBe('message')
  })

  it('resolves checkbox v-model', () => {
    // prettier-ignore
    const template = createTemplate([
      h('input', [a('type', 'checkbox'), d('model', 'checked')], [])
    ])

    const wrapper = render(
      template,
      [],
      [
        {
          name: 'checked',
          default: true,
        },
      ]
    )

    const checkbox = wrapper.find('input').element as HTMLInputElement
    expect(checkbox.checked).toBe(true)
  })

  it('resolves multiple checkbox v-model', () => {
    // prettier-ignore
    const template = createTemplate([
      h('div', [], [
        h('input', [a('type', 'checkbox'), a('value', 'foo'), d('model', 'list')], []),
        h('input', [a('type', 'checkbox'), a('value', 'bar'), d('model', 'list')], []),
        h('input', [a('type', 'checkbox'), a('value', 'baz'), d('model', 'list')], []),
      ])
    ])

    const wrapper = render(
      template,
      [],
      [
        {
          name: 'list',
          default: ['foo', 'baz'],
        },
      ]
    )

    const foo = wrapper.find('input[value=foo]').element as HTMLInputElement
    const bar = wrapper.find('input[value=bar]').element as HTMLInputElement
    const baz = wrapper.find('input[value=baz]').element as HTMLInputElement

    expect(foo.checked).toBe(true)
    expect(bar.checked).toBe(false)
    expect(baz.checked).toBe(true)
  })

  it('resolves radio button v-model', () => {
    // prettier-ignore
    const template = createTemplate([
      h('div', [], [
        h('input', [a('type', 'radio'), a('value', 'foo'), d('model', 'radio')], []),
        h('input', [a('type', 'radio'), a('value', 'bar'), d('model', 'radio')], [])
      ])
    ])

    const wrapper = render(
      template,
      [],
      [
        {
          name: 'radio',
          default: 'bar',
        },
      ]
    )

    const foo = wrapper.find('input[value=foo]').element as HTMLInputElement
    const bar = wrapper.find('input[value=bar]').element as HTMLInputElement

    expect(foo.checked).toBe(false)
    expect(bar.checked).toBe(true)
  })

  it('resolves select v-model', () => {
    // prettier-ignore
    const template = createTemplate([
      h('select', [d('model', 'selected')], [
        h('option', [a('value', 'foo')], []),
        h('option', [a('value', 'bar')], [])
      ])
    ])

    const wrapper = render(
      template,
      [],
      [
        {
          name: 'selected',
          default: 'bar',
        },
      ]
    )

    const select = wrapper.find('select').element as HTMLSelectElement
    const selected = Array.from(select.options)
      .filter((op) => op.selected)
      .map((op) => op.value)

    expect(selected).toEqual(['bar'])
  })

  it('resolves multiple select v-model', () => {
    // prettier-ignore
    const template = createTemplate([
      h('select', [d('model', 'selected'), a('multiple')], [
        h('option', [a('value', 'foo')], []),
        h('option', [a('value', 'bar')], []),
        h('option', [a('value', 'baz')], [])
      ])
    ])

    const wrapper = render(
      template,
      [],
      [
        {
          name: 'selected',
          default: ['foo', 'baz'],
        },
      ]
    )

    const select = wrapper.find('select').element as HTMLSelectElement
    const selected = Array.from(select.options)
      .filter((op) => op.selected)
      .map((op) => op.value)

    expect(selected).toEqual(['foo', 'baz'])
  })
})
