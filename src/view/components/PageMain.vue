<template>
  <div>
    <Renderer :template="template" :styles="styles" :props="props" :data="data" />
    <div class="information-pane">
      <ScopeInformation :props="props" :data="data" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Renderer from './Renderer.vue'
import ScopeInformation from './ScopeInformation.vue'
import { Template } from '../../parser/template'
import { Prop, Data } from '../../parser/script'
import { ClientConnection } from '../communication'
import { Document } from '../document'

export default Vue.extend({
  name: 'PageMain',

  components: {
    Renderer,
    ScopeInformation
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
