import { createTemplate, render, h, d } from '../../helpers/template'

describe('VueComponent v-if', () => {
  it('should appear if v-if="true"', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('if', 'true')], [
        'test'
      ])
    ])

    const p = render(template).find('p')
    expect(p.exists()).toBe(true)
  })

  it('should be removed if v-if="false"', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('if', 'false')], [
        'test'
      ])
    ])

    const p = render(template).find('p')
    expect(p.exists()).toBe(false)
  })

  it('should appear if the expression is resolved to truthy', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('if', 'foo')], [
        'test'
      ])
    ])

    const p = render(template, [
      {
        name: 'foo',
        type: 'Number',
        default: 123,
      },
    ]).find('p')

    expect(p.exists()).toBe(true)
  })

  it('should be removed if the expression is resolved to falthy', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('if', 'bar')], [
        'test'
      ])
    ])

    const p = render(
      template,
      [],
      [
        {
          name: 'bar',
          default: null,
        },
      ]
    ).find('p')

    expect(p.exists()).toBe(false)
  })

  it('should be removed if the expression cannot be resolved', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [d('if', 'foo + bar')], [
        'test'
      ])
    ])

    const p = render(template).find('p')
    expect(p.exists()).toBe(false)
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

    expect(render(shown).html()).toMatchSnapshot()

    // prettier-ignore
    const hidden = createTemplate([
      h('template', [d('if', 'false')], [
        h('p', [], ['foo']),
        'bar'
      ]),
      'baz'
    ])

    expect(render(hidden).html()).toMatchSnapshot()
  })
})
