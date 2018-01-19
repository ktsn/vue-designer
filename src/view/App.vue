<template>
  <PageMain />
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
@import '~k-css/k.css';

body {
  font-size: 1.6rem;
  color: #333;
}
</style>
