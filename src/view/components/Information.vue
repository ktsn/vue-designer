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
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Prop } from '../../parser/script'

export default Vue.extend({
  name: 'Information',

  props: {
    props: {
      type: Array as { (): Prop[] },
      required: true
    }
  }
})
</script>

<style lang="scss" scoped>
.information {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 250px;
  background-color: #349c47;

  &-group {
    padding: 13px 15px;
    color: #fff;
  }

  &-title {
    margin-bottom: 12px;
    font-weight: bold;
    font-size: 2rem;
  }

  &-list-item {
    margin-bottom: 8px;
    padding-bottom: 1px;
    border-bottom: 1px solid #fff;
  }

  &-placeholder {
    color: #75d286;
  }

  &-text {
    margin-left: 0.5em;
  }
}
</style>
