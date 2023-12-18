<template>
  <input
    v-bind="$attrs"
    :value="value"
    v-on="listeners"
    @compositionstart="compositing = true"
    @compositionend="compositing = false"
  />
</template>

<script lang="ts">
import Vue from 'vue'
import { mapValues } from '@/utils'

export default Vue.extend({
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
    listeners(): Record<string, ((event: Event) => void)[]> {
      const convert = (
        fn: Function | Function[]
      ): ((event: Event) => void)[] => {
        if (!Array.isArray(fn)) {
          return convert([fn])
        }

        return fn.map((f) => {
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

      return mapValues(this.$listeners, convert)
    },
  },
})
</script>
