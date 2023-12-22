import { describe, expect, it } from 'vitest'
import { createTemplate, h, render, exp, a, d } from '../../helpers/template'

describe('VueComponent child components', () => {
  it('should render child components in the store', () => {
    // prettier-ignore
    const template = createTemplate([
      h('div', [], [
        h('p', [], ['Normal element']),
        h('Foo', [], [])
      ])
    ])

    const components = {
      'file:///Foo.vue': {
        // prettier-ignore
        template: createTemplate([
          h('button', [], ['Component button'])
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
      components
    )

    expect(vm.$el.querySelector('p')!.textContent).toBe('Normal element')
    expect(vm.$el.querySelector('button')!.textContent).toBe('Component button')
  })

  it("should use child component's scope", () => {
    // prettier-ignore
    const template = createTemplate([
      h('Child', [], [])
    ])

    const components = {
      'file:///Child.vue': {
        // prettier-ignore
        template: createTemplate([
          h('div', [], [
            h('div', [a('id', 'first')], [
              exp('parentValue')
            ]),
            h('div', [a('id', 'second')], [
              exp('bothValue')
            ])
          ])
        ]),
        data: [
          {
            name: 'bothValue',
            default: 'should render child value',
          },
        ],
      },
    }

    const vm = render(
      template,
      [],
      [
        {
          name: 'parentValue',
          default: 'should not be rendered in child',
        },
        {
          name: 'bothValue',
          default: 'should not be rendered in child',
        },
      ],
      [
        {
          name: 'Child',
          uri: 'file:///Child.vue',
        },
      ],
      components
    )

    // should not resolved since child component does not have the value
    expect(vm.$el.querySelector('#first')!.textContent).toBe(
      '{{ parentValue }}'
    )

    // should resolved as child component value
    expect(vm.$el.querySelector('#second')!.textContent).toBe(
      'should render child value'
    )
  })

  it('passes attribute values as props to a child component', () => {
    // prettier-ignore
    const template = createTemplate([
      h('div', [], [
        h('Foo', [a('message', 'hello from parent')], [])
      ])
    ])

    const components = {
      'file:///Foo.vue': {
        // prettier-ignore
        template: createTemplate([
          h('h1', [], [exp('message')])
        ]),
        props: [
          {
            name: 'message',
            type: 'String',
          },
        ],
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
      components
    )
    expect(vm.$el.querySelector('h1')!.textContent).toBe('hello from parent')
  })

  it('passes empty valued attribute as `true` value', () => {
    // prettier-ignore
    const template = createTemplate([
      h('div', [], [
        h('Foo', [a('enabled')], [])
      ])
    ])

    const components = {
      'file:///Foo.vue': {
        // prettier-ignore
        template: createTemplate([
          h('h1', [], [exp('enabled && \'Success\'')])
        ]),
        props: [
          {
            name: 'enabled',
            type: 'Boolean',
          },
        ],
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
      components
    )
    expect(vm.$el.querySelector('h1')!.textContent).toBe('Success')
  })

  it('passes v-bind values as props to a child component', () => {
    // prettier-ignore
    const template = createTemplate([
      h('div', [], [
        h('Foo', [d('bind', { argument: 'childMessage' }, 'message')], [])
      ])
    ])

    const components = {
      'file:///Foo.vue': {
        // prettier-ignore
        template: createTemplate([
          h('h1', [], [exp('childMessage')])
        ]),
        props: [
          {
            name: 'childMessage',
            type: 'String',
          },
        ],
      },
    }
    const vm = render(
      template,
      [],
      [
        {
          name: 'message',
          default: 'hello from parent v-bind',
        },
      ],
      [
        {
          name: 'Foo',
          uri: 'file:///Foo.vue',
        },
      ],
      components
    )
    expect(vm.$el.querySelector('h1')!.textContent).toBe(
      'hello from parent v-bind'
    )
  })

  it('does not pass props if child component does not declare it', () => {
    // prettier-ignore
    const template = createTemplate([
      h('div', [], [
        h('Foo', [a('message', 'hello from parent')], [])
      ])
    ])

    const components = {
      'file:///Foo.vue': {
        // prettier-ignore
        template: createTemplate([
          h('h1', [], [exp('message')])
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
      components
    )
    expect(vm.$el.querySelector('h1')!.textContent).toBe('{{ message }}') // not resolved
  })
})
