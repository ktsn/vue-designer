import { store as createStore } from 'sinai'
import { stub } from 'sinai/lib/test'
import { project } from '@/view/store/modules/project'
import { ProjectGetters } from '@/view/store/modules/project/project-getters'
import { ProjectActions } from '@/view/store/modules/project/project-actions'
import { ProjectMutations } from '@/view/store/modules/project/project-mutations'
import { createTemplate, h } from '../../helpers/template'
import { createStyle, rule, selector } from '../../helpers/style'
import { addScope as addScopeToTemplate } from '@/parser/template/manipulate'
import { CommunicationClient } from '@/view/communication/client'
import { StyleMatcher } from '@/view/store/style-matcher'
import { STRuleForPrint } from '@/parser/style/types'

describe('Store project getters', () => {
  describe('scopedDocuments', () => {
    it('should add scope attribute to template elements', () => {
      const docs = documents()
      const getters = stub(ProjectGetters, {
        state: {
          documents: docs
        }
      })

      const actual = getters.scopedDocuments['file:///Foo.vue']
      const expected = addScopeToTemplate(
        docs['file:///Foo.vue'].template,
        'foo'
      )

      expect(actual.template).toEqual(expected)
    })

    it('should add scope attribute to style selectors', () => {
      const getters = stub(ProjectGetters, {
        state: {
          documents: documents()
        }
      })
      const actual = getters.scopedDocuments['file:///Foo.vue']
      expect(actual.styleCode).toBe('div[data-scope-foo] {}')
    })
  })

  describe('localNameOfDragging', () => {
    it('should return local binding name of dragging component', () => {
      const getters = stub(ProjectGetters, {
        state: {
          documents: documents(),
          currentUri: 'file:///HasLocalBar.vue',
          draggingUri: 'file:///Bar.vue'
        }
      })

      const actual = getters.localNameOfDragging
      expect(actual).toBe('LocalBar')
    })

    it('should return undefined if the current document does not have the dragging component', () => {
      const getters = stub(ProjectGetters, {
        state: {
          documents: documents(),
          currentUri: 'file:///Foo.vue',
          draggingUri: 'file:///Bar.vue'
        }
      })

      const actual = getters.localNameOfDragging
      expect(actual).toBe(undefined)
    })

    it('should return undefined if it is not dragging', () => {
      const getters = stub(ProjectGetters, {
        state: {
          documents: documents(),
          currentUri: 'file:///HasLocalBar.vue'
        }
      })

      const actual = getters.localNameOfDragging
      expect(actual).toBe(undefined)
    })
  })

  describe('nodeOfDragging', () => {
    it('should return an AST element of dragging component', () => {
      const getters = stub(ProjectGetters, {
        state: {
          documents: documents(),
          draggingUri: 'file:///Foo.vue'
        }
      })

      const actual = getters.nodeOfDragging
      expect(actual).toEqual(h('Foo', [], []))
    })

    it('should named as local alias if the current document has it', () => {
      const getters = stub(ProjectGetters, {
        state: {
          documents: documents(),
          currentUri: 'file:///HasLocalBar.vue',
          draggingUri: 'file:///Bar.vue'
        }
      })

      const actual = getters.nodeOfDragging
      expect(actual).toEqual(h('LocalBar', [], []))
    })

    it('should return undefined if there is no dragging', () => {
      const getters = stub(ProjectGetters, {
        state: {
          documents: documents()
        }
      })

      const actual = getters.nodeOfDragging
      expect(actual).toBe(undefined)
    })
  })

  describe('currentRenderingDocument', () => {
    it('should return a document that will be rendered in current', () => {
      const currentUri = 'file:///Foo.vue'
      const getters = stub(ProjectGetters, {
        state: {
          documents: documents(),
          currentUri
        }
      })

      const actual = getters.currentRenderingDocument
      const expected = getters.scopedDocuments[currentUri]
      expect(actual).toEqual(expected)
    })

    it('should ignore if dragging path is empty', () => {
      const currentUri = 'file:///Foo.vue'
      const getters = stub(ProjectGetters, {
        state: {
          documents: documents(),
          currentUri,
          draggingUri: 'file:///Bar.vue',
          draggingPath: []
        }
      })

      const actual = getters.currentRenderingDocument!.template
      const expected = getters.scopedDocuments[currentUri].template

      expect(actual).toEqual(expected)
    })

    it('should insert a dragging component into returned template', () => {
      const currentUri = 'file:///Foo.vue'
      const getters = stub(ProjectGetters, {
        state: {
          documents: documents(),
          currentUri,
          draggingUri: 'file:///Bar.vue',
          draggingPath: [0]
        }
      })

      const actual = getters.currentRenderingDocument!.template
      const expected = getters.scopedDocuments[currentUri].template!
      expected.children = [h('Bar', [], []), ...expected.children]

      expect(actual).toEqual(expected)
    })

    it('should insert a dragging component as a local name', () => {
      const currentUri = 'file:///HasLocalBar.vue'
      const getters = stub(ProjectGetters, {
        state: {
          documents: documents(),
          currentUri,
          draggingUri: 'file:///Bar.vue',
          draggingPath: [0]
        }
      })

      const actual = getters.currentRenderingDocument!.template
      const expected = getters.scopedDocuments[currentUri].template!
      expected.children = [h('LocalBar', [], []), ...expected.children]

      expect(actual).toEqual(expected)
    })

    it('should add a child component which dragging', () => {
      const currentUri = 'file:///Foo.vue'
      const draggingUri = 'file:///Bar.vue'
      const getters = stub(ProjectGetters, {
        state: {
          documents: documents(),
          currentUri,
          draggingUri,
          draggingPath: [0]
        }
      })

      const actual = getters.currentRenderingDocument!.childComponents
      const children = getters.scopedDocuments[currentUri].childComponents
      const expected = children.concat({ name: 'Bar', uri: draggingUri })

      expect(actual).toEqual(expected)
    })

    it('should not add duplicated child component', () => {
      const docs = documents()
      const current = 'file:///HasBar.vue'
      const getters = stub(ProjectGetters, {
        state: {
          documents: docs,
          currentUri: current,
          draggingUri: 'file:///Bar.vue',
          draggingPath: [0]
        }
      })

      const actual = getters.currentRenderingDocument!.childComponents
      const expected = docs[current].childComponents

      expect(actual).toEqual(expected)
    })

    it('should not add duplicated child component even if it has a local name', () => {
      const docs = documents()
      const current = 'file:///HasLocalBar.vue'
      const getters = stub(ProjectGetters, {
        state: {
          documents: docs,
          currentUri: current,
          draggingUri: 'file:///Bar.vue',
          draggingPath: [0]
        }
      })

      const actual = getters.currentRenderingDocument!.childComponents
      const expected = docs[current].childComponents

      expect(actual).toEqual(expected)
    })
  })
})

