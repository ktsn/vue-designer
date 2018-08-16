import {
  createStyle,
  selector,
  rule,
  attribute,
  pClass,
  pElement,
  combinator
} from '../../helpers/style'
import { createTemplate, h, a } from '../../helpers/template'
import { createStyleMatcher } from '@/parser/style/match'

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
    const matcher = createStyleMatcher([style])

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
    const matcher = createStyleMatcher([style])

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

    const multiClass = rule([
      selector({
        class: ['foo', 'bar']
      })
    ])

    const multiAttributes = rule([
      selector({
        attributes: [attribute('title'), attribute('value')]
      })
    ])

    const style = createStyle([
      idWithTag,
      idWithClass,
      idWithAttribute,
      multiClass,
      multiAttributes
    ])
    const matcher = createStyleMatcher([style])

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

    it('should match with multi classes', () => {
      // prettier-ignore
      const template = createTemplate([
        h('div', [
          a('class', 'foo bar')
        ], [])
      ])

      const res = matcher(template, [0])
      expect(res.length).toBe(1)
      expect(res[0]).toEqual(multiClass)
    })

    it('should match with multi attributes', () => {
      // prettier-ignore
      const template = createTemplate([
        h('div', [
          a('title', null),
          a('value', null)
        ], [])
      ])

      debugger
      const res = matcher(template, [0])
      expect(res.length).toBe(1)
      expect(res[0]).toEqual(multiAttributes)
    })
  })

  describe('for complex selectors', () => {
    it('should match with child combinator', () => {
      const child = rule([
        selector(
          { class: ['bar'] },
          combinator('>', selector({ class: ['foo'] }))
        )
      ])

      const matcher = createStyleMatcher([createStyle([child])])

      // prettier-ignore
      const template = createTemplate([
        h('div', [a('class', 'foo')], [
          h('div', [a('class', 'bar')], []),
          h('div', [], [
            h('div', [a('class', 'bar')], [])
          ])
        ])
      ])

      let res = matcher(template, [0, 0])
      expect(res.length).toBe(1)
      expect(res[0]).toEqual(child)

      res = matcher(template, [0, 1, 0])
      expect(res.length).toBe(0)
    })

    it('should match with adjacent sibling combinator', () => {
      const sibling = rule([
        selector(
          { class: ['bar'] },
          combinator('+', selector({ class: ['foo'] }))
        )
      ])

      const matcher = createStyleMatcher([createStyle([sibling])])

      // prettier-ignore
      const template = createTemplate([
        h('div', [], [
          h('div', [a('class', 'foo')], [
            h('div', [a('class', 'bar')], [])
          ]),
          h('div', [a('class', 'bar')], []),
          h('div', [a('class', 'bar')], [])
        ])
      ])

      let res = matcher(template, [0, 1])
      expect(res.length).toBe(1)
      expect(res[0]).toEqual(sibling)

      res = matcher(template, [0, 0, 0])
      expect(res.length).toBe(0)

      res = matcher(template, [0, 2])
      expect(res.length).toBe(0)
    })

    it('should skip text node during resolving adjacent sibling combinator', () => {
      const sibling = rule([
        selector(
          { class: ['bar'] },
          combinator('+', selector({ class: ['foo'] }))
        )
      ])

      const matcher = createStyleMatcher([createStyle([sibling])])

      // prettier-ignore
      const template = createTemplate([
        h('div', [], [
          h('div', [a('class', 'foo')], []),
          'Test',
          h('div', [a('class', 'bar')], []),
        ])
      ])

      const res = matcher(template, [0, 2])
      expect(res.length).toBe(1)
      expect(res[0]).toEqual(sibling)
    })

    it('should match with descendant combinator', () => {
      const descendant = rule([
        selector(
          { class: ['bar'] },
          combinator(' ', selector({ class: ['foo'] }))
        )
      ])

      const matcher = createStyleMatcher([createStyle([descendant])])

      // prettier-ignore
      const template = createTemplate([
        h('div', [a('class', 'foo')], [
          h('div', [], [
            h('div', [a('class', 'bar')], [])
          ])
        ]),
        h('div', [a('class', 'bar')], [])
      ])

      let res = matcher(template, [0, 0, 0])
      expect(res.length).toBe(1)
      expect(res[0]).toEqual(descendant)

      res = matcher(template, [1])
      expect(res.length).toBe(0)
    })

    it('should match with general sibling combinator', () => {
      const sibling = rule([
        selector(
          { class: ['bar'] },
          combinator('~', selector({ class: ['foo'] }))
        )
      ])

      const matcher = createStyleMatcher([createStyle([sibling])])

      // prettier-ignore
      const template = createTemplate([
        h('div', [], [
          h('div', [a('class', 'foo')], [
            h('div', [a('class', 'bar')], [])
          ]),
          h('div', [], []),
          h('div', [a('class', 'bar')], [])
        ])
      ])

      let res = matcher(template, [0, 2])
      expect(res.length).toBe(1)
      expect(res[0]).toEqual(sibling)

      res = matcher(template, [0, 0, 0])
      expect(res.length).toBe(0)
    })
  })

  describe('for attribute selectors', () => {
    it('should match with exact attribute value', () => {
      const rules = [
        rule([
          selector({
            attributes: [attribute('value', '=', 'abcdef')]
          })
        ]),

        rule([
          selector({
            attributes: [attribute('value', '=', 'abc')]
          })
        ]),

        rule([
          selector({
            attributes: [attribute('value', '=', 'abcdefg')]
          })
        ]),

        rule([
          selector({
            attributes: [attribute('value', '=', 'abcdef test')]
          })
        ])
      ]

      const matcher = createStyleMatcher([createStyle(rules)])

      // prettier-ignore
      const template = createTemplate([
        h('input', [a('value', 'abcdef')], [])
      ])

      const res = matcher(template, [0])
      expect(res.length).toBe(1)
      expect(res[0]).toEqual(rules[0])
    })

    it('should match with space-splitted attribute value', () => {
      const rules = [
        rule([
          selector({
            attributes: [attribute('value', '~=', 'abc')]
          })
        ]),

        rule([
          selector({
            attributes: [attribute('value', '~=', 'ab')]
          })
        ]),

        rule([
          selector({
            attributes: [attribute('value', '~=', 'def')]
          })
        ])
      ]

      const matcher = createStyleMatcher([createStyle(rules)])

      // prettier-ignore
      const template = createTemplate([
        h('input', [a('value', 'abc def ghi')], []),
        h('input', [a('value', 'abc')], [])
      ])

      let res = matcher(template, [0])
      expect(res.length).toBe(2)
      expect(res[0]).toEqual(rules[0])
      expect(res[1]).toEqual(rules[2])

      res = matcher(template, [1])
      expect(res.length).toBe(1)
      expect(res[0]).toEqual(rules[0])
    })

    it('should match hyphen-splitted attribute value', () => {
      const rules = [
        rule([
          selector({
            attributes: [attribute('value', '|=', 'abc')]
          })
        ]),

        rule([
          selector({
            attributes: [attribute('value', '|=', 'ab')]
          })
        ]),

        rule([
          selector({
            attributes: [attribute('value', '|=', 'def')]
          })
        ])
      ]

      const matcher = createStyleMatcher([createStyle(rules)])

      // prettier-ignore
      const template = createTemplate([
        h('input', [a('value', 'abc-def-ghi')], []),
        h('input', [a('value', 'abc')], [])
      ])

      let res = matcher(template, [0])
      expect(res.length).toBe(1)
      expect(res[0]).toEqual(rules[0])

      res = matcher(template, [1])
      expect(res.length).toBe(1)
      expect(res[0]).toEqual(rules[0])
    })

    it('should match the start of attribute value', () => {
      const rules = [
        rule([
          selector({
            attributes: [attribute('value', '^=', 'abc')]
          })
        ]),

        rule([
          selector({
            attributes: [attribute('value', '^=', 'ab')]
          })
        ]),

        rule([
          selector({
            attributes: [attribute('value', '^=', 'bc')]
          })
        ])
      ]

      const matcher = createStyleMatcher([createStyle(rules)])

      // prettier-ignore
      const template = createTemplate([
        h('input', [a('value', 'abc')], [])
      ])

      const res = matcher(template, [0])
      expect(res.length).toBe(2)
      expect(res[0]).toEqual(rules[0])
      expect(res[1]).toEqual(rules[1])
    })

    it('should match the end of attribute value', () => {
      const rules = [
        rule([
          selector({
            attributes: [attribute('value', '$=', 'abc')]
          })
        ]),

        rule([
          selector({
            attributes: [attribute('value', '$=', 'ab')]
          })
        ]),

        rule([
          selector({
            attributes: [attribute('value', '$=', 'bc')]
          })
        ])
      ]

      const matcher = createStyleMatcher([createStyle(rules)])

      // prettier-ignore
      const template = createTemplate([
        h('input', [a('value', 'abc')], [])
      ])

      const res = matcher(template, [0])
      expect(res.length).toBe(2)
      expect(res[0]).toEqual(rules[0])
      expect(res[1]).toEqual(rules[2])
    })

    it('should match the sub string of attribute value', () => {
      const rules = [
        rule([
          selector({
            attributes: [attribute('value', '*=', 'abc')]
          })
        ]),

        rule([
          selector({
            attributes: [attribute('value', '*=', 'ab')]
          })
        ]),

        rule([
          selector({
            attributes: [attribute('value', '*=', 'b')]
          })
        ]),

        rule([
          selector({
            attributes: [attribute('value', '*=', 'abcd')]
          })
        ])
      ]

      const matcher = createStyleMatcher([createStyle(rules)])

      // prettier-ignore
      const template = createTemplate([
        h('input', [a('value', 'abc')], [])
      ])

      const res = matcher(template, [0])
      expect(res.length).toBe(3)
      expect(res[0]).toEqual(rules[0])
      expect(res[1]).toEqual(rules[1])
      expect(res[2]).toEqual(rules[2])
    })

    it('should match with insensitive attribute value', () => {
      const rules = [
        rule([
          selector({
            attributes: [attribute('value', '=', 'abc', true)]
          })
        ]),

        rule([
          selector({
            attributes: [attribute('value', '=', 'abc')]
          })
        ])
      ]

      const matcher = createStyleMatcher([createStyle(rules)])

      // prettier-ignore
      const template = createTemplate([
        h('input', [a('value', 'ABC')], [])
      ])

      const res = matcher(template, [0])
      expect(res.length).toBe(1)
      expect(res[0]).toEqual(rules[0])
    })
  })
})
