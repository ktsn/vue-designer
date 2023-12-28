<template>
  <VueNode
    v-bind="$props"
    :selectable="currentUri === uri"
    :selected="selected"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import VueNode from './VueNode.vue'
import { TEElement } from '../../parser/template/types'
import { DefaultValue, ChildComponent } from '../../parser/script/types'
import { mapper } from '../store'

const projectMapper = mapper.module('project')

export default defineComponent({
  name: 'ContainerVueNode',

  props: {
    uri: {
      type: String,
      required: true,
    },

    data: {
      type: Object as { (): TEElement },
      required: true,
    },

    scope: {
      type: Object as { (): Record<string, DefaultValue> },
      required: true,
    },

    childComponents: {
      type: Array as { (): ChildComponent[] },
      required: true,
    },

    slots: {
      type: Object as { (): Record<string, any> },
      required: true,
    },
  },

  computed: {
    ...projectMapper.mapState(['selectedPath', 'currentUri']),

    selected(): boolean {
      const path = this.data.path

      if (path.length !== this.selectedPath.length) {
        return false
      }

      return path.reduce((acc, p, i) => {
        return acc && p === this.selectedPath[i]
      }, true)
    },
  },

  beforeCreate() {
    this.$options.components ??= {}
    this.$options.components.VueNode = VueNode
  },
})
</script>
