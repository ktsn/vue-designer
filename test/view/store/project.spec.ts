import { Store } from 'vuex'
import { project } from '@/view/store/modules/project'
import { createTemplate, h } from '../../parser/template-helpers'
import { createStyle, rule, selector } from '../../parser/style-helpers'
import { addScope as addScopeToTemplate } from '@/parser/template'

describe('Store project getters', () => {
  let store: Store<any>
  beforeEach(() => {
    store = new Store({
      modules: { project }
    })
  })

  describe('scopedDocuments', () => {
    it('add scope attribute to template elements', () => {
      const docs = (store.state.project.documents = documents())

      const actual = store.getters['project/scopedDocuments']['file:///Foo.vue']
      const expected = addScopeToTemplate(
        docs['file:///Foo.vue'].template,
        'foo'
      )

      expect(actual.template).toEqual(expected)
    })

    it('add scope attribute to style selectors', () => {
      store.state.project.documents = documents()
      const actual = store.getters['project/scopedDocuments']['file:///Foo.vue']
      expect(actual.styleCode).toBe('div[data-scope-foo] {}')
    })
  })
})

function documents() {
  return {
    'file:///Foo.vue': {
      uri: 'file:///Foo.vue',
      template: createTemplate([h('div', [], [])]),
      props: [],
      data: [],
      childComponents: [],
      styles: [createStyle([rule([selector({ tag: 'div' })])])],
      scopeId: 'foo'
    }
  }
}
