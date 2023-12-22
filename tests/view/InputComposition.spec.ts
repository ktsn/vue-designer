import { describe, expect, it, vitest } from 'vitest'
import InputComposition from '../../src/view/components/InputComposition.vue'
import { mount } from '../helpers/vue'
import { nextTick } from 'vue'

describe('InputComposition', () => {
  it('ports value to real input element', async () => {
    const spy = vitest.fn()

    const { vm } = mount(
      InputComposition,
      {
        value: 'test',
      },
      {
        input: spy,
      }
    )

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
      input: vitest.fn(),
      keydown: vitest.fn(),
    }

    const { vm } = mount(
      InputComposition,
      {
        value: 'test',
      },
      {
        ...listeners,
      }
    )

    const input = vm.$el as HTMLInputElement
    input.dispatchEvent(new InputEvent('input'))
    input.dispatchEvent(new KeyboardEvent('keydown'))
    await nextTick()

    expect(listeners.input).toHaveBeenCalledTimes(1)
    expect(listeners.keydown).toHaveBeenCalledTimes(1)

    input.dispatchEvent(new CompositionEvent('compositionstart'))
    input.dispatchEvent(new InputEvent('input'))
    input.dispatchEvent(new KeyboardEvent('keydown'))
    await nextTick()

    expect(listeners.input).toHaveBeenCalledTimes(2)
    expect(listeners.keydown).toHaveBeenCalledTimes(1)

    input.dispatchEvent(new CompositionEvent('compositionend'))
    input.dispatchEvent(new InputEvent('input'))
    input.dispatchEvent(new KeyboardEvent('keydown'))
    await nextTick()

    expect(listeners.input).toHaveBeenCalledTimes(3)
    expect(listeners.keydown).toHaveBeenCalledTimes(2)
  })
})
