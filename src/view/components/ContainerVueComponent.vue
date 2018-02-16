<template>
  <VueComponent
    v-if="document"
    :template="document.template"
    :props="document.props"
    :data="document.data"
    :child-components="document.childComponents"
    :styles="document.styleCode"
  />
</template>

<script lang="ts">
import Vue from 'vue'
import VueComponent from './VueComponent.vue'
import { ScopedDocument, projectHelpers } from '../store/modules/project'

export default Vue.extend({
  name: 'ContainerVueComponent',

  beforeCreate() {
    this.$options.components!.VueComponent = VueComponent
  },

  props: {
    uri: {
      type: String,
      required: true
    }
  },

  computed: {
    ...projectHelpers.mapGetters({
      documents: 'scopedDocuments'
    }),

    document(): ScopedDocument | undefined {
      return this.documents[this.uri]
    }
  }
})
</script>
