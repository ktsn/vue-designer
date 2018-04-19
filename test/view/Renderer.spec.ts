import { shallow } from '@vue/test-utils'
import Renderer from '@/view/components/Renderer.vue'

describe('Renderer', () => {
  let mockWidth = 1000
  let mockHeight = 1000

  function mockGetBoundingClientRect() {
    return {
      x: 0,
      y: 0,
      bottom: 0,
      left: 0,
      top: 0,
      right: 0,
      width: mockWidth,
      height: mockHeight
    }
  }

  beforeAll(() => {
    Element.prototype.getBoundingClientRect = mockGetBoundingClientRect
  })

  beforeEach(() => {
    mockWidth = 1000
    mockHeight = 1000
  })

  afterAll(() => {
    delete Element.prototype.getBoundingClientRect
  })

  it('scroll content has the same size with renderer when the viewport is not over the renderer size', () => {
    const wrapper = shallow<any>(Renderer, {
      propsData: {
        document: {},
        width: 800,
        height: 600,
        scale: 1
      }
    })

    const size = wrapper.vm.scrollContentSize
    expect(size.width).toBe(1000)
    expect(size.height).toBe(1000)
  })

  it('scroll content has the much larser size than renderer when the viewport is over the renderer size', () => {
    const wrapper = shallow<any>(Renderer, {
      propsData: {
        document: {},
        width: 800,
        height: 1200,
        scale: 1
      }
    })

    const size = wrapper.vm.scrollContentSize
    expect(size.width).toBe(1000) // width is not changed since is smaller than renderer width
    expect(size.height).toBe(3000)
  })

  it('retain current position when the scroll content size is changed', async () => {
    const wrapper = shallow<any>(Renderer, {
      propsData: {
        document: {},
        width: 800,
        height: 600,
        scale: 1
      }
    })

    // Waiting for mount
    await nextFrame()

    const el = wrapper.element
    el.scrollTop = 0
    el.scrollLeft = 0

    // This let the scroll content size be from 1000x1000 to 3000x3000
    wrapper.setProps({
      width: 1200,
      height: 1200
    })

    await nextFrame()

    expect(el.scrollTop).toBe(1000)
    expect(el.scrollLeft).toBe(1000)
  })
})

function nextFrame() {
  return new Promise(requestAnimationFrame)
}
