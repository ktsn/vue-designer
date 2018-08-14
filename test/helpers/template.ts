import { store as createStore, module } from 'sinai'
import { mount, Wrapper } from '@vue/test-utils'
import {
  TETemplate,
  TEElement,
  TEExpressionNode,
  TEAttribute,
  TEDirective,
  TEForDirective,
  TEChild,
  TETextNode
} from '@/parser/template/types'
import { Prop, Data, ChildComponent } from '@/parser/script/types'
import { VueFilePayload } from '@/parser/vue-file'
import VueComponent from '@/view/components/VueComponent.vue'
import { project } from '@/view/store/modules/project'
import { mapValues } from '@/utils'

export function render(
  template: TETemplate,
  props: Prop[] = [],
  data: Data[] = [],
  childComponents: ChildComponent[] = [],
  storeDocuments: Record<string, Partial<VueFilePayload>> = {}
): Wrapper<VueComponent> {
  const store = createStore(module().child('project', project))

  store.mutations.project.changeDocument('file:///Test.vue')
  store.mutations.project.refreshScope({
    uri: 'file:///Test.vue',
    props,
    data
  })

  store.mutations.project.setDocuments(
    mapValues(storeDocuments, (doc, uri) => {
      return {
        uri,
        template: doc.template,
        props: doc.props || [],
        data: doc.data || [],
        childComponents: doc.childComponents || [],
        styles: doc.styles || [],
        scopeId: doc.scopeId || 'scope-id'
      }
    })
  )

  Object.keys(storeDocuments).forEach(uri => {
    const doc = storeDocuments[uri]
    store.mutations.project.refreshScope({
      uri,
      props: doc.props || [],
      data: doc.data || []
    })
  })

  return mount(VueComponent, {
    propsData: {
      uri: 'file:///Test.vue',
      template,
      scope: store.getters.project.currentScope,
      childComponents,
      styles: ''
    },
    store
  })
}

function processRootChildren(
  children: (TEElement | TEExpressionNode | string)[]
): TEChild[] {
  return children.map((c, i) => {
    const node = strToTextNode(c)
    modifyChildPath(node, [i])
    return node
  })
}

function modifyChildPath(
  child: TEChild,
  path: number[]
): TEChild {
  child.path = path
  if (child.type === 'Element') {
    child.children.forEach((c, i) => {
      modifyChildPath(c, path.concat(i))
    })
  }
  return child
}

export function createTemplate(
  children: (TEElement | TEExpressionNode | string)[]
): TETemplate {
  return {
    type: 'Template',
    attrs: {},
    children: processRootChildren(children),
    range: [-1, -1]
  }
}

export function h(
  tag: string,
  attributes: (TEAttribute | TEDirective)[],
  children: (TEElement | TEExpressionNode | string)[],
  options: { selfClosing?: boolean; hasEndTag?: boolean } = {}
): TEElement {
  const attrs: Record<string, TEAttribute> = {}
  const props: Record<string, TEDirective> = {}
  const domProps: Record<string, TEDirective> = {}
  const dirs: TEDirective[] = []
  attributes.forEach((attr, i) => {
    attr.attrIndex = i

    if (attr.type === 'Attribute') {
      attrs[attr.name] = attr
    } else if (attr.name === 'bind' && attr.argument !== undefined) {
      if (attr.modifiers.prop) {
        domProps[attr.argument] = attr
      } else {
        props[attr.argument] = attr
      }
    } else {
      dirs.push(attr)
    }
  })

  const selfClosing = options.selfClosing || false
  const hasEndTag = options.hasEndTag === undefined ? true : options.hasEndTag

  return {
    type: 'Element',
    path: [],
    name: tag,
    startTag: {
      type: 'StartTag',
      attrs,
      props,
      domProps,
      directives: dirs,
      selfClosing,
      range: [-1, -1]
    },
    endTag: !hasEndTag
      ? undefined
      : {
          type: 'EndTag',
          range: [-1, -1]
        },
    children: children.map(strToTextNode),
    range: [-1, -1]
  }
}

export function a(name: string, value?: string): TEAttribute {
  return {
    type: 'Attribute',
    attrIndex: -1,
    name,
    value,
    range: [-1, -1]
  }
}

export function d(name: string, expression: string): TEDirective
export function d(
  name: string,
  options?: { argument?: string; modifiers?: string[] },
  expression?: string
): TEDirective
export function d(
  name: string,
  options: { argument?: string; modifiers?: string[] } | string = {},
  expression?: any
): TEDirective {
  if (typeof options === 'string') {
    expression = options
    options = {}
  }

  const modifiers: Record<string, true> = {}
  if (options.modifiers) {
    options.modifiers.forEach(key => {
      modifiers[key] = true
    })
  }

  return {
    type: 'Directive',
    attrIndex: 0,
    name,
    argument: options.argument,
    modifiers,
    expression: expression,
    range: [-1, -1]
  }
}

export function vFor(left: string[], right?: string): TEForDirective {
  const dir = d('for') as TEForDirective
  dir.left = left
  dir.right = right
  return dir
}

export function exp(expression: string): TEExpressionNode {
  return {
    type: 'ExpressionNode',
    path: [],
    expression,
    range: [-1, -1]
  }
}

function strToTextNode<T>(str: T | string): T | TETextNode {
  return typeof str === 'string'
    ? {
        type: 'TextNode' as 'TextNode',
        path: [],
        text: str,
        range: [-1, -1] as [number, number]
      }
    : str
}

export function assertWithoutRange(
  result: TETemplate,
  expected: TETemplate
): void {
  expect(excludeRange(result)).toEqual(excludeRange(expected))
}

function excludeRange(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(excludeRange)
  } else if (obj === null || typeof obj !== 'object') {
    return obj
  }

  const res: any = {}
  Object.keys(obj).forEach(key => {
    if (key !== 'range') {
      const value = obj[key]
      res[key] = excludeRange(value)
    }
  })
  return res
}
