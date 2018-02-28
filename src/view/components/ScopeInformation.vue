<template>
  <div class="information">
    <section class="information-group">
      <h2 class="information-title">Props</h2>
      <ul v-if="props.length > 0" class="information-list">
        <li v-for="prop in props" :key="prop.name" class="information-list-item">
          <strong class="information-label">{{ prop.name }}</strong>
          <span class="information-text">
            <span v-if="prop.default === undefined" class="information-placeholder">
              {{ prop.type }}
            </span>
            <span v-else>{{ prop.default }}</span>
          </span>
        </li>
      </ul>
      <div v-else>
        <slot name="not-found-prop" />
      </div>
    </section>

    <section class="information-group">
      <h2 class="information-title">Data</h2>
      <ul v-if="data.length > 0" class="information-list">
        <li v-for="d in data" :key="d.name" class="information-list-item">
          <strong class="information-label">{{ d.name }}</strong>
          <span class="information-text">
            {{ d.default }}
          </span>
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
import { Prop, Data } from '../../parser/script'

export default Vue.extend({
  name: 'Information',

  props: {
    props: {
      type: Array as { (): Prop[] },
      required: true
    },
    data: {
      type: Array as { (): Data[] },
      required: true
    }
  }
})
</script>

<style lang="scss" scoped>
.information {
  overflow-y: auto;
  max-height: 100%;
  padding: 13px 15px;
}

.information-group {
  &:not(:first-child) {
    margin-top: 16px;
  }
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

.information-label::after {
  content: ':';
}

.information-placeholder {
  color: #888;
}

.information-text {
  margin-left: 0.5em;
}
</style>
