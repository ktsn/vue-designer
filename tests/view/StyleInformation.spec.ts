import { describe, expect, it, vitest } from 'vitest'
import StyleInformation from '../../src/view/components/StyleInformation.vue'
import {
  STRuleForPrint,
  STDeclarationForPrint,
} from '../../src/parser/style/types'
import { mount } from '../helpers/vue'
import { nextTick } from 'vue'

describe('StyleInformation', () => {
  const rules: STRuleForPrint[] = [
    {
      path: [0],
      selectors: ['a'],
      children: [
        {
          path: [0, 0],
          prop: 'color',
          value: 'red',
        },
        {
          path: [0, 1],
          prop: 'font-size',
          value: '22px',
        },
      ],
    },
  ]

  const create = (listeners: Record<string, any> = {}) => {
    return mount(StyleInformation, {
      rules,
      ...listeners,
    })
  }

  describe('moving focus', () => {
    it('does not move focus if editing is ended by blur', async () => {
      const { vm } = create()
      const firstButton = vm.$el.querySelector('button')
      firstButton!.dispatchEvent(new MouseEvent('click'))
      await nextTick()

      const input = vm.$el.querySelector('[contenteditable=true]')
      input!.dispatchEvent(new Event('blur'))
      await nextTick()

      expect(vm.$el.outerHTML).toMatchSnapshot()
    })

    it('moves from prop to value', async () => {
      const { vm } = create()
      const firstButton = vm.$el.querySelector('button')
      firstButton!.dispatchEvent(new MouseEvent('click'))
      await nextTick()

      const input = vm.$el.querySelector('[contenteditable=true]')
      input!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
      await nextTick()

      expect(vm.$el.outerHTML).toMatchSnapshot()
    })

    it('moves from value to prop', async () => {
      const { vm } = create()
      const secondButton = vm.$el.querySelectorAll('button')[1]!
      secondButton!.dispatchEvent(new MouseEvent('click'))
      await nextTick()

      const input = vm.$el.querySelector('[contenteditable=true]')
      input!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }),
      )
      await nextTick()

      expect(vm.$el.outerHTML).toMatchSnapshot()
    })

    it('moves from value to next prop value', async () => {
      const { vm } = create()
      const secondButton = vm.$el.querySelectorAll('button')[1]!
      secondButton!.dispatchEvent(new MouseEvent('click'))
      await nextTick()

      const input = vm.$el.querySelector('[contenteditable=true]')
      input!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
      await nextTick()

      expect(vm.$el.outerHTML).toMatchSnapshot()
    })

    it('moves from prop to prev declaration value', async () => {
      const { vm } = create()
      const thirdButton = vm.$el.querySelectorAll('button')[2]!
      thirdButton!.dispatchEvent(new MouseEvent('click'))
      await nextTick()

      const input = vm.$el.querySelector('[contenteditable=true]')
      input!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }),
      )
      await nextTick()

      expect(vm.$el.outerHTML).toMatchSnapshot()
    })

    it('removes focus if it cannot go back', async () => {
      const { vm } = create()
      const firstButton = vm.$el.querySelector('button')
      firstButton!.dispatchEvent(new MouseEvent('click'))
      await nextTick()

      const input = vm.$el.querySelector('[contenteditable=true]')
      input!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }),
      )
      await nextTick()

      expect(vm.$el.outerHTML).toMatchSnapshot()
    })

    it('adds a new declaration and moves focus to it', async () => {
      const onAddDeclaration = vitest.fn()

      const { vm, updateProps } = create({
        onAddDeclaration,
      })

      const fourthButton = vm.$el.querySelectorAll('button')[3]!
      fourthButton!.dispatchEvent(new MouseEvent('click'))
      await nextTick()

      const input = vm.$el.querySelector('[contenteditable=true]')
      input!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))

      expect(onAddDeclaration).toHaveBeenCalledWith({
        path: [0, 2],
      })

      updateProps({
        rules: [
          {
            ...rules[0],
            children: [
              ...rules[0].children,
              {
                path: [0, 2],
                prop: 'property',
                value: 'value',
              },
            ],
          },
        ],
      })

      await nextTick()

      expect(vm.$el.outerHTML).toMatchSnapshot()
    })
  })

  describe('add a new declaration', () => {
    const newDecl = {
      path: [0, 99],
      prop: 'font-weight',
      value: 'bold',
    }

    const addTo = (decl: STDeclarationForPrint, index: number) => {
      return [
        {
          ...rules[0],
          children: [
            ...rules[0].children.slice(0, index),
            decl,
            ...rules[0].children.slice(index),
          ],
        },
      ]
    }

    it('adds to the first position', async () => {
      const onAddDeclaration = vitest.fn()

      const { vm, updateProps } = create({
        onAddDeclaration,
      })
      vm.$el
        .querySelector('.selector-list')!
        .dispatchEvent(new MouseEvent('click'))

      expect(onAddDeclaration).toHaveBeenCalledWith({
        path: [0, 0],
      })

      updateProps({
        rules: addTo(newDecl, 0),
      })

      await nextTick()

      expect(vm.$el.outerHTML).toMatchSnapshot()
    })

    it('adds to the last position', async () => {
      const onAddDeclaration = vitest.fn()

      const { vm, updateProps } = create({
        onAddDeclaration,
      })
      vm.$el.querySelector('.rule')!.dispatchEvent(new MouseEvent('click'))

      expect(onAddDeclaration).toHaveBeenCalledWith({
        path: [0, 2],
      })

      updateProps({
        rules: addTo(newDecl, 2),
      })

      await nextTick()

      expect(vm.$el.outerHTML).toMatchSnapshot()
    })

    it('inserts to the clicked position', async () => {
      const onAddDeclaration = vitest.fn()

      const { vm, updateProps } = create({
        onAddDeclaration,
      })
      vm.$el
        .querySelector('.declaration')!
        .dispatchEvent(new MouseEvent('click'))

      expect(onAddDeclaration).toHaveBeenCalledWith({
        path: [0, 1],
      })

      updateProps({
        rules: addTo(newDecl, 1),
      })

      await nextTick()

      expect(vm.$el.outerHTML).toMatchSnapshot()
    })
  })
})
