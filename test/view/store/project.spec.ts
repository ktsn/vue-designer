import { Store } from 'vuex'
import { project, ProjectState } from '@/view/store/modules/project'
import { createTemplate, h } from '../../helpers/template'
import { createStyle, rule, selector } from '../../helpers/style'
import { addScope as addScopeToTemplate } from '@/parser/template/manipulate'
import { ClientConnection } from '@/view/communication'

describe('Store project getters', () => {
  let store: Store<any>, state: ProjectState
  beforeEach(() => {
    store = new Store({
      modules: { project }
    })
    state = store.state.project
  })

  describe('scopedDocuments', () => {
    it('should add scope attribute to template elements', () => {
      const docs = (state.documents = documents())

      const actual = store.getters['project/scopedDocuments']['file:///Foo.vue']
      const expected = addScopeToTemplate(
        docs['file:///Foo.vue'].template,
        'foo'
      )

      expect(actual.template).toEqual(expected)
    })

    it('should add scope attribute to style selectors', () => {
      state.documents = documents()
      const actual = store.getters['project/scopedDocuments']['file:///Foo.vue']
      expect(actual.styleCode).toBe('div[data-scope-foo] {}')
    })
  })

  describe('localNameOfDragging', () => {
    it('should return local binding name of dragging component', () => {
      state.documents = documents()
      state.currentUri = 'file:///HasLocalBar.vue'
      state.draggingUri = 'file:///Bar.vue'

      const actual = store.getters['project/localNameOfDragging']
      expect(actual).toBe('LocalBar')
    })

    it('should return undefined if the current document does not have the dragging component', () => {
      state.documents = documents()
      state.currentUri = 'file:///Foo.vue'
      state.draggingUri = 'file:///Bar.vue'

      const actual = store.getters['project/localNameOfDragging']
      expect(actual).toBe(undefined)
    })

    it('should return undefined if it is not dragging', () => {
      state.documents = documents()
      state.currentUri = 'file:///HasLocalBar.vue'

      const actual = store.getters['project/localNameOfDragging']
      expect(actual).toBe(undefined)
    })
  })

  describe('nodeOfDragging', () => {
    it('should return an AST element of dragging component', () => {
      state.documents = documents()
      state.draggingUri = 'file:///Foo.vue'

      const actual = store.getters['project/nodeOfDragging']
      expect(actual).toEqual(h('Foo', [], []))
    })

    it('should named as local alias if the current document has it', () => {
      state.documents = documents()
      state.currentUri = 'file:///HasLocalBar.vue'
      state.draggingUri = 'file:///Bar.vue'

      const actual = store.getters['project/nodeOfDragging']
      expect(actual).toEqual(h('LocalBar', [], []))
    })

    it('should return undefined if there is no dragging', () => {
      state.documents = documents()

      const actual = store.getters['project/nodeOfDragging']
      expect(actual).toBe(undefined)
    })
  })

  describe('currentRenderingDocument', () => {
    it('should return a document that will be rendered in current', () => {
      state.documents = documents()
      state.currentUri = 'file:///Foo.vue'

      const actual = store.getters['project/currentRenderingDocument']
      const expected =
        store.getters['project/scopedDocuments'][state.currentUri]
      expect(actual).toEqual(expected)
    })

    it('should ignore if dragging path is empty', () => {
      state.documents = documents()
      state.currentUri = 'file:///Foo.vue'
      state.draggingUri = 'file:///Bar.vue'
      state.draggingPath = []

      const actual = store.getters['project/currentRenderingDocument'].template
      const expected =
        store.getters['project/scopedDocuments'][state.currentUri].template

      expect(actual).toEqual(expected)
    })

    it('should insert a dragging component into returned template', () => {
      state.documents = documents()
      state.currentUri = 'file:///Foo.vue'
      state.draggingUri = 'file:///Bar.vue'
      state.draggingPath = [0]

      const actual = store.getters['project/currentRenderingDocument'].template
      const expected =
        store.getters['project/scopedDocuments'][state.currentUri].template
      expected.children = [h('Bar', [], []), ...expected.children]

      expect(actual).toEqual(expected)
    })

    it('should insert a dragging component as a local name', () => {
      state.documents = documents()
      state.currentUri = 'file:///HasLocalBar.vue'
      state.draggingUri = 'file:///Bar.vue'
      state.draggingPath = [0]

      const actual = store.getters['project/currentRenderingDocument'].template
      const expected =
        store.getters['project/scopedDocuments'][state.currentUri].template
      expected.children = [h('LocalBar', [], []), ...expected.children]

      expect(actual).toEqual(expected)
    })

    it('should add a child component which dragging', () => {
      state.documents = documents()
      state.currentUri = 'file:///Foo.vue'
      state.draggingUri = 'file:///Bar.vue'
      state.draggingPath = [0]

      const actual =
        store.getters['project/currentRenderingDocument'].childComponents
      const children =
        store.getters['project/scopedDocuments'][state.currentUri]
          .childComponents
      const expected = children.concat({ name: 'Bar', uri: state.draggingUri })

      expect(actual).toEqual(expected)
    })

    it('should not add duplicated child component', () => {
      const docs = (state.documents = documents())
      const current = (state.currentUri = 'file:///HasBar.vue')
      state.draggingUri = 'file:///Bar.vue'
      state.draggingPath = [0]

      const actual =
        store.getters['project/currentRenderingDocument'].childComponents
      const expected = docs[current].childComponents

      expect(actual).toEqual(expected)
    })

    it('should not add duplicated child component even if it has a local name', () => {
      const docs = (state.documents = documents())
      const current = (state.currentUri = 'file:///HasLocalBar.vue')
      state.draggingUri = 'file:///Bar.vue'
      state.draggingPath = [0]

      const actual =
        store.getters['project/currentRenderingDocument'].childComponents
      const expected = docs[current].childComponents

      expect(actual).toEqual(expected)
    })
  })
})

