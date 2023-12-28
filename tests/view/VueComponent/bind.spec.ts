import { describe, expect, it } from 'vitest'
import { createTemplate, render, h, a, d } from '../../helpers/template'

describe('VueComponent v-bind', () => {
  it('should bind attributes with v-bind', () => {
    // prettier-ignore
    const template = createTemplate([
      h('input', [
        d('bind', { argument: 'value' }, 'foo')
      ], [])
    ])

    const vm = render(template, [
      {
        name: 'foo',
        type: 'String',
        default: 'default value',
      },
    ])
    expect(vm.$el.querySelector('input')?.value).toBe('default value')
  })

  it('should bind properties with v-bind', () => {
    // prettier-ignore
    const template = createTemplate([
      h('div', [
        a('class', 'foo'),
        d('bind', { argument: 'innerHTML', modifiers: ['prop'] }, '"<p>Hi</p>"')
      ], [])
    ])

    const vm = render(template)
    expect(vm.$el.querySelector('.foo')?.innerHTML).toBe('<p>Hi</p>')
  })

  it('should merge a bound class with a static class', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [
        a('class', 'foo'),
        d('bind', { argument: 'class' }, 'bar')
      ], [])
    ])

    const vm = render(template, [
      {
        name: 'bar',
        type: 'String',
        default: 'test-class',
      },
    ])
    const p = vm.$el.querySelector('p')!
    expect(Array.from(p.classList)).toEqual(['foo', 'test-class'])
  })

  it('should merge a bound style with a static style', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [
        a('style', 'color: red;'),
        d('bind', { argument: 'style' }, 'foo')
      ], [])
    ])

    const vm = render(template, [
      {
        name: 'foo',
        type: 'String',
        default: 'font-size: 20px;',
      },
    ])
    const p = vm.$el.querySelector('p')!
    expect(p.style.color).toBe('red')
    expect(p.style.fontSize).toBe('20px')
  })
})
