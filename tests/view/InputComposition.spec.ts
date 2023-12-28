import { describe, expect, it, vitest } from 'vitest'
import InputComposition from '../../src/view/components/InputComposition.vue'
import { mount } from '../helpers/vue'
import { nextTick } from 'vue'

describe('InputComposition', () => {
  it('ports value to real input element', async () => {
    const spy = vitest.fn()

    const { vm } = mount(InputComposition, {
      value: 'test',
      onInput: spy,
    })

    const input = vm.$el as HTMLInputElement

    expect(input.value).toBe('test')

    input.value = 'updated'
    input.dispatchEvent(new InputEvent('input'))

    await nextTick()

    expect(spy).toHaveBeenCalled()
    expect(spy.mock.calls[0][0]).toBe('updated')
  })

  it('does not emit key events during composition', async () => {
    const listeners = {
      onInput: vitest.fn(),
      onKeydown: vitest.fn(),
    }

    const { vm } = mount(InputComposition, {
      value: 'test',
      ...listeners,
    })

    const input = vm.$el as HTMLInputElement
    input.dispatchEvent(new InputEvent('input'))
    input.dispatchEvent(new KeyboardEvent('keydown'))
    await nextTick()

    expect(listeners.onInput).toHaveBeenCalledTimes(1)
    expect(listeners.onKeydown).toHaveBeenCalledTimes(1)

    input.dispatchEvent(new CompositionEvent('compositionstart'))
    input.dispatchEvent(new InputEvent('input'))
    input.dispatchEvent(new KeyboardEvent('keydown'))
    await nextTick()

    expect(listeners.onInput).toHaveBeenCalledTimes(2)
    expect(listeners.onKeydown).toHaveBeenCalledTimes(1)

    input.dispatchEvent(new CompositionEvent('compositionend'))
    input.dispatchEvent(new InputEvent('input'))
    input.dispatchEvent(new KeyboardEvent('keydown'))
    await nextTick()

    expect(listeners.onInput).toHaveBeenCalledTimes(3)
    expect(listeners.onKeydown).toHaveBeenCalledTimes(2)
  })
})
