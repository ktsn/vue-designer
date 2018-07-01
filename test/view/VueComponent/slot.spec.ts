import { createTemplate, h, render } from '../../helpers/template'

describe('VueComponent slot', () => {
  it('shows default elements', () => {
    // prettier-ignore
    const template = createTemplate([
      h('div', [], [
        h('slot', [], [
          h('p', [], ['default content'])
        ])
      ])
    ])

    const wrapper = render(template)
    expect(wrapper.html()).toMatchSnapshot()
  })
})
