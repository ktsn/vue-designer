<template>
  <div class="information">
    <section class="information-group">
      <h2 class="information-title">Props</h2>
      <ul 
        v-if="hasProps" 
        class="information-list">
        <li 
          v-for="(prop, name) in scope.props" 
          :key="name" 
          class="information-list-item">
          <InputJson
            :field="{ name, value: prop.value }"
            @change="updateProp"
          />
        </li>
      </ul>
      <div v-else>
        <slot name="not-found-prop" />
      </div>
    </section>

    <section class="information-group">
      <h2 class="information-title">Data</h2>
      <ul 
        v-if="hasData" 
        class="information-list">
        <li 
          v-for="(d, name) in scope.data" 
          :key="name" 
          class="information-list-item">
          <InputJson
            :field="{ name, value: d.value }"
            @change="updateData"
          />
        </li>
      </ul>
      <div v-else>
        <slot name="not-found-data" />
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import InputJson from './InputJson.vue'
import { DocumentScope } from '@/view/store/modules/project/types'

export default Vue.extend({
  name: 'ScopeInformation',

  components: {
    InputJson
  },

  props: {
    scope: {
      type: Object as () => DocumentScope,
      required: true
    }
  },

  computed: {
    hasProps(): boolean {
      return Object.keys(this.scope.props).length > 0
    },

    hasData(): boolean {
      return Object.keys(this.scope.data).length > 0
    }
  },

  methods: {
    updateProp({ name, value }: { name: string; value: any }): void {
      this.$emit('update-prop', {
        name,
        value
      })
    },

    updateData({ name, value }: { name: string; value: any }): void {
      this.$emit('update-data', {
        name,
        value
      })
    }
  }
})
</script>

<style scoped>
.information {
  overflow-y: auto;
  max-height: 100%;
  padding: 13px 15px;
}

.information-group:not(:first-child) {
  margin-top: 16px;
}

.information-title {
  margin-top: 0;
  margin-bottom: 6px;
  font-weight: bold;
  font-size: inherit;
}

.information-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.information-list-item {
  margin-top: 8px;
}

.information-list-item:first-child {
  margin-top: 0;
}
</style>
