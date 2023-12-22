import { describe, expect, it } from 'vitest'
import { createTemplate, render, h, d } from '../../helpers/template'

describe('VueComponent v-show', () => {
  it('should show if v-show="true"', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('show', 'true')], [
        'test'
      ])
    ])

    const vm = render(template)
    const p = vm.$el.querySelector('p')!
    expect(p.style.display).not.toBe('none')
  })

  it('should hide if v-show="false"', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('show', 'false')], [
        'test'
      ])
    ])

    const vm = render(template)
    const p = vm.$el.querySelector('p')!
    expect(p.style.display).toBe('none')
  })

  it('should show if expression is resolved to truthy', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('show', 'foo')], [
        'test'
      ])
    ])

    const vm = render(template, [
      {
        name: 'foo',
        type: 'String',
        default: 'abc',
      },
    ])
    const p = vm.$el.querySelector('p')!
    expect(p.style.display).not.toBe('none')
  })

  it('should hide if expression is resolved to falsy', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('show', 'bar')], [
        'test'
      ])
    ])

    const vm = render(template, [
      {
        name: 'bar',
        type: 'Number',
        default: 0,
      },
    ])
    const p = vm.$el.querySelector('p')!
    expect(p.style.display).toBe('none')
  })

  it('should hide if cannot be resolved', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('show', 'foo || bar')], [
        'test'
      ])
    ])

    const vm = render(template)
    const p = vm.$el.querySelector('p')!
    expect(p.style.display).toBe('none')
  })
})
