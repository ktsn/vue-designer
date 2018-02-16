<template>
  <ContainerVueComponent
    v-if="componentUri"
    :uri="componentUri"
  />
  <Node
    v-else
    v-bind="$props"
    :selected="selected"
    @select="select"
  />
</template>

<script lang="ts">
import Vue from 'vue'
import Node from './Node.vue'
import ContainerVueComponent from './ContainerVueComponent.vue'
import { Element } from '@/parser/template'
import { DefaultValue, ChildComponent } from '@/parser/script'
import { projectHelpers } from '../store/modules/project'

export default Vue.extend({
  name: 'ContainerNode',

  beforeCreate() {
    this.$options.components!.Node = Node
    this.$options.components!.ContainerVueComponent = ContainerVueComponent
  },

  props: {
    data: {
      type: Object as { (): Element },
      required: true
    },

    scope: {
      type: Object as { (): Record<string, DefaultValue> },
      required: true
    },

    childComponents: {
      type: Array as { (): ChildComponent[] },
      required: true
    }
  },

  computed: {
    ...projectHelpers.mapState(['selectedPath']),
    ...projectHelpers.mapGetters({
      documents: 'scopedDocuments'
    }),

    componentUri(): string | undefined {
      const comp = this.childComponents.find(child => {
        // Convert to lower case since vue-eslint-parser ignores tag name case.
        return child.name.toLowerCase() === this.data.name.toLowerCase()
      })
      return comp && comp.uri
    },

    selected(): boolean {
      const path = this.data.path

      if (path.length !== this.selectedPath.length) {
        return false
      }

      return path.reduce((acc, p, i) => {
        return acc && p === this.selectedPath[i]
      }, true)
    }
  },

  methods: projectHelpers.mapActions(['select'])
})
</script>
