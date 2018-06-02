<template>
  <div class="input-json">
    <div class="input-json-line">
      <!-- Object property key -->
      <span class="input-json-label">{{ name }}</span>

      <!-- Object value -->
      <span
        v-if="!editing"
        class="input-json-value"
        :class="valueType"
      >
        {{ formattedValue }}
      </span>
      <input
        v-else
        class="input-json-value editing"
        type="text"
        v-model="editingValue"
        @input="onInput"
      >

      <!-- Actions -->
      <div class="input-json-actions">
        <button
          v-if="!editing"
          type="button"
          class="input-json-button edit"
          @click="startEditing"
        >
          <BaseIcon
            class="input-json-icon"
            icon="create"
          />
        </button>

        <template
          v-else
        >
          <button
            type="button"
            class="input-json-button"
            @click="cancel"
          >
            <BaseIcon
              class="input-json-icon"
              icon="clear"
            />
          </button>

          <button
            type="button"
            class="input-json-button"
            @click="apply"
          >
            <BaseIcon
              class="input-json-icon"
              icon="done"
            />
          </button>
        </template>
      </div>
    </div>

    <!-- Children -->
    <ul v-if="children" class="input-json-children">
      <li v-for="child in children" :key="child.name">
        <InputJson
          :name="child.name"
          :value="child.value"
          @input="onInputChild(child.name, arguments[0])"
        />
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import BaseIcon from './BaseIcon.vue'

type ValueType = 'undefined' | 'primitive' | 'object' | 'array'

export default Vue.extend({
  name: 'InputJson',

  components: {
    BaseIcon
  },

  props: {
    name: {
      type: String,
      required: true
    },
    value: [Number, String, Boolean, Object, Array]
  },

  data() {
    return {
      initialValue: '',
      editingValue: '',
      editing: false
    }
  },

  computed: {
    children(): { name: string; value: any }[] | undefined {
      if (this.valueType === 'array') {
        return this.value.map((child: any, i: number) => {
          return {
            name: String(i),
            value: child
          }
        })
      }

      if (this.valueType === 'object') {
        return Object.keys(this.value).map(key => {
          return {
            name: key,
            value: this.value[key]
          }
        })
      }
    },

    valueType(): ValueType {
      if (Array.isArray(this.value)) {
        return 'array'
      }
      if (this.value === undefined) {
        return 'undefined'
      }
      if (this.value !== null && typeof this.value === 'object') {
        return 'object'
      }
      return 'primitive'
    },

    formattedValue(): string {
      switch (this.valueType) {
        case 'undefined':
          return 'undefined'
        case 'primitive':
          return JSON.stringify(this.value)
        case 'object':
          return 'Object'
        case 'array':
          return 'Array[' + this.value.length + ']'
      }
    },

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
    startEditing(): void {
      this.editingValue = this.initialValue = this.jsonValue
      this.editing = true
    },

    cancel(): void {
      this.editingValue = this.initialValue
      this.editing = false

      this.onInput()
    },

    apply(): void {
      const jsonValue = this.editingValue
      this.editingValue = this.jsonValue // Reset editing value
      this.editing = false

      try {
        const value =
          jsonValue === 'undefined' ? undefined : JSON.parse(jsonValue)

        this.$emit('change', value)
      } catch (e) {
        this.$emit('error', jsonValue)
      }
    },

    onInput(): void {
      const jsonValue = this.editingValue

      try {
        const value =
          jsonValue === 'undefined' ? undefined : JSON.parse(jsonValue)

        this.$emit('input', value)
      } catch (e) {
        // do nothing
      }
    },

    onInputChild(name: string, value: any): void {
      if (this.valueType === 'array') {
        this.$emit('input', [
          ...this.value.slice(0, Number(name)),
          value,
          ...this.value.slice(Number(name) + 1)
        ])
        return
      }

      if (this.valueType === 'object') {
        this.$emit('input', {
          ...this.value,
          [name]: value
        })
        return
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.input-json-line {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.input-json-label {
  margin-right: 0.5em;
  font-weight: bold;
  color: #058136;
}

.input-json-label::after {
  content: ':';
}

.input-json-value {
  flex: 1 0 1px;
  padding: 0;
  min-width: 0;
  border-width: 0;
  background: none;
  font-size: inherit;
  font-family: inherit;
}

.input-json-value.object,
.input-json-value.array {
  color: #aaa;
}

.input-json-value.editing {
  margin: -1px;
  border: 1px solid #058136;
  border-radius: 3px;
  background-color: #fff;
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
  color: #666;
  font-size: rem(16);
  cursor: pointer;
}

.input-json-button:first-child {
  margin-left: 0;
}

.input-json-button:hover {
  color: #058136;
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
