<template>
  <div>
    <Renderer :template="template" :styles="styles" />
    <Information :props="props" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Template } from '../parser/template'
import { Prop } from '../parser/script'
import Renderer from './components/Renderer.vue'
import Information from './components/Information.vue'
import { ClientConnection } from './communication'
import { Document } from './document'

export default Vue.extend({
  name: 'App',

  components: {
    Renderer,
    Information
  },

  data() {
    return {
      template: null as Template | null,
      props: [] as Prop[],
      styles: [] as string[]
    }
  },

  mounted() {
    const connection = new ClientConnection()
    connection.connect(location.port)
    const document = new Document(connection)
    document.subscribe((template, props, styles) => {
      this.template = template
      this.props = props
      this.styles = styles
    })
  }
})
</script>

<style lang="scss">
@import './themes/reset';
</style>
