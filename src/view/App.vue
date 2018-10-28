<template>
  <div id="app">
    <PageMain />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import PageMain from './components/PageMain.vue'

export default Vue.extend({
  name: 'App',

  components: {
    PageMain
  }
})
</script>
