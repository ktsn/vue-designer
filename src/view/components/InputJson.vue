<template>
  <input class="input-json" type="text" :value="jsonValue" @change="onChange">
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'InputJson',

  props: {
    value: [Number, String, Boolean, Object, Array]
  },

  computed: {
    jsonValue(): string {
      try {
        return this.value === undefined
          ? 'undefined'
          : JSON.stringify(this.value)
      } catch (e) {
        return 'undefined'
      }
    }
  },

  methods: {
    onChange(event: Event) {
      const input = event.target as HTMLInputElement
      const jsonValue = input.value

      try {
        const value =
          jsonValue === 'undefined' ? undefined : JSON.parse(jsonValue)

        this.$emit('change', value)
      } catch (e) {
        input.value = this.jsonValue
        this.$emit('error', jsonValue)
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.input-json {
  padding: 0;
  border-width: 0;
  background: none;
  font-size: inherit;
  font-family: inherit;
}
</style>
