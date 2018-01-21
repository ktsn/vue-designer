import { createTemplate, render, h, a, d, exp } from './helpers'

describe('VueComponent basic', () => {
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
})
