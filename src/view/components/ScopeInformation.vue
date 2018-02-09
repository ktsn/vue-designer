<template>
  <div class="information">
    <section class="information-group">
      <h2 class="information-title">Props</h2>
      <ul class="information-list">
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
    </section>

    <section class="information-group">
      <h2 class="information-title">Data</h2>
      <ul class="information-list">
        <li v-for="d in data" :key="d.name" class="information-list-item">
          <strong class="information-label">{{ d.name }}</strong>
          <span class="information-text">
            {{ d.default }}
          </span>
        </li>
      </ul>
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

  &-group {
    &:not(:first-child) {
      margin-top: 16px;
    }
  }

  &-title {
    margin-top: 0;
    margin-bottom: 6px;
    font-weight: bold;
    font-size: inherit;
  }

  &-list {
    margin: 0;
    padding: 0;
    list-style: none;

    &-item {
      padding-bottom: 1px;
      border-bottom: 1px solid #333;

      &:not(:first-child) {
        margin-top: 8px;
      }
    }
  }

  &-placeholder {
    color: #999;
  }

  &-text {
    margin-left: 0.5em;
  }
}
</style>
