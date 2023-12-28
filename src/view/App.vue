<template>
  <PageMain />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import PageMain from './components/PageMain.vue'

export default defineComponent({
  name: 'App',

  components: {
    PageMain,
  },
})
</script>
