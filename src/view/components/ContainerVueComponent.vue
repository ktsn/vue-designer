<template>
  <VueComponent
    v-if="document"
    :uri="uri"
    :template="document.template"
    :scope="scope"
    :child-components="document.childComponents"
    :styles="document.styleCode"
    :props-data="propsData"
  />
</template>

<script lang="ts">
import Vue from 'vue'
import VueComponent from './VueComponent.vue'
import { ScopedDocument, DocumentScope } from '../store/modules/project/types'
import { mapper } from '../store'

const projectMapper = mapper.module('project')

export default Vue.extend({
  name: 'ContainerVueComponent',

  beforeCreate() {
    this.$options.components!.VueComponent = VueComponent
  },

  props: {
    uri: {
      type: String,
      required: true
    },

    propsData: {
      type: Object as () => Record<string, any>,
      required: true
    }
  },

  computed: {
    ...projectMapper.mapState({
      scopes: 'documentScopes'
    }),

    ...projectMapper.mapGetters({
      documents: 'scopedDocuments'
    }),

    document(): ScopedDocument | undefined {
      return this.documents[this.uri]
    },

    scope(): DocumentScope | undefined {
      return this.scopes[this.uri]
    }
  }
})
</script>
