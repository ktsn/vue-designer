<template>
  <div>
    <Renderer :template="template" :styles="styles" />
    <Information :props="props" :data="data" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Template } from '../parser/template'
import { Prop, Data } from '../parser/script'
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
      template: undefined as Template | undefined,
      props: [] as Prop[],
      data: [] as Data[],
      styles: [] as string[]
    }
  },

  mounted() {
    const connection = new ClientConnection()
    connection.connect(location.port)
    const document = new Document(connection)
    document.subscribe(({ template, props, data, styles }) => {
      this.template = template
      this.props = props
      this.data = data
      this.styles = styles
    })
  }
})
</script>

<style lang="scss">
@import '~k-css/k.css';

body {
  font-size: 1.6rem;
}
</style>
