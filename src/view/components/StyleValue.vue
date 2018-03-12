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
  >{{ value }}</div>
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

  methods: {
    startEdit() {
      this.editing = true
      this.$nextTick(() => {
        ;(this.$refs.input as HTMLDivElement).focus()
      })
    },

    endEdit() {
      this.editing = false
    },

    input(event: Event) {
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
