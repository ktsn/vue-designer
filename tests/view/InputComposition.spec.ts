import { describe, expect, it, vitest } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import InputComposition from '../../src/view/components/InputComposition.vue'

describe('InputComposition', () => {
  it('ports value to real input element', () => {
    const spy = vitest.fn()

    const wrapper = shallowMount(InputComposition, {
      propsData: {
        value: 'test',
      },
      listeners: {
        input: spy,
      },
    })

    const input = wrapper.find('input').element as HTMLInputElement

    expect(input.value).toBe('test')

    input.value = 'updated'
    wrapper.find('input').trigger('input')

    expect(spy).toHaveBeenCalled()
    expect(spy.mock.calls[0][0]).toBe('updated')
  })

  it('does not emit key events during composition', () => {
    const listeners = {
      input: vitest.fn(),
      keydown: vitest.fn(),
    }

    const wrapper = shallowMount(InputComposition, {
      propsData: {
        value: 'test',
      },
      listeners: { ...listeners },
    })

    const input = wrapper.find('input')
    input.trigger('input')
    input.trigger('keydown')
    expect(listeners.input).toHaveBeenCalledTimes(1)
    expect(listeners.keydown).toHaveBeenCalledTimes(1)

    input.trigger('compositionstart')
    input.trigger('input')
    input.trigger('keydown')

    expect(listeners.input).toHaveBeenCalledTimes(2)
    expect(listeners.keydown).toHaveBeenCalledTimes(1)

    input.trigger('compositionend')
    input.trigger('input')
    input.trigger('keydown')

    expect(listeners.input).toHaveBeenCalledTimes(3)
    expect(listeners.keydown).toHaveBeenCalledTimes(2)
  })
})
