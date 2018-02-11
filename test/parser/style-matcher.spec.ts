import {
  createStyle,
  selector,
  rule,
  attribute,
  pClass,
  pElement
} from './style-helpers'
import { createStyleMatcher } from '@/parser/style-matcher'
import { createTemplate, h, a } from './template-helpers'

describe('Style matcher', () => {
  describe('for universal selector', () => {
    const universal = rule([selector({ universal: true })])
    const pseudoClass = rule([
      selector({
        pseudoClass: [pClass('hover')]
      })
    ])
    const pseudoElement = rule([
      selector({
        pseudoElement: pElement('before')
      })
    ])

    const style = createStyle([universal, pseudoClass, pseudoElement])
    const matcher = createStyleMatcher(style)

    // prettier-ignore
    const template = createTemplate([
      h('div', [], [])
    ])

    it('should always match with universal selector', () => {
      const res = matcher(template, [0])
      expect(res.length).toBe(3)
      expect(res[0]).toEqual(universal)
      expect(res[1]).toEqual(pseudoClass)
      expect(res[2]).toEqual(pseudoElement)
    })
  })

  describe('for simple selectors', () => {
    const tag = rule([selector({ tag: 'a' })])
    const id = rule([selector({ id: 'foo' })])
    const classes = rule([selector({ class: ['bar'] })])
    const attr = rule([
      selector({
        attributes: [attribute('value')]
      })
    ])

    const style = createStyle([tag, id, classes, attr])
    const matcher = createStyleMatcher(style)

    // prettier-ignore
    const template = createTemplate([
      h('div', [], [
        h('a', [], []),
        h('div', [a('id', 'foo')], []),
        h('div', [a('class', 'bar baz')], []),
        h('div', [a('value', 'test')], [])
      ])
    ])

    it('should match with tag selector', () => {
      const res = matcher(template, [0, 0])
      expect(res.length).toBe(1)
      expect(res[0]).toEqual(tag)
    })

    it('should match with id selector', () => {
      const res = matcher(template, [0, 1])
      expect(res.length).toBe(1)
      expect(res[0]).toEqual(id)
    })

    it('should match with class selector', () => {
      const res = matcher(template, [0, 2])
      expect(res.length).toBe(1)
      expect(res[0]).toEqual(classes)
    })

    it('should match with attribute selector', () => {
      const res = matcher(template, [0, 3])
      expect(res.length).toBe(1)
      expect(res[0]).toEqual(attr)
    })
  })

  describe('for compound selectors', () => {
    const idWithTag = rule([
      selector({
        id: 'foo',
        tag: 'a'
      })
    ])

    const idWithClass = rule([
      selector({
        id: 'foo',
        class: ['bar']
      })
    ])

    const idWithAttribute = rule([
      selector({
        id: 'foo',
        attributes: [attribute('value')]
      })
    ])

    const style = createStyle([idWithTag, idWithClass, idWithAttribute])
    const matcher = createStyleMatcher(style)

    it('should not match if it is not supply compound selector', () => {
      // prettier-ignore
      const template = createTemplate([
        h('div', [a('id', 'foo')], [])
      ])

      const res = matcher(template, [0])
      expect(res.length).toBe(0)
    })

    it('should match with id and tag', () => {
      // prettier-ignore
      const template = createTemplate([
        h('a', [a('id', 'foo')], [])
      ])

      const res = matcher(template, [0])
      expect(res.length).toBe(1)
      expect(res[0]).toEqual(idWithTag)
    })

    it('should match with id and class', () => {
      // prettier-ignore
      const template = createTemplate([
        h('div', [a('id', 'foo'), a('class', 'bar')], [])
      ])

      const res = matcher(template, [0])
      expect(res.length).toBe(1)
      expect(res[0]).toEqual(idWithClass)
    })

    it('should match with id and attribute', () => {
      // prettier-ignore
      const template = createTemplate([
        h('div', [a('id', 'foo'), a('value', null)], [])
      ])

      const res = matcher(template, [0])
      expect(res.length).toBe(1)
      expect(res[0]).toEqual(idWithAttribute)
    })
  })
})
