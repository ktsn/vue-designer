<template>
  <button
    v-if="!editing"
    class="style-value"
    @click="startEdit"
    @focus="startEdit"
  >
    {{ value }}
  </button>
  <div
    v-else
    ref="input"
    class="style-value editing"
    contenteditable="true"
    @input="input"
    @keydown="onKeyDown"
    @blur="endEdit($event, 'blur')"
  />
</template>

<script lang="ts">
import Vue from 'vue'
import {
  selectNodeContents,
  updateStyleValue,
  getTextOffset,
} from '@/view/ui-logic/editing'

export default Vue.extend({
  name: 'StyleValue',

  props: {
    value: {
      type: String,
      required: true,
    },

    autoFocus: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      editing: false,
    }
  },

  watch: {
    value(newValue: string): void {
      const input = this.$refs.input as HTMLDivElement | undefined
      if (input && newValue !== input.textContent) {
        input.textContent = newValue
      }
    },

    autoFocus: {
      handler(value: boolean): void {
        if (value) {
          this.startEdit()
        }
      },
      immediate: true,
    },
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

    endEdit(event: Event, reason: 'blur' | 'enter' | 'tab'): void {
      if (this.editing) {
        this.editing = false

        const el = event.currentTarget as HTMLDivElement
        const anyEvent: any = event

        this.$emit('input-end', el.textContent, {
          reason,
          shiftKey: !!anyEvent.shiftKey,
        })
      }
    },

    input(event: Event): void {
      const el = event.currentTarget as HTMLDivElement
      this.$emit('input', el.textContent)
    },

    update(offset: number): void {
      const start = this.getSelectionStartOffset()
      if (start === undefined) {
        return
      }

      const { value, range } = updateStyleValue(this.value, start, offset)

      if (!range) {
        return
      }

      this.$emit('input', value)

      this.$el.textContent = value
      this.selectTextRange(range[0], range[1])
    },

    getSelectionStartOffset(): number | undefined {
      const selection = window.getSelection()
      if (!selection) {
        return undefined
      }

      for (let i = 0; i < selection.rangeCount; i++) {
        const range = selection.getRangeAt(i)
        if (this.$el.contains(range.startContainer)) {
          // Ensure the $el only one text node
          return getTextOffset(range.startContainer, range.startOffset)
        }
      }
      return undefined
    },

    selectTextRange(start: number, end: number): void {
      const selection = window.getSelection()
      if (!selection) {
        return
      }

      selection.removeAllRanges()

      // Ensure the $el can be only one text node
      const text = this.$el.childNodes[0]
      if (!text) {
        return
      }

      const range = new Range()
      range.setStart(text, start)
      range.setEnd(text, end)

      selection.removeAllRanges()
      selection.addRange(range)
    },

    onKeyDown(event: KeyboardEvent): void {
      switch (event.key) {
        case 'Enter':
          event.preventDefault()
          this.endEdit(event, 'enter')
          break
        case 'Tab':
          event.preventDefault()
          this.endEdit(event, 'tab')
          break
        case 'Up':
        case 'ArrowUp':
          event.preventDefault()
          this.update(1)
          break
        case 'Down':
        case 'ArrowDown':
          event.preventDefault()
          this.update(-1)
          break
        default:
        // Nothing
      }
    },
  },
})
</script>

<style scoped>
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
  border: 1px solid var(--vd-border-color);
  background-color: #fff;
  outline: none;
}
</style>
