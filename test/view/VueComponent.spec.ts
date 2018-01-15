import { mount, Wrapper } from '@vue/test-utils'
import VueComponent from '@/view/components/VueComponent.vue'
import {
  Template,
  Element,
  ExpressionNode,
  Directive,
  Attribute
} from 'parser/template'
import { Prop, Data } from 'parser/script'

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
})

function render(
  template: Template,
  props: Prop[] = [],
  data: Data[] = []
): Wrapper<VueComponent> {
  return mount(VueComponent, {
    propsData: {
      template,
      props,
      data,
      styles: []
    }
  })
}

function createTemplate(
  children: (Element | ExpressionNode | string)[]
): Template {
  return {
    type: 'Template',
    attributes: [],
    children: children.map(c => {
      return typeof c === 'string'
        ? {
            type: 'TextNode' as 'TextNode',
            path: [],
            text: c
          }
        : c
    })
  }
}

function h(
  tag: string,
  attributes: (Attribute | Directive)[],
  children: (Element | ExpressionNode | string)[]
): Element {
  attributes.forEach((attr, i) => {
    attr.index = i
  })

  return {
    type: 'Element',
    path: [],
    name: tag,
    attributes,
    children: children.map(c => {
      return typeof c === 'string'
        ? {
            type: 'TextNode' as 'TextNode',
            path: [],
            text: c
          }
        : c
    })
  }
}

function a(name: string, value: string | null): Attribute {
  return {
    type: 'Attribute',
    directive: false,
    index: 0,
    name,
    value
  }
}

function d(name: string, expression: string): Directive
function d(
  name: string,
  options?: { argument?: string; modifiers?: string[] },
  expression?: string
): Directive
function d(
  name: string,
  options: { argument?: string; modifiers?: string[] } | string = {},
  expression?: string
): Directive {
  if (typeof options === 'string') {
    expression = options
    options = {}
  }
  return {
    type: 'Attribute',
    directive: true,
    index: 0,
    name,
    argument: options.argument || null,
    modifiers: options.modifiers || [],
    expression: expression || null
  }
}

function exp(expression: string): ExpressionNode {
  return {
    type: 'ExpressionNode',
    path: [],
    expression
  }
}
