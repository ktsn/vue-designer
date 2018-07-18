export interface GuidePosition {
  left: number
  right: number
  top: number
  bottom: number
}

export interface GuideBounds {
  left: number
  top: number
  width: number
  height: number

  margin: GuidePosition
  border: GuidePosition
  padding: GuidePosition
}

const f = (str: string | null) => parseFloat(str || '0')

export class BoundsCalculator {
  private viewport: HTMLElement | undefined
  private target: HTMLElement | undefined

  targetBounds: GuideBounds | undefined

  setViewport(el: HTMLElement): void {
    this.viewport = el
  }

  setTarget(el: HTMLElement): void {
    this.target = el
  }

  unset(): void {
    this.viewport = undefined
    this.target = undefined
    this.targetBounds = undefined
  }

  calculate(): void {
    const { target, viewport } = this
    if (!target || !viewport) {
      this.targetBounds = undefined
      return
    }

    const viewportBounds = viewport.getBoundingClientRect()
    const bounds = target.getBoundingClientRect()
    const s = window.getComputedStyle(target)

    const margin = {
      top: f(s.marginTop),
      bottom: f(s.marginBottom),
      left: f(s.marginLeft),
      right: f(s.marginRight)
    }

    const border = {
      top: f(s.borderTopWidth),
      bottom: f(s.borderBottomWidth),
      left: f(s.borderLeftWidth),
      right: f(s.borderRightWidth)
    }

    const padding = {
      top: f(s.paddingTop),
      bottom: f(s.paddingBottom),
      left: f(s.paddingLeft),
      right: f(s.paddingRight)
    }

    this.targetBounds = {
      left: bounds.left - viewportBounds.left,
      top: bounds.top - viewportBounds.top,
      width: bounds.width,
      height: bounds.height,
      margin,
      border,
      padding
    }
  }
}
