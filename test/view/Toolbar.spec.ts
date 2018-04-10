import { mount, Wrapper } from '@vue/test-utils'
import Toolbar from '@/view/components/Toolbar.vue'

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
    expect(t.wrapper.emitted('resize')).toBeFalsy()
    t.widthWrapper().trigger('keydown', {
      keyCode: 13
    })
    expect(t.wrapper.emitted('resize')[0]).toEqual([
      {
        width: 600,
        height: 800
      }
    ])
  })

  it('submit changed scale when pressed enter key', () => {
    const t = new ToolbarTest(300, 400, 2)
    t.inputScale(400)
    expect(t.wrapper.emitted('zoom')).toBeFalsy()
    t.scaleWrapper().trigger('keydown', {
      keyCode: 13
    })
    expect(t.wrapper.emitted('zoom')[0]).toEqual([4])
  })

  it('reset if invalid size is applied', () => {
    const t = new ToolbarTest(300, 400)
    t.inputWidth(600)
    t.inputHeight('800abc')

    t.widthWrapper().trigger('keydown', {
      keyCode: 13
    })

    expect(t.wrapper.emitted('resize')).toBeFalsy()
    expect(t.widthField().value).toBe('300')
    expect(t.heightField().value).toBe('400')
  })

  it('reset if invalid scale is applied', () => {
    const t = new ToolbarTest(300, 400, 1)
    t.inputScale('30abc')

    t.scaleWrapper().trigger('keydown', {
      keyCode: 13
    })

    expect(t.wrapper.emitted('zoom')).toBeFalsy()
    expect(t.scaleField().value).toBe('100')
  })

  it('sync width and height field when the props are updated', () => {
    const t = new ToolbarTest(300, 400)
    t.wrapper.setProps({
      height: 500
    })

    expect(t.widthField().value).toBe('300')
    expect(t.heightField().value).toBe('500')
  })

  it('sync scale field when the props are updated', () => {
    const t = new ToolbarTest(300, 400, 1)
    t.wrapper.setProps({
      scale: 2
    })

    expect(t.scaleField().value).toBe('200')
  })

  it('reset dirty size value when props are updated', () => {
    const t = new ToolbarTest(300, 400)
    t.inputWidth(400)
    t.wrapper.setProps({
      height: 500
    })

    expect(t.widthField().value).toBe('300')
    expect(t.heightField().value).toBe('500')
  })
})

class ToolbarTest {
  wrapper: Wrapper<Toolbar>

  constructor(width: number, height: number, scale: number = 1) {
    this.wrapper = mount(Toolbar, {
      propsData: {
        width,
        height,
        scale
      }
    })
  }

  widthWrapper(): Wrapper<any> {
    return this.wrapper.find('.viewport-size-input:first-of-type')
  }

  heightWrapper(): Wrapper<any> {
    return this.wrapper.find('.viewport-size-input:nth-of-type(2)')
  }

  scaleWrapper(): Wrapper<any> {
    return this.wrapper.find('.viewport-scale-input')
  }

  widthField(): HTMLInputElement {
    return this.widthWrapper().element as HTMLInputElement
  }

  heightField(): HTMLInputElement {
    return this.heightWrapper().element as HTMLInputElement
  }

  scaleField(): HTMLInputElement {
    return this.scaleWrapper().element as HTMLInputElement
  }

  inputWidth(width: number | string): void {
    const el = this.widthField()
    el.value = String(width)
    this.widthWrapper().trigger('input')
  }

  inputHeight(height: number | string): void {
    const el = this.heightField()
    el.value = String(height)
    this.heightWrapper().trigger('input')
  }

  inputScale(scale: number | string): void {
    const el = this.scaleField()
    el.value = String(scale)
    this.scaleWrapper().trigger('input')
  }
}
