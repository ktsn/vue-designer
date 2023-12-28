import { describe, expect, it } from 'vitest'
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
      ],
    )
    const input = wrapper.$el.querySelector('input') as HTMLInputElement
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
      ],
    )

    const checkbox = wrapper.$el.querySelector('input') as HTMLInputElement
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
      ],
    )

    const foo = wrapper.$el.querySelector(
      'input[value=foo]',
    ) as HTMLInputElement
    const bar = wrapper.$el.querySelector(
      'input[value=bar]',
    ) as HTMLInputElement
    const baz = wrapper.$el.querySelector(
      'input[value=baz]',
    ) as HTMLInputElement

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
      ],
    )

    const foo = wrapper.$el.querySelector(
      'input[value=foo]',
    ) as HTMLInputElement
    const bar = wrapper.$el.querySelector(
      'input[value=bar]',
    ) as HTMLInputElement

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
      ],
    )

    const select = wrapper.$el.querySelector('select') as HTMLSelectElement
    const selected = Array.from(select.options)
      .filter((op) => op.selected)
      .map((op) => op.value)

    expect(selected).toEqual(['bar'])
  })

  // Broken after upgrading to Vue 3
  it.todo('resolves multiple select v-model', () => {
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
      ],
    )

    const select = wrapper.$el.querySelector('select') as HTMLSelectElement
    const selected = Array.from(select.options)
      .filter((op) => op.selected)
      .map((op) => op.value)

    expect(selected).toEqual(['foo', 'baz'])
  })
})
