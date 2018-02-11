import assert from 'assert'
import { Style, Rule, visitLastSelectors, Selector } from './style'
import { Template, Element, getNode, Attribute } from './template'

export function createStyleMatcher(style: Style) {
  const map = new StyleMap(style)

  return function matchStyle(template: Template, targetPath: number[]): Rule[] {
    const target = getNode(template, targetPath) as Element
    assert(
      target,
      '[style matcher] Target node is not found. path: ' +
        JSON.stringify(targetPath)
    )
    assert(
      target.type === 'Element',
      `[style matcher] Target node has unexpected type '${target.type}'`
    )

    return map.getCandidateRules(target).filter(rule => {
      return rule.selectors.reduce((acc, s) => {
        return acc || matchSelector(template, targetPath, s)
      }, false)
    })
  }
}

function matchSelector(
  template: Template,
  path: number[],
  selector: Selector
): boolean {
  if (path.length === 0) {
    return false
  }

  const node = getNode(template, path)
  if (!node || node.type !== 'Element') {
    return false
  }

  const attrMap = node.attributes.reduce<Map<string, Attribute>>(
    (map, attr) => {
      if (!attr.directive) {
        map.set(attr.name, attr)
      }
      return map
    },
    new Map()
  )

  // TODO: resolve complex selector
  // TODO: resolve :not and :matches
  return (
    matchSelectorByTag(node.name, selector) &&
    matchSelectorByClass(attrMap, selector) &&
    matchSelectorByAttribute(attrMap, selector) &&
    matchSelectorById(attrMap, selector)
  )
}

function matchSelectorByTag(tag: string, selector: Selector): boolean {
  return !selector.tag || tag === selector.tag
}

function matchSelectorById(
  attrs: Map<string, Attribute>,
  selector: Selector
): boolean {
  if (!selector.id) {
    return true
  }

  const id = attrs.get('id')
  return !!id && id.value === selector.id
}

function matchSelectorByClass(
  attrs: Map<string, Attribute>,
  selector: Selector
): boolean {
  if (selector.class.length === 0) {
    return true
  }

  const classes = attrs.get('class')
  if (!classes) {
    return false
  }

  const splittedClass = classes.value ? classes.value.split(/\s+/) : []
  return isSubset(selector.class, splittedClass)
}

function matchSelectorByAttribute(
  attrs: Map<string, Attribute>,
  selector: Selector
): boolean {
  if (selector.attributes.length === 0) {
    return true
  }

  return selector.attributes.reduce((acc, sel) => {
    // If accumlated flag is already `false`
    // the whole selector will be unmatched.
    if (!acc) return false

    // If it does not have operator, just check the attribute exists.
    if (!sel.operator) {
      return attrs.has(sel.name)
    }

    const attr = attrs.get(sel.name)
    const value = attr && attr.value
    if (value == null || sel.value == null) {
      return false
    }

    switch (sel.operator) {
      case '=':
        return sel.value === value
      case '~=':
        return value.split(/\s+/).indexOf(sel.value) >= 0
      case '|=':
        return sel.value === value || value.startsWith(sel.value + '-')
      case '^=':
        return value.startsWith(sel.value)
      default:
        // Unknown operator, always unmatched.
        return false
    }
  }, true)
}

function isSubset(target: string[], superSet: string[]): boolean {
  return target.reduce((acc, item) => {
    return acc && superSet.indexOf(item) >= 0
  }, true)
}

class StyleMap {
  private idMap = new Map<string, Rule[]>()
  private classMap = new Map<string, Rule[]>()
  private attributeMap = new Map<string, Rule[]>()
  private tagMap = new Map<string, Rule[]>()
  private universals: Rule[] = []

  constructor(style: Style) {
    visitLastSelectors(style, (selector, rule) => {
      // Register each rule to map keyed by the most right selector string.
      // The priority is: id > class > attribute name > tag > universal
      // e.g, if the selector is `a.link:hover`, the corresponding rule
      // will be registered into the class map keyed by "link".
      if (selector.id) {
        this.registerRule(this.idMap, selector.id, rule)
      } else if (selector.class.length > 0) {
        // It should register only one class as key because the class map is
        // traversed by all class names on element when matching phase.
        const first = selector.class[0]
        this.registerRule(this.classMap, first, rule)
      } else if (selector.attributes.length > 0) {
        // It should register only one attribute name as key as same reason as class.
        const first = selector.attributes[0]
        this.registerRule(this.attributeMap, first.name, rule)
      } else if (selector.tag) {
        this.registerRule(this.tagMap, selector.tag, rule)
      } else {
        // All other selectors should be universal
        this.universals.push(rule)
      }
    })
  }

  getCandidateRules(el: Element): Rule[] {
    const tagMatched = this.tagMap.get(el.name) || []

    const attrsMatched = el.attributes.reduce<Rule[]>((acc, attr) => {
      if (attr.directive) return acc

      if (attr.value) {
        if (attr.name === 'id') {
          acc = acc.concat(this.idMap.get(attr.value) || [])
        }

        if (attr.name === 'class') {
          const matched = attr.value.split(/\s+/).reduce<Rule[]>((acc, c) => {
            return acc.concat(this.classMap.get(c) || [])
          }, [])
          acc = acc.concat(matched)
        }
      }

      return acc.concat(this.attributeMap.get(attr.name) || [])
    }, [])

    return [...tagMatched, ...attrsMatched, ...this.universals]
  }

  private registerRule(
    map: Map<string, Rule[]>,
    key: string,
    rule: Rule
  ): void {
    const list = map.get(key) || []
    map.set(key, list.concat(rule))
  }
}
