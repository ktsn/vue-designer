import { describe, expect, it, vitest } from 'vitest'
import { mount } from '../helpers/vue'
import StyleDeclaration from '../../src/view/components/StyleDeclaration.vue'
import { nextTick } from 'vue'

describe('StyleDeclaration', () => {
  it('should notify prop update', async () => {
    const listeners = {
      'onUpdate:prop': vitest.fn(),
      onRemove: vitest.fn(),
    }

    const { vm } = mount(StyleDeclaration, {
      prop: 'color',
      value: 'red',
      ...listeners,
    })

    vm.$el.querySelector('button')!.dispatchEvent(new MouseEvent('click'))
    await nextTick()

    const prop = vm.$el.querySelector('[contenteditable=true]')!
    prop.textContent = 'background-color'
    prop.dispatchEvent(new InputEvent('input'))
    prop.dispatchEvent(new Event('blur'))

    expect(listeners['onUpdate:prop']).toHaveBeenCalledWith('background-color')
    expect(listeners.onRemove).not.toHaveBeenCalled()
  })

  it('should notify value update', async () => {
    const listeners = {
      'onUpdate:value': vitest.fn(),
      onRemove: vitest.fn(),
    }

    const { vm } = mount(StyleDeclaration, {
      prop: 'color',
      value: 'red',
      ...listeners,
    })

    vm.$el.querySelectorAll('button')[1]!.dispatchEvent(new MouseEvent('click'))
    await nextTick()

    const value = vm.$el.querySelector('[contenteditable=true]')!
    value.textContent = 'blue'
    value.dispatchEvent(new InputEvent('input'))
    value.dispatchEvent(new Event('blur'))

    expect(listeners['onUpdate:value']).toHaveBeenCalledWith('blue')
    expect(listeners.onRemove).not.toHaveBeenCalled()
  })

  it('should request removing when prop is empty', async () => {
    const listeners = {
      'onUpdate:prop': vitest.fn(),
      onRemove: vitest.fn(),
    }

    const { vm } = mount(StyleDeclaration, {
      prop: 'color',
      value: 'red',
      ...listeners,
    })

    vm.$el.querySelector('button')!.dispatchEvent(new MouseEvent('click'))
    await nextTick()

    const prop = vm.$el.querySelector('[contenteditable=true]')!
    prop.textContent = ''
    prop.dispatchEvent(new InputEvent('input'))
    prop.dispatchEvent(new Event('blur'))

    expect(listeners['onUpdate:prop']).toHaveBeenCalledTimes(1)
    expect(listeners['onUpdate:prop']).toHaveBeenCalledWith('')
    expect(listeners.onRemove).toHaveBeenCalled()
  })

  it('should request removing when value is empty', async () => {
    const listeners = {
      'onUpdate:value': vitest.fn(),
      onRemove: vitest.fn(),
    }

    const { vm } = mount(StyleDeclaration, {
      prop: 'color',
      value: 'red',
      ...listeners,
    })

    vm.$el.querySelectorAll('button')[1]!.dispatchEvent(new MouseEvent('click'))
    await nextTick()

    const value = vm.$el.querySelector('[contenteditable=true]')!
    value.textContent = ''
    value.dispatchEvent(new InputEvent('input'))
    value.dispatchEvent(new Event('blur'))

    expect(listeners['onUpdate:value']).toHaveBeenCalledTimes(1)
    expect(listeners['onUpdate:value']).toHaveBeenCalledWith('')
    expect(listeners.onRemove).toHaveBeenCalled()
  })
})
