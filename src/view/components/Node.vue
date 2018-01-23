<script lang="ts">
import Vue, { VNode, VNodeDirective } from 'vue'
import Child from './Child.vue'
import {
  Element,
  Attribute,
  Directive,
  ElementChild
} from '../../parser/template'
import { DefaultValue } from '../../parser/script'

function findDirective(
  attrs: (Attribute | Directive)[],
  fn: (directive: Directive) => boolean
): Directive | undefined {
  return attrs.find((attr): attr is Directive => {
    return attr.directive && fn(attr)
  })
}

function inScope(
  exp: string | null,
  scope: Record<string, DefaultValue>
): exp is string {
  return Boolean(exp && exp in scope)
}

function directiveValue(
  dir: Directive,
  scope: Record<string, DefaultValue>
): DefaultValue | undefined {
  const exp = dir.expression
  return dir.value || (inScope(exp, scope) && scope[exp])
}

function toAttrs(
  attrs: (Attribute | Directive)[],
  scope: Record<string, DefaultValue>
): Record<string, DefaultValue> {
  const res: Record<string, DefaultValue> = {}

  attrs.forEach(attr => {
    if (!attr.directive) {
      res[attr.name] = attr.value
    } else if (inScope(attr.expression, scope)) {
      if (attr.name === 'bind' && attr.argument) {
        res[attr.argument] = scope[attr.expression]
      } else if (attr.name === 'model') {
        res.value = scope[attr.expression]
      }
    }
  })

  return res
}

function getVShowDirective(
  attrs: (Attribute | Directive)[],
  scope: Record<string, DefaultValue>
): VNodeDirective | undefined {
  const vShow = attrs.find(a => a.directive && a.name === 'show') as
    | Directive
    | undefined
  if (!vShow) return

  const modifierMap: Record<string, boolean> = {}
  vShow.modifiers.forEach(modifier => {
    modifierMap[modifier] = true
  })

  return {
    name: 'show',
    expression: vShow.expression,
    oldValue: undefined,
    arg: vShow.argument || '',
    modifiers: modifierMap,
    value: directiveValue(vShow, scope)
  }
}

function shouldAppearChild(
  acc: ElementChild[],
  child: ElementChild,
  scope: Record<string, DefaultValue>
): ElementChild[] {
  if (child.type === 'Element') {
    const vIf = findDirective(child.attributes, d => d.name === 'if')
    if (vIf) {
      return directiveValue(vIf, scope) ? acc.concat(child) : acc
    }

    const vElse = findDirective(child.attributes, d => d.name === 'else')
    if (vElse) {
      const isElement = (node: ElementChild): node is Element => {
        return node.type === 'Element'
      }

      const elements = acc.filter(isElement)
      const last = elements[elements.length - 1]
      if (!last) {
        return acc.concat(child)
      }

      const lastVIf = findDirective(
        last.attributes,
        dir => dir.name === 'if' || dir.name === 'else-if'
      )

      if (!lastVIf) {
        return acc.concat(child)
      }

      return !directiveValue(lastVIf, scope) ? acc.concat(child) : acc
    }
  }

  return acc.concat(child)
}

export default Vue.extend({
  name: 'Node',
  functional: true,

  props: {
    data: {
      type: Object as { (): Element },
      required: true
    },
    scope: {
      type: Object as { (): Record<string, string> },
      required: true
    }
  },

  render(h, { props }): VNode {
    const { data, scope } = props
    const vShow = getVShowDirective(data.attributes, scope)

    const filteredChildren = data.children.reduce<ElementChild[]>(
      (acc, child) => shouldAppearChild(acc, child, scope),
      []
    )

    return h(
      data.name,
      {
        attrs: toAttrs(data.attributes, scope),
        directives: vShow ? [vShow] : []
      },
      filteredChildren.map(c => {
        return h(Child, {
          props: {
            data: c,
            scope
          }
        })
      })
    )
  }
})
</script>
