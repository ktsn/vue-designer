import { mount, Wrapper } from '@vue/test-utils'
import Toolbar from '@/view/components/Toolbar.vue'

describe('Toolbar', () => {
  it('has initial size based on props', () => {
    const t = new ToolbarTest(300, 400)
    expect(t.widthField().value).toBe('300')
    expect(t.heightField().value).toBe('400')
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

  it('reset if invalid number is applied', () => {
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

  it('sync width and height field when the props are updated', () => {
    const t = new ToolbarTest(300, 400)
    t.wrapper.setProps({
      height: 500
    })

    expect(t.widthField().value).toBe('300')
    expect(t.heightField().value).toBe('500')
  })

  it('reset dirty value when props are updated', () => {
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

  constructor(width: number, height: number) {
    this.wrapper = mount(Toolbar, {
      propsData: {
        width,
        height
      }
    })
  }

  widthWrapper(): Wrapper<any> {
    return this.wrapper.find('.viewport-size-input:first-of-type')
  }

  heightWrapper(): Wrapper<any> {
    return this.wrapper.find('.viewport-size-input:nth-of-type(2)')
  }

  widthField(): HTMLInputElement {
    return this.widthWrapper().element as HTMLInputElement
  }

  heightField(): HTMLInputElement {
    return this.heightWrapper().element as HTMLInputElement
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
}
