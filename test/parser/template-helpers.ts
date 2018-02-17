import { Store } from 'vuex'
import { mount, Wrapper } from '@vue/test-utils'
import {
  Template,
  Element,
  ExpressionNode,
  Attribute,
  Directive,
  VForDirective,
  ElementChild,
  TextNode
} from '@/parser/template'
import { Prop, Data, ChildComponent } from '@/parser/script'
import { VueFilePayload } from '@/parser/vue-file'
import VueComponent from '@/view/components/VueComponent.vue'
import { project as originalProject } from '@/view/store/modules/project'
import { mapValues } from '@/utils'

export function render(
  template: Template,
  props: Prop[] = [],
  data: Data[] = [],
  childComponents: ChildComponent[] = [],
  storeDocuments: Record<string, Partial<VueFilePayload>> = {}
): Wrapper<VueComponent> {
  const store = new Store({
    modules: { project: originalProject }
  })

  store.commit('project/changeDocument', 'file:///Test.vue')

  store.commit(
    'project/setDocuments',
    mapValues(storeDocuments, (doc, uri) => {
      return {
        uri,
        template: doc.template,
        props: doc.props || [],
        data: doc.data || [],
        childComponents: doc.childComponents || [],
        styles: doc.styles || { body: [] },
        scopeId: doc.scopeId || 'scope-id'
      }
    })
  )

  return mount(VueComponent, {
    propsData: {
      uri: 'file:///Test.vue',
      template,
      props,
      data,
      childComponents,
      styles: ''
    },
    store
  })
}

function processRootChildren(
  children: (Element | ExpressionNode | string)[]
): ElementChild[] {
  return children.map((c, i) => {
    const node = strToTextNode(c)
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
    children: processRootChildren(children),
    range: [-1, -1]
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
    children: children.map(strToTextNode),
    range: [-1, -1]
  }
}

export function a(name: string, value: string | null): Attribute {
  return {
    type: 'Attribute',
    directive: false,
    index: 0,
    name,
    value,
    range: [-1, -1]
  }
}

export function d(name: string, expression: string): Directive
export function d(
  name: string,
  options?: { argument?: string; modifiers?: string[] },
  expression?: string
): Directive
export function d(
  name: string,
  options: { argument?: string; modifiers?: string[] } | string = {},
  expression?: any
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
    expression: expression || null,
    range: [-1, -1]
  }
}

export function vFor(left: string[], right: string | null): VForDirective {
  const dir = d('for') as VForDirective
  dir.left = left
  dir.right = right
  return dir
}

export function exp(expression: string): ExpressionNode {
  return {
    type: 'ExpressionNode',
    path: [],
    expression,
    range: [-1, -1]
  }
}

function strToTextNode<T>(str: T | string): T | TextNode {
  return typeof str === 'string'
    ? {
        type: 'TextNode' as 'TextNode',
        path: [],
        text: str,
        range: [-1, -1] as [number, number]
      }
    : str
}
