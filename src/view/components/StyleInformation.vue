<template>
  <ul class="style-information">
    <li class="rule" v-for="rule in rules" :key="rule.path.join('.')">
      <p class="selector-list">
        <span class="selector" v-for="s in rule.selectors" :key="s">{{ s }}</span>
      </p>

      <ul class="declaration-list">
        <li class="declaration" v-for="d in rule.declarations" :key="d.path.join('.')">
          <span class="declaration-prop"><span class="declaration-prop-text">{{ d.prop }}</span></span>
          <span class="declaration-value">{{ d.value }}</span>
          <span v-if="d.important" class="declaration-important">!important</span>
        </li>
      </ul>
    </li>
  </ul>
</template>

<script lang="ts">
import Vue from 'vue'
import { RuleForPrint } from '@/parser/style'

export default Vue.extend({
  name: 'StyleInformation',

  props: {
    rules: {
      type: Array as () => RuleForPrint[],
      required: true
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
