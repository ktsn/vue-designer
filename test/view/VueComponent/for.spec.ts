import {
  render,
  createTemplate,
  h,
  exp,
  vFor
} from '../../parser/template-helpers'

describe('VueComponent v-for', () => {
  it('should iterate array value', () => {
    // prettier-ignore
    const template = createTemplate([
      h('ul', [], [
        h('li', [vFor(['item', 'i'], 'list')], [
          exp('item + " - " + i')
        ])
      ])
    ])

    const wrapper = render(template, [
      {
        name: 'list',
        type: 'Array',
        default: ['first', 'second', 'third']
      }
    ])
    const list = wrapper.findAll('li')
    expect(list.length).toBe(3)
    expect(list.at(0).text()).toBe('first - 0')
    expect(list.at(1).text()).toBe('second - 1')
    expect(list.at(2).text()).toBe('third - 2')
  })

  it('should iterate object value', () => {
    // prettier-ignore
    const template = createTemplate([
      h('ul', [], [
        h('li', [vFor(['item', 'key', 'i'], 'obj')], [
          exp('item + " - " + key + " - " + i')
        ])
      ])
    ])

    const wrapper = render(template, [
      {
        name: 'obj',
        type: 'Object',
        default: {
          foo: 'first',
          bar: 'second',
          baz: 'third'
        }
      }
    ])
    const list = wrapper.findAll('li')
    expect(list.length).toBe(3)
    expect(list.at(0).text()).toBe('first - foo - 0')
    expect(list.at(1).text()).toBe('second - bar - 1')
    expect(list.at(2).text()).toBe('third - baz - 2')
  })

  it('should be removed if v-for is invalid', () => {
    // prettier-ignore
    const template = createTemplate([
      h('ul', [], [
        h('li', [vFor([], null)], [])
      ])
    ])

    const wrapper = render(template)
    const list = wrapper.findAll('li')
    expect(list.length).toBe(0)
  })

  it('should be removed if iteratee cannot be resolved', () => {
    // prettier-ignore
    const template = createTemplate([
      h('ul', [], [
        h('li', [vFor(['item'], 'list')], [])
      ])
    ])

    const wrapper = render(template)
    const list = wrapper.findAll('li')
    expect(list.length).toBe(0)
  })

  it('should be removed if iteratee is not iterable', () => {
    // prettier-ignore
    const template = createTemplate([
      h('ul', [], [
        h('li', [vFor(['item'], '"Test"')], [])
      ])
    ])

    const wrapper = render(template)
    const list = wrapper.findAll('li')
    expect(list.length).toBe(0)
  })
})
