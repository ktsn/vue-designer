import { describe, expect, it } from 'vitest'
import { createTemplate, render, h, d } from '../../helpers/template'

describe('VueComponent v-if', () => {
  it('should appear if v-if="true"', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('if', 'true')], [
        'test'
      ])
    ])

    const vm = render(template)
    const p = vm.$el.querySelector('p')
    expect(p).not.toBeNull()
  })

  it('should be removed if v-if="false"', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('if', 'false')], [
        'test'
      ])
    ])

    const vm = render(template)
    const p = vm.$el.querySelector('p')
    expect(p).toBeNull()
  })

  it('should appear if the expression is resolved to truthy', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('if', 'foo')], [
        'test'
      ])
    ])

    const vm = render(template, [
      {
        name: 'foo',
        type: 'Number',
        default: 123,
      },
    ])
    const p = vm.$el.querySelector('p')
    expect(p).not.toBeNull()
  })

  it('should be removed if the expression is resolved to falthy', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('if', 'bar')], [
        'test'
      ])
    ])

    const vm = render(
      template,
      [],
      [
        {
          name: 'bar',
          default: null,
        },
      ]
    )
    const p = vm.$el.querySelector('p')
    expect(p).toBeNull()
  })

  it('should be removed if the expression cannot be resolved', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('if', 'foo + bar')], [
        'test'
      ])
    ])

    const vm = render(template)
    const p = vm.$el.querySelector('p')
    expect(p).toBeNull()
  })

  it('gathers the contents in the template element', () => {
    // prettier-ignore
    const shown = createTemplate([
      h('template', [d('if', 'true')], [
        h('p', [], ['foo']),
        'bar'
      ]),
      'baz'
    ])

    const vmShown = render(shown)
    expect(vmShown.$el.outerHTML).toMatchSnapshot()

    // prettier-ignore
    const hidden = createTemplate([
      h('template', [d('if', 'false')], [
        h('p', [], ['foo']),
        'bar'
      ]),
      'baz'
    ])

    const vmHidden = render(hidden)
    expect(vmHidden.$el.outerHTML).toMatchSnapshot()
  })
})
