<template>
  <input
    v-bind="attrs"
    :value="value"
    @input="$emit('update:value', ($event.target as HTMLInputElement).value)"
    @compositionstart="compositing = true"
    @compositionend="compositing = false"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapValues } from '../../utils'

export default defineComponent({
  name: 'InputComposition',
  inheritAttrs: false,

  props: {
    value: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      compositing: false,
    }
  },

  computed: {
    attrs(): Record<string, unknown> {
      const convert = (value: unknown, key: string): unknown => {
        if (!/^on[A-Z1-9]/.test(key)) {
          return value
        }

        if (!Array.isArray(value)) {
          return convert([value], key)
        }

        return value.map((f) => {
          return (event: Event) => {
            const isKeyEvent = /^key/.test(event.type)
            if (isKeyEvent && this.compositing) {
              return
            }

            const value = (event.target as HTMLInputElement).value
            f(value, event)
          }
        })
      }

      return mapValues(this.$attrs, convert)
    },
  },
})
</script>
