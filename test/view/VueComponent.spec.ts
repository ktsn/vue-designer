import { mount, Wrapper } from '@vue/test-utils'
import VueComponent from '@/view/components/VueComponent.vue'
import { Template, Element, ExpressionNode } from 'parser/template'
import { Prop, Data } from 'parser/script'

jest.mock('../../src/view/mixins/shadow-dom', () => {
  return {}
})

describe('VueComponent', () => {
  it('should render template', () => {
    const template = createTemplate([
      h('p', { title: 'Hello' }, ['Hello World!'])
    ])

    const wrapper = render(template)
    const p = wrapper.find('p')
    expect(p.text()).toBe('Hello World!')
    expect(p.attributes()!.title).toBe('Hello')
  })

  it('should render expression', () => {
    // prettier-ignore
    const template = createTemplate([
      h('p', {}, [
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
      h('p', {}, [
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
  attrs: Record<string, string | null>,
  children: (Element | ExpressionNode | string)[]
): Element {
  const attributes = Object.keys(attrs).map((key, i) => {
    return {
      type: 'Attribute' as 'Attribute',
      index: i,
      name: key,
      value: attrs[key]
    }
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

function exp(expression: string): ExpressionNode {
  return {
    type: 'ExpressionNode',
    path: [],
    expression
  }
}
