import { describe, expect, it } from 'vitest'
import { createTemplate, render, h, a, exp } from '../../helpers/template'

describe('VueComponent basic', () => {
  it('should render template', () => {
    const template = createTemplate([
      h('p', [a('title', 'Hello')], ['Hello World!']),
    ])

    const vm = render(template)
    const p = vm.$el.querySelector('p')!
    expect(p.textContent).toBe('Hello World!')
    expect(p.getAttribute('title')).toBe('Hello')
  })

  it('should render empty value attribute', () => {
    const template = createTemplate([h('p', [a('data-scope-123456')], [])])

    const p = render(template).$el.querySelector('p')!
    expect(p.getAttribute('data-scope-123456')).toBe('')
  })

  it('should render expression', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [], [
        'This is ',
        exp('foo + bar')
      ])
    ])

    const vm = render(template)
    expect(vm.$el.querySelector('p')?.textContent).toBe(
      'This is {{ foo + bar }}',
    )
  })

  it('should replace resolved expression', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [], [
        'This is ',
        exp('test')
      ])
    ])

    const vm = render(template, [
      {
        name: 'test',
        type: 'String',
        default: 'replaced text',
      },
    ])
    expect(vm.$el.querySelector('p')?.textContent).toBe('This is replaced text')
  })
  it('should print an expression if it is resolved as null or undefined', () => {
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

    const vm = render(
      template,
      [],
      [
        {
          name: 'foo',
          default: null,
        },
        {
          name: 'bar',
          default: undefined,
        },
      ],
    )
    expect(vm.$el.querySelector('#foo')?.textContent).toBe('{{ foo }}')
    expect(vm.$el.querySelector('#bar')?.textContent).toBe('{{ bar }}')
  })

  it('should add class', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [a('class', 'foo bar')], [])
    ])

    const vm = render(template)
    expect(Array.from(vm.$el.querySelector('p')?.classList ?? [])).toEqual([
      'foo',
      'bar',
    ])
  })

  it('should add style', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [a('style', 'color: red; background: url(img;test.png);')], [])
    ])

    const vm = render(template)
    const p = vm.$el.querySelector('p')
    expect(p?.style.color).toBe('red')
    expect(p?.style.background).toBe('url(img;test.png)')
  })

  it('should not generate html node for text', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [], [
        'test'
      ])
    ])

    const vm = render(template)
    const p = vm.$el.querySelector('p')
    expect(p?.innerHTML).toBe('test')
  })
})
