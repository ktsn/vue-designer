<template>
  <ul class="style-information">
    <li
      v-for="rule in rules"
      :key="rule.path.join('.')"
      class="rule"
      @click="onClickRule(rule)"
    >
      <p class="selector-list">
        <span
          v-for="s in rule.selectors"
          :key="s"
          class="selector"
        >{{ s }}</span>
      </p>

      <ul
        class="declaration-list"
        @click.stop
      >
        <li
          v-for="d in rule.children"
          :key="d.path.join('.')"
          class="declaration"
        >
          <StyleDeclaration
            :prop="d.prop"
            :value="d.value"
            :auto-focus-prop="autoFocusOnNextRender"
            @update:prop="updateDeclarationProp(d.path, arguments[0])"
            @update:value="updateDeclarationValue(d.path, arguments[0])"
            @remove="removeDeclaration(d.path)"
            @input-start="onStartStyleInput"
            @input-end="onEndStyleInput"
          />
        </li>
      </ul>
    </li>
  </ul>
</template>

<script lang="ts">
import Vue from 'vue'
import StyleDeclaration from './StyleDeclaration.vue'
import { STRuleForPrint } from '@/parser/style/types'

export default Vue.extend({
  name: 'StyleInformation',

  components: {
    StyleDeclaration
  },

  props: {
    rules: {
      type: Array as () => STRuleForPrint[],
      required: true
    }
  },

  data() {
    return {
      autoFocusOnNextRender: false,
      endingInput: false
    }
  },

  watch: {
    rules(): void {
      this.$nextTick(() => {
        this.autoFocusOnNextRender = false
      })
    }
  },

  created() {
    const vm: any = this
    vm.endingInputTimer = null
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

    onClickRule(rule: STRuleForPrint): void {
      if (this.endingInput) return

      this.$emit('add-declaration', {
        path: rule.path.concat(rule.children.length)
      })
      this.autoFocusOnNextRender = true
    },

    /*
     * While it will add a new rule when clicking empty space,
     * we don't want to do that if it is intended to cancel style editing.
     * To resolve that situation, we limit to add a new declaration
     * when the user is starting editing style value. Then release
     * the limitation after several time passes from finished editing.
     */
    onStartStyleInput(): void {
      const vm: any = this
      clearTimeout(vm.endingInputTimer)

      this.endingInput = true
    },

    onEndStyleInput(): void {
      const delayToEndEdit = 200
      const vm: any = this

      clearTimeout(vm.endingInputTimer)
      vm.endingInputTimer = setTimeout(() => {
        this.endingInput = false
      }, delayToEndEdit)
    }
  }
})
</script>

<style scoped>
.style-information,
.declaration-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.rule:not(:first-child) {
  margin-top: 13px;
  padding-top: 10px;
  border-top: 1px solid var(--vd-border-color);
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
