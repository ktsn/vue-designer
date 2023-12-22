import { describe, expect, it, vitest } from 'vitest'
import { mount } from '../helpers/vue'
import StyleDeclaration from '../../src/view/components/StyleDeclaration.vue'
import { nextTick } from 'vue'

describe('StyleDeclaration', () => {
  it('should notify prop update', async () => {
    const listeners = {
      'update:prop': vitest.fn(),
      remove: vitest.fn(),
    }

    const { vm } = mount(
      StyleDeclaration,
      {
        prop: 'color',
        value: 'red',
      },
      { ...listeners }
    )

    vm.$el.querySelector('button')!.dispatchEvent(new MouseEvent('click'))
    await nextTick()

    const prop = vm.$el.querySelector('[contenteditable=true]')!
    prop.textContent = 'background-color'
    prop.dispatchEvent(new InputEvent('input'))
    prop.dispatchEvent(new Event('blur'))

    expect(listeners['update:prop']).toHaveBeenCalledWith('background-color')
    expect(listeners.remove).not.toHaveBeenCalled()
  })

  it('should notify value update', async () => {
    const listeners = {
      'update:value': vitest.fn(),
      remove: vitest.fn(),
    }

    const { vm } = mount(
      StyleDeclaration,
      {
        prop: 'color',
        value: 'red',
      },
      { ...listeners }
    )

    vm.$el.querySelectorAll('button')[1]!.dispatchEvent(new MouseEvent('click'))
    await nextTick()

    const value = vm.$el.querySelector('[contenteditable=true]')!
    value.textContent = 'blue'
    value.dispatchEvent(new InputEvent('input'))
    value.dispatchEvent(new Event('blur'))

    expect(listeners['update:value']).toHaveBeenCalledWith('blue')
    expect(listeners.remove).not.toHaveBeenCalled()
  })

  it('should request removing when prop is empty', async () => {
    const listeners = {
      'update:prop': vitest.fn(),
      remove: vitest.fn(),
    }

    const { vm } = mount(
      StyleDeclaration,
      {
        prop: 'color',
        value: 'red',
      },
      { ...listeners }
    )

    vm.$el.querySelector('button')!.dispatchEvent(new MouseEvent('click'))
    await nextTick()

    const prop = vm.$el.querySelector('[contenteditable=true]')!
    prop.textContent = ''
    prop.dispatchEvent(new InputEvent('input'))
    prop.dispatchEvent(new Event('blur'))

    expect(listeners['update:prop']).toHaveBeenCalledTimes(1)
    expect(listeners['update:prop']).toHaveBeenCalledWith('')
    expect(listeners.remove).toHaveBeenCalled()
  })

  it('should request removing when value is empty', async () => {
    const listeners = {
      'update:value': vitest.fn(),
      remove: vitest.fn(),
    }

    const { vm } = mount(
      StyleDeclaration,
      {
        prop: 'color',
        value: 'red',
      },
      { ...listeners }
    )

    vm.$el.querySelectorAll('button')[1]!.dispatchEvent(new MouseEvent('click'))
    await nextTick()

    const value = vm.$el.querySelector('[contenteditable=true]')!
    value.textContent = ''
    value.dispatchEvent(new InputEvent('input'))
    value.dispatchEvent(new Event('blur'))

    expect(listeners['update:value']).toHaveBeenCalledTimes(1)
    expect(listeners['update:value']).toHaveBeenCalledWith('')
    expect(listeners.remove).toHaveBeenCalled()
  })
})
