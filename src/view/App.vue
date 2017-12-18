<template>
  <Renderer :node="node" />
</template>

<script lang="ts">
import Vue from 'vue'
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
      node: {}
    }
  },

  mounted() {
    const connection = new ClientConnection()
    connection.connect(location.port)
    const document = new Document(connection)
    document.subscribe(doc => {
      this.node = doc
    })
  }
})
</script>
