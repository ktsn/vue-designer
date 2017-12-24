<template>
  <div>
    {{ props }}
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Information',

  props: {
    props: {
      type: Array,
      required: true
    }
  }
})
</script>
