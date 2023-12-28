<template>
  <div class="style-declaration">
    <span class="style-declaration-prop">
      <StyleValue
        :auto-focus="autoFocus === 'prop'"
        :value="prop"
        class="style-declaration-prop-text"
        @input-start="$emit('input-start:prop')"
        @input="inputProp"
        @input-end="finishInputProp"
      />
    </span>
    <span class="style-declaration-value">
      <StyleValue
        :auto-focus="autoFocus === 'value'"
        :value="value"
        @input-start="$emit('input-start:value')"
        @input="inputValue"
        @input-end="finishInputValue"
      />
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import StyleValue from './StyleValue.vue'

export default defineComponent({
  name: 'StyleDeclaration',

  components: {
    StyleValue,
  },

  props: {
    prop: {
      type: String,
      required: true,
    },

    value: {
      type: String,
      required: true,
    },

    autoFocus: {
      type: String,
      default: null,
      validator(value: string) {
        return value === 'prop' || value === 'value'
      },
    },
  },

  methods: {
    inputProp(prop: string): void {
      this.$emit('update:prop', prop)
    },

    inputValue(value: string): void {
      this.$emit('update:value', value)
    },

    finishInputProp(
      rawProp: string,
      meta: { reason: string; shiftKey: boolean },
    ): void {
      this.$emit('input-end:prop', meta)

      const prop = rawProp.trim()
      if (!prop) {
        this.$emit('remove')
      } else {
        this.inputProp(prop)
      }
    },

    finishInputValue(
      rawValue: string,
      meta: { reason: string; shiftKey: boolean },
    ): void {
      this.$emit('input-end:value', meta)

      const value = rawValue.trim()
      if (!value) {
        this.$emit('remove')
      } else {
        this.inputValue(value)
      }
    },
  },
})
</script>

<style scoped>
.style-declaration-prop::after {
  content: ':';
  margin-right: 0.3em;
}

.style-declaration-value::after {
  content: ';';
}

.style-declaration-prop-text {
  color: var(--vd-color-accent);
}
</style>
