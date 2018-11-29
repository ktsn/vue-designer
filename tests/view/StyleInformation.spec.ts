import { shallowMount, Wrapper } from '@vue/test-utils'
import StyleInformation from '@/view/components/StyleInformation.vue'
import { STRuleForPrint, STDeclarationForPrint } from '@/parser/style/types'

describe('StyleInformation', () => {
  const StyleDeclaration = {
    name: 'StyleDeclaration',
    props: ['prop', 'value', 'autoFocus'],
    render(this: any, h: Function) {
      return h('div', {
        attrs: {
          styleDeclarationStub: true,
          prop: this.prop,
          value: this.value,
          autoFocus: this.autoFocus
        }
      })
    }
  }

  const rules: STRuleForPrint[] = [
    {
      path: [0],
      selectors: ['a'],
      children: [
        {
          path: [0, 0],
          prop: 'color',
          value: 'red'
        },
        {
          path: [0, 1],
          prop: 'font-size',
          value: '22px'
        }
      ]
    }
  ]

  const create = () => {
    return shallowMount(StyleInformation, {
      propsData: {
        rules
      },
      stubs: {
        StyleDeclaration
      }
    })
  }

  const toDeclarationHtml = (wrapper: Wrapper<any>) => {
    return wrapper
      .findAll('[styledeclarationstub]')
      .wrappers.map(w => w.html())
      .join('\n')
  }

  describe('moving focus', () => {
    it('does not move focus if editing is ended by blur', () => {
      const wrapper = create()
      wrapper
        .findAll(StyleDeclaration)
        .at(0)
        .vm.$emit('input-end:prop', { reason: 'blur' })

      expect(toDeclarationHtml(wrapper)).toMatchSnapshot()
    })

    it('moves from prop to value', () => {
      const wrapper = create()
      wrapper
        .findAll(StyleDeclaration)
        .at(0)
        .vm.$emit('input-end:prop', { reason: 'enter' })

      expect(toDeclarationHtml(wrapper)).toMatchSnapshot()
    })

    it('moves from value to prop', () => {
      const wrapper = create()
      wrapper
        .findAll(StyleDeclaration)
        .at(0)
        .vm.$emit('input-end:value', { reason: 'tab', shiftKey: true })

      expect(toDeclarationHtml(wrapper)).toMatchSnapshot()
    })

    it('moves from value to next prop value', () => {
      const wrapper = create()
      wrapper
        .findAll(StyleDeclaration)
        .at(0)
        .vm.$emit('input-end:value', { reason: 'enter' })

      expect(toDeclarationHtml(wrapper)).toMatchSnapshot()
    })

    it('moves from prop to prev declaration value', () => {
      const wrapper = create()
      wrapper
        .findAll(StyleDeclaration)
        .at(1)
        .vm.$emit('input-end:prop', { reason: 'tab', shiftKey: true })

      expect(toDeclarationHtml(wrapper)).toMatchSnapshot()
    })

    it('removes focus if it cannot go back', () => {
      const wrapper = create()
      wrapper
        .findAll(StyleDeclaration)
        .at(0)
        .vm.$emit('input-end:prop', { reason: 'tab', shiftKey: true })

      expect(toDeclarationHtml(wrapper)).toMatchSnapshot()
    })

    it('adds a new declaration and moves focus to it', () => {
      const wrapper = create()
      wrapper
        .findAll(StyleDeclaration)
        .at(1)
        .vm.$emit('input-end:value', { reason: 'enter' })

      expect(wrapper.emitted('add-declaration')[0][0]).toEqual({
        path: [0, 2]
      })

      wrapper.setProps({
        rules: [
          {
            ...rules[0],
            children: [
              ...rules[0].children,
              {
                path: [0, 2],
                prop: 'property',
                value: 'value'
              }
            ]
          }
        ]
      })

      expect(toDeclarationHtml(wrapper)).toMatchSnapshot()
    })
  })

  describe('add a new declaration', () => {
    const newDecl = {
      path: [0, 99],
      prop: 'font-weight',
      value: 'bold'
    }

    const addTo = (decl: STDeclarationForPrint, index: number) => {
      return [
        {
          ...rules[0],
          children: [
            ...rules[0].children.slice(0, index),
            decl,
            ...rules[0].children.slice(index)
          ]
        }
      ]
    }

    it('adds to the first position', async () => {
      const wrapper = create()
      wrapper.find('.selector-list').trigger('click')

      expect(wrapper.emitted('add-declaration')[0][0]).toEqual({
        path: [0, 0]
      })

      wrapper.setProps({
        rules: addTo(newDecl, 0)
      })

      await wrapper.vm.$nextTick()

      expect(toDeclarationHtml(wrapper)).toMatchSnapshot()
    })

    it('adds to the last position', async () => {
      const wrapper = create()
      wrapper.find('.rule').trigger('click')

      expect(wrapper.emitted('add-declaration')[0][0]).toEqual({
        path: [0, 2]
      })

      wrapper.setProps({
        rules: addTo(newDecl, 2)
      })

      await wrapper.vm.$nextTick()

      expect(toDeclarationHtml(wrapper)).toMatchSnapshot()
    })

    it('inserts to the clicked position', async () => {
      const wrapper = create()
      wrapper.find('.declaration').trigger('click')

      expect(wrapper.emitted('add-declaration')[0][0]).toEqual({
        path: [0, 1]
      })

      wrapper.setProps({
        rules: addTo(newDecl, 1)
      })

      await wrapper.vm.$nextTick()

      expect(toDeclarationHtml(wrapper)).toMatchSnapshot()
    })
  })
})
