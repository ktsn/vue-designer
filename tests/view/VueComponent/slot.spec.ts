import { describe, expect, it } from 'vitest'
import { createTemplate, h, render, a } from '../../helpers/template'

describe('VueComponent slot', () => {
  it('renders placeholder slot content', () => {
    // prettier-ignore
    const template = createTemplate([
      h('div', [], [
        h('slot', [], [
          h('p', [], ['placeholder content'])
        ])
      ])
    ])

    const vm = render(template)
    expect(vm.$el.outerHTML).toMatchSnapshot()
  })

  it('renders slot content', () => {
    // prettier-ignore
    const template = createTemplate([
      h('Foo', [], [
        h('p', [], ['injected'])
      ])
    ])

    const components = {
      'file:///Foo.vue': {
        // prettier-ignore
        template: createTemplate([
          h('div', [], [
            h('p', [], ['foo content']),
            h('slot', [], [])
          ])
        ]),
      },
    }

    const vm = render(
      template,
      [],
      [],
      [
        {
          name: 'Foo',
          uri: 'file:///Foo.vue',
        },
      ],
      components,
    )

    expect(vm.$el.outerHTML).toMatchSnapshot()
  })

  it('renders named slot content', () => {
    // prettier-ignore
    const template = createTemplate([
      h('Foo', [], [
        h('p', [], ['default']),
        h('p', [a('slot', 'test')], ['named'])
      ])
    ])

    const components = {
      'file:///Foo.vue': {
        // prettier-ignore
        template: createTemplate([
          h('div', [], [
            h('p', [], ['foo content']),
            h('slot', [a('name', 'test')], [])
          ])
        ]),
      },
    }

    const vm = render(
      template,
      [],
      [],
      [
        {
          name: 'Foo',
          uri: 'file:///Foo.vue',
        },
      ],
      components,
    )

    expect(vm.$el.outerHTML).toMatchSnapshot()
  })

  it('resolves template element children as the named slot', () => {
    // prettier-ignore
    const template = createTemplate([
      h('Foo', [], [
        h('template', [a('slot', 'test')], [
          h('strong', [], ['named']),
          h('span', [], ['content'])
        ])
      ])
    ])

    const components = {
      'file:///Foo.vue': {
        // prettier-ignore
        template: createTemplate([
          h('div', [], [
            h('slot', [a('name', 'test')], [])
          ])
        ]),
      },
    }

    const vm = render(
      template,
      [],
      [],
      [
        {
          name: 'Foo',
          uri: 'file:///Foo.vue',
        },
      ],
      components,
    )

    expect(vm.$el.outerHTML).toMatchSnapshot()
  })
})
