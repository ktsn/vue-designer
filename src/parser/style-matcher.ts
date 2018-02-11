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

  const attrMap = node.attributes.reduce<Record<string, Attribute>>(
    (map, attr) => {
      if (attr.directive) return map

      map[attr.name] = attr
      return map
    },
    {}
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
  attrs: Record<string, Attribute>,
  selector: Selector
): boolean {
  if (!selector.id) {
    return true
  }

  const id = attrs.id
  return Boolean(id) && id.value === selector.id
}

function matchSelectorByClass(
  attrs: Record<string, Attribute>,
  selector: Selector
): boolean {
  if (selector.class.length === 0) {
    return true
  }

  const classes = attrs.class
  if (!classes) {
    return false
  }

  const splittedClass = classes.value ? classes.value.split(/\s+/) : []
  return isSubset(selector.class, splittedClass)
}

function matchSelectorByAttribute(
  attrs: Record<string, Attribute>,
  selector: Selector
): boolean {
  if (selector.attributes.length === 0) {
    return true
  }

  // TODO: Resolve operator and value
  return isSubset(
    selector.attributes.map(attrSelector => attrSelector.name),
    Object.keys(attrs)
  )
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
        selector.class.forEach(c => {
          this.registerRule(this.classMap, c, rule)
        })
      } else if (selector.attributes.length > 0) {
        selector.attributes.forEach(attr => {
          this.registerRule(this.attributeMap, attr.name, rule)
        })
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
      if (attr.directive || !attr.value) return acc

      if (attr.name === 'id') {
        acc = acc.concat(this.idMap.get(attr.value) || [])
      }

      if (attr.name === 'class') {
        const matched = attr.value.split(/\s+/).reduce<Rule[]>((acc, c) => {
          return acc.concat(this.classMap.get(c) || [])
        }, [])
        acc = acc.concat(matched)
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
