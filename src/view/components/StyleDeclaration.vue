<template>
  <div class="style-declaration">
    <span class="style-declaration-prop"><StyleValue
      class="style-declaration-prop-text"
      :auto-focus="autoFocusProp"
      :value="prop"
      @input="inputProp"
      @input-end="finishInputProp"
    /></span>
    <span class="style-declaration-value"><StyleValue
      :value="value"
      @input="inputValue"
      @input-end="finishInputValue"
    /></span>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import StyleValue from './StyleValue.vue'

export default Vue.extend({
  name: 'StyleDeclaration',

  components: {
    StyleValue
  },

  props: {
    prop: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    },
    autoFocusProp: Boolean
  },

  methods: {
    inputProp(prop: string): void {
      this.$emit('update:prop', prop)
    },

    inputValue(value: string): void {
      this.$emit('update:value', value)
    },

    finishInputProp(rawProp: string): void {
      const prop = rawProp.trim()
      if (!prop) {
        this.$emit('remove')
      } else {
        this.inputProp(prop)
      }
    },

    finishInputValue(rawValue: string): void {
      const value = rawValue.trim()
      if (!value) {
        this.$emit('remove')
      } else {
        this.inputValue(value)
      }
    }
  }
})
</script>


<style lang="scss" scoped>
.style-declaration-prop::after {
  content: ':';
}

.style-declaration-value::after {
  content: ';';
}

.style-declaration-prop-text {
  color: #24b600;
}
</style>
