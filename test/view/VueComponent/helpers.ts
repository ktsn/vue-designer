import { mount, Wrapper } from '@vue/test-utils'
import {
  Template,
  Element,
  ExpressionNode,
  Attribute,
  Directive
} from '../../../src/parser/template'
import { Prop, Data } from '../../../src/parser/script'
import VueComponent from '@/view/components/VueComponent.vue'

export function render(
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

export function createTemplate(
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

export function h(
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

export function a(name: string, value: string | null): Attribute {
  return {
    type: 'Attribute',
    directive: false,
    index: 0,
    name,
    value
  }
}

export function d(name: string, expression: string, value?: any): Directive
export function d(
  name: string,
  options?: { argument?: string; modifiers?: string[] },
  expression?: string,
  value?: any
): Directive
export function d(
  name: string,
  options: { argument?: string; modifiers?: string[] } | string = {},
  expression?: any,
  value?: any
): Directive {
  if (typeof options === 'string') {
    value = expression
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
    expression: expression || null,
    value
  }
}

export function exp(expression: string): ExpressionNode {
  return {
    type: 'ExpressionNode',
    path: [],
    expression
  }
}
