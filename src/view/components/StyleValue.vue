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
    @keypress.prevent.enter="endEdit"
    @blur="endEdit"
  ></div>
</template>

<script lang="ts">
import Vue from 'vue'
import { selectNodeContents } from '@/view/editing'

export default Vue.extend({
  name: 'StyleValue',

  props: {
    value: {
      type: String,
      required: true
    },

    autoFocus: Boolean
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
        const input = this.$refs.input as HTMLDivElement | undefined
        if (input) {
          input.textContent = this.value
          selectNodeContents(input)
          this.$emit('input-start')
        }
      })
    },

    endEdit(event: Event): void {
      if (this.editing) {
        this.editing = false

        const el = event.currentTarget as HTMLDivElement
        this.$emit('input-end', el.textContent)
      }
    },

    input(event: Event): void {
      const el = event.currentTarget as HTMLDivElement
      this.$emit('input', el.textContent)
    }
  },

  mounted() {
    if (this.autoFocus) {
      this.startEdit()
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
