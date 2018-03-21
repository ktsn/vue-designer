<template>
  <ul class="style-information">
    <li
      class="rule"
      v-for="rule in rules"
      :key="rule.path.join('.')"
      @click="onClickRule(rule)"
    >
      <p class="selector-list">
        <span class="selector" v-for="s in rule.selectors" :key="s">{{ s }}</span>
      </p>

      <ul class="declaration-list" @click.stop>
        <li class="declaration" v-for="d in rule.declarations" :key="d.path.join('.')">
          <span class="declaration-prop"><StyleValue
            class="declaration-prop-text"
            :value="d.prop"
            @input="inputStyleProp(d.path, arguments[0])"
            @input-end="finishInputStyleProp(d.path, arguments[0])"
          /></span>
          <span class="declaration-value"><StyleValue
            :value="d.value"
            @input="inputStyleValue(d.path, arguments[0])"
            @input-end="finishInputStyleValue(d.path, arguments[0])"
          /></span>
        </li>
      </ul>
    </li>
  </ul>
</template>

<script lang="ts">
import Vue from 'vue'
import StyleValue from './StyleValue.vue'
import { RuleForPrint } from '@/parser/style/types'

export default Vue.extend({
  name: 'StyleInformation',

  components: {
    StyleValue
  },

  props: {
    rules: {
      type: Array as () => RuleForPrint[],
      required: true
    }
  },

  methods: {
    inputStyleProp(path: number[], prop: string): void {
      this.$emit('update-declaration', {
        path,
        prop
      })
    },

    inputStyleValue(path: number[], value: string): void {
      this.$emit('update-declaration', {
        path,
        value
      })
    },

    finishInputStyleProp(path: number[], rawProp: string): void {
      const prop = rawProp.trim()
      if (!prop) {
        this.$emit('remove-declaration', {
          path
        })
      } else {
        this.inputStyleProp(path, prop)
      }
    },

    finishInputStyleValue(path: number[], rawValue: string): void {
      const value = rawValue.trim()
      if (!value) {
        this.$emit('remove-declaration', {
          path
        })
      } else {
        this.inputStyleValue(path, value)
      }
    },

    onClickRule(rule: RuleForPrint): void {
      this.$emit('add-declaration', {
        path: rule.path.concat(rule.declarations.length)
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.style-information,
.declaration-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.rule:not(:first-child) {
  margin-top: 13px;
  padding-top: 10px;
  border-top: 1px solid #dfdfdf;
}

.rule::after {
  content: '}';
}

.selector-list {
  margin: 0;
}

.selector-list::after {
  content: ' {';
}

.selector:not(:first-child)::before {
  content: ', ';
}

.declaration-list {
  padding-left: 1em;
}

.declaration-prop::after {
  content: ':';
}

.declaration-value::after {
  content: ';';
}

.declaration-prop-text {
  color: #24b600;
}
</style>
