import { shallowMount } from '@vue/test-utils'
import Renderer from '@/view/components/Renderer.vue'

describe('Renderer', () => {
  let mockWidth = 1000
  let mockHeight = 1000

  const emptyScope = {
    props: {},
    data: {}
  }

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
    const wrapper = shallowMount<any>(Renderer, {
      propsData: {
        document: {},
        scope: emptyScope,
        selectedPath: [],
        width: 800,
        height: 600,
        scale: 1,
        sharedStyle: ''
      }
    })

    const size = wrapper.vm.scrollContentSize
    expect(size.width).toBe(1000)
    expect(size.height).toBe(1000)
  })

  it('scroll content has the much larger size than renderer when the viewport is over the renderer size', () => {
    const wrapper = shallowMount<any>(Renderer, {
      propsData: {
        document: {},
        scope: emptyScope,
        selectedPath: [],
        width: 800,
        height: 1200,
        scale: 1,
        sharedStyle: ''
      }
    })

    const size = wrapper.vm.scrollContentSize
    expect(size.width).toBe(1000) // width is not changed since is smaller than renderer width
    expect(size.height).toBe(3000)
  })

  it('considers scale value for scroll content size', () => {
    const wrapper = shallowMount<any>(Renderer, {
      propsData: {
        document: {},
        scope: emptyScope,
        selectedPath: [],
        width: 500,
        height: 500,
        scale: 2,
        sharedStyle: ''
      }
    })

    const size = wrapper.vm.scrollContentSize
    expect(size.width).toBe(2800)
    expect(size.height).toBe(2800)
  })
})
