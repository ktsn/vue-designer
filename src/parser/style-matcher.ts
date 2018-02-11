import assert from 'assert'
import { Style, Rule, visitLastSelectors } from './style'
import { Template, Element, getNode } from './template'

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

    const candidates = map.getCandidateRules(target)

    // TODO: narrow candidate rules
    return candidates
  }
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
