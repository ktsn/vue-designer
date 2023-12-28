<!-- See also: view/load-icons.ts -->
<template>
  <svg class="base-icon"><use :href="'#ic_' + icon + '_24px'" /></svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'BaseIcon',

  props: {
    icon: {
      type: String,
      required: true,
    },
  },
})
</script>

<style scoped>
.base-icon {
  display: inline-block;
  height: 1em;
  width: 1em;
  fill: currentColor;
}
</style>