describe('Store project actions', () => {
  let mock: {
    client: CommunicationClient<any, any, any>
    styleMatcher: StyleMatcher
  }

  beforeEach(() => {
    mock = {
      client: {
        onReady: jest.fn(),
        mutate: jest.fn(),
        observe: jest.fn()
      } as any,

      styleMatcher: {
        match: jest.fn(),
        register: jest.fn(),
        unregister: jest.fn()
      } as any
    }
  })

  describe('setDocument', () => {
    it('sets the document and setup scope and matched styles', () => {
      const setDocument = jest.fn()
      const refreshScope = jest.fn()
      const actions = stub(ProjectActions, {
        mutations: {
          setDocument,
          refreshScope
        }
      })
      actions.matchSelectedNodeWithStyles = jest.fn()

      actions.init(mock)

      const mockFile: any = {
        uri: 'test://test.vue',
        styles: { style: true },
        props: { props: true },
        data: { data: true }
      }
      actions.setDocument(mockFile)

      expect(mock.styleMatcher.register).toHaveBeenCalledWith(
        mockFile.uri,
        mockFile.styles
      )
      expect(setDocument).toHaveBeenCalledWith(mockFile)
      expect(refreshScope).toHaveBeenCalledWith({
        uri: mockFile.uri,
        props: mockFile.props,
        data: mockFile.data
      })
      expect(actions.matchSelectedNodeWithStyles).toHaveBeenCalled()
    })
  })

  describe('removeDocument', () => {
    it('removes the document and cleanup scope and matched styles', () => {
      const removeDocument = jest.fn()
      const cleanScope = jest.fn()
      const actions = stub(ProjectActions, {
        mutations: {
          removeDocument,
          cleanScope
        }
      })
      actions.matchSelectedNodeWithStyles = jest.fn()

      actions.init(mock)

      const uri = 'test://test.vue'
      actions.removeDocument(uri)

      expect(mock.styleMatcher.unregister).toHaveBeenCalledWith(uri)
      expect(removeDocument).toHaveBeenCalledWith(uri)
      expect(cleanScope).toHaveBeenCalledWith(uri)
      expect(actions.matchSelectedNodeWithStyles).toHaveBeenCalled()
    })
  })

  describe('updateDeclaration', () => {
    it('should send to update declaration', () => {
      const actions = stub(ProjectActions, {
        state: {
          currentUri: 'file:///Foo.vue'
        }
      })
      actions.init(mock)

      actions.updateDeclaration({
        path: [0, 0, 0],
        prop: 'color',
        value: 'red'
      })

      expect(mock.client.mutate).toHaveBeenCalledWith('updateDeclaration', {
        uri: actions.state.currentUri,
        declaration: {
          path: [0, 0, 0],
          prop: 'color',
          value: 'red',
          important: false
        }
      })
    })

    it('should parse important annotation', () => {
      const actions = stub(ProjectActions, {
        state: { currentUri: 'file:///Foo.vue' }
      })
      actions.init(mock)

      actions.updateDeclaration({
        path: [0, 0, 0],
        prop: 'color',
        value: 'red !important'
      })

      expect(mock.client.mutate).toHaveBeenCalledWith('updateDeclaration', {
        uri: actions.state.currentUri,
        declaration: {
          path: [0, 0, 0],
          prop: 'color',
          value: 'red',
          important: true
        }
      })
    })

    it('should not send if the uri is not specified', () => {
      const actions = stub(ProjectActions, {
        state: { currentUri: undefined }
      })
      actions.init(mock)

      actions.updateDeclaration({
        path: [0, 0, 0],
        prop: 'color',
        value: 'red'
      })

      expect(mock.client.mutate).not.toHaveBeenCalled()
    })
  })

  describe('matchSelectedNodeWithStyles', () => {
    const emptyRule: STRuleForPrint = {
      path: [0, 0],
      selectors: ['div'],
      children: []
    }

    it('extract rules of node', () => {
      const docs = documents()
      const store = createStore(project)

      store.actions.init(mock)
      store.state.documents = docs
      store.state.currentUri = 'file:///Foo.vue'
      store.state.selectedPath = [0]

      const matched = [docs['file:///Foo.vue'].styles[0].children[0]]
      ;(mock.styleMatcher.match as any).mockReturnValue(matched)

      store.actions.matchSelectedNodeWithStyles()

      expect(store.state.matchedRules.length).toBe(1)
      const r = store.state.matchedRules[0]
      expect(r.path).toEqual([0, 0])
      expect(r.selectors).toEqual(['div'])
    })

    it('resets matched rules when no doc is selected', () => {
      const store = createStore(project)

      store.actions.init(mock)
      store.state.documents = documents()
      store.state.currentUri = undefined
      store.state.matchedRules = [emptyRule]

      store.actions.matchSelectedNodeWithStyles()
      expect(store.state.matchedRules).toEqual([])
    })

    it('resets matched rules when no node is selected', () => {
      const store = createStore(project)

      store.actions.init(mock)
      store.state.documents = documents()
      store.state.currentUri = 'file:///Foo.vue'
      store.state.selectedPath = []
      store.state.matchedRules = [emptyRule]

      store.actions.matchSelectedNodeWithStyles()
      expect(store.state.matchedRules).toEqual([])
    })
  })
})

