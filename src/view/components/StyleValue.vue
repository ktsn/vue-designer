<template>
  <button
    v-if="!editing"
    class="style-value"
    @click="startEdit"
    @focus="startEdit"
  >{{ value }}</button>
  <div
    v-else
    class="style-value editing"
    contenteditable="true"
    ref="input"
    @input="input"
    @keypress.enter="endEdit"
    @blur="endEdit"
  ></div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'StyleValue',

  props: {
    value: {
      type: String,
      required: true
    }
  },

  data() {
    return {
      editing: false
    }
  },

  watch: {
    value(newValue: string): void {
      const input = this.$refs.input as HTMLDivElement | undefined
      if (input && newValue !== input.textContent) {
        input.textContent = newValue
      }
    }
  },

  methods: {
    startEdit(): void {
      this.editing = true
      this.$nextTick(() => {
        const input = this.$refs.input as HTMLDivElement
        input.textContent = this.value
        input.focus()
      })
    },

    endEdit(): void {
      this.editing = false
    },

    input(event: Event): void {
      const el = event.target as HTMLDivElement
      this.$emit('input', el.textContent)
    }
  }
})
</script>

<style lang="scss" scoped>
.style-value {
  display: inline;
  padding: 0;
  border-width: 0;
  background: none;
  font-family: inherit;
  font-size: inherit;
}

.style-value.editing {
  margin: -1px;
  border: 1px solid #aaa;
  background-color: #fff;
  outline: none;
}
</style>
