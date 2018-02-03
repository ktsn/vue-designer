<template>
  <Node :data="data" :scope="scope" :selected="selected" @select="select" />
</template>

<script lang="ts">
import Vue from 'vue'
import Node from './Node.vue'
import { Element } from '@/parser/template'
import { DefaultValue } from '@/parser/script'
import { projectHelpers } from '../store/modules/project'

export default Vue.extend({
  name: 'ContainerNode',

  beforeCreate() {
    this.$options.components!.Node = Node
  },

  props: {
    data: {
      type: Object as { (): Element },
      required: true
    },

    scope: {
      type: Object as { (): Record<string, DefaultValue> },
      required: true
    }
  },

  computed: {
    ...projectHelpers.mapState(['selectedPath']),

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
