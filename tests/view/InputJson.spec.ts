import { describe, expect, it } from 'vitest'
import { mount, Wrapper } from '@vue/test-utils'
import InputJson from '../../src/view/components/InputJson.vue'

describe('InputJson', () => {
  describe('Check render', () => {
    it('renders string value', () => {
      const wrapper = mount(InputJson, {
        propsData: {
          field: {
            name: 'stringName',
            value: 'string value',
          },
        },
      })

      expect(wrapper.html()).toMatchSnapshot()
    })

    it('renders number value', () => {
      const wrapper = mount(InputJson, {
        propsData: {
          field: {
            name: 'numberName',
            value: 123,
          },
        },
      })

      expect(wrapper.html()).toMatchSnapshot()
    })

    it('renders boolean value', () => {
      const wrapper = mount(InputJson, {
        propsData: {
          field: {
            name: 'booleanName',
            value: true,
          },
        },
      })

      expect(wrapper.html()).toMatchSnapshot()
    })

    it('renders null value', () => {
      const wrapper = mount(InputJson, {
        propsData: {
          field: {
            name: 'nullName',
            value: null,
          },
        },
      })

      expect(wrapper.html()).toMatchSnapshot()
    })

    it('renders undefined value', () => {
      const wrapper = mount(InputJson, {
        propsData: {
          field: {
            name: 'numberName',
            value: undefined,
          },
        },
      })

      expect(wrapper.html()).toMatchSnapshot()
    })

    it('renders object value', () => {
      const wrapper = mount(InputJson, {
        propsData: {
          field: {
            name: 'objectName',
            value: {
              foo: 'test',
              bar: 123,
            },
          },
        },
      })

      expect(wrapper.html()).toMatchSnapshot()
    })

    it('renders array value', () => {
      const wrapper = mount(InputJson, {
        propsData: {
          field: {
            name: 'arrayName',
            value: ['test', 123, true],
          },
        },
      })

      expect(wrapper.html()).toMatchSnapshot()
    })
  })

  describe('Behavior', () => {
    it('notifies updated value', () => {
      const wrapper = mount(InputJson, {
        propsData: {
          field: {
            name: 'test',
            value: 123,
          },
        },
      })
      const ctrl = new InputJsonController(wrapper)

      ctrl.clickEdit()
      ctrl.editValue('456')
      ctrl.clickApply()

      expect(wrapper.emitted('change')[0]).toEqual([
        {
          name: 'test',
          value: 456,
        },
      ])
    })

    it('converts json value', () => {
      const wrapper = mount(InputJson, {
        propsData: {
          field: {
            name: 'test',
            value: 123,
          },
        },
      })
      const ctrl = new InputJsonController(wrapper)

      ctrl.clickEdit()
      ctrl.editValue('{"foo": "123", "bar": 123, "baz": null}')
      ctrl.clickApply()

      expect(wrapper.emitted('change')[0]).toEqual([
        {
          name: 'test',
          value: {
            foo: '123',
            bar: 123,
            baz: null,
          },
        },
      ])
    })

    it('edits child property value', () => {
      const wrapper = mount(InputJson, {
        propsData: {
          field: {
            name: 'test',
            value: {
              foo: 'abc',
              bar: 123,
            },
          },
        },
      })
      const bar = wrapper.findAll(InputJson).at(2)
      const ctrl = new InputJsonController(bar)

      ctrl.clickEdit()
      ctrl.editValue('456')
      ctrl.clickApply()

      expect(wrapper.emitted('change')[0]).toEqual([
        {
          name: 'test',
          value: {
            foo: 'abc',
            bar: 456,
          },
        },
      ])
    })

    it('edits array item', () => {
      const wrapper = mount(InputJson, {
        propsData: {
          field: {
            name: 'test',
            value: ['foo', 123, true],
          },
        },
      })
      const second = wrapper.findAll(InputJson).at(2)
      const ctrl = new InputJsonController(second)

      ctrl.clickEdit()
      ctrl.editValue('456')
      ctrl.clickApply()

      expect(wrapper.emitted('change')[0]).toEqual([
        {
          name: 'test',
          value: ['foo', 456, true],
        },
      ])
    })

    it('rejects invalid json string', () => {
      const wrapper = mount<any>(InputJson, {
        propsData: {
          field: {
            name: 'test',
            value: 123,
          },
        },
      })
      const ctrl = new InputJsonController(wrapper)

      ctrl.clickEdit()
      ctrl.editValue('abc')
      ctrl.clickApply()

      expect(wrapper.emitted('change')).toBe(undefined)
    })

    it('is editable child property name', () => {
      const wrapper = mount(InputJson, {
        propsData: {
          field: {
            name: 'test',
            value: {
              foo: 'abc',
              bar: 'def',
            },
          },
        },
      })
      const child = wrapper.findAll(InputJson).at(1)
      const ctrl = new InputJsonController(child)

      ctrl.clickEdit()
      ctrl.editName('baz')
      ctrl.clickApply()

      expect(wrapper.emitted('change')[0]).toEqual([
        {
          name: 'test',
          value: {
            bar: 'def',
            baz: 'abc',
          },
        },
      ])
    })

    it('is not editable root property name', () => {
      const wrapper = mount(InputJson, {
        propsData: {
          field: {
            name: 'test',
            value: 123,
          },
        },
      })
      const ctrl = new InputJsonController(wrapper)

      ctrl.clickEdit()
      ctrl.editName('test2')
      ctrl.clickApply()

      expect(wrapper.emitted('change')[0]).toEqual([
        {
          name: 'test',
          value: 123,
        },
      ])
    })

    it('is not editable array property name', () => {
      const wrapper = mount(InputJson, {
        propsData: {
          field: {
            name: 'test',
            value: ['foo', 'bar', 'baz'],
          },
        },
      })
      const child = wrapper.find(InputJson)
      const ctrl = new InputJsonController(child)

      ctrl.clickEdit()
      ctrl.editName('3')
      ctrl.clickApply()

      expect(wrapper.emitted('change')[0]).toEqual([
        {
          name: 'test',
          value: ['foo', 'bar', 'baz'],
        },
      ])
    })
  })
})

class InputJsonController {
  constructor(private wrapper: Wrapper<any>) {}

  clickEdit(): void {
    if (!this.wrapper.vm.editing) {
      this.wrapper.find('.input-json-button').element.click()
    }
  }

  clickApply(): void {
    if (this.wrapper.vm.editing) {
      this.wrapper.find('.input-json-button:nth-child(2)').element.click()
    }
  }

  editName(str: string): void {
    const input = this.wrapper.find('.input-json-label.editing')
      .element as HTMLInputElement
    if (input) {
      input.value = str
      input.dispatchEvent(new Event('input'))
    }
  }

  editValue(str: string): void {
    const input = this.wrapper.find('.input-json-value.editing')
      .element as HTMLInputElement
    if (input) {
      input.value = str
      input.dispatchEvent(new Event('input'))
    }
  }
}
