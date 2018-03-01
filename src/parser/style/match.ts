import assert from 'assert'
import * as style from './types'
import { visitLastSelectors } from './manipulate'
import * as template from '../template/types'
import { getNode } from '../template/manipulate'
import { range } from '../../utils'

export function createStyleMatcher(styles: style.Style[]) {
  const map = new StyleMap(styles)

  return function matchStyle(
    template: template.Template,
    targetPath: number[]
  ): style.Rule[] {
    const target = getNode(template, targetPath) as template.Element
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
        return acc || matchSelector(target, s, template)
      }, false)
    })
  }
}

function matchSelector(
  target: template.Element,
  selector: style.Selector,
  template: template.Template
): boolean {
  const attrMap = target.startTag.attributes.reduce<
    Map<string, template.Attribute>
  >((map, attr) => {
    if (!attr.directive) {
      map.set(attr.name, attr)
    }
    return map
  }, new Map())

  // TODO: resolve some pseudo class (e.g. :nth-child, :not and :matches)
  return (
    matchSelectorByTag(target.name, selector) &&
    matchSelectorByClass(attrMap, selector) &&
    matchSelectorByAttribute(attrMap, selector) &&
    matchSelectorById(attrMap, selector) &&
    matchCombinator(target, selector, template)
  )
}

function matchSelectorByTag(tag: string, selector: style.Selector): boolean {
  return !selector.tag || tag === selector.tag
}

function matchSelectorById(
  attrs: Map<string, template.Attribute>,
  selector: style.Selector
): boolean {
  if (!selector.id) {
    return true
  }

  const id = attrs.get('id')
  return !!id && id.value === selector.id
}

function matchSelectorByClass(
  attrs: Map<string, template.Attribute>,
  selector: style.Selector
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
  attrs: Map<string, template.Attribute>,
  selector: style.Selector
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
      case '$=':
        return value.endsWith(sel.value)
      case '*=':
        return value.includes(sel.value)
      default:
        // Unknown operator, always unmatched.
        return false
    }
  }, true)
}

function matchCombinator(
  origin: template.Element,
  selector: style.Selector,
  template: template.Template
): boolean {
  const comb = selector.leftCombinator
  if (!comb) {
    // If `leftCombinator` does not exist, the whole selector should be matched.
    return true
  }

  const { path } = origin
  const parentPath = path.slice(0, -1)
  const last = path[path.length - 1]
  const isElement = (el: any): el is template.Element =>
    el && el.type === 'Element'

  switch (comb.operator) {
    case '>': {
      const next = getNode(template, parentPath)
      return isElement(next) && matchSelector(next, comb.left, template)
    }
    case '+': {
      const next = range(1, last).reduce<template.Element | undefined>(
        (acc, offset) => {
          if (acc) return acc
          const node = getNode(template, parentPath.concat(last - offset))
          return isElement(node) ? node : undefined
        },
        undefined
      )
      return next ? matchSelector(next, comb.left, template) : false
    }
    case ' ': {
      return range(1, path.length - 1).reduce((acc, offset) => {
        if (acc) return acc
        const next = getNode(template, path.slice(0, -offset))
        return isElement(next) && matchSelector(next, comb.left, template)
      }, false)
    }
    case '~': {
      return range(1, last).reduce((acc, offset) => {
        if (acc) return acc
        const next = getNode(template, parentPath.concat(last - offset))
        return isElement(next) && matchSelector(next, comb.left, template)
      }, false)
    }
    default:
      // Unknown combinator will always be unmatched.
      return false
  }
}

function isSubset(target: string[], superSet: string[]): boolean {
  return target.reduce((acc, item) => {
    return acc && superSet.indexOf(item) >= 0
  }, true)
}

class StyleMap {
  private idMap = new Map<string, style.Rule[]>()
  private classMap = new Map<string, style.Rule[]>()
  private attributeMap = new Map<string, style.Rule[]>()
  private tagMap = new Map<string, style.Rule[]>()
  private universals: style.Rule[] = []

  constructor(styles: style.Style[]) {
    styles.forEach(style => {
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
    })
  }

  getCandidateRules(el: template.Element): style.Rule[] {
    const tagMatched = this.tagMap.get(el.name) || []

    const attrsMatched = el.startTag.attributes.reduce<style.Rule[]>(
      (acc, attr) => {
        if (attr.directive) return acc

        if (attr.value) {
          if (attr.name === 'id') {
            acc = acc.concat(this.idMap.get(attr.value) || [])
          }

          if (attr.name === 'class') {
            const matched = attr.value
              .split(/\s+/)
              .reduce<style.Rule[]>((acc, c) => {
                return acc.concat(this.classMap.get(c) || [])
              }, [])
            acc = acc.concat(matched)
          }
        }

        return acc.concat(this.attributeMap.get(attr.name) || [])
      },
      []
    )

    return [...tagMatched, ...attrsMatched, ...this.universals]
  }

  private registerRule(
    map: Map<string, style.Rule[]>,
    key: string,
    rule: style.Rule
  ): void {
    const list = map.get(key) || []
    map.set(key, list.concat(rule))
  }
}
