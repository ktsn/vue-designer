<template>
  <div class="information" :class="{ open: open }">
    <div class="information-body">
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

    <button
      class="information-toggle"
      type="button"
      @click="open = !open"
    >T</button>
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
  },

  data() {
    return {
      open: false
    }
  }
})
</script>

<style lang="scss" scoped>
.information {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 330px;
  background-color: #f5f5f5;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.3);
  transform: translateX(100%);
  transition: transform 400ms cubic-bezier(0.19, 1, 0.22, 1);

  &.open {
    transform: translateX(0);
  }

  &-body {
    overflow-y: auto;
    max-height: 100%;
    padding: 13px 15px;
  }

  &-group {
    &:not(:first-child) {
      margin-top: 16px;
    }
  }

  &-title {
    margin-bottom: 6px;
    font-weight: bold;
  }

  &-list-item {
    padding-bottom: 1px;
    border-bottom: 1px solid #333;

    &:not(:first-child) {
      margin-top: 8px;
    }
  }

  &-placeholder {
    color: #999;
  }

  &-text {
    margin-left: 0.5em;
  }

  &-toggle {
    position: absolute;
    right: 100%;
    bottom: 0;
    border-width: 0;
    background: none;
  }
}
</style>
