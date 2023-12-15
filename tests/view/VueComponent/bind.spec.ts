import { createTemplate, render, h, a, d } from '../../helpers/template'

describe('VueComponent v-bind', () => {
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
        default: 'default value',
      },
    ])
    expect(wrapper.find('input').attributes()!.value).toBe('default value')
  })

  it('should bind properties with v-bind', () => {
    // prettier-ignore
    const template = createTemplate([
      h('div', [
        a('class', 'foo'),
        d('bind', { argument: 'innerHTML', modifiers: ['prop'] }, '"<p>Hi</p>"')
      ], [])
    ])

    const wrapper = render(template)
    expect(wrapper.find('.foo').html()).toBe('<div class="foo"><p>Hi</p></div>')
  })

  it('should merge a bound class with a static class', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [
        a('class', 'foo'),
        d('bind', { argument: 'class' }, 'bar')
      ], [])
    ])

    const wrapper = render(template, [
      {
        name: 'bar',
        type: 'String',
        default: 'test-class',
      },
    ])
    const p = wrapper.find('p')
    expect(p.classes()).toEqual(['foo', 'test-class'])
  })

  it('should merge a bound style with a static style', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', [
        a('style', 'color: red;'),
        d('bind', { argument: 'style' }, 'foo')
      ], [])
    ])

    const wrapper = render(template, [
      {
        name: 'foo',
        type: 'String',
        default: 'font-size: 20px;',
      },
    ])
    const p = wrapper.find('p')
    expect(p.element.style.color).toBe('red')
    expect(p.element.style.fontSize).toBe('20px')
  })
})
