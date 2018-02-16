<template>
  <div>
    <Renderer v-if="uri" :uri="uri" />
    <div v-if="document" class="information-pane" :class="{ open: openPane }">
      <ScopeInformation :props="document.props" :data="document.data" />

      <button
        class="information-pane-toggle"
        type="button"
        @click="openPane = !openPane"
      >T</button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Renderer from './Renderer.vue'
import ScopeInformation from './ScopeInformation.vue'
import { projectHelpers } from '../store/modules/project'

export default Vue.extend({
  name: 'PageMain',

  components: {
    Renderer,
    ScopeInformation
  },

  data() {
    return {
      openPane: false
    }
  },

  computed: {
    ...projectHelpers.mapState({
      uri: 'currentUri'
    }),

    ...projectHelpers.mapGetters({
      document: 'currentDocument'
    })
  }
})
</script>

<style lang="scss" scoped>
.information-pane {
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

  &-toggle {
    position: absolute;
    right: 100%;
    bottom: 0;
    padding: 0;
    border-width: 0;
    background: none;
    font-size: inherit;
  }
}
</style>
