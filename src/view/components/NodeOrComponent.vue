<template>
  <ContainerVueComponent
    v-if="componentUri"
    :uri="componentUri"
    v-on="$listeners"
  />
  <ContainerNode
    v-else
    v-bind="$props"
    v-on="$listeners"
  />
</template>

<script lang="ts">
import Vue from 'vue'
import ContainerNode from './ContainerNode.vue'
import ContainerVueComponent from './ContainerVueComponent.vue'
import { Element } from '@/parser/template'
import { DefaultValue, ChildComponent } from '@/parser/script'
import { projectHelpers } from '../store/modules/project'

export default Vue.extend({
  name: 'NodeOrComponent',

  beforeCreate() {
    this.$options.components!.ContainerNode = ContainerNode
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
    ...projectHelpers.mapGetters({
      documents: 'scopedDocuments'
    }),

    componentUri(): string | undefined {
      const comp = this.childComponents.find(child => {
        // Convert to lower case since vue-eslint-parser ignores tag name case.
        return child.name.toLowerCase() === this.data.name.toLowerCase()
      })
      return comp && comp.uri
    }
  }
})
</script>
