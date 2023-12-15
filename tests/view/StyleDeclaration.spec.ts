import { mount } from '@vue/test-utils'
import StyleDeclaration from '@/view/components/StyleDeclaration.vue'
import StyleValue from '@/view/components/StyleValue.vue'

describe('StyleDeclaration', () => {
  it('should notify prop update', () => {
    const wrapper = mount(StyleDeclaration, {
      propsData: {
        prop: 'color',
        value: 'red',
      },
    })

    const prop = wrapper.find(StyleValue)
    prop.vm.$emit('input', 'background-color')
    prop.vm.$emit('input-end', 'background-color')

    expect(wrapper.emitted('update:prop')[0]).toEqual(['background-color'])
    expect(wrapper.emitted('remove')).toBe(undefined)
  })

  it('should notify value update', () => {
    const wrapper = mount(StyleDeclaration, {
      propsData: {
        prop: 'color',
        value: 'red',
      },
    })

    const value = wrapper.findAll(StyleValue).at(1)
    value.vm.$emit('input', 'blue')
    value.vm.$emit('input-end', 'background-color')

    expect(wrapper.emitted('update:value')[0]).toEqual(['blue'])
    expect(wrapper.emitted('remove')).toBe(undefined)
  })

  it('should request removing when prop is empty', () => {
    const wrapper = mount(StyleDeclaration, {
      propsData: {
        prop: 'color',
        value: 'red',
      },
    })

    const prop = wrapper.find(StyleValue)
    prop.vm.$emit('input', '')
    prop.vm.$emit('input-end', '')

    expect(wrapper.emitted('update:prop').length).toBe(1)
    expect(wrapper.emitted('update:prop')[0]).toEqual([''])
    expect(wrapper.emitted('remove')).not.toBe(undefined)
  })

  it('should request removing when value is empty', () => {
    const wrapper = mount(StyleDeclaration, {
      propsData: {
        prop: 'color',
        value: 'red',
      },
    })

    const value = wrapper.findAll(StyleValue).at(1)
    value.vm.$emit('input', '')
    value.vm.$emit('input-end', '')

    expect(wrapper.emitted('update:value').length).toBe(1)
    expect(wrapper.emitted('update:value')[0]).toEqual([''])
    expect(wrapper.emitted('remove')).not.toBe(undefined)
  })
})
