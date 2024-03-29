<template>
  <ul class="style-information">
    <li
      v-for="(rule, ruleIndex) in rules"
      :key="rule.path.join('.')"
      class="rule"
      @click="onClickRule(rule, ruleIndex)"
    >
      <p
        class="selector-list"
        @click.stop="onClickSelectorList(rule, ruleIndex)"
      >
        <span v-for="s in rule.selectors" :key="s" class="selector">
          {{ s }}
        </span>
      </p>

      <ul class="declaration-list">
        <li
          v-for="(decl, declIndex) in rule.children"
          :key="decl.path.join('.')"
          class="declaration"
          @click.stop="onClickDeclaration(decl, ruleIndex, declIndex)"
        >
          <StyleDeclaration
            :prop="decl.prop"
            :value="decl.value"
            :auto-focus="shouldFocusFor(ruleIndex, declIndex)"
            @update:prop="updateDeclarationProp(decl.path, $event)"
            @update:value="updateDeclarationValue(decl.path, $event)"
            @remove="removeDeclaration(decl.path)"
            @input-start:prop="onStartStyleInput"
            @input-start:value="onStartStyleInput"
            @input-end:prop="
              onEndStyleInput(ruleIndex, declIndex, 'prop', $event)
            "
            @input-end:value="
              onEndStyleInput(ruleIndex, declIndex, 'value', $event)
            "
          />
        </li>
      </ul>
    </li>
  </ul>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import StyleDeclaration from './StyleDeclaration.vue'
import { STRuleForPrint, STDeclarationForPrint } from '../../parser/style/types'

export default defineComponent({
  name: 'StyleInformation',

  components: {
    StyleDeclaration,
  },

  props: {
    rules: {
      type: Array as () => STRuleForPrint[],
      required: true,
    },
  },

  data() {
    return {
      autoFocusTarget: undefined as
        | { rule: number; declaration: number; type: 'prop' | 'value' }
        | undefined,
      endingInput: false,
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
        prop,
      })
    },

    updateDeclarationValue(path: number[], value: string): void {
      this.$emit('update-declaration', {
        path,
        value,
      })
    },

    addDeclaration(
      rulePath: number[],
      ruleIndex: number,
      declIndex: number,
    ): void {
      this.$emit('add-declaration', {
        path: rulePath.concat(declIndex),
      })

      // Focus on the new declaration prop after it is added
      const unwatch = this.$watch('rules', () => {
        this.autoFocusTarget = {
          rule: ruleIndex,
          declaration: declIndex,
          type: 'prop',
        }
        unwatch()
      })
    },

    removeDeclaration(path: number[]): void {
      this.$emit('remove-declaration', { path })
    },

    onClickRule(rule: STRuleForPrint, index: number): void {
      if (this.endingInput) return

      this.addDeclaration(rule.path, index, rule.children.length)
    },

    onClickSelectorList(rule: STRuleForPrint, index: number): void {
      if (this.endingInput) return

      this.addDeclaration(rule.path, index, 0)
    },

    onClickDeclaration(
      decl: STDeclarationForPrint,
      ruleIndex: number,
      declIndex: number,
    ): void {
      if (this.endingInput) return

      const rulePath = decl.path.slice(0, -1)
      this.addDeclaration(rulePath, ruleIndex, declIndex + 1)
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
      this.autoFocusTarget = undefined
    },

    onEndStyleInput(
      rule: number,
      decl: number,
      type: string,
      meta: { reason: string; shiftKey: boolean },
    ): void {
      // If the user end the input by pressing enter or tab key,
      // focus on the next form.
      // If it is shift+tab, focus on the prev form.
      if (meta.reason === 'tab' && meta.shiftKey) {
        this.focusOnPrevForm(rule, decl, type)
      } else if (meta.reason === 'enter' || meta.reason === 'tab') {
        this.focusOnNextForm(rule, decl, type)
      }

      const delayToEndEdit = 200
      const vm: any = this

      clearTimeout(vm.endingInputTimer)
      vm.endingInputTimer = setTimeout(() => {
        this.endingInput = false
      }, delayToEndEdit)
    },

    focusOnNextForm(rule: number, decl: number, type: string): void {
      if (type === 'prop') {
        this.autoFocusTarget = {
          rule,
          declaration: decl,
          type: 'value',
        }
        return
      }

      if (type === 'value') {
        this.autoFocusTarget = {
          rule,
          declaration: decl + 1,
          type: 'prop',
        }

        // If it is the last item, add a new rule
        const targetRule = this.rules[rule]
        if (decl + 1 === targetRule.children.length) {
          this.$emit('add-declaration', {
            path: targetRule.path.concat(targetRule.children.length),
          })
        }
      }
    },

    focusOnPrevForm(rule: number, decl: number, type: string): void {
      if (type === 'value') {
        this.autoFocusTarget = {
          rule,
          declaration: decl,
          type: 'prop',
        }
        return
      }

      if (type === 'prop') {
        const nextDecl = decl - 1
        if (nextDecl >= 0) {
          this.autoFocusTarget = {
            rule,
            declaration: nextDecl,
            type: 'value',
          }
          return
        }

        // Focus across another rule's declaration is not supported yet
        this.autoFocusTarget = undefined
      }
    },

    shouldFocusFor(rule: number, decl: number): 'prop' | 'value' | undefined {
      const f = this.autoFocusTarget
      return f && f.rule === rule && f.declaration === decl ? f.type : undefined
    },
  },
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
