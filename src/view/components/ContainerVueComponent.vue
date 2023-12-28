<script lang="ts">
import { Comment, defineComponent, h, VNode } from 'vue'
import VueComponent from './VueComponent.vue'
import { ScopedDocument, DocumentScope } from '../store/modules/project/types'
import { mapper } from '../store'

const projectMapper = mapper.module('project')

export default defineComponent({
  name: 'ContainerVueComponent',

  props: {
    uri: {
      type: String,
      required: true,
    },

    propsData: {
      type: Object as () => Record<string, any>,
      required: true,
    },
  },

  computed: {
    ...projectMapper.mapState({
      scopes: 'documentScopes',
    }),

    ...projectMapper.mapGetters({
      documents: 'scopedDocuments',
    }),

    document(): ScopedDocument | undefined {
      return this.documents[this.uri]
    },

    scope(): DocumentScope | undefined {
      return this.scopes[this.uri]
    },
  },

  render(): VNode {
    if (!this.document) return h(Comment)

    return h(
      VueComponent,
      {
        uri: this.uri,
        template: this.document.template,
        scope: this.scope,
        childComponents: this.document.childComponents,
        styles: this.document.styleCode,
        propsData: this.propsData,
      },
      this.$slots
    )
  },
})
</script>
