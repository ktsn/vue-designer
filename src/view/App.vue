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

<style>
body {
  padding: 0;
  margin: 0;
  background-color: #ddd;
}
</style>

<style scoped>
#app {
  font-family: sans-serif;
  font-size: var(--vd-font-size);
  color: var(--vd-text-color);
}
</style>
