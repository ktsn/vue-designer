<template>
  <div class="input-json">
    <div class="input-json-line">
      <!-- Object property key -->
      <span v-if="!renamable || !editing" class="input-json-label">
        {{ field.name }}
      </span>
      <InputComposition
        v-else
        v-model="editingName"
        class="input-json-label editing"
        type="text"
        @keydown="onKeydownInput"
      />

      <!-- Object value -->
      <span v-if="!editing" :class="valueType" class="input-json-value">
        {{ formattedValue }}
      </span>
      <InputComposition
        v-else
        v-model="editingValue"
        class="input-json-value editing"
        type="text"
        @keydown="onKeydownInput"
      />

      <!-- Actions -->
      <div class="input-json-actions">
        <button
          v-if="!editing"
          type="button"
          class="input-json-button edit"
          aria-label="Edit"
          @click="startEditing"
        >
          <BaseIcon class="input-json-icon" icon="create" />
        </button>

        <template v-else>
          <button
            type="button"
            class="input-json-button"
            aria-label="Cancel"
            @click="cancel"
          >
            <BaseIcon class="input-json-icon" icon="clear" />
          </button>

          <button
            type="button"
            class="input-json-button"
            aria-label="Apply"
            @click="apply"
          >
            <BaseIcon class="input-json-icon" icon="done" />
          </button>
        </template>
      </div>
    </div>

    <!-- Children -->
    <ul v-if="children" class="input-json-children">
      <li v-for="child in children" :key="child.name">
        <InputJson
          :renamable="valueType === 'object'"
          :field="child"
          @change="onChangeChild(arguments[0], child.name)"
        />
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import BaseIcon from './BaseIcon.vue'
import InputComposition from './InputComposition.vue'
import { clone } from '../../utils'

type ValueType =
  | 'undefined'
  | 'null'
  | 'boolean'
  | 'number'
  | 'string'
  | 'object'
  | 'array'
  | 'unknown'

interface JsonField {
  name: string
  value: any
}

export default Vue.extend({
  name: 'InputJson',

  components: {
    BaseIcon,
    InputComposition,
  },

  props: {
    field: {
      type: Object as () => JsonField,
      required: true,
      validator: (p: any) => {
        return typeof p.name === 'string' && 'value' in p
      },
    },

    renamable: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      editingName: '',
      editingValue: '',
      editing: false,
    }
  },

  computed: {
    children(): JsonField[] | undefined {
      const { value } = this.field

      if (this.valueType === 'array') {
        return value.map((child: any, i: number) => {
          return {
            name: String(i),
            value: child,
          }
        })
      }

      if (this.valueType === 'object') {
        return Object.keys(value).map((key) => {
          return {
            name: key,
            value: value[key],
          }
        })
      }

      return undefined
    },

    valueType(): ValueType {
      const { value } = this.field
      const type = typeof value

      if (value === undefined) {
        return 'undefined'
      }
      if (value === null) {
        return 'null'
      }
      if (Array.isArray(value)) {
        return 'array'
      }

      if (
        type === 'object' ||
        type === 'string' ||
        type === 'boolean' ||
        type === 'number'
      ) {
        return type
      } else {
        return 'unknown'
      }
    },

    isEditingNameValid(): boolean {
      return this.editingName !== ''
    },

    formattedValue(): string {
      const { value } = this.field

      switch (this.valueType) {
        case 'undefined':
          return 'undefined'
        case 'null':
        case 'string':
        case 'boolean':
        case 'number':
          return JSON.stringify(value)
        case 'object':
          return 'Object'
        case 'array':
          return 'Array[' + value.length + ']'
        default:
          return String(value)
      }
    },

    jsonValue(): string {
      const { value } = this.field

      try {
        return value === undefined ? 'undefined' : JSON.stringify(value)
      } catch (e) {
        return 'undefined'
      }
    },
  },

  methods: {
    startEditing(): void {
      this.editingValue = this.jsonValue
      this.editingName = this.field.name
      this.editing = true
    },

    cancel(): void {
      this.editing = false
    },

    apply(): void {
      this.editing = false
      this.onChange()
    },

    onKeydownInput(_: string, event: KeyboardEvent): void {
      switch (event.key) {
        case 'Enter':
          this.apply()
          break
        case 'Escape':
          this.cancel()
          break
        default:
      }
    },

    onChange(): void {
      if (!this.isEditingNameValid) return

      const { editingName: name, editingValue: jsonValue } = this

      try {
        const value =
          jsonValue === 'undefined' ? undefined : JSON.parse(jsonValue)

        this.$emit('change', { name, value })
      } catch (e) {
        // do nothing
      }
    },

    onChangeChild(child: JsonField, oldChildName: string): void {
      const { name, value } = this.field

      if (this.valueType === 'array') {
        const index = Number(child.name)
        const newValue = [
          ...value.slice(0, index),
          child.value,
          ...value.slice(index + 1),
        ]

        this.$emit('change', {
          name,
          value: newValue,
        })
        return
      }

      if (this.valueType === 'object') {
        const newValue = clone(value)

        if (child.name !== oldChildName) {
          delete newValue[oldChildName]
        }

        newValue[child.name] = child.value

        this.$emit('change', {
          name,
          value: newValue,
        })
      }
    },
  },
})
</script>

<style scoped>
.input-json-line {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.input-json-label {
  margin-right: 0.5em;
  font-weight: bold;
  color: var(--vd-color-accent);
}

.input-json-label::after {
  content: ':';
}

.input-json-value {
  flex: 1 0 1px;
}

.input-json-value.object,
.input-json-value.array {
  color: var(--vd-color-text-weakest);
}

.input-json-value.number {
  color: var(--vd-color-number);
}

.input-json-value.string {
  color: var(--vd-color-string);
}

.input-json-value.boolean {
  color: var(--vd-color-boolean);
}

.input-json-value.null,
.input-json-value.undefined {
  color: var(--vd-color-text-weak);
}

.input-json-label.editing,
.input-json-value.editing {
  flex: 1 1 1px;
  margin-top: -1px;
  margin-bottom: -1px;
  padding: 0;
  min-width: 0;
  border: 1px solid var(--vd-color-accent);
  border-radius: 3px;
  background-color: #fff;
  font-size: inherit;
  font-family: inherit;
  outline: none;
}

.input-json-actions {
  display: flex;
  align-items: center;
  margin-left: 0.5em;
  white-space: nowrap;
}

.input-json-button {
  margin-left: 0.3em;
  padding: 0;
  border-width: 0;
  background: none;
  color: var(--vd-color-text-weak);
  font-size: var(--vd-font-size);
  cursor: pointer;
}

.input-json-button:first-child {
  margin-left: 0;
}

.input-json-button:hover {
  color: var(--vd-color-accent);
}

.input-json-button.edit {
  display: none;
}

.input-json-line:hover .input-json-button.edit {
  display: inline;
}

.input-json-children {
  padding-left: 24px;
  list-style: none;
}
</style>
