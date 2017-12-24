<template>
  <Renderer :template="template" :styles="styles" />
</template>

<script lang="ts">
import Vue from 'vue'
import { Template } from '../parser/template'
import Renderer from './components/Renderer.vue'
import { ClientConnection } from './communication'
import { Document } from './document'

export default Vue.extend({
  name: 'App',

  components: {
    Renderer
  },

  data() {
    return {
      template: null as Template | null,
      styles: [] as string[]
    }
  },

  mounted() {
    const connection = new ClientConnection()
    connection.connect(location.port)
    const document = new Document(connection)
    document.subscribe((template, styles) => {
      this.template = template
      this.styles = styles
    })
  }
})
</script>
