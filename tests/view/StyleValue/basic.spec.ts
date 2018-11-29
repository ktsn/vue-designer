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

  it('should make editable when clicked', async () => {
    const wrapper = mount(StyleValue, {
      propsData: {
        value: '20px'
      }
    })
    wrapper.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.attributes()!.contenteditable).toBe('true')
    expect(wrapper.text()).toBe('20px')

    const el = wrapper.find('[contenteditable]')
    el.element.textContent = '22px'
    el.trigger('input')
    expect(wrapper.emitted('input')[0]).toEqual(['22px'])
  })

  it('should make editable when focused', async () => {
    const wrapper = mount(StyleValue, {
      propsData: {
        value: '20px'
      }
    })
    wrapper.trigger('focus')
    await wrapper.vm.$nextTick()

    expect(wrapper.attributes()!.contenteditable).toBe('true')
    expect(wrapper.text()).toBe('20px')

    const el = wrapper.find('[contenteditable]')
    el.element.textContent = '22px'
    el.trigger('input')
    expect(wrapper.emitted('input')[0]).toEqual(['22px'])
  })

  it('should notify starting input', async () => {
    const wrapper = mount(StyleValue, {
      propsData: {
        value: '20px'
      }
    })
    wrapper.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('input-start').length).toBe(1)
  })

  it('should end editing when blured', async () => {
    const wrapper = mount(StyleValue, {
      propsData: {
        value: '20px'
      }
    })
    wrapper.trigger('click')
    expect(wrapper.attributes()!.contenteditable).toBe('true')

    await wrapper.vm.$nextTick()

    wrapper.trigger('blur')
    expect(wrapper.attributes()!.contenteditable).not.toBe('true')
    expect(wrapper.emitted('input-end')[0]).toEqual([
      '20px',
      { reason: 'blur', shiftKey: false }
    ])
  })

  it('should end editing when pressed enter key', async () => {
    const wrapper = mount(StyleValue, {
      propsData: {
        value: '20px'
      }
    })
    wrapper.trigger('click')
    expect(wrapper.attributes()!.contenteditable).toBe('true')

    await wrapper.vm.$nextTick()

    wrapper.trigger('keydown', {
      key: 'Enter'
    })
    expect(wrapper.attributes()!.contenteditable).not.toBe('true')
    expect(wrapper.emitted('input-end')[0]).toEqual([
      '20px',
      { reason: 'enter', shiftKey: false }
    ])
  })

  it('should end editing when pressed tab key', async () => {
    const wrapper = mount(StyleValue, {
      propsData: {
        value: '20px'
      }
    })
    wrapper.trigger('click')
    expect(wrapper.attributes()!.contenteditable).toBe('true')

    await wrapper.vm.$nextTick()

    wrapper.trigger('keydown', {
      key: 'Tab'
    })
    expect(wrapper.attributes()!.contenteditable).not.toBe('true')
    expect(wrapper.emitted('input-end')[0]).toEqual([
      '20px',
      { reason: 'tab', shiftKey: false }
    ])
  })

  it('should include shift key state when end editing', async () => {
    const wrapper = mount(StyleValue, {
      propsData: {
        value: '20px'
      }
    })
    wrapper.trigger('click')
    expect(wrapper.attributes()!.contenteditable).toBe('true')

    await wrapper.vm.$nextTick()

    wrapper.trigger('keydown', {
      key: 'Tab',
      shiftKey: true
    })
    expect(wrapper.attributes()!.contenteditable).not.toBe('true')
    expect(wrapper.emitted('input-end')[0]).toEqual([
      '20px',
      { reason: 'tab', shiftKey: true }
    ])
  })

  it('should update editing content when prop is updated', async () => {
    const wrapper = mount(StyleValue, {
      propsData: {
        value: 'red'
      }
    })
    wrapper.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.attributes()!.contenteditable).toBe('true')
    expect(wrapper.text()).toBe('red')

    wrapper.setProps({
      value: 'blue'
    })
    expect(wrapper.attributes()!.contenteditable).toBe('true')
    expect(wrapper.text()).toBe('blue')
  })

  it('should be editable when autoFocus is specified', async () => {
    const wrapper = mount(StyleValue, {
      propsData: {
        value: 'red',
        autoFocus: true
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.attributes()!.contenteditable).toBe('true')
  })

  it('should focus on input field by changing autoFocus prop', async () => {
    const wrapper = mount(StyleValue, {
      propsData: {
        value: 'red',
        autoFocus: true
      }
    })

    wrapper.setProps({
      autoFocus: true
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.attributes()!.contenteditable).toBe('true')
  })
})
