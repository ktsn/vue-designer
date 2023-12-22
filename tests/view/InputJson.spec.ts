import { describe, expect, it, vitest } from 'vitest'
import { mount } from '../helpers/vue'
import InputJson from '../../src/view/components/InputJson.vue'
import { nextTick } from 'vue'

describe('InputJson', () => {
  describe('Check render', () => {
    it('renders string value', () => {
      const { vm } = mount(InputJson, {
        field: {
          name: 'stringName',
          value: 'string value',
        },
      })

      expect(vm.$el.outerHTML).toMatchSnapshot()
    })

    it('renders number value', () => {
      const { vm } = mount(InputJson, {
        field: {
          name: 'numberName',
          value: 123,
        },
      })

      expect(vm.$el.outerHTML).toMatchSnapshot()
    })

    it('renders boolean value', () => {
      const { vm } = mount(InputJson, {
        field: {
          name: 'booleanName',
          value: true,
        },
      })

      expect(vm.$el.outerHTML).toMatchSnapshot()
    })

    it('renders null value', () => {
      const { vm } = mount(InputJson, {
        field: {
          name: 'nullName',
          value: null,
        },
      })

      expect(vm.$el.outerHTML).toMatchSnapshot()
    })

    it('renders undefined value', () => {
      const { vm } = mount(InputJson, {
        field: {
          name: 'numberName',
          value: undefined,
        },
      })

      expect(vm.$el.outerHTML).toMatchSnapshot()
    })

    it('renders object value', () => {
      const { vm } = mount(InputJson, {
        field: {
          name: 'objectName',
          value: {
            foo: 'test',
            bar: 123,
          },
        },
      })

      expect(vm.$el.outerHTML).toMatchSnapshot()
    })

    it('renders array value', () => {
      const { vm } = mount(InputJson, {
        field: {
          name: 'arrayName',
          value: ['test', 123, true],
        },
      })

      expect(vm.$el.outerHTML).toMatchSnapshot()
    })
  })

  describe('Behavior', () => {
    it('notifies updated value', async () => {
      const change = vitest.fn()

      const { vm } = mount(
        InputJson,
        {
          field: {
            name: 'test',
            value: 123,
          },
        },
        { change }
      )
      const ctrl = new InputJsonController(vm.$el)

      ctrl.clickEdit()
      await nextTick()
      ctrl.editValue('456')
      await nextTick()
      ctrl.clickApply()

      expect(change).toHaveBeenCalledWith({
        name: 'test',
        value: 456,
      })
    })

    it('converts json value', async () => {
      const change = vitest.fn()

      const { vm } = mount(
        InputJson,
        {
          field: {
            name: 'test',
            value: 123,
          },
        },
        { change }
      )
      const ctrl = new InputJsonController(vm.$el)

      ctrl.clickEdit()
      await nextTick()
      ctrl.editValue('{"foo": "123", "bar": 123, "baz": null}')
      await nextTick()
      ctrl.clickApply()

      expect(change).toHaveBeenCalledWith({
        name: 'test',
        value: {
          foo: '123',
          bar: 123,
          baz: null,
        },
      })
    })

    it('edits child property value', async () => {
      const change = vitest.fn()

      const { vm } = mount(
        InputJson,
        {
          field: {
            name: 'test',
            value: {
              foo: 'abc',
              bar: 123,
            },
          },
        },
        { change }
      )
      const bar = vm.$el.querySelectorAll('[data-test-id=input-json]')[1]!
      const ctrl = new InputJsonController(bar)

      ctrl.clickEdit()
      await nextTick()
      ctrl.editValue('456')
      await nextTick()
      ctrl.clickApply()

      expect(change).toHaveBeenCalledWith({
        name: 'test',
        value: {
          foo: 'abc',
          bar: 456,
        },
      })
    })

    it('edits array item', async () => {
      const change = vitest.fn()

      const { vm } = mount(
        InputJson,
        {
          field: {
            name: 'test',
            value: ['foo', 123, true],
          },
        },
        { change }
      )
      const second = vm.$el.querySelectorAll('[data-test-id=input-json]')[1]!
      const ctrl = new InputJsonController(second)

      ctrl.clickEdit()
      await nextTick()
      ctrl.editValue('456')
      await nextTick()
      ctrl.clickApply()

      expect(change).toHaveBeenCalledWith({
        name: 'test',
        value: ['foo', 456, true],
      })
    })

    it('rejects invalid json string', async () => {
      const change = vitest.fn()

      const { vm } = mount(
        InputJson,
        {
          field: {
            name: 'test',
            value: 123,
          },
        },
        { change }
      )
      const ctrl = new InputJsonController(vm.$el)

      ctrl.clickEdit()
      await nextTick()
      ctrl.editValue('abc')
      await nextTick()
      ctrl.clickApply()

      expect(change).not.toHaveBeenCalled()
    })

    it('is editable child property name', async () => {
      const change = vitest.fn()

      const { vm } = mount(
        InputJson,
        {
          field: {
            name: 'test',
            value: {
              foo: 'abc',
              bar: 'def',
            },
          },
        },
        { change }
      )
      const child = vm.$el.querySelector('[data-test-id=input-json]')!
      const ctrl = new InputJsonController(child)

      ctrl.clickEdit()
      await nextTick()
      ctrl.editName('baz')
      await nextTick()
      ctrl.clickApply()

      expect(change).toHaveBeenCalledWith({
        name: 'test',
        value: {
          baz: 'abc',
          bar: 'def',
        },
      })
    })

    it('is not editable root property name', async () => {
      const change = vitest.fn()

      const { vm } = mount(
        InputJson,
        {
          field: {
            name: 'test',
            value: 123,
          },
        },
        { change }
      )
      const ctrl = new InputJsonController(vm.$el)

      ctrl.clickEdit()
      await nextTick()
      ctrl.editName('test2')
      await nextTick()
      ctrl.clickApply()

      expect(change).toHaveBeenCalledWith({
        name: 'test',
        value: 123,
      })
    })

    it('is not editable array property name', async () => {
      const change = vitest.fn()

      const { vm } = mount(
        InputJson,
        {
          field: {
            name: 'test',
            value: ['foo', 'bar', 'baz'],
          },
        },
        { change }
      )
      const child = vm.$el.querySelector('[data-test-id=input-json]')!
      const ctrl = new InputJsonController(child)

      ctrl.clickEdit()
      await nextTick()
      ctrl.editName('3')
      await nextTick()
      ctrl.clickApply()

      expect(change).toHaveBeenCalledWith({
        name: 'test',
        value: ['foo', 'bar', 'baz'],
      })
    })
  })
})

class InputJsonController {
  constructor(private el: Element) {}

  clickEdit(): void {
    this.el
      .querySelector('.input-json-button')!
      .dispatchEvent(new MouseEvent('click'))
  }

  clickApply(): void {
    this.el
      .querySelector('.input-json-button:nth-child(2)')!
      .dispatchEvent(new MouseEvent('click'))
  }

  editName(str: string): void {
    const input = this.el.querySelector<HTMLInputElement>(
      '.input-json-label.editing'
    )
    if (input) {
      input.value = str
      input.dispatchEvent(new Event('input'))
    }
  }

  editValue(str: string): void {
    const input = this.el.querySelector<HTMLInputElement>(
      '.input-json-value.editing'
    )
    if (input) {
      input.value = str
      input.dispatchEvent(new Event('input'))
    }
  }
}
