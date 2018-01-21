import { createTemplate, render, h, a, d, exp } from './helpers'

describe('VueComponent v-show', () => {
  it('should show if v-show="true"', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('show', 'true', true)], [
        'test'
      ])
    ])

    const p = render(template).find('p')
    expect(p.element.style.display).not.toBe('none')
  })

  it('should hide if v-show="false"', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('show', 'false', false)], [
        'test'
      ])
    ])

    const p = render(template).find('p')
    expect(p.element.style.display).toBe('none')
  })

  it('should show if expression is resolved to truthy', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('show', 'foo')], [
        'test'
      ])
    ])

    const p = render(template, [
      {
        name: 'foo',
        type: 'String',
        default: 'abc'
      }
    ]).find('p')
    expect(p.element.style.display).not.toBe('none')
  })

  it('should hide if expression is resolved to falsy', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('show', 'bar')], [
        'test'
      ])
    ])

    const p = render(template, [
      {
        name: 'bar',
        type: 'Number',
        default: 0
      }
    ]).find('p')
    expect(p.element.style.display).toBe('none')
  })

  it('should hide if cannot be resolved', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('show', 'foo || bar')], [
        'test'
      ])
    ])

    const p = render(template).find('p')
    expect(p.element.style.display).toBe('none')
  })
})
