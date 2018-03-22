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
          <StyleDeclaration
            :prop="d.prop"
            :value="d.value"
            :auto-focus-prop="autoFocusOnNextRender"
            @update:prop="updateDeclarationProp(d.path, arguments[0])"
            @update:value="updateDeclarationValue(d.path, arguments[0])"
            @remove="removeDeclaration(d.path)"
          />
        </li>
      </ul>
    </li>
  </ul>
</template>

<script lang="ts">
import Vue from 'vue'
import StyleValue from './StyleValue.vue'
import StyleDeclaration from './StyleDeclaration.vue'
import { RuleForPrint } from '@/parser/style/types'

export default Vue.extend({
  name: 'StyleInformation',

  components: {
    StyleValue,
    StyleDeclaration
  },

  props: {
    rules: {
      type: Array as () => RuleForPrint[],
      required: true
    }
  },

  data() {
    return {
      autoFocusOnNextRender: false
    }
  },

  methods: {
    updateDeclarationProp(path: number[], prop: string): void {
      this.$emit('update-declaration', {
        path,
        prop
      })
    },

    updateDeclarationValue(path: number[], value: string): void {
      this.$emit('update-declaration', {
        path,
        value
      })
    },

    removeDeclaration(path: number[]): void {
      this.$emit('remove-declaration', { path })
    },

    onClickRule(rule: RuleForPrint): void {
      this.$emit('add-declaration', {
        path: rule.path.concat(rule.declarations.length)
      })
      this.autoFocusOnNextRender = true
    }
  },

  watch: {
    rules(): void {
      this.$nextTick(() => {
        this.autoFocusOnNextRender = false
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
</style>
