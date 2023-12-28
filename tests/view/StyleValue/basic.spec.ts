import { describe, expect, it, vitest } from 'vitest'
import StyleValue from '../../../src/view/components/StyleValue.vue'
import { nextTick } from 'vue'
import { mount } from '../../helpers/vue'

describe('StyleValue basic', () => {
  it('should render', () => {
    const { vm } = mount(StyleValue, {
      value: '20px',
    })
    const el = vm.$el as HTMLElement
    expect(el.getAttribute('contenteditable')).not.toBe('true')
    expect(el.textContent?.trim()).toBe('20px')
  })

  it('should make editable when clicked', async () => {
    const inputListener = vitest.fn()
    const { vm } = mount(StyleValue, {
      value: '20px',
      onInput: inputListener,
    })
    vm.$el.dispatchEvent(new MouseEvent('click'))
    await nextTick()

    const el = vm.$el as HTMLElement
    expect(el.getAttribute('contenteditable')).toBe('true')
    expect(el.textContent).toBe('20px')

    el.textContent = '22px'
    el.dispatchEvent(new KeyboardEvent('input'))
    expect(inputListener).toHaveBeenCalledWith('22px')
  })

  it('should make editable when focused', async () => {
    const inputListener = vitest.fn()
    const { vm } = mount(StyleValue, {
      value: '20px',
      onInput: inputListener,
    })
    vm.$el.dispatchEvent(new Event('focus'))
    await nextTick()

    expect(vm.$el.getAttribute('contenteditable')).toBe('true')
    expect(vm.$el.textContent).toBe('20px')

    vm.$el.textContent = '22px'
    vm.$el.dispatchEvent(new KeyboardEvent('input'))
    expect(inputListener).toHaveBeenCalledWith('22px')
  })

  it('should notify starting input', async () => {
    const listener = vitest.fn()
    const { vm } = mount(StyleValue, {
      value: '20px',
      onInputStart: listener,
    })

    vm.$el.dispatchEvent(new MouseEvent('click'))
    await nextTick()
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('should end editing when blured', async () => {
    const listener = vitest.fn()
    const { vm } = mount(StyleValue, {
      value: '20px',
      onInputEnd: listener,
    })
    vm.$el.dispatchEvent(new MouseEvent('click'))
    await nextTick()

    expect(vm.$el.getAttribute('contenteditable')).toBe('true')

    vm.$el.dispatchEvent(new Event('blur'))
    await nextTick()

    expect(vm.$el.getAttribute('contenteditable')).not.toBe('true')
    expect(listener).toHaveBeenCalledWith('20px', {
      reason: 'blur',
      shiftKey: false,
    })
  })

  it('should end editing when pressed enter key', async () => {
    const listener = vitest.fn()
    const { vm } = mount(StyleValue, {
      value: '20px',
      onInputEnd: listener,
    })
    vm.$el.dispatchEvent(new MouseEvent('click'))
    await nextTick()

    expect(vm.$el.getAttribute('contenteditable')).toBe('true')

    vm.$el.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
      }),
    )

    await nextTick()

    expect(vm.$el.getAttribute('contenteditable')).not.toBe('true')
    expect(listener).toHaveBeenCalledWith('20px', {
      reason: 'enter',
      shiftKey: false,
    })
  })

  it('should end editing when pressed tab key', async () => {
    const listener = vitest.fn()
    const { vm } = mount(StyleValue, {
      value: '20px',
      onInputEnd: listener,
    })
    vm.$el.dispatchEvent(new MouseEvent('click'))
    await nextTick()

    expect(vm.$el.getAttribute('contenteditable')).toBe('true')

    vm.$el.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Tab',
      }),
    )

    await nextTick()

    expect(vm.$el.getAttribute('contenteditable')).not.toBe('true')
    expect(listener).toHaveBeenCalledWith('20px', {
      reason: 'tab',
      shiftKey: false,
    })
  })

  it('should include shift key state when end editing', async () => {
    const listener = vitest.fn()
    const { vm } = mount(StyleValue, {
      value: '20px',
      onInputEnd: listener,
    })
    vm.$el.dispatchEvent(new MouseEvent('click'))
    await nextTick()

    expect(vm.$el.getAttribute('contenteditable')).toBe('true')

    vm.$el.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
      }),
    )

    await nextTick()

    expect(vm.$el.getAttribute('contenteditable')).not.toBe('true')
    expect(listener).toHaveBeenCalledWith('20px', {
      reason: 'tab',
      shiftKey: true,
    })
  })

  it('should update editing content when prop is updated', async () => {
    const { vm, updateProps } = mount(StyleValue, {
      value: 'red',
    })
    vm.$el.dispatchEvent(new MouseEvent('click'))
    await nextTick()

    expect(vm.$el.getAttribute('contenteditable')).toBe('true')
    expect(vm.$el.textContent?.trim()).toBe('red')

    updateProps({ value: 'blue' })
    await nextTick()

    expect(vm.$el.getAttribute('contenteditable')).toBe('true')
    expect(vm.$el.textContent?.trim()).toBe('blue')
  })

  it('should be editable when autoFocus is specified', async () => {
    const { vm } = mount(StyleValue, {
      value: 'red',
      autoFocus: true,
    })

    await nextTick()

    expect(vm.$el.getAttribute('contenteditable')).toBe('true')
  })

  it('should focus on input field by changing autoFocus prop', async () => {
    const { vm, updateProps } = mount(StyleValue, {
      value: 'red',
      autoFocus: true,
    })

    updateProps({
      autoFocus: true,
    })
    await nextTick()

    expect(vm.$el.getAttribute('contenteditable')).toBe('true')
  })
})
