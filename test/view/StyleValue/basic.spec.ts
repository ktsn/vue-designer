import StyleValue from '@/view/components/StyleValue.vue'
import { mount } from '@vue/test-utils'

describe('StyleValue basic', () => {
  it('should render', () => {
    const wrapper = mount(StyleValue, {
      propsData: {
        value: '20px'
      }
    })
    expect(wrapper.attributes()!.contenteditable).not.toBe('true')
    expect(wrapper.text()).toBe('20px')
  })

  it('should make editable when clicked', () => {
    const wrapper = mount(StyleValue, {
      propsData: {
        value: '20px'
      }
    })
    wrapper.trigger('click')
    expect(wrapper.attributes()!.contenteditable).toBe('true')

    const el = wrapper.find('[contenteditable]')
    el.element.textContent = '22px'
    el.trigger('input')
    expect(wrapper.emitted('input')[0]).toEqual(['22px'])
  })

  it('should make editable when focused', () => {
    const wrapper = mount(StyleValue, {
      propsData: {
        value: '20px'
      }
    })
    wrapper.trigger('focus')
    expect(wrapper.attributes()!.contenteditable).toBe('true')

    const el = wrapper.find('[contenteditable]')
    el.element.textContent = '22px'
    el.trigger('input')
    expect(wrapper.emitted('input')[0]).toEqual(['22px'])
  })

  it('should end editing when blured', () => {
    const wrapper = mount(StyleValue, {
      propsData: {
        value: '20px'
      }
    })
    wrapper.trigger('click')
    expect(wrapper.attributes()!.contenteditable).toBe('true')

    wrapper.trigger('blur')
    expect(wrapper.attributes()!.contenteditable).not.toBe('true')
  })

  it('should end editing when pushed enter', () => {
    const wrapper = mount(StyleValue, {
      propsData: {
        value: '20px'
      }
    })
    wrapper.trigger('click')
    expect(wrapper.attributes()!.contenteditable).toBe('true')

    wrapper.trigger('keypress', {
      keyCode: 13
    })
    expect(wrapper.attributes()!.contenteditable).not.toBe('true')
  })
})
