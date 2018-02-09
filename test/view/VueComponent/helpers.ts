import { Store } from 'vuex'
import { mount, Wrapper } from '@vue/test-utils'
import {
  Template,
  Element,
  ExpressionNode,
  Attribute,
  Directive,
  ElementChild
} from '@/parser/template'
import { Prop, Data } from '@/parser/script'
import VueComponent from '@/view/components/VueComponent.vue'
import { project as originalProject } from '@/view/store/modules/project'

export function render(
  template: Template,
  props: Prop[] = [],
  data: Data[] = []
): Wrapper<VueComponent> {
  const store = new Store({
    modules: { project: originalProject }
  })

  return mount(VueComponent, {
    propsData: {
      template,
      props,
      data,
      styles: ''
    },
    store
  })
}

function processRootChildren(
  children: (Element | ExpressionNode | string)[]
): ElementChild[] {
  return children.map((c, i) => {
    const node =
      typeof c === 'string'
        ? {
            type: 'TextNode' as 'TextNode',
            path: [],
            text: c
          }
        : c

    modifyChildPath(node, [i])
    return node
  })
}

function modifyChildPath(child: ElementChild, path: number[]): ElementChild {
  child.path = path
  if (child.type === 'Element') {
    child.children.forEach((c, i) => {
      modifyChildPath(c, path.concat(i))
    })
  }
  return child
}

export function createTemplate(
  children: (Element | ExpressionNode | string)[]
): Template {
  return {
    type: 'Template',
    attributes: [],
    children: processRootChildren(children)
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
