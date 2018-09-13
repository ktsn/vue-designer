import { createTemplate, h, render, a, exp } from '../../helpers/template'

describe('VueComponent scoped slot', () => {
  it('renders scoped slot content', () => {
    // prettier-ignore
    const template = createTemplate([
      h('Foo', [], [
        h('p', [a('slot-scope', 'props')], [exp('props.foo')])
      ])
    ])

    const components = {
      'file://Foo.vue': {
        // prettier-ignore
        template: createTemplate([
          h('div', [], [
            h('p', [], ['foo content']),
            h('slot', [a('foo', 'test')], [])
          ])
        ])
      }
    }

    const wrapper = render(
      template,
      [],
      [],
      [
        {
          name: 'Foo',
          uri: 'file://Foo.vue'
        }
      ],
      components
    )

    expect(wrapper.html()).toMatchSnapshot()
  })

  it('renders named scoped slot content', () => {
    // prettier-ignore
    const template = createTemplate([
      h('Foo', [], [
        h('p', [a('slot-scope', 'props')], [exp('props.foo')]),
        h('p', [a('slot', 'test'), a('slot-scope', 'props')], [exp('props.foo')])
      ])
    ])

    const components = {
      'file://Foo.vue': {
        // prettier-ignore
        template: createTemplate([
          h('div', [], [
            h('p', [], ['foo content']),
            h('slot', [a('foo', 'test1')], []),
            h('slot', [a('name', 'test'), a('foo', 'test2')], [])
          ])
        ])
      }
    }

    const wrapper = render(
      template,
      [],
      [],
      [
        {
          name: 'Foo',
          uri: 'file://Foo.vue'
        }
      ],
      components
    )

    expect(wrapper.html()).toMatchSnapshot()
  })

  it('resolves template element children as a slot', () => {
    // prettier-ignore
    const template = createTemplate([
      h('Foo', [], [
        h('template', [a('slot-scope', 'props')], [
          h('div', [], ['named']),
          h('div', [], [exp('props.foo')])
        ])
      ])
    ])

    const components = {
      'file://Foo.vue': {
        // prettier-ignore
        template: createTemplate([
          h('div', [], [
            h('slot', [a('foo', 'test')], [])
          ])
        ])
      }
    }

    const wrapper = render(
      template,
      [],
      [],
      [
        {
          name: 'Foo',
          uri: 'file://Foo.vue'
        }
      ],
      components
    )

    expect(wrapper.html()).toMatchSnapshot()
  })
})
