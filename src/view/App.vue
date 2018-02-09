<template>
  <div class="app">
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

<style lang="scss">
body {
  padding: 0;
  margin: 0;
}
</style>

<style lang="scss" scoped>
.app {
  font-size: rem(16);
  color: #333;
}
</style>
