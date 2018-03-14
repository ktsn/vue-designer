<template>
  <ul class="style-information">
    <li class="rule" v-for="rule in rules" :key="rule.path.join('.')">
      <p class="selector-list">
        <span class="selector" v-for="s in rule.selectors" :key="s">{{ s }}</span>
      </p>

      <ul class="declaration-list">
        <li class="declaration" v-for="d in rule.declarations" :key="d.path.join('.')">
          <span class="declaration-prop"><StyleValue
            class="declaration-prop-text"
            :value="d.prop"
            @input="inputStyleProp(d.path, arguments[0])"
          /></span>
          <StyleValue
            :value="getStyleValue(d)"
            @input="inputStyleValue(d.path, arguments[0])"
          />
        </li>
      </ul>
    </li>
  </ul>
</template>

<script lang="ts">
import Vue from 'vue'
import StyleValue from './StyleValue.vue'
import { RuleForPrint, Declaration } from '@/parser/style/types'

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

    getStyleValue(declaration: Declaration): string {
      const important = declaration.important ? ' !important' : ''
      return declaration.value + important
    },

    inputStyleValue(path: number[], value: string): void {
      const match = /^\s*(.*)\s+!important\s*$/.exec(value)
      if (match) {
        this.$emit('update-declaration', {
          path,
          value: match[1],
          important: true
        })
      } else {
        this.$emit('update-declaration', {
          path,
          value: value.trim(),
          important: false
        })
      }
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

.declaration-prop-text {
  color: #24b600;
}
</style>
