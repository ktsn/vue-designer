import { module, inject } from 'sinai'
import { GuideBounds, BoundsCalculator } from '@/view/store/bounds-calculator'
import { viewport } from '@/view/store/modules/viewport'

const { Getters, Mutations, Actions } = inject('viewport', viewport)

class GuideState {
  target: GuideBounds | undefined = undefined
}

class GuideGetters extends Getters<GuideState>() {
  get scaledTarget(): GuideBounds | undefined {
    if (!this.state.target) return

    const scale = this.modules.viewport.state.scale
    const target = this.state.target

    // The bounds may be modified by the current viewport scale.
    // To show the selected border with accurate bounds,
    // we need to get original bounds by dividing them by the scale.
    return {
      ...target,
      left: target.left / scale,
      top: target.top / scale,
      width: target.width / scale,
      height: target.height / scale
    }
  }
}

class GuideMutations extends Mutations<GuideState>() {
  setTargetBounds(bounds?: GuideBounds): void {
    this.state.target = bounds
  }
}

class GuideActions extends Actions<GuideState, GuideGetters, GuideMutations>() {
  private boundsCalculator!: BoundsCalculator

  init(calculator: BoundsCalculator): void {
    this.boundsCalculator = calculator
  }

  selectTarget(el: HTMLElement, viewport: HTMLElement): void {
    this.boundsCalculator.setTarget(el)
    this.boundsCalculator.setViewport(viewport)
    this.calculate()
  }

  deselect(): void {
    this.boundsCalculator.unset()
    this.mutations.setTargetBounds()
  }

  calculate(): void {
    this.boundsCalculator.calculate()
    this.mutations.setTargetBounds(this.boundsCalculator.targetBounds)
  }
}

export const guide = module({
  state: GuideState,
  getters: GuideGetters,
  mutations: GuideMutations,
  actions: GuideActions
})