describe('Store project mutations', () => {
  describe('refreshScope', () => {
    it('adds missing scope', () => {
      const mutations = stub(ProjectMutations, {
        state: {
          documentScopes: {}
        }
      })

      mutations.refreshScope({
        uri: 'file:///Foo.vue',
        props: [],
        data: []
      })

      expect(mutations.state.documentScopes).toEqual({
        'file:///Foo.vue': {
          props: {},
          data: {}
        }
      })
    })

    it('adds missing properties', () => {
      const mutations = stub(ProjectMutations, {
        state: {
          documentScopes: {
            'file:///Foo.vue': {
              props: {
                test: {
                  type: 'String',
                  value: 'test'
                }
              },
              data: {
                test2: {
                  type: null,
                  value: 'test2'
                }
              }
            }
          }
        }
      })

      mutations.refreshScope({
        uri: 'file:///Foo.vue',
        props: [
          {
            name: 'test',
            type: 'String',
            default: undefined
          },
          {
            name: 'additionalProp',
            type: 'Number',
            default: 10
          }
        ],
        data: [
          {
            name: 'test2',
            default: 'initial'
          },
          {
            name: 'additionalData',
            default: true
          }
        ]
      })

      expect(mutations.state.documentScopes).toEqual({
        'file:///Foo.vue': {
          props: {
            test: {
              type: 'String',
              value: 'test'
            },
            additionalProp: {
              type: 'Number',
              value: 10
            }
          },
          data: {
            test2: {
              type: null,
              value: 'test2'
            },
            additionalData: {
              type: null,
              value: true
            }
          }
        }
      })
    })

    it('removes no longer undeclared properties', () => {
      const mutations = stub(ProjectMutations, {
        state: {
          documentScopes: {
            'file:///Foo.vue': {
              props: {
                test: {
                  type: 'String',
                  value: 'test'
                },
                additionalProp: {
                  type: 'Number',
                  value: 10
                }
              },
              data: {
                test2: {
                  type: null,
                  value: 'test2'
                },
                additionalData: {
                  type: null,
                  value: true
                }
              }
            }
          }
        }
      })

      mutations.refreshScope({
        uri: 'file:///Foo.vue',
        props: [
          {
            name: 'additionalProp',
            type: 'Number',
            default: 10
          }
        ],
        data: [
          {
            name: 'additionalData',
            default: true
          }
        ]
      })

      expect(mutations.state.documentScopes).toEqual({
        'file:///Foo.vue': {
          props: {
            additionalProp: {
              type: 'Number',
              value: 10
            }
          },
          data: {
            additionalData: {
              type: null,
              value: true
            }
          }
        }
      })
    })

    it('does nothing if there are no diffs', () => {
      const mutations = stub(ProjectMutations, {
        state: {
          documentScopes: {
            'file:///Foo.vue': {
              props: {
                test: {
                  type: 'String',
                  value: 'test'
                }
              },
              data: {
                test2: {
                  type: null,
                  value: 'test2'
                }
              }
            }
          }
        }
      })

      mutations.refreshScope({
        uri: 'file:///Foo.vue',
        props: [
          {
            name: 'test',
            type: 'String',
            default: undefined
          }
        ],
        data: [
          {
            name: 'test2',
            default: 'initial'
          }
        ]
      })

      expect(mutations.state.documentScopes).toEqual({
        'file:///Foo.vue': {
          props: {
            test: {
              type: 'String',
              value: 'test'
            }
          },
          data: {
            test2: {
              type: null,
              value: 'test2'
            }
          }
        }
      })
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
