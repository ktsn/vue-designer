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
          default: 'message'
        }
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
          default: true
        }
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
          default: ['foo', 'baz']
        }
      ]
    )

    const foo = wrapper.find('input[value=foo]').element as HTMLInputElement
    const bar = wrapper.find('input[value=bar]').element as HTMLInputElement
    const baz = wrapper.find('input[value=baz]').element as HTMLInputElement

    expect(foo.checked).toBe(true)
    expect(bar.checked).toBe(false)
    expect(baz.checked).toBe(true)
  })
})
