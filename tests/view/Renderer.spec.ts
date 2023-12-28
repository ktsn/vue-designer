import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '../helpers/vue'
import Renderer from '../../src/view/components/Renderer.vue'
import { store, module } from 'sinai'

describe('Renderer', () => {
  let mockWidth = 1000
  let mockHeight = 1000

  const dummyDocument = {
    uri: 'file:///test.html',
    styleCode: '',
    childComponents: [],
  }

  const emptyScope = {
    props: {},
    data: {},
  }

  const dummyStore = store(module().child('guide', module()))

  function mockGetBoundingClientRect(): DOMRect {
    return {
      x: 0,
      y: 0,
      bottom: 0,
      left: 0,
      top: 0,
      right: 0,
      width: mockWidth,
      height: mockHeight,
      toJSON: () => {},
    }
  }

  beforeAll(() => {
    Element.prototype.getBoundingClientRect = mockGetBoundingClientRect
  })

  beforeEach(() => {
    mockWidth = 1000
    mockHeight = 1000
  })

  it('scroll content has the same size with renderer when the viewport is not over the renderer size', () => {
    const { vm } = mount(
      Renderer,
      {
        document: dummyDocument,
        scope: emptyScope,
        width: 800,
        height: 600,
        scale: 1,
        sharedStyle: '',
      },
      [dummyStore],
    )

    const size = vm.scrollContentSize
    expect(size.width).toBe(1000)
    expect(size.height).toBe(1000)
  })

  it('scroll content has the much larger size than renderer when the viewport is over the renderer size', () => {
    const { vm } = mount(
      Renderer,
      {
        document: dummyDocument,
        scope: emptyScope,
        width: 800,
        height: 1200,
        scale: 1,
        sharedStyle: '',
      },
      [dummyStore],
    )

    const size = vm.scrollContentSize
    expect(size.width).toBe(1000) // width is not changed since is smaller than renderer width
    expect(size.height).toBe(3000)
  })

  it('considers scale value for scroll content size', () => {
    const { vm } = mount(
      Renderer,
      {
        document: dummyDocument,
        scope: emptyScope,
        width: 500,
        height: 500,
        scale: 2,
        sharedStyle: '',
      },
      [dummyStore],
    )

    const size = vm.scrollContentSize
    expect(size.width).toBe(2800)
    expect(size.height).toBe(2800)
  })
})
