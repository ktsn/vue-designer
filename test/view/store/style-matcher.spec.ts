import { createStyle, rule, selector } from '../../parser/style-helpers'
import { StyleMatcher } from '@/view/store/style-matcher'
import { createTemplate, h, a } from '../../parser/template-helpers'

describe('StyleMatcher', () => {
  it('should match specified uri styles', () => {
    const style1 = createStyle([rule([selector({ tag: 'p' })])])
    const style2 = createStyle([rule([selector({ class: ['foo'] })])])

    const matcher = new StyleMatcher()
    matcher.register('file:///test1.vue', [style1])
    matcher.register('file:///test2.vue', [style2])

    const actual = matcher.match(
      'file:///test1.vue',
      createTemplate([h('p', [a('class', 'foo')], [])]),
      [0]
    )
    expect(actual.length).toBe(1)
    expect(actual[0].selectors[0].tag).toBe('p')
  })

  it('should ignore if styles are not registered with uri', () => {
    const matcher = new StyleMatcher()
    const actual = matcher.match(
      'file:///test1.vue',
      createTemplate([h('p', [a('class', 'foo')], [])]),
      [0]
    )
    expect(actual.length).toBe(0)
  })

  it('should unregister styles from matcher', () => {
    const style = createStyle([rule([selector({ tag: 'p' })])])

    const matcher = new StyleMatcher()
    matcher.register('file:///test1.vue', [style])

    let actual = matcher.match(
      'file:///test1.vue',
      createTemplate([h('p', [a('class', 'foo')], [])]),
      [0]
    )
    expect(actual.length).toBe(1)
    expect(actual[0].selectors[0].tag).toBe('p')

    matcher.unregister('file:///test1.vue')

    actual = matcher.match(
      'file:///test1.vue',
      createTemplate([h('p', [a('class', 'foo')], [])]),
      [0]
    )
    expect(actual.length).toBe(0)
  })

  it('should clear all styles', () => {
    const style1 = createStyle([rule([selector({ tag: 'p' })])])
    const style2 = createStyle([rule([selector({ class: ['foo'] })])])

    const matcher = new StyleMatcher()
    matcher.register('file:///test1.vue', [style1])
    matcher.register('file:///test2.vue', [style2])

    matcher.clear()

    const actual1 = matcher.match(
      'file:///test1.vue',
      createTemplate([h('p', [a('class', 'foo')], [])]),
      [0]
    )
    const actual2 = matcher.match(
      'file:///test2.vue',
      createTemplate([h('p', [a('class', 'foo')], [])]),
      [0]
    )

    expect(actual1.length).toBe(0)
    expect(actual2.length).toBe(0)
  })
})
