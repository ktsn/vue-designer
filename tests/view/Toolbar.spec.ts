import { describe, expect, it, vitest } from 'vitest'
import Toolbar from '../../src/view/components/Toolbar.vue'
import Vue, { nextTick } from 'vue'
import { mount } from '../helpers/vue'

describe('Toolbar', () => {
  it('has initial size based on props', () => {
    const t = new ToolbarTest(300, 400)
    expect(t.widthField().value).toBe('300')
    expect(t.heightField().value).toBe('400')
  })

  it('has initial scale based on props', () => {
    const t = new ToolbarTest(300, 400, 3)
    expect(t.scaleField().value).toBe('300')
  })

  it('submit resized value when pressed enter key', () => {
    const t = new ToolbarTest(300, 400)
    t.inputWidth(600)
    t.inputHeight(800)
    expect(t.resizeListener).not.toHaveBeenCalled()
    t.pressEnter(t.widthField())
    expect(t.resizeListener).toHaveBeenCalledWith({
      width: 600,
      height: 800,
    })
  })

  it('submit changed scale when pressed enter key', () => {
    const t = new ToolbarTest(300, 400, 2)
    t.inputScale(400)
    expect(t.zoomListener).not.toHaveBeenCalled()
    t.pressEnter(t.scaleField())
    expect(t.zoomListener).toHaveBeenCalledWith(4)
  })

  it('reset if invalid size is applied', async () => {
    const t = new ToolbarTest(300, 400)
    t.inputWidth(600)
    t.inputHeight('800abc')

    t.pressEnter(t.widthField())
    await nextTick()

    expect(t.resizeListener).not.toHaveBeenCalled()
    expect(t.widthField().value).toBe('300')
    expect(t.heightField().value).toBe('400')
  })

  it('reset if invalid scale is applied', async () => {
    const t = new ToolbarTest(300, 400, 1)
    t.inputScale('30abc')

    t.pressEnter(t.scaleField())
    await nextTick()

    expect(t.zoomListener).not.toHaveBeenCalled()
    expect(t.scaleField().value).toBe('100')
  })

  it('sync width and height field when the props are updated', async () => {
    const t = new ToolbarTest(300, 400)
    t.updateProps({
      height: 500,
    })

    await nextTick()
    expect(t.widthField().value).toBe('300')
    expect(t.heightField().value).toBe('500')
  })

  it('sync scale field when the props are updated', async () => {
    const t = new ToolbarTest(300, 400, 1)
    t.updateProps({
      scale: 2,
    })

    await nextTick()
    expect(t.scaleField().value).toBe('200')
  })

  it('reset dirty size value when props are updated', async () => {
    const t = new ToolbarTest(300, 400)
    t.inputWidth(400)
    t.updateProps({
      height: 500,
    })

    await nextTick()
    expect(t.widthField().value).toBe('300')
    expect(t.heightField().value).toBe('500')
  })
})

class ToolbarTest {
  vm: Vue
  updateProps: (props: Record<string, any>) => void

  resizeListener = vitest.fn()
  zoomListener = vitest.fn()

  constructor(width: number, height: number, scale: number = 1) {
    const { vm, updateProps } = mount(
      Toolbar,
      {
        width,
        height,
        scale,
      },
      {
        resize: this.resizeListener,
        zoom: this.zoomListener,
      }
    )
    this.vm = vm
    this.updateProps = updateProps
  }

  pressEnter(el: HTMLElement): void {
    el.dispatchEvent(
      new KeyboardEvent('keydown', {
        keyCode: 13,
      })
    )
  }

  widthField(): HTMLInputElement {
    return this.vm.$el.querySelector('.viewport-size-input:first-of-type')!
  }

  heightField(): HTMLInputElement {
    return this.vm.$el.querySelector('.viewport-size-input:nth-of-type(2)')!
  }

  scaleField(): HTMLInputElement {
    return this.vm.$el.querySelector('.viewport-scale-input')!
  }

  inputWidth(width: number | string): void {
    const el = this.widthField()
    el.value = String(width)
    this.widthField().dispatchEvent(new InputEvent('input'))
  }

  inputHeight(height: number | string): void {
    const el = this.heightField()
    el.value = String(height)
    this.heightField().dispatchEvent(new InputEvent('input'))
  }

  inputScale(scale: number | string): void {
    const el = this.scaleField()
    el.value = String(scale)
    this.scaleField().dispatchEvent(new InputEvent('input'))
  }
}