describe('Store project actions', () => {
  let store: Store<any>, state: ProjectState, mockConnection: ClientConnection
  beforeEach(() => {
    store = new Store({
      modules: { project }
    })
    state = store.state.project

    mockConnection = {
      send: jest.fn(),
      onMessage: jest.fn()
    } as any
    store.dispatch('project/init', {
      connection: mockConnection
    })
  })

  describe('updateDeclaration', () => {
    it('should send to update declaration', () => {
      state.currentUri = 'file:///Foo.vue'

      store.dispatch('project/updateDeclaration', {
        path: [0, 0, 0],
        prop: 'color',
        value: 'red'
      })

      expect(mockConnection.send).toHaveBeenCalledWith({
        type: 'UpdateDeclaration',
        uri: state.currentUri,
        declaration: {
          path: [0, 0, 0],
          prop: 'color',
          value: 'red',
          important: false
        }
      })
    })

    it('should parse important annotation', () => {
      state.currentUri = 'file:///Foo.vue'

      store.dispatch('project/updateDeclaration', {
        path: [0, 0, 0],
        prop: 'color',
        value: 'red !important'
      })

      expect(mockConnection.send).toHaveBeenCalledWith({
        type: 'UpdateDeclaration',
        uri: state.currentUri,
        declaration: {
          path: [0, 0, 0],
          prop: 'color',
          value: 'red',
          important: true
        }
      })
    })

    it('should not send if the uri is not specified', () => {
      state.currentUri = undefined

      store.dispatch('project/updateDeclaration', {
        path: [0, 0, 0],
        prop: 'color',
        value: 'red'
      })

      expect(mockConnection.send).not.toHaveBeenCalled()
    })
  })
})

function documents() {
  return {
    'file:///Foo.vue': {
      uri: 'file:///Foo.vue',
      template: createTemplate([h('div', [], ['foo'])]),
      props: [],
      data: [],
      childComponents: [],
      styles: [createStyle([rule([selector({ tag: 'div' })])])],
      scopeId: 'foo'
    },
    'file:///HasBar.vue': {
      uri: 'file:///HasBar.vue',
      template: createTemplate([h('div', [], ['hasbar'])]),
      props: [],
      data: [],
      childComponents: [{ name: 'Bar', uri: 'file:///Bar.vue' }],
      styles: [createStyle([rule([selector({ tag: 'div' })])])],
      scopeId: 'hasbar'
    },
    'file:///HasLocalBar.vue': {
      uri: 'file:///HasLocalBar.vue',
      template: createTemplate([h('div', [], ['haslocalbar'])]),
      props: [],
      data: [],
      childComponents: [{ name: 'LocalBar', uri: 'file:///Bar.vue' }],
      styles: [createStyle([rule([selector({ tag: 'div' })])])],
      scopeId: 'haslocalbar'
    },
    'file:///Bar.vue': {
      uri: 'file:///Bar.vue',
      template: createTemplate([h('p', [], ['bar'])]),
      props: [],
      data: [],
      childComponents: [],
      styles: [createStyle([rule([selector({ tag: 'p' })])])],
      scopeId: 'bar'
    }
  }
}
