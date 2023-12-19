import { beforeAll, describe, expect, it, vitest } from 'vitest'
import assert from 'assert'
import { mount, Wrapper } from '@vue/test-utils'
import Resizable from '../../src/view/components/Resizable.vue'

describe('Resizable', () => {
  beforeAll(() => {
    Element.prototype.setPointerCapture = vitest.fn()
    Element.prototype.releasePointerCapture = vitest.fn()
  })

  it('tells resized size on dragging', () => {
    const t = new ResizableTest(300, 300)
    t.dragStart('se', 295, 305)
    t.dragTo(395, 355)

    expect(t.size.width).toBe(400)
    expect(t.size.height).toBe(350)
  })

  it('multiplies offset by offsetWeight prop', () => {
    const t = new ResizableTest(300, 300)
    t.wrapper.setProps({
      offsetWeight: 2,
    })
    t.dragStart('se', 300, 300)
    t.dragTo(350, 370)

    expect(t.size.width).toBe(400)
    expect(t.size.height).toBe(440)
  })

  it('north handler', () => {
    const t = new ResizableTest(300, 300)
    t.dragStart('n', 200, 0)
    t.dragTo(150, 50)

    expect(t.size.width).toBe(300)
    expect(t.size.height).toBe(250)
  })

  it('south handler', () => {
    const t = new ResizableTest(300, 300)
    t.dragStart('s', 200, 300)
    t.dragTo(150, 350)

    expect(t.size.width).toBe(300)
    expect(t.size.height).toBe(350)
  })

  it('west handler', () => {
    const t = new ResizableTest(300, 300)
    t.dragStart('w', 0, 150)
    t.dragTo(50, 200)

    expect(t.size.width).toBe(250)
    expect(t.size.height).toBe(300)
  })

  it('east handler', () => {
    const t = new ResizableTest(300, 300)
    t.dragStart('e', 300, 150)
    t.dragTo(350, 200)

    expect(t.size.width).toBe(350)
    expect(t.size.height).toBe(300)
  })

  it('north-west handler', () => {
    const t = new ResizableTest(300, 300)
    t.dragStart('nw', 0, 0)
    t.dragTo(50, 70)

    expect(t.size.width).toBe(250)
    expect(t.size.height).toBe(230)
  })

  it('north-east handler', () => {
    const t = new ResizableTest(300, 300)
    t.dragStart('ne', 300, 0)
    t.dragTo(350, 70)

    expect(t.size.width).toBe(350)
    expect(t.size.height).toBe(230)
  })

  it('south-west handler', () => {
    const t = new ResizableTest(300, 300)
    t.dragStart('sw', 0, 300)
    t.dragTo(50, 370)

    expect(t.size.width).toBe(250)
    expect(t.size.height).toBe(370)
  })

  it('south-east handler', () => {
    const t = new ResizableTest(300, 300)
    t.dragStart('se', 300, 300)
    t.dragTo(350, 370)

    expect(t.size.width).toBe(350)
    expect(t.size.height).toBe(370)
  })
})

class ResizableTest {
  wrapper: Wrapper<InstanceType<typeof Resizable>>
  handler!: Wrapper<any>
  size: {
    width: number
    height: number
  }

  constructor(width: number, height: number) {
    this.wrapper = mount(Resizable, {
      propsData: {
        width,
        height,
      },
    })

    this.size = {
      width,
      height,
    }

    this.wrapper.vm.$on('resize', (value: any) => {
      this.size.width = value.width
      this.size.height = value.height
    })
  }

  dragStart(direction: string, x: number, y: number): void {
    this.handler = this.wrapper.find('.resizable-handler-' + direction)
    this.handler.trigger('pointerdown', {
      clientX: x,
      clientY: y,
    })
  }

  dragTo(x: number, y: number): void {
    assert(this.handler)
    this.handler.trigger('pointermove', {
      clientX: x,
      clientY: y,
    })
    this.handler.trigger('pointerup')
  }
}
