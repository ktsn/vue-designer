import { createTemplate, render, h, a, d, exp } from './VueComponent/helpers'

jest.mock('../../src/view/mixins/shadow-dom', () => {
  return {}
})

describe('VueComponent', () => {
  it('should render template', () => {
    const template = createTemplate([
      h('p', [a('title', 'Hello')], ['Hello World!'])
    ])

    const wrapper = render(template)
    const p = wrapper.find('p')
    expect(p.text()).toBe('Hello World!')
    expect(p.attributes()!.title).toBe('Hello')
  })

  it('should render expression', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [], [
        'This is ',
        exp('foo + bar')
      ])
    ])

    const wrapper = render(template)
    expect(wrapper.find('p').text()).toBe('This is {{ foo + bar }}')
  })

  it('should replace resolved expression', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [], [
        'This is ',
        exp('test')
      ])
    ])

    const wrapper = render(template, [
      {
        name: 'test',
        type: 'String',
        default: 'replaced text'
      }
    ])
    expect(wrapper.find('p').text()).toBe('This is replaced text')
  })

  it('should print an empty string if the expression is resolved as null or undefined', () => {
    // prettier-ignore
    const template = createTemplate([
      h('div', [], [
        h('p', [a('id', 'foo')], [
          exp('foo')
        ]),
        h('p', [a('id', 'bar')], [
          exp('bar')
        ])
      ])
    ])

    const wrapper = render(
      template,
      [],
      [
        {
          name: 'foo',
          default: null
        },
        {
          name: 'bar',
          default: undefined
        }
      ]
    )
    expect(wrapper.find('#foo').text()).toBe('')
    expect(wrapper.find('#bar').text()).toBe('')
  })

  it('should bind attributes with v-bind', () => {
    // prettier-ignore
    const template = createTemplate([
      h('input', [
        d('bind', { argument: 'value' }, 'foo')
      ], [])
    ])

    const wrapper = render(template, [
      {
        name: 'foo',
        type: 'String',
        default: 'default value'
      }
    ])
    expect(wrapper.find('input').attributes()!.value).toBe('default value')
  })

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
    expect(wrapper.find('input').attributes()!.value).toBe('message')
  })

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

  it('should show if v-show expression is resolved to truthy', () => {
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

  it('should hide if v-show expression is resolved to falsy', () => {
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

  it('should hide if v-show cannot be resolved', () => {
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
