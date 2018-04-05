import { mount, Wrapper } from '@vue/test-utils'
import Toolbar from '@/view/components/Toolbar.vue'

describe('Toolbar', () => {
  it('has initial size based on props', () => {
    const t = new ToolbarTest(300, 400)
    expect((t.widthField().element as HTMLInputElement).value).toBe('300')
    expect((t.heightField().element as HTMLInputElement).value).toBe('400')
  })

  it('submit resized value when pressed enter key', () => {
    const t = new ToolbarTest(300, 400)
    t.inputWidth(600)
    t.inputHeight(800)
    expect(t.wrapper.emitted('resize')).toBeFalsy()
    t.widthField().trigger('keydown', {
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

    t.widthField().trigger('keydown', {
      keyCode: 13
    })

    expect(t.wrapper.emitted('resize')).toBeFalsy()
    expect((t.widthField().element as HTMLInputElement).value).toBe('300')
    expect((t.heightField().element as HTMLInputElement).value).toBe('400')
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

  widthField(): Wrapper<any> {
    return this.wrapper.find('.viewport-size-input:first-of-type')
  }

  heightField(): Wrapper<any> {
    return this.wrapper.find('.viewport-size-input:nth-of-type(2)')
  }

  inputWidth(width: number | string): void {
    const el = this.widthField()
    ;(el.element as HTMLInputElement).value = String(width)
    el.trigger('input')
  }

  inputHeight(height: number | string): void {
    const el = this.heightField()
    ;(el.element as HTMLInputElement).value = String(height)
    el.trigger('input')
  }
}
